var express = require('express');
var url = require('url');
var path = require('path');
var creditTrend = require('../action/creditTrend');

module.exports = function(app){
	app.get('/admin/getCreditTrendData', function(req,res,next) {
		creditTrend.getCreditTrendData(req,res,next);
	});
}