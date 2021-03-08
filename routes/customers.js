var express = require('express');
var url = require('url');
var path = require('path');
var customer = require('../action/customers');

module.exports = function(app){
	// app.post('/admin/customers/type_new', function(req, res, next) {
	// 	customer.typeNewList(req,res,next);
	// });
	app.post('/admin/customers/newIncomingCustomers', function(req, res, next) {
		customer.newIncomingCustomers(req,res,next);
	});
	app.get('/admin/customers/type_new', function(req, res, next) {
		customer.typeNewListByGet(req,res,next);
	});
	app.post('/admin/customers/type_d_list', function(req, res, next) {
		customer.typeDList(req,res,next);
	});
	app.get('/admin/customers/customerInfo', function(req, res, next) {
		customer.customerInfo(req,res,next);
	});
	app.put('/admin/customers/updateCustomerInfo', function(req, res, next) {
		customer.updateCustomerInfo(req,res,next);
	});
	app.put('/admin/customers/changeIntentDegree', function(req, res, next) {
		customer.changeIntentDegree(req,res,next);
	});
}