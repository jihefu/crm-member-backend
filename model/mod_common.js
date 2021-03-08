var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');

this.contactsPhone = function(name,cb){
	var p_v = new Promise(function(resolve,reject){
		CON('SELECT phone FROM vip_basic WHERE name = "'+name+'" OR company LIKE "%'+name+'%"',function(err,rows){
			if(err){
				reject(err);
				return;
			}
			resolve(rows);
		});
	});
	var p_c = new Promise(function(resolve,reject){
		CON('SELECT phone1,phone2 FROM contacts WHERE ( name = "'+name+'" OR company LIKE "%'+name+'%" ) AND isdel = 0',function(err,rows){
			if(err){
				reject(err);
				return;
			}
			resolve(rows);
		});
	});
	Promise.all([p_v,p_c]).then(function(result){
		var res_arr = [];
		result.forEach(function(items,index){
			items.forEach(function(it,ind){
				res_arr.push(it);
			});
		});
		cb(res_arr);
	}).catch(function(result){
		LOG(result);
	});
}
this.searchCustomerName = function(keywords,cb){
	CON('SELECT * FROM customers WHERE abb = "'+keywords+'" OR cn_abb = "'+keywords+'" OR company = "'+keywords+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.fogSearchCustomerName = function(keywords,cb){
	CON('SELECT * FROM customers WHERE ( abb LIKE "%'+keywords+'%" OR cn_abb LIKE "%'+keywords+'%" OR company LIKE "%'+keywords+'%" ) AND isdel = 0',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('SELECT * FROM users WHERE ( abb LIKE "%'+keywords+'%" OR cn_abb LIKE "%'+keywords+'%" OR company LIKE "%'+keywords+'%" ) AND isdel = 0',function(err,result){
			if(err){
				LOG(err);
				return;
			}
			rows = rows.concat(result);
			cb(rows);
		});
	});
}