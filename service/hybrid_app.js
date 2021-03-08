var express = require('express');
var url = require('url');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
const request = require('request');
var base = require('./base');
var common = require('./common');
var sequelize = require('../dao').sequelize;
var BaseMsg = require('../dao').BaseMsg;
var CallMsg = require('../dao').CallMsg;
var Staff = require('../dao').Staff;
var ServiceTagsLib = require('../dao').ServiceTagsLib;
var Contacts = require('../dao').Contacts;
var Member = require('../dao').Member; 
var redisClient = require('./redis');
const serviceContacts = require('./homeContacts');
const socketCall = require('./socketCall');
const serviceHomeMember = require('./homeMember');
const serviceCusClientNotiMsg = require('./cusClientNotiMsg');
const Affair = require('../dao').Affair;
const serviceNotiClient = require('./homeNotiSystem');
const serviceHomeLogin = require('./homeLogin');
const AppUserStatus = require('../dao').AppUserStatus;
const MeetMsg = require('../dao').MeetMsg;
const OtherMsg = require('../dao').OtherMsg;
var Customers = require('../dao').Customers;
const VerContacts = require('../dao').VerContacts;
const VerUnit = require('../dao').VerUnit;
const ContractsHead = require('../dao').ContractsHead;
const Goods = require('../dao').Goods;
const serviceHomeVerUnit = require('./homeVerUnit');
const VerUnitTel = require('../dao').VerUnitTel;
const TypeDInfo = require('../dao').TypeDInfo;
const sendMQ = require('./rabbitmq').sendMQ;
const BaseEvent = require('../dao').BaseEvent;

/************************app接口******************************/
const tagHash = {
	'咨询': {
        description: '问题描述'
    },
    '报修': {
        description: '产品序列号'
    },
    '催货': {
        description: '合同号'
    },
    '报价': {
        description: '价格信息'
    },
    '投诉': {
        description: '责任人'
    },
};

/**
 * 	登陆
 */
