var express = require('express');
var url = require('url');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var modHybridApp = require('../model/mod_hybrid_app');
var BaseMsg = require('../dao').BaseMsg;
var CallMsg = require('../dao').CallMsg;

this.userLogin = function(username,password,phone,cb){
	var md5 = crypto.createHash('md5');
	password = md5.update(password).digest('hex');
	modHybridApp.checkUser(username,function(result){
		if(result[0]==null){
			cb({
				code: -10002
			});
		}else{
			if(password==result[0].pwd){
				cb({
					code: 200,
					user_id: result[0].user_id
				});
			}else{
				cb({
					code: -10003
				});
			}
		}
	});
}

this.callIn = function(phone,cb){
	cb([]);
}
this.orderList = function(user_id,page,num,keywords,filter,cb){
	var start_page = (page-1) * num;
	modHybridApp.getOrderList(user_id,start_page,num,keywords,filter,function(result){
		cb(result);
	});
}
this.orderInfo = function(id,cb){
	BaseMsg.findOne({
		include: [CallMsg],
		where: {
			id: [id]
		}
	}).then(function(result){
		cb(result.dataValues);
	}).catch(function(e){
		LOG(e);
	});
	// var p_data = new Promise(function(resolve,reject){
	// 	modHybridApp.getOrderInfo(id,function(result){
	// 		resolve(result);
	// 	});
	// });
	// var p_comment1 = new Promise(function(resolve,reject){
	// 	modHybridApp.getComment('lj_node','contact_message',function(result){
	// 		resolve(result);
	// 	});
	// });
	// var p_comment2 = new Promise(function(resolve,reject){
	// 	modHybridApp.getComment('lj_node','call_message',function(result){
	// 		resolve(result);
	// 	});
	// });
	// Promise.all([p_data,p_comment1,p_comment2]).then(function(result){
	// 	var data_obj = result[0][0];
	// 	var comment_arr = result[1].concat(result[2]);
	// 	for(var i in data_obj){
	// 		var obj = {};
	// 		obj.value = data_obj[i];
	// 		comment_arr.forEach(function(items,index){
	// 			if(i==items.column_name){
	// 				obj.comment = items.column_comment;
	// 			}
	// 		});
	// 		data_obj[i] = obj;
	// 	}
	// 	cb(data_obj);
	// });
}