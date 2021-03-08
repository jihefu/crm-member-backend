var express = require('express');
var url = require('url');
var formidable = require('formidable');
var request = require('request');
var fs = require('fs');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var formidable = require('formidable');
var base = require('./base');
var common = require('./common');
var modPayments = require('../model/mod_payments');
var modContract = require('../model/contract');
var member = require('../service/member');
var ContractsHead = require('../dao').ContractsHead;
var Customers = require('../dao').Customers;
var Users = require('../dao').Users;
var Staff = require('../dao').Staff;
var serviceMember = require('../service/member');
const serviceCommon = require('../service/common');
const serviceHomeContracts = require('../service/homeContracts');
const sequelize = require('../dao').sequelize;
const setCacheCreditInfo = require('../cache/creditInfo').setCache;
const clearCacheCreditInfo = require('../cache/creditInfo').clearCache;
const InfoMark = require('../dao').InfoMark;
// var napa = require("napajs");

function test(){
	var zone1 = napa.zone.create('zone1', { workers: 4} );

	// function foo(a,b) {
	//    console.log(a);
	//    console.log(b);
	// }	
	// Broadcast code to all 4 workers in 'zone1'.
	// zone1.broadcast(foo.toString());

	zone1.execute((a,b) => {
        return a+'<<>>'+b;
    },['zxc','ccc']).then((result) => {
        console.log(result.value);
    });
}

