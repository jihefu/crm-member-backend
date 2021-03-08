const BaseEvent = require('../dao').BaseEvent;
const Member = require('../dao').Member;
const ItemScore = require('../dao').ItemScore;
const BaseCalculScore = require('./base').CalculScore;
const Payment = require('../dao').Payment;
const bluebird = require('bluebird'); 
const MemberScore = require('../dao').MemberScore;
const BankMemberScore = require('../dao').BankMemberScore;
const Wallet = require('../dao').Wallet;
const common = require('./common');
const sequelize = require('../dao').sequelize;
let deal, sendMQ, homeMemberService;

const jobRate = async job => {
    const itemScore = await ItemScore.findOne();
    const jobMapper = {
        '法人': itemScore.dataValues.legal_person,
        '合伙人': itemScore.dataValues.legal_person,
        '注册人': itemScore.dataValues.reg_person,
        '开发': itemScore.dataValues.developer,
        '采购': itemScore.dataValues.purchaser,
        '财务': itemScore.dataValues.finance,
        '其它': itemScore.dataValues.other,
    };
    let jobArr;
    try {
        jobArr = job.split(',').filter(items => items);
    } catch (e) {
        jobArr = [];
    }
    if (jobArr.length === 0) {
        jobArr.push({ text: '其它', value: itemScore.dataValues.other });
    }
    jobArr.forEach((items,index) => {
        const value = jobMapper[items] ? jobMapper[items] : jobMapper['其它'];
        const obj = {
            text: items,
            value,
        };
        jobArr[index] = obj;
    });
    jobArr = jobArr.sort((a, b) => {
        return b.value - a.value;
    });
    return jobArr[0].value;
}

const SCORE_MAX = {
    sign: 8000,             // 原3000
    payment: 80000,         // 原10000
    read: 3000,             // 原1000
    share: 2000,
    exam: 2000,
    takeGoods: 80000,       // 原2000
    serviceFeedback: 20000, // 原1000
    introduced: 2000,
    sendOnlineMsg: 1000,
    miniProgramSignUp: 2000,
};

const scoreItem = {
    firstSign: 30,
    sign: 10,
    payment: 50,   // 50元1分
    read: 20,
    share: 50,
    takeGoods: 100,
    serviceFeedback: 200,
    introduced: 1000,
    firstSendOnlineMsg: 30,
    sendOnlineMsg: 1,
    login: 10,
    newMember: 200,
    businessCert: 500,
};

async function checkIsOver(open_id, type, currentScore, maxScore) {
    const memberEntity = await Member.findOne({ where: { open_id } });
    const { user_id } = memberEntity.dataValues;
    const walletEntity = await Wallet.findOne({ where: { user_id } });
    const { id: own_id } = walletEntity.dataValues;
    const targetTime = TIME(Date.now() - 60 * 60 * 1000 * 24 * 365);
    const scoreList = await BankMemberScore.findAll({
        where: {
            create_time: { $gt: targetTime },
            own_id,
            rem: type,
            score: { $gt: 0 },
        }
    });
    let totalScore = 0;
    scoreList.forEach(items => {
        totalScore += Number(items.dataValues.score);
    });
    if (totalScore + currentScore > maxScore) {
        return true;
    }
    return false;
}

