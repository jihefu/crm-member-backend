const redisUtil = require('./redis');
const { redisClient } = redisUtil;
const Seckill = require('../dao').Seckill;
const { sendMQ, receiveMQ } = require('./rabbitmq');
const serviceHomeMember = require('./homeMember');
const Member = require('../dao').Member;
const GoodsForYBScore = require('../dao').GoodsForYBScore;
const moment = require('moment');
const sequelize = require('../dao').sequelize;

this.redisKeyCreator = (order_id, goods_id) => {
    return `gift:seckill:${order_id}:${goods_id}:`;
}

const SECKILLQUEUE = 'seckillQueue';
const expire = 60 * 60 * 24 * 7;

receiveMQ.receiveQueueMsg(SECKILLQUEUE, async (msg, channel) => {
    const content = JSON.parse(msg.content.toString());
    const doResult = await this.doSeckill(content);
    if (doResult) {
        channel.ack(msg);
    } else {
        channel.nack(msg, false, true);
    }
}, 1);

// 处理秒杀主动关闭，兜底
receiveMQ.receiveDelayMsg('isEndExchange', 'isEndQueue', 1).then(async result => {
    const { order_id, goods_id } = result;
    await this.updateSeckillOrder({ formData: { order_id, goods_id, is_end: 1 } });
});

// 每分钟被调用一次
this.checkSeckillEnd = async () => {
    const schemaOrderTime = moment(TIME()).format('YYYY-MM-DD HH:mm');
    const list = await Seckill.findAll({
        where: {
            start_time: sequelize.literal('date_format(start_time,"%Y-%m-%d %H:%i")="'+schemaOrderTime+'"'),
            is_end: 0,
            isdel: 0,
        },
    });
    list.forEach(items => {
        const { id: order_id, goods_id, survive_time } = items.dataValues;
        sendMQ.sendDelayMsg('surviveExchange', 'surviveQueue', 'isEndExchange', JSON.stringify({ order_id, goods_id }), 1000 * survive_time);
    });
}

/**
 * 缓存处理
 */
this.doCache = async params => {
    const { preStr, inventory, start_time, survive_time, is_end, score } = params;

    // 库存
    if (params.hasOwnProperty('inventory')) {
        redisClient.set(`${preStr}inventory`, inventory, () => {});
        redisClient.expire(`${preStr}inventory`, expire, () => {});
    }

    // 秒杀价
    if (params.hasOwnProperty('score')) {
        redisClient.set(`${preStr}score`, score, () => {});
        redisClient.expire(`${preStr}score`, expire, () => {});
    }

    // 开始时间
    if (params.hasOwnProperty('start_time')) {
        redisClient.set(`${preStr}start_time`, TIME(start_time), () => {});
        redisClient.expire(`${preStr}start_time`, expire, () => {});
    }

    // 持续时间
    if (params.hasOwnProperty('survive_time')) {
        redisClient.set(`${preStr}survive_time`, survive_time, () => {});
        redisClient.expire(`${preStr}survive_time`, expire, () => {});
    }

    // 结束标志
    if (params.hasOwnProperty('is_end')) {
        redisClient.set(`${preStr}is_end`, is_end, () => {});
        redisClient.expire(`${preStr}is_end`, expire, () => {});
    }
}

this.clearCache = async params => {
    const { preStr } = params;
    redisClient.del(`${preStr}inventory`, () => {});
    redisClient.del(`${preStr}start_time`, () => {});
    redisClient.del(`${preStr}survive_time`, () => {});
    redisClient.del(`${preStr}is_end`, () => {});
    redisClient.del(`${preStr}score`, () => {});
}

/**
 * 创建秒杀
 */
this.createSeckillOrder = async params => {
    const { goods_id, plan_inventory, start_time, survive_time, score, admin_id } = params;
    const isExist = await Seckill.findOne({ where: { isdel: 0, goods_id, start_time } });
    if (isExist) {
        return { code: -1, msg: '已存在' };
    }
    const insertEntity = await Seckill.create({
        goods_id,
        plan_inventory,
        inventory: plan_inventory,
        score,
        start_time,
        survive_time,
        update_person: admin_id,
        create_person: admin_id,
        update_time: TIME(),
        create_time: TIME(),
    });
    const order_id = insertEntity.dataValues.id;
    const preStr = this.redisKeyCreator(order_id, goods_id);

    this.doCache({ preStr, inventory: plan_inventory, start_time, survive_time, is_end: 0, score });

    return { code: 200, msg: '创建成功' };
}

