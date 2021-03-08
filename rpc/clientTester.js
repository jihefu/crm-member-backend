const { RpcUtil } = require('./rpcUtil');

const rpcUtil = new RpcUtil('zlg', 'langjie2017', '192.168.50.230');
rpcUtil.init().then(() => {
    setInterval(() => {
        for (let i = 0; i < 100; i++) {
            rpcUtil.sendMsg(rpcUtil.generateUuid(), {
                method: '',
                params: {
                    
                },
            }, result => console.log(i + '<<>>' + JSON.stringify(result)));
        }
    }, 3000);
}).catch(e => console.log(e));