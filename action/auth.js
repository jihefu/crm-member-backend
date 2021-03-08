var express = require('express');
var url = require('url');
var path = require('path');
var request = require('request');
var basicAuth = require('basic-auth');
var auth = require('../service/auth');

this.checkStaff = function(req,res,next){
	var admin_id = req.session.admin_id;
}