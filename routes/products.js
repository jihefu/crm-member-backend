var express = require('express');
var url = require('url');
var path = require('path');
var products = require('../controllers/products');
module.exports = function(app){
	app.get('/products/vir8/:id([0-9]+)', function(req,res,next) {
		products.vir_info(req,res);
	});
	app.get('/products/vir8/downDoc', function(req,res,next) {
		products.downDoc(req,res);
	});
}