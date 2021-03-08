var express = require('express');
var url = require('url');
var fs = require('fs');
var dealImages = require('images');
var base = require('./base');
var basicAuth = require("basic-auth");
var common = require('./common');

this.render = function(req,res,next){
	res.sendFile(DIRNAME+'/react_project/index.html');
}

this.getUserId = function(req,res,next){
	console.log(req.session.admin_id);
	SEND(res,200,'',req.session.admin_id);
}