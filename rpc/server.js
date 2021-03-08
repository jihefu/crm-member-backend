const fs = require('fs');
const { RpcUtil } = require('./rpcUtil');
const CONFIG = JSON.parse(fs.readFileSync('./config.json').toString());
const serviceHomeMember = require('../service/homeMember');
const serviceMember = require('../service/member');
const serviceGoodsForYBScore = require('../service/goodsForYBScore');
const { WxUvCalcul } = require('../service/redis');

class DealerMsgRpcUtil extends RpcUtil {
    // @Override
    async dealerMsg(msgContent) {
        msgContent = JSON.parse(msgContent);
        const { method, params } = msgContent;
        let result;
        try {
            if (method === 'getMemberList') {
                // 获取会员列表
                result = await new Promise(resolve => {
                    serviceHomeMember.list(params, res => resolve(res));
                });
            } else if (method === 'consumeYBScore') {
                // 兑换指定礼品（积分）
                params.notNotify = true;
                result = await serviceMember.consumeYBScore(params);
            } else if (method === 'getGiftList') {
                // 获取礼品列表（积分）
                result = await serviceGoodsForYBScore.getList(params);
            } else if (method === 'updateMsgHasRead') {
                // 更新已读
                result = await serviceHomeMember.updateMsgHasRead(params);
            } else if (method === 'getUnReadMsgList') {
                // 获取未读消息
                result = await serviceHomeMember.getUnreadMsgList(params);
            } else if (method === 'refreshActiveDegree') {
                // 更新最后登陆时间，更新活跃度
                await WxUvCalcul.AddUser(params.unionid);
                serviceMember.refreshLastLoginTime(params);
                result = await serviceMember.refreshActiveDegree(params);
            } else {
                result = { code: -1, msg: '找不到对应方法' };
            }
        } catch (e) {
            result = { code: -1, msg: e.message };
        }

        return result;
    }
}

const rpcUtil = new DealerMsgRpcUtil(CONFIG.rabbitMQAccount, CONFIG.rabbitMQPassword, CONFIG.proxy_host);
rpcUtil.init().then(() => {
    rpcUtil.listenMsg();
}).catch(e => {
    LOG(e);
    process.exit();
});