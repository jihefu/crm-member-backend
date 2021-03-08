var express = require('express');
var path = require('path');
var url = require('url');

this.mainIndex = function(req,res){
	var params = url.parse(req.url,true).query;
	var id = params.id;
	res.render('./pages/testing_machine',{
		id:id
	});
}
this.tc = function(req,res){
	res.render('./pages/test_ctrl');
}

