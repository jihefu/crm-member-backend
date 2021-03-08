var MemberMsg = require('../dao').MemberMsg;
var Member = require('../dao').Member;
var Customers = require('../dao').Customers;
var Users = require('../dao').Users;
var Staff = require('../dao').Staff;
var InfoMark = require('../dao').InfoMark;
const BaseEvent = require('../dao').BaseEvent;
const SubEventContent = require('../mongoModel/SubEventContent');
const EndUser = require('../dao').EndUser;
const Buyer = require('../dao').Buyer;
const PublicRelationShip = require('../dao').PublicRelationShip;
const sequelize = require('../dao').sequelize;
const Contacts = require('../dao').Contacts;
const VerUnit = require('../dao').VerUnit;
const bluebird = require("bluebird");
const base = require('./base');
let serviceHomeAffair, serviceHomeNotiSys;

this.middleMsg = function (obj, cb) {
	var name_arr = [], phone_arr = [];
	var p = new Promise(function (resolve, reject) {
		if (!obj.phone) {
			let p_arr = [];
			obj.name.forEach(function (items, index) {
				p_arr[index] = new Promise(function (reso, reje) {
					getMenberInfo(obj.name[index], function (result) {
						try {
							name_arr = obj.name;
							phone_arr.push(result.phone);
						} catch (e) {
							name_arr = obj.name;
							phone_arr.push(111111);
						}
						reso({ code: 200 });
					});
				});
			});
			Promise.all(p_arr).then(function (result) {
				resolve(result);
			}).catch(function (result) {
				reject(result);
			});
		} else {
			if (obj.name instanceof (Array)) {
				name_arr = obj.name;
				phone_arr = obj.phone;
				resolve({ code: 200 });
			}
		}
	});
	p.then(function () {
		obj.post_time = TIME();
		obj.model = obj.model ? obj.model : 'singleMsg';
		obj.url = obj.url ? obj.url : '';
		var p_arr = [];
		delete obj.name;
		name_arr.forEach(function (items, index) {
			p_arr[index] = new Promise(function (resolve, reject) {
				obj.name = name_arr[index];
				obj.phone = phone_arr[index];
				MemberMsg.create(obj).then(function () {
					resolve({ code: 200 });
				}).catch(function (e) {
					LOG(e);
					reject({ code: -100, msg: '数据库出错' });
				});
			});
		});
		Promise.all(p_arr).then(function (msg) {
			cb(msg[0]);
		}).catch(function (msg) {
			cb(msg);
		});
	}).catch(function (msg) {
		cb(msg);
	});
}
function getMenberInfo(name, cb) {
	Member.findAll({
		where: {
			name: name,
			isEffect: 1,
		}
	}).then(function (result) {
		try {
			cb(result[0].dataValues);
		} catch (e) {
			cb([]);
		}
	}).catch(function (e) {
		LOG(e);
	});
}

/**
 * 发送给会员接待处
 */
exports.sendToMemberAffair = async params => {
	if (!serviceHomeAffair) {
		serviceHomeAffair = require('./homeRoutineAffairs');
		serviceHomeNotiSys = require('./homeNotiSystem');
	}
	const staffList = await serviceHomeAffair.getStaffFromMemberAffair();
	const formData = {
		album: null,
		albumName: null,
		atSomeone: null,
		class: "respoAffair",
		content: '',
		file: null,
		fileName: null,
		frontUrl: "/memberAffairs",
		sender: '',
		isDelay: 0,
		isMeetingMsg: 0,
		non_str: 7755,
		noti_client_affair_group_uuid: CONFIG.memberAffairId,
		priority: "普通",
		subscriber: staffList.join(),
		title: "会员接待处",
		votes: "已阅",
	};
	for (const key in params) {
		formData[key] = params[key];
	}
	serviceHomeNotiSys.notiClientAdd({
		form_data: formData,
	}, result => console.log(result));
}


/**
 * 	客户用户英文缩写转换为中文缩写(包括全称)
 *  @return obj
 */
