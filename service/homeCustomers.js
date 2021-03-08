const xlsx = require('node-xlsx');
const fs = require('fs');
const cp = require( 'child_process');
const Staff = require('../dao').Staff;
const Customers = require('../dao').Customers;
const Member = require('../dao').Member;
const Users = require('../dao').Users;
const Contacts = require('../dao').Contacts;
const sequelize = require('../dao').sequelize;
const ContractsHead = require('../dao').ContractsHead;
const common = require('./common');
const base = require('./base');
const serviceUsers = require('./homeUsers');
const serviceHomeMember = require('./homeMember');
const RemList = require('../dao').RemList;
const serviceWallet = require('./homeWallet');
const serviceVerUnit = require('./homeVerUnit');
const CustomersStarList = require('../dao').CustomersStarList;
const cacheCustomerInfo = require('../cache/cacheCustomerInfo');
const cluster = require('cluster');
const TypeDInfo = require('../dao').TypeDInfo;
const oldFileCustomers = require('./customers');

/**
 *  工号等信息MV的转换
 */
class Trans {
	constructor(data){
		this.data = data;
	}

	transToView(cb){
		const staffMapper = new base.StaffMap().getStaffMap();
		this.data.forEach((items,index) => {
			try {
				items.insert_person = staffMapper[items.insert_person].user_name;
			} catch (e) {
				
			}
			try {
				items.update_person = staffMapper[items.update_person].user_name;
			} catch (e) {
				
			}
			try {
				items.certifiedPerson = staffMapper[items.certifiedPerson].user_name;
			} catch (e) {
				
			}
		});
		cb(this.data);
		// const _p = [];
		// this.data.forEach((items,index) => {
		// 	_p[index] = new Promise((resolve,reject) => {
		// 		let i = index;
		// 		const in_p = [];
		// 		in_p[0] = new Promise((resolve,reject) => {
		// 			common.idTransToName({
		// 				user_id: items.dataValues.insert_person
		// 			},user_name => {
		// 				this.data[i].insert_person = user_name;
		// 				resolve();
		// 			});
		// 		});
		// 		in_p[1] = new Promise((resolve,reject) => {
		// 			common.idTransToName({
		// 				user_id: items.dataValues.update_person
		// 			},user_name => {
		// 				this.data[i].update_person = user_name;
		// 				resolve();
		// 			});
		// 		});
		// 		in_p[2] = new Promise((resolve,reject) => {
		// 			common.idTransToName({
		// 				user_id: items.dataValues.certifiedPerson
		// 			},user_name => {
		// 				this.data[i].certifiedPerson = user_name;
		// 				resolve();
		// 			});
		// 		});
		// 		Promise.all(in_p).then(result => {
		// 			resolve();
		// 		}).catch(e => LOG(e));
		// 	});
		// });
		// Promise.all(_p).then(result => {
		// 	cb(this.data);
		// }).catch(e => LOG(e));
	}

