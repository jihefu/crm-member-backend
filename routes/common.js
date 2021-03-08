var express = require('express');
var path = require('path');
var common = require('../controllers/common');
var common2 = require('../action/common');

module.exports = function ( app ) {
	app.get('/common/cust',function(req,res,next){
		common.cust(req,res,next);
	});
	app.get('/common/employee',function(req,res,next){
		common.employee(req,res,next);
	});
	app.get('/common/contacts_phone',function(req,res,next){
		common.contactsPhone(req,res,next);
	});
	app.get('/common/fogSearchCustomerName',function(req,res,next){
		common.fogSearchCustomerName(req,res,next);
	});
	app.get('/common/getUserIdByUserName',function(req,res,next){
		common2.getUserIdByUserName(req,res,next);
	});
	app.get('/common/getAbbByCompany',function(req,res,next){
		common2.getAbbByCompany(req,res,next);
	});
	app.get('/common/proxyScan',function(req,res,next){
		common.proxyScan(req,res,next);
	});
}