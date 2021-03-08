const antpb = require('antpb');
const protocol = require('sofa-bolt-node');
const { RpcClient } = require('sofa-rpc-node').client;
const { RpcServer } = require('sofa-rpc-node').server;
const { ZookeeperRegistry } = require('sofa-rpc-node').registry;
const logger = console;
const serviceHomeMember = require('../service/homeMember');

// 传入 *.proto 文件存放的目录，加载接口定义
const proto = antpb.loadAll('./proto');
// 将 proto 设置到协议中
protocol.setOptions({ proto });

// 创建 zk 注册中心客户端
const registry = new ZookeeperRegistry({
    logger,
    address: CONFIG.sofaMemberAddr,
});

const server = new RpcServer({
    logger,
    protocol, // 覆盖协议
    registry,
    codecType: 'protobuf', // 设置默认的序列化方式为 protobuf
    port: 12205,
});

server.addService({
    interfaceName: 'com.langjie.sofa.rpc.MemberService',
}, {
        // 判断该访客是否有资格抽奖
        async checkMemberScoreInfo(req) {
            const { unionid } = req;
            async function dealer() {
                return new Promise((resolve) => {
                    serviceHomeMember.checkMemberScoreInfo({ unionid }, result => {
                        resolve(result);
                    });
                });
            }
            const res = await dealer();
            return res;
        },

        // 获取一定规则的会员
        async getMemberByScoreRule(req) {
            const { activity, total } = req;
            async function dealer() {
                return new Promise((resolve) => {
                    serviceHomeMember.getMemberByScoreRule({ activity, total }, result => {
                        result.data = JSON.stringify(result);
                        resolve(result);
                    });
                });
            }
            const res = await dealer();
            return res;
        },

        // 根据unionid获取会员基本信息和分数
        async getMemberInfo(req) {
            const { unionid } = req;
            async function dealer() {
                return new Promise((resolve) => {
                    serviceHomeMember.getMemberInfo({ unionid }, result => {
                        resolve(result);
                    });
                });
            }
            const res = await dealer();
            try {
                res.data = JSON.stringify(res.data.dataValues);
            } catch (e) {
                
            }
            return res;
        },
    });
server.start()
    .then(() => {
        server.publish();
    });