this.transToCnAbb = function (params, cb) {
	var abb = params.abb;
	Customers.findAll({
		where: {
			abb: abb,
			isdel: 0
		}
	}).then(function (result) {
		if (result[0] == null) {
			cb(abb);
		} else {
			cb(result[0].dataValues);
		}
	}).catch(function (e) {
		LOG(e);
	});
}

/**
 * 	工号转换为名字
 */
this.idTransToName = function (params, cb) {
	var user_id = params.user_id;
	Staff.findAll({
		where: {
			user_id: user_id,
			isdel: 0
		}
	}).then(function (result) {
		if (result[0] == null) {
			cb(user_id);
		} else {
			cb(result[0].dataValues.user_name);
		}
	}).catch(function (e) {
		LOG(e);
	});
}

/**
 * 	数组去重
 */
this.arrayUnique = function (arr) {
	Array.prototype.unique = function () {
		var res = [];
		var json = {};
		for (var i = 0; i < this.length; i++) {
			if (!json[this[i]]) {
				res.push(this[i]);
				json[this[i]] = 1;
			}
		}
		return res;
	}
	return arr.unique();
}

/**
 * 	根据中文公司名找出客户表或用户表的信息
 */
this.getInfoByCompanyInfo = function (company, cb) {
	Customers.findAll({
		where: {
			company: company,
			isdel: 0
		}
	}).then(function (result) {
		if (result[0] == null) {
			Users.findAll({
				where: {
					company: company,
					isdel: 0
				}
			}).then(function (result) {
				if (result[0] == null) {
					cb([]);
				} else {
					cb(result[0].dataValues);
				}
			}).catch(function (e) {
				LOG(e);
			});
		} else {
			cb(result[0].dataValues);
		}
	}).catch(function (e) {
		LOG(e);
	});
}

/**
 * 	电脑登陆，返回登陆者的工号
 */
this.pcAuth = (params, cb) => {
	let bs_name = params.bs_name;
	Staff.findAll({
		where: {
			'$or': {
				user_name: bs_name,
				user_id: bs_name,
				English_abb: bs_name,
				English_name: bs_name
			}
		}
	}).then(result => {
		try {
			cb(result[0].dataValues.user_id);
		} catch (e) {
			cb(bs_name);
		}
	}).catch(e => LOG(e));
}

/**
 * 	根据模糊公司名获取公司信息
 *  @return Array
 */
this.getCompanyInfoByCompanyName = async (params, cb) => {
	let cpy = params.company;
	const result = await VerUnit.findAll({
		where: {
			company: {
				'$like': '%' + cpy + '%'
			},
			certified: 1,
		},
	});
	const res_arr = result.map(items => items.dataValues);
	cb(res_arr);
	// Customers.findAll({
	// 	where: {
	// 		isdel: 0,
	// 		'$or': {
	// 			company: {
	// 				'$like': '%'+cpy+'%'
	// 			},
	// 			abb: {
	// 				'$like': '%'+cpy+'%'
	// 			},
	// 			cn_abb: {
	// 				'$like': '%'+cpy+'%'
	// 			}
	// 		}
	// 	}
	// }).then(result => {
	// 	let res_arr = [];
	// 	if(result[0]==null){
	// 		Users.findAll({
	// 			where: {
	// 				isdel: 0,
	// 				'$or': {
	// 					company: {
	// 						'$like': '%'+cpy+'%'
	// 					},
	// 					abb: {
	// 						'$like': '%'+cpy+'%'
	// 					},
	// 					cn_abb: {
	// 						'$like': '%'+cpy+'%'
	// 					}
	// 				}
	// 			}
	// 		}).then(result => {
	// 			if(result[0]!=null){
	// 				result.forEach((items,index) => {
	// 					res_arr.push(items.dataValues);
	// 				});
	// 				cb(res_arr);
	// 			}else{
	// 				cb(res_arr);
	// 			}
	// 		}).catch(e => LOG(e));
	// 	}else{
	// 		result.forEach((items,index) => {
	// 			res_arr.push(items.dataValues);
	// 		});
	// 		cb(res_arr);
	// 	}
	// }).catch(e => LOG(e));
}

