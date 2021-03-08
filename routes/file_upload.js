var express = require('express');
var url = require('url');
var path = require('path');
var upload = require('../action/file_upload');

module.exports = function(app){
	app.get('/upload/salary',function(req,res,next){
		upload.uploadSalary(req,res,next);
	});
	app.post('/upload/excel/salary',function(req,res,next){
		upload.excelSalary(req,res,next);
	});
	app.get('/memberList',function(req,res,next){
		upload.memberList(req,res,next);
	});
	app.get('/getRankPage',function(req,res,next){
		upload.getRangPage(req,res,next);
	});

	app.get('/upload/cusLatestRating',function(req,res,next){
		upload.cusLatestRatingPage(req,res,next);
	});
	app.post('/upload/excel/cusLatestRating',function(req,res,next){
		upload.cusLatestRating(req,res,next);
	});
}