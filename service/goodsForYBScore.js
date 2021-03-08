const GoodsForYBScore = require('../dao').GoodsForYBScore;
const Member = require('../dao').Member;
const BankMemberScore = require('../dao').BankMemberScore;
const Wallet = require('../dao').Wallet;
const MemberScore = require('../dao').MemberScore;
const deal = require('./deal');
const crypto = require('crypto');
const ExchangeRecord = require('../dao').ExchangeRecord;
const sequelize = require('../dao').sequelize;

const encryTicket = {
    secret: 'langjie@network',
    _valid: function(signature) {
        try {
            const deId = Buffer.from(signature.split('.')[0], "base64").toString("utf8");
            const secret = this.secret;
            let hash = crypto.createHmac('sha256', secret);
            hash.update(deId);
            const newSignature = hash.digest('base64');
            const goodsId = Number(deId.slice(0, 3));
            const needScore = Number(deId.slice(3, 8));
            if (newSignature === signature.split('.')[1]) {
                return {
                    code: 200,
                    data: {
                        no: signature.split('.')[0],
                        goodsId,
                        needScore,
                    }
                };
            }
        } catch (e) {
            
        }
        return { code: -1 };
    },
    create: function(id) {
        const str = Buffer.from(id, "utf8").toString("base64");
        const secret = this.secret;
        const hash = crypto.createHmac('sha256', secret);
        hash.update(id.toString());
        let signature = hash.digest('base64');
        signature = str + '.' + signature;
        return signature;
    },
    consume: async function(signature, unionid, type) {
        const validRes = this._valid(signature);
        if (validRes.code === -1) {
            return { code: -1, msg: '非法兑换码' };
        }
        const { no, goodsId, needScore } = validRes.data;
        const exist = await ExchangeRecord.findOne({ where: { no } });
        if (exist) {
            return { code: -1, msg: '该兑换码已被使用' };
        }
        const goodsForYBScore = await GoodsForYBScore.findOne({ where: { id: goodsId } });
        const { goodsName } = goodsForYBScore.dataValues;
        await ExchangeRecord.create({ no, goodsId, needScore, goodsName, consumeTime: TIME(), unionid, type });
        return { code: 200, msg: '兑换成功', data: { goodsId, goodsName } };
    },
};
exports.encryTicket = encryTicket;


// 获取兑换码
const applyExchange = async params => {
    const { unionid, goodsId } = params;
    const memberEntity = await Member.findOne({ where: { unionid } });
    if (!memberEntity) {
        return { code: -1, msg: '不存在该会员' };
    }
    const { user_id, open_id, checked } = memberEntity.dataValues;
    const { id: own_id } = await Wallet.findOne({ where: { user_id } });
    const bankMemberScoreEntity = await BankMemberScore.findAll({ where: { own_id } });
    let totalScore = 0;
    bankMemberScoreEntity.forEach(items => totalScore += Number(items.dataValues.score));
    const goodsEntity = await GoodsForYBScore.findOne({ where: { id: goodsId } });
    const { needScore, levelLimit, goodsName, scoreLimit, isVer, isOpen } = goodsEntity.dataValues;
    const { total } = await MemberScore.findOne({ where: { openid: open_id } });
    // 限制一天兑换一次
    const hasExchange = await BankMemberScore.findOne({
        where: {
            event_code: 0, 
            own_id, 
            create_time: sequelize.literal('date_format(create_time,"%Y-%m-%d")="'+DATETIME()+'"'),
        },
    });
    if (isOpen != 2 && hasExchange) {
        return { code: -1, msg: '当天只能兑换一次' };
    }
    if (isVer && !checked) {
        return { code: -1, msg: '请先商务认证，暂时无法兑换' };
    }
    if (Number(total) < Number(levelLimit)) {
        return { code: -1, msg: '等级分不够，无法兑换' };
    }
    if (Number(totalScore) < Number(scoreLimit)) {
        return { code: -1, msg: '元宝分资产不够，无法兑换' };
    }
    if (Number(totalScore) < Number(needScore)) {
        return { code: -1, msg: '元宝分不够，无法兑换' };
    }
    // 减库存，开启事务
    const t = await sequelize.transaction();
    try {
        const tGoodsEntity = await sequelize.query('SELECT inventory FROM goods_for_yb_score WHERE id = ' + goodsId + ' FOR UPDATE');
        let inventory = tGoodsEntity[0][0].inventory;
        if (inventory <= 0) {
            throw new Error('库存不足');
        }
        inventory--;
        await GoodsForYBScore.update({ inventory }, { where: { id: goodsId } });
        // 消费元宝分
        const r = await deal.MemberScore.consume({ user_id, score: needScore, consumeRem: goodsName });
        if (r.code == -1) {
            throw new Error(r.msg);
        }
        t.commit();
    } catch (e) {
        t.rollback();
        return { code: -1, msg: e.message };
    }
    // 生成经过加密的兑换码
    return { code: 200, msg: '兑换成功', data: { no: encryTicket.create(String(goodsId).padStart(3, '0') + String(needScore).padStart(5, '0') + String(user_id) + String(Date.now()) + String(parseInt(Math.random() * 1000))) } };
}
exports.applyExchange = applyExchange;