/**
 *  员工名转换成工号
 */
this.staffNameTransToUserId = (params, cb) => {
	let { user_name } = params;
	Staff.findAll({
		where: {
			user_name: user_name
		}
	}).then(result => {
		if (result[0] == null) {
			cb(user_name);
		} else {
			cb(result[0].dataValues.user_id);
		}
	}).catch(e => LOG(e));
}

/**
 *  获取标记的id
 */
this.infoMark = (params, cb) => {
	const { type } = params;
	InfoMark.findAll({
		where: {
			type: type,
			isdel: 0
		}
	}).then(result => {
		let str = '';
		const id_arr = [];
		result.forEach((items, index) => {
			str += type + '.id=' + items.dataValues.tableId + ' OR ';
			id_arr.push(items.dataValues.tableId);
		});
		str = str.slice(0, str.length - 4);
		cb({
			str: str,
			id_arr: id_arr
		});
	}).catch(e => LOG(e));
}

/**
 *  直接获取标记的id
 */
this.infoMarkArr = (params, cb) => {
	const { type } = params;
	InfoMark.findAll({
		where: {
			type: type,
			isdel: 0
		}
	}).then(result => {
		const idArr = result.map(items => items.dataValues.tableId);
		cb(idArr);
	});
}

/**
 *  图片缩小
 */
this.resizePictureQuality = (params, cb) => {
	// fs.readdir('./public/img/contract',(err,result) => {
	// 	const _p = [];
	// 	result.forEach((items,index) => {
	// 		_p[index] = new Promise((resolve,reject) => {
	// 			let path = DIRNAME+'/public/img/contract/'+items;
	// 			let newPath = DIRNAME+'/public/img/contract/small_'+items;
	// 			dealImages(path).resize(35).save(newPath,{});
	// 			resolve();
	// 		});
	// 	});
	// 	Promise.all(_p).then(result => {
	// 		console.log('缩小完成1');
	// 	}).catch(e => LOG(e));
	// });
	// fs.readdir('./public/img/repair',(err,result) => {
	// 	const _p = [];
	// 	result.forEach((items,index) => {
	// 		_p[index] = new Promise((resolve,reject) => {
	// 			let path = DIRNAME+'/public/img/repair/'+items;
	// 			let newPath = DIRNAME+'/public/img/repair/small_'+items;
	// 			dealImages(path).resize(35).save(newPath,{});
	// 			resolve();
	// 		});
	// 	});
	// 	Promise.all(_p).then(result => {
	// 		console.log('缩小完成2');
	// 	}).catch(e => LOG(e));
	// });
}

/**
 *  搜索客户用户信息
 *  2019.10.16修改
 */
this.searchCusAndUserInfo = (params, cb) => {
	let keywords = params.keywords;
	const _p = [];
	_p[0] = new Promise((resolve, reject) => {
		Customers.findAll({
			where: {
				isdel: 0,
				'$or': {
					company: {
						'$like': '%' + keywords + '%'
					},
					abb: {
						'$like': '%' + keywords + '%'
					},
					cn_abb: {
						'$like': '%' + keywords + '%'
					}
				}
			}
		}).then(result => {
			resolve(result);
		}).catch(e => LOG(e));
	});
	_p[1] = new Promise((resolve, reject) => {
		EndUser.findAll({
			where: {
				isdel: 0,
				'$or': {
					user_name: {
						'$like': '%' + keywords + '%'
					},
				}
			}
		}).then(result => {
			result.forEach((items, index) => {
				result[index].dataValues.company = items.dataValues.user_name;
				result[index].dataValues.abb = items.dataValues.user_name;
				result[index].dataValues.cn_abb = items.dataValues.user_name;
			});
			resolve(result);
		}).catch(e => LOG(e));
	});
	Promise.all(_p).then(result => {
		let res_arr = [...result[0], ...result[1]];
		let cbArr = [], hashObj = {};
		res_arr.forEach((items, index) => {
			if (!hashObj[items.dataValues.company]) {
				cbArr.push(items);
				hashObj[items.dataValues.company] = 1;
			}
		});
		cb(cbArr);
	}).catch(e => LOG(e));
}

