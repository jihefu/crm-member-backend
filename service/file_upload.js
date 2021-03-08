var express = require('express');
var url = require('url');
var path = require('path');
var request = require('request');
var fs = require('fs');
var xlsx = require('node-xlsx');
var base = require('./base');
var common = require('./common');
var formidable = require('formidable');
var sequelize = require('../dao').sequelize;
var Staff = require('../dao').Staff;
var Member = require('../dao').Member;
var Salary = require('../dao').Salary;
var Goods = require('../dao').Goods;
var GoodsBorrowRecords = require('../dao').GoodsBorrowRecords;
const CustomersStarList = require('../dao').CustomersStarList;
const Customers = require('../dao').Customers;

//上传工资excel表
this.excelSalary = function(params,cb){
	var that = this;
	var fields = params.fields;
	var files = params.files;
	var path = params.path;
	var new_path = path + '/salary';
	if(!fs.existsSync(new_path)) fs.mkdirSync(new_path);
	var file_name = files.img.name;
	var file_new_path = new_path +'/'+ file_name;
	fs.renameSync(files.img.path, file_new_path);
	//验证文件命名格式和后缀格式
	var y_m = file_name.split('.')[0];
	var y = y_m.split('-')[0];
	var m = y_m.split('-')[1];
	var m_arr = ['01','02','03','04','05','06','07','08','09','10','11','12'];
	var type = file_name.split('.')[1];
	if(type!='xlsx'){
		cb({
			code: -1,
			msg: '后缀名不正确',
			data: []
		});
		fs.unlink(file_new_path);
		return;
	}
	if(y>2050||y<2016){
		cb({
			code: -1,
			msg: '文件名格式不正确',
			data: []
		});
		fs.unlink(file_new_path);
	}else if(m_arr.indexOf(m)==-1){
		cb({
			code: -1,
			msg: '文件名格式不正确',
			data: []
		});
		fs.unlink(file_new_path);
	}else{
		cb({
			code: 200,
			msg: '上传成功',
			data: []
		});
		//解析文件
		that.dealExcelSalary({
			path: file_new_path,
			salary_date: y_m
		});
	}
}

//解析工资excel表
this.dealExcelSalary = function(params){
	var path = params.path;
	var salary_date = params.salary_date;
	var x_arr = xlsx.parse(path);
	var x_data = x_arr[0].data;
	var act_data = x_data.slice(3,x_data.length-1);
	var _p = [];
	act_data.forEach(function(items,index){
		_p[index] = new Promise(function(resolve,reject){
			var user_name = getOutName(items[2]);
			var additional_person = getInName(items[2]);
			Salary.findAll({
				where: {
					y_m_salary: salary_date,
					user_name: user_name
				}
			}).then(function(result){
				items.forEach(function(it,ind){
					if(it==''){
						items[ind] = 0;
					}
				});
				if(result[0]==null){
					//新增
					Salary.create({
						user_id: items[1],
						user_name: user_name,
						basic_salary: items[3],
						performance_salary: items[4],
						news: items[5],
						meal: items[6],
						overtime: items[7],
						bussiness_trip: items[8],
						service: items[9],
						duty_day: items[10],
						high_temperature: items[11],
						tax_back: items[12],
						absence: items[13],
						affair_not_update: items[14],
						provident_fund_supplement: items[15],
						repay: items[16],
						new_customer: items[17],
						drawback: items[18],
						year_end_awards: items[19],
						should_pay: items[20],
						social_security: items[21],
						provident_fund: items[22],
						salary_personal_tax: items[23],
						year_end_awards_personal_tax: items[24],
						actual_pay: items[25],
						enterprise_social_security: items[26],
						enterprise_provident_fund: items[27],
						additional_person: additional_person,
						y_m_salary: salary_date
					}).then(function(result){
						resolve();
					}).catch(function(e){
						LOG(e);
					});
				}else{
					//更新
					Salary.update({
						user_id: items[1],
						basic_salary: items[3],
						performance_salary: items[4],
						news: items[5],
						meal: items[6],
						overtime: items[7],
						bussiness_trip: items[8],
						service: items[9],
						duty_day: items[10],
						high_temperature: items[11],
						tax_back: items[12],
						absence: items[13],
						affair_not_update: items[14],
						provident_fund_supplement: items[15],
						repay: items[16],
						new_customer: items[17],
						drawback: items[18],
						year_end_awards: items[19],
						should_pay: items[20],
						social_security: items[21],
						provident_fund: items[22],
						salary_personal_tax: items[23],
						year_end_awards_personal_tax: items[24],
						actual_pay: items[25],
						enterprise_social_security: items[26],
						enterprise_provident_fund: items[27],
						additional_person: additional_person,
					},{
						where: {
							y_m_salary: salary_date,
							user_name: user_name
						}
					}).then(function(result){
						resolve();
					}).catch(function(e){
						LOG(e);
					});
				}
			}).catch(function(e){
				LOG(e);
			});
		});
	});
	Promise.all(_p).then(function(){
		console.log('complete');
	}).catch(function(e){
		LOG(e);
	});

	function getOutName(user_name){
		if(user_name.indexOf('（')!=-1){
			user_name = user_name.slice(0,user_name.indexOf('（'));
		}
		return user_name;
	}
	function getInName(user_name){
		if(user_name.indexOf('（')!=-1){
			user_name = user_name.slice(user_name.indexOf('（')+1,user_name.indexOf('）'));
			return user_name;
		}else{
			return null;
		}
	}
}

