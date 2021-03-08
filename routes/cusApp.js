var express = require('express');
var url = require('url');
var path = require('path');
const actionCusApp = require('../action/cusApp');

module.exports = function(app){
	/**
	 * 	登陆
	 */
	app.get('/cusApp/login',function(req,res,next){
		res.header("Access-Control-Allow-Origin", "*");
		actionCusApp.login(req,res,next);
	});

	app.options('/cusApp/*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Expose-Headers', 'openId,userId,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Headers", 'openId,userId,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		res.send('200');
	});
	app.use('/cusApp/*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Expose-Headers', 'openId,userId,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Headers", 'openId,userId,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		actionCusApp.checkSessionExist(req,res,next);
	});

	app.get('/cusApp/getStatus',(req,res,next) => {
		actionCusApp.getStatus(req,res,next);
	});
	app.post('/cusApp/signIn',(req,res,next) => {
		actionCusApp.signIn(req,res,next);
	});
	app.put('/cusApp/addSignInLocation',(req,res,next) => {
		actionCusApp.addSignInLocation(req,res,next);
	});
	app.put('/cusApp/signOut',(req,res,next) => {
		actionCusApp.signOut(req,res,next);
	});
	app.put('/cusApp/addSignOutLocation',(req,res,next) => {
		actionCusApp.addSignOutLocation(req,res,next);
	});
	app.get('/cusApp/getSignInfoByUserId',(req,res,next) => {
		actionCusApp.getSignInfoByUserId(req,res,next);
	});
	app.get('/cusApp/chatList',(req,res,next) => {
		actionCusApp.chatList(req,res,next);
	});
	app.get('/cusApp/chatListNotRead',(req,res,next) => {
		actionCusApp.chatListNotRead(req,res,next);
	});
	app.post('/cusApp/sendMsg',(req,res,next) => {
		actionCusApp.sendMsg(req,res,next);
	});
	app.put('/cusApp/recallMsg',(req,res,next) => {
		actionCusApp.recallMsg(req,res,next);
	});
	app.put('/cusApp/doRead',(req,res,next) => {
		actionCusApp.doRead(req,res,next);
	});
	app.post('/cusApp/uploadImg',(req,res,next) => {
		actionCusApp.uploadImg(req,res,next);
	});
	app.post('/cusApp/uploadFile',(req,res,next) => {
		actionCusApp.uploadFile(req,res,next);
	});

	app.get('/cusApp/requestLocation',(req,res,next) => {
		actionCusApp.requestLocation(req,res,next);
	});
	app.get('/cusApp/responseLocation',(req,res,next) => {
		actionCusApp.responseLocation(req,res,next);
	});
	app.get('/cusApp/refreshMemberInfo',(req,res,next) => {
		actionCusApp.refreshMemberInfo(req,res,next);
	});
}