/**
 * 删除秒杀记录
 */
this.delSeckillOrder = async params => {
    const { admin_id, order_id, goods_id } = params;
    // 检查当前是否允许修改
    const result = await this.checkStatus({ order_id, goods_id });
    if (result.code === 200 && result.data === 0) {
        await Seckill.update({ isdel: 1, update_person: admin_id, update_time: TIME() }, { where: { id: order_id } });
        // 缓存处理
        const preStr = this.redisKeyCreator(order_id, goods_id);
        this.clearCache({ preStr });
        return { code: 200, msg: '删除成功' };
    }
    return { code: -1, msg: '当前状态不允许删除' };
}

/**
 * 修改秒杀信息
 * 开始时间，计划数量，存活时间，秒杀价
 * 系统执行is_end
 */
this.updateSeckillOrder = async params => {
    const { formData, admin_id } = params;
    if (admin_id) {
        // 检查当前是否允许修改
        const result = await this.checkStatus({ order_id: formData.order_id, goods_id: formData.goods_id });
        if (result.code === 200 && result.data === 0) {
            if (formData.hasOwnProperty('plan_inventory')) {
                formData.inventory = formData.plan_inventory;
            }
            formData.update_person = admin_id;
            formData.update_time = TIME();
        } else {
            return { code: -1, msg: '当前状态不允许修改' };
        }
    }
    await Seckill.update(formData, { where: { id: formData.order_id } });
    // 缓存处理
    const preStr = this.redisKeyCreator(formData.order_id, formData.goods_id);
    this.doCache({ preStr, ...formData });
    return { code: 200, msg: '更新成功' };
}

/**
 * 获取秒杀列表
 */
this.listSeckill = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.num ? Number(params.num) : 30;
    const result = await Seckill.findAndCountAll({
        where: { isdel: 0 },
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: [['id', 'DESC']],
    });
    let totalUserIdArr = [];
    for (let i = 0; i < result.rows.length; i++) {
        const { winner } = result.rows[i];
        let winnerArr;
        try {
            winnerArr = winner.split(',').filter(items => items);
        } catch (e) {
            winnerArr = [];
        }
        totalUserIdArr = [...totalUserIdArr, ...winnerArr];
    }
    totalUserIdArr = [...new Set(totalUserIdArr)];
    const memberList = await Member.findAll({ attributes: ['name', 'user_id'], where: { user_id: { $in: totalUserIdArr } } });
    const memberMapper = {};
    for (let i = 0; i < memberList.length; i++) {
        const { name, user_id } = memberList[i].dataValues;
        memberMapper[user_id] = name;
    }
    for (let i = 0; i < result.rows.length; i++) {
        const { winner, goods_id } = result.rows[i];
        const { goodsName } = await GoodsForYBScore.findOne({ where: { id: goods_id } });
        result.rows[i].dataValues.goods_name = goodsName;
        let winnerArr;
        try {
            winnerArr = winner.split(',').filter(items => items);
        } catch (e) {
            winnerArr = [];
        }
        for (let j = 0; j < winnerArr.length; j++) {
            winnerArr[j] = memberMapper[winnerArr[j]];
        }
        result.rows[i].dataValues.winnerName = winnerArr;
    }
    return {
        code: 200,
        msg: '',
        data: {
            data: result.rows,
            total: result.count,
            id_arr: [],
        },
    };
}

/************************************* 用户区 ***************************************/

/**
 * 用户点击秒杀
 */
this.userRequestSeckill = async params => {
    const { order_id, goods_id, unionid } = params;
    const result = await this.checkStatus({ order_id, goods_id });
    if (result.code === -1) {
        return result;
    }
    if (result.data == 1) {
        // 投递消息到mq
        sendMQ.sendQueueMsg(SECKILLQUEUE, JSON.stringify({ order_id, goods_id, unionid }), result => {});
        return { code: 200, msg: '处理中，请等待结果' };
    } else {
        return { code: -1, msg: result.msg };
    }
}

/**
 * 后台处理秒杀成功的逻辑
 */
