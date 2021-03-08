var express = require('express');
var url = require('url');
var path = require('path');
var service = require('../action/service');
var repair = require('../action/repair');
const serviceRepair = require('../service/repair');
var contract = require('../action/contract');
const actionHomeRepairs = require('../action/homeRepairs');
const actionRepairs = require('../action/homeRepairs');

module.exports = function(app){
	app.use('/repair',function(req,res,next){
		check(req,res,next);
	});
	app.get('/repair/index',function(req,res,next){
		repair.getList(req,res,next);
	});
	app.get('/repair/info/*',function(req,res,next){
		repair.getInfo(req,res,next);
	});
	app.get('/repair/slider/*',function(req,res,next){
		repair.slider(req,res,next);
	});
	app.post('/repair/uploadImg',function(req,res,next){
		actionHomeRepairs.upload(req,res,next);
	});
	app.put('/repair/updateAlbum',function(req,res,next){
		repair.updateAlbum(req,res,next);
	});
	app.get('/repair/queryExpress/:contract',function(req,res,next){
		contract.queryExpress(req,res,next);
	});
	app.get('/repair/getNotDeliveryNoBySn',function(req,res,next){
		repair.getNotDeliveryNoBySn(req,res,next);
	});
	app.get('/repair/addRepair',function(req,res,next){
		repair.addRepair(req,res,next);
	});
	app.get('/repair/searchCnAbb',function(req,res,next){
		repair.searchCnAbb(req,res,next);
	});
	app.post('/repair/createRepairNo',function(req,res,next){
		repair.createRepairNo(req,res,next);
	});
	app.get('/repair/stateDetail/:no',function(req,res,next){
		repair.stateDetail(req,res,next);
	});
	app.put('/repairs/toFirstCheck', function(req, res, next) {
        actionRepairs.toFirstCheck(req, res, next);
    });
    app.put('/repairs/toRepairing', function(req, res, next) {
        actionRepairs.toRepairing(req, res, next);
    });
    app.put('/repairs/toSecondCheck', function(req, res, next) {
        actionRepairs.toSecondCheck(req, res, next);
    });
    app.put('/repairs/toPrepareSend', function(req, res, next) {
        actionRepairs.toPrepareSend(req, res, next);
    });
    app.put('/repairs/toHasSend', function(req, res, next) {
        actionRepairs.toHasSend(req, res, next);
    });
    app.put('/repairs/toHasReceive', function(req, res, next) {
        actionRepairs.toHasReceive(req, res, next);
	});
	app.put('/repairs/updateFormData', function(req, res, next) {
        actionRepairs.update(req, res, next);
	});
	app.get('/repair/deliverGoods',function(req,res,next){
		repair.deliverGoods(req,res,next);
	});
	app.get('/repair/searchFullCpy',function(req,res,next){
		repair.searchFullCpy(req,res,next);
	});
	app.get('/repair/searchContactsInfoByKeywords',function(req,res,next){
		repair.searchContactsInfoByKeywords(req,res,next);
	});
	app.post('/repair/addDeliveryNo',function(req,res,next){
		repair.addDeliveryNo(req,res,next);
	});
	app.post('/repair/addRepairMsg',function(req,res,next){
		actionHomeRepairs.addRepairMsg(req,res,next);
	});
	app.get('/repair/getRepairMsg',function(req,res,next){
		actionHomeRepairs.getRepairMsg(req,res,next);
	});
	app.get('/repair/msg',function(req,res,next){
		repair.msg(req,res,next);
	});

	app.post('/repair_ajax/sub',function(req,res,next){
		repair.sub(req,res,next);
	});
	app.post('/repair_ajax/takeGoods',function(req,res,next){
		repair.takeGoods(req,res,next);
	});
	app.put('/repair_ajax/nextStatus',function(req,res,next){
		repair.nextStatus(req,res,next);
	});
}

function check(req,res,next){
	service.checkOpenId(req,res,next,function(){
		service.checkPerson(req,res,next,async function(result){
			const { uid } = req.session;
			if(result.code.includes(10001)){
				req.session.cn_abb_for_repair = 'langjiestaff';
				next();
			} else if (result.code.includes(10002)) {
				// 获取dealer为我的卡
				// 在维修列表中找到这些id
				const repairId = await serviceRepair.getRepaidIdByUserId(uid);
				req.session.repairId = repairId;
				next();
			} else {
				//获得会员名和公司简称
				repair.getNameAndAbb({
					open_id: req.session.open_id
				},function(result){
					req.session.cn_abb_for_repair = result.data.cn_abb;
					next();
				});
			}
		});
	});
}