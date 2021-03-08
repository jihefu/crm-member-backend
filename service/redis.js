let redis = require("redis");
let client = redis.createClient(6379, "127.0.0.1");

exports.redisClient = client;

class AppUser {
	constructor(){
		this.clientList = {};
	}

	listen(key,phone){
		client.get(key,(err,result) => {
			new Promise((resolve,reject) => {
				if(!result){
					client.set(key,JSON.stringify([phone]),(err,result) => resolve());
				}else{
					if(result=='null') result = JSON.stringify([]);
					result = JSON.parse(result);
					result.push(phone);
					client.set(key,JSON.stringify(result),() => resolve());
				}
			}).then(() => {}).catch(e => LOG(e));
		});
	}

	trigger(key,cb){
		client.get(key,(err,result) => {
			let fns = JSON.parse(result);
			cb(fns);
		});
	}
}

// 存环形队列和index指针
this.classTaskQueue = class TaskQueue {
	constructor(){
		this.len = 60 * 24;
	}

	getIndex(cb){
		client.get('msgIndex',(err,result) => {
			if(result==null){
				cb(0);
			}else{
				cb(Number(result));
			}
		});
	}

	getQueue(cb){
		client.get('msgQueue',(err,result) => {
			try{
				result = JSON.parse(result);
			}catch(e){

			}
			cb(result);
		});
	}

	setQueue(queue,cb){
		queue = JSON.stringify(queue);
		client.set('msgQueue',queue,(err,result) => {
			cb();
		});
	}

	setQueueAndIndex(index,queue){
		queue[index] = [];
		if(index < this.len - 1 ){
			index++;
		}else{
			index = 0;
		}
		queue = JSON.stringify(queue);
		client.set('msgQueue',queue,(err,result) => {
			
		});
		client.set('msgIndex',index,(err,result) => {
			
		});
	}

	createQueue(cb){
		let msgQueue = [];
		for (let i = 0; i < this.len; i++) {
			msgQueue[i] = [];
		}
		msgQueue = JSON.stringify(msgQueue);
		client.set('msgQueue',msgQueue,(err,result) => {
			cb();
		});
	}

	reset() {
		client.set('msgQueue',null,(err,result) => {
			
		});
		client.set('msgIndex',0,(err,result) => {
			
		});
	}
}

// 存取临时用户的基本信息
this.classWxUserInfo = class WxUserInfo {
	constructor(){

	}

	setInfo(open_id,form_data,cb){
		form_data = JSON.stringify(form_data);
		client.set(open_id,form_data,(err,result) => {
			cb(result);
		});
	}

	getInfo(open_id,cb){
		client.get(open_id,(err,result) => {
			try{
				result = JSON.parse(result);
			}catch(e){

			}
			cb(result);
		});
	}
}

// 定时发送站内消息类
// 有序集合实现
this.classAffairMsgQueue = class AffairMsgQueue {

	// 添加消息体
	async push(timestamp, data) {
		data = typeof data === 'object' ? JSON.stringify(data) : data;
		client.zadd('affairMsg', timestamp, data);
	}

	// 获取当前的任务
	async getColection() {
		return new Promise(resolve => {
			client.zrange('affairMsg', 0, 100, (err, result) => {
				resolve(result);
			});
		});
	}

	// 移除成员
	async remove(member) {
		member = typeof member === 'object' ? JSON.stringify(member) : member;
		client.zrem('affairMsg', member);
	}
}

let appUser = new AppUser();

client.on("ready", function () {
	console.log('redis connect success');
});

/**
 * 获取openId的信息（位置）
 */
this.getMemberByUserId = (params,cb) => {
	const { userId, openIdArr } = params;
	const _p = [];
	const resArr = [];
	openIdArr.forEach((items,index) => {
		_p[index] = new Promise((resolve,reject) => {
			client.get('cusApp_'+userId+'_'+items,(err,result) => {
				if(result) resArr.push(JSON.parse(result));
				resolve();
			});
		});
	});
	Promise.all(_p).then(() => {
		cb(resArr);
	}).catch(e => LOG(e));
}

