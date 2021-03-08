const request = require('request');
const crypto = require('crypto');
const Contacts = require('../dao').Contacts;
const Customers = require('../dao').Customers;
const Staff = require('../dao').Staff;
const Member = require('../dao').Member;
const sequelize = require('../dao').sequelize;
const base = require('./base');
const common = require('./common');
const serviceHomeCustomers = require('./homeCustomers');
const serviceHomeMember = require('./homeMember');
const serviceHomeOrders = require('./homeContactsOrder');
const serviceHomeNotiSystem = require('./homeNotiSystem');
const servicehyApp = require('./hybrid_app');
const VerUnit = require('../dao').VerUnit;
const bluebird = require('bluebird');

/**
 *  新版检查联系人信息合法性
 *  2019.10.16修改为认证单位
 *  @param { object } company,witness,verifiedPerson
 */
class CheckContactInfo {
	constructor(params){
		this.params = params;
	}

	//确认该联系人的公司是否认证
	async checkCompanyReg(cb){
		const { company } = this.params;
		const result = await VerUnit.findOne({ where: { company, certified: 1 } });
		if (result) {
			cb({
				code: 200,
				msg: '该公司认证已通过',
				data: []
			});
		} else {
			cb({
				code: -1,
				msg: '该公司不存在或未认证',
				data: []
			});
		}
		// serviceHomeCustomers.orderParamsList({
		// 	company: company,
		// 	certified: 1,
		// 	isdel: 0
		// },result => {
		// 	if(result.data[0]==null){
		// 		cb({
		// 			code: -1,
		// 			msg: '该公司不存在或未认证',
		// 			data: []
		// 		});
		// 	}else{
		// 		cb({
		// 			code: 200,
		// 			msg: '该公司认证已通过',
		// 			data: []
		// 		});
		// 	}
		// });
	}

	//确认当关系为员工时，证明人确实是员工
	checkStaffAsWitness(cb){
		const { witness } = this.params;
		Staff.findAll({
			where: {
				user_name: witness
			}
		}).then(result => {
			if(result[0]==null){
				cb({
					code: -1,
					msg: '不存在该员工',
					data: []
				});
			}else{
				cb({
					code: 200,
					msg: '存在该员工',
					data: []
				});
			}
		}).catch(e => LOG(e));
	}

	//确认当关系为同事时，确认证明人确实是同一家公司的，并且已经认证过了
	checkCooperAsWitness(cb){
		const { witness,company } = this.params;
		Contacts.findAll({
			where: {
				name: witness,
				company: company,
				verified: 1,
				isdel: 0
			}
		}).then(result => {
			if(result[0]==null){
				Member.findAll({
					where: {
						name: witness,
						company: company,
						checked: 1
					}
				}).then(result => {
					if(result[0]==null){
						cb({
							code: -1,
							msg: '不存在该证明人或该证明人认证未通过',
							data: []
						});
						// Customers.findAll({
						// 	where: {
						// 		company: company
						// 	}
						// }).then(result => {
						// 	if(result[0]==null){
						// 		cb({
						// 			code: -1,
						// 			msg: '不存在该证明人或该证明人认证未通过',
						// 			data: []
						// 		});
						// 	}else{
						// 		let legalPersonArr = [result[0].dataValues.legal_person];
						// 		let regPersonArr,partnerArr;
						// 		try{	
						// 			regPersonArr = result[0].dataValues.legal_person.split(',');
						// 		}catch(e){
						// 			regPersonArr = [];
						// 		}
						// 		try{	
						// 			partnerArr = result[0].dataValues.partner.split(',');
						// 		}catch(e){
						// 			partnerArr = [];
						// 		}
						// 		let allArr = [...legalPersonArr,...regPersonArr,...partnerArr];
						// 		if(allArr.indexOf(witness)==-1){
						// 			cb({
						// 				code: -1,
						// 				msg: '不存在该证明人或该证明人认证未通过',
						// 				data: []
						// 			});
						// 		}else{
						// 			cb({
						// 				code: 200,
						// 				msg: '存在该证明人',
						// 				data: []
						// 			});
						// 		}
						// 	}
						// }).catch(e => LOG(e));
					}else{
						cb({
							code: 200,
							msg: '存在该证明人',
							data: []
						});
					}
				}).catch(e => LOG(e));
			}else{
				cb({
					code: 200,
					msg: '存在该证明人',
					data: []
				});
			}
		}).catch(e => LOG(e));
	}

