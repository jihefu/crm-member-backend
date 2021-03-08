var express = require('express');
var url = require('url');
var path = require('path');
var fs = require('fs');
var request = require('request');
var formidable = require('formidable');
var upload = require('../service/file_upload');
var member = require('../service/member');

this.uploadSalary = function(req,res,next){
	res.render('./pages/upload_salary');
}
this.excelSalary = function(req,res,next){
	var form = new formidable.IncomingForm();
	var path = DIRNAME+'/downloads';
	form.encoding = 'utf-8'; 
    form.uploadDir = path;
    form.keepExtensions = true;
    form.type = true;
	form.parse(req, function(err, fields, files) {
		upload.excelSalary({
			fields: fields,
			files: files,
			path: path
		},function(result){
			SEND(res,result.code,result.msg,result.data);
		});
	});
}
this.memberList = function(req,res,next){
	upload.memberList(function(result){
		res.send(result);
	});
}

this.getRangPage = (req,res,next) => {
	member.getRangPage((result) => {
		// result = result.splice(0,30);
		let str = '';
		result.forEach((items,index) => {
			str += '<h3>'+(index+1)+'. '+items.name+' '+items.total+'</h3>';
		});
		res.send(str);
	});
}



this.cusLatestRatingPage = (req,res,next) => {
	res.render('./pages/upload_rating_page');
}

this.cusLatestRating = (req,res,next) => {
	var form = new formidable.IncomingForm();
	var path = DIRNAME+'/downloads';
	form.encoding = 'utf-8'; 
    form.uploadDir = path;
    form.keepExtensions = true;
    form.type = true;
	form.parse(req, function(err, fields, files) {
		upload.cusLatestRating({
			fields: fields,
			files: files,
			path: path
		},function(result){
			SEND(res,result.code,result.msg,result.data);
		});
	});
}