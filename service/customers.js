var express = require('express');
var url = require('url');
var path = require('path');
var common = require('./common');
var Customers = require('../dao').Customers;
var Member = require('../dao').Member;
var Users = require('../dao').Users;
var ContractsHead = require('../dao').ContractsHead;
var BaseMsg = require('../dao').BaseMsg;
var CallMsg = require('../dao').CallMsg;
var TypeDInfo = require('../dao').TypeDInfo;
var OnlineContactsInfo = require('../dao').OnlineContactsInfo;
const child_process = require('child_process');
const childProcessUtil = require('../child_process/index');


/**
 *	新客户列表
 */
this.typeNewList = (params,cb) => {
	this.newIncomingCustomers(params,result => {
		const _p = [],res_arr = [];
		result.data.data.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				ContractsHead.findAll({
					attributes: ['contract_no','cus_abb','delivery_time','sign_time','delivery_state','payable','paid','sale_person','id', 'contract_state', 'isDirectSale'],
					where: {
						isdel: 0,
						// cus_abb: items.abb,
						contract_state: '有效',
						contract_no: {
							'$in': items.contractArr
						}
					}
				}).then(result => {
					result.forEach((items,index) => {
						if(!items.dataValues.delivery_time){
							items.dataValues.hasDelivery = 0;
						}else{
							items.dataValues.hasDelivery = 1;
						}
						res_arr.push(items.dataValues);
					});
					resolve();
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(result => {
			cb({
				code: 200,
				msg: '',
				data: {
					data: res_arr
				}
			});
		}).catch(e => LOG(e));
	});
}

/**
 *  新版本新客户
 * 	(信用合格的新客户和信用不合格的新客户)
 */
this.newIncomingCustomers = async(params,cb) => {
	if (!CONFIG.debug) {
		const result = await childProcessUtil(DIRNAME + '/child_process/newCustomer.js', params);
		cb(result);
		return;
	}
	let page = params.page;
	let num = params.pageSize;
	let keywords = params.keywords;
	let qualified = params.qualified?params.qualified:1;
	let year = params.year?params.year:2;
	let qualifiedArr;
	if(qualified==0){
		qualifiedArr = [0];
	}else if(qualified==1){
		qualifiedArr = [1];
	}else{
		qualifiedArr = [0,1];
	}
	//获取符合条件的客户
	const transToAbb = (cb) => {
		Customers.findAll({
			where: {
				isdel: 0,
				credit_qualified: qualifiedArr,
				'$or': {
					company: {
						'$like': '%'+keywords+'%'
					},
					abb: {
						'$like': '%'+keywords+'%'
					},
					cn_abb: {
						'$like': '%'+keywords+'%'
					}
				}
			}
		}).then(result => {
			cb(result);
		}).catch(e => LOG(e));
	}

	//获取指定客户的合同
	const getContractsInfo = (abb,cb) => {
		ContractsHead.findAll({
			where: {
				isdel: 0,
				cus_abb: abb,
				contract_state: '有效',
				delivery_time: {
					'$ne': null
				}
			},
			order: [['sign_time']]
		}).then(result => {
			cb(result);
		}).catch(e => LOG(e));
	}

	//a)	一年新：客户首签日期>=2018-1-1，（合同签订日期-首签）<1年。
	//b)	二年新：客户首签日期>=2017-1-1，（合同签订日期-首签）<2年。
	const checkYears = (firstSignStamp) => {
		if(year==1||year==2){
			const orderYearStamp = Date.parse(2018 - Number(year-1) + '-01-01');
			if(firstSignStamp>=orderYearStamp){
				return true;
			}else{
				return false;
			}
		}
	}

	const _p = [];
	const endResArr = [];

	transToAbb(cpyAbb => {
		cpyAbb.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				const obj = {};
				obj.abb = items.dataValues.abb;
				obj.company = items.dataValues.company;
				obj.level = items.dataValues.level;
				obj.manager = items.dataValues.manager;
				obj.total_sale = items.dataValues.total_sale;
				obj.contractArr = [];
				getContractsInfo(items.dataValues.abb,result => {
					if(result[0]==null){
						//没有签订过合同的客户
						resolve();
					}else{
						const firstSignStamp = Date.parse(result[0].dataValues.sign_time);
						if(checkYears(firstSignStamp)){
							let _n = 60*60*1000*24*365*Number(year);
							result.forEach((items,index) => {
								if(Date.parse(items.dataValues.sign_time) - firstSignStamp < _n){
									obj.contractArr.push(items.dataValues.contract_no);
								}
							});
							endResArr.push(obj);
							resolve();
						}else{
							//不是指定年数新的客户
							resolve();
						}
					}
				});
			});
		});

		Promise.all(_p).then(result => {
			cb({
				code: 200,
				msg: '',
				data: {
					data: endResArr,
					// data: endResArr.splice((page-1)*num,num),
					total: endResArr.length
				}
			});
		}).catch(e => LOG(e));
	});

}

this.getAllCustomers = async () => {
	const result = await Customers.findAll({
		attributes: ['company', 'abb', 'user_id'],
		where: { isdel: 0 },
	});
	return result;
}