	//确认为其他关系时，证明人必须是会员或认证联系人，不必同一家公司
	checkOtherAsWitness(cb){
		const { witness } = this.params;
		const _p = [];
		_p[0] = new Promise((resolve,reject) => {
			Member.findAll({
				where: {
					name: witness,
					checked: 1
				}
			}).then(result => {
				let _arr = result.map(items => items.dataValues.name);
				resolve(_arr);
			}).catch(e => LOG(e));
		});
		_p[1] = new Promise((resolve,reject) => {
			Contacts.findAll({
				where: {
					name: witness,
					verified: 1
				}
			}).then(result => {
				let _arr = result.map(items => items.dataValues.name);
				resolve(_arr);
			}).catch(e => LOG(e));
		});
		Promise.all(_p).then(result => {
			const allArr = [...result[0],...result[1]];
			if(allArr.indexOf(witness)==-1){
				cb({
					code: -1,
					msg: '不存在该证明人',
					data: []
				});
			}else{
				cb({
					code: 200,
					msg: '认证通过',
					data: []
				});
			}
		}).catch(e => LOG(e));
	}

	//确认当关系为员工时，证明人与认证人不是同一个人
	checkNotSamePerson(cb){
		const { verifiedPerson,witness } = this.params;
		if(verifiedPerson==witness){
			cb({
				code: -1,
				msg: '证明人与认证人不能重复',
				data: []
			});
		}else{
			cb({
				code: 200,
				msg: '',
				data: []
			});
		}
	}
}

/**
 *	联系人数据列表
 */