this.finance = function(req,res,next){
	res.render('./pages/admin_finance',{
		router: ROUTER()
	});
}
this.main = function(req,res,next){
	res.render('./pages/admin_payments');
	// test();
}
this.contractReport = function(req,res,next){
	res.render('./pages/admin_over_report');
}
this.getContractReportData = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company?params.company:'济南天辰试验机制造有限公司';
	member.getCreditBasicData({
		company: company
	},function(result){
		SEND(res,200,'',result);
	});
}
this.getCreditData = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company?params.company:'济南天辰试验机制造有限公司';
	var time = params.time?params.time:0;
	member.getCreditData(company,time,function(result){
		SEND(res,200,'',result);
	});
}
this.getReportList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company?params.company:'济南天辰试验机制造有限公司';
	var time = params.time?params.time:0;
	var type = params.type;
	var method,mark = 0;
	if(type=='inside_count'){
		method = 'getRecList';
	}else if(type=='outside_count'){
		method = 'getOverList';
	}else if(type=='freeze_count'){
		method = 'getFreezeList';
	}else if(type=='contract_num'){
		method = 'getContractsList';
		mark = 1;
	}else{
		method = 'getPaymentsList';
		mark = 1;
	}
	if(!mark){
		member[method](company,function(result){
			SEND(res,200,'',result);
		});
	}else{
		member[method](company,time,function(result){
			SEND(res,200,'',result);
		});
	}
}
this.getOver = function(req,res,next){
	const that = this;
	var params = JSON.parse(req.body.models);
	var page = params.page;
	var num = params.pageSize;
	var keywords = params.keywords;
	var filter = params.filter?params.filter:{
		group: '',
		level: '',
		credit_qualified: ''
	};
	const p1 = new Promise((resolve,reject) => {
		serviceHomeContracts.listCondition({
			keywords: keywords,
			filter: filter
		},whereCondition => resolve(whereCondition));
	});
	const p2 = new Promise((resolve,reject) => {
		serviceHomeContracts.listCondition({
			keywords: keywords,
			filter: filter
		},whereCondition => resolve(whereCondition));
	});
	Promise.all([p1,p2]).then(result => {
		let where = result[0];
		let where2 = result[1];
		where.where['$and'].push(sequelize.where(sequelize.col('Customers.credit_period'), { '$ne': 0}));
		where.where['$and'].push(sequelize.where(sequelize.col('Customers.credit_line'), { '$ne': 0}));
		const filterFun = (cb) => {
			var groupArr = [];
			if(filter.level!=''){
				let filterArr = filter.level.split(',').filter(items => items);
				where.where['$and'].push(sequelize.where(sequelize.col('Customers.level'), { '$in': filterArr}));
				where2.where['$and'].push(sequelize.where(sequelize.col('Customers.level'), { '$in': filterArr}));
			}
			if(filter.credit_qualified!=''){
				let filterArr = filter.credit_qualified.split(',').filter(items => items);
				where.where['$and'].push(sequelize.where(sequelize.col('Customers.credit_qualified'), { '$in': filterArr}));
				let bool = false;
				filterArr.forEach((items,index) => {
					if(items==1) bool = true;
				});
				if(bool){
					//如果筛选条件为合格，条件2直接false
					where2.where['$and'].push(sequelize.where(sequelize.col('Customers.credit_qualified'), { '$eq': 111}));
				}else{
					where2.where['$and'].push(sequelize.where(sequelize.col('Customers.credit_qualified'), { '$eq': 0}));
				}
			}else{
				where2.where['$and'].push(sequelize.where(sequelize.col('Customers.credit_qualified'), { '$eq': 0}));
			}
			if(filter.group!=''){
				let filterArr = filter.group.split(',').filter(items => items);
				Staff.findAll({
					where: {
						group: filterArr
					}
				}).then(result => {
					result.forEach((items,index) => {
						groupArr.push(items.dataValues.user_name);
					});
					groupArr.push(filter.group);
					where.where['$and'].push(sequelize.where(sequelize.col('Customers.manager'), { '$in': groupArr}));
					where2.where['$and'].push(sequelize.where(sequelize.col('Customers.manager'), { '$in': groupArr}));
					cb();
				}).catch(e => LOG(e));
			}else{
				cb();
			}
		}
		new Promise((resolve,reject) => {
			filterFun(() => {
				resolve();
			});
		}).then(() => {
			Customers.findAll(where).then(result => {
				let _arr = [];
				Customers.findAll(where2).then(_result => {
					let _arr = [],hashObj = {};
					for (let i = 0; i < [...result,..._result].length; i++) {
						if(!hashObj[[...result,..._result][i].company]){
							hashObj[[...result,..._result][i].company] = 1;
							_arr.push([...result,..._result][i]);
						}
					}
	
					let count = _arr.length;
					var res_arr = [],_p = [];
					_arr.forEach((items,index) => {
						items.dataValues.credit_period = items.dataValues.credit_period * 30;
						_p[index] = new Promise((resolve,reject) => {
							let company = items.dataValues.company;
							serviceMember.getCreditBasicData({
								company: company
							},function(result){
								res_arr.push(result);
								resolve(res_arr);
							});
						});
					});
					Promise.all(_p).then(async () => {
						// 获取标记的条目，然后重新排序
						resArr = await that.filterMarkItem(res_arr);
						if (keywords == '' && filter.group == '' && filter.level == '' && filter.credit_qualified == '') {
							setCacheCreditInfo(res_arr);
							res.send({
								code: 200,
								data: res_arr.splice((page-1) * num,num),
								total: count
							});
						} else {
							res.send({
								code: 200,
								data: res_arr.splice((page-1) * num,num),
								total: count
							});
							// 重新请求一次接口，缓存所有数据
							request.post(ROUTE('admin/getOver'),(err,response,body) => {
								body = JSON.parse(body);
								setCacheCreditInfo(body.data);
							}).form({
								models: JSON.stringify({
									page: 1,
									pageSize: 300000,
									keywords: '',
								})
							});
						}
					}).catch(e => LOG(e));
				}).catch(e => LOG(e));
			}).catch(e => LOG(e));
		});
	}).catch(e => LOG(e));
}

