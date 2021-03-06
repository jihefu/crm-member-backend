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
					reject({ code: -100, msg: '???????????????' });
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
 * ????????????????????????
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
		priority: "??????",
		subscriber: staffList.join(),
		title: "???????????????",
		votes: "??????",
	};
	for (const key in params) {
		formData[key] = params[key];
	}
	serviceHomeNotiSys.notiClientAdd({
		form_data: formData,
	}, result => console.log(result));
}


/**
 * 	?????????????????????????????????????????????(????????????)
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
 * 	?????????????????????
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
 * 	????????????
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
 * 	?????????????????????????????????????????????????????????
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
 * 	???????????????????????????????????????
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
 * 	???????????????????????????????????????
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
 *  ????????????????????????
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
 *  ???????????????id
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
 *  ?????????????????????id
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
 *  ????????????
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
	// 		console.log('????????????1');
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
	// 		console.log('????????????2');
	// 	}).catch(e => LOG(e));
	// });
}

/**
 *  ????????????????????????
 *  2019.10.16??????
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
 *  ???????????????????????????????????????
 */
this.sendVPassMsgToLegalPerson = (params, cb) => {
	const { legalPerson, legalPersonPhone, company, name, phone } = params;

}

/**
 * ??????????????????
 * ????????????
 */
this.createError = (obj) => {
	const error = new Error(obj.msg);
	error.code = obj.code;
	return error;
}

/**
 * ??????????????????
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
 * ????????????
 */
this.eventMapper = () => {
	return {
		// ??????
		'1001': { comment: '??????' },
		'1002': { comment: '??????' },
		'1003': { comment: '??????' },
		'1004': { comment: '??????' },
		'1005': { comment: '??????' },
		// ??????
		'1101': { comment: '??????' },
		// ??????????????????
		'1201': { comment: '??????' },
		'1202': { comment: '??????' },
		'1203': { comment: '??????' },
		'1204': { comment: '?????????' },
		// ????????????
		'1301': { comment: '??????' },
		'1302': { comment: '??????' },
		'1303': { comment: '??????' },
		'1304': { comment: '??????' },
		'1305': { comment: '??????' },
		'1306': { comment: '????????????' },
		'1307': { comment: '??????????????????' },
		'1308': { comment: '?????????' },
		'1309': { comment: '?????????????????????' },
		'1310': { comment: '???????????????' },
		'1311': { comment: '?????????????????????' },
		'1312': { comment: '?????????' },
		'1313': { comment: '??????' },
		'1314': { comment: '?????????????????????' },
		'1315': { comment: '?????????????????????' },
		// ??????????????????
		'1401': { comment: '????????????30???' },
		'1402': { comment: '????????????10???' },
		'1403': { comment: '????????????0???' },
		// ???????????????????????????
		'1501': { comment: '?????????' },
		'1502': { comment: '?????????' },
		'1503': { comment: '?????????' },
		'1504': { comment: '???????????????????????????????????????????????????????????????' },
		// ????????????log??????
		'1601': { comment: '????????????log' },
		// ???????????????????????????log
		'1701': { comment: '????????????' },
		'1702': { comment: '??????' },
		'1703': { comment: '?????????' },
		// ??????????????????
		'1801': { comment: '???????????????????????? * n' },
		// ????????????????????????
		'1901': { comment: '??????????????????' },
		// ????????????
		'2001': { comment: '??????' },	// ?????????????????????
		'2002': { comment: '??????' },	// ?????????????????????
		'2003': { comment: '??????' },	// ?????????????????????
		'2004': { comment: '??????' },	// ?????????????????????
		'2005': { comment: '?????????' },	// ?????????????????????
		'2006': { comment: '?????????' },
		'2007': { comment: '?????????' },	// 20200924??????
	};
}

/**
 * ??????id??????????????????
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
 * ????????????
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
				msg: '????????????',
				data: result,
			});
		}).catch(e => { throw e });
	}).catch(e => cb(this.responseError(e)));
}

/**
 * ????????????
 * ?????????????????????????????????
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
 * ??????????????????
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
 * ????????????id
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
		// ?????? 0, 6, 8
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
 * ???????????????????????????????????????????????????????????????user_id
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
 * ??????typeCode?????????????????????????????????
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
		msg: '????????????',
		data: resArr,
	};
	// typeCode = parseInt(typeCode);
	// const codeArr = this.getCodeArr(typeCode);
	// const searchArr = [];
	// if (codeArr.indexOf(0) !== -1 ) searchArr.push(Customers.findAll({ where: { isdel: 0, company: '??????????????????????????????????????????'} }));
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
	// 	msg: '????????????',
	// 	data: resArr,
	// };
}

/**
 * ??????????????????????????????
 */
this.checkInfoValid = async params => {
	let { company, witness, verifiedPerson, witnessRelation, codeArr } = params;
	codeArr = codeArr.filter(items => items !== 0 && items !== 1);
	if (witness == verifiedPerson) return { code: -1, msg: '?????????????????????????????????' };
	if (codeArr.indexOf(2) !== -1) {
		// ????????????????????????
		const result = await EndUser.findOne({ where: { user_name: company, isdel: 0 } });
		if (!result) return { code: -1, msg: '??????????????????' };
		const verResult = await VerUnit.findOne({ where: { user_id: result.dataValues.user_id, isdel: 0, certified: 1 } });
		if (!verResult) return { code: -1, msg: '???????????????' };
	}
	if (codeArr.indexOf(4) !== -1) {
		// ???????????????????????????
		const result = await Buyer.findOne({ where: { company, isdel: 0 } });
		if (!result) return { code: -1, msg: '?????????????????????' };
		const verResult = await VerUnit.findOne({ where: { user_id: result.dataValues.user_id, isdel: 0, certified: 1 } });
		if (!verResult) return { code: -1, msg: '??????????????????' };
	}
	if (codeArr.indexOf(8) !== -1) {
		// ??????????????????????????????
		const result = await PublicRelationShip.findOne({ where: { company, isdel: 0 } });
		if (!result) return { code: -1, msg: '????????????????????????' };
		const verResult = await VerUnit.findOne({ where: { user_id: result.dataValues.user_id, isdel: 0, certified: 1 } });
		if (!verResult) return { code: -1, msg: '?????????????????????' };
	}
	// ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
	if (witnessRelation == '??????') {
		const result = await Staff.findOne({ where: { user_name: witness, isdel: 0 } });
		if (!result) return { code: -1, msg: '??????????????????' };
	} else if (witnessRelation == '??????') {
		// ??????????????????????????????????????????????????????
		const nameArr = await getVerPerson(company);
		if (nameArr.indexOf(witness) === -1) return { code: -1, msg: '??????????????????' };
	} else {
		const nameArr = await getVerPerson();
		if (nameArr.indexOf(witness) === -1) return { code: -1, msg: '?????????????????????' };
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