/**
 *  发送会员认证通过信息给法人
 */
this.sendVPassMsgToLegalPerson = (params, cb) => {
	const { legalPerson, legalPersonPhone, company, name, phone } = params;

}

/**
 * 生成异常对象
 * 工厂模式
 */
this.createError = (obj) => {
	const error = new Error(obj.msg);
	error.code = obj.code;
	return error;
}

/**
 * 异常返回处理
 * @param {object} e 
 */
this.responseError = (e) => {
	if (!e.code) e.code = -1;
	if (!e.data) e.data = [];
	if (e.code == -1) LOG(e);
	return {
		code: e.code,
		msg: e.message,
		data: e.data
	};
}

/**
 * 事件类型
 */
this.eventMapper = () => {
	return {
		// 物品
		'1001': { comment: '入库' },
		'1002': { comment: '转手' },
		'1003': { comment: '拍照' },
		'1004': { comment: '出库' },
		'1005': { comment: '扫描' },
		// 事务
		'1101': { comment: '归档' },
		// 软件版本管理
		'1201': { comment: '发言' },
		'1202': { comment: '发布' },
		'1203': { comment: '测评' },
		'1204': { comment: '分版本' },
		// 会员活动
		'1301': { comment: '签到' },
		'1302': { comment: '到款' },
		'1303': { comment: '阅读' },
		'1304': { comment: '分享' },
		'1305': { comment: '考试' },
		'1306': { comment: '确认收货' },
		'1307': { comment: '上门服务反馈' },
		'1308': { comment: '介绍分' },
		'1309': { comment: '新会员商务认证' },
		'1310': { comment: '线上发消息' },
		'1311': { comment: '参与小程序报名' },
		'1312': { comment: '云登录' },
		'1313': { comment: '竞猜' },
		'1314': { comment: '后台录入元宝分' },
		'1315': { comment: '新会员注册奖励' },
		// 信用到期记录
		'1401': { comment: '信用到期30天' },
		'1402': { comment: '信用到期10天' },
		'1403': { comment: '信用到期0天' },
		// 考勤事务系统未处理
		'1501': { comment: '未阅读' },
		'1502': { comment: '未答复' },
		'1503': { comment: '未更新' },
		'1504': { comment: '未更新扫描到时，假装发言，防止明天又被记录' },
		// 群发短信log记录
		'1601': { comment: '群发短信log' },
		// 会员参加凉爽一夏的log
		'1701': { comment: '直接中奖' },
		'1702': { comment: '猜中' },
		'1703': { comment: '未猜中' },
		// 试产品责任人
		'1801': { comment: '试产品借用满一月 * n' },
		// 会员参加活动记录
		'1901': { comment: '会员参加活动' },
		// 交易中心
		'2001': { comment: '转手' },	// 控制器转手记录
		'2002': { comment: '销售' },	// 控制器销售记录
		'2003': { comment: '退货' },	// 控制器退货记录
		'2004': { comment: '判定' },	// 控制器判定记录
		'2005': { comment: '抵价券' },	// 抵价券转手记录
		'2006': { comment: '保证金' },
		'2007': { comment: '积分券' },	// 20200924移除
	};
}

/**
 * 根据id获取相关事件
 */
this.getEventById = (params, cb) => {
	const { ownerId, type } = params;
	const that = this;
	const where = {
		isdel: 0,
		ownerId,
	};
	if (type) where.type = { '$in': type };
	BaseEvent.findAll({
		where,
		order: [['time', 'DESC'], ['id', 'DESC']],
	}).then(result => {
		const _p = [];
		result.forEach((items, index) => {
			_p[index] = new Promise((resolve, reject) => {
				const i = index;
				result[i].dataValues.typeValue = that.eventMapper()[items.type].comment;
				SubEventContent.findById(items.dataValues.contentId, (err, mongoRes) => {
					if (err) return reject(e);
					result[i].dataValues.content = mongoRes;
					resolve();
				});
			});
		});
		return Promise.all(_p).then(() => {
			cb({
				code: 200,
				msg: '',
				data: result,
			});
		}).catch(e => { throw e });
	}).catch(e => cb(this.responseError(e)));
}

