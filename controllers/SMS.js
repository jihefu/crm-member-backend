var express = require('express');
var url = require('url');
var request = require('request');
var base = require('./base');
const newBase = require('../service/base');
var qs = require('querystring');
var sha1 = require('sha1');
const aliSms = require('../action/aliSms');

this.vCode = async (req,res,next) => {
	let params = url.parse(req.url,true).query;
	let code = params.code;
	let mobile = params.mobile;
	const result = await aliSms.sendAliSms({
		type: 'vCode',
		PhoneNumbers: mobile,
		TemplateParam: JSON.stringify({
			code,
		}),
	});
	result.data = mobile;
	res.send(result);


	// class SMS {
	// 	constructor(opt){
	// 		const Appkey = '610a50b5662b91fae6ef57fb8c733f88';
	// 		const AppSecret='d671e45ce569';
	// 		let CurTime = parseInt(Date.now()/1000)+""; //当前时间秒数
	// 		let Nonce = sha1(CurTime);  //随机数
	// 		let CheckSum = sha1(AppSecret + Nonce + CurTime);
	// 		this.option = {
	// 			url: 'https://api.netease.im/sms/sendcode.action?',
	// 			method: 'POST',
	// 			headers: {
	// 				'AppKey': Appkey,
	// 				'CurTime': CurTime,
	// 				'Nonce': Nonce,
	// 				'CheckSum': CheckSum,
	// 				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
	// 			},
	// 			body: {
	// 				templateid: opt.templateid,
	// 				mobile: opt.mobile,
	// 				authCode: opt.authCode,
	// 			}
	// 		}
	// 	}
	
	// 	sendMsg(cb){
	// 		this.option.body = qs.stringify(this.option.body);
	// 		request(this.option,function(error,response,body){
	// 			body = JSON.parse(body);
	// 			cb(body);
	// 		});
	// 	}
	// }
	// new SMS({
	// 	templateid: CONFIG.SMSTemp.new_v_code,
	// 	mobile: mobile,
	// 	authCode: Number(code),
	// }).sendMsg(result => {
	// 	result = typeof result === 'string' ? JSON.parse(result) : result;
	// 	const msg = result.code === 200 ? '发送成功' : result.msg;
	// 	SEND(res,result.code,msg,mobile);
	// });
	// smsOverride.sendMsg({
    //     templateid: CONFIG.SMSTemp.new_v_code,
    //     mobile,
    //     authCode: Number(code),
    // }, result => {
    //     console.log(result);
    // });
	// let baseSMS = new base.SMS({
	// 	mobiles: JSON.stringify([mobile]),
	// 	params: JSON.stringify([code]),
	// });
	// baseSMS.sendMsg(function(error,response,body){
	// 	console.log(body);
	// 	if(body.code==416){
	// 		SEND(res,416,'操作过于频繁',mobile);
	// 	}else if(body.code==200){
	// 		SEND(res,200,'',mobile);
	// 	}
	// });
}

this.regCode = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var option = JSON.parse(params.option);
	var name = option.name;
	var phone = option.phone;
	var regCode = option.regCode;
	var authOperKey = option.authOperKey;
	var sn = option.sn;
	var mid = option.mid;
	var appName = option.appName;
	if(req.session.sms_sn==sn&&req.session.sms_mid==mid&&req.session.sms_appName==appName){
		SEND(res,-1,'请勿重复操作',[]);
		return;
	}
	req.session.sms_sn = sn;
	req.session.sms_mid = mid;
	req.session.sms_appName = appName;
	if(!/-/ig.test(appName)||appName==''){
		aliSms.sendAliSms({
			type: 'regCode',
			PhoneNumbers: phone,
			TemplateParam: JSON.stringify({
				regCode,
				authOperKey,
				sn,
				mid,
			}),
		});
		// class SMSRegCode extends base.SMS {
		// 	constructor(opt){
		// 		super(opt);
		// 		this.option.body.templateid = this.SMSTemplate.reg_code;
		// 	}
		// }
		// var smsRegCode = new SMSRegCode({
		// 	mobiles: JSON.stringify([phone]),
		// 	params: JSON.stringify([regCode,authOperKey,sn,mid])
		// });
		// smsRegCode.sendMsg(function(error,response,body){});
		if(mid==0){
			var message = '注册码：'+regCode+'，授权操作码：'+authOperKey+'。（序列号：'+sn+'，机器号：）';
		}else{
			var message = '注册码：'+regCode+'，授权操作码：'+authOperKey+'。（序列号：'+sn+'，机器号：'+mid+'）';
		}
	}else{
		aliSms.sendAliSms({
			type: 'softRegCode',
			PhoneNumbers: phone,
			TemplateParam: JSON.stringify({
				regCode,
				authOperKey,
				sn,
				name: appName,
			}),
		});
		// class SMSRegCode extends base.SMS {
		// 	constructor(opt){
		// 		super(opt);
		// 		this.option.body.templateid = this.SMSTemplate.app_reg_code;
		// 	}
		// }
		// var smsRegCode = new SMSRegCode({
		// 	mobiles: JSON.stringify([phone]),
		// 	params: JSON.stringify([regCode,authOperKey,sn,appName])
		// });
		// smsRegCode.sendMsg(function(error,response,body){});
		var message = '注册码：'+regCode+'，授权操作码：'+authOperKey+'。（序列号：'+sn+'，软件名：'+appName+'）';
	}
	var params_arr = [
		{
			table: 'vip_message',
			user: [
				{
					name: name,
					phone: phone
				}
			],
			model: 'singleMsg',
			title: '注册反馈',
			url: '',
			message: message,
			sender: 'system'
		}
	];
	params_arr = JSON.stringify(params_arr);
	res.redirect(ROUTE('message/msg_to_applicant?params='+params_arr));
}

this.callReceipt = async (req,res,next) => {
	var params = url.parse(req.url,true).query;
	const { tags, demand, content, staff_phone, contact_phone } = params;
	LOG(contact_phone+'<<>>'+tags+'<<>>'+demand+'<<>>'+content+'<<>>'+staff_phone);
	const result = await aliSms.sendAliSms({
		type: 'serviceCb',
		PhoneNumbers: contact_phone,
		TemplateParam: JSON.stringify({
			tags,
			demand,
			content,
			staff_phone,
		}),
	});
	res.send(result);
	// class SMSRegCode extends base.SMS {
	// 	constructor(opt){
	// 		super(opt);
	// 		this.option.body.templateid = 9364739;
	// 	}
	// }
	// var smsRegCode = new SMSRegCode({
	// 	mobiles: JSON.stringify([contact_phone]),
	// 	params: JSON.stringify([tags,demand,content,staff_phone])
	// });
	// LOG(contact_phone+'<<>>'+tags+'<<>>'+demand+'<<>>'+content+'<<>>'+staff_phone);
	// smsRegCode.sendMsg(function(error,response,body){
	// 	res.send(body);
	// });
}