const memberEventMapper = {
    // 签到
    sign: async (params, msg, channel) => {
        const { open_id } = params;
        const type = '签到';
        const event_code = 1301;
        // 判断是否是第一次签到
        const signCount = await BaseEvent.count({ where: { type: '1301', ownerId: open_id, isdel: 0 } });
        const signScore = signCount > 1 ? scoreItem.sign : scoreItem.firstSign;
        // 判断是否超上限
        if (!await checkIsOver(open_id, type, signScore, SCORE_MAX.sign)) {
            sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({
                open_id,
                score: signScore,
                type,
                event_code,
            }), result => console.log(result));
        }
        channel.ack(msg);
    },

    // 支付
    payment: async (params, msg, channel) => {
        const { open_id, amount } = params;
        const type = '到账';
        const event_code = 1302;
        const result = await Member.findOne({ where: { open_id }});
        if (!result) {
            channel.ack(msg);
            return;
        }
        let payScore;
        const { job, checked } = result.dataValues;
        if (checked == 0) {
            payScore = 0;
        } else {
            payScore = parseInt(amount / scoreItem.payment) * await jobRate(job);
        }
        if (payScore !== 0) {
            if (!await checkIsOver(open_id, type, payScore, SCORE_MAX.payment)) {
                sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score: payScore, type, event_code }), result => console.log(result));
            }
        }
        channel.ack(msg);
    },

    // 支付撤销
    paymentCancel: async (params, msg, channel) => {
        const { open_id, amount } = params;
        const type = '撤销到账';
        const result = await Member.findOne({ where: { open_id }});
        let payScore;
        const { job, checked, user_id } = result.dataValues;
        if (checked == 0) {
            payScore = 0;
        } else {
            payScore = parseInt(amount / scoreItem.payment) * await jobRate(job);
        }
        if (payScore !== 0) {
            if (!deal) {
                deal = require('./deal');
            }
            await deal.MemberScore.consume({ user_id, score: payScore, consumeRem: type });
        }
        channel.ack(msg);
    },

    // 确认收货
    takeGoods: async (params, msg, channel) => {
        const { open_id } = params;
        const type = '确认收货';
        const event_code = 1306;
        if (!await checkIsOver(open_id, type, scoreItem.takeGoods, SCORE_MAX.takeGoods)) {
            sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score: scoreItem.takeGoods, type, event_code }), result => console.log(result));
        }
        channel.ack(msg);
    },

    // 上门服务反馈
    serviceFeedback: async (params, msg, channel) => {
        const { open_id } = params;
        const type = '上门服务反馈';
        const event_code = 1307;
        if (!await checkIsOver(open_id, type, scoreItem.serviceFeedback, SCORE_MAX.serviceFeedback)) {
            sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score: scoreItem.serviceFeedback, type, event_code }), result => console.log(result));
        }
        channel.ack(msg);
    },

    // 介绍分
    introduced: async (params, msg, channel) => {
        const { open_id } = params;
        const type = '介绍分';
        const event_code = 1308;
        if (!await checkIsOver(open_id, type, scoreItem.introduced, SCORE_MAX.introduced)) {
            sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score: scoreItem.introduced, type, event_code }), result => console.log(result));
        }
        channel.ack(msg);
    },

    // 新会员入会奖励
    newMember: async (params, msg, channel) => {
        const { open_id } = params;
        const type = '新会员入会奖励';
        const event_code = 1315;
        await new Promise(resolve => {
            common.createEvent({
                headParams: {
                    ownerId: open_id,
                    type: '1315',
                    time: TIME(),
                },
                bodyParams: {},
            }, () => resolve());
        });
        // 是否是第一次
        const count = await BaseEvent.count({ where: { type: '1315', ownerId: open_id, isdel: 0 } });
        if (count < 2) {
            const score = scoreItem.newMember;
            sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score, type, event_code }), result => console.log(result));
        }
        channel.ack(msg);
    },

    // 新会员通过商务认证
    businessCert: async (params, msg, channel) => {
        const { open_id } = params;
        const type = '新会员商务认证';
        const event_code = 1309;
        await new Promise(resolve => {
            common.createEvent({
                headParams: {
                    ownerId: open_id,
                    type: '1309',
                    time: TIME(),
                },
                bodyParams: {},
            }, () => resolve());
        });
        // 是否是第一次
        const count = await BaseEvent.count({ where: { type: '1309', ownerId: open_id, isdel: 0 } });
        if (count < 2) {
            const score = scoreItem.businessCert;
            sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score, type, event_code }), result => console.log(result));
        }
        channel.ack(msg);
    },

    // 线上发消息
    sendOnlineMsg: async (params, msg, channel) => {
        const { open_id } = params;
        const type = '线上消息';
        const event_code = 1310;
        // 判断是否已经是会员了
        const isMember = await Member.findOne({ where: { open_id } });
        if (!isMember) {
            channel.ack(msg);
            return;
        }
        // 判断是否是第一次发消息
        const sendCount = await BaseEvent.count({ where: { type: '1310', ownerId: open_id, isdel: 0 } });
        const sendScore = sendCount > 1 ? scoreItem.sendOnlineMsg : scoreItem.firstSendOnlineMsg;
        if (!await checkIsOver(open_id, type, sendScore, SCORE_MAX.sendOnlineMsg)) {
            sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score: sendScore, type, event_code }), result => console.log(result));
        }
        channel.ack(msg);
    },

    // 云登录
    login: async (params, msg, channel) => {
        const { unionid, appName } = params;
        let type = '云登录';
        if (appName) {
            type = type + '（'+appName+'）';
        }
        const event_code = 1312;
        const score = scoreItem.login;
        const memberEntity = await Member.findOne({ where: { unionid } });
        if (memberEntity) {
            const { open_id } = memberEntity.dataValues;
            // 判断今天该app是否登陆过
            const schemaOrderDate = DATETIME();
            const isExist = await BaseEvent.findOne({
                where: {
                    type: '1312',
                    ownerId: open_id,
                    time: sequelize.literal('date_format(time, "%Y-%m-%d")="'+schemaOrderDate+'"'),
                    rem: appName,
                },
            });
            if (!isExist) {
                await new Promise(resolve => {
                    common.createEvent({
                        headParams: {
                            ownerId: open_id,
                            type: '1312',
                            time: TIME(),
                            rem: appName,
                        },
                        bodyParams: {},
                    }, () => resolve());
                });
                sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score: Number(score), type, event_code }), result => console.log(result));
            }
        }
        channel.ack(msg);
    },

    // 辅助函数
    _checkAndCreateEvent: async params => {
        const { open_id, articleId, type } = params;
        const isExist = await BaseEvent.findOne({ where: { type, ownerId: open_id, rem: articleId } });
        if (isExist) {
            return true;
        }
        await new Promise(resolve => {
            common.createEvent({
                headParams: {
                    ownerId: open_id,
                    type,
                    time: TIME(),
                    rem: articleId,
                },
                bodyParams: {},
            }, () => resolve());
        });
        return false;
    },

    // 阅读
    read: async (params, msg, channel) => {
        const { unionid, articleId } = params;
        const type = '阅读';
        const event_code = 1303;
        const memberEntity = await Member.findOne({ where: { unionid } });
        if (memberEntity) {
            const { open_id } = memberEntity.dataValues;
            // 判断是否已经读过了
            const isExist = await memberEventMapper._checkAndCreateEvent({ open_id, articleId, type: '1303' });
            if (!isExist) {
                if (!await checkIsOver(open_id, type, scoreItem.read, SCORE_MAX.read)) {
                    sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({
                        open_id,
                        score: scoreItem.read,
                        type,
                        event_code,
                    }), result => console.log(result));
                }
            }
        }
        channel.ack(msg);
    },

    // 分享
    share: async (params, msg, channel) => {
        const { unionid, articleId } = params;
        const type = '分享';
        const event_code = 1304;
        const memberEntity = await Member.findOne({ where: { unionid } });
        if (memberEntity) {
            const { open_id } = memberEntity.dataValues;
            // 判断是否已经分享了
            const isExist = await memberEventMapper._checkAndCreateEvent({ open_id, articleId, type: '1304' });
            if (!isExist) {
                if (!await checkIsOver(open_id, type, scoreItem.share, SCORE_MAX.share)) {
                    sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({
                        open_id,
                        score: scoreItem.share,
                        type,
                        event_code,
                    }), result => console.log(result));
                }
            }
        }
        channel.ack(msg);
    },

    // 问卷
    exam: async (params, msg, channel) => {
        const { unionid, score, articleId } = params;
        const type = '问答';
        const event_code = 1305;
        const memberEntity = await Member.findOne({ where: { unionid } });
        if (memberEntity) {
            const { open_id } = memberEntity.dataValues;
            // 判断是否已经回答过了
            const isExist = await memberEventMapper._checkAndCreateEvent({ open_id, articleId, type: '1305' });
            if (!isExist) {
                if (!await checkIsOver(open_id, type, Number(score), SCORE_MAX.exam)) {
                    sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({
                        open_id,
                        score,
                        type,
                        event_code,
                    }), result => console.log(result));
                }
            }
        }
        channel.ack(msg);
    },

    // 竞猜
    guess: async (params, msg, channel) => {
        const { unionid, score, articleId } = params;
        const type = '竞猜';
        const event_code = 1313;
        const memberEntity = await Member.findOne({ where: { unionid } });
        if (memberEntity) {
            const { open_id } = memberEntity.dataValues;
            // 判断是否已经竞猜过了
            const isExist = await memberEventMapper._checkAndCreateEvent({ open_id, articleId, type: '1313' });
            if (!isExist) {
                sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({
                    open_id,
                    score,
                    type,
                    event_code,
                }), result => console.log(result));
            }
        }
        channel.ack(msg);
    },

    // 小程序报名
    miniProgramSignUp: async (params, msg, channel) => {
        const { unionid, score, activityId } = params;
        const type = '小程序报名';
        const event_code = 1311;
        const memberEntity = await Member.findOne({ where: { unionid } });
        if (memberEntity) {
            const { open_id } = memberEntity.dataValues;
            // 判断是否已经报名过了
            const isExist = await memberEventMapper._checkAndCreateEvent({ open_id, articleId: activityId, type: '1311' });
            if (!isExist) {
                if (!await checkIsOver(open_id, type, Number(score), SCORE_MAX.miniProgramSignUp)) {
                    sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score: Number(score), type, event_code }), result => console.log(result));
                }
            }
        }
        channel.ack(msg);
    },

    // 后台录入元宝分
    customInput: async (params, msg, channel) => {
        const { open_id, score, activityId, type, create_person } = params;
        const event_code = 1314;
        // 判断是否已经录入过了
        const isExist = await memberEventMapper._checkAndCreateEvent({ open_id, articleId: activityId, type: '1314' });
        if (!isExist) {
            sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({ open_id, score: Number(score), type, event_code, create_person }), result => console.log(result));
        }
        channel.ack(msg);
    },
};

