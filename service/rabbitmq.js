let amqp = require('amqplib');
const fs = require('fs');
const base = require('./base');
const CONFIG = JSON.parse(fs.readFileSync('./config.json').toString());
const amqpUrl = 'amqp://'+CONFIG.rabbitMQAccount+':'+CONFIG.rabbitMQPassword+'@'+CONFIG.proxy_host+':5672';
const memberScoreDealer = require('./memberScoreDealer');
const payArrivalNotify = require('./payArrivalNotify');
const deliveryNotify = require('./deliveryNotify');
const wxMsgTemp = require('./wxMsgTemp');
const common = require('./common');

new base.StaffMap().setStaffMap();

class RabbitMQ {
    constructor() {
        this.open = amqp.connect(amqpUrl);
    }

    sendQueueMsg(queueName, msg, callBack) {
        let self = this;

        self.open
            .then(conn => conn.createChannel())
            .then(channel => {
                return channel.assertQueue(queueName,{durable: true}).then(ok => {
                    return channel.sendToQueue(queueName, new Buffer(msg), {
                        persistent: true    // 消息持久化
                    });
                })
                .then(data => {
                    if (data) {
                        callBack && callBack({
                            code: 200,
                            msg: '发送成功',
                            data: msg,
                        });
                        channel.close();
                    }
                })
                .catch(e => {
                    callBack && callBack({
                        code: -1,
                        msg: '发送失败',
                        data: e.stack,
                    });
                    setTimeout(() => {
                        if (channel) channel.close();
                    }, 500);
                });
            });
    }

    async sendDelayMsg(delayExchange, delayQueue, deadLetterExchange, msg, expire) {
        const self = this;

        const conn = await self.open;
        const channel = await conn.createChannel();
        await channel.assertExchange(delayExchange, 'direct', { durable: true });
        await channel.assertExchange(deadLetterExchange, 'direct', { durable: true });
        const queueResult = await channel.assertQueue(delayQueue, {
            exclusive: false,
            deadLetterExchange,
        });
        await channel.bindQueue(queueResult.queue, delayExchange);

        await new Promise(resolve => {
            channel.publish(delayExchange, '', Buffer.from(msg), {
                expiration: expire,
                persistent: true,
            }, async () => resolve());
        });
        channel.close();

        return { code: 200 };
    }

    receiveQueueMsg(queueName, receiveCallBack, prefetchNum) {
        let self = this;

        self.open
            .then(conn => conn.createChannel())
            .then(async channel => {
                prefetchNum = prefetchNum || 10;
                await channel.prefetch(prefetchNum, false);
                return channel.assertQueue(queueName,{durable: true})
                    .then(ok => {
                        return channel.consume(queueName, msg => {
                            // if (msg !== null) {
                                // channel.ack(msg);
                                receiveCallBack && receiveCallBack(msg, channel);
                                // channel.close();
                            // }
                        });
                    })
            })
    }

    async receiveDelayMsg(deadLetterExchange, queueName, prefetchNum) {
        prefetchNum = prefetchNum || 10;
        const self = this;

        const conn = await self.open;
        const channel = await conn.createChannel();
        await channel.assertExchange(deadLetterExchange, 'direct', { durable: true });
        await channel.assertQueue(queueName, { durable: true });
        await channel.bindQueue(queueName, deadLetterExchange);
        await channel.prefetch(prefetchNum, false);
        const msg = await new Promise(resolve => {
            channel.consume(queueName, msg => {
                resolve(JSON.parse(msg.content.toString()));
            }, { noAck: true });
        });
        return msg;
    }
}

const sendMQ = new RabbitMQ();
const receiveMQ = new RabbitMQ();

module.exports = {
    sendMQ,
    receiveMQ
};

sendMQ.sendQueueMsg('testQueue', JSON.stringify({ msg: 'my first msg' }), result => {
    console.log(result);
});

receiveMQ.receiveQueueMsg('testQueue', (msg, channel) => {
    const content = msg.content.toString();
    console.log(content);
    // 执行成功后确认消息
    if (true) channel.ack(msg);
});

/**
 * 会员活动分数变动
 */
receiveMQ.receiveQueueMsg('memberActivity', (msg, channel) => {
    memberScoreDealer.memberActivity(msg, channel);
});

/**
 * 会员静态分数变动
 */
receiveMQ.receiveQueueMsg('memberStatic', (msg, channel) => {
    memberScoreDealer.memberStatic(msg, channel);
});

/**
 * 到款消息
 */
receiveMQ.receiveQueueMsg('payArrival', (msg, channel) => {
   payArrivalNotify.payArrival(msg, channel);
});

/**
 * 发货消息
 */
receiveMQ.receiveQueueMsg('delivery', (msg, channel) => {
    deliveryNotify.delivery(msg, channel);
});

/**
 * 信用到期提醒
 */
receiveMQ.receiveQueueMsg('creditReminder', (msg, channel) => {
    deliveryNotify.creditReminder(msg, channel);
});

/**
 * 生日提醒
 */
receiveMQ.receiveQueueMsg('birthNoti', (msg, channel) => {
    deliveryNotify.birthNoti(msg, channel);
});

/**
 * 抵价券新增
 */
receiveMQ.receiveQueueMsg('newCoupon', (msg, channel) => {
    payArrivalNotify.newCoupon(msg, channel);
});

/**
 * 抵价券使用
 */
receiveMQ.receiveQueueMsg('useCoupon', (msg, channel) => {
    payArrivalNotify.useCoupon(msg, channel);
});

/**
 * 新的合同
 */
receiveMQ.receiveQueueMsg('new_contract', async (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    await wxMsgTemp.newContract(params);
    channel.ack(msg);
});

/**
 * 装箱单发货
 */
receiveMQ.receiveQueueMsg('delivery_pack', async (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    await wxMsgTemp.deliveryPack(params);
    channel.ack(msg);
});

/**
 * 合同确认收货
 */
receiveMQ.receiveQueueMsg('contract_take', async (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    await wxMsgTemp.contractTake(params);
    channel.ack(msg);
});

/**
 * 交易消息
 */
receiveMQ.receiveQueueMsg('general_deal', async (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    await common.createTradingRecord(params);
    channel.ack(msg);
});

/**
 * 新增积分券消息
 */
receiveMQ.receiveQueueMsg('create_score_ticket', async (msg, channel) => {
    await memberScoreDealer.createTicket(msg, channel);
});