this.doSeckill = async params => {
    const { order_id, goods_id, unionid } = params;
    // 先判断秒杀是否已经结束
    const result = await this.checkStatus({ order_id, goods_id });
    if (result.code === 200 && result.data !== 1) {
        // 当前秒杀已结束
        return true;
    }
    // 加锁
    const lockKey = `lock:gift:seckill:${order_id}:${goods_id}`;
    try {
        const lock = await redisUtil.lock(lockKey);
        if (lock) {
            const preStr = this.redisKeyCreator(order_id, goods_id);
            // 获取库存
            const inventory = await new Promise(resolve => {
                redisClient.get(`${preStr}inventory`, (err, result) => {
                    resolve(Number(result));
                });
            });
            if (inventory > 0) {
                const isExist = await this.checkWinner({ order_id, goods_id, unionid });
                if (isExist == 1) {
                    return true;
                }
                // 获取秒杀价
                const score = await new Promise(async resolve => {
                    redisClient.get(`${preStr}score`, (err, result) => {
                        resolve(result);
                    });
                });
                // 走兑换礼品业务
                const doResult = await serviceHomeMember.giving({ goodsId: goods_id, unionid, score, notSendToBackend: true, type: '秒杀' });
                if (doResult.code !== 200) {
                    // 兑换流程失败
                    return true;
                }
                // 库存--
                await new Promise(async resolve => {
                    const record = await Seckill.findOne({ where: { id: order_id } });
                    await record.decrement('inventory');
                    redisClient.decr(`${preStr}inventory`, (err, result) => {
                        resolve(result);
                    });
                });
                // 将当前用户加入到winners
                await new Promise(async resolve => {
                    const { user_id } = await Member.findOne({ where: { unionid } });
                    const { winner } = await Seckill.findOne({ where: { id: order_id } });
                    let winnerArr;
                    try {
                        winnerArr = winner.split(',').filter(items => items);
                    } catch (e) {
                        winnerArr = [];
                    }
                    winnerArr.push(user_id);
                    await Seckill.update({ winner: winnerArr.join() }, { where: { id: order_id } });
                    redisClient.sadd(`${preStr}winners`, unionid, () => {
                        redisClient.expire(`${preStr}winners`, expire, () => resolve());
                    });
                });
                // 如果这是最后一个库存，则标记已完成
                if (inventory == 1) {
                    await this.updateSeckillOrder({
                        formData: { order_id, goods_id, is_end: 1 },
                    });
                }
            }
            return true;
        }
    } catch (e) {
        return true;
    } finally {
        redisUtil.unlock(lockKey);
    }
    
    return false;
}

/**
 * 当前是否允许秒杀
 */
this.checkStatus = async params => {
    const { order_id, goods_id } = params;
    const preStr = this.redisKeyCreator(order_id, goods_id);
    const start_time = await new Promise(resolve => {
        redisClient.get(`${preStr}start_time`, (err, result) => resolve(result));
    });
    if (!start_time) {
        return { code: -1, msg: '不存在该活动' };
    }
    const is_end = await new Promise(resolve => {
        redisClient.get(`${preStr}is_end`, (err, result) => resolve(result));
    });
    if (Date.parse(start_time) > Date.now()) {
        return { code: 200, msg: '活动未开始', data: 0 };
    }
    if (is_end == 0) {
        return { code: 200, msg: '活动进行中', data: 1 };
    }
    return { code: 200, msg: '活动已结束', data: 2 };
}

/**
 * 当前用户是否秒杀成功
 * 前端秒杀点击后，轮询用
 * 需要配合是否允许秒杀接口
 */
this.checkSuccess = async params => {
    const { order_id, goods_id, unionid } = params;
    const result = await this.checkStatus({ order_id, goods_id });
    if (result.code !== 200) {
        return result;
    }
    if (result.data === 2) {
        const isWinner = await this.checkWinner({ order_id, goods_id, unionid });
        if (isWinner == 1) {
            return { code: 200, msg: '秒杀成功', data: isWinner };
        } else {
            return { code: 200, msg: '秒杀失败', data: isWinner };
        }
    } else if (result.data === 1) {
        // 查询当前用户是否抢购成功
        const isWinner = await this.checkWinner({ order_id, goods_id, unionid });
        if (isWinner == 1) {
            return { code: 200, msg: '秒杀成功', data: isWinner };
        } else {
            return { code: -1, msg: '处理中' };
        }
    }
    return { code: 200, msg: result.msg };
}

this.checkWinner = async params => {
    const { order_id, goods_id, unionid } = params;
    const preStr = this.redisKeyCreator(order_id, goods_id);
    const isWinner = await new Promise(resolve => {
        redisClient.sismember(`${preStr}winners`, unionid, (err, result) => resolve(result));
    });
    return isWinner;
}