this.filterMarkItem = async res_arr => {
	const infoMarkEntity = await InfoMark.findAll({ where: { type: 'CreditManage', isdel: 0 }});
	const in_p = [], toTopArr = [];
	infoMarkEntity.forEach((items, index) => {
		in_p[index] = new Promise(async resolve => {
			const { tableId } = items.dataValues;
			const customerEntity = await Customers.findOne({ where: { user_id: tableId }});
			const { company } = customerEntity.dataValues;
			toTopArr.push(company);
			resolve();
		});
	});
	await Promise.all(in_p);
	res_arr.forEach((items, index) => {
		const { company } = items;
		if (toTopArr.indexOf(company) !== -1) {
			res_arr[index].isMark = 1;
		} else {
			res_arr[index].isMark = 0;
		}
	});
	res_arr = res_arr.sort((a, b) => b.isMark - a.isMark);
	return res_arr;
}

// 标记指定信用公司
this.updateMarkItem = async (req, res, next) => {
	clearCacheCreditInfo();
	const params = req.body;
	const { company, isMark } = params;
	const { admin_id } = req.session.admin_id;
	const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
	const { user_id } = customerEntity.dataValues;
	if (isMark == 1) {
		await InfoMark.create({
			type: 'CreditManage',
			tableId: user_id,
			addPerson: admin_id,
			updatePerson: admin_id,
		});
	} else {
		await InfoMark.update({
			isdel: 1,
			updatePerson: admin_id,
		}, {
			where: {
				type: 'CreditManage',
				tableId: user_id,
			},
		});
	}
	res.send({
		code: 200,
		msg: '操作成功',
		data: [],
	});
}

this.getNeedFreezeContracts = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	var _p = [];
	_p[0] = new Promise((resolve,reject) => {
		serviceMember.getRecList(company,function(result){
			resolve(result);
		});
	});
	_p[1] = new Promise((resolve,reject) => {
		serviceMember.getOverList(company,function(result){
			resolve(result);
		});
	});
	_p[2] = new Promise((resolve,reject) => {
		serviceMember.getFreezeList(company,function(result){
			resolve(result);
		});
	});
	Promise.all(_p).then(result => {
		var notFreezeArr = [...result[0],...result[1]];
		var freezeArr = result[2];
		SEND(res,200,'',{
			notFreezeArr: notFreezeArr,
			freezeArr: freezeArr
		});
	}).catch(e => LOG(e));
}

/****************************************支付货款*****************************************/


/**
 *  支付货款一级列表（查）
 */
this.list = function(req,res,next){
	var params = JSON.parse(req.body.models);
	var page = params.page;
	var page_size = params.pageSize;
	var keywords = params.keywords;
	if(params.dir){
		var sort_str = params.field+' '+params.dir;
	}else{
		var sort_str = 'isAssign, id DESC';
	}
	modPayments.list(page,page_size,keywords,sort_str,function(result){
		var _p = [];
		result.rows.forEach(function(items,index){
			_p[index] = new Promise(function(resolve,reject){
				var count = 0;
				var _c_p = [];
				for(let key in items){
					if(key=='insert_person'||key=='update_person'){
						_c_p[count] = new Promise(function(resol,rej){
							common.getEmployeeName(items[key],function(s){
								items[key] = s[0].user_name;
								resol();
							});
						});
						count++;
					}else if(key=='insert_time'||key=='update_time'){
						_c_p[count] = new Promise(function(resol,rej){
							items[key] = items[key]?TIME(items[key]):'';
							resol();
						});
						count++;
					}else if(key=='arrival'){
						_c_p[count] = new Promise(function(resol,rej){
							items[key] = items[key]?DATETIME(items[key]):'';
							resol();
						});
						count++;
					}
				}
				Promise.all(_c_p).then(function(){
					resolve();
				});
			});
		});
		Promise.all(_p).then(function(){
			res.send({
				code: 200,
				data: result.rows,
				total: result.count[0]._count
			});
		});
	});
}

/**
 *  支付货款一级列表（改）
 */