	transToModel(cb){
		const _p = [];
		this.data.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				let i = index;
				const in_p = [];
				in_p[0] = new Promise((resolve,reject) => {
					common.staffNameTransToUserId({
						user_name: items.certifiedPerson
					},user_id => {
						this.data[i].certifiedPerson = user_id;
						resolve();
					});
				});
				Promise.all(in_p).then(result => {
					resolve();
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(result => {
			cb(this.data);
		}).catch(e => LOG(e));
	}
}

this.getAllList = async () => {
	const result = await Customers.findAll({ attributes: [ 'user_id', 'company' ], where: { isdel: 0 } });
	return {
		code: 200,
		msg: '查询成功',
		data: result,
	};
}

/**
 * 	@param 	{object}
 *  @return {object}
 */
this.listCondition = (params,cb) => {
	const { keywords,filter } = params;

	//扩展筛选功能
	class ManageCustomerId extends base.SearchCustomerId{
		constructor(keywords,filter){
			super(keywords,filter);
			this.filterGroupArr = [];
		}

		//private
		priFilterGroup(cb){
			if(this.filter.group[0]!=null) {	//指定组别客户
				Staff.findAll({
					where: {
						isdel: 0,
						group: {
							'$in': this.filter.group
						}
					}
				}).then(result => {
					result.forEach((items,index) => {
						this.filterGroupArr.push(items.dataValues.user_name);
					});
					this.filterGroupArr.push(this.filter.group);
					cb(this.filterGroupArr);
				}).catch(e => LOG(e));
			}else{	//全部客户
				cb(false);
			}
		}
		//private
		priFilterLevel(cb){
			if(this.filter.level[0]!=null) {	//指定等级客户
				cb(this.filter.level);
			}else{	//全部客户
				cb(false);
			}
		}
		//private
		priFilterCertified(cb){
			if(this.filter.certified[0]!=null) {	//指定认证
				this.filter.certified.forEach((items,index) => {
					if(items=='已认证'){
						this.filter.certified[index] = 1;
					}else if(items=='待认证'){
						this.filter.certified[index] = 0;
					}else{//认证未通过
						this.filter.certified[index] = 2;
					}
				});
				cb(this.filter.certified);
			}else{	//全部客户
				cb(false);
			}
		}

		//@overload
		getWhereAnd(cb){
			this.priFilterGroup(bool => {
				const resArr = [
					sequelize.where(sequelize.col('Customers.isdel'), { '$eq': 0})
				];
				if(bool) resArr.push(sequelize.where(sequelize.col('Customers.manager'), { '$in': bool}));
				this.priFilterLevel(bool => {
					if(bool) resArr.push(sequelize.where(sequelize.col('Customers.level'), { '$in': bool}));
					this.priFilterCertified(bool => {
						if(bool) resArr.push(sequelize.where(sequelize.col('Customers.certified'), { '$in': bool}));
					});
					cb(resArr);
				});
			});
		}
	}

	try{
		filter.group = filter.group.split(',').filter(items => items);
	}catch(e){
		filter.group = [];
	}
	try{
		filter.level = filter.level.split(',').filter(items => items);
	}catch(e){
		filter.level = [];
	}
	try{
		filter.certified = filter.certified.split(',').filter(items => items);
	}catch(e){
		filter.certified = [];
	}
	try{
		filter.hasRegPower = filter.hasRegPower.split(',').filter(items => items);
	}catch(e){
		filter.hasRegPower = [];
	}
	const manageCustomerId = new ManageCustomerId(keywords,filter);
	let whereAnd;
	manageCustomerId.getWhereAnd(result => {
		whereAnd = result;
		if (filter.hasRegPower.length === 1) {
			if (filter.hasRegPower[0] === '开放') {
				whereAnd.push(sequelize.where(sequelize.col('Customers.hasRegPower'), { $eq: 1 }));
			} else {
				whereAnd.push(sequelize.where(sequelize.col('Customers.hasRegPower'), { $eq: 0 }));
			}
		}
		cb({
			include: manageCustomerId.getIncludeCondition(),
			distinct: true,
			where: {
				'$or': manageCustomerId.getWhereOr(),
				'$and': whereAnd
			}
		});
	});
}

/**
 *	客户数据列表
 */
let is_doing_cache = false;
this.list = (params,cb) => {
	let num = params.num?parseInt(params.num):30;
	let page = params.page?parseInt(params.page):1;
	let keywords = params.keywords?params.keywords:'';
	let order = params.order?params.order:'user_id';	//user_id,update_time,total_sale,latest_year_sale
	let filter = params.filter?JSON.parse(params.filter):{};
	let total = 0,id_arr = [],data;
	const that = this;
	function fromCache(result) {
		// 筛选
		const filterFun = (data, cb) => {
			const resArr = [];
			let levelArr = [], certifiedArr = [], groupArr = [];
			that.listCondition({keywords: keywords,filter: filter},whereCondition => {
				const $andArr = whereCondition.where.$and;
				$andArr.forEach((items, index) => {
					if (items.attribute.col == 'Customers.level') {
						levelArr = items.logic.$in;
					} else if (items.attribute.col == 'Customers.certified') {
						certifiedArr = items.logic.$in.map(items => Number(items));
					} else if (items.attribute.col == 'Customers.manager') {
						groupArr = items.logic.$in;
						const lastItem = groupArr.pop();
						groupArr = [...groupArr, ...lastItem];
					}
				});
				for (let i = 0; i < data.length; i++) {
					if ((groupArr.length==0 || groupArr.indexOf(data[i].manager) !== -1) && (levelArr.length==0 || levelArr.indexOf(data[i].level) !== -1) && (certifiedArr.length==0 || certifiedArr.indexOf(data[i].certified) !== -1)) {
						resArr.push(data[i]);
					}
				}
				cb(resArr);
			});
		}
		// 搜索keywords
		const search = data => {
			const resArr = [];
			for (let i = 0; i < data.length; i++) {
				let needContinue = true;
				if (data[i].company.indexOf(keywords) !== -1 || data[i].abb.indexOf(keywords) !== -1 || data[i].cn_abb.indexOf(keywords) !== -1 || (data[i].legal_person && data[i].legal_person.indexOf(keywords) !== -1) || data[i].user_id == keywords) {
					resArr.push(data[i]);
					continue;
				}
				const MemberArr = data[i].Members, ContactsArr = data[i].Contacts;
				for (let j = 0; j < MemberArr.length; j++) {
					if (MemberArr[j].name.indexOf(keywords) != -1 || MemberArr[j].phone.indexOf(keywords) != -1) {
						resArr.push(data[i]);
						needContinue = false;
						break;
					}
				}
				if (!needContinue) continue;
				try {
					for (let j = 0; j < ContactsArr.length; j++) {
						if (ContactsArr[j].name.indexOf(keywords) != -1 || ContactsArr[j].phone1.indexOf(keywords) != -1) {
							resArr.push(data[i]);
							break;
						}
					}
				} catch (e) {
					
				}
			}
			return resArr;
		}
		//排序
		const sortData = (data,cb) => {
			const p = new Promise((resolve,reject) => {
				common.infoMarkArr({
					type: 'Customers'
				},result => {
					resolve(result);
					id_arr = result;
				});
			});
			p.then(result => {
				let s;
				if(order=='user_id'){
					s = (a,b) => {
						return b.user_id - a.user_id;
					}
				}else if(order=='update_time'){
					s = (a,b) => {
						return Date.parse(new Date(b.update_time)) - Date.parse(new Date(a.update_time));
					}
				}else if(order=='total_sale'){
					s = (a,b) => {
						return b.total_sale - a.total_sale;
					}
				}else if(order=='latest_year_sale'){
					s = (a,b) => {
						return b.latest_year_sale - a.latest_year_sale;
					}
				}
				let resAllArr = [];
				resAllArr = data.sort(s);
				const headArr = [];
				resAllArr.forEach((items,index) => {
					if (id_arr.indexOf(items.user_id) !== -1) {
						headArr.push(items);
						resAllArr[index] = '';
					}
				});
				resAllArr = resAllArr.filter(items => items);
				resAllArr = [...headArr, ...resAllArr];
				cb(resAllArr);
			});
		}

		//筛选后把标记部分去除
		const removeMarkByFilter = (result) => {
			const filterMarkArr = [];
			for (let i = 0; i < id_arr.length; i++) {
				for (let j = 0; j < result.length; j++) {
					if(id_arr[i]==result[j].user_id){
						filterMarkArr.push(id_arr[i]);
					}
				}
			}
			return filterMarkArr;
		}
		let data = result.data.data;
		filterFun(data, data => {
			data = search(data);
			sortData(data, data => {
				const total = data.length;
				data = data.splice((page - 1) * num, num);
				cb({
					code: 200,
					msg: '',
					data: {
						data,
						total,
						id_arr: removeMarkByFilter(data),
					},
				});
			});
		});
	}
	function fromSql() {
		that.listCondition({keywords: keywords,filter: filter},whereCondition => {
			//根据搜索关键字和筛选条件得到的总结果
			const getAllData = (cb) => {
				Customers.findAndCountAll(whereCondition).then(result => cb(result)).catch(e => LOG(e));
			}
	
			//排序
			const sortData = (data,cb) => {
				const p = new Promise((resolve,reject) => {
					common.infoMarkArr({
						type: 'Customers'
					},result => {
						resolve(result);
						id_arr = result;
					});
				});
				p.then(result => {
					let s;
					if(order=='user_id'){
						s = (a,b) => {
							return b.dataValues.user_id - a.dataValues.user_id;
						}
					}else if(order=='update_time'){
						s = (a,b) => {
							return Date.parse(new Date(b.dataValues.update_time)) - Date.parse(new Date(a.dataValues.update_time));
						}
					}else if(order=='total_sale'){
						s = (a,b) => {
							return b.dataValues.total_sale - a.dataValues.total_sale;
						}
					}else if(order=='latest_year_sale'){
						s = (a,b) => {
							return b.dataValues.latest_year_sale - a.dataValues.latest_year_sale;
						}
					}
					let resAllArr = [];
					resAllArr = data.sort(s);
					const markSort = new base.MarkSort(id_arr,resAllArr);
					resAllArr = markSort.makeSort('user_id');
					cb(resAllArr);
				});
			}
	
			//主要联系人
			const mainContacts = (data,cb) => {
				const _p = [];
				data.forEach((items,index) => {
					_p[index] = new Promise((resolve,reject) => {
						const it = items,i = index;
						let contactsArr = [];
						try{
							items.dataValues.legal_person.split(',').forEach((it,ind) => {contactsArr.push(it)});
						}catch(e){
	
						}
						try{
							items.dataValues.partner.split(',').forEach((it,ind) => {contactsArr.push(it)});
						}catch(e){
	
						}
						try{
							items.dataValues.reg_person.split(',').forEach((it,ind) => {contactsArr.push(it)});
						}catch(e){
							
						}
						try{
							items.dataValues.finance.split(',').forEach((it,ind) => {contactsArr.push(it)});
						}catch(e){
							
						}
						try{
							items.dataValues.purchase.split(',').forEach((it,ind) => {contactsArr.push(it)});
						}catch(e){
							
						}
						items.dataValues.Members.forEach((items,index) => {
							if(items.dataValues.checked==1) contactsArr.push(items.dataValues.name);
						});
						items.dataValues.Contacts.forEach((items,index) => {
							if(items.dataValues.verified==1) contactsArr.push(items.dataValues.name);
						});
						contactsArr = [...new Set(contactsArr)];
						contactsArr = contactsArr.filter(items => {
							if(items!='null') return items;
						});
						// data[index].dataValues.contactsArr = contactsArr.join();
						// data[index].dataValues.contactsArr = contactsArr;
						serviceHomeMember.verifiedRelation({
							keywords: items.dataValues.company
						},result => {
							let { contacts } = result.data;
							contactsArr.forEach((items,index) => {
								contacts.forEach((it,ind) => {
									if(items==it.name){
										contactsArr[index] = it;
									}
								});
							});
							data[i].dataValues.contactsArr = contactsArr;
							resolve();
						});
					});
				});
				Promise.all(_p).then(() => cb(data)).catch(e => LOG(e));
			}
	
			//筛选后把标记部分去除
			const removeMarkByFilter = (result) => {
				const filterMarkArr = [];
				for (let i = 0; i < id_arr.length; i++) {
					for (let j = 0; j < result.length; j++) {
						if(id_arr[i]==result[j].dataValues.user_id){
							filterMarkArr.push(id_arr[i]);
						}
					}
				}
				return filterMarkArr;
			}
	
			//获得附注列表
			const getRemList = (result,cb) => {
				const _p = [];
				result.forEach((items,index) => {
					_p[index] = new Promise((resolve,reject) => {
						const i = index;
						RemList.findAll({
							where: {
								type: 'Customers',
								typeKey: items.dataValues.user_id
							}
						}).then(_result => {
							const staffMap = new base.StaffMap().getStaffMap();
							const remList = _result.map(items => {
								items.dataValues.insert_person = staffMap[items.dataValues.insert_person].user_name;
								return items;
							});
							result[index].dataValues.remList = remList;
							resolve();
						}).catch(e => LOG(e));
					});
				});
				Promise.all(_p).then(() => {
					cb(result);
				}).catch(e => LOG(e));
			}
	
			getAllData(result => {
				total = result.count;
				sortData(result.rows,result => {
					result = result.splice((page-1)*num,num);
					// getRemList(_result,(result) => {
						// mainContacts(result,result => {
							new Trans(result).transToView(result => {
								cb({
									code: 200,
									msg: '',
									data: {
										data: result,
										total: total,
										id_arr: removeMarkByFilter(result)
									}
								});
								if (is_doing_cache) return;
								is_doing_cache = true;
								const childTask = cp.fork(DIRNAME + '/service/homeCustomerSub');
								childTask.send({
									LOG: global.LOG.toString(),
									CONFIG: global.CONFIG,
								});
								childTask.on('message', () => {
									is_doing_cache = false;
								});
								// that.refreshCustomerCache(() => is_doing_cache = false);
							});
						// });
					// });
				});
			});
		});
	}
	// cacheCustomerInfo.getCache({}, result => {
	// 	if (!result) {
			console.log('sql');
			fromSql();
	// 	} else {
	// 		console.log('cache');
	// 		fromCache(result);
	// 	}
	// });
}

// this.cacheList = (params,cb) => {
// 	// let num = params.num?parseInt(params.num):30;
// 	// let page = params.page?parseInt(params.page):1;
// 	let keywords = params.keywords?params.keywords:'';
// 	let order = params.order?params.order:'user_id';	//user_id,update_time,total_sale,latest_year_sale
// 	let filter = params.filter?JSON.parse(params.filter):{};
// 	let total = 0,id_arr = [],data;

// 	this.listCondition({keywords: keywords,filter: filter},whereCondition => {
// 		//根据搜索关键字和筛选条件得到的总结果
// 		const getAllData = (cb) => {
// 			Customers.findAndCountAll(whereCondition).then(result => cb(result)).catch(e => LOG(e));
// 		}

// 		//排序
// 		const sortData = (data,cb) => {
// 			const p = new Promise((resolve,reject) => {
// 				common.infoMarkArr({
// 					type: 'Customers'
// 				},result => {
// 					resolve(result);
// 					id_arr = result;
// 				});
// 			});
// 			p.then(result => {
// 				let s;
// 				if(order=='user_id'){
// 					s = (a,b) => {
// 						return b.dataValues.user_id - a.dataValues.user_id;
// 					}
// 				}else if(order=='update_time'){
// 					s = (a,b) => {
// 						return Date.parse(new Date(b.dataValues.update_time)) - Date.parse(new Date(a.dataValues.update_time));
// 					}
// 				}else if(order=='total_sale'){
// 					s = (a,b) => {
// 						return b.dataValues.total_sale - a.dataValues.total_sale;
// 					}
// 				}else if(order=='latest_year_sale'){
// 					s = (a,b) => {
// 						return b.dataValues.latest_year_sale - a.dataValues.latest_year_sale;
// 					}
// 				}
// 				let resAllArr = [];
// 				resAllArr = data.sort(s);
// 				const markSort = new base.MarkSort(id_arr,resAllArr);
// 				resAllArr = markSort.makeSort('user_id');
// 				cb(resAllArr);
// 			});
// 		}

// 		//主要联系人
// 		const mainContacts = (data,cb) => {
// 			const _p = [];
// 			data.forEach((items,index) => {
// 				_p[index] = new Promise((resolve,reject) => {
// 					const it = items,i = index;
// 					let contactsArr = [];
// 					try{
// 						items.dataValues.legal_person.split(',').forEach((it,ind) => {contactsArr.push(it)});
// 					}catch(e){

// 					}
// 					try{
// 						items.dataValues.partner.split(',').forEach((it,ind) => {contactsArr.push(it)});
// 					}catch(e){

// 					}
// 					try{
// 						items.dataValues.reg_person.split(',').forEach((it,ind) => {contactsArr.push(it)});
// 					}catch(e){
						
// 					}
// 					try{
// 						items.dataValues.finance.split(',').forEach((it,ind) => {contactsArr.push(it)});
// 					}catch(e){
						
// 					}
// 					try{
// 						items.dataValues.purchase.split(',').forEach((it,ind) => {contactsArr.push(it)});
// 					}catch(e){
						
// 					}
// 					items.dataValues.Members.forEach((items,index) => {
// 						if(items.dataValues.checked==1) contactsArr.push(items.dataValues.name);
// 					});
// 					items.dataValues.Contacts.forEach((items,index) => {
// 						if(items.dataValues.verified==1) contactsArr.push(items.dataValues.name);
// 					});
// 					contactsArr = [...new Set(contactsArr)];
// 					contactsArr = contactsArr.filter(items => {
// 						if(items!='null') return items;
// 					});
// 					// data[index].dataValues.contactsArr = contactsArr.join();
// 					// data[index].dataValues.contactsArr = contactsArr;
// 					serviceHomeMember.verifiedRelation({
// 						keywords: items.dataValues.company
// 					},result => {
// 						let { contacts } = result.data;
// 						contactsArr.forEach((items,index) => {
// 							contacts.forEach((it,ind) => {
// 								if(items==it.name){
// 									contactsArr[index] = it;
// 								}
// 							});
// 						});
// 						data[i].dataValues.contactsArr = contactsArr;
// 						resolve();
// 					});
// 				});
// 			});
// 			Promise.all(_p).then(() => cb(data)).catch(e => LOG(e));
// 		}

// 		//筛选后把标记部分去除
// 		const removeMarkByFilter = (result) => {
// 			const filterMarkArr = [];
// 			for (let i = 0; i < id_arr.length; i++) {
// 				for (let j = 0; j < result.length; j++) {
// 					if(id_arr[i]==result[j].dataValues.user_id){
// 						filterMarkArr.push(id_arr[i]);
// 					}
// 				}
// 			}
// 			return filterMarkArr;
// 		}

// 		//获得附注列表
// 		const getRemList = (result,cb) => {
// 			const _p = [];
// 			result.forEach((items,index) => {
// 				_p[index] = new Promise((resolve,reject) => {
// 					const i = index;
// 					RemList.findAll({
// 						where: {
// 							type: 'Customers',
// 							typeKey: items.dataValues.user_id
// 						}
// 					}).then(_result => {
// 						const staffMap = new base.StaffMap().getStaffMap();
// 						const remList = _result.map(items => {
// 							items.dataValues.insert_person = staffMap[items.dataValues.insert_person].user_name;
// 							return items;
// 						});
// 						result[index].dataValues.remList = remList;
// 						resolve();
// 					}).catch(e => LOG(e));
// 				});
// 			});
// 			Promise.all(_p).then(() => {
// 				cb(result);
// 			}).catch(e => LOG(e));
// 		}
// 		getAllData(result => {
// 			total = result.count;
// 			sortData(result.rows,result => {
// 				// result = result.splice((page-1)*num,num);
// 				// getRemList(_result,(result) => {
// 					mainContacts(result,result => {
// 						new Trans(result).transToView(result => {
// 							cb({
// 								code: 200,
// 								msg: '',
// 								data: {
// 									data: result,
// 									total: total,
// 									id_arr: removeMarkByFilter(result)
// 								}
// 							});
// 						});
// 					});
// 				// });
// 			});
// 		});
// 	});
// }

/**
 *  具体某个客户
 */
this.getTargetItem = (params,cb) => {
	const { targetKey } = params;
	Customers.findOne({
		where: {
			isdel: 0,
			'$or': {
				user_id: targetKey,
				company: targetKey,
				abb: targetKey,
				cn_abb: targetKey
			}
		}
	}).then(result => {
		// RemList.findAll({
		// 	where: {
		// 		type: 'Customers',
		// 		typeKey: result.dataValues.user_id
		// 	}
		// }).then(_result => {
		// 	result.dataValues.remList = _result;
		if(result){
			new Trans([result]).transToView(result => {
				cb({
					code: 200,
					msg: '',
					data: result[0]
				});
			});
		}else{
			cb({
				code: -1,
				msg: '',
				data: {}
			});
		}
		// }).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

/**
 *  指定参数搜索
 */
this.orderParamsList = (params,cb) => {
	Customers.findAll({
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
 *	更新客户数据列表
 */
this.update = (params,cb) => {
	let { form_data,admin_id } = params;
	//主要联系人的改变（法人，合伙人，注册人，财务，采购）
	const mainPersonDiff = (form_data,cb) => {
		const checkDiff = (oldPerson,newPerson,job) => {
			let oldArr,newArr;
			if(oldPerson==newPerson){
				return [];
			}else{
				const changeArr = [];
				try{
					oldArr = oldPerson.split(',');
				}catch(e){
					oldArr = [];
				}
				try{
					newArr = newPerson.split(',');
				}catch(e){
					newArr = [];
				}
				oldArr = oldArr.filter(items => items);
				newArr = newArr.filter(items => items);
				oldArr.forEach((items,index) => {
					if(newArr.indexOf(items)==-1){
						changeArr.push({
							name: items,
							company: form_data.company,
							job: job
						});
					}
				});
				return changeArr;
			}
		}
		Customers.findOne({
			where: {
				user_id: form_data.user_id,
				isdel: 0
			}
		}).then(result => {
			let { reg_person,partner,finance,purchase } = result.dataValues;
			let sub_partner = form_data.partner;
			let sub_reg_person = form_data.reg_person;
			let sub_finance = form_data.finance;
			let sub_purchase = form_data.purchase;
			const allArr = [
				...checkDiff(reg_person,sub_reg_person,'注册人'),
				...checkDiff(partner,sub_partner,'合伙人'),
				...checkDiff(finance,sub_finance,'财务'),
				...checkDiff(purchase,sub_purchase,'采购')
			];
			cb();
			const _p = [];
			allArr.forEach((items,index) => {
				_p[index] = new Promise((resolve,reject) => {
					const name = items.name;
					const company = items.company;
					Member.update({
						state: '待认证',
						checked: 0,
						check_company: 0,
						check_job: 0,
						update_person: admin_id,
						check_time: TIME()
					},{
						where: {
							name: items.name,
							company: items.company
						}
					}).then(() => {
						Member.findOne({
							where: {
								name: name,
								company: company
							}
						}).then(result => {
							try{
								const calculScore = new base.CalculScore(result.dataValues);
								calculScore.getItemScore(() => {
									calculScore.getPartScore(() => {
										calculScore.updateMemberScore(() => {
											resolve();
										});
									});
								});
							}catch(e){
								resolve();
							}
						}).catch(e => LOG(e));
					}).catch(e => LOG(e));
				});
			});
			Promise.all(_p).then(() => {}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}
	let that = this;
	form_data = JSON.parse(form_data);
	delete form_data.insert_person;
	delete form_data.insert_time;
	form_data.update_person = admin_id;
	form_data.update_time = TIME();
	try{
		form_data.abb = form_data.abb.toUpperCase();
	}catch(e){}
	let _p = [];
	_p[0] = new Promise((resolve,reject) => {
		that.checkAbb({
			abb: form_data.abb
		},(result) => {
			if(result[0]==null){
				resolve();
			}else if(result.length>1){
				reject('英文简称重复');
			}else if(result.length==1){
				let user_id = form_data.user_id;
				let sql_user_id = result[0].user_id;
				if(user_id==sql_user_id){
					resolve();
				}else{
					reject('英文简称重复');
				}
			}
		});
	});
	_p[1] = new Promise((resolve,reject) => {
		that.checkCnAbb({
			cn_abb: form_data.cn_abb
		},(result) => {
			if(result[0]==null){
				resolve();
			}else if(result.length>1){
				reject('中文简称重复');
			}else if(result.length==1){
				let user_id = form_data.user_id;
				let sql_user_id = result[0].user_id;
				if(user_id==sql_user_id){
					resolve();
				}else{
					reject('中文简称重复');
				}
			}
		});
	});
	_p[2] = new Promise((resolve,reject) => {
		that.checkCpy({
			company: form_data.company
		},(result) => {
			if(result[0]==null){
				resolve();
			}else if(result.length>1){
				reject('公司重复');
			}else if(result.length==1){
				let user_id = form_data.user_id;
				let sql_user_id = result[0].user_id;
				if(user_id==sql_user_id){
					resolve();
				}else{
					reject('公司重复');
				}
			}
		});
	});
	Promise.all(_p).then(() => {
		new Trans([form_data]).transToModel(form_data => {
			form_data = form_data[0];
			//主要联系人改变
			mainPersonDiff(form_data,() => {
				//更新
				delete form_data.company;
				delete form_data.province;
				delete form_data.town;
				delete form_data.zip_code;
				delete form_data.certified;
				delete form_data.certifiedPerson;
				Customers.update(form_data,{
					where: {
						user_id: form_data.user_id
					}
				}).then(result => {
					if (form_data.isdel == 1) {
						// 是删除操作，需要更新sub_type
						serviceVerUnit.updateSubType({
							user_id: form_data.user_id,
							admin_id,
							sub_type: '客',
						});
					}
					// 判断是否有意向产品，有的话得更新意向度
					if (form_data.intention_products) {
						oldFileCustomers.fromProductsChange({
							user_id: form_data.user_id,
						});
					}
					cb({
						code: 200,
						msg: '',
						data: result
					});
					that.calcauInfo({
						user_id: form_data.user_id,
						admin_id: admin_id
					});
				}).catch(e => LOG(e));
			});
		});
	}).catch(e => {
		cb({
			code: -1,
			msg: e,
			data: []
		});
	});
	// 清空信用总览缓存
	require('../cache/creditInfo').clearCache();
	require('../cache/cacheCustomerInfo').clearCache();
}

this.refreshCustomerCache = cb => {
// 	// 重新存储客户信息缓存
	this.cacheList({}, result => {
		cacheCustomerInfo.setCache(result);
		cb();
	});
}

/**
 *	插入客户数据列表
 */
this.add = (params,cb) => {
	let { form_data,admin_id } = params;
	let that = this;
	form_data = JSON.parse(form_data);
	form_data.insert_person = admin_id;
	form_data.insert_time = DATETIME();
	form_data.update_person = admin_id;
	form_data.update_time = TIME();
	form_data.abb = form_data.abb.toUpperCase();
	let _p = [];
	_p[0] = new Promise((resolve,reject) => {
		that.checkAbb({
			abb: form_data.abb
		},(result) => {
			if(result[0]==null){
				resolve();
			}else{
				reject('英文简称重复');
			}
		});
	});
	_p[1] = new Promise((resolve,reject) => {
		that.checkCnAbb({
			cn_abb: form_data.cn_abb
		},(result) => {
			if(result[0]==null){
				resolve();
			}else{
				reject('中文简称重复');
			}
		});
	});
	_p[2] = new Promise((resolve,reject) => {
		that.checkCpy({
			company: form_data.company
		},(result) => {
			console.log(result);
			if(result[0]==null){
				resolve();
			}else{
				reject('公司重复');
			}
		});
	});
	Promise.all(_p).then(async () => {
		const res = await serviceVerUnit.create({ user_id: form_data.user_id, company: form_data.company, admin_id, town: form_data.town, province: form_data.province, legal_person: form_data.legal_person, sub_type: '客' });
		const { user_id, certified, certifiedPerson } = res.data;
		if (!form_data.user_id) {
			form_data.user_id = user_id;
		}
		if (certified) {
			form_data.certified = certified;
			form_data.certifiedPerson = certifiedPerson;
		}
		// that.createUserId(user_id => {
			// form_data.user_id = user_id;
			new Trans([form_data]).transToModel(form_data => {
				form_data = form_data[0];
				Customers.create(form_data).then(result => {
					cb({
						code: 200,
						msg: '新增成功',
						data: []
					});
					TypeDInfo.create({
						customer_id: form_data.user_id,
					});
					require('../cache/cacheCustomerInfo').clearCache();
					// 新增该客户钱包账户
					serviceWallet.addCount({
						user_id: user_id
					},result => console.log(result));
					that.calcauInfo({
						user_id: form_data.user_id,
						admin_id: admin_id
					});
				}).catch(e => LOG(e));
			});
		// });
	}).catch(e => {
		cb({
			code: -1,
			msg: e,
			data: []
		});
	});
}

/**
 *  生成user_id
 */
this.createUserId = async (cb) => {
	const user_id = await common.createCompanyId();
	cb(user_id);
	// Customers.findOne({
	// 	order: [['user_id','DESC']],
	// 	limit: 1,
	// 	offset: 0
	// }).then(result => {
	// 	let user_id = Number(result.dataValues.user_id);
	// 	// 结尾 0, 6, 8
	// 	do {
	// 		++user_id;
	// 		if( user_id == 1000) user_id = user_id * 10;
	// 	} while ([0, 6, 8].indexOf( user_id % 10 ) === -1);
	// 	cb(user_id);
	// }).catch(e => LOG(e));
}

/**
 *	check英文简称
 */
this.checkAbb = (params,cb) => {
	let { abb } = params;
	let res_arr = [];
	Customers.findAll({
		where: {
			isdel: 0,
			abb: abb
		}
	}).then(result => {
		res_arr = result.map(items => {
			return {
				user_id: items.dataValues.user_id,
				abb: items.dataValues.abb
			}
		});
		cb(res_arr);
	}).catch(e => LOG(e));
}

/**
 *	check中文简称
 */
this.checkCnAbb = (params,cb) => {
	let { cn_abb } = params;
	let res_arr = [];
	Customers.findAll({
		where: {
			isdel: 0,
			cn_abb: cn_abb
		}
	}).then(result => {
		res_arr = result.map(items => {
			return {
				user_id: items.dataValues.user_id,
				cn_abb: items.dataValues.cn_abb
			}
		});
		cb(res_arr);
	}).catch(e => LOG(e));
}

/**
 *	check公司名
 */
this.checkCpy = (params,cb) => {
	let { company } = params;
	let res_arr = [];
	Customers.findAll({
		where: {
			isdel: 0,
			company: company
		}
	}).then(result => {
		res_arr = result.map(items => {
			return {
				user_id: items.dataValues.user_id,
				company: items.dataValues.company
			}
		});
		cb(res_arr);
	}).catch(e => LOG(e));
}

/**
 *  更新指定字段
 */
this.patchUpdate = (params,cb) => {
	const { form_data } = params;
	Customers.update(form_data,{
		where: {
			user_id: form_data.user_id
		}
	}).then(result => {
		cb(result);
	}).catch(e => LOG(e));
}

/**
 * 信息完整度
 * @param {object} params 
 */
this.calcauInfo = (params) => {
	const { user_id } = params;
	const that = this;
	let denominatorCount = 0;	//分母
	let molecularCount = 0;		//分子
	Customers.findOne({
		where: {
			user_id: user_id
		}
	}).then(result => {
		let form_data = result.dataValues;
		for(let key in form_data){
			denominatorCount++;
			if(form_data[key]!=''&&form_data[key]!=null&&form_data[key]!='null'){
				molecularCount++;
			}
		}
		let info_score = parseInt(molecularCount/denominatorCount*100);
		that.patchUpdate({
			form_data: {
				user_id: user_id,
				info_score: info_score
			}
		},() => {});
	}).catch(e => LOG(e));
}

/**
 *  公司列表（远程搜索用）
 */
this.remoteSearchCustomers = (params,cb) => {
	const { keywords } = params;
	Customers.findAll({
		where: {
			isdel: 0,
			certified: 1,
			'$or': {
				company: {
					'$like': '%'+keywords+'%'
				},
				abb: {
					'$like': '%'+keywords+'%'
				},
				cn_abb: {
					'$like': '%'+keywords+'%'
				},
				user_id: keywords
			}
		},
		limit: 20,
		offset: 0
	}).then(result => {
		const resArr = [];
		result.forEach((items,index) => {
			resArr.push({
				text: items.dataValues.company,
				value: items.dataValues.company,
				data: {
					user_id: items.dataValues.user_id,
					abb: items.dataValues.abb,
					company: items.dataValues.company,
				}
			});
		});
		cb({
			code: 200,
			msg: '',
			data: resArr
		});
	}).catch(e => LOG(e));
}

/**
 * 导出指定字段
 */
this.exportXlsx = (params,cb) => {
	const attributes = [], labelArr = [];
	let { formData, filter } = params;
	const where = {
		isdel: 0
	};
	formData = typeof(formData) == 'object' ? formData : JSON.parse(formData);
	try{
		filter = typeof(filter) == 'object' ? filter : JSON.parse(filter);
	}catch(e){
		filter = {};
	}
	// 筛选条件
	if(filter.level){
		const levelArr = filter.level.split(',').filter(items => items);
		where.level = {
			'$in': levelArr
		};
	}
	if(filter.certified){
		const certifiedArr = filter.certified.split(',').filter(items => items);
		certifiedArr.forEach((items,index) => {
			if(items=='待认证'){
				certifiedArr[index] = 0;
			}else if(items=='已认证'){
				certifiedArr[index] = 1;
			}else{
				certifiedArr[index] = 2;
			}
		});
		where.certified = {
			'$in': certifiedArr
		};
	}
	return new Promise((resolve,reject) => {
		if(filter.group){
			const groupArr = filter.group.split(',').filter(items => items);
			Staff.findAll({
				where: {
					isdel: 0,
					group: {
						'$in': groupArr
					}
				}
			}).then(result => {
				const rArr = [];
				result.forEach((items,index) => {
					rArr.push(items.dataValues.user_name);
				});
				groupArr.forEach((items,index) => {
					rArr.push(items);
				});
				where.manager = {
					'$in': rArr
				};
				resolve();
			}).catch(e => LOG(e));
		}else{
			resolve();
		}
	}).then(() => {
		for(let key in formData){
			attributes.push(key);
			labelArr.push(formData[key]);
		}
		Customers.findAll({
			attributes,
			where,
			order: [['id']]
		}).then(result => {
			const data = [labelArr];
			result.forEach(items => {
				const p_arr = [];
				attributes.forEach(it => {
					p_arr.push(items[it]);
				});
				data.push(p_arr);
			});
			var buffer = xlsx.build([
				{
					name: 'sheet1',
					data,
				}
			]);
			let path_str = DIRNAME;
			['downloads','cusxlsx'].forEach(function(items,index){
				path_str += '/'+items;
				if(!fs.existsSync(path_str)) fs.mkdirSync(path_str);
			});
			const t = Date.now().toString();
			const fileName = '客户信息（'+t+'）.xlsx';
			try{
				fs.writeFileSync(path_str+'/'+fileName,buffer,{'flag':'w'});
			}catch(e){
				throw e;
			}
			cb({
				code: 200,
				msg: '导出成功',
				data: '/cusxlsx/'+fileName
			});
		}).catch(e => {
			cb({
				code: -1,
				msg: e.message,
				data: []
			});
		});
	});
}

/**
 * 获取指定公司的评级记录
 */
this.getRatingHistoryList = (params,cb) => {
	let { company } = params;
	CustomersStarList.findAll({
		where: {
			company,
			isdel: 0
		},
		order: [['ratingYear','DESC'],['id','DESC']]
	}).then(result => {
		cb({
			code: 200,
			msg: '',
			data: result
		});
	}).catch(e => cb({
		code: -1,
		msg: e.message,
		data: []
	}));
}

/**
 * 新增评级记录
 */
this.addRatingHistory = (params,cb) => {
	const { company, star, ratingYear } = params;
	sequelize.transaction(t => {
		return Customers.update({
			star,
		},{
			where: {
				company
			},
			transaction: t
		}).then(() => {
			return CustomersStarList.create({
				company,
				star,
				ratingYear,
				insertTime: TIME()
			},{
				transaction: t
			});
		});
	}).then(() => {
		cb({
			code: 200,
			msg: '新增成功',
			data: star
		});
	}).catch(e => cb({
		code: -1,
		msg: e.message,
		data: []
	}));
}