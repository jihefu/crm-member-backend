var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');
var greeting = require('../controllers/greeting');
module.exports = function ( app ) {
	app.get('/greeting/*', function(req,res,next) {
		greeting.main(req,res,next);
	});
	app.post('/greeting_ajax/group_send', function(req,res,next) {
		greeting.groupSend(req,res,next);
	});
}