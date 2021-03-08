var express = require('express');
var url = require('url');
var fs = require('fs');

this.vir_info = function(req,res){
	var id = req.path.split('vir8/')[1];
	res.sendfile(DIRNAME+'/public/html/weicheng'+id+'.html');
}

this.downDoc = function(req,res){
	var fileName = 'AD800卡接口定义v17.pdf';
	var filePath = DIRNAME+'\\downloads\\doc\\AD800卡接口定义v17.pdf';
	res.download(filePath,fileName,function(err){
		if(err){
			console.log(err);
		}else{
			console.log(321);
		}
	});
}