/**
 * 会员活动分
 */
exports.memberActivity = (msg, channel) => {
    if (!sendMQ) {
        sendMQ = require('./rabbitmq').sendMQ;
    }
    let params = JSON.parse(msg.content.toString());
    let { _class } = params;
    if (!_class) {
        try {
            params = params.data;
            _class = params._class;
        } catch (e) {
            
        }
    }
    if (_class === 'sign') {
        memberEventMapper.sign(params, msg, channel);
    } else if (_class === 'payment') {
        memberEventMapper.payment(params, msg, channel);
    } else if (_class === 'paymentCancel') {
        memberEventMapper.paymentCancel(params, msg, channel);
    } else if (_class === 'read') {
        memberEventMapper.read(params, msg, channel);
    } else if (_class === 'share') {
        memberEventMapper.share(params, msg, channel);
    } else if (_class === 'exam') {
        memberEventMapper.exam(params, msg, channel);
    } else if (_class === 'takeGoods') {
        memberEventMapper.takeGoods(params, msg, channel);
    } else if (_class === 'serviceFeedback') {
        memberEventMapper.serviceFeedback(params, msg, channel);
    } else if (_class === 'introduced') {
        memberEventMapper.introduced(params, msg, channel);
    } else if (_class === 'businessCert') {
        memberEventMapper.businessCert(params, msg, channel);
    } else if (_class === 'newMember') {
        memberEventMapper.newMember(params, msg, channel);
    } else if (_class === 'sendOnlineMsg') {
        memberEventMapper.sendOnlineMsg(params, msg, channel);
    } else if (_class === 'miniProgramSignUp') {
        memberEventMapper.miniProgramSignUp(params, msg, channel);
    } else if (_class === 'guess') {
        memberEventMapper.guess(params, msg, channel);
    } else if (_class === 'login') {
        memberEventMapper.login(params, msg, channel);
    } else if (_class === 'customInput') {
        memberEventMapper.customInput(params, msg, channel);
    } else {
        channel.ack(msg);
    }
}