/**
 *	D类客户列表
 */
this.typeDList = async (params,cb) => {
	const page = Number(params.page);
	const num = Number(params.num);
	const keywords = params.keywords;
	const order = params.order;
	const filter = params.filter ? (typeof params.filter === 'string' ? JSON.parse(params.filter) : params.filter) : {};
	const include = {
		model: TypeDInfo,
		association: Customers.hasOne(TypeDInfo, {foreignKey:'customer_id',sourceKey: 'user_id'}),
	};
	const intent_degree_arr = filter.intent_degree.split(',').filter(items => items).map(items => items.slice(1,2));
	if (intent_degree_arr.length !== 0) include.where = { intent_degree: { $in: intent_degree_arr } };
	const sortOrder = getOrder(order);
	const result = await Customers.findAndCountAll({
		include,
		where: {
			isdel: 0,
			level: 'D',
			certified: 1,
			company: {
				$like: '%' + keywords + '%',
			},
		},
		limit: num,
		offset: ( page - 1 ) * num,
		order: sortOrder,
	});
	// 获取线上联系单信息
	const onlineResult = await OnlineContactsInfo.findAll();
	result.rows.forEach((items, index) => {
		try {
			result.rows[index].dataValues.total_contact_num = items.dataValues.TypeDInfo.dataValues.total_contact_num;
			result.rows[index].dataValues.latest_contact_num = items.dataValues.TypeDInfo.dataValues.latest_contact_num;
			result.rows[index].dataValues.latest_contact_time = items.dataValues.TypeDInfo.dataValues.latest_contact_time;
			result.rows[index].dataValues.intent_degree = items.dataValues.TypeDInfo.dataValues.intent_degree;
			result.rows[index].dataValues.hot_degree = items.dataValues.TypeDInfo.dataValues.hot_degree;
			result.rows[index].dataValues.other_staff = items.dataValues.TypeDInfo.dataValues.other_staff;
		} catch (e) {
			
		}
		onlineResult.forEach(it => {
			if (it.dataValues.company == items.dataValues.company) {
				result.rows[index].dataValues.total_contact_num += it.dataValues.total;
				result.rows[index].dataValues.latest_contact_num += it.dataValues.latest_num;
				result.rows[index].dataValues.latest_contact_time = Date.parse(it.dataValues.latest_time) > Date.parse(items.dataValues.latest_contact_time) ? it.dataValues.latest_time : items.dataValues.latest_contact_time;
			}
		});
	});
	cb({
		code: 200,
		msg: '',
		data: {
			data: result.rows,
			total: result.count,
			id_arr: [],
		}
	});

	function getOrder(type) {
		if (type == 'insert_time') {
			return [[ type, 'DESC' ]];
		}
		return [[ 'TypeDInfo', type, 'DESC' ]];
	}
}

// 改变意向度
this.changeIntentDegree = async params => {
	const { intent_degree, user_id, technical_solution } = params;
	const infoEntity = await TypeDInfo.findOne({ where: { customer_id: user_id } });
	const originIntentDegree = infoEntity.dataValues.intent_degree;
	const originHotDegree = infoEntity.dataValues.hot_degree;
	const newHotDegree = originHotDegree + (intent_degree - originIntentDegree) * 10;
	const formData = {
		intent_degree,
		hot_degree: newHotDegree,
	};
	if (technical_solution) formData.technical_solution = technical_solution;
	await TypeDInfo.update(formData, {
		where: {
			customer_id: user_id,
		},
	});
	return {
		code: 200,
		msg: '更新成功',
		data: [],
	};
}

// 监听到来自意向产品，是否改变意向度
this.fromProductsChange = async params => {
	const { user_id } = params;
	const result = await TypeDInfo.findOne({
		where: {
			customer_id: user_id,
		},
	});
	if (!result) return;
	const { intent_degree } = result.dataValues;
	if (intent_degree == 1 || intent_degree == 2) {
		this.changeIntentDegree({
			user_id,
			intent_degree: 3,
		});
	}
}

this.checkExistMember = async params => {
	const { user_id } = params;
	const companyEntity = await Customers.findOne({ where: { user_id } });
	const { company } = companyEntity.dataValues;
	const memberEntity = await Member.findOne({ where: { company, checked: 1 }});
	if (memberEntity) return { code: 200, msg: '会员存在' };
	return { code: -1, msg: '该公司不存在认证会员' };
}

/**
 *	指定客户信息
 */
this.customerInfo = (params,cb) => {
	let company = params.company;
	Customers.findAll({
		where: {
			company: company,
			isdel: 0
		}
	}).then(result => {
		if(result[0]==null){
			Users.findAll({
				where: {
					company: company,
					isdel: 0
				}
			}).then(result => {
				cb({
					code: 200,
					msg: '',
					data: result[0].dataValues
				});
			}).catch(e => LOG(e));
		}else{
			cb({
				code: 200,
				msg: '',
				data: result[0].dataValues
			});
		}
	}).catch(e => LOG(e));
}

/**
 *	更新指定客户信息
 */
