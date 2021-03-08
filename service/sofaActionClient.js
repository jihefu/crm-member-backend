// const { init, invoke } = require('langjie-util');
// const rpcInstance = init('com.langjie.sofa.rpc.ActionService');
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
    address: CONFIG.sofaActionAddr,
});

const client = new RpcClient({
    logger,
    protocol,
    registry,
});

const consumer = client.createConsumer({
    interfaceName: 'com.langjie.sofa.rpc.ActionService',
});
consumer.ready();

exports.show = async params => {
    const res = await consumer.invoke('show', [ params ]);
    try {
		res.data = JSON.parse(res.data);
	} catch (e) {
		
	}
    return res;
};

exports.update = async params => {
    const res = await consumer.invoke('update', [ params ]);
    try {
		res.data = JSON.parse(res.data);
	} catch (e) {
		
	}
    return res;
};

exports.create = async params => {
    const res = await consumer.invoke('create', [ params ]);
    try {
		res.data = JSON.parse(res.data);
	} catch (e) {
		
	}
    return res;
};

exports.destroy = async params => {
    const res = await consumer.invoke('destroy', [ params ]);
    try {
		res.data = JSON.parse(res.data);
	} catch (e) {
		
	}
    return res;
};