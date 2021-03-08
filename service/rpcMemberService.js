const antpb = require('antpb');
const protocol = require('sofa-bolt-node');
const { RpcClient } = require('sofa-rpc-node').client;
const { RpcServer } = require('sofa-rpc-node').server;
const { ZookeeperRegistry } = require('sofa-rpc-node').registry;
const logger = console;

// 传入 *.proto 文件存放的目录，加载接口定义
const proto = antpb.loadAll('./proto');
// 将 proto 设置到协议中
protocol.setOptions({ proto });

// 创建 zk 注册中心客户端
const registry = new ZookeeperRegistry({
    logger,
    address: CONFIG.sofaMemberAddr,
});

const client = new RpcClient({
    logger,
    protocol,
    registry,
});

const consumer = client.createConsumer({
    interfaceName: 'com.langjie.sofa.rpc.MemberService',
});
consumer.ready();

// 判断该访客是否有资格抽奖
exports.checkMemberScoreInfo = async params => {
    const res = await consumer.invoke('checkMemberScoreInfo', [ params ]);
    return res;
};

// 获取一定规则的会员
exports.getMemberByScoreRule = async params => {
    const res = await consumer.invoke('getMemberByScoreRule', [ params ]);
    return res;
};

//根据unionid获取会员基本信息和分数
exports.getMemberInfo = async params => {
    const res = await consumer.invoke('getMemberInfo', [ params ]);
    return res;
};