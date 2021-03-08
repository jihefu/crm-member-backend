var express = require('express');
var url = require('url');
var path = require('path');
var tc = require('../controllers/test_machine');
module.exports = function(app){
	app.get('/tc/index', function(req,res,next) {
		tc.mainIndex(req,res);
	});
	app.get('/tc/tc', function(req,res,next) {
		tc.tc(req,res);
	});
	app.get('/tc/teechart', function(req,res,next) {
		res.sendFile(DIRNAME+'/public/html/tee_chart.html');
	});
}