/**
 * 会员静态分
 */
const memberStatic = (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    const { open_id } = params;
    Member.findOne({ where: { open_id } }).then(result => {
        const calculScore = new BaseCalculScore(result.dataValues);
        calculScore.getItemScore(() => {
            calculScore.getPartScore(() => {
                calculScore.updateMemberScore(() => {
                    console.log('静态分数计算完成');
                    channel.ack(msg);
                });
            });
        });
    }).catch(e => LOG(e));
}
exports.memberStatic = memberStatic;


/**
 * 新增积分券
 * open_id, score, type
 */

const createTicket = async (msg, channel) => {
    if (!deal) {
        deal = require('./deal');
    }
    if (!homeMemberService) {
        homeMemberService = require('./homeMember');
    }
    const params = JSON.parse(msg.content.toString());
    let { open_id, score, type, event_code, create_person } = params;
    const memberEntity = await Member.findOne({ where: { open_id } });
    // if (memberEntity && memberEntity.dataValues.company !== '杭州朗杰测控技术开发有限公司') {
        const { user_id } = memberEntity.dataValues;
        // 根据会员等级，计算元宝分
        const scoreEntity = await MemberScore.findOne({ where: { openid: open_id } });
        const { rate } = homeMemberService.memberLevelMapper(scoreEntity.dataValues.total);
        score = score * rate;
        await deal.MemberScore.create({ user_id, score, type, event_code, create_person });
    // }
    channel.ack(msg);
}
exports.createTicket = createTicket;


