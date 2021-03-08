const amqp = require('amqplib/callback_api');

class RpcUtil {
    constructor(rabbitMQAccount, rabbitMQPassword, rabbitMQHost, rpcQueueClient) {
        this.connection;
        this.channel;
        this.rpcQueueServer = 'rpc_queue_server';
        this.rpcQueueClient = rpcQueueClient || 'rpc_queue_client';
        this.amqpUrl = 'amqp://' + rabbitMQAccount + ':' + rabbitMQPassword + '@' + rabbitMQHost + ':5672';
        this.correlationIdPool = new Map();
    }

    async _createChannel() {
        this.channel = await new Promise(resolve => {
            this.connection.createChannel((err, channel) => {
                resolve(channel);
            });
        });
    }

    generateUuid() {
        return Math.random().toString() +
            Math.random().toString() +
            Math.random().toString();
    }

    async init() {
        await new Promise((resolve, reject) => {
            amqp.connect(this.amqpUrl, (error, conn) => {
                if (error) {
                    reject(error);
                } else {
                    this.connection = conn;
                    resolve();
                }
            });
        });
        await this._createChannel();
    }

    async dealerMsg(msgContent) {
        msgContent = JSON.parse(msgContent);
        return { code: 200, msg: '', data: msgContent };
    }

    async listenMsg() {
        this.channel.assertQueue(this.rpcQueueServer, { durable: false });
        this.channel.prefetch(1);

        this.channel.consume(this.rpcQueueServer, async msg => {
            const msgContent = msg.content.toString();

            let dealerResult;
            try {
                dealerResult = await this.dealerMsg(msgContent);
            } catch (e) {
                dealerResult = { code: -1, msg: e.message };
            }
            this.channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(dealerResult)), {
                correlationId: msg.properties.correlationId,
            });
        }, { noAck: true });
    }

    async sendMsg(correlationId, params, cb) {
        const q = await new Promise(resolve => {
            this.channel.assertQueue(this.rpcQueueClient, { exclusive: true }, (e, q) => {
                resolve(q);
            });
        });
        this.correlationIdPool.set(correlationId, cb);
        this.channel.consume(q.queue, msg => {
            if (this.correlationIdPool.has(msg.properties.correlationId)) {
                const cb = this.correlationIdPool.get(msg.properties.correlationId);
                cb(JSON.parse(msg.content.toString()));
                this.correlationIdPool.delete(msg.properties.correlationId);
            }
        }, { noAck: true });

        this.channel.sendToQueue(this.rpcQueueServer, Buffer.from(JSON.stringify(params)), {
            correlationId,
            replyTo: q.queue,
        });
    }
}

exports.RpcUtil = RpcUtil;