var express = require('express');
var mysql = require('mysql');
var url = require('url');
var fs = require('fs');	

this.getMemberPhone = function(cb){
	CON('SELECT name,phone,gender,job FROM vip_basic',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getContactsPhone = function(cb){
	CON('SELECT name,phone1,phone2,sex FROM contacts',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}