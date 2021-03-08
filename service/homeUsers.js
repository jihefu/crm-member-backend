const Staff = require('../dao').Staff;
const Customers = require('../dao').Customers;
const Users = require('../dao').Users;
const common = require('./common');
const serviceHomeCustomers = require('./homeCustomers');
const sequelize = require('../dao').sequelize;

/**
 *	用户数据列表
 */
this.list = (params,cb) => {
	let num = params.num?parseInt(params.num):10;
	let page = params.page?parseInt(params.page):1;
	let keywords = params.keywords?params.keywords:'';
	let order = params.order?params.order:'id';
	if(order=='id'){
		order = ['id','DESC'];
	}else if(order=='update_time'){
		order = ['update_time','DESC'];
	}
	let markOrder;
	common.infoMark({
		type: 'Users'
	},resObj => {
		const { str,id_arr } = resObj;
		if(str){
			markOrder =	[[sequelize.literal('if('+str+',0,1)')],order];
		}else{
			markOrder =	[order];
		}
		Users.findAndCountAll({
			where: {	
				isdel: 0,
				'$or': {
					company: {
						'$like': '%'+keywords+'%'
					},
					abb: {
						'$like': '%'+keywords+'%'
					},
					user_id: {
						'$like': '%'+keywords+'%'
					}
				}
			},
			limit: num,
			offset: (page -1) * num,
			order: markOrder
		}).then(result => {
			let res_arr = [],_p = [];
			result.rows.forEach((items,index) => {
				res_arr.push(items.dataValues);
				_p[index] = new Promise((resolve,reject) => {
					let _it = items;
					common.idTransToName({
						user_id: _it.dataValues.update_person
					},user_name => {
						_it.dataValues.update_person = user_name;
						common.idTransToName({
							user_id: _it.dataValues.insert_person
						},user_name => {
							_it.dataValues.insert_person = user_name;
							resolve();
						});
					});
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
 *  具体某个客户
 */
this.info = (params,cb) => {
	const { targetKey } = params;
	Users.findOne({
		where: {
			isdel: 0,
			'$or': {
				id: targetKey,
				company: targetKey,
				abb: targetKey,
				cn_abb: targetKey
			}
		}
	}).then(result => {
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
	Users.findAll({
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
 *	更新用户数据列表
 */
this.update = (params,cb) => {
	let { form_data,admin_id } = params;
	form_data = JSON.parse(form_data);
	delete form_data.insert_person;
	delete form_data.insert_time;
	form_data.update_person = admin_id;
	form_data.update_time = TIME();
	let _p = [];
	_p[0] = new Promise((resolve,reject) => {
		serviceHomeCustomers.checkAbb({
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
		serviceHomeCustomers.checkCnAbb({
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
		serviceHomeCustomers.checkCpy({
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
		Users.update(form_data,{
			where: {
				id: form_data.id
			}
		}).then(result => {
			cb({
				code: 200,
				msg: '',
				data: []
			});
		}).catch(e => LOG(e));
	}).catch(e => {
		cb({
			code: -1,
			msg: e,
			data: []
		});
	});
}

/**
 *	插入用户数据列表
 */
this.add = (params,cb) => {
	let { form_data,admin_id } = params;
	form_data = JSON.parse(form_data);
	form_data.update_person = admin_id;
	form_data.update_time = TIME();
	form_data.insert_person = admin_id;
	form_data.insert_time = DATETIME();
	let _p = [];
	_p[0] = new Promise((resolve,reject) => {
		serviceHomeCustomers.checkAbb({
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
		serviceHomeCustomers.checkCnAbb({
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
		serviceHomeCustomers.checkCpy({
			company: form_data.company
		},(result) => {
			if(result[0]==null){
				resolve();
			}else{
				reject('公司重复');
			}
		});
	});
	Promise.all(_p).then(() => {
		Users.findOne({
			order: [['id','desc']],
			limit: 1,
			offset: 0
		}).then(result => {
			let user_id = parseInt(result.dataValues.user_id) + 1;
			form_data.user_id = user_id; 
			Users.create(form_data).then(result => {
				cb({
					code: 200,
					msg: '新增成功',
					data: []
				});
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}).catch(e => {
		cb({
			code: -1,
			msg: e,
			data: []
		});
	});
}