this.list = (params,cb) => {
	let num = params.num?parseInt(params.num):10;
	let page = params.page?parseInt(params.page):1;
	let keywords = params.keywords?params.keywords:'';
	let order = params.order?params.order:'id';
	let filter = JSON.parse(params.filter);
	if(order=='id'){
		order = ['id', 'DESC'];
	}else if(order=='update_time'){
		order = ['update_time','DESC'];
	}
	let markOrder;
	common.infoMark({
		type: 'Contacts'
	},resObj => {
		const { str,id_arr } = resObj;
		if(str){
			markOrder =	[[sequelize.literal('if('+str+',0,1)')],order];
		}else{
			markOrder =	[order];
		}
		let filterVerifiedArr = filter.verified.split(',').filter(items => items);
		let is_member_arr = [];
		try {
			is_member_arr = filter.is_member.split(',').filter(items => items);
		} catch (e) {
			is_member_arr = [];
		}
		filterVerifiedArr.forEach((items,index) => {
			if(items=='已认证'){
				filterVerifiedArr[index] = 1;
			}else if(items=='待认证'){
				filterVerifiedArr[index] = 0;
			}else if(items=='认证申请中'){
				filterVerifiedArr[index] = 3;
			}else{
				filterVerifiedArr[index] = 2;
			}
		});
		let where = {	
			isdel: 0,
			'$or': {
				company: {
					'$like': '%'+keywords+'%'
				},
				name: {
					'$like': '%'+keywords+'%'
				},
				phone1: {
					'$like': '%'+keywords+'%'
				},
				phone2: {
					'$like': '%'+keywords+'%'
				}
			}
		};
		if(filterVerifiedArr[0]!=null){
			where.verified = {
				'$in': filterVerifiedArr
			};
		}
		if (is_member_arr.length === 1) {
			if (is_member_arr[0] === '是') {
				where.is_member = 1;
			} else {
				where.is_member = 0;
			}
		}
		Contacts.findAndCountAll({
			where: where,
			limit: num,
			offset: (page -1) * num,
			order: markOrder
		}).then(result => {
			let res_arr = [],_p = [];
			const staffMap = new base.StaffMap().getStaffMap();
			result.rows.forEach((items,index) => {
				res_arr.push(items.dataValues);
				_p[index] = new Promise((resolve,reject) => {
					try{
						items.dataValues.update_person = staffMap[items.dataValues.update_person].user_name;
					}catch(e){}
					try{
						items.dataValues.insert_person = staffMap[items.dataValues.insert_person].user_name;
					}catch(e){}
					try{
						items.dataValues.verifiedPerson = staffMap[items.dataValues.verifiedPerson].user_name;
					}catch(e){}
					resolve();
				});
			});
			Promise.all(_p).then(() => {
				for (let i = 0; i < id_arr.length; i++) {
					for (let j = 0; j < res_arr.length; j++) {
						if(id_arr[i]==res_arr[j].id){
							break;
						}else if(id_arr[i]!=res_arr[j].id&&j==res_arr.length-1){
							id_arr.splice(i,1);
							i--;
						}
					}
				}
				cb({
					code: 200,
					msg: '',
					data: {
						data: res_arr,
						id_arr: id_arr,
						total: result.count
					}
				});
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	});
}

/**
 *  根据id获取指定联系人条目
 */
this.getTargetItem = (params,cb) => {
	const { id } = params;
	Contacts.findOne({
		where: {
			id: id
		}
	}).then(result => {
		const staffMap = new base.StaffMap().getStaffMap();
		try{
			result.dataValues.insert_person = staffMap[result.dataValues.insert_person]['user_name'];
		}catch(e){}
		try{
			result.dataValues.update_person = staffMap[result.dataValues.update_person]['user_name'];
		}catch(e){}
		try{
			result.dataValues.verifiedPerson = staffMap[result.dataValues.verifiedPerson]['user_name'];
		}catch(e){}
		cb({
			code: 200,
			msg: '',
			data: result
		});
	}).catch(e => LOG(e));
}

/**
 *  指定参数搜索
 */
this.orderParamsList = (params,cb) => {
	Contacts.findAll({
		where: params
	}).then(result => {
		cb({
			code: 200,
			msg: '',
			data: result
		});
	}).catch(e => LOG(e));
}

/**
 *	插入联系人数据列表
 */
this.add = (params,cb) => {
	let { form_data,admin_id, isCover } = params;
	const that = this;
	form_data = JSON.parse(form_data);
	form_data.update_person = admin_id;
	form_data.update_time = TIME();
	form_data.insert_time = TIME();
	form_data.insert_person = admin_id;
	this.checkExist(form_data,_result => {
		if(_result.code==-1){
			cb(_result);
		}else{
			this.validateCertified(form_data,result => {
				if(result.code==-1){
					cb(result);
				}else{
					Contacts.create(form_data).then(async result => {
						if (isCover) {
							await copyContactInfo(form_data, result.id);
						}
						cb({
							code: 200,
							msg: '新增成功',
							data: []
						});
						require('../cache/cacheCustomerInfo').clearCache();
						// that.transTypeLevel({
						// 	name: form_data.name,
						// 	company: form_data.company,
						// 	verified: form_data.verified
						// },result => {
						// 	console.log(result);
						// });
					}).catch(e => LOG(e));
				}
			});
		}
	});

	async function copyContactInfo(params, newId) {
		const { name, company } = params;
		const resultArr = await Contacts.findAll({
			where: {
				name,
				company,
				isdel: 0,
			},
			order: [[ 'id' ]],
		});
		const sample = resultArr[0].dataValues;
		delete sample.id;
		delete sample.phone1;
		sample.insert_person = admin_id;
		sample.update_person = admin_id;
		sample.insert_time = TIME();
		sample.update_time = TIME();
		await Contacts.update(sample, { where: { id: newId } });
	}
}

this.checkAdd = async params => {
	const { name, phone, company } = params;
	try {
		await new Promise((resolve, reject) => {
			this.checkExist({
				name,
				phone1: phone,
				company,
			}, _result => {
				if (_result.code == -1) {
					reject(_result);
				} else {
					resolve();
				}
			});
		});
	} catch (e) {
		return e;
	}
	const result = await Contacts.findOne({
		where: {
			name,
			company,
			isdel: 0,
		},
	});
	if (result) {
		return { code: -100, msg: '检测到该公司已存在该联系人，是否复制联系人信息？' };
	} else {
		return { code: 200, msg: '不存在该联系人' };
	}
}

/**
 *	更新联系人数据列表
 */
this.update = (params,cb) => {
	let { form_data,admin_id } = params;
	const that = this;
	form_data = JSON.parse(form_data);
	form_data.update_person = admin_id;
	form_data.update_time = TIME();
	delete form_data.insert_person;
	this.checkExist(form_data,_result => {
		if(_result.code==-1){
			cb(_result);
		}else{
			this.validateCertified(form_data,result => {
				if(result.code==-1){
					cb(result);
				} else {
					dealer();
				}
			});

			async function dealer() {
				// const result = await common.checkInfoValid({
                //     company: form_data.company,
                //     witness: form_data.witness,
                //     verifiedPerson: form_data.check_person,
                //     witnessRelation: form_data.witnessRelation,
                //     codeArr,
                // });
                // if (result.code == -1) return cb(result);
				common.staffNameTransToUserId({
					user_name: form_data.verifiedPerson
				},user_id => {
					form_data.verifiedPerson = user_id;
					/******** 认证单独拿出 *******/
					if(form_data.verified==3&&form_data.witnessRelation=='员工'){
						that.applyVerified({
							form_data: form_data,
							admin_id: admin_id,
							otherParams: {}
						});
					}else if(form_data.verified==3){
						form_data.verified = 1;
					}
					Contacts.update(form_data,{
						where: {
							id: form_data.id
						}
					}).then(result => {
						that.syncContactInfo(form_data.id);
						Contacts.findOne({
							where: {
								id: form_data.id
							}
						}).then(result => {
							cb({
								code: 200,
								msg: '更新成功',
								data: result
							});
							require('../cache/cacheCustomerInfo').clearCache();
							that.transTypeLevel({
								name: form_data.name,
								company: form_data.company,
								verified: form_data.verified
							},result => {
								console.log(result);
							});
						}).catch(e => LOG(e));
					});
				});
			}
		}
	});
}

// 同步同名同公司联系人的信息
this.syncContactInfo = async id => {
	const result = await Contacts.findOne({ where: { id } });
	const sample = result.dataValues;
	delete sample.id;
	delete sample.phone1;
	delete sample.isdel;
	const { name, company, update_person } = sample;
	sample.update_person = update_person;
	sample.update_time = TIME();
	await Contacts.update(sample, {
		where: {
			name,
			company,
			isdel: 0,
		}
	});
}

this.delContact = async params => {
	const { id, admin_id } = params;
	await Contacts.update({
		isdel: 1,
		update_person: admin_id,
		update_time: TIME(),
	}, {
		where: { id },
	});
	return {
		code: 200,
		msg: '删除成功',
		data: [],
	};
}

/**
 *  发起申请认证
 */
this.applyVerified = (params) => {
	const { form_data,admin_id,otherParams } = params;
	let other_class = otherParams.class?otherParams.class:'contacts';
	let other_frontUrl = otherParams.frontUrl?otherParams.frontUrl:'/contacts';
	let other_title = otherParams.title?otherParams.title:'联系人管理';
	const staffMap = new base.StaffMap().getStaffMap();
	const user_name = staffMap[admin_id].user_name;
	let subscriber;
	for(let key in staffMap){
		if(staffMap[key].user_name==form_data.witness){
			subscriber = key;
		}
	}

	//发送认证消息
	const sendRequest = (aesStr) => {
		let mailId = Date.now();
		let content;
		if(form_data.job){
			content = '认证请求（'+form_data.name+'，'+form_data.company+'，'+form_data.job+'）'
		}else{
			content = '认证请求（'+form_data.name+'，'+form_data.company+'）';
		}
		request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
			console.log(body);
		}).form({
			data: JSON.stringify({
				mailId: mailId,
				class: other_class,
				priority: '普通',
				frontUrl: other_frontUrl,
				sender: admin_id,
				post_time: TIME(),
				title: other_title,
				content: content,
				votes: '同意,不同意',
				subscriber: subscriber,
				aesStr: aesStr,
				NotiClientSubs: [
					{
						receiver: subscriber,
						noti_post_mailId: mailId
					}
				]
			})
		});
		serviceHomeNotiSystem.msgTask({
			mailId: mailId
		});
	}

	//取消之前的申请
	const cancelRequest = () => {
		let objStr = JSON.stringify({
			type: other_class,
			id: form_data.id
		});
		const secret = 'langjie'; 						//密钥
		const cipher = crypto.createCipher('aes128', secret);
		let aesStr = cipher.update(objStr, 'utf8', 'hex'); //编码方式从utf-8转为hex;
		aesStr += cipher.final('hex'); 					//编码方式从转为hex;
		request.put(ROUTE('notiPost/recallApply'),(err,response,body) => {
			sendRequest(aesStr);
		}).form({
			aesStr: aesStr
		});
	}

	cancelRequest();
}

/**
 *  认证更新
 *  notiPost的回调
 */
this.updateVerified = (params,cb) => {
	const { replyRes,id } = params;
	const that = this;
	let verified;
	if(replyRes=='同意'){
		verified = 1;
		// 新增联系簿
		// addVerContatcs(id);
	}else{
		verified = 0;
	}
	Contacts.update({
		verified: verified
	},{
		where: {
			id: id
		}
	}).then(async () => {
		await that.syncContactInfo(id);
		if (replyRes=='同意') {
			const result = await Contacts.findOne({ where: { id } });
			const { name, company } = result;
			const resultArr = await Contacts.findAll({ where: { name, company } });
			const idArr = resultArr.map(items => items.dataValues.id);
			idArr.forEach(items => addVerContatcs(items));
		}
		require('../cache/cacheCustomerInfo').clearCache();
	}).catch(e => LOG(e));

	async function addVerContatcs(id) {
		const result = await Contacts.findOne({ where: { id } });
        const { name, phone1, company } = result.dataValues;
        servicehyApp.addVerContacts({
            name,
            phone: phone1,
			company,
			job: '非会员',
        });
    }
}

/**
 *	验证认证联系人是否合法
 */
this.validateCertified = (params,cb) => {
	const { verified,company,witness,verifiedPerson,witnessRelation } = params;
	if(verified==1||verified==3){
		if(witness==verifiedPerson&&witnessRelation=='员工'){
			cb({
				code: -1,
				msg: '证明人与认证人不能重复',
				data: []
			});
		}else{
			const checkContactInfo = new CheckContactInfo(params);
			checkContactInfo.checkCompanyReg(result => {
				if(result.code==-1){
					cb(result);
				}else{
					if(witnessRelation=='员工'){
						checkContactInfo.checkStaffAsWitness(result => {
							cb(result);
						});
					}else if(witnessRelation=='同事'){
						checkContactInfo.checkCooperAsWitness(result => {
							cb(result);
						});
					}else{
						checkContactInfo.checkOtherAsWitness(result => {
							cb(result);
						});
					}
				}
			});
		}
	}else{
		cb({
			code: 200,
			msg: '无需认证流程',
			data: []
		});
	}
}

/**
 *	把电话联系单的一般联系人
 *  转换成认证联系人
 *  2018.09.17 不需要了
 */
this.transTypeLevel = (params,cb) => {
	return;
	const { name,company,verified } = params;
	let contact_type;
	if(verified==1){
		contact_type = '认证联系人';
	}else{
		contact_type = '一般联系人';
	}
	serviceHomeOrders.baseMsgOrderParamsUpdate({
		form_data: {
			contact_type: contact_type
		},
		where: {
			where: {
				contact_name: name,
				contact_unit: company
			}
		}
	},result => {
		cb({
			code: 200,
			msg: '更新联系人类型成功',
			data: []
		});
	});
}

/**
 *  获取指定条目
 * 	把电话联系单的一般联系人
 * 	配合this.transTypeLevel()
 */
this.getItemTransTypeLevel = (params,cb) => {
	const { name,company } = params;
	const that = this;
	Contacts.findAll({
		where: {
			name: name,
			company: company
		}
	}).then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				that.transTypeLevel({
					name: name,
					company: company,
					verified: items.dataValues.verified
				},() => resolve());
			});
		});
		Promise.all(_p).then(result => {
			cb({
				code: 200,
				msg: '完成',
				data: []
			});
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

/**
 *  防止重新录入
 * 	手机号只能有一个
 */
this.checkExist = (params,cb) => {
	const { phone1,id } = params;
	Contacts.findAll({
		where: {
			isdel: 0,
			phone1: phone1
		}
	}).then(result => {
		if(result[0]==null){
			cb({
				code: 200,
				msg: '',
				data: []
			});
		}else{
			if(id!=undefined&&result[0].dataValues.id==id){
				cb({
					code: 200,
					msg: '',
					data: []
				});	
			}else{
				cb({
					code: -1,
					msg: '该手机号已存在',
					data: []
				});
			}
		}
	}).catch(e => LOG(e));
}

/**
 *	搜索联系方式
 */
this.searchInfoByName = (params,cb) => {
	let { contact } = params;
	const that = this;
	const _p = [];
	_p[0] = new Promise((resolve,reject) => {
		that.orderParamsList({
			isdel: 0,
			name: {
				'$like': '%'+contact+'%'
			}
		},result => {
			resolve(result.data);
		});
	});
	_p[1] = new Promise((resolve,reject) => {
		serviceHomeMember.orderParamsList({
			name: {
				'$like': '%'+contact+'%'
			}
		},result => {
			resolve(result.data);
		});
	});
	Promise.all(_p).then(result => {
		let res_arr = [];
		result[0].forEach(items => {
			res_arr.push(items.dataValues.phone1);
			res_arr.push(items.dataValues.phone2);
		});
		result[1].forEach(items => {
			res_arr.push(items.dataValues.phone);
		});
		res_arr = [...new Set(res_arr)];
		const cbArr = [];
		res_arr.forEach((items,index) => {
			if(items){
				cbArr.push({
					text: items,
					value: items
				});
			}
		});
		cb({
			code: 200,
			msg: '',
			data: cbArr
		});
	}).catch(e => LOG(e));
}

/**
 *  输入关键字
 *  获取联系人会员的信息
 */
this.searchInfoByKeywords = (params,cb) => {
	const { keywords } = params;
	if(keywords==''){
		cb({
			code: 200,
			msg: '',
			data: []
		});
		return;
	}
	const that = this;
	const _p = [];
	_p[0] = new Promise((resolve,reject) => {
		that.orderParamsList({
			isdel: 0,
			verified: 1,
			'$or': {
				name: {
					'$like': '%'+keywords+'%'
				},
				phone1: {
					'$like': '%'+keywords+'%'
				}
			}
		},result => {
			resolve(result.data);
		});
	});
	_p[1] = new Promise((resolve,reject) => {
		serviceHomeMember.orderParamsList({
			checked: 1,
			'$or': {
				name: {
					'$like': '%'+keywords+'%'
				},
				phone: {
					'$like': '%'+keywords+'%'
				}
			}
		},result => {
			resolve(result.data);
		});
	});
	Promise.all(_p).then(result => {
		let resArr = [],hashObj = {};
		result[0].forEach(items => {
			resArr.push({
				name: items.dataValues.name,
				phone: items.dataValues.phone1
			});
		});
		result[1].forEach(items => {
			resArr.push({
				name: items.dataValues.name,
				phone: items.dataValues.phone
			});
		});
		let endArr = [];
		resArr.forEach((items,index) => {
			if(!hashObj[items.name]){
				hashObj[items.name] = 1;
				endArr.push(items);
			}
		});
		endArr.forEach((items,index) => {
			endArr[index] = {
				text: items.name,
				value: items.name,
				data: items
			};
		});
		cb({
			code: 200,
			msg: '',
			data: endArr
		});
	}).catch(e => LOG(e));
}

/**
 * 判断是否是会员
 */
this.checkAndUpdateIsMember = async () => {
	const memberList = await Member.findAll();
	const contactList = await Contacts.findAll({ attributes: ['id', 'phone1', 'is_member'], where: { isdel: 0 } });
	const memberMapper = {};
	memberList.forEach(items => {
		memberMapper[items.dataValues.phone] = 1;
	});
	await bluebird.map(contactList, async items => {
		const { id, phone1, is_member } = items.dataValues;
		if (memberMapper[phone1] && is_member == 0) {
			await Contacts.update({ is_member: 1 }, { where: { id } });
		}
	}, { concurrency: 5 });
	return { code: 200, msg: '更新完成' };
}