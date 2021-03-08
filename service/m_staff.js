var express = require('express');
var url = require('url');
var fs = require('fs');
var path = require('path');
var base = require('../controllers/base');
var Staff = require('../dao').Staff;
var Member = require('../dao').Member;
var Salary = require('../dao').Salary;
var sequelize = require('../dao').sequelize;
var OnDuty = require('../dao').OnDuty;
const serviceHomeAttendance = require('./homeAttendance');

/**
 * 	身份确认
 */
this.check = function(params,cb){
	var code = params.code;
	var open_id = params.open_id;
	if(code==10001){
		cb({
			code: 200,
			msg: '员工',
			data: []
		});
	}else{
		//基本不用，/member/index 已经做过处理
		//从 /member/index 重定向过来
		Member.findAll({
			where: {
				open_id: open_id,
				company: '杭州朗杰测控技术开发有限公司',
				check_company: 1
			}
		}).then(function(result){
			if(result[0]==null){
				cb({
					code: -1,
					msg: '公司名称不正确或审核未通过',
					data: []
				});
				return;
			}else{
				var name = result[0].dataValues.name;
			}
			Staff.findAll({
				where: {
					user_name: name
				}
			}).then(function(result){
				if(result[0]==null){
					cb({
						code: -1,
						msg: '员工信息未录入',
						data: []
					});
					return;
				}else{
					Staff.update({
						open_id: open_id
					},{
						where: {
							user_name: name
						}
					}).then(function(result){
						cb({
							code: 200,
							msg: '员工',
							data: []
						});
					}).catch(function(e){
						LOG(e);
					});
				}
			}).catch(function(e){
				LOG(e);
			});
		}).catch(function(e){
			LOG(e);
		});
	}
}

/**
 * 	首页
 */
this.main = function(params,cb){
	Staff.findAll({
		where: {
			'$and': {
				open_id: params.open_id
			}
		}
	}).then(function(result){
		result = result[0].dataValues;
		var obj = {
			user_id: {comment: '工号'},
			user_name: {comment: '姓名'},
			sex: {comment: '性别'},
			phone: {comment: '手机号码'},
			work_phone: {comment: '工作号码'},
			qq: {comment: 'qq'},
			branch: {comment: '部门'},
			position: {comment: '职位'},
			work_addr: {comment: '工作地点'},
			leader: {comment: '上级'},
			seat: {comment: '座位'},
			in_job_time: {comment: '入职时间'},
			birth: {comment: '生日'},
			identify: {comment: '身份证'},
			nation: {comment: '民族'},
			native: {comment: '籍贯'},
			native_adr: {comment: '户籍地址'},
			edu: {comment: '学历'},
			school: {comment: '毕业院校'},
			pro: {comment: '专业'},
			wife_child: {comment: '配偶'},
			em_contacter: {comment: '紧急联系人'},
			em_phone: {comment: '紧急联系人号码'},
			rem: {comment: '备注'},
			album: {comment: '头像'},
			update_time: {comment: '更新时间'}
		};
		for(var i in obj){
			for(var j in result){
				if(i==j){
					obj[i].value = result[j];
					obj[i].visible = 1;
					obj[i].model = result[j];
					obj[i].type = 'input';
					obj[i].readonly = '';
					if(i=='user_id'||i=='leader'||i=='update_time'){
						obj[i].readonly = 'readonly';
					}
					if(i=='album'){
						obj[i].visible = 0;
					}else if(i=='in_job_time'||i=='birth'){
						obj[i].value = DATETIME(obj[i].value);
					}else if(i=='update_time'){
						obj[i].value = TIME(obj[i].value);
					}
					if(i=='sex'){
						obj[i].type = 'select';
						obj[i].option = ["男","女"];
					}else if(i=='branch'){
						obj[i].type = 'select';
						obj[i].option = ["研发部","财务部","生产部","客户关系部","其他"];
					}else if(i=='edu'){
						obj[i].type = 'select';
						obj[i].option = ["博士","硕士","本科","专科","高中","其他"];
					}else if(i=='in_job_time'||i=='birth'){
						obj[i].type = 'button';
					}
				}
			}
		}
		new Promise(function(resolve){
			Staff.findAll({
				where: {
					'$and': {
						user_id: obj['leader'].value
					}
				}
			}).then(function(result){
				if(result[0]==null){
					var leader = obj['leader'].value;
				}else{
					var leader = result[0].dataValues.user_name;
				}
				resolve(leader);
			});
		}).then(function(leader){
			obj['leader'].value = leader;
			cb(obj);
		});
	}).catch(function(e){
		LOG(e);
	});
}

