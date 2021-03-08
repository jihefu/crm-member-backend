var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var crypto = require('crypto');
var inputInfo = require('../controllers/inputInfo');
var mod_admin = require('../model/mod_admin');
var service = require('../action/service');
module.exports = function(app){
	app.use('/inputInfo', function(req,res,next) {
		check(req,res,next);
	});
	app.use('/inputInfo_ajax', function(req,res,next) {
		checkAjax(req,res,next);
	});
	app.get('/inputInfo/vir8', function(req,res,next) {
		inputInfo.vir_info_2(req,res);
	});
	app.get('/inputInfo/vir8_2', function(req,res,next) {
		inputInfo.vir_info_2(req,res);
	});
	app.get('/inputInfo_ajax/vir8/getSN', function(req,res,next) {
		inputInfo.getSN(req,res);
	});
	app.get('/inputInfo_ajax/vir8/search', function(req,res,next) {
		inputInfo.search(req,res);
	});
	app.post('/inputInfo_ajax/vir8/putInfo', function(req,res,next) {
		inputInfo.putInfo(req,res);
	});

	function check(req,res,next){
		service.checkOpenId(req,res,next,function(){
			service.checkPerson(req,res,next,function(result){
				if(result.code==10001){
					next();
				}else{
					TIP(res,'未授权');
				}
			});
		});
	}
	function checkAjax(req,res,next){
		if(!req.session.admin_id){
			SEND(res,-100,'身份过期，请重新进入',[]);
			return;
		}else{
			next();
		}
	}
}

