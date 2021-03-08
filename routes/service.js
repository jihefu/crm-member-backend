var express = require('express');
var url = require('url');
var path = require('path');
var crypto = require('crypto');
var service = require('../action/service');
const actionCloudDisk = require('../action/cloudDisk');

module.exports = function(app){
	app.use('/service', function(req,res,next) {
		service.checkOpenId(req,res,next);
	});
	app.use('/service', function(req,res,next) {
		service.checkPerson(req,res,next);
	});
	//超级权限
	app.get('/getSuperAuth', function(req,res,next) {
		service.getSuperAuth(req,res,next);
	});
	app.get('/getSuperAuthMember', function(req,res,next) {
		service.getSuperAuthMember(req,res,next);
	});
	app.post('/postSuperAuthMember', function(req,res,next) {
		service.postSuperAuthMember(req,res,next);
	});
	app.put('/deleteSuperAuth', function(req,res,next) {
		service.deleteSuperAuth(req,res,next);
	});
	//页面
	app.get('/service/products', function(req,res,next) {
		service.productList(req,res,next);
	});
	app.get('/service/product/vir8/:sn([0-9]+)', function(req,res,next) {
		service.productInfo(req,res,next);
	});
	app.get('/service/product/vir8/qr_info', function(req,res,next) {
		service.postInfo(req,res,next);
	});
	app.get('/service/product/postInfoAgain', function(req,res,next) {
		service.postInfoAgain(req,res,next);
	});
	app.get('/service/product/dyna/:sn([0-9]+)', function(req,res,next) {
		service.dynaProductInfo(req,res,next);
	});
	app.get('/service/product/postDynaAgain', function(req,res,next) {
		service.postDynaAgain(req,res,next);
	});
	app.get('/service/product/checkCtrlCardType/:sn([0-9]+)', function(req,res,next) {
		service.checkCtrlCardType(req,res,next);
	});
	app.get('/service/product/postDyna', function(req,res,next) {
		service.postDyna(req,res,next);
	});
	app.get('/service/product/reg', function(req,res,next) {
		service.reg(req,res,next);
	});
	//重定向，保留原始可用
	app.get('/service/product/vac_reg', function(req,res,next) {
		service.vacReg(req,res,next);
	});
	app.get('/vip/reg', function(req,res,next) {
		service.memberReg(req,res,next);
	});
	app.get('/vip/retailReg', function(req,res,next) {
		service.retailReg(req,res,next);
	});
	// 小程序
	// app.get('/mp/index', function(req,res,next) {
	// 	service.mpIndex(req,res,next);
	// });
	// app.get('/mp/goods', function(req,res,next) {
	// 	service.mpGoods(req,res,next);
	// });
	// app.get('/mp/meetingPeople', function(req,res,next) {
	// 	service.mpMeetingPeople(req,res,next);
	// });
	//wx
	app.get('/wx/getCode', function(req,res,next) {
		service.wxGetCode(req,res,next);
	});
	app.get('/wx/getToken', function(req,res,next) {
		service.wxGetToken(req,res,next);
	});
	app.get('/wx/getUserInfo', function(req,res,next) {
		service.wxGetUserInfo(req,res,next);
	});
	app.post('/wx/sendMsg', function(req,res,next) {
		service.wxSendMsg(req,res,next);
	});



	//ajax
	//删除卡
	app.delete('/service/products/del', function(req,res,next) {
		service.cardDel(req,res,next);
	});
	//新增卡
	app.post('/service/products/add', function(req,res,next) {
		service.cardAdd(req,res,next);
	});
	//搜索相关人
	app.get('/service/product/searchInput', function(req,res,next) {
		service.searchInput(req,res,next);
	});
	//中间商提交操作
	app.put('/service/product/dealerUpdateInfo', function(req,res,next) {
		service.dealerUpdateInfo(req,res,next);
	});
	//员工提交操作
	app.put('/service/product/staffUpdateInfo', function(req,res,next) {
		service.staffUpdateInfo(req,res,next);
	});
	// 检验合格
	app.put('/service/product/checkPass/:sn', function(req,res,next) {
		service.checkPass(req,res,next);
	});
	// 检验不合格
	app.put('/service/product/checkNotPass/:sn', function(req,res,next) {
		service.checkNotPass(req,res,next);
	});
	// 重新检测
	app.put('/service/product/checkAgain/:sn', function(req,res,next) {
		service.checkAgain(req,res,next);
	});
	app.post('/service/product/applyResale/', function(req,res,next) {
		service.applyResale(req,res,next);
	});
	//信用判断
	app.get('/service/product/checkReg', function(req,res,next) {
		service.checkReg(req,res,next);
	});
	//注册历史
	app.get('/service/product/regEvent', function(req,res,next) {
		service.regEvent(req,res,next);
	});
	//appName列表
	app.get('/service/getAppNameList',function(req,res,next){
	    service.getAppNameList(req,res,next);
	});
	//提交注册
	app.get('/service/product/subReg',function(req,res,next){
	    service.subReg(req,res,next);
	});
	//提交会员注册
	app.post('/vip/regInfo', function(req,res,next) {
		service.memberRegInfo(req,res,next);
	});
	app.post('/vip/endRegInfo', function(req,res,next) {
		service.memberEndRegInfo(req,res,next);
	});
	// 往云注册对外发布
	app.post('/service/releaseReg', (req, res, next) => {
		service.releaseReg(req,res,next);
	});
	// 根据sn获取当前云注册的信息
	app.get('/service/getRegInfoFromCloud/:sn', (req, res, next) => {
		service.getRegInfoFromCloud(req,res,next);
	});
	// 取消对外公开
	app.delete('/service/releaseRegDestroy/:sn', (req, res, next) => {
		service.releaseRegDestroy(req,res,next);
	});

	app.use('/wxTweets', function(req,res,next) {
		service.checkOpenId(req,res,next);
	});
	app.get('/wxTweets/getMyOpenId', function(req,res,next) {
		res.send({
			code: 200,
			msg: '',
			data: req.session.open_id,
		});
	});
	app.get('/wxTweets/:tweetId([0-9]+)', function(req,res,next) {
		const { tweetId } = req.params;
		res.sendFile(DIRNAME + '/public/html/wxTweet' + tweetId +'.html');
	});
	app.get('/wxTweets/hasShare', function(req,res,next) {
		service.hasShare(req,res,next);
	});
	app.get('/wxTweets/hasRead', function(req,res,next) {
		service.hasRead(req,res,next);
	});
	app.get('/service/queryExpress', function(req,res,next) {
		service.queryExpress(req,res,next);
	});
	app.get('/service/product/client/:sn([0-9]+)', function(req,res,next) {
		service.scanClientQrcode(req, res, next);
	});
	app.get('/service/simuCtrl/list', function(req,res,next) {
		service.simuCtrlList(req, res, next);
	});

	app.get('/service/cloudDisk/index', function(req,res,next) {
		actionCloudDisk.cloudDiskIndex(req, res, next);
	});
	app.get('/service/cloudDisk/getPublicList', function(req,res,next) {
		actionCloudDisk.getPublicList(req, res, next);
	});
	app.get('/service/cloudDisk/info', function(req,res,next) {
		actionCloudDisk.cloudDiskInfo(req, res, next);
	});
	app.get('/service/cloudDisk/download/:sn([0-9]+)', function(req,res,next) {
		actionCloudDisk.buildSoftBySn(req, res, next);
	});
	app.get('/service/cloudDisk/download/:fileId', function(req,res,next) {
		actionCloudDisk.downloadFile(req, res, next);
	});
	app.get('/service/cloudDisk/download/:fileId/:picId', function(req,res,next) {
		actionCloudDisk.downloadFile(req, res, next);
	});
	app.put('/service/cloudDisk/star', function(req,res,next) {
		actionCloudDisk.star(req, res, next);
	});
	app.post('/service/burnDisk/buildDependency/:_id', function(req,res,next) {
		actionCloudDisk.buildDependency(req, res, next);
	});
	app.get('/service/burnDisk/checkSnAccess', function(req,res,next) {
		service.checkSnAccess(req, res, next);
	});
}