this.updateCustomerInfo = (params,cb) => {
	let form_data = JSON.parse(params.form_data);
	let id = form_data.id;
	let abb = form_data.abb.toUpperCase();
	let cn_abb = form_data.cn_abb;
	let user_id = form_data.user_id;
	let that = this;
	let p1 = new Promise((resolve,reject) => {
		if(abb==''){
			resolve();
		}else{
			that.searchAbbRepeat({
				abb: abb
			},(res_arr) => {
				if(res_arr[0]==null){
					//该简称未使用过
					resolve();
				}else if(res_arr.length>1){
					//该简称重复
					reject('abb');
				}else if(res_arr.length==1){
					if(res_arr[0].user_id==form_data.user_id&&(res_arr[0].id==form_data.id)){
						//用户简称未修改
						resolve();
					}else{
						//用户简称修改成了数据库已有的一个简称
						reject('abb');
					}
				}
			});
		}
	});
	let p2 = new Promise((resolve,reject) => {
		if(cn_abb==''){
			resolve();
		}else{
			that.searchCnAbbRepeat({
				cn_abb: cn_abb
			},(res_arr) => {
				if(res_arr[0]==null){
					//该简称未使用过
					resolve();
				}else if(res_arr.length>1){
					//该简称重复
					reject('cn_abb');
				}else if(res_arr.length==1){
					if(res_arr[0].user_id==form_data.user_id&&(res_arr[0].id==form_data.id)){
						//用户简称未修改
						resolve();
					}else{
						//用户简称修改成了数据库已有的一个简称
						reject('cn_abb');
					}
				}
			});
		}
	});
	Promise.all([p1,p2]).then(() => {
		if(form_data.star){
			//更新客户表
			Model = Customers;
		}else{
			//更新用户表
			Model = Users;
		}
		delete form_data.id;
		if(form_data.datefrom=='0000-00-00'||form_data.datefrom==''||form_data.datefrom=='null') form_data.datefrom = null;
		Model.update(form_data,{
			where: {
				id: id
			}
		}).then(result => {
			cb({
				code: 200,
				msg: '更新成功',
				data: []
			});
		}).catch(e => LOG(e));
	}).catch((type) => {
		let msg = '';
		if(type=='abb'){
			msg = '英文简称重复';
		}else{
			msg = '中文简称重复';
		}
		cb({
			code: -1,
			msg: msg,
			data: []
		});
	});
}

/**
 *	查找所有英文简称
 *  return Array
 */
this.searchAbbRepeat = (params,cb) => {
	let abb = params.abb;
	let res_arr = [];
	let p1 = new Promise((resolve,reject) => {
		Customers.findAll({
			where: {
				isdel: 0,
				abb: abb
			}
		}).then(result => {
			result.forEach((items,index) => {
				res_arr.push({
					abb: items.dataValues.abb,
					user_id: items.dataValues.user_id,
					id: items.dataValues.id
				});
			});
			resolve();
		}).catch(e => LOG(e));
	});
	let p2 = new Promise((resolve,reject) => {
		Users.findAll({
			where: {
				isdel: 0,
				abb: abb
			}
		}).then(result => {
			result.forEach((items,index) => {
				res_arr.push({
					abb: items.dataValues.abb,
					user_id: items.dataValues.user_id,
					id: items.dataValues.id
				});
			});
			resolve();
		}).catch(e => LOG(e));
	});
	Promise.all([p1,p2]).then(() => {
		cb(res_arr);
	}).catch(e => LOG(e));
}

/**
 *	查找所有中文简称
 *  return Array
 */
this.searchCnAbbRepeat = (params,cb) => {
	let cn_abb = params.cn_abb;
	const res_arr = [];
	let p1 = new Promise((resolve,reject) => {
		Customers.findAll({
			where: {
				isdel: 0,
				cn_abb: cn_abb
			}
		}).then(result => {
			result.forEach((items,index) => {
				res_arr.push({
					cn_abb: items.dataValues.cn_abb,
					user_id: items.dataValues.user_id,
					id: items.dataValues.id
				});
			});
			resolve();
		}).catch(e => LOG(e));
	});
	let p2 = new Promise((resolve,reject) => {
		Users.findAll({
			where: {
				isdel: 0,
				cn_abb: cn_abb
			}
		}).then(result => {
			result.forEach((items,index) => {
				res_arr.push({
					cn_abb: items.dataValues.cn_abb,
					user_id: items.dataValues.user_id,
					id: items.dataValues.id
				});
			});
			resolve();
		}).catch(e => LOG(e));
	});
	Promise.all([p1,p2]).then(() => {
		cb(res_arr);
	}).catch(e => LOG(e));
}


/*****************************react*****************************************/

/**
 *	客户列表
 */
this.list = (params,cb) => {
	let page = params.page?params.page:1;
	let num = params.num?params.num:30;
	Customers.findAll({
		where: {
			isdel: 0
		},
		order: [['id']],
		offset: (page - 1) * num,
		limit: num
	}).then(result => {
		const res_arr = [];
		result.forEach((items,index) => {
			res_arr.push(items);
		});
		cb({
			code: 200,
			msg: '',
			data: res_arr
		});
	}).catch(e => LOG(e));
}