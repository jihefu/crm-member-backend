const request = require('request');
var fs = require('fs');
var crypto = require('crypto');
var sha1 = require('sha1');
var qs = require('querystring');

//发送短信
this.classSms = class SMS {
	constructor(opt){
		const Appkey = CONFIG.SMSAppKey;
		const AppSecret  =CONFIG.SMSAppSecret;
		let CurTime = parseInt(Date.now()/1000)+""; //当前时间秒数
		let Nonce = sha1(CurTime);  //随机数
		let CheckSum = sha1(AppSecret + Nonce + CurTime);
		this.option = {
			url: 'https://api.netease.im/sms/sendtemplate.action?',
			method: 'POST',
			headers: {
		        'AppKey': Appkey,
		        'CurTime': CurTime,
		        'Nonce': Nonce,
		        'CheckSum': CheckSum,
		        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
		    },
		    body: {
		    	templateid: opt.templateid,
		    	mobiles: opt.mobiles,
		    	params: opt.params
		    }
		}
	}

	sendMsg(cb){
		this.option.body = qs.stringify(this.option.body);
		request(this.option,function(error,response,body){
			console.log(body);
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				cb(error,response,body);
			}
		});
	}
}