var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var crypto = require('crypto');
var base = require('../controllers/base');
var common = require('../controllers/common');
var payments = require('../controllers/payments');
var credit = require('../controllers/credit');
var contract = require('../action/contract');
const cacheCreditInfo = require('../cache/creditInfo');

module.exports = function(app){
	app.get('/admin/finance',function(req,res,next){
		common.auth(req,res,next,function(){
			// payments.finance(req,res,next);
			payments.main(req,res,next);
		});
	});
	app.get('/admin/payments',function(req,res,next){
		common.auth(req,res,next,function(){
			payments.main(req,res,next);
		});
	});
	app.post('/admin/payments/list',function(req,res,next){
		payments.list(req,res,next);
	});
	app.post('/admin/payments/refresh',function(req,res,next){
		payments.refresh(req,res,next);
	});
	app.get('/admin/payments/payUse',function(req,res,next){
		payments.payUse(req,res,next);
	});
	app.put('/admin/payments/update',function(req,res,next){
		payments.update(req,res,next);
	});
	app.post('/admin/payments/add',function(req,res,next){
		payments.add(req,res,next);
	});
	app.delete('/admin/payments/del',function(req,res,next){
		payments.del(req,res,next);
	});
	app.put('/admin/payUse/update',function(req,res,next){
		payments.payUseUpdate(req,res,next);
	});
	app.post('/admin/payUse/add',function(req,res,next){
		payments.payUseAdd(req,res,next);
	});
	app.delete('/admin/payUse/del',function(req,res,next){
		payments.payUseDel(req,res,next);
	});
	app.get('/admin/payments/searchContractNo',function(req,res,next){
		payments.searchContractNo(req,res,next);
	});
	app.post('/admin/payments/uploadImg',function(req,res,next){
		payments.uploadImg(req,res,next);
	});
	app.post('/admin/payments/delImg',function(req,res,next){
		payments.delImg(req,res,next);
	});
	app.post('/admin/payments/addId',function(req,res,next){
		payments.addId(req,res,next);
	});
	//credit
	app.post('/admin/credit/list',function(req,res,next){
		credit.list(req,res,next);
	});
	app.post('/admin/credit/add',function(req,res,next){
		credit.add(req,res,next);
	});
	app.put('/admin/credit/update',function(req,res,next){
		credit.update(req,res,next);
	});
	app.delete('/admin/credit/del',function(req,res,next){
		credit.del(req,res,next);
	});
	app.post('/admin/credit/uploadImg',function(req,res,next){
		credit.uploadImg(req,res,next);
	});
	app.post('/admin/credit/delImg',function(req,res,next){
		credit.delImg(req,res,next);
	});
	app.post('/admin/credit/addId',function(req,res,next){
		credit.addId(req,res,next);
	});
	app.post('/admin/payments/updateAssign',function(req,res,next){
		payments.updateAssign(req,res,next);
	});
	app.get('/admin/payments/getAmount',function(req,res,next){
		payments.getAmount(req,res,next);
	});
	//contract_report
	app.get('/admin/creditReport',function(req,res,next){
		payments.contractReport(req,res,next);
	});
	app.get('/admin/getContractReportData',function(req,res,next){
		payments.getContractReportData(req,res,next);
	});
	app.get('/admin/getCreditData',function(req,res,next){
		payments.getCreditData(req,res,next);
	});
	app.get('/admin/getReportList',function(req,res,next){
		payments.getReportList(req,res,next);
	});
	//信用总览
	app.use('/admin/getOver',function(req,res,next){
		cacheCreditInfo.getCache(req, res, next);
	});
	app.post('/admin/getOver',function(req,res,next){
		payments.getOver(req,res,next);
	});
	app.put('/admin/updateMarkItem',function(req,res,next){
		payments.updateMarkItem(req,res,next);
	});
	// app.get('/admin/getOverLineCompany',function(req,res,next){
	// 	payments.getOverLineCompany(req,res,next);
	// });
	app.get('/admin/getNeedFreezeContracts',function(req,res,next){
		payments.getNeedFreezeContracts(req,res,next);
	});
	//合同总览
	app.post('/admin/contracts/view',function(req,res,next){
		contract.getContractsView(req,res,next);
	});
}