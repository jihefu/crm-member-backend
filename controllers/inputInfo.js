var express = require('express');
var url = require('url');
var basicAuth = require('basic-auth');
var mod_admin = require('../model/mod_admin');
var mod_inputInfo = require('../model/mod_inputInfo');
const serviceHomeContracts = require('../service/homeContracts');

this.vir_info = function(req,res){
	mod_inputInfo.vir_info(1,function(result){
		res.render('./pages/input_vir_info',{
			result: result
		});
	});
}
this.vir_info_2 = function(req,res){
	res.render('./pages/input_vir_info_2');
	// res.render('./pages/tip', {
	// 	tip: '请在合同管理中填写关联威程序列号，填完后自动同步中间商和业务员。'
	// });
}
this.getSN = function(req,res){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	mod_inputInfo.vir_info(page,function(result){
		SEND(res,200,'',result);
	});
}
this.search = function(req,res){
	var params = url.parse(req.url,true).query;
	var val = params.val;
	mod_inputInfo.vir_search(val,function(result){
		SEND(res,200,'',result);
	});
}
this.putInfo = function(req,res){
	var dealer = req.body.dealer;
	var salesman = req.body.salesman;
	var endUser = req.body.endUser;
	var maker = req.body.maker;
	var tester = req.body.tester;
	var arr = JSON.parse(req.body.arr);
	// var name = basicAuth(req).name;
	var name = req.session.admin_id;
	var obj = {};
	if(dealer) obj.dealer = dealer;
	if(salesman) obj.salesman = salesman;
	if(endUser) obj.endUser = endUser;
	if(maker) obj.maker = maker;
	if(tester) obj.tester = tester;
	obj.arr = arr;
	const _p = [];
	arr.forEach((items, index) => {
		_p[index] = new Promise((resolve, reject) => {
			// const sn = items;
			// serviceHomeContracts.checkSnHasEntry({
			// 	sn,
			// }, result => {
			// 	if (result.code == -1) {
			// 		reject(sn);
			// 	} else {
					resolve();
			// 	}
			// });
		});
	});
	Promise.all(_p).then(() => {
		mod_admin.searchUpdataPerson(name,function(result){
			obj.update_person = result[0].user_id;
			mod_inputInfo.putInfo(obj,function(result){
				SEND(res,200,'更新成功',[]);
			});
		});
	}).catch(sn => {
		SEND(res,-1,sn+'已被分配',[]);
	});
}