/**
 * 新增事件
 */
this.createEvent = (params, cb) => {
	const { headParams, bodyParams, model } = params;
	let contentId;
	return new Promise((resolve, reject) => {
		SubEventContent.create(bodyParams, (err, result) => {
			if (err && model) return model.destroy({ force: true, where: { id: headParams.ownerId } }).then(() => reject(err)).catch(e => reject(err));
			if (err) return reject(err);
			contentId = result._id.toString();
			resolve();
		});
	}).then(() => {
		headParams.contentId = contentId;
		return BaseEvent.create(headParams).then(result => {
			cb({
				code: 200,
				msg: '新增成功',
				data: result,
			});
		}).catch(e => { throw e });
	}).catch(e => cb(this.responseError(e)));
}

/**
 * 交易记录
 * 销售，转手，退货，判定
 */
this.getTradingRecordByOwnerId = async (ownerId, typeArr) => {
	const self = this;
	typeArr = typeArr ? typeArr : [ '2001', '2002', '2003', '2004' ];
	const list = await BaseEvent.findAll({ where: { ownerId, type: { $in: typeArr }, isdel: 0 }, order: [['time', 'DESC']] });
	await bluebird.map(list, async items => {
		items.dataValues.content = {};
		const { contentId } = items.dataValues;
		await new Promise(async (resolve, reject) => {
			SubEventContent.findById(contentId, (err, mongoRes) => {
				if (err) return reject(e);
				items.dataValues.content = mongoRes;
				resolve();
			});
		});
	}, { concurrency: 5 });
	const resArr = [];
	for (let i = 0; i < list.length; i++) {
		const transferor_person = transToName(list[i].dataValues.content.dealTransferorPerson);
		const transferee_person = transToName(list[i].dataValues.content.dealTransfereePerson);
		const entity = {
			no: list[i].dataValues.ownerId,
			no_type: list[i].dataValues.content.dealType,
			transferor: list[i].dataValues.content.dealTransferor,
			transferor_person,
			transferee: list[i].dataValues.content.dealTransferee,
			transferee_person,
			type: self.eventMapper()[list[i].dataValues.type].comment,
			credentials: list[i].dataValues.content.dealCredentials,
			create_time: list[i].dataValues.time,
			create_type: list[i].dataValues.content.dealCreateType,
			create_person: list[i].dataValues.content.dealCreatePerson,
			rem: list[i].dataValues.rem,
		};
		resArr.push(entity);
	}
	return resArr;

	function transToName(str) {
		const staffMapper = new base.StaffMap().getStaffMap();
		if (/\d/.test(str)) {
			for (const key in staffMapper) {
				if (key == str) {
					str = staffMapper[key].user_name;
				}
			}
		}
		return str;
	}
}

/**
 * 新增交易记录
 */
this.createTradingRecord = async params => {
	const { type, no, noType, transferor, transferorPerson, transferee, transfereePerson, credentials, createType, createPerson } = params;
	const result = await new Promise(async resolve => {
		this.createEvent({
			headParams: {
				type,
				ownerId: no,
				time: TIME(),
			},
			bodyParams: {
				dealNo: no,
				dealType: noType,
				dealTransferor: transferor,
				dealTransferorPerson: transferorPerson,
				dealTransferee: transferee,
				dealTransfereePerson: transfereePerson,
				dealCredentials: credentials,
				dealCreateType: createType,
				dealCreatePerson: createPerson,
			},
		}, result => resolve(result));
	});
	return result;
}

/**
 * 生成单位id
 */