this.userLogin = function(params,cb){
	var username = params.username;
	var password = params.password;
	var _password = password;
	var phone = params.phone;
	var md5 = crypto.createHash('md5');
	password = md5.update(password).digest('hex');
	Staff.findAll({
		where: {
			'$and': {
				isdel: 0,
				on_job: 1
			},
			'$or': {
				user_name: {
					'$eq': username
				},
				English_name: {
					'$eq': username
				},
				English_abb: {
					'$eq': username
				},
				user_id: {
					'$eq': username
				},
			}
		}
	}).then(function(result){
		if(result[0]==null){
			cb({
				code: -10002,
				msg: '用户不存在',
				data: {}
			});
		}else{
			var dataValues = result[0].dataValues;
			if(password==dataValues.pwd){
				serviceHomeLogin.login({
					userName: username,
					passWord: _password
				},result => {
					const user_id = result.data[0].user_id;
					const user_name = result.data[0].user_name;
					cb({
						code: 200,
						msg: '登陆成功',
						data: {
							user_id,
							user_name,
							token: result.data[0].token
						}
					});
					AppUserStatus.findOne({
						where: {
							phone
						}
					}).then(result => {
						if(result){
							AppUserStatus.update({
								user_id,
								user_name,
								status: 1,
								login_time: TIME()
							},{
								where: {
									phone
								}
							}).then(() => {}).catch(e => LOG(e));
						}else{
							AppUserStatus.create({
								user_id,
								user_name,
								phone,
								login_time: TIME(),
								status: 1
							}).then(() => {}).catch(e => LOG(e));
						}
					}).catch(e => LOG(e));
				});
				// cb({
				// 	code: 200,
				// 	msg: '登陆成功',
				// 	data: {
				// 		user_id: result[0].user_id
				// 	}
				// });
				// redisClient.SubAppUser('connect_test',phone);
			}else{
				cb({
					code: -10003,
					msg: '密码不正确',
					data: {}
				});
			}
		}
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	登出
 */
this.logout = function(params,cb){
	let phone = params.self_phone;
	AppUserStatus.update({
		status: 0
	},{
		where: {
			phone
		}
	}).then(() => {
		cb({
			code: 200,
			msg: '退出成功',
			data: []
		});
	}).catch(e => LOG(e));
	// redisClient.getAppUserList(result => {
	// 	try{
	// 		for (var i = 0; i < result.length; i++) {
	// 			if(result[i]==phone){
	// 				result.splice(i,1);
	// 				i--;
	// 			}
	// 		}
	// 	}catch(e){

	// 	}
		// redisClient.updateAppUserList(result,(rs) => {
			
		// });
	// });
}

/**
 *  获取在线信息
 */
this.getUserStatusInfo = (params,cb) => {
	AppUserStatus.findAll().then(result => {
		cb({
			code: 200,
			msg: '',
			data: result
		});
	}).catch(e => LOG(e));
}

/**
 * 	试探性呼入
 */
this.callInTip = function(params,cb){
	var user_id = params.self_user_id;
	var phone = params.self_phone;
	var call_phone = params.call_phone;
	var incoming_time = params.incoming_time;

	// this.searchInfo({
	// 	user_id: user_id,
	// 	staffPhone: phone,
	// 	phone: call_phone,
	// 	time: incoming_time
	// });
}

/**
 *  检索该电话有关的各种资源
 */
this.searchInfo = (params) => {
	const { user_id,phone,time,staffPhone } = params;
	const _p = [];
	const that = this;
	//员工号转换成手机号
	_p[0] = new Promise((resolve,reject) => {
		Staff.findOne({
			where: {
				user_id: user_id
			}
		}).then(result => {
			params.user_name = result.dataValues.user_name;
			resolve();
		}).catch(e => LOG(e));
	});
	//最近通话记录
	_p[1] = new Promise((resolve,reject) => {
		that.orderList({
			user_id: user_id,
			keywords: phone,
			filter: 2
		},result => {
			const res_arr = result.slice(0,3);

			const in_p = [];
			res_arr.forEach((items,index) => {
				in_p[index] = new Promise((resolve,reject) => {
					let i = index;
					let it = items;
					res_arr[i].hang_up_time = TIME(it.hang_up_time);
					common.idTransToName({
						user_id: it.staff
					},user_name => {
						res_arr[i].staff = user_name;
						resolve();
					});
				});
			});

			Promise.all(in_p).then(() => {
				params.info = res_arr;
				resolve();
			}).catch(e => LOG(e));
		});
	});
	//会员表，联系人表
	_p[2] = new Promise((resolve,reject) => {
		Member.findAll({
			where: {
				phone: phone
			}
		}).then(result => {
			if(result[0]==null){
				Contacts.findAll({
					where: {
						'$or': {
							phone1: phone,
							phone2: phone
						},
						'$and': {
							isdel: 0
						}
					}
				}).then(result => {
					if(result[0]!=null){
						params.name = result[0].dataValues.name;
						params.company = result[0].dataValues.company;
						params.type = '一般联系人';
						if(result[0].verified){
							params.type = '认证联系人';
						}
					}else{
						params.name = '未知';
						params.company = '未知';
						params.type = '一般联系人（新来电）';
					}
					resolve();
				}).catch(e => LOG(e));
			}else{
				params.name = result[0].dataValues.name;
				params.company = result[0].dataValues.company;
				params.type = '会员';
				resolve();
			}
		}).catch(e => LOG(e));
	});
	Promise.all(_p).then(result => {
		socketCall.callIn(params);
	}).catch(e => LOG(e));
}

/**
 * 	呼入
 */
this.callIn = function(params,cb){
	// LOG(JSON.stringify(params));
	const that = this;
	var user_id = params.self_user_id;
	var phone = params.self_phone;
	var call_phone = params.call_phone;
	const type = params.type ? params.type : '呼出';
	var incoming_time = params.incoming_time!=''?params.incoming_time:params.hang_up_time;
	var hang_up_time = params.hang_up_time;


	new Promise((resolve,reject) => {
		Member.findAll({
			where: {
				phone: call_phone,
				state: { $ne: '未通过' },
				// checked: 1,
				// isEffect: 1,
			}
		}).then(result => {
			if(result[0]==null){
				Contacts.findAll({
					where: {
						'$or': {
							phone1: call_phone,
							phone2: call_phone
						},
						'$and': {
							isdel: 0,
							verified: 1
						}
					}
				}).then(async result => {
					if(result[0]!=null){
						var o = {
							contact_name: result[0].dataValues.name,
							contact_unit: result[0].dataValues.company,
							contact_type: '认证联系人',
							staff: user_id
						};
						resolve(o);
					}else{
						// 191029 加认证单位座机
						const telArr = await VerUnitTel.findAll({ where: { isdel: 0 }});
						const filterTelArr = [];
						telArr.forEach(items => {
							filterTelArr.push({
								name: items.dataValues.name,
								ver_unit_id: items.dataValues.ver_unit_id,
								originTel: items.dataValues.tel,
								tel: items.dataValues.tel.replace(/-|(|)（|）/ig, ''),
							});
						});
						let telResult;
						filterTelArr.forEach(items => {
							if ((items.tel == call_phone) || (items.tel.slice(items.tel.length -7, items.tel.length) == call_phone.slice(call_phone.length -7, call_phone.length))) {
								call_phone = items.originTel;
								telResult = items;
							}
						});
						if (telResult) {
							const { name, ver_unit_id } = telResult;
							const cusResult = await VerUnit.findOne({ where: { user_id: ver_unit_id } });
							resolve({
								contact_name: name,
								contact_unit: cusResult.dataValues.company,
								contact_type: '座机',
								staff: user_id
							});
						} else {
							resolve({});
						}
					}
				}).catch(e => LOG(e));
			}else{
				resolve({
					contact_name: result[0].dataValues.name,
					contact_unit: result[0].dataValues.company,
					contact_type: '会员',
					staff: user_id,
				});
			}
		}).catch(e => LOG(e));
	}).then(result => {
		// if(result&&result.contact_name){
		if(result&&result.contact_name&&result.contact_unit!='杭州朗杰测控技术开发有限公司'){
			result.contact_phone = call_phone;
			result.incoming_time = incoming_time;
			result.staff_phone = phone;
			that.listenChangeTypeDInfo({
				company: result.contact_unit,
				staff: user_id,
				type,
			});
			Promise.all([
				BaseMsg.create(result),
				CallMsg.create({
					contact_phone: call_phone,
					staff_phone: phone,
					incoming_time: incoming_time,
					hang_up_time: hang_up_time
				}),
			]).then(function(result){
				var baseMsg = result[0];
				var callMsg = result[1];
				baseMsg.setCallMsgs(callMsg);
			}).catch(function(e){
				LOG(e);
			});
		}
		cb([]);
	}).catch(e => LOG(e));
}

this.addCallRecord = async params => {
	const { self_user_id, self_phone } = params;
	const that = this;
	const staffMapper = new base.StaffMap().getStaffMap();
	let newIncomingPhone = typeof params.newIncomingPhone === 'string' ? JSON.parse(params.newIncomingPhone) : params.newIncomingPhone;
	newIncomingPhone = await filterPhoneNum(newIncomingPhone);
	const _p = [];
	newIncomingPhone.forEach((items, index) => {
		_p[index] = new Promise(async (resolve, reject) => {
			const { phone, time, duration, type } = items;
			const hang_up_time = TIME(Date.parse(time) + duration * 1000);
			// const result = await sequelize.query('SELECT * FROM contact_message WHERE contact_phone = "'+phone+'" AND staff_phone = "'+self_phone+'" AND staff = "'+self_user_id+'" AND ( date_format(incoming_time, "%Y-%m-%d %H:%i")=date_format("'+time+'", "%Y-%m-%d %H:%i") OR date_format(incoming_time, "%Y-%m-%d %H:%i")=date_format("'+hang_up_time+'", "%Y-%m-%d %H:%i") ) ');
			// if (result[0].length === 0) {
				that.callIn({
					self_user_id,
					self_phone,
					call_phone: phone,
					incoming_time: time,
					hang_up_time,
					type,
				}, () => {});
				await that.updateCallTime({ phone, time, staff_name: staffMapper[self_user_id].user_name });
			// }
			resolve();
		});
	});
	await Promise.all(_p);
	return {
		code: 200,
		msg: '录入成功',
		data: [],
	};

	// 过滤电话
	async function filterPhoneNum(arr) {
		if (arr.length === 0) return arr;
		const filterArr = [];
		const len = arr.length;
		let index = 0;
		let currentPhone, prevPhone = arr[0].phone;
		let currentTime, prevTime = arr[0].time;
		filterArr.push(arr[0]);
		index++;
		while (index < len) {
			prevPhone = arr[index - 1].phone;
			currentPhone = arr[index].phone;

			prevTime = arr[index - 1].time;
			currentTime = arr[index].time;

			if ((currentPhone !== prevPhone) || (currentPhone === prevPhone && new Date(prevTime).getDate() !== new Date(currentTime).getDate())) filterArr.push(arr[index]);
			index++;
		}
		const result = await BaseMsg.findOne({
			where: {
				staff: self_user_id,
				staff_phone: self_phone,
				isdel: 0,
			},
			order: [[ 'incoming_time', 'DESC' ]],
		});
		if (result && result.dataValues.contact_phone == filterArr[0].phone && new Date(result.dataValues.incoming_time).getDate() === new Date(filterArr[0].time).getDate()) {
			filterArr.shift();
		}
		return filterArr;
	}
}

/**
 * 	电话联系单列表
 */
this.orderList = function(params,cb){
	var user_id = params.user_id;
	var page = params.page?parseInt(params.page):1;
	var num = params.num?parseInt(params.num):10;
	var keywords = params.keywords?params.keywords:'';
	var filter = params.filter;
	var start_page = (page-1)*num;
	let andCondition = {
		isdel: 0
	};
	if(filter) andCondition.state = filter;
	if(user_id) andCondition.staff = user_id;
	BaseMsg.findAll({
		where: {
			'$or': {
				contact_name: {
					'$like': '%'+keywords+'%'
				},
				contact_phone: {
					'$like': '%'+keywords+'%'
				},
				contact_unit: {
					'$like': '%'+keywords+'%'
				},
				tags: {
					'$like': '%'+keywords+'%'
				},
				demand: {
					'$like': '%'+keywords+'%'
				},
				content: {
					'$like': '%'+keywords+'%'
				},
			},
			'$and': andCondition
		},
		order: [['incoming_time','DESC'],['id','DESC']],
		offset: start_page,
		limit: num
	}).then(result => {
		cb(result);
	}).catch(e => LOG(e));
	// return;
	// var str = '';
	// var _p = new Promise((resolve,reject) => {
	// 	if(user_id){
	// 		user_id = '"'+user_id+'"';
	// 		resolve();
	// 	}else{
	// 		Staff.findAll({
	// 			where: {
	// 				isdel: 0,
	// 				on_job : 1
	// 			}
	// 		}).then(result => {
	// 			let str = '';
	// 			result.forEach((items,index) => {
	// 				str += '"'+items.dataValues.user_id+'",';
	// 			});
	// 			str = str.slice(0,str.length-1);
	// 			user_id = str;
	// 			resolve();
	// 		}).catch(e => LOG(e));
	// 	}
	// });
	// _p.then(() => {
	// 	if(filter){
	// 		str = 'SELECT * FROM call_message LEFT JOIN contact_message ON contact_message.id = call_message.base_msg_id WHERE contact_message.staff IN ('+user_id+') AND contact_message.isdel = 0 AND contact_message.state = "'+filter+'" AND (contact_message.contact_name LIKE "%'+keywords+'%" OR contact_message.contact_unit LIKE "%'+keywords+'%" OR contact_message.tags LIKE "%'+keywords+'%" OR call_message.contact_phone LIKE "%'+keywords+'%") ORDER BY call_message.incoming_time DESC LIMIT '+start_page+','+num;
	// 	}else{
	// 		str = 'SELECT * FROM call_message LEFT JOIN contact_message ON contact_message.id = call_message.base_msg_id WHERE contact_message.staff IN ('+user_id+') AND contact_message.isdel = 0 AND (contact_message.contact_name LIKE "%'+keywords+'%" OR contact_message.contact_unit LIKE "%'+keywords+'%" OR contact_message.tags LIKE "%'+keywords+'%" OR call_message.contact_phone LIKE "%'+keywords+'%") ORDER BY call_message.incoming_time DESC LIMIT '+start_page+','+num;
	// 	}
	// 	// if(filter==2){
	// 	// 	str = 'SELECT * FROM call_message LEFT JOIN contact_message ON contact_message.id = call_message.base_msg_id WHERE contact_message.staff IN ('+user_id+') AND contact_message.isdel = 0 AND (contact_message.contact_name LIKE "%'+keywords+'%" OR contact_message.contact_unit LIKE "%'+keywords+'%" OR contact_message.tags LIKE "%'+keywords+'%" OR call_message.contact_phone LIKE "%'+keywords+'%") ORDER BY call_message.incoming_time DESC LIMIT '+start_page+','+num;
	// 	// }else if(filter==1){
	// 	// 	str = 'SELECT * FROM call_message LEFT JOIN contact_message ON contact_message.id = call_message.base_msg_id WHERE contact_message.staff IN ('+user_id+') AND contact_message.isdel = 0 AND contact_message.complete = 1 AND (contact_message.contact_name LIKE "%'+keywords+'%" OR contact_message.contact_unit LIKE "%'+keywords+'%" OR contact_message.tags LIKE "%'+keywords+'%" OR call_message.contact_phone LIKE "%'+keywords+'%") ORDER BY call_message.incoming_time DESC LIMIT '+start_page+','+num;
	// 	// }else{
			
	// 	// }
	// 	sequelize.query(str,{model: BaseMsg}).then(function(result){
	// 		// const _p = [];
	// 		// result.forEach((items,index) => {
	// 		// 	_p[index] = new Promise((resolve,reject) => {
	// 		// 		const { contact_name,contact_unit } = items.dataValues;
	// 		// 		const i = index;
	// 		// 		//判断是会员还是认证联系人
	// 		// 		serviceHomeMember.checkContactType({
	// 		// 			company: contact_unit,
	// 		// 			name: contact_name
	// 		// 		},type => {
	// 		// 			result[i].dataValues.contact_type = type;
	// 		// 			resolve();
	// 		// 		});
	// 		// 	});
	// 		// });
	// 		// Promise.all(_p).then(() => {
	// 			cb(result);
	// 		// }).catch(e => LOG(e));
	// 	}).catch(function(e){
	// 		LOG(e);
	// 	});
	// });
}

/**
 * 	指定联系单详情
 */
this.orderInfo = function(params,cb){
	var id = params.id;
	BaseMsg.findOne({
		// include: [CallMsg],
		where: {
			id: [id]
		}
	}).then(function(result){
		var res_arr = dealMsg([result]);
		res_arr[0].id = id;
		cb(res_arr);
		// const _p = [];
		// res_arr.forEach((items,index) => {
		// 	_p[index] = new Promise((resolve,reject) => {
		// 		const { contact_name,contact_unit } = items;
		// 		const i = index;
		// 		//判断是会员还是认证联系人
		// 		serviceHomeMember.checkContactType({
		// 			company: contact_unit,
		// 			name: contact_name
		// 		},type => {
		// 			res_arr[i].contact_type = type;
		// 			resolve();
		// 		});
		// 	});
		// });
		// Promise.all(_p).then(() => {
		// 	new Promise(function(resolve,reject){
		// 		if(res_arr[0].hasRelativeResource){
		// 			resolve();
		// 		}
		// 	}).then(function(result){
		// 		res_arr[0].id = id;
		// 		cb(res_arr);
		// 	}).catch(function(e){
		// 		LOG(e);
		// 		res_arr[0].id = id;
		// 		cb(res_arr);
		// 	});
		// }).catch(e => LOG(e));
	}).catch(function(e){
		LOG(e);
	});

	function dealMsg(result){
		var res_arr = [];
		result.forEach(function(items,index){
			res_arr.push(items.dataValues);
		});
		res_arr.forEach(function(items,index){
			for(var key in items){
				if(key=='CallMsgs'){
					for(var k in items[key][0]['dataValues']){
						res_arr[index][k] = items[key][0]['dataValues'][k];
					}
				}
			}
		});
		res_arr.forEach(function(items,index){
			for(var key in items){
				if(key=='CallMsgs'){
					delete items[key];
				}
			}
		});
		return res_arr;
	}
}

/**
 * 	更新指定联系单内容
 *  2018.09.17 只负责更新和标签，不考虑同步，发消息到专线
 * 	2018.12.05 发消息到热线和专线，标签不再更新
 */
this.orderUpdate = function(par,cb){
	const that = this;
	/*初始化*/
	var body = par.body;
	var params = {},call_params = {},base_params = {};
	for(var i in body){
		params[i] = body[i].model;
	}
	that.orderInfo({
		id: params.id
	},result => {
		const state = result[0].state;
		if(state=='待提交'){
			if (!params.content.trim() || !params.demand.trim()) {
				cb(-1);
				return;
			}
			BaseMsg.update(params,{
				where: {
					id: params.id
				}
			}).then(() => {
				cb(200);
				that.sendMsgToAffair(params);
			}).catch(e => LOG(e));
		}else{
			cb(-1);
		}
	});
}

/**
 *  标签
 */
this.getTagHash = (params,cb) => {
	cb({
		code: 200,
		msg: '',
		data: tagHash
	});
}

/**
 *  关闭联系单
 */
this.closeOrder = (params,cb) => {
	const { id } = params;
	BaseMsg.update({
		state: '已关闭'
	},{
		where: {
			id
		}
	}).then(result => {
		cb();
	}).catch(e => LOG(e));
}

/**
 * 	删除指定联系单
 */
this.orderDelete = function(params,cb){
	var id = params.id;
	BaseMsg.update({
		isdel: 1
	},{
		where: {
			id: [id]
		}
	}).then(function(result){
		cb(result);
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	获取标签
 */
this.getTags = function(cb){
	ServiceTagsLib.findAll({
		where: {
			isdel: 0
		}
	}).then(function(result){
		var res_arr = [];
		result.forEach(function(items,index){
			res_arr.push(items.dataValues);
		});
		cb(res_arr);
	}).catch(function(e){
		LOG(e);
	});
}

/**
 *  发消息到专线
 */
this.sendMsgToSpecialLine = (params) => {
	const name = params.contact_name;
	const company = params.contact_unit;
	const { staff,content } = params;
	Member.findOne({
		where: {
			checked: 1,
			name: name,
			company: company
		}
	}).then(result => {
		if(result){
			const { open_id } = result.dataValues;
			serviceCusClientNotiMsg.onlineService({
				open_id: open_id
			},result => {
				if(result.code==200){
					const customerId = result.data;
					Affair.findOne({
						where: {
							customerId: customerId,
							isdel: 0,
							state: {
								'$ne': '关闭'
							}
						}
					}).then(result => {
						const { uuid,name,team,attentionStaff,title } = result.dataValues;
						let form_data = {
							class: "respoAffair",
							content: content,
							frontUrl: "/specialLine",
							noti_client_affair_group_uuid: uuid,
							priority: "普通",
							subscriber: team,
							title: title,
							votes: '已阅'
						};
						let admin_id = staff;
						// serviceNotiClient.notiClientAdd({
						// 	admin_id: admin_id,
						// 	form_data: form_data
						// },result => console.log(result));
					}).catch(e => LOG(e));
				}
			});
		}
	}).catch(e => LOG(e));
}

/**
 *  发送事务到热线或专线
 *  认证联系人则以短信的方式发送（待完成）
 */
this.sendMsgToAffair = (params) => {
	const { contact_name, demand, content, id } = params;
	BaseMsg.findOne({
		where: {
			id
		}
	}).then(result => {
		const { contact_phone, contact_unit, staff } = result.dataValues;
		Member.findOne({
			where: {
				name: contact_name,
				phone: contact_phone
			}
		}).then(result => {
			if(!result) {
				sendSms();
				return;
			}
			const { open_id } = result.dataValues;
			serviceCusClientNotiMsg.onlineService({
				open_id: open_id
			},result => {
				if(result.code==200){
					//专线
					const customerId = result.data;
					//获取该客户号的title
					Affair.findOne({
						where: {
							isdel: 0,
							state: {
								'$ne': '关闭'
							},
							outerContact: {
								'$like': '%'+open_id+'%'
							},
							customerId
						}
					}).then(result => {
						const title = result.dataValues.name;
						serviceCusClientNotiMsg.addSpecialMsg({
							form_data: {
								content: demand,
								title,
								isFromCall: 1
							},
							self: true,
							open_id,
							fromCallPerson: staff
						},s => {
							//回复
							const noti_client_mailId = s.data.dataValues.mailId;
							let id;
							s.data.dataValues.NotiClientSubs.forEach((items,index) => {
								if(items.dataValues.receiver==staff) id = items.dataValues.id;
							});
							serviceNotiClient.notiClientSubUpdate({
								form_data: {
									atReply: content?content:' ',
									id,
									noti_client_mailId
								},
								admin_id: staff
							},() => {});
						});
					}).catch(e => LOG(e));
				}else{
					//热线
					serviceCusClientNotiMsg.addHostMsg({
						form_data: {
							content: demand,
							isFromCall: 1
						},
						open_id: open_id,
						self: false,
						fromCallPerson: staff
					},s => {
						//回复
						const noti_client_mailId = s.data.dataValues.mailId;
						let id;
						s.data.dataValues.NotiClientSubs.forEach((items,index) => {
							if(items.dataValues.receiver==staff) id = items.dataValues.id;
						});
						serviceNotiClient.notiClientSubUpdate({
							form_data: {
								atReply: content?content:' ',
								id,
								noti_client_mailId
							},
							admin_id: staff
						},() => {});
					});
				}
			});
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));

	function sendSms() {
		const { tags, demand, content, id } = params;
		BaseMsg.findOne({
			where: {
				id
			}
		}).then(result => {
			const { staff_phone, contact_phone } = result.dataValues;
			let url = ROUTE('sms/callReceipt?tags='+encodeURIComponent(tags)+'&demand='+encodeURIComponent(demand)+'&content='+encodeURIComponent(content)+'&staff_phone='+encodeURIComponent(staff_phone)+'&contact_phone='+contact_phone);
			request.get(url,(err,response,body) => {
				console.log(body);
			})
		}).catch(e => LOG(e));
	}
}

/************************* 2019.09.19 新增见面联系单和其它联系单 **************************************/
/**
 * 获取见面单列表
 */
this.getMeetOrderList = async params => {
	let { page, pageSize, keywords, filter, self_user_id } = params;
	page = page ? parseInt(page) : 1;
	pageSize = pageSize ? parseInt(pageSize) : 15;
	keywords = keywords ? keywords : '';
	filter = filter ? filter : {};
	filter = typeof filter === 'string' ? JSON.parse(filter) : filter;
	const where = {
		$and: {
			isdel: 0,
		},
		$or: {
			company: { $like: '%' + keywords + '%' },
			contact_name: { $like: '%' + keywords + '%' },
			contact_phone: { $like: '%' + keywords + '%' },
		}
	};
	if (self_user_id) where['$and'].create_person = self_user_id;
	const result = await MeetMsg.findAll({
		where,
		order: [['id', 'DESC']],
		limit: pageSize,
        offset: ( page - 1 ) * pageSize,
	});
	return {
		code: 200,
		msg: '查询成功',
		data: result,
	};
}

/**
 * 指定见面联系单
 */
this.targetMeetOrder = async params => {
	const { id } = params;
	const result = await MeetMsg.findOne({
		where: {
			id,
		}
	});
	return {
		code: 200,
		msg: '查询成功',
		data: result,
	};
}

/**
 * 创建见面联系单
 */
this.createMeetOrder = async params => {
	const { company, contact_name, contact_phone, purpose, self_user_id, director } = params;
	if (!contact_name) return { code: -1, msg: '联系人不能为空' };
	// 获取省，市缺省地址
	const verUnitEntity = await VerUnit.findOne({ where: { company } });
	let province = verUnitEntity.dataValues.province;
	if (['北京','上海','天津','重庆'].indexOf(province) === -1) {
		province += '省';
	} else {
		province += '市';
	}
	const addr = province + ',' + verUnitEntity.dataValues.town ;
	const result = await MeetMsg.create({
		company,
		contact_name,
		contact_phone,
		purpose,
		create_time: TIME(),
		contact_time: TIME(),
		create_person: self_user_id,
		director,
		addr,
	});
	this.listenChangeTypeDInfo({
		company,
		staff: self_user_id,
		type: '见面联系单',
	});
	return { code: 200, msg: '创建成功', data: result };
}

/**
 * 删除见面联系单
 */
this.delMeetOrder = async params => {
	const { id } = params;
	await MeetMsg.update({ isdel: 1 }, { where: { id } });
	return { code: 200, msg: '删除成功' };
}

/**
 * 更新见面联系单
 */
this.updateMeetOrder = async params => {
	const { id, purpose, is_contract_server } = params;
	try {
		if (purpose == '上门服务') {
			const result = await MeetMsg.findOne({ where: { id } });
			const { end_time, start_time, create_time } = result.dataValues;
			const endTimeStamp = Date.parse(DATETIME(create_time) + ' ' + end_time);
			const startTimeStamp = Date.parse(DATETIME(create_time) + ' ' + start_time);
			let original_work_time = (endTimeStamp - startTimeStamp) / (1000 * 60 * 60);
			original_work_time = original_work_time < 1 ? 0 : original_work_time;
			if (is_contract_server == 1) original_work_time *= 2;
			params.original_work_time = original_work_time;
		}
	} catch (e) {
		
	}
	if (isNaN(params.original_work_time)) params.original_work_time = 0;
	// 找到序列号对应的合同号或物品编号
	if (params.sn) {
		await new Promise(async resolve => {
			const contractEntity = await ContractsHead.findOne({
				where: {
					snGroup: { $like: '%'+ params.sn +'%' },
					isdel: 0,
				},
			});
			if (contractEntity) {
				params.contract_no = contractEntity.dataValues.contract_no;
				resolve();
				return;
			}
			const goodsEntity = await Goods.findOne({
				where: {
					serialNo: { $like: '%'+ params.sn +'%' },
					isdel: 0,
				},
			});
			if (goodsEntity) params.contract_no = goodsEntity.dataValues.numbering;
			resolve();
		});
	}
	const result = await MeetMsg.update(params, { where: { id } });
	return { code: 200, msg: '更新成功', data: result };
}

this.searchNoBySn = async params => {
	// 找到序列号对应的合同号或物品编号
	const contract_no = await new Promise(async resolve => {
		const contractEntity = await ContractsHead.findOne({
			where: {
				$or: {
					snGroup: { $like: '%'+ params.sn +'%' },
					otherSnGroup: { $like: '%'+ params.sn +'%' },
				},
				isdel: 0,
			},
		});
		if (contractEntity) {
			resolve(contractEntity.dataValues.contract_no);
			return;
		}
		const goodsEntity = await Goods.findOne({
			where: {
				serialNo: { $like: '%'+ params.sn +'%' },
				isdel: 0,
			},
		});
		if (goodsEntity) {
			resolve(goodsEntity.dataValues.numbering);
		} else {
			resolve();
		}
	});
	if (contract_no) return { code: 200, msg: '查询成功', data: contract_no };
	return { code: -1, msg: '不存在合同号' };
}

/**
 * 更新见面联系单照片
 */
this.updateMeetOrderAlbum = async params => {
	const { id, album, addr } = params;
	const result = await MeetMsg.findOne({
		where: {
			id,
		},
	});
	const originAlbum = result.album;
	let albumArr;
	try {
		albumArr = originAlbum.split(',').filter(items => items);
	} catch (e) {
		albumArr = [];
	}
	const index = albumArr.indexOf(album);
	if (index === -1) {
		albumArr.push(album);
		// 更新现场开始时间和结束时间
		await updateStartTimeOrEndTime(result.dataValues);
	} else {
		albumArr.splice(index, 1);
	}
	const updateData = {
		album: albumArr.join(),
		addr,
	};
	const birthtime = await new Promise(resolve => {
		if (albumArr.length === 0) {
			updateData.last_album_time = null;
			resolve();
		} else {
			const last_album = albumArr[albumArr.length - 1];
			fs.stat(DIRNAME + '/public/img/gallery/' + last_album, (err, fsResult) => {
				if (err) return resolve();
				const { birthtime } = fsResult;
				resolve(birthtime);
			});
		}
	});
	if (birthtime) updateData.last_album_time = birthtime;
	await MeetMsg.update(updateData, {
		where: { id }
	});
	return {
		code: 200,
		msg: '更新成功',
		data: [],
	};

	async function updateStartTimeOrEndTime(entity) {
		const { start_time, id, purpose } = entity;
		const formData = { end_time: TIME(), contact_time: TIME() };
		if (!start_time) {
			formData.start_time = TIME();
			// 第一次上传照片
		}
		await MeetMsg.update(formData, { where: { id } });
	}
}

/**
 * 搜索认证公司
 */
this.searchCompany = async params => {
	const { keywords } = params;
	const result = await VerUnit.findAll({
		attributes: [ 'company' ],
		where: {
			isdel: 0,
			company: { $like: '%'+keywords+'%' },
			certified: 1,
		},
		order: [[ 'user_id' ]],
		limit: 5,
		offset: 0,
	});
	const _p = [];
	result.forEach((items, index) => {
		_p[index] = new Promise(async resolve => {
			const i = index;
			const contactArr = await serviceHomeVerUnit.getMainContacts({ company: items.dataValues.company});
			result[i].dataValues.contactArr = contactArr;
			resolve();
		});
	});
	await Promise.all(_p);
	return {
		code: 200,
		msg: '查询成功',
		data: result,
	};
}

/**
 * 获取其它单列表
 */
this.getOtherOrderList = async params => {
	let { page, pageSize, keywords, filter, self_user_id } = params;
	page = page ? parseInt(page) : 1;
	pageSize = pageSize ? parseInt(pageSize) : 15;
	keywords = keywords ? keywords : '';
	filter = filter ? filter : {};
	filter = typeof filter === 'string' ? JSON.parse(filter) : filter;
	const where = {
		$and: {
			isdel: 0,
		},
		$or: {
			company: { $like: '%' + keywords + '%' },
			contact_name: { $like: '%' + keywords + '%' },
			contact_phone: { $like: '%' + keywords + '%' },
		}
	};
	if (self_user_id) where['$and'].create_person = self_user_id;
	const result = await OtherMsg.findAll({
		where,
		order: [['id', 'DESC']],
		limit: pageSize,
        offset: ( page - 1 ) * pageSize,
	});
	return {
		code: 200,
		msg: '查询成功',
		data: result,
	};
}

/**
 * 指定其它联系单
 */
this.targetOtherOrder = async params => {
	const { id } = params;
	const result = await OtherMsg.findOne({
		where: {
			id,
		}
	});
	return {
		code: 200,
		msg: '查询成功',
		data: result,
	};
}

/**
 * 创建其它联系单
 */
this.createOtherOrder = async params => {
	const { company, contact_name, contact_phone, self_user_id, type } = params;
	if (!contact_name) return { code: -1, msg: '联系人不能为空' };
	const result = await OtherMsg.create({
		company,
		contact_name,
		contact_phone,
		type,
		contact_time: TIME(),
		create_time: TIME(),
		create_person: self_user_id,
	});
	this.listenChangeTypeDInfo({
		company,
		staff: self_user_id,
		type: '候补联系单',
	});
	return { code: 200, msg: '创建成功', data: result };
}

/**
 * 删除其他联系单
 */
this.delOtherOrder = async params => {
	const { id } = params;
	await OtherMsg.update({ isdel: 1 }, { where: { id } });
	return { code: 200, msg: '删除成功' };
}

/**
 * 更新其他联系单
 */
this.updateOtherOrder = async params => {
	const result = await OtherMsg.update(params, { where: { id: params.id } });
	return { code: 200, msg: '更新成功', data: result };
}

/**
 * 更新其它联系单照片
 */
this.updateOtherOrderAlbum = async params => {
	const { id, album } = params;
	const result = await OtherMsg.findOne({
		where: {
			id,
		},
	});
	const originAlbum = result.album;
	let albumArr;
	try {
		albumArr = originAlbum.split(',').filter(items => items);
	} catch (e) {
		albumArr = [];
	}
	const index = albumArr.indexOf(album);
	if (index === -1) {
		albumArr.push(album);
	} else {
		albumArr.splice(index, 1);
	}
	const updateData = {
		album: albumArr.join(),
	};
	await OtherMsg.update(updateData, {
		where: { id }
	});
	return {
		code: 200,
		msg: '更新成功',
		data: [],
	};
}

/**
 * 根据单位名和模糊合同号搜索合同列表
 */
this.searchContractNo = async params => {
	const { company, keywords } = params;
	const cusResult = await Customers.findOne({ where: { company, isdel: 0 }});
	try {
		const { abb } = cusResult.dataValues;
		const contractResult = await ContractsHead.findAll({
			where: { isdel: 0, cus_abb: abb, contract_no: { $like: '%'+keywords+'%' }},
			limit: 10,
			offset: 0,
			order: [[ 'id', 'DESC' ]],
		});
		const resArr = contractResult.map(items => items.dataValues.contract_no);
		return resArr;
	} catch (e) {
		return [];
	}
}


/************************app相关接口******************************/


/**
 * 	触发发送测试连接短信
 *  @params.connect_test_arr 指定测试连接手机号
 */
this.triggerTestConnectSms = (params,cb) => {
	/**
	 * 	超时处理
	 *  @return Array
	 */
	let timeOut = (params,cb) => {
		let allSubArr = params.allSubArr;
		setTimeout(function(){
			//获取所有收到回馈的用户
			let p1 = new Promise((resolve,reject) => {
				redisClient.getCallBackAppUserList((result) => {
					resolve(result);
				});
			});
			Promise.all([p1]).then(result => {
				let hasCallBackArr = result[0]?result[0]:[''];
				let needHandleArr = [];
				for (var i = 0; i < allSubArr.length; i++) {
					for (var j = 0; j < hasCallBackArr.length; j++) {
						if(hasCallBackArr[j]==allSubArr[i]){
							break;
						}else if(allSubArr[i]!=hasCallBackArr[j]&&j==hasCallBackArr.length-1){
							needHandleArr.push(allSubArr[i]);
						}
					}
				}
				cb(needHandleArr);
				//清空App订阅未关闭后台者集合
				redisClient.setCallBackAppUserList(-10000,() => {});
			}).catch(e => LOG(e));
		},60*1000);
	}


	new Promise((resolve,reject) => {
		if(params&&params.connect_test_arr){
			resolve(connect_test_arr);
		}else{
			redisClient.PubAppUser((phone_arr) => {
				resolve(phone_arr);
			});
		}
	}).then((phone_arr) => {
		if(!phone_arr||phone_arr[0]==null){
			//没有人订阅
			cb({
				code: -1,
				msg: 'no subscriber',
				data: []
			});
		}else{
			let baseSMS = new base.SMS({
				template: 'test_connect_sms',
				mobiles: JSON.stringify(phone_arr),
				params: JSON.stringify([])
			});
			baseSMS.sendMsg(function(error,response,body){
				if(body.code==200){
					timeOut({
						allSubArr: phone_arr
					},arr => {
						/*如果都有反馈，则返回空数组*/
						cb({
							code: 200,
							msg: '测试连接完成',
							data: arr
						});
					});
				}else{
					cb({
						code: body.code,
						msg: body.msg,
						data: []
					});
				}
			});
		}
	}).catch(e => LOG(e));
}

/**
 * 	App收到测试短信后的返回
 *  测试链接(反馈)
 */
this.testConnect = function(params,cb){
	let test_date = params.test_date;
	let phone = params.self_phone;
	redisClient.setCallBackAppUserList(phone,() => {
		cb({
			code: 200,
			msg: '成功',
			data: []
		});
	});
}

/*********************************** 电话簿联系人 ******************************************/

this.addVerContacts = async params => {
	const { name, phone, company, job } = params;
	const result = await VerContacts.findOne({
		where: {
			name,
			phone,
			company,
			isdel: 0,
		},
	});
	if (result) return { code: -1, msg: '已经在电话簿了' };
	await VerContacts.create({
		name,
		phone,
		company,
		job,
	});
	return { code: 200, msg: '新增成功' };
}

this.updateCallTime = async params => {
	const { phone, time, staff_name } = params;
	await VerContacts.update({
		latest_call_time: time,
		staff_name,
	}, { where: { phone }});
	return { code: 200, msg: '更新成功' };
}

this.delVerContacts = async params => {
	const { id } = params;
	await VerContacts.update({
		isdel: 1,
	}, { where: { id }});
	return { code: 200, msg: '删除成功' };
}

this.getVerContacts = async () => {
	const result = await VerContacts.findAll({
		where: {
			isdel: 0,
			company: {
				$ne: '杭州朗杰测控技术开发有限公司',
			},
		},
	});
	const resArr = result.sort((a, b) => {
		return a.dataValues.name.localeCompare(b.dataValues.name);
	});
	return { code: 200, msg: '', data: resArr };
}

/*********************************************************************** */

// 给会员审核
this.checkTomember = async params => {
	// 检查是否已发送了回执
	const result = await MeetMsg.findOne({ where: { id: params.id }});
	if (result.dataValues.state !== 0) return { code: -1, msg: '非法操作' };
	// 检查是否是会员
	const { company, contact_phone, contact_time, create_person, solution_tag } = result.dataValues;
	const memberEntity = await Member.findOne({ where: { phone: contact_phone }});
	if (!memberEntity) return { code: -1, msg: '对方不是会员' };
	const updateResult = await this.updateMeetOrder(params);
	if (updateResult.code !== 200) return updateResult;
	// 发送通知给会员
	sendWxMessage(memberEntity);
	// 更新状态
	await MeetMsg.update({
		state: 3,
	}, {
		where: { id: params.id },
	});
	return {
		code: 200,
		msg: '发送成功',
		data: [],
	};

	function sendWxMessage(memebrResult) {
		if (CONFIG.DEBUG) return;
		const staffMapper = new base.StaffMap().getStaffMap();
		const create_person_name = staffMapper[create_person].user_name;
		const descpription = '请及时评价' + contact_time + '朗杰公司的上门服务质量';
		const { open_id } = memebrResult.dataValues;
		const secret = "langjie@network";
        let hash = crypto.createHmac('sha256',secret);
        hash.update(params.id.toString());
		let signature = hash.digest('base64');
		// const webHost = 'https://wx.langjie.com';
		const webHost = CONFIG.proxy_protocol+'://'+CONFIG.proxy_host+':'+CONFIG.proxy_port;
		request.get(webHost + '/wx/getToken',(err,response,body) => {
			body = typeof(body)=='object'?body:JSON.parse(body);
			let access_token;
			try{
				access_token = body.data.access_token;
			}catch(e){
				access_token = body.access_token;
			}
			// const msgUrl = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + access_token;
			const msgUrl = 'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=' + access_token;
			request.post(msgUrl,(err,response,body) => {
				LOG(body);
			}).form(JSON.stringify({
				"touser": open_id, 
				"template_id":"lKW9rIrI9iiRgwXZlpt6RZuoaFbKD-5hd7-yv8Ugprk",
				"url":"https://wx.langjie.com/html/service_evaluation.html?id=" + params.id + '&signature=' + signature + '&start_time=' + params.start_time + '&end_time=' + params.end_time + '&service_person=' + create_person_name,     
				"data": {
					"first": {
						"value": '朗杰测控邀请您对本次服务进行评价！',
						"color": '#173177'
					},
					"keyword1": {
						"value": create_person_name,
						"color": '#173177'
					},
					"keyword2": {
						"value": contact_time,
						"color": '#173177'
					},
				},
				// "touser": open_id,
				// "msgtype": "news",
				// "news": {
				// 	"articles": [{
				// 		"title": "服务评价",
				// 		"description": descpription,
				// 		"url": webHost + "/html/service_evaluation.html?id=" + params.id + '&signature=' + signature + '&start_time=' + params.start_time + '&end_time=' + params.end_time + '&service_person=' + create_person_name,
				// 	}]
				// }
			}));
		});
	}
}

// 服务评价
this.serviceEvalution = async params => {
	const that = this;
	const { service_quality, service_attitude, service_opinion, id, signature } = params;
	const secret = "langjie@network";
	let hash = crypto.createHmac('sha256',secret);
	hash.update(id.toString());
	const newSignature = hash.digest('base64');
	if (newSignature != signature) return { code: -1, msg: '数据遭破坏' };
	// 检查是否已经评价过
	const result = await MeetMsg.findOne({ where: { id } });
	const { state } = result.dataValues;
	if (state === 0) return { code: -1, msg: '当前状态无法评价' };
	if (state > 3) return { code: -1, msg: '您已评价过了' };
	await MeetMsg.update({
		service_quality,
		service_attitude,
		service_opinion,
		state: 6,
	}, {
		where: {
			id,
		}
	});
	// 发消息通知指派人
	that.sendMsgToDirector(id);
	// 上门服务反馈，增加积分
	sendServiceFeedbackMq(id);
	return { code: 200, msg: '评价成功' };

	async function sendServiceFeedbackMq(id) {
		const meetMsgEntity = await MeetMsg.findOne({ where: { id } });
		const { contact_phone, contact_name } = meetMsgEntity.dataValues;
		const memberEntity = await Member.findOne({ where: { name: contact_name, phone: contact_phone } });
		const { open_id, name } = memberEntity.dataValues;
		// 判断是否已经反馈过了
		const isExist = await BaseEvent.findOne({ where: { type: '1307', rem: id, isdel: 0 } });
		if (isExist) {
			return;
		}
		common.createEvent({
			headParams: {
				ownerId: open_id,
				type: '1307',
				time: TIME(),
				person: name,
				rem: id,
			},
			bodyParams: {},
		}, () => {});
		sendMQ.sendQueueMsg('memberActivity', JSON.stringify({
			_class: 'serviceFeedback',
			open_id,
		}), result => {
			console.log(result);
		});
	}
}

// 判断是否评价过了
this.checkServiceEvalution = async params => {
	const { id } = params;
	const result = await MeetMsg.findOne({ where: { id } });
	const { state } = result.dataValues;
	let code, msg;
	if (state > 3) {
		code = -1;
		msg = '您已评价过了';
	} else if (state == 0) {
		code = -1;
		msg = '已被撤回';
	} else {
		code = 200;
	}
	return {
		code,
		msg,
		data: result,
	};
}

// 给指派人审核
this.checkToDirector = async params => {
	const that = this;
	const updateResult = await this.updateMeetOrder(params);
	if (updateResult.code !== 200) return updateResult;
	// 更新状态
	await MeetMsg.update({
		state: 6,
	}, {
		where: { id: params.id },
	});
	// 发消息通知指派人
	that.sendMsgToDirector(params.id);
	return {
		code: 200,
		msg: '发送成功',
		data: [],
	};
}

// 发消息给指派人尽快审核
this.sendMsgToDirector = async id => {
	const result = await MeetMsg.findOne({ where: { id } });
	const { create_person, director } = result.dataValues;
	const staffMapper = new base.StaffMap().getStaffMap();
	const create_person_name = staffMapper[create_person].user_name;
	const mailId = Date.now();
	request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
		console.log(body);
	}).form({
		data: JSON.stringify({
			mailId: mailId,
			class: 'meetOrdersManage',
			priority: '普通',
			frontUrl: '/meetOrdersManage',
			sender: create_person,
			post_time: TIME(),
			title: '见面联系单管理',
			content: create_person_name + '提交了见面联系单，请及时审核！',
			votes: '已阅',
			subscriber: director,
			NotiClientSubs: [
				{
					receiver: director,
					noti_post_mailId: mailId
				}
			]
		})
	});
}

// 从指派人端撤回审核
this.recallFromDirector = async params => {
	// 更新状态
	await MeetMsg.update({
		state: 0,
	}, {
		where: { id: params.id },
	});
	return {
		code: 200,
		msg: '撤回成功',
		data: [],
	};
}

// 从会员端撤回审核
this.recallFromMember = async params => {
	// 更新状态
	await MeetMsg.update({
		state: 0,
	}, {
		where: { id: params.id },
	});
	return {
		code: 200,
		msg: '撤回成功',
		data: [],
	};
}

// 重新填写
this.reStart = async params => {
	// 更新状态
	await MeetMsg.update({
		state: 0,
		director_work_time: 0,
		check_work_time: 0,
		isEffect: 0,
	}, {
		where: { id: params.id },
	});
	return {
		code: 200,
		msg: '重置成功',
		data: [],
	};
}

// 同意普通见面联系单
this.normalAgree = async params => {
	await MeetMsg.update({
		state: 12,
		isEffect: 1,
	}, {
		where: { id: params.id },
	});
	return {
		code: 200,
		msg: '操作成功',
		data: [],
	};
}

// 不同意普通见面联系单
this.normalDisAgree = async params => {
	const { admin_id, id } = params;
	await MeetMsg.update({
		state: 0,
		isEffect: 0,
	}, {
		where: { id },
	});
	sendMsgToApplyer({
		id,
		admin_id,
	});
	return {
		code: 200,
		msg: '操作成功',
		data: [],
	};
}

// 同意上门服务见面联系单
this.agreeMeetOrder = async params => {
	const { id, director_work_time } = params;
	// 判断是否有合同号
	const meetMsgEntity = await MeetMsg.findOne({ where: { id } });
	if (meetMsgEntity.dataValues.contract_no) {
		await MeetMsg.update({
			state: 12,
			director_work_time: director_work_time,
			check_work_time: director_work_time,
			isEffect: 1,
		}, {
			where: { id },
		});
	} else {
		await MeetMsg.update({
			state: 12,
			director_work_time: director_work_time,
			check_work_time: 0,
			isEffect: 1,
		}, {
			where: { id },
		});
	}
	return {
		code: 200,
		msg: '操作成功',
		data: [],
	};
}

// 不同意上门服务见面联系单
this.disArgeeMeetOrder = async params => {
	const { id, admin_id } = params;
	await MeetMsg.update({
		state: 0,
	}, {
		where: { id },
	});
	sendMsgToApplyer({
		id,
		admin_id,
	});
	return {
		code: 200,
		msg: '操作成功',
		data: [],
	};
}

// 财务修改认定工时
this.meetOrderchangeWorkTime = async params => {
	const { id, check_work_time, check_rem, is_contract_server, admin_id } = params;
	await MeetMsg.update({
		check_work_time,
		check_rem,
		is_contract_server,
		check_time: TIME(),
		check_person: admin_id,
	}, {
		where: { id },
	});
	return {
		code: 200,
		msg: '操作成功',
		data: [],
	};
}

// 被退回审核时，通知对方
async function sendMsgToApplyer(params) {
	const { id, admin_id } = params;
	const result = await MeetMsg.findOne({ where: { id } });
	const { create_person } = result.dataValues;
	const staffMapper = new base.StaffMap().getStaffMap();
	const checker = staffMapper[admin_id].user_name;
	let create_person_name;
	try {
		create_person_name = staffMapper[create_person].user_name;
	} catch (e) {
		create_person_name = create_person;
	}
	const mailId = Date.now();
	request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
		console.log(body);
	}).form({
		data: JSON.stringify({
			mailId: mailId,
			class: 'meetOrdersManage',
			priority: '普通',
			frontUrl: '/meetOrdersManage',
			sender: admin_id,
			post_time: TIME(),
			title: '见面联系单管理',
			content: '退回了'+create_person_name+'的见面联系单，请重新填写',
			votes: '已阅',
			subscriber: create_person,
			NotiClientSubs: [
				{
					receiver: create_person,
					noti_post_mailId: mailId
				}
			]
		})
	});
}

// 监听D类客户意向度和业务员的变动
this.listenChangeTypeDInfo  = async params => {
	const { company, staff, type } = params;
	const customerEntity = await Customers.findOne({
		where: {
			isdel: 0,
			company,
		},
	});
	if (!customerEntity) return;
	const { user_id, manager } = customerEntity.dataValues;
	// const typeDInfoEntity = await TypeDInfo.findOne({
	// 	where: { customer_id: user_id },
	// });
	// if (!typeDInfoEntity) return;
	// const { id, intent_degree } = typeDInfoEntity.dataValues;
	// 判断意向度是否要变动
	await this.checkIntentChange(user_id, type);
	if (!manager) {
		const staffMapper = new base.StaffMap().getStaffMap();
		const staffName = staffMapper[staff].user_name;
		await Customers.update({
			manager: staffName,
		}, {
			where: {
				user_id,
			},
		});
	}
}

// 判断意向度是否要变动
this.checkIntentChange = async (user_id, type) => {
	const typeDInfoEntity = await TypeDInfo.findOne({
		where: { customer_id: user_id },
	});
	if (!typeDInfoEntity) return;
	const { id, intent_degree, hot_degree } = typeDInfoEntity.dataValues;
	if (intent_degree > 2) return;
	let new_intent_degree;
	if (intent_degree == 0) {
		if (type == '呼入') {
			new_intent_degree = 2;
		} else if (type == '见面联系单') {
			new_intent_degree = 3;
		} else {
			new_intent_degree = 1;
		}
	} else if (intent_degree == 1) {
		if (type == '呼入') {
			new_intent_degree = 2;
		} else if (type == '见面联系单') {
			new_intent_degree = 3;
		}
	} else if (intent_degree == 2) {
		if (type == '见面联系单') {
			new_intent_degree = 3;
		}
	}
	if (typeof new_intent_degree !== 'number') return;
	// 重新计算热度
	const newHotDegree = hot_degree + (new_intent_degree - intent_degree) * 10;
	await TypeDInfo.update({
		intent_degree: new_intent_degree,
		hot_degree: newHotDegree,
	}, {
		where: { id },
	});
}

exports.searchLatestContractNo = async params => {
	const { keywords } = params;
	const result = await Customers.findOne({ where: {
		$or: {
			company: { $like: '%'+keywords+'%' },
			abb: { $like: '%'+keywords+'%' },
		},
	}});
	if (!result) {
		return { code: -1, msg: '没有该公司' };
	}
	const abb = result.dataValues.abb;
	const contractEntity = await ContractsHead.findOne({
		where: {
			isdel: 0,
			cus_abb: abb,
		},
		order: [['sign_time', 'DESC']],
	});
	if (!contractEntity) {
		return { code: -1, msg: '找不到合同号' };
	}
	const { contract_no } = contractEntity.dataValues;
	return { code: 200, msg: '', data: {
		contract_no,
		abb,
	}};
}

exports.searchLatestViContractNo = async params => {
	const { keywords } = params;
	const result = await Customers.findOne({ where: {
		$or: {
			company: { $like: '%'+keywords+'%' },
			abb: { $like: '%'+keywords+'%' },
		},
	}});
	if (!result) {
		return { code: -1, msg: '没有该公司' };
	}
	const abb = result.dataValues.abb;
	const contractEntity = await ContractsHead.findOne({
		where: {
			isdel: 0,
			cus_abb: abb,
			contract_no: {
				$like: '%-V-%',
			},
		},
		order: [['id', 'DESC']],
	});
	if (!contractEntity) {
		return { code: -1, msg: '找不到合同号' };
	}
	const { contract_no } = contractEntity.dataValues;
	return { code: 200, msg: '', data: {
		contract_no,
		abb,
	}};
}