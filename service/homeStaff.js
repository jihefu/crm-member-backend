const Staff = require('../dao').Staff;
const Menu = require('../dao').Menu;
const common = require('./common');
const sequelize = require('../dao').sequelize;
const serviceAttendance = require('./homeAttendance');
const base = require('./base');

/**
 *	员工列表
 */
this.list = (params,cb) => {
	let page = params.page?parseInt(params.page):1;
	let num = params.num?parseInt(params.num):30;
	let keywords = params.keywords?params.keywords:'';
	let order = params.order?params.order:'id';
	let { on_job } = JSON.parse(params.filter);
	if(on_job.split(',').length==2||on_job.split(',').length==0){
		on_job = 2;
	}else if(on_job=='离职'){
		on_job = 0;
	}else{
		on_job = 1;
	}
	let sqlWhere;
	if(order=='id'){
		order = ['id'];
	}else if(order=='update_time'){
		order = ['update_time','DESC'];
	}
	let markOrder;
	common.infoMark({
		type: 'Staff'
	},resObj => {
		const { str,id_arr } = resObj;
		if(str){
			markOrder =	[[sequelize.literal('if('+str+',0,1)')],order];
		}else{
			markOrder =	[order];
		}
		if(on_job==2){
			sqlWhere = {
				where: {
					isdel: 0,
					'$or': {
						user_name: {
							'$like': '%'+keywords+'%'
						},
						user_id: {
							'$like': '%'+keywords+'%'
						},
						phone: {
							'$like': '%'+keywords+'%'
						}
					}
				},
				order: [...markOrder,['on_job','DESC']],
				limit: num,
				offset: (page - 1) * num
			};
		}else{
			sqlWhere = {
				where: {
					isdel: 0,
					on_job: on_job,
					'$or': {
						user_name: {
							'$like': '%'+keywords+'%'
						},
						user_id: {
							'$like': '%'+keywords+'%'
						},
						phone: {
							'$like': '%'+keywords+'%'
						}
					}
				},
				limit: num,
				offset: (page - 1) * num,
				order: markOrder
			};
		}
		Staff.findAndCountAll(sqlWhere).then(result => {
			let res_arr = [],_p = [];
			result.rows.forEach((items,index) => {
				res_arr.push(items.dataValues);
				_p[index] = new Promise((resolve,reject) => {
					let _it = items;
					let in_p = [];
					in_p[0] = new Promise((resolve,reject) => {
						common.idTransToName({
							user_id: _it.dataValues.update_person
						},user_name => {
							_it.dataValues.update_person = user_name;
							resolve();
						});
					});
					in_p[1] = new Promise((resolve,reject) => {
						common.idTransToName({
							user_id: _it.dataValues.leader
						},user_name => {
							_it.dataValues.leader = user_name;
							resolve();
						});
					});
					in_p[2] = new Promise((resolve,reject) => {
						common.idTransToName({
							user_id: _it.dataValues.insert_person
						},user_name => {
							_it.dataValues.insert_person = user_name;
							resolve();
						});
					});
					Promise.all(in_p).then(() => {
						resolve();
					}).catch(e => LOG(e));
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
 *	获得指定id的信息
 */
this.getTargetItem = (params,cb) => {
	const { id } = params;
	Staff.findOne({
		where: {
			id: id
		}
	}).then(result => {
		common.idTransToName({
			user_id: result.dataValues.leader
		},user_name => {
			result.dataValues.leader = user_name;
			cb({
				code: 200,
				msg: '',
				data: result
			});
		});
	}).catch(e => LOG(e));
}

/**
 *  指定搜索参数
 */
this.orderParamsList = (params,cb) => {
	Staff.findAll({
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
 *	根据行政等级获取员工
 */
this.getListByLevel = (params,cb) => {
	const { level } = params;
	Staff.findAll({
		where: {
			isdel: 0,
			on_job: 1,
			level: {
				'$gte': Number(level)
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
 *  获取所有在职员工信息
 */
this.staffAll = (params,cb) => {
	Staff.findAll({
		where: {
			isdel: 0,
			on_job: 1
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
 *  user_id转换成user_name
 */
this.idTransToName = (params,cb) => {
	let userIdArr = JSON.parse(params.userIdArr);
	const _p = [],resArr = [];
	userIdArr.forEach((items,index) => {
		_p[index] = new Promise((resolve,reject) => {
			const i = index;
			common.idTransToName({
				user_id: items
			},user_name => {
				resArr[i] = user_name;
				resolve();
			});
		});
	});
	Promise.all(_p).then(() => {
		cb({
			code: 200,
			msg: '',
			data: resArr
		});
	}).catch(e => LOG(e));
}

/**
 *	员工自身
 */
this.self = (params,cb) => {
	let { admin_id } = params;
	Staff.findOne({
		where: {
			user_id: admin_id
		}
	}).then(result => {
		let in_p = [];
		in_p[0] = new Promise((resolve,reject) => {
			common.idTransToName({
				user_id: result.dataValues.update_person
			},user_name => {
				result.dataValues.update_person = user_name;
				resolve();
			});
		});
		in_p[1] = new Promise((resolve,reject) => {
			common.idTransToName({
				user_id: result.dataValues.leader
			},user_name => {
				result.dataValues.leader = user_name;
				resolve();
			});
		});
		in_p[2] = new Promise((resolve,reject) => {
			common.idTransToName({
				user_id: result.dataValues.insert_person
			},user_name => {
				result.dataValues.insert_person = user_name;
				resolve();
			});
		});
		Promise.all(in_p).then(() => {
			cb({
				code: 200,
				msg: '',
				data: result.dataValues
			});
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

/**
 *  获取定价单操作权限
 */
this.getPricingAuth = (params,cb) => {
	Staff.findAll({
		where: {
			isdel: 0,
			on_job: 1
		}
	}).then(result => {
		const editor = [],checker = [];
		result.forEach((items,index) => {
			try{
				if(items.dataValues.duty.indexOf('定价单编辑员')!=-1){
					editor.push(items.dataValues.user_id);
				}else if(items.dataValues.duty.indexOf('定价单审核员')!=-1){
					checker.push(items.dataValues.user_id);
				}
			}catch(e){

			}
		});
		cb({
			code: 200,
			msg: '',
			data: {
				editor: editor,
				checker: checker
			}
		});
	}).catch(e => LOG(e));
}

/**
 *	更新员工信息
 */
this.update = (params,cb) => {
	let { form_data,admin_id } = params;
	form_data.update_time = TIME();
	form_data.update_person = admin_id;
	delete form_data.insert_person;
	common.staffNameTransToUserId({
		user_name: form_data.leader
	},user_id => {
		form_data.leader = user_id;
		Staff.update(form_data,{
			where: {
				id: form_data.id
			}
		}).then(() => {
			cb({
				code: 200,
				msg: '更新成功',
				data: []
			});
			new base.StaffMap().setStaffMap();
		}).catch(e => LOG(e));
	});
	// 清空信用总览缓存
	require('../cache/creditInfo').clearCache();
	require('../cache/cacheCustomerInfo').clearCache();
}

/**
 * 批量删除员工
 */
exports.delBatch = async params => {
	const { idArr, admin_id } = params;
	await Staff.update({ isdel: 1, update_person: admin_id, update_time: TIME() }, { where: { id: { $in: idArr } } });
	return { code: 200, msg: '批量删除成功' };
}

/**
 *	新增员工信息
 */
this.add = async (params,cb) => {
	let { form_data,admin_id } = params;
	form_data.update_time = TIME();
	form_data.update_person = admin_id;
	form_data.insert_person = admin_id;
	form_data.insert_time = TIME();
	form_data.on_job = 1;
	form_data.leader = 101;
	form_data.sex = '男';
	form_data.branch = '客户关系部';
	form_data.level = 4;
	form_data.in_job_time = TIME();
	const { user_id } = form_data;
	const isExist = await Staff.findOne({ where: { user_id, isdel: 0 } });
	if (isExist) {
		cb({ code: -1, msg: '工号已存在' });
		return;
	}
	Staff.create(form_data).then(() => {
		cb({
			code: 200,
			msg: '新增成功',
			data: []
		});
		serviceAttendance.addSignItem();
		new base.StaffMap().setStaffMap();
	}).catch(e => LOG(e));
	// 清空信用总览缓存
	require('../cache/creditInfo').clearCache();
	require('../cache/cacheCustomerInfo').clearCache();
}

/**
 *  远程搜索
 */
this.remoteSearchStaff = (params,cb) => {
	const { keywords, branch } = params;
	let where = {
		isdel: 0,
		on_job: 1,
		'$or': {
			user_name: {
				'$like': '%'+keywords+'%'
			},
			English_name: {
				'$like': '%'+keywords+'%'
			},
			English_abb: {
				'$like': '%'+keywords+'%'
			},
			user_id: {
				'$like': '%'+keywords+'%'
			},
		}
	};
	if(branch) where.branch = branch;
	Staff.findAll({
		where: where,
		limit: 20,
		offset: 0
	}).then(result => {
		const resArr = [];
		result.forEach((items,index) => {
			resArr.push({
				text: items.dataValues.user_name,
				value: items.dataValues.user_name,
				data: {
					user_id: items.dataValues.user_id
				}
			});
		});
		cb({
			code: 200,
			msg: '',
			data: resArr
		});
	});
}