var express = require('express');
var url = require('url');
var path = require('path');
var sms = require('../controllers/SMS.js');

module.exports = function(app){
	app.use('/sms/*',function(req,res,next){
		res.header("Access-Control-Allow-Origin", "*");
		next();
	});
	app.get('/sms/v_code',function(req,res,next){
		sms.vCode(req,res,next);
	});
	app.get('/sms/reg_code',function(req,res,next){
		sms.regCode(req,res,next);
	});
	app.get('/sms/callReceipt',function(req,res,next){
		sms.callReceipt(req,res,next);
	});
}