//解析物品表
this.dealExcelGoods = () => {
	let path = DIRNAME+'/downloads/物品管理2.xlsx';
	let x_arr = xlsx.parse(path)[0].data;
	x_arr = x_arr.slice(1,x_arr.length);
	//购置时间
	const getPurchaseTime = (items) => {
		let purchaseTime;
		if(!items[5]){
			purchaseTime = null;
		}else{
			if(String(items[5]).length==5){
				purchaseTime = DATETIME(new Date(1900,0,items[5]-1));
			}else{
				purchaseTime = items[5];
			}
		}
		return purchaseTime;
	}
	const _p = [];
	x_arr.forEach((items,index) => {
		let numbering = items[0]?items[0]:null;
		let goodsName = items[1]?items[1]:null;
		let goodsType = items[2]?items[2]:null;
		let model = items[3]?items[3]:null;
		let serialNo = items[4]?items[4]:null;
		let purchaseTime = getPurchaseTime(items);
		let originalValue = items[6]?items[6]:null;
		let management = items[8]?items[8]:null;
		let user = items[9]?items[9]:null;
		let location = items[10]?items[10]:null;
		let form_data = {
			numbering: numbering,
			goodsName: goodsName,
			goodsType: goodsType,
			model: model,
			serialNo: serialNo,
			purchaseTime: purchaseTime,
			originalValue: originalValue,
			management: management,
			user: user,
			location: location
		};
		_p[index] = new Promise((resolve,reject) => {
			Goods.create(form_data).then(result => resolve()).catch(e => LOG(e));
		});
	});
	Promise.all(_p).then(() => console.log('okokok')).catch(e => LOG(e));
}

