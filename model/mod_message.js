var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');
var async = require('async');

this.middleMsg = function(params,cb){
	CON('INSERT INTO '+params.table+' ('+params.key_str+') VALUES ('+params.val_str+')',function(err,rows){
		if(err){
			LOG(err);
			cb({code:-100});
			return;
		}
		cb({code:200});
	});
}
this.getMemberInfo = function(name,cb){
	CON('SELECT * FROM vip_basic WHERE name = "'+name+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.insertMsg = function(params,cb){
	var str = 'INSERT INTO '+params.table+' ('+params.key_str+') VALUES '+params.val_str;
	CON(str,function(err,result){
		if(err){
			LOG(err);
			cb('error');
			return;
		}
		cb('success');
	});
}
this.getName = function(keywords,cb){
	var str = getNameList(keywords);
	CON(str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}

function getNameList(keywords){
	var f = new NameList()[keywords];
	return f();
}
function NameList(keywords){}
NameList.prototype.allMember = function(){
	var str = 'SELECT DISTINCT name,phone FROM vip_basic';
	return str;
}
NameList.prototype.portrait = function(){
	var str = 'SELECT DISTINCT name,phone FROM vip_basic WHERE portrait IS NULL';
	return str;
}
NameList.prototype.info = function(){
	var str = 'SELECT name,phone FROM vip_basic WHERE birth IS NULL OR qq IS NULL OR portrait IS NULL OR addr IS NULL OR college IS NULL OR major IS NULL OR company IS NULL OR job IS NULL';
	return str;
}