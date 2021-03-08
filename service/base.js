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
const Staff = require('../dao').Staff;
const Customers = require('../dao').Customers;
const Member = require('../dao').Member;
const Users = require('../dao').Users;
const Contacts = require('../dao').Contacts;
const sequelize = require('../dao').sequelize;
const ContractsHead = require('../dao').ContractsHead;
const SignScore = require('../dao').SignScore;
const ItemScore = require('../dao').ItemScore; 
const MemberScore = require('../dao').MemberScore;
const MsgBox = require('../dao').MsgBox;
const Affair = require('../dao').Affair;
const Payment = require('../dao').Payment;
const common = require('./common');

//发送短信
class SMS {
	constructor(opt){
		const Appkey = '610a50b5662b91fae6ef57fb8c733f88';
		const AppSecret='d671e45ce569';
		let CurTime = parseInt(Date.now()/1000)+""; //当前时间秒数
		let Nonce = sha1(CurTime);  //随机数
		let CheckSum = sha1(AppSecret + Nonce + CurTime);
		let that = this;
		this.SMSTemplate = {
			v_code: 3091067,
			reg_code: 3080086,
			app_reg_code: 3081085,
			from_member_send: 4002445,
			test_connect_sms: 4032638
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
		    	templateid: this.SMSTemplate[opt.template]?this.SMSTemplate[opt.template]:this.SMSTemplate.v_code,
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

class MulUploadImg {
	constructor(uploadDir){
		this.uploadDir = uploadDir;
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
	        switch (files.file.type) {
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
	            	extName = files.file.name.split('.')[files.file.name.split('.').length-1];
	                break;
	        }
	        that.size = files.file.size;
	        that.name = Date.now()+'.'+extName;
	        var path = that.uploadDir.split('/public/')[1];
	        var path_arr = path.split('/');
	        var path_str = DIRNAME+'/public';
	        path_arr.forEach(function(items,index){
	        	path_str += '/'+items;
	        	if(!fs.existsSync(path_str)) fs.mkdirSync(path_str);
	        });
	        var img_name = that.name?'\\'+that.name:files.file.path.split('\\public')[1];
			var new_path = path_str + img_name;
	        fs.renameSync(files.file.path, new_path);
			that.path = new_path;
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

	smallSize(){
		let path = this.path;
		let newPath = DIRNAME+this.uploadDir+'/small_'+this.name;
		dealImages(path).resize(35).save(newPath,{});
	}

	anySize(size){
		size = size ? size : 35;
		let path = this.path;
		let newPath = DIRNAME+this.uploadDir+'/small_'+size+'_'+this.name;
		dealImages(path).resize(size).save(newPath,{});
	}
}

class FileUpload {
	constructor(uploadDir){
		this.uploadDir = uploadDir;
	}

	upload(req,cb){
		var form = new formidable.IncomingForm();
		var that = this;
		form.encoding = 'utf-8'; 
	    form.uploadDir = DIRNAME+'/downloads';
	    form.keepExtensions = true; //保留后缀
	    form.type = true;
	    form.parse(req, function(err, fields, files) {
	    	if(err){
	    		LOG(err);
	    		return;
			}
			var extName = ''; 
			var in_arr = files.file.path.split('.');
			extName = in_arr[in_arr.length-1];
			console.log(files.file.name);
	        that.name = Date.now()+'.'+extName;
	        var path = that.uploadDir.split('/downloads/')[1];
	        var path_arr = path.split('/');
	        var path_str = DIRNAME+'/downloads';
	        path_arr.forEach(function(items,index){
	        	path_str += '/'+items;
	        	if(!fs.existsSync(path_str)) fs.mkdirSync(path_str);
	        });
	        var img_name = that.name?'\\'+that.name:files.file.path.split('\\downloads')[1];
			var new_path = path_str + img_name;
	        fs.renameSync(files.file.path, new_path);
			that.path = new_path;
	        cb(that.name,fields);
	    });
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

//发送邮件
class SendEmail {
	constructor(option) {
		this.mailOptions = option;
		this.transporter = nodemailer.createTransport({
		    service:'qiye.aliyun',
		    auth:{
		        user: CONFIG.langjie_email,
		        pass: CONFIG.langjie_email_pass
		        // pass:"qw@13871947641"  		//授权码
		    }
		});
	}

	sendMsg(cb) {
		this.transporter.sendMail(this.mailOptions,function(err,info){
		    if(err){
		    	LOG(err);
		    	return;
		    }
		    cb(info);
		});
	}
}

//token
class AccessToken {
	constructor() {

	}

	//生成token
	createToken(info,timeout){
		let newInfo = {
			data: info,
			created: parseInt(Date.now()),
			exp: parseInt(timeout)||60*60*1*1000	//token有效期(默认一小时)
		}

		//payload信息
		let base64Str = Buffer.from(JSON.stringify(newInfo),"utf8").toString("base64");

		//添加签名，防篡改
		let secret = "www.langjie.com@network";
        let hash = crypto.createHmac('sha256',secret);
        hash.update(base64Str);
        let signature = hash.digest('base64');
        return base64Str + "." + signature;
	}

	//解析token
	decodeToken(token){
		try{
			let decArr = token.split(".");
		}catch(e){
			//token不合法
            return {
            	status: 100
            };
		}
		let decArr = token.split(".");
		if(decArr.length < 2) {
            //token不合法
            return {
            	status: 100,
            };
        }
        let payload = {};
        //将payload json字符串 解析为对象
        try{
            payload = JSON.parse(Buffer.from(decArr[0],"base64").toString("utf8"));
        }catch(e){
        	return {
            	status: 101,
            };
            return false;
        }

        //检验签名
        let secret = "www.langjie.com@network";        
        let hash = crypto.createHmac('sha256',secret);
        hash.update(decArr[0]);
        let checkSignature = hash.digest('base64');

        return {
        	status: 200,
        	payload: payload,
        	signature: decArr[1],
        	checkSignature: checkSignature
        };
	}

	//验证token
	checkToken(token){
		let payload = this.decodeToken(token);
		if(payload.status!=200){
			return {
				code: -1001,
				msg: 'token格式出错',
				data: {}
			};
		}else if(payload.signature!=payload.checkSignature){
			return {
				code: -1002,
				msg: '签名非法',
				data: {}
			};
		}
		// else if(Date.now()>payload.payload.created+payload.payload.exp){
		// 	return {
		// 		code: -1003,
		// 		msg: '身份过期',
		// 		data: {}
		// 	};
		// }
		else{
			return {
				code: 200,
				msg: '',
				data: payload.payload.data
			};
		}
	}
}

// 官网token
class LjToken {
	constructor() {

	}

	//生成token
	createToken(info,timeout){
		const endDate = Date.now() + 60 * 60 * 1000 * 24 * 15;
		let newInfo = {
			data: info,
			endDate,
		}

		//payload信息
		let base64Str = Buffer.from(JSON.stringify(newInfo),"utf8").toString("base64");

		//添加签名，防篡改
		let secret = "www.langjie.com@network";
        let hash = crypto.createHmac('sha256',secret);
        hash.update(base64Str);
        let signature = hash.digest('base64');
        return {
			token: base64Str + "." + signature,
			endDate,
		};
	}

	//解析token
	decodeToken(token){
		try{
			let decArr = token.split(".");
		}catch(e){
			//token不合法
            return {
            	status: 100
            };
		}
		let decArr = token.split(".");
		if(decArr.length < 2) {
            //token不合法
            return {
            	status: 100,
            };
        }
        let payload = {};
        //将payload json字符串 解析为对象
        try{
            payload = JSON.parse(Buffer.from(decArr[0],"base64").toString("utf8"));
        }catch(e){
        	return {
            	status: 101,
            };
            return false;
        }

        //检验签名
        let secret = "www.langjie.com@network";        
        let hash = crypto.createHmac('sha256',secret);
        hash.update(decArr[0]);
        let checkSignature = hash.digest('base64');

        return {
        	status: 200,
        	payload: payload,
        	signature: decArr[1],
        	checkSignature: checkSignature
        };
	}

	//验证token
	checkToken(token){
		let payload = this.decodeToken(token);
		if(payload.status!=200){
			return {
				code: -1001,
				msg: 'token格式出错',
				data: {}
			};
		}else if(payload.signature!=payload.checkSignature){
			return {
				code: -1002,
				msg: '签名非法',
				data: {}
			};
		}else if(Date.now()>payload.payload.endDate){
			return {
				code: -1003,
				msg: '身份过期',
				data: {}
			};
		}else{
			return {
				code: 200,
				msg: '',
				data: payload.payload.data
			};
		}
	}
}

//标记排序
class MarkSort {
	constructor(idArr,resArr){
		this.idArr = idArr;
		this.resArr = resArr;
		this.sideArr = [];
	}

	makeSort(id){
		for (let i = 0; i < this.resArr.length; i++) {
			for (let j = 0; j < this.idArr.length; j++) {
				try{
					if(this.resArr[i].dataValues[id] == this.idArr[j]){
						this.sideArr.push(this.resArr[i]);
						this.resArr.splice(i,1);
						i = i==0?0:--i;
					}
				}catch(e){

				}
			}
		}
		let endArr = [];
		endArr = [...this.sideArr,...this.resArr];
		return endArr;
	}
}

//业务员id包括：员工号（主id）、业务员姓名、手机
class SearchStaffId {
	constructor(keywords){
		this.keywords = keywords;
	}

	getCondition(){
		return {
			where: {
				isdel: 0,
				'$or': {
					user_id: {
						'$eq': this.keywords
					},
					user_name: {
						'$like': '%'+this.keywords+'%'
					},
					phone: {
						'$like': '%'+this.keywords+'%'
					},
					work_phone: {
						'$like': '%'+this.keywords+'%'
					}
				}
			}
		};
	}
}

//基类客户搜索id
//客户id包括：客户号（主id）、全称子串、中文缩写、英文缩写、老板和认证联系人（含会员）的姓名或手机
//子类可以扩展筛选条件
class SearchCustomerId {
	constructor(keywords,filter){
		this.keywords = keywords;
		this.filter = filter;
	}

	//include
	getIncludeCondition(){
		return [{
			association: Customers.hasMany(Member, {foreignKey:'company',sourceKey: 'company'}),
			required: false
		},{
			association: Customers.hasMany(Contacts, {foreignKey:'company',sourceKey: 'company'}),
			required: false
		}]
	}

	getWhereOr(){
		return [
			sequelize.where(sequelize.col('Customers.user_id'), { '$eq': this.keywords}),
			sequelize.where(sequelize.col('Customers.company'), { '$like': '%'+this.keywords+'%'}),
			sequelize.where(sequelize.col('Customers.cn_abb'), { '$like': '%'+this.keywords+'%'}),
			sequelize.where(sequelize.col('Customers.abb'), { '$like': '%'+this.keywords+'%'}),
			sequelize.where(sequelize.col('Customers.legal_person'), { '$like': '%'+this.keywords+'%'}),
			sequelize.where(sequelize.col('Members.name'), { '$like': '%'+this.keywords+'%'}),
			sequelize.where(sequelize.col('Members.phone'), { '$like': '%'+this.keywords+'%'}),
			{
				'$and': [
					sequelize.where(sequelize.col('Contacts.verified'), { '$eq': 1}),
					{
						'$or': [
							sequelize.where(sequelize.col('Contacts.name'), { '$like': '%'+this.keywords+'%'}),
							sequelize.where(sequelize.col('Contacts.phone1'), { '$like': '%'+this.keywords+'%'}),
							sequelize.where(sequelize.col('Contacts.phone2'), { '$like': '%'+this.keywords+'%'})
						]
					}
				]
			}
		]
	}

	getWhereAnd(){
		return [
			sequelize.where(sequelize.col('Customers.isdel'), { '$eq': 0})
		]
	}
}

//员工映射
class StaffMap {

	constructor(){

	}

	getStaffMap(){
		return global.CONFIG.staffMap;
	}

	setStaffMap(){
		Staff.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			const obj = {};
			result.forEach((items,index) => {
				obj[items.dataValues.user_id] = items.dataValues;
			});
			obj['system'] = {
				user_name: '系统'
			};
			global.CONFIG.staffMap = obj;
		}).catch(e => LOG(e));
	}

}

// 计算会员分数
// 只计算基础分和商务分
class CalculScore {
    constructor(data){
        this.data = data;	//数据源
        this.itemScore;		//分数标准
        this.calculBasicScore = 0;
		this.calculCompanyScore = 0;
		this.maxTotal = 1000;	// 总积分最大值
    }

    //获取各项基础分数和商务分数
    getItemScore(cb){
        ItemScore.findOne().then(result => {
            this.itemScore = result;
            cb();
        }).catch(e => LOG(e));
    }

	// 计算基础分数，商务分数，合作分
    getPartScore(cb){
        //获取对应公司的星级
        const getCompanyStar = (cb) => {
            Customers.findAll({
                where: {
                    isdel: 0,
                    company: this.data.company
                }
            }).then(result => {
				let star;
				try {
					if(result[0]==null || result[0].dataValues.star == 0){
						star = 0.1;
					}else{
						star = Number(result[0].dataValues.star)/10;
					}
				} catch (e) {
					star = 0.1;
				}
                cb(star);
            }).catch(e => LOG(e));
        }

        //获取我的职位的较高优先级
        const getHighJob = (cb) => {
            const jobMap = {
                '法人': {
                    sqlItem: 'legal_person'
                },
                '合伙人': {
                    sqlItem: 'legal_person'
                },
                '注册人': {
                    sqlItem: 'reg_person'
                },
                '开发': {
                    sqlItem: 'developer'
                },
                '采购': {
                    sqlItem: 'purchaser'
                },
                '财务': {
                    sqlItem: 'finance'
                },
                '其它': {
                    sqlItem: 'other'
				},
				'': {
                    sqlItem: 'other'
                }
            };
            const s = (a,b) => {
                return b['value'] - a['value'];
			}
			let jobArr;
			try {
				jobArr = this.data.job.split(',').filter(items => items);
			} catch (e) {
				jobArr = [];
			}
			if (jobArr.length === 0) {
				jobArr.push({ text: '其它', value: this.itemScore.dataValues.other });
			}
            jobArr.forEach((items,index) => {
				const value = this.itemScore.dataValues[jobMap[items]['sqlItem']] ? this.itemScore.dataValues[jobMap[items]['sqlItem']] : this.itemScore.dataValues.other;
                const obj = {
                    text: items,
                    value,
                };
                jobArr[index] = obj;
            });
            let completeJobArr = jobArr.sort(s);
            cb(completeJobArr[0].value);
		}

        //基准分
        const basicScore = this.itemScore.dataValues.basic - this.itemScore.dataValues.evaluate;
        const evaluateScore = this.itemScore.dataValues.evaluate;
        const companyScore = this.itemScore.dataValues.company;

        //重新计算获得的分
        let calculBasicScore = basicScore * (this.data.check_name*this.itemScore.dataValues.name+
            this.data.check_phone*this.itemScore.dataValues.phone+this.data.check_birth*this.itemScore.dataValues.birth+
            this.data.check_qq*this.itemScore.dataValues.qq+this.data.check_portrait*this.itemScore.dataValues.portrait+
            this.data.check_addr*this.itemScore.dataValues.addr+this.data.check_college*this.itemScore.dataValues.college+
            this.data.check_major*this.itemScore.dataValues.major);
        let calculevaluateScore = evaluateScore * (this.data.evaluate?Number(this.data.evaluate):0);
        let calculCompanyScore;
        getCompanyStar(star => {
            getHighJob(jobProportion => {
                calculCompanyScore = this.data.checked * companyScore * star * jobProportion;
                this.calculBasicScore = calculBasicScore + calculevaluateScore;
				this.calculCompanyScore = calculCompanyScore;
				cb();
            });
        });
	}

    //更新会员的分数表
    updateMemberScore(cb){
		const open_id = this.data.open_id;
		const maxTotal = this.maxTotal;
		MemberScore.findOne({
			where: {
				openid: open_id
			},
		}).then(result => {
			if (!result) {
				cb();
				return;
			}
			const certificate = Number(result.dataValues.certificate);
			const activity = Number(result.dataValues.activity);
			const cooper = Number(result.dataValues.cooper);
			let total = this.calculBasicScore + this.calculCompanyScore + certificate + cooper + activity;
			total = total > maxTotal ? maxTotal : total;
			MemberScore.update({
				basic: this.calculBasicScore,
				business: this.calculCompanyScore,
				total: total
			},{
				where: {
					openid: open_id
				}
			}).then(result => {
				common.middleMsg({
					openid: open_id,
					name: [this.data.name],
					phone: [this.data.phone],
					title: '等级分变动提醒',
					message: '您当前的等级分为' + total + '分',
					sender: 'system',
				}, () => {});
				cb();
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
    }
}

//发送消息到消息盒子
class SendToMsgBox {
	constructor(form_data){
		this.form_data = form_data;
	}

	checkSecret(cb){
		Affair.findOne({
			where: {
				uuid: this.form_data.affairId
			}
		}).then(result => {
			if(result&&result.dataValues&&result.dataValues.secret==1){
				cb(-1);
			}else{
				cb(200);
			}
		}).catch(e => LOG(e));
	}

	send(cb){
		this.checkSecret((code) => {
			if(code==200){
				MsgBox.create(this.form_data).then(result => {
					if(cb) cb(result);
				}).catch(e => LOG(e));
			}else{
				if(cb) cb(code);
			}
		});
	}
}

// 发送短信
class SMSOverride {
	constructor(opt){
		const Appkey = '610a50b5662b91fae6ef57fb8c733f88';
		const AppSecret='d671e45ce569';
		let CurTime = parseInt(Date.now()/1000)+""; //当前时间秒数
		let Nonce = sha1(CurTime);  //随机数
		let CheckSum = sha1(AppSecret + Nonce + CurTime);
		let that = this;
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
		    	templateid: '',
		    	mobiles: '',
		    	params: '',
		    }
		}
	}

	sendMsg(params, cb){
		if (CONFIG.debug) return;
		this.option.body.templateid = params.templateid;
		this.option.body.mobiles = params.mobiles;
		this.option.body.params = params.params;
		this.option.body = qs.stringify(this.option.body);
		request(this.option,function(error,response,body){
			body = typeof body === 'string' ? JSON.parse(body) : body;
			cb(body);
		});
	}
}

// 对称加解密
class AESCrypto {
	static aesEncrypt(data) {
		const cipher = crypto.createCipher('aes128', 'langjie@network');
		let aesStr = cipher.update(data, 'utf8', 'hex'); //编码方式从utf-8转为hex;
		aesStr += cipher.final('hex'); 					//编码方式从转为hex;
		return aesStr;
	}

	static aesDecrypt(encrypt) {
		const decipher = crypto.createDecipher('aes128', 'langjie@network');
		let dec = decipher.update(encrypt, 'hex', 'utf8');   //编码方式从hex转为utf-8;
		dec += decipher.final('utf8');  //编码方式从utf-8;
		return dec;
	}
}

module.exports = {
	UploadImgPro: UploadImgPro,
	MulUploadImg: MulUploadImg,
	FileUpload: FileUpload,
	Middleware: Middleware,
	SendEmail: SendEmail,
	SMS: SMS,
	AccessToken: AccessToken,
	MarkSort: MarkSort,
	SearchStaffId: SearchStaffId,
	SearchCustomerId: SearchCustomerId,
	StaffMap: StaffMap,
	CalculScore: CalculScore,
	SendToMsgBox: SendToMsgBox,
	SMSOverride: SMSOverride,
	LjToken,
	AESCrypto,
};