/**
 * 计算合作分和活动分
 * 每月一次
 */
const calculCooperAndActivity = async () => {
    if (!sendMQ) {
        sendMQ = require('./rabbitmq').sendMQ;
    }
    const payMapper = await getPaymentMapper();
    const scoreMapper = await getScoreMapper();
    const memberList = await Member.findAll();
    await bluebird.map(memberList, async items => {
        const { company, job, open_id } = items.dataValues;
        let cooper = payMapper[company] ? payMapper[company] : 0;
        cooper = Math.sqrt(cooper) / 10 * await jobRate(job);
        const activity = scoreMapper[open_id] ? Math.sqrt(scoreMapper[open_id]) : 0;
        await MemberScore.update({ cooper, activity }, { where: { openid: open_id } });
        sendMQ.sendQueueMsg('memberStatic', JSON.stringify({ open_id }), result => {});
    }, { concurrency: 5 });
    console.log('合作分活动分更新完成');

    async function getPaymentMapper() {
        const arrivalTime = TIME(Date.now() - 60 * 60 * 1000 * 24 * 365 * 3);
        const list = await Payment.findAll({ where: {
            isdel: 0,
            arrival: { $gt: arrivalTime },
        }});
        const companyMapper = {};
        list.forEach(items => {
            const { company, amount } = items.dataValues;
            if (!companyMapper[company]) {
                companyMapper[company] = 0;
            }
            companyMapper[company] += Number(amount);
        });
        return companyMapper;
    }

    async function getScoreMapper() {
        const targetTime = TIME(Date.now() - 60 * 60 * 1000 * 24 * 365 * 3);
        const list = await BankMemberScore.findAll({ where: { score: { $gt: 0 }, create_time: { $gt: targetTime } } });
        const ownIdMapper = {}, userIdMapper = {}, openIdMapper = {};
        list.forEach(items => {
            const { score, own_id } = items.dataValues;
            if (!ownIdMapper[own_id]) {
                ownIdMapper[own_id] = 0;
            }
            ownIdMapper[own_id] += Number(score);
        });
        const walletList = await Wallet.findAll();
        walletList.forEach(items => {
            const { id, user_id } = items.dataValues;
            if (ownIdMapper.hasOwnProperty(id)) {
                userIdMapper[user_id] = ownIdMapper[id];
            }
        });
        const memberList = await Member.findAll();
        memberList.forEach(items => {
            const { open_id, user_id } = items.dataValues;
            if (userIdMapper.hasOwnProperty(user_id)) {
                openIdMapper[open_id] = userIdMapper[user_id];
            }
        });
        return openIdMapper;
    }
}
exports.calculCooperAndActivity = calculCooperAndActivity;