var express = require('express');
var url = require('url');
var path = require('path');
var request = require('request');
var common = require('../service/common');

this.getUserIdByUserName = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var bs_name = params.val;
	common.pcAuth({
		bs_name: bs_name
	},result => {
		SEND(res,200,'',result);
	});
}

this.getAbbByCompany = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.val;
	common.getInfoByCompanyInfo(company,result => {
		SEND(res,200,'',result);
	});
}

this.searchCpy = async (req, res, next) => {
	var params = url.parse(req.url,true).query;
	const result = await common.searchCpy(params);
	res.send(result);
}