var express = require('express');
var url = require('url');
var fs = require('fs');
var dealImages = require('images');
var base = require('./base');
var common = require('./common');
var greeting = require('../model/greeting');

this.main = function(req,res,next){
	res.sendFile(DIRNAME+'/public/greeting/index.html');
}
this.groupSend = function(sms_content){
	// res.header("Access-Control-Allow-Origin", "*");
	var phone_arr = [];
	var _p = new Promise(function(resolve,reject){
		greeting.getMemberPhone(function(result){
			phone_arr = result;
			// phone_arr = [{
			// 	phone: '17328867149',
			// 	name: '韩维龙',
			// 	gender: '男',
			// 	job: '开发'
			// }];
			resolve();
		});
	});
	_p.then(function(){
		class Greet extends base.SMS {
			constructor(opt){
				super(opt);
				this.option.body.templateid = 9314771;
			}
		}
		var sms_p = [];
		phone_arr.forEach(function(items,index){
			sms_p[index] = new Promise(function(resolve,reject){
				var phone = items.phone;
				var gender = items.gender=='男'?'先生':'女士';
				var first_name = items.name.substr(0,1);
				var _name = first_name+gender;
				if(items.job=='法人'){
					var _name = first_name+'总';
				}else{
					var _name = first_name+gender;
				}
				console.log(phone+'<<>>'+_name+'<<>>'+sms_content);
				var Greeting = new Greet({
					mobiles: JSON.stringify([phone]),
					// params: JSON.stringify([_name]),
					params: JSON.stringify([_name,sms_content]),
				});
				// resolve();
				Greeting.sendMsg(function(error,response,body){
					console.log(body);
					if(body.code!=200){
						CON('INSERT INTO _foo ( phone ) VALUES ("'+phone+'")',() => {});
					}
					resolve();
				});
			});
		});
		Promise.all(sms_p).then(function(){
			// SEND(res,200,'发送成功',[]);
		}).catch(function(){
			// SEND(res,416,'发送失败',[]);
		});
	});
}