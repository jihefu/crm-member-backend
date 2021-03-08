var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var formidable = require('formidable');
var base = require('./base');
var common = require('./common');
var modCredit = require('../model/mod_credit');
var modPayments = require('../model/mod_payments');
var CreditRecords = require('../dao').CreditRecords;
var Customers = require('../dao').Customers;

function transDate(params){
	var _arr = ['credit_time'];
	_arr.forEach(function(items,index){
		for(let key in params){
			if(key==items){
				params[key] = DATETIME(params[key]);
			}
		}
	});
}

this.list = function(req,res,next){
	var params = JSON.parse(req.body.models);
	var page = params.page;
	var page_size = params.pageSize;
	var keywords = params.keywords;
	if(params.dir){
		var sort_str = params.field+' '+params.dir;
	}else{
		var sort_str = 'id DESC';
	}
	modCredit.list(page,page_size,keywords,sort_str,function(result){
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
					}else if(key=='credit_time'){
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
			var _p = [];
			result.rows.forEach((items,index) => {
				_p[index] = new Promise((resolve,reject) => {
					let i = index;
					Customers.findAll({
						where: {
							company: items.company
						}
					}).then(re => {
						try{
							let last_sale = re[0].dataValues.last_sale;
							result.rows[i]['last_sale'] = last_sale;
						}catch(e){}
						resolve();
					}).catch(e => LOG(e));
				});
			});
			Promise.all(_p).then(() => {
				res.send({
					code: 200,
					data: result.rows,
					total: result.count[0]._count
				});
			}).catch(e => LOG(e));
		});
	});
}
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
			delete params.last_sale;
			common.getEmployeeIdByToken(req,res,next,function(user_id){
				params.update_person = user_id[0].user_id;
				params.update_time = TIME();
				modPayments.getCusAbb(params.company,function(result){
					params.abb = result[0].abb;
					modCredit.update(id,params,function(result){
						resolve();
						//更新customers表的信用额和信用期
						var company = params.company;
						CreditRecords.findAll({
							where: {
								company: company,
								isdel: 0
							},
							order: [['credit_time','DESC'],['id','DESC']],
							limit: 1,
							offset: 0
						}).then(result => {
							var credit_line = result[0].dataValues.credit_line;
							var credit_period = result[0].dataValues.credit_period;
							var update_item = {
								credit_line: credit_line,
								credit_period: credit_period
							};
							Customers.update(update_item,{
								where: {
									company: company
								}
							}).then(result => {

							}).catch(e => LOG(e));
						}).catch(e => LOG(e));
					});
				});
			});
		});
	});
	Promise.all(_p).then(function(){
		SEND(res,2000,'更新成功',[]);
		// 清空信用总览缓存
		require('../cache/creditInfo').clearCache();
	});
}
this.add = function(req,res,next){
	const params = JSON.parse(req.body.models);
	const { company } = params;
	modPayments.getCusAbb(company, function(result) {
		let abb;
		try {
			abb = result[0].abb;
		} catch (e) {
			res.send({
				code: -1,
				msg: '不存在该公司'
			});	
			return;
		}
		CreditRecords.findOne({
			where: {
				company: company,
				isdel: 0
			}
		}).then(r => {
			if (r) {
				res.send({
					code: -1,
					msg: '该公司已存在',
				});
				return;
			}
			modCredit.add({
				company,
				abb,
				credit_line: 1000,
				credit_period: 6,
				credit_time: DATETIME(),
			}, function(result) {
				CreditRecords.findAll({
					where: {
						company: company,
						isdel: 0
					},
					order: [['credit_time','DESC'],['id','DESC']],
					limit: 1,
					offset: 0
				}).then(result => {
					var credit_line = result[0].dataValues.credit_line;
					var credit_period = result[0].dataValues.credit_period;
					var update_item = {
						credit_line: credit_line,
						credit_period: credit_period
					};
					Customers.update(update_item,{
						where: {
							company: company
						}
					}).then(result => {
						SEND(res,2000,'新增成功',[]);
						// 清空信用总览缓存
						require('../cache/creditInfo').clearCache();
					}).catch(e => LOG(e));
				}).catch(e => LOG(e));
			});
		});
	});
	return;
	var _p = [];
	m_arr.forEach(function(items,index){
		_p[index] = new Promise(function(resolve,reject){
			var params = JSON.parse(req.body.models)[index];
			transDate(params);
			delete params.last_sale;
			common.getEmployeeIdByToken(req,res,next,function(user_id){
				params.update_person = user_id[0].user_id;
				params.update_time = TIME();
				params.insert_person = user_id[0].user_id;
				params.insert_time = TIME();
				modPayments.getCusAbb(params.company,function(result){
					params.abb = result[0].abb;
					modCredit.add(params,function(result){
						resolve();
						//更新customers表的信用额和信用期
						var company = params.company;
						CreditRecords.findAll({
							where: {
								company: company,
								isdel: 0
							},
							order: [['credit_time','DESC'],['id','DESC']],
							limit: 1,
							offset: 0
						}).then(result => {
							var credit_line = result[0].dataValues.credit_line;
							var credit_period = result[0].dataValues.credit_period;
							var update_item = {
								credit_line: credit_line,
								credit_period: credit_period
							};
							Customers.update(update_item,{
								where: {
									company: company
								}
							}).then(result => {

							}).catch(e => LOG(e));
						}).catch(e => LOG(e));
					});
				});
			});
		});
	});
	Promise.all(_p).then(function(){
		SEND(res,2000,'新增成功',[]);
		// 清空信用总览缓存
		require('../cache/creditInfo').clearCache();
	});	
}
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
				modCredit.update(id,obj,function(result){
					resolve();
				});
			});
		});	
	});
	Promise.all(_p).then(function(){
		SEND(res,2000,'删除成功',[]);
	});
}
this.uploadImg = function(req,res,next){
	var uploadImg = new base.UploadImgPro('/public/img/credit',1);
	uploadImg.upload(req,function(val,files){
		if(arguments.length==0){
			SEND(res,-1,'上传格式不正确',[]);
			return;
		}
		var id = files.id;
		modCredit.getAlbum(id,function(result){
			if(result[0].img==null||result[0].img==""){
				var str = 'img="'+val+'"';
			}else{
				var album_arr = result[0].img.split(',');
				for (var i = 0; i < album_arr.length; i++) {
					var str = 'img="'+result[0].img+','+val+'"';
				};
			}
			modCredit.updateAlbum(id,str,function(){
				SEND(res,200,'上传成功',[val]);
			});
		});
	});
}
this.delImg = function(req,res,next){
	var id = req.body.id;
	var album_arr = JSON.parse(req.body.album_arr);
	var remove_arr = [];
	modCredit.getAlbum(id,function(result){
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
		modCredit.updateAlbum(id,str,function(){
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
		insert_time: insert_time
	};
	common.getEmployeeIdByToken(req,res,next,function(user_id){
		var insert_person = user_id[0].user_id;
		params.insert_person = insert_person;
		modCredit.add(params,function(){
			modCredit.getId(insert_person,insert_time,function(result){
				SEND(res,200,'',result);
			});
		});
	});
}