/**
 *  点击客服值日
 */
this.cusDuty = (params,cb) => {
	const { admin_id } = params;
	const date = DATETIME();
	OnDuty.findOne({
		where: {
			date: date,
			type: 2,
			isdel: 0
		}
	}).then(result => {
		if(result){
			let { user_id } = result.dataValues;
			if(admin_id==user_id){
				//取消客服值日
				serviceHomeAttendance.cancelApplyCusDuty({
					admin_id: admin_id
				},result => cb(result));
			}else{
				//客服值日
				serviceHomeAttendance.applyCusDuty({
					admin_id: admin_id
				},result => cb(result));
			}
		}else{
			//客服值日
			serviceHomeAttendance.applyCusDuty({
				admin_id: admin_id
			},result => cb(result));
		}
	}).catch(e => LOG(e));
}

/**
 *  点击安卫值日
 */
this.safeDuty = (params,cb) => {
	const { admin_id } = params;
	const date = DATETIME();
	OnDuty.findOne({
		where: {
			date: date,
			type: 1,
			isdel: 0
		}
	}).then(result => {
		if(result){
			let { user_id } = result.dataValues;
			if(admin_id==user_id){
				//取消安卫值日
				serviceHomeAttendance.cancelApplyDuty({
					admin_id: admin_id
				},result => cb(result));
			}else{
				//安卫值日
				serviceHomeAttendance.applyDuty({
					admin_id: admin_id
				},result => cb(result));
			}
		}else{
			//安卫值日
			serviceHomeAttendance.applyDuty({
				admin_id: admin_id
			},result => cb(result));
		}
	}).catch(e => LOG(e));
}

/**
 *  点击内勤值日
 */
this.insideDuty = (params,cb) => {
	const { admin_id } = params;
	const date = DATETIME();
	OnDuty.findOne({
		where: {
			date: date,
			type: 3,
			isdel: 0
		}
	}).then(result => {
		if(result){
			let { user_id } = result.dataValues;
			if(admin_id==user_id){
				//取消内勤值日
				serviceHomeAttendance.cancelInsideDuty({
					admin_id: admin_id
				},result => cb(result));
			}else{
				//内勤值日
				serviceHomeAttendance.applyInsideDuty({
					admin_id: admin_id
				},result => cb(result));
			}
		}else{
			//内勤值日
			serviceHomeAttendance.applyInsideDuty({
				admin_id: admin_id
			},result => cb(result));
		}
	}).catch(e => LOG(e));
}

/**
 * 	上传头像
 */
this.uploadImg = function(req,cb){
	new Promise(function(resolve){
		Staff.findAll({
			where: {
				'$and': {
					open_id: req.session.open_id
				}
			}
		}).then(function(result){
			var user_id = result[0].dataValues.user_id;
			resolve(user_id);
		});
	}).then(function(user_id){
		var uploadImg = new base.UploadImgPro(DIRNAME+'/public/img/employees/'+user_id,1);
		uploadImg.upload(req,function(result){
			cb('employees/'+user_id+'/'+result);
		});
	});
}

/**
 * 	基本信息提交
 */
