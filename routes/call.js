var express = require('express');
var url = require('url');
var path = require('path');
var common = require('../controllers/common');
var call = require('../controllers/call');

module.exports = function(app){
	app.use('/call_ajax/getUserId',function(req,res,next){
		res.setHeader('Access-Control-Allow-Origin','*');
	});
	app.get('/manage/*',function(req,res,next){
		call.render(req,res,next);
	});
	app.get('/call_ajax/getUserId',function(req,res,next){
		call.getUserId(req,res,next);
	});
}