this.createCompanyId = async () => {
	const t = await sequelize.transaction();
	try {
		const customerItem = await sequelize.query('SELECT user_id FROM customers ORDER BY user_id DESC LIMIT 0,1 FOR UPDATE', { transaction: t });
		const endUserItem = await sequelize.query('SELECT user_id FROM end_user ORDER BY user_id DESC LIMIT 0,1 FOR UPDATE', { transaction: t });
		const buyerItem = await sequelize.query('SELECT user_id FROM buyer ORDER BY user_id DESC LIMIT 0,1 FOR UPDATE', { transaction: t });
		const publicRelationShipItem = await sequelize.query('SELECT user_id FROM public_relation_ship ORDER BY user_id DESC LIMIT 0,1 FOR UPDATE', { transaction: t });
		t.commit();
		const customerId = customerItem[0].length !== 0 ? Number(customerItem[0][0].user_id) : 0;
		const endUserId = endUserItem[0].length !== 0 ? Number(endUserItem[0][0].user_id) : 0;
		const buyerId = buyerItem[0].length !== 0 ? Number(buyerItem[0][0].user_id) : 0;
		const publicRelationShipId = publicRelationShipItem[0].length !== 0 ? Number(publicRelationShipItem[0][0].user_id) : 0;
		let max = customerId;
		[customerId, endUserId, buyerId, publicRelationShipId].forEach((items, index) => {
			if (items > max) {
				max = items;
			}
		});
		// 结尾 0, 6, 8
		do {
			++max;
			if (max == 1000) max = max * 10;
		} while ([0, 6, 8].indexOf(max % 10) === -1);
		return max;
	} catch (e) {
		t.rollback();
		return e;
	}
}

/**
 * 检查别的系统中是否已存在该公司，没有则创建user_id
 */
this.checkOtherSysExistCompany = async company => {
	const resCustomer = Customers.findOne({ where: { isdel: 0, company } });
	const resEndUser = EndUser.findOne({ where: { isdel: 0, user_name: company } });
	const resBuyer = Buyer.findOne({ where: { isdel: 0, company } });
	const resPublicRelationShip = PublicRelationShip.findOne({ where: { isdel: 0, company } });
	let result = await Promise.all([resCustomer, resEndUser, resBuyer, resPublicRelationShip]);
	result = result.filter(items => items);
	if (result.length === 0) return await this.createCompanyId();
	return result[0].dataValues.user_id;
}

this.getCodeArr = num => {
	const arr = [];
	let standArr = [0, 1, 2, 4, 8];
	if (dealer(num, standArr)) return arr;

	function dealer(num, standArr) {
		if (standArr.indexOf(num) !== -1) {
			arr.push(num);
			return true;
		}
		for (let i = 0; i < standArr.length; i++) {
			if (num > standArr[i] && (i === standArr.length - 1 || num < standArr[i + 1])) {
				arr.push(standArr[i]);
				num = num - standArr[i];
				standArr = standArr.slice(0, i);
				break;
			}
		}
		return dealer(num, standArr);
	}
}

/**
 * 根据typeCode搜索不同系统中的公司名
 */
this.searchCpy = async params => {
	let { keywords } = params;
	const result = await VerUnit.findAll({ where: { isdel: 0, company: { $like: '%' + keywords + '%' } } });
	const resArr = [];
	result.forEach(items => {
		const company = items.dataValues.company;
		resArr.push({
			text: company,
			value: company,
			data: {
				user_id: items.user_id,
			},
		});
	});
	return {
		code: 200,
		msg: '查询成功',
		data: resArr,
	};
	// typeCode = parseInt(typeCode);
	// const codeArr = this.getCodeArr(typeCode);
	// const searchArr = [];
	// if (codeArr.indexOf(0) !== -1 ) searchArr.push(Customers.findAll({ where: { isdel: 0, company: '杭州朗杰测控技术开发有限公司'} }));
	// if (codeArr.indexOf(1) !== -1) searchArr.push(Customers.findAll({ where: { isdel: 0, company: { $like: '%'+keywords+'%' }} }));
	// if (codeArr.indexOf(2) !== -1) searchArr.push(EndUser.findAll({ where: { isdel: 0, user_name: { $like: '%'+keywords+'%' }} }));
	// if (codeArr.indexOf(4) !== -1) searchArr.push(Buyer.findAll({ where: { isdel: 0, company: { $like: '%'+keywords+'%' }} }));
	// if (codeArr.indexOf(8) !== -1) searchArr.push(PublicRelationShip.findAll({ where: { isdel: 0, company: { $like: '%'+keywords+'%' }} }));
	// let result = await Promise.all(searchArr);
	// result = result.filter(items => items);
	// const resArr = [];
	// const hashMap = {};
	// result.forEach((items, index) => {
	// 	items.forEach((it, ind) => {
	// 		const company = it.dataValues.company ? it.dataValues.company : it.dataValues.user_name;
	// 		if (!hashMap[company]) {
	// 			hashMap[company] = 1;
	// 			resArr.push({
	// 				text: company,
	// 				value: company,
	// 			});
	// 		}
	// 	});
	// });
	// return {
	// 	code: 200,
	// 	msg: '查询成功',
	// 	data: resArr,
	// };
}