this.basicInfoSub = function(params,cb){
	params.formData.update_time = TIME();
	Staff.update(params.formData,{
		where: {
			open_id: params.open_id
		}
	}).then(function(result){
		cb(result);
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	工资信息查询
 */
this.salaryInfo = function(params,cb){
	var open_id = params.open_id;
	var y_m_salary = params.y_m_salary;
	let p_v = new Promise(function(resolve,reject){
		Staff.findAll({
			where: {
				open_id: open_id
			}
		}).then(function(result){
			var user_name = result[0].dataValues.user_name;
			var condition = {};
			if(y_m_salary){
				condition = {
					where: {
						user_name: user_name,
						y_m_salary: y_m_salary
					}
				};
			}else{
				condition = {
					where: {
						user_name: user_name
					},
					order: [['y_m_salary','DESC']],
					limit: 1,
					offset: 0
				};
			}
			Salary.findAll(condition).then(function(result){
				var res_arr = [];
				result.forEach(function(items,index){
					res_arr.push(items.dataValues);
				});
				try{
					var y_m_salary = res_arr[0].y_m_salary;
				}catch(e){
					reject('newStaff');
				}
				Salary.findAll({
					where: {
						additional_person: user_name,
						y_m_salary: y_m_salary
					}
				}).then(function(result){
					if(result[0]==null){
						resolve(res_arr);
					}else{
						var s_arr = [];
						result.forEach(function(items,index){
							s_arr.push(items.dataValues);
						});
						for(var i in res_arr[0]){
							for(var j in s_arr[0]){
								if(i==j&&i!='id'&&i!='user_id'&&i!='user_name'&&i!='additional_person'&&i!='y_m_salary'){
									res_arr[0][i] = Number(res_arr[0][i]) + Number(s_arr[0][j]);
								}
							}
						}
						resolve(res_arr);
					}
				}).catch(function(e){
					LOG(e);
				});
			}).catch(function(e){
				reject(e);
			});
		}).catch(function(e){
			reject(e);
		});
	});
	let p_c = new Promise(function(resolve,reject){
		sequelize.query('SELECT column_name,column_comment FROM INFORMATION_SCHEMA.Columns WHERE table_schema="lj_node" AND table_name="salary"').then(function(comment){
			resolve(comment);
		}).catch(function(e){
			reject(e);
		});
	});
	let p_m = new Promise(function(resolve,reject){
		Staff.findAll({
			where: {
				open_id: open_id
			}
		}).then(function(result){
			var user_name = result[0].dataValues.user_name;
			Salary.findAll({
				attributes: ['y_m_salary'],
				where: {
					user_name: user_name
				},
				order: [['y_m_salary','DESC']],
				limit: 6,
				offset: 0
			}).then(function(result){
				var res_arr = [];
				result.forEach(function(items,index){
					res_arr.push(items.dataValues);
				});
				resolve(res_arr);
			}).catch(function(e){
				LOG(e);
			});
		}).catch(function(e){
			LOG(e);
		});
	});
	Promise.all([p_v,p_c,p_m]).then(function(result){
		cb(result);
	}).catch(function(e){
		if(e=='newStaff'){
			cb({
				code: -1,
				msg: '暂无数据',
				data: []
			});
		}else{
			LOG(e);
		}
	});
}

/**
 * 	同事圈
 */
this.colleagueInfo = function(params,cb){
	Staff.findAll({
		attributes: ['id','user_name','phone','user_id','album'],
		where: {
			'$and': {
				isdel: 0,
				on_job: 1
			},
			'$not': {
				open_id: params.open_id
			}
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
 * 	同事圈关联信息
 */
this.colleagueRelativeInfo = function(params,cb){
	var user_id = params.user_id;
	Staff.findAll({
		attributes: ['id','user_name','phone','user_id','album'],
		where: {
			'$and': {
				isdel: 0,
				on_job: 1,
				user_id: user_id
			},
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
 *  根据open_id获取信息
 */
this.getStaffInfoByOpenId = (open_id,cb) => {
	Staff.findOne({
		where: {
			open_id
		}
	}).then(result => {
		cb(result);
	}).catch(e => LOG(e));
}