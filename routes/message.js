var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var crypto = require('crypto');
var msg = require('../controllers/message');
var mod_member = require('../model/mod_member');
module.exports = function(app){
	app.options('/message/*', function(req,res,next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Expose-Headers', 'token,Content-Type');
		res.header("Access-Control-Allow-Headers", 'token,Content-Type');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,DELETE,OPTIONS');
		res.send('200');
	});
	app.use('/message', function(req,res,next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Expose-Headers', 'token,Content-Type');
		res.header("Access-Control-Allow-Headers", 'token,Content-Type');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,DELETE,OPTIONS');
		msg.message(req,res,next);
	});
	//会员信息修改
	app.get('/message/member_modify', function(req,res,next) {
		msg.memberModify(req,res,next);
	});
	app.get('/message/member_modify_notice', function(req,res,next) {
		msg.memberModifyNtc(req,res,next);
	});
	app.get('/message/msg_to_consumer', function(req,res,next) {
		msg.msgToConsumer(req,res,next);
	});
	app.put('/message/msg_to_consumer', function(req,res,next) {
		msg.msgToConsumer(req,res,next);
	});
	app.post('/message/msg_to_consumer', function(req,res,next) {
		msg.msgToConsumer(req,res,next);
	});
	app.get('/message/msg_to_dealer', function(req,res,next) {
		msg.msgToDealer(req,res,next);
	});
	app.get('/message/msg_to_applicant', function(req,res,next) {
		msg.msgToApplicant(req,res,next);
	});
}