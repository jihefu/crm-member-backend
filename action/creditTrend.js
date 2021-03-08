var express = require('express');
var url = require('url');
var path = require('path');
var request = require('request');
var creditTrend = require('../service/creditTrend');

/**
 *	获取信用相关数据
 */
this.getCreditTrendData = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	creditTrend.getCreditTrendData(params,result => {
		SEND(res,result.code,result.msg,result.data);
	});
}