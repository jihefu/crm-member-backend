var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var crypto = require('crypto');
var base = require('../controllers/base');
var knowledge = require('../controllers/knowledge');
var modKnowledge = require('../model/mod_knowledge');

module.exports = function(app){
	app.use('/knowledge',function(req,res,next){
		check(req,res,next);
	});
	app.use('/knowledge_ajax',function(req,res,next){
		checkAjax(req,res,next);
	});
	app.get('/knowledge/index',function(req,res,next){
		knowledge.list(req,res,next);
	});
	app.get('/knowledge/info/*',function(req,res,next){
		knowledge.info(req,res,next);
	});
	app.get('/knowledge_ajax/list',function(req,res,next){
		knowledge.list(req,res,next);
	});
	app.get('/knowledge_ajax/search',function(req,res,next){
		knowledge.search(req,res,next);
	});
}

function check(req,res,next){
	var pathname = url.parse(req.url,true).pathname;
	CHECKSESSION(req,res,'open_id',function(result){
		if(result==200||result==100){
			var open_id = req.session.open_id;
			modKnowledge.checkUser(open_id,function(result){
				if(result[0]!=null){
					req.session.name = result[0].name;
					req.session.phone = result[0].phone;
					next();
				}else{
					res.redirect('/service/vip_reg_entrance');
				}
			});
		}else{
			var state = ROUTE('knowledge'+pathname);
			var baseGetOpenIdUrl = new base.GetOpenIdUrl(state);
			res.redirect(baseGetOpenIdUrl.getUrl());
		}
	});
}
function checkAjax(req,res,next){
	if(!req.session.name){
		SEND(res,-100,'身份过期，请重新进入',[]);
		return;
	}else{
		next();
	}
}