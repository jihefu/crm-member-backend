var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var dealImages = require('images');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var formidable = require('formidable');
var nodemailer=require("nodemailer");
var request = require('request');
var sha1 = require('sha1');
var qs = require('querystring');
var modContract = require('../model/contract');

//发送站内消息
class SendStationNews {
	constructor(option) {
		this.params_arr = option;
	}

	sendMsg(res,url){
		let params_arr = JSON.stringify(this.params_arr);
		res.redirect(url+'?params='+params_arr);
	}
}

//发送邮件
class SendEmail {
	constructor(option) {
		this.mailOptions = option;
		this.transporter = nodemailer.createTransport({
		    service:'qiye.aliyun',
		    auth:{
		        user:'service@langjie.com',
		        pass:"qw@13871947641"  //QQ授权码
		    }
		});
	}

	sendMsg(cb) {
		this.transporter.sendMail(this.mailOptions,function(err,info){
		    if(err){
		    	LOG(err);
		    	return;
		    }
		    cb();
		});
	}
}

//发送短信
class SMS {
	constructor(opt){
		const Appkey = '610a50b5662b91fae6ef57fb8c733f88';
		const AppSecret='d671e45ce569';
		let CurTime = parseInt(Date.now()/1000)+""; //当前时间秒数
		let Nonce = sha1(CurTime);  //随机数
		let CheckSum = sha1(AppSecret + Nonce + CurTime);
		this.SMSTemplate = {
			v_code: 3091067,
			reg_code: 3080086,
			app_reg_code: 3081085
		};
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
		    	templateid: this.SMSTemplate.v_code,
		    	mobiles: opt.mobiles,
		    	params: opt.params
		    }
		}
	}

	sendMsg(cb){
		this.option.body = qs.stringify(this.option.body);
		request(this.option,function(error,response,body){
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				cb(error,response,body);
			}
		});
	}
}

//上传图片
class UploadImg {
	constructor(uploadDir,stamp){
		this.uploadDir = uploadDir;
		this.stamp = stamp;
	}
	
	upload(req,cb){
		let form = new formidable.IncomingForm();
		let that = this;
		form.encoding = 'utf-8'; 
	    form.uploadDir = DIRNAME+'/public';
	    form.keepExtensions = true; //保留后缀
	    form.type = true;
	    form.parse(req, function(err, fields, files) {
	    	if(err){
	    		LOG(err);
	    		return;
	    	}
	    	var extName = ''; 
	        switch (files.img.type) {
	            case 'image/pjpeg':
	                extName = 'jpg';
	                break;
	            case 'image/jpeg':
	                extName = 'jpg';
	                break;
	            case 'image/png':
	                extName = 'png';
	                break;
	            case 'image/x-png':
	                extName = 'png';
	                break;
	            default: 
	            	extName = 'jpg';
	                break;
	        }
	        that.size = files.img.size;
	        if(that.stamp){
	        	that.name = Date.parse(new Date())+'.'+extName
	        }else{
	        	that.name = fields.name+'.'+extName;
	        }
	        let path = that.uploadDir.split('/public/')[1];
	        let path_arr = path.split('/');
	        let path_str = DIRNAME+'/public';
	        path_arr.forEach(function(items,index){
	        	path_str += '/'+items;
	        	if(!fs.existsSync(path_str)) fs.mkdirSync(path_str);
	        });
	        let img_name = that.name?'\\'+that.name:files.img.path.split('\\public')[1];
	        let new_path = path_str + img_name;
	        fs.renameSync(files.img.path, new_path);
	        that.path = new_path;
	        cb(fields.name);
	    });
	}

	resize(){
		let size = this.size;
		if(size/1024/1024>1){
			let path = this.path;
			dealImages(path).save(path,{
				quality : size/1024/1024*10
			});
		}
	}
}

//上传图片新版
class UploadImgPro {
	constructor(uploadDir,stamp){
		this.uploadDir = uploadDir;
		this.stamp = stamp;
	}
	