// 兑换
const consumeExchange = async params => {
    const { no, unionid, type } = params;
    return await encryTicket.consume(no, unionid, type);
}
exports.consumeExchange = consumeExchange;


/***************************************** 后台 ****************************************/

// 后台礼品列表（包含兑换记录）
exports.getList = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.num ? Number(params.num) : 30;
    const keywords = params.keywords || '';
    let order = params.order || 'id';
    if (order == 'id') {
        order = [order];
    } else {
        order = [order, 'DESC'];
    }
    const filter = params.filter ? (typeof params.filter === 'string' ? JSON.parse(params.filter) : params.filter) : {};
    const where = { goodsName: { $like: '%'+keywords+'%' } };
    if (filter.isOpen) {
        let isOpenTextArr;
        const isOpenArr = [];
        try {
            isOpenTextArr = filter.isOpen.split(',').filter(items => items);
        } catch (e) {
            isOpenTextArr = [];
        }
        if (isOpenTextArr.length !== 0) {
            isOpenTextArr.forEach(items => {
                if (items === '不开放') {
                    isOpenArr.push(0);
                } else if (items === '微信公众号') {
                    isOpenArr.push(1);
                } else if (items === '竞猜小程序') {
                    isOpenArr.push(2);
                }
            });
            where.isOpen = { $in: isOpenArr };
        }
    }
    const result = await GoodsForYBScore.findAndCountAll({
        include: {
            association: GoodsForYBScore.hasMany(ExchangeRecord, { sourceKey: 'id', foreignKey: 'goodsId' }),
        },
        distinct: true,
        where,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: [order, [{model: ExchangeRecord}, 'id', 'DESC']],
    });
    const memberList = await Member.findAll();
    const memberMapper = {};
    memberList.forEach(items => memberMapper[items.dataValues.unionid] = { name: items.dataValues.name, nick_name: items.dataValues.nick_name });
    result.rows.forEach((items, index) => {
        const { ExchangeRecords } = items.dataValues;
        ExchangeRecords.forEach((it, ind) => {
            const { unionid, consumeTime } = it.dataValues;
            result.rows[index].dataValues.ExchangeRecords[ind].dataValues.applyName = memberMapper[unionid].name;
            result.rows[index].dataValues.ExchangeRecords[ind].dataValues.applyNickName = memberMapper[unionid].nick_name;
            result.rows[index].dataValues.ExchangeRecords[ind].dataValues.consumeTime = TIME(consumeTime);
        });
        result.rows[index].dataValues.exchangeCount = ExchangeRecords.length;
    });
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

// 新增礼品
exports.create = async params => {
    const { goodsName, needScore, isOpen, inventory } = params;
    // const isExist = await GoodsForYBScore.findOne({ where: { goodsName } });
    // if (isExist) {
    //     return { code: -1, msg: '已存在' };
    // }
    await GoodsForYBScore.create({ goodsName, needScore, isOpen, inventory });
    return { code: 200, msg: '新增成功' };
}

// 更新礼品属性
exports.update = async params => {
    const { goodsName, needScore, originalScore, isOpen, inventory, levelLimit, scoreLimit, isVer, description, album, id } = params;
    // const isExist = await GoodsForYBScore.findOne({ where: { goodsName, id: { $ne: id } } });
    // if (isExist) {
    //     return { code: -1, msg: '该名称已存在' };
    // }
    await GoodsForYBScore.update({ goodsName, needScore, originalScore, isOpen, inventory, levelLimit, scoreLimit, isVer, description, album }, { where: { id } });
    return { code: 200, msg: '更新成功' };
}

// 删除
exports.del = async params => {
    const { id } = params;
    const isExist = await GoodsForYBScore.findOne({ where: { id } });
    if (!isExist) {
        return { code: -1, msg: '不存在' };
    }
    await GoodsForYBScore.destroy({
        force: true,
        where: { id },
    });
    return { code: 200, msg: '删除成功' };
}