var express = require('express');
var url = require('url');
var fs = require('fs');
var dealImages = require('images');
var base = require('./base');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var sha1 = require('sha1');
var request = require('request');
var modCommon = require('../model/mod_common');
var mod_admin = require('../model/mod_admin');
var modRepair = require('../model/repair');
var modService = require('../model/mod_service');
var serviceBase = require('../service/base');
const serviceHomeLogin = require('../service/homeLogin');

this.cust = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var val = params.val;
	modRepair.searchInput(val,function(result){
		var arr = [];
		for (var i = 0; i < result.length; i++) {
			for (var j = 0; j < result[i].length; j++) {
				if(arr.length<5){
					arr.push(result[i][j]);
				}
			};
		};
		SEND(res,200,'',arr);
	});
}
this.contactsPhone = function(req,res,next){
	var that = this;
	var params = url.parse(req.url,true).query;
	var val = params.val;
	var name_arr = JSON.parse(params.name_arr);
	var p_arr = [];
	name_arr.forEach(function(items,index){
		p_arr[index] = new Promise(function(resolve,reject){
			modCommon.contactsPhone(items,function(result){
				resolve(result);
			});
		});
	});
	Promise.all(p_arr).then(function(result){
		var phone_arr = [];
		result.forEach(function(items,index){
			items.forEach(function(it,ind){
				for(let i in it){
					if(it[i]!=''&&it[i]!=null){
						phone_arr.push(it[i]);
					}
				}
			});
		});
		phone_arr = that.arrayUnique(phone_arr);
		SEND(res,200,'',phone_arr);
	});
}
this.employee = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var key = params.key;
	var val = params.val;
	modService.searchSalesman(key,val,function(result){
		result.forEach(function(items,index){
			result[index].cn_abb = items.user_name;
		});
		SEND(res,200,'',result);
	});
}

this.auth = function(req,res,next,cb){
	var user = basicAuth(req);
	if (!user) {
		res.statusCode = 401;
		res.setHeader('WWW-Authenticate', 'Basic realm="langjie"');
		res.send('请输入工号和密码登陆');
	}
	var _name = user.name,pass = user.pass;
	console.log(_name);
	if((/\d/.test(_name)==true)||(/[\u4e00-\u9fa5]/.test(_name)==true)){
		var name = _name;
	}else{
		var name = _name.toLowerCase();
	}
	var md5 = crypto.createHash('md5');
	var password = md5.update(pass).digest('hex');
	mod_admin.auth(name,function(rows){
		if(rows.msg=='err'){
			res.statusCode = 401;
			res.setHeader('WWW-Authenticate', 'Basic realm="langjie"');
			res.send('工号不存在');
		}else{
			if(password==rows[0].pwd){
				cb();
			}else{
				res.statusCode = 401;
				res.setHeader('WWW-Authenticate', 'Basic realm="langjie"');
				res.send('密码不正确');
			}
		}
	});
}

this.getEmployeeId = function(req,res,next,cb,name){
	try{
		name = name?name:basicAuth(req).name;
	}catch(e){
		name = '';
	}
	mod_admin.searchUpdataPerson(name,function(result){
		cb(result);
	});
}

this.getEmployeeIdByToken = async function(req,res,next,cb,name){
	var token = decodeURIComponent(url.parse(req.url,true).query.token);
	const r = await serviceHomeLogin.openCheckToken({ token });
	const { userId } = r.data;
	// var accessToken = new serviceBase.AccessToken();
	// var resObj = accessToken.checkToken(token);
	// console.log(resObj);
	// var user_id = resObj.data.userId;
	cb([{
		user_id: userId
	}]);
}

this.getEmployeeName = function(name,cb){
	mod_admin.transPerson(name,function(result){
		if(result[0]==null){
			cb([{user_name: name}]);
		}else{
			cb(result);
		}
	});
}
this.arrayUnique = function(arr){
	Array.prototype.unique = function(){
		var res = [];
		var json = {};
		for(var i = 0; i < this.length; i++){
		    if(!json[this[i]]){
		   		res.push(this[i]);
		   		json[this[i]] = 1;
		  	}
		}
		return res;
	}
	return arr.unique();
}
this.transaction = function(sql_arr,cb){
	var p_arr = [];
	CONROLLBACK(function(err,conn){
		if(err){
			LOG(err);
			return;
		}
		conn.beginTransaction(function(err){
	    	if(err){
	    		LOG(err);
	    		return;
	    	}
	    	sql_arr.forEach(function(items,index){
	    		p_arr[index] = new Promise(function(resolve,reject){
	    			conn.query(sql_arr[index],function(err,rows){
	    				if(err){
	    					reject(err);
	    				}else{
	    					resolve(rows);
	    				}
	    			});
	    		});
	    	});
	    	Promise.all(p_arr).then(function(result){
	    		conn.commit(function(err){
					if(err) {
                        conn.rollback(function() {                                    
                            LOG(err);                                         
                        });                                                           
                    }
                    conn.release();
                    cb({code:200});
				});
	    	}).catch(function(err){
	    		conn.rollback(function(){
					LOG(err);
				});
				conn.commit(function(err){
					if(err) {
                        conn.rollback(function() {                                    
                            LOG(err);                                         
                        });                                                           
                    }
                    conn.release();
                    cb({code:-1});
				});
	    	});
	    });
	});
}
this.searchCustomerName = function(keywords,cb){
	modCommon.searchCustomerName(keywords,function(result){
		try{
			cb(result);
		}catch(e){
			cb(keywords);
		}
	});
}
this.fogSearchCustomerName = function(req,res,next){
	var params = url.parse(req.url,true).query;
	for(var key in params){
		if(key=='filter[filters][0][value]'){
			var val = params[key].toUpperCase();
		}
	}
	modCommon.fogSearchCustomerName(val,function(result){
		var res_arr = [];
		result.forEach(function(items,index){
			res_arr.push(items.company);
		});
		res.send(res_arr);
	});
}

this.proxyScan = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var timestamp = params.timestamp;
	const APPID = CONFIG.appid;
	const APPSECRET = CONFIG.appsecret;
	var getToken="https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid="+APPID+"&secret="+APPSECRET;
	request.get(getToken,function(error, response, body){
		var data = JSON.parse(body);
		var access_token = data.access_token;
		var getticket = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token="+access_token+"&type=jsapi";
		request.get(getticket,function(error, response, body){
			var ticket = JSON.parse(body).ticket;
	        var string = 'jsapi_ticket=' + ticket + '&noncestr=Wm3WZYTPz0wzccnW&timestamp=' + timestamp + '&url=' + page;
			var signature = sha1(string);
			SEND(res,200,'',{
				signature: signature,
				appId: APPID,
				nonceStr: "Wm3WZYTPz0wzccnW"
			});
		});
	});
	// request.get(getToken,function(error, response, body){
		
    // 	var getticket = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token="+access_token+"&type=jsapi";
    // 	request.get(getticket,function(error, response, body){
	//         var ticket = JSON.parse(body).ticket;
	//         var string = 'jsapi_ticket=' + ticket + '&noncestr=Wm3WZYTPz0wzccnW&timestamp=' + timestamp + '&url=' + page;
	//         var signature = sha1(string);
	//         console.log({
	//       		signature: signature,
	//       		appId: APPID,
	//       		nonceStr: "Wm3WZYTPz0wzccnW"
	//       	});
	//       	SEND(res,200,'',{
	//       		signature: signature,
	//       		appId: APPID,
	//       		nonceStr: "Wm3WZYTPz0wzccnW"
	//       	});
	//     });
	// });
}