/**
 * 设置指定公司下面指定员工的信息（位置）
 */
this.setMemberByUserId = (params,cb) => {
	const { openId, userId, infoObj } = params;
	client.set('cusApp_'+userId+'_'+openId,JSON.stringify(infoObj),(err,result) => {
		cb();
	});
}

/**
 * 清空数据（位置）
 */
this.clearMemberByUserId = (params,cb) => {
	const { userId, openIdArr } = params;
	const _p = [];
	openIdArr.forEach((items,index) => {
		_p[index] = new Promise((resolve,reject) => {
			client.set('cusApp_'+userId+'_'+items,JSON.stringify({}),(err,result) => {
				resolve();
			});
		});
	});
	Promise.all(_p).then(() => {
		if(cb) cb();
	}).catch(e => LOG(e));
}

exports.lock = async keyName => {
	const res = await new Promise(resolve => {
		client.setnx(keyName, 1, (err, result) => {
			if (result) {
				client.expire(keyName, 5);
			}
			resolve(result);
		});
	});
	return res;
}

exports.unlock = async keyName => {
	await new Promise(resolve => {
		client.del(keyName, (err, result) => {
			resolve();
		});
	});
}

/***********************************增删改查********************************************/

/*获取App订阅者集合*/
this.getAppUserList = (cb) => {
	client.get('connect_test',(err,result) => {
		cb(JSON.parse(result));
	});
}

/*更新App订阅者集合*/
this.updateAppUserList = (phone_arr,cb) => {
	client.set('connect_test',JSON.stringify(phone_arr),(err,result) => {
		cb();
	});
}

/*添加App使用者订阅事件*/
this.SubAppUser = (key,phone,cb) => {
	this.getAppUserList(list => {
		if(!list||list[0]==null){
			appUser.listen(key,phone);
		}else{
			for (let i = 0; i < list.length; i++) {
				if(list[i]==phone){
					break;
				}else if(list[i]!=phone&&i==list.length-1){
					appUser.listen(key,phone);
				}
			}
		}
	});
	if(arguments.length==3) cb();
}

/**************************************end********************************************/

/*添加App使用者发布事件*/
/*触发器*/
this.PubAppUser = (cb) => {
	appUser.trigger('connect_test',cb);
}

/*设置App订阅未关闭后台者集合*/
this.setCallBackAppUserList = (phone,cb) => {
	if(phone==-10000){
		client.set('connect_test_cb',JSON.stringify([]),(err,result) => cb());
	}else{
		client.get('connect_test_cb',(err,result) => {
			new Promise((resolve,reject) => {
				if(!result){
					client.set('connect_test_cb',JSON.stringify([phone]),(err,result) => resolve());
				}else{
					result = JSON.parse(result);
					result.push(phone);
					client.set('connect_test_cb',JSON.stringify(result),() => resolve());
				}
			}).then(() => cb()).catch(e => LOG(e));
		});
	}
}

/*获取App订阅未关闭后台者集合*/
this.getCallBackAppUserList = (cb) => {
	client.get('connect_test_cb',(err,result) => {
		cb(JSON.parse(result));
	});
}

exports.WxUvCalcul = class WxUvCalcul {
	static getTimeStr() {
		const timeStr = DATETIME().replace(/-/g, '');
		return timeStr;
	}

	static async AddUser(unionid) {
		const timeStr = WxUvCalcul.getTimeStr();
		await new Promise(resolve => {
			client.sadd('wx_uv_' + timeStr, unionid, () => {
				client.expire('wx_uv_' + timeStr, 60 * 60 * 24 * 7, () => resolve());
			});
		});
	}

	static async GetOrderDayUser(timeStr) {
		return new Promise((resolve, reject) => {
			client.smembers('wx_uv_' + timeStr, (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
			});
		});
	}

	static async GetTodayUser() {
		const timeStr = WxUvCalcul.getTimeStr();
		return new Promise((resolve, reject) => {
			client.smembers('wx_uv_' + timeStr, (err, result) => {
				if (err) {
					reject(err);
				}
				resolve(result);
			});
		});
	}
}