this.update = function(req,res,next){
	var m_arr = JSON.parse(req.body.models);
	var _p = [];
	m_arr.forEach(function(items,index){
		_p[index] = new Promise(function(resolve,reject){
			var params = JSON.parse(req.body.models)[index];
			transDate(params);
			var id = params.id;
			delete params.id;
			delete params.insert_person;
			delete params.insert_time;
			common.getEmployeeIdByToken(req,res,next,function(user_id){
				params.update_person = user_id[0].user_id;
				params.update_time = TIME();
				modPayments.getCusAbb(params.company,function(result){
					params.abb = result[0].abb;
					modPayments.getPayUseInfo(id,function(result){
						if(result[0]==null){
							params.isAssign = 0;
						}else{
							var amount = params.amount;
							var sum = 0;
							result.forEach(function(items,index){
								sum += items.amount;
							});
							if(amount==sum){
								params.isAssign = 1;
							}else{
								params.isAssign = 0;
							}
						}
						modPayments.update(id,params,function(result){
							resolve();
						});
					});
				});
			});
		});
	});
	Promise.all(_p).then(function(){
		SEND(res,2000,'更新成功',[]);
	});
}

/**
 *  支付货款一级列表（增）
 */
this.add = function(req,res,next){
	var m_arr = JSON.parse(req.body.models);
	var _p = [];
	m_arr.forEach(function(items,index){
		_p[index] = new Promise(function(resolve,reject){
			var params = JSON.parse(req.body.models)[index];
			transDate(params);
			common.getEmployeeIdByToken(req,res,next,function(user_id){
				params.update_person = user_id[0].user_id;
				params.update_time = TIME();
				params.insert_person = user_id[0].user_id;
				params.insert_time = TIME();
				params.isAssign = 0;
				params.isdel = 0;
				modPayments.getCusAbb(params.company,function(result){
					params.abb = result[0].abb;
					modPayments.add(params,function(result){
						resolve();
					});
				});
			});
		});
	});
	Promise.all(_p).then(function(){
		SEND(res,2000,'新增成功',[]);
	});	
}

/**
 *  支付货款一级列表（删）
 */
this.del = function(req,res,next){
	var m_arr = JSON.parse(req.body.models);
	var _p = [];
	m_arr.forEach(function(items,index){
		_p[index] = new Promise(function(resolve,reject){
			var params = JSON.parse(req.body.models)[index];
			var id = params.id;
			common.getEmployeeIdByToken(req,res,next,function(user_id){
				var obj = {
					update_time: TIME(),
					update_person: user_id[0].user_id,
					isdel: 1
				};
				modPayments.update(id,obj,function(result){
					resolve();
				});
			});
		});	
	});
	Promise.all(_p).then(function(){
		SEND(res,2000,'删除成功',[]);
	});
}

/**
 *  更新分配是否完全（分配用途每次提交，都会执行一次）
 */
this.updateAssign = function(req,res,next){
	var id = req.body.id;
	var isAssign = req.body.isAssign;
	common.getEmployeeIdByToken(req,res,next,function(user_id){
		var params = {
			isAssign: isAssign,
			update_time: TIME(),
			update_person: user_id[0].user_id,
		};
		modPayments.update(id,params,function(){});
	});
}
//处理时间
function transDate(params){
	var _arr = ['arrival'];
	_arr.forEach(function(items,index){
		for(let key in params){
			if(key==items){
				params[key] = DATETIME(params[key]);
			}
		}
	});
}

/****************************************分配用途*****************************************/


/**
 *	新增格式[ { id: null, pay_id: 147, amount: 2400, type: '合同', contract_no: 'LJTC170106' } ]
 *  更新格式[ { id: 181,
	    pay_id: 147,
	    type: '合同',
	    contract_no: 'LJTC170105',
	    amount: 9490,
	    rem: null,
	    ishistory: null,
	    isdel: 0,
	    history_amount: 7500 } ]
 */


/**
 *  支付货款二级列表（查）
 */
this.payUse = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var id = params.id;
	modPayments.payUse(id,function(result){
		res.send(result);
	});
}