/**
 * 检查认证信息是否合法
 */
this.checkInfoValid = async params => {
	let { company, witness, verifiedPerson, witnessRelation, codeArr } = params;
	codeArr = codeArr.filter(items => items !== 0 && items !== 1);
	if (witness == verifiedPerson) return { code: -1, msg: '认证人和证明人不能相同' };
	if (codeArr.indexOf(2) !== -1) {
		// 判断用户是否存在
		const result = await EndUser.findOne({ where: { user_name: company, isdel: 0 } });
		if (!result) return { code: -1, msg: '不存在该用户' };
		const verResult = await VerUnit.findOne({ where: { user_id: result.dataValues.user_id, isdel: 0, certified: 1 } });
		if (!verResult) return { code: -1, msg: '用户未认证' };
	}
	if (codeArr.indexOf(4) !== -1) {
		// 判断供应商是否存在
		const result = await Buyer.findOne({ where: { company, isdel: 0 } });
		if (!result) return { code: -1, msg: '不存在该供应商' };
		const verResult = await VerUnit.findOne({ where: { user_id: result.dataValues.user_id, isdel: 0, certified: 1 } });
		if (!verResult) return { code: -1, msg: '供应商未认证' };
	}
	if (codeArr.indexOf(8) !== -1) {
		// 判断公共关系是否存在
		const result = await PublicRelationShip.findOne({ where: { company, isdel: 0 } });
		if (!result) return { code: -1, msg: '不存在该公共关系' };
		const verResult = await VerUnit.findOne({ where: { user_id: result.dataValues.user_id, isdel: 0, certified: 1 } });
		if (!verResult) return { code: -1, msg: '公共关系未认证' };
	}
	// 如果关系是员工，判断该员工是否有效，如果关系是同事，判断该员工是否有效，如果别的关系，则直接通过
	if (witnessRelation == '员工') {
		const result = await Staff.findOne({ where: { user_name: witness, isdel: 0 } });
		if (!result) return { code: -1, msg: '不存在该员工' };
	} else if (witnessRelation == '同事') {
		// 找出认证联系人和认证会员是否存在该人
		const nameArr = await getVerPerson(company);
		if (nameArr.indexOf(witness) === -1) return { code: -1, msg: '不存在该同事' };
	} else {
		const nameArr = await getVerPerson();
		if (nameArr.indexOf(witness) === -1) return { code: -1, msg: '不存在该证明人' };
	}
	return {
		code: 200,
		msg: '',
		data: [],
	};

	async function getVerPerson(company) {
		const nameArr = [];
		const where = {
			isdel: 0,
			verified: 1,
		};
		if (company) where.company = company;
		const contactArr = await Contacts.findAll({ where });
		contactArr.forEach((items, index) => { nameArr.push(items.dataValues.name) });
		where.checked = 1;
		delete where.verified;
		const memberArr = await Member.findAll({ where });
		memberArr.forEach((items, index) => { nameArr.push(items.dataValues.name) });
		return nameArr;
	}
}