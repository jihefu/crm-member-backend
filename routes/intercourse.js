var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var crypto = require('crypto');
var base = require('../controllers/base');
var common = require('../controllers/common');
var intercourse = require('../controllers/intercourse');

module.exports = function(app){
	app.get('/admin/intercourses',function(req,res,next){
		common.auth(req,res,next,function(){
			intercourse.list(req,res,next);
		});
	});
	app.get('/admin/intercourse/info',function(req,res,next){
		intercourse.info(req,res,next);
	});
	app.get('/admin/intercourse/tag',function(req,res,next){
		intercourse.tag(req,res,next);
	});
	app.post('/admin/intercourse/sub',function(req,res,next){
		intercourse.sub(req,res,next);
	});
	app.get('/admin/intercourse/getImg',function(req,res,next){
		intercourse.getImg(req,res,next);
	});
	app.post('/admin/intercourse/uploadImg',function(req,res,next){
		intercourse.uploadImg(req,res,next);
	});
	app.post('/admin/intercourse/cover',function(req,res,next){
		intercourse.cover(req,res,next);
	});
	app.post('/admin/intercourse/delImg',function(req,res,next){
		intercourse.delImg(req,res,next);
	});
	app.get('/admin/intercourse/search',function(req,res,next){
		intercourse.search(req,res,next);
	});
	app.get('/admin/intercourse/page_default',function(req,res,next){
		intercourse.pageDef(req,res,next);
	});
	app.get('/admin/intercourse/sort',function(req,res,next){
		intercourse.sort(req,res,next);
	});
	app.post('/admin/intercourse/del',function(req,res,next){
		intercourse.del(req,res,next);
	});
	app.post('/admin/intercourse/add',function(req,res,next){
		intercourse.add(req,res,next);
	});
	app.get('/admin/intercourse/search_temp',function(req,res,next){
		intercourse.searchTemp(req,res,next);
	});
	app.post('/admin/intercourse/add_temp',function(req,res,next){
		intercourse.addTemp(req,res,next);
	});
	app.post('/admin/intercourse/star',function(req,res,next){
		intercourse.star(req,res,next);
	});
	app.get('/admin/intercourse/getSalerName',function(req,res,next){
		intercourse.getSalerName(req,res,next);
	});
	app.get('/admin/intercourse/filter',function(req,res,next){
		intercourse.filter(req,res,next);
	});
	app.post('/admin/intercourse/delTag',function(req,res,next){
		intercourse.delTag(req,res,next);
	});
	app.post('/admin/intercourse/del_action_id',function(req,res,next){
		intercourse.delActionId(req,res,next);
	});
}