	upload(req,cb){
		var form = new formidable.IncomingForm();
		var that = this;
		form.encoding = 'utf-8'; 
	    form.uploadDir = DIRNAME+'/public';
	    form.keepExtensions = true; //保留后缀
	    form.type = true;
	    form.parse(req, function(err, fields, files) {
	    	if(err){
	    		LOG(err);
	    		return;
	    	}
	    	var extName = ''; 
	        switch (files.img.type) {
	            case 'image/pjpeg':
	                extName = 'jpg';
	                break;
	            case 'image/jpeg':
	                extName = 'jpg';
	                break;
	            case 'image/png':
	                extName = 'png';
	                break;
	            case 'image/x-png':
	                extName = 'png';
	                break;
	            default: 
	            	extName = 'none';
	                break;
	        }
	        that.size = files.img.size;
	        if(that.stamp){
	        	that.name = Date.parse(new Date())+'.'+extName
	        }else{
	        	that.name = files.img.name;
	        }
	        var path = that.uploadDir.split('/public/')[1];
	        var path_arr = path.split('/');
	        var path_str = DIRNAME+'/public';
	        path_arr.forEach(function(items,index){
	        	path_str += '/'+items;
	        	if(!fs.existsSync(path_str)) fs.mkdirSync(path_str);
	        });
	        var img_name = that.name?'\\'+that.name:files.img.path.split('\\public')[1];
	        var new_path = path_str + img_name;
	        fs.renameSync(files.img.path, new_path);
	        that.path = new_path;
	        if(extName=='none') {
	        	fs.unlink(DIRNAME+that.uploadDir+'/'+that.name);
	        	cb();
	        	return;
	        }
	        cb(that.name,fields);
	    });
	}

	resize(){
		var size = this.size;
		if(size/1024/1024>1){
			var path = this.path;
			dealImages(path).save(path,{
				quality : size/1024/1024*10
			});
		}
	}
}

//获取openid
class GetOpenIdUrl {
	constructor(state){
		const appid = 'wx0f012ab2b8db902d';
		const redirect = encodeURIComponent(CONFIG.wxRedirectUrl);
		this.url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+appid+"&redirect_uri="+redirect+"&response_type=code&scope=snsapi_userinfo&state="+state+"#wechat_redirect";
	}

	getUrl(){
		return this.url;
	}
}

//异步循环
class AsynLoop {
	constructor(num,result){
		this.arr = new Array(num);
		this.count = 0;
		this.result = result;
	}

	exec(i,cb){
		var no = this.result[i].contract_no;
		var that = this;
		modContract.getAll(no,function(res){
			that.arr[i] = res;
			that.count++;
			cb(that.count);
		});
	}
}

//搜索引擎
class SearchEngine {
	constructor(keywords){
		this.keywords = keywords;
		this.tag_arr = [];
		this.res_arr = [];
	}

	start(cb){
		let that = this;
		CON('SELECT * FROM tags_lib',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			rows.forEach(function(items,index){
				if(that.keywords.indexOf(items.tag)!=-1){
					that.tag_arr.push(items.tag);
				}
			});
			cb();
		});
	}

	getRes(cb){
		let p_arr = [];
		let that = this;
		this.tag_arr.forEach(function(items,index){
			p_arr[index] = new Promise(function(resolve,reject){
				CON('SELECT * FROM testing_knowledge WHERE tags LIKE "%'+items+'%" AND isdel = 0 ORDER BY id DESC',function(err,rows){
					if(err){
						LOG(err);
						return;
					}
					that.res_arr.push(rows);
					resolve();
				});
			});
		});
		Promise.all(p_arr).then(function(){
			cb();
		});
	}

	filter(cb){
		let score_obj = {};
		let score_arr = [];
		for (let i = 0; i < this.res_arr.length; i++) {
			this.res_arr[i].forEach(function(items,index){
				if(!score_obj[items.id]){
					score_arr.push({
						score: 1,
						content: items
					});
					score_obj[items.id] = 1;
				}else{
					score_arr.forEach(function(it,ind){
						if(it.content.id==items.id){
							score_arr[ind].score++;
						}
					});
				}
			});
		};
		cb(score_arr.sort(s));
		function s(a,b){
			return b.score-a.score;
		}
	}
}

//中间件
class Middleware {
	constructor(){
		this.cache = [];
	}

	use(fn){
		if(typeof fn !== 'function'){
			LOG('middleware must be a function');
		}
		this.cache.push(fn);
		return this;
	}

	next(fn){
		if(this.middlewares && this.middlewares.length > 0 ){
			var ware = this.middlewares.shift();
			ware.call(this, this.next.bind(this));
		}
	}

	handleRequest(){
		this.middlewares = this.cache.map(function(fn){
			return fn;
		});
		this.next();
	}
}

module.exports = {
	SendStationNews: SendStationNews,
	SendEmail: SendEmail,
	UploadImg: UploadImg,
	UploadImgPro: UploadImgPro,
	SMS: SMS,
	GetOpenIdUrl: GetOpenIdUrl,
	AsynLoop: AsynLoop,
	SearchEngine: SearchEngine,
	Middleware: Middleware
};