//转换成user_id
this.transToUserId = () => {
	Goods.findAll().then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				let it = items;
				let { user,id } = it.dataValues;
				common.staffNameTransToUserId({
					user_name: user
				},user_id => {
					Goods.update({
						user: user_id
					},{
						where: {
							id: id
						}
					}).then(result => resolve()).catch(e => LOG(e));
				});
			});
		});
		Promise.all(_p).then(result => {
			console.log('112233');
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}
//判断user和manager是否同部门
this.checkBranch = () => {
	Goods.findAll().then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				let it = items;
				let { management,user,id } = it.dataValues;
				Staff.findOne({
					where: {
						user_id: user
					}
				}).then(result => {
					let resBranch;
					try{
						resBranch = result.dataValues.branch;
					}catch(e){
						resolve();
						return;
					}
					if(management==resBranch){
						Goods.update({
							user: null
						},{
							where: {
								id: id
							}
						}).then(result => {
							resolve();
						}).catch(e => LOG(e));
					}else{
						resolve();
					}
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(result => {
			console.log('666');
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}
//添加借用记录
this.addBorrowRecords = () => {
	Goods.findAll({
		where: {
			user: {
				'$ne': null
			}
		}
	}).then(result => {
		const res_arr = result.map(items => items.dataValues);
		const _p = [];
		res_arr.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				const { id,user } = items;
				GoodsBorrowRecords.create({
					borrower: user,
					borrowerStartTime: TIME(),
					borrowingPeriod: 365,
					good_id: id
				}).then(result => resolve()).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => {
			console.log('aadd');
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}
setTimeout(() => {
	// this.addBorrowRecords();
	// this.checkBranch();
	// this.transToUserId();
	// this.dealExcelGoods();
	// Goods.findAll().then(result => {
	// 	const _p = [];
	// 	result.forEach((items,index) => {
	// 		_p[index] = new Promise((resolve,reject) => {
	// 			let it = items;
	// 			let { id,management } = it.dataValues;
	// 			let manager;
	// 			if(management=='研发部'){
	// 				manager = '402';
	// 			}else if(management=='客户关系部'){
	// 				manager = '1103';
	// 			}else if(management=='生产部'){
	// 				manager = '1006';
	// 			}else{
	// 				manager = '1603';
	// 			}
	// 			Goods.update({
	// 				manager: manager
	// 			},{
	// 				where: {
	// 					id: id
	// 				}
	// 			}).then(result => {
	// 				resolve();
	// 			}).catch(e => LOG(e));
	// 		});
	// 	});
	// 	Promise.all(_p).then(result => {
	// 		console.log('ookk');
	// 	}).catch(e => LOG(e));
	// }).catch(e => LOG(e));
},2000);



this.memberList = function(cb){
	Member.findAll().then(function(result){
		var res_arr = [],company_arr = [];
		result.forEach(function(items,index){
			res_arr.push(items.dataValues);
			company_arr.push(items.dataValues.company);
		});
		company_arr = common.arrayUnique(company_arr);
		company_arr.forEach(function(items,index){
			var obj = {
				company: items,
				member: []
			};
			company_arr[index] = obj;
		});
		company_arr.forEach(function(items,index){
			res_arr.forEach(function(it,ind){
				if(items.company==it.company){
					var o = {
						name: it.name,
						job: it.job,
						check_company: it.check_company,
						check_job: it.check_job
					};
					company_arr[index]['member'].push(o);
				}
			});
		});
		var str = '';
		company_arr.forEach(function(items,index){
			str += '<h3>'+items.company+'</h3>';
			items.member.forEach(function(it,ind){
				str += '<p>'+
							'<span>'+it.name+'</span>'+
							'<span style="margin-left: 30px;">'+it.job+'</span>'+
							'<span style="margin-left: 30px;">'+it.check_company+'</span>'+
							'<span style="margin-left: 30px;">'+it.check_job+'</span>'+
						'</p>';
			});
		});
		cb(str);
	}).catch(function(e){
		LOG(e);
	});
}


this.cusLatestRating = (params,cb) => {
	var that = this;
	var fields = params.fields;
	var files = params.files;
	var path = params.path;
	var new_path = path + '/cusRating';
	if(!fs.existsSync(new_path)) fs.mkdirSync(new_path);
	var file_name = files.img.name;
	var file_new_path = new_path +'/'+ file_name;
	fs.renameSync(files.img.path, file_new_path);
	//验证文件命名格式和后缀格式
	var y_m = file_name.split('.')[0];
	var y = y_m.split('-')[0];
	var type = file_name.split('.')[1];
	if(type!='xlsx'){
		cb({
			code: -1,
			msg: '后缀名不正确',
			data: []
		});
		fs.unlink(file_new_path);
		return;
	}
	if(['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','2026','2027','2028','2029'].indexOf(y)==-1){
		cb({
			code: -1,
			msg: '文件名格式不正确',
			data: []
		});
		fs.unlink(file_new_path);
		return;
	}
	if(Number(y)>2050||Number(y)<2000){
		cb({
			code: -1,
			msg: '文件名格式不正确',
			data: []
		});
		fs.unlink(file_new_path);
	}else{
		cb({
			code: 200,
			msg: '上传成功',
			data: []
		});
		//解析文件
		that.dealExcelRating({
			path: file_new_path,
			year: y
		});
	}
}

this.dealExcelRating = (params) => {
	const { path, year } = params;
	const x_arr = xlsx.parse(path);
	const x_data = x_arr[0].data;
	const act_data = x_data.slice(1,x_data.length);
	const _p = [];
	act_data.forEach((items,index) => {
		_p[index] = new Promise((resolve,reject) => {
			const company = items[0];
			let star = items[1] ? items[1] : 0;
			star = star%0.5===0 ? star : Math.floor(star) + 0.5;
			star = star * 2;
			CustomersStarList.create({
				company,
				star,
				ratingYear: year,
				insertTime: TIME()
			}).then(() => {
				Customers.update({
					star,
				},{
					where: {
						company
					}
				}).then(() => resolve()).catch(e => LOG(e));
			}).catch(e => LOG(e));
		});
	});
	Promise.all(_p).then(() => console.log('ookk')).catch(e => LOG(e));
}