/**
 *  支付货款二级列表（删）
 */
this.payUseDel = function(req,res,next){
	var m_arr = JSON.parse(req.body.models);
	var _p = [];
	m_arr.forEach(function(items,index){
		_p[index] = new Promise(function(resolve,reject){
			var params = JSON.parse(req.body.models)[index];
			var id = params.id;
			var obj = {
				isdel: 1
			};
			modPayments.payUseUpdate(id,obj,function(result){
				resolve();
			});
		});	
	});
	Promise.all(_p).then(function(){
		SEND(res,2000,'删除成功',[]);
	});
}

/**
 *  支付货款二级列表（改）
 */
this.payUseUpdate = function(req,res,next){
	var m_arr = JSON.parse(req.body.models);
	var _p = [];
	m_arr.forEach(function(items,index){
		_p[index] = new Promise(function(resolve,reject){
			var params = JSON.parse(req.body.models)[index];
			transDate(params);
			var id = params.id;
			delete params.id;
			dealContractUpdate(req,res,next,params,function(){
				delete params.history_amount;
				modPayments.payUseUpdate(id,params,function(result){
					resolve();
				});
			});
		});
	});
	Promise.all(_p).then(function(){
		SEND(res,2000,'更新成功',[]);
	});
}
//挂勾到合同管理
function dealContractUpdate(req,res,next,params,cb){
	if(params.ishistory){
		cb();
		return;
	}
	var contract_no = params.contract_no;
	//amount = amount + history_amount
	var amount = params.amount;
	if(params.history_amount){
		amount += params.history_amount;
	}
	delete params.history_amount;
	modContract.headContent(contract_no,'employee',function(result){
		var paid = result[0].paid;
		var payable = result[0].payable;
		var isFreeze = result[0].isFreeze;
		var status = result[0].delivery_state;
		paid = amount;
		//防止超出
		if(paid>payable){
			paid = payable;
		}
		var p = {
			paid: paid
		};
		if(isFreeze){	//冻结合同
			if(paid==payable||paid>payable){
				p.isFreeze = 0;
				// p.freeze_time = null;
				if(status=='已收货') p.complete = 1;
			}else{
				p.complete = 0;
			}
		}else{
			if(paid==payable||paid>payable){
				if(status=='已收货') p.complete = 1;
			}else{
				p.complete = 0;
			}
		}
		common.getEmployeeIdByToken(req,res,next,function(user_id){
			p.update_person = user_id[0].user_id;
			p.update_time = TIME();
			modContract.fromPayUpdate(contract_no,p);
			cb();
		});
	});
}

/**
 *  支付货款二级列表（增）
 */
this.payUseAdd = function(req,res,next){
	var m_arr = JSON.parse(req.body.models);
	var _p = [];
	m_arr.forEach(function(items,index){
		_p[index] = new Promise(function(resolve,reject){
			var params = JSON.parse(req.body.models)[index];
			var amount = params.amount;
			var rem = params.rem;
			var ishistory = 0;
			transDate(params);
			//插入新增数据
			dealContractAdd(req,res,next,params,function(){
				params.amount = amount;
				params.rem = rem;
				params.ishistory = ishistory;
				modPayments.payUseAdd(params,function(result){
					resolve();
				});
			});
		});
	});
	Promise.all(_p).then(function(){
		SEND(res,2000,'新增成功',[]);
	});
}
//挂勾到合同管理，如果已付半款，则新增一条
function dealContractAdd(req,res,next,params,cb){
	var contract_no = params.contract_no;
	var amount = params.amount;
	modContract.headContent(contract_no,'employee',function(result){
		var paid = result[0].paid;
		var payable = result[0].payable;
		var isFreeze = result[0].isFreeze;
		var status = result[0].delivery_state;
		if(paid!=0){
			//insert（历史数据）
			params.amount = paid;
			params.rem = '前期半款';
			params.ishistory = 1;
			modPayments.payUseAdd(params,function(){});
		}
		paid += amount;
		//防止超出
		if(paid>payable){
			paid = payable;
		}
		var p = {
			paid: paid
		};
		if(isFreeze){	//冻结合同
			if(paid==payable||paid>payable){
				p.isFreeze = 0;
				// p.freeze_time = null;
				if(status=='已收货') p.complete = 1;
			}else{
				p.complete = 0;
			}
		}else{
			if(paid==payable||paid>payable){
				if(status=='已收货') p.complete = 1;
			}else{
				p.complete = 0;
			}
		}
		common.getEmployeeIdByToken(req,res,next,function(user_id){
			p.update_person = user_id[0].user_id;
			p.update_time = TIME();
			modContract.fromPayUpdate(contract_no,p);
			cb();
		});
	});
}

/**
 *  获取合同对应的欠款金额
 */
this.getAmount = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var contract_no = params.contract_no;
	modContract.headContent(contract_no,'employee',function(result){
		try{
			var payable = result[0].payable;
			var paid = result[0].paid;
			var s = payable - paid;
			SEND(res,200,'',s);
		}catch(e){

		}
	});
}

/**
 *  搜索相关公司的欠款合同
 */
this.searchContractNo = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	for(var key in params){
		if(key=='filter[filters][0][value]'){
			var val = params[key].toUpperCase();
		}
	}
	//去客户管理系统或用户管理系统里获取简称
	serviceCommon.getInfoByCompanyInfo(company,result => {
		let { abb } = result;
		modPayments.searchContractNo(abb,val,function(result){
			var res_arr = [];
			result.forEach(function(items,index){
				res_arr.push(items.contract_no);
			});
			res.send(res_arr);
		});
	});
}













/**************************改版后不用了*******************************/
this.uploadImg = function(req,res,next){
	var uploadImg = new base.UploadImgPro('/public/img/payments',1);
	uploadImg.upload(req,function(val,files){
		if(arguments.length==0){
			SEND(res,-1,'上传格式不正确',[]);
			return;
		}
		var id = files.id;
		modPayments.getAlbum(id,function(result){
			if(result[0].img==null||result[0].img==""){
				var str = 'img="'+val+'"';
			}else{
				var album_arr = result[0].img.split(',');
				for (var i = 0; i < album_arr.length; i++) {
					var str = 'img="'+result[0].img+','+val+'"';
				};
			}
			modPayments.updateAlbum(id,str,function(){
				SEND(res,200,'上传成功',[val]);
			});
		});
	});
}
this.delImg = function(req,res,next){
	var id = req.body.id;
	var album_arr = JSON.parse(req.body.album_arr);
	var remove_arr = [];
	modPayments.getAlbum(id,function(result){
		var all_arr = result[0].img.split(',');
		for (var i = 0; i < all_arr.length; i++) {
			for (var j = 0; j < album_arr.length; j++) {
				if(all_arr[i]==album_arr[j]){
					remove_arr.push(album_arr[j]);
					all_arr.splice(i,1);
					i--;
					break;
				}
			};
		};
		var str = '';
		if(all_arr[0]!=null){
			all_arr.forEach(function(items,index){
				str += items+',';
			});
			str = str.slice(0,str.length-1);
		}
		str = 'img="'+str+'"';
		modPayments.updateAlbum(id,str,function(){
			SEND(res,200,'删除成功',{
				all_arr: all_arr,
				remove_arr: remove_arr
			});
		});
	});
}
this.addId = function(req,res,next){
	var insert_time = TIME();
	var params = {
		amount: 0,
		insert_time: insert_time
	};
	common.getEmployeeIdByToken(req,res,next,function(user_id){
		var insert_person = user_id[0].user_id;
		params.insert_person = insert_person;
		modPayments.add(params,function(){
			modPayments.getId(insert_person,insert_time,function(result){
				SEND(res,200,'',result);
			});
		});
	});
}