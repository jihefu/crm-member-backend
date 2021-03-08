var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var request = require('request');
var customer = require('../service/customers');

/**
 *	新客户列表(post)
 */
this.typeNewList = (req,res,next) => {
	let params = JSON.parse(req.body.models);
	customer.typeNewList(params,(result) => {
		res.send(result.data);
	});
}

/**
 *	新客户列表(get)
 */
this.typeNewListByGet = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	customer.typeNewList(params,(result) => {
		SEND(res,result.code,result.msg,result.data);
	});
}

this.newIncomingCustomers = (req,res,next) => {
	let params = JSON.parse(req.body.models);
	customer.newIncomingCustomers(params,(result) => {
		res.send(result.data);
	});
}

/**
 *	D类客户列表
 */
this.typeDList = (req,res,next) => {
	let params = JSON.parse(req.body.models);
	customer.typeDList(params,(result) => {
		res.send(result.data);
	});
}

this.changeIntentDegree = async (req, res) => {
	const params = req.body;
	const result = await customer.changeIntentDegree(params);
	res.send(result);
}

/**
 *	指定客户信息
 */
this.customerInfo = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	customer.customerInfo(params,result => {
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 *	更新指定客户信息
 */
this.updateCustomerInfo = (req,res,next) => {
	let form_data = req.body.form_data;
	customer.updateCustomerInfo({
		form_data: form_data
	},result => {
		SEND(res,result.code,result.msg,result.data);
	});
}

/*******************************react接口********************************/

/**
 *	客户列表
 *  method get
 */
this.list = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	customer.list(params,result => {
		res.send(result);
	});
}