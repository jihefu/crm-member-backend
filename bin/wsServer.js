var webSocket = require('ws');
const serviceCusApp = require('../service/cusApp');

var WS = new webSocket.Server({
	port: 3001
});
WS.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		message = JSON.parse(message);
		const { type, params } = message;
		const { userId, openId, receiver } = params;
		switch(type){
			case 'login':
				ws.userId = params.userId;
				ws.openId = params.openId;
				break;

			case 'logout':
				break;

			// 发送定位请求
			case 'requestLocation':
				WS.clients.forEach(function each(client) {
					if(client.userId==userId){
						client.send(JSON.stringify({
							type: 'requestLocation'
						}));
					}
				});
				break;
			
			// 返回定位请求
			case 'responseLocation':
				WS.clients.forEach(function each(client) {
					if(client.userId==userId){
						serviceCusApp.getStatus(params,result => {
							try{
								params.signTime = result.data.data.signTime;
							}catch(e){
								params.signTime = null;
							}
							client.send(JSON.stringify({
								type: 'responseLocation',
								params
							}));
						});
					}
				});
				break;
		}
	});
});

/**
 * 给指定接收者发送消息
 * http触发
 */
this.sendMsg = (params) => {
	const { receiver } = params;
	let hasSend = false;
	WS.clients.forEach(function each(client) {
		if(client.openId == receiver){
			if(hasSend) return;
			client.send(JSON.stringify({
				type: 'receiveMsg',
				params
			}));
			hasSend = true;
		}
	});
}

/**
 * 指定消息已阅
 * http触发
 */
this.isRead = (params) => {
	const { sender, id } = params;
	let hasSend = false;
	WS.clients.forEach(function each(client) {
		if(client.openId == sender){
			if(hasSend) return;
			client.send(JSON.stringify({
				type: 'isRead',
				params
			}));
			hasSend = true;
		}
	});
}