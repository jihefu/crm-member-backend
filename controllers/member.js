var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var nodemailer=require("nodemailer");
var request = require('request');
var formidable = require('formidable');
var mod_member = require('../model/mod_member.js');
var modMessage = require('../model/mod_message.js');

this.mainInfo = function(req,res,next){
	var open_id = req.session.open_id;
	mod_member.checkStaff(open_id,function(result){
		if(result[0]==null){
			mod_member.mainInfo(open_id,function(result){
				req.session.name = result[0].name;
				req.session.phone = result[0].phone;
				mod_member.checkLegalPerson(open_id,function(r){
					if(r[0]==null){
						var legal_person = false;
					}else{
						var legal_person = true;
					}
					mod_member.checkJob(open_id,function(ss){
						if(ss[0]==null){
							var hasPower = false;
						}else{
							var hasPower = true;
						}
						res.render('./pages/member_info',{
							result: result[0],
							legal_person: legal_person,
							hasPower: hasPower
						});
					});
				});
			});
		}else{
			res.redirect('/m/staff');
		}
	});
}
this.basicInfo = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	mod_member.basicInfo(name,phone,function(result){
		res.render('./pages/member_basicInfo',{
			result:result[0]
		});
	});
}
this.basicInfoEdit = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	mod_member.basicInfo(name,phone,function(result){
		res.render('./pages/member_basicInfo_edit',{
			result:result[0]
		});
	});
}
this.subBasicInfo = function(req,res,next){
	var name = req.body.name;
	var phone = req.body.phone;
	var str = req.body.str;
	var newName = req.body.newName;
	var newPhone = req.body.newPhone;
	mod_member.updateBasicInfo(name,phone,newName,newPhone,str,function(rows){
		req.session.name = newName;
		req.session.phone = newPhone;
		msgToAdmin(req,res,newName,newPhone);
	});
}
this.businessInfo = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	mod_member.basicInfo(name,phone,function(result){
		res.render('./pages/member_businessInfo',{
			result:result[0]
		});
	});
}
this.businessInfoEdit = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	mod_member.basicInfo(name,phone,function(result){
		var position_arr = ['法人','注册人','开发','采购','财务','其它'];
		position_arr.forEach(function(items,index){
			if(items==result[0].job){
				position_arr.splice(index,1);
			}
		});
		res.render('./pages/member_businessInfo_edit',{
			result:result[0],
			position:position_arr
		});
	});
}
this.subBnsInfo = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var str = req.body.str;
	mod_member.basicInfo(name,phone,function(result){
		var old_job = result[0].job;
		mod_member.updateBasicInfo(name,phone,'','',str,function(rows){
			mod_member.basicInfo(name,phone,function(result){
				var new_job = result[0].job;
				// if(old_job!=new_job&&((old_job=='法人'||old_job=='注册人')||(new_job=='法人'||new_job=='注册人'))){
				// 	var msg = '我们会尽快对您的信息进行审核,审核过程可能会造成'
				// }
				msgToAdmin(req,res,name,phone);
			});
		});
	});
}
this.upload = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var form = new formidable.IncomingForm();
	form.encoding = 'utf-8'; 
    form.uploadDir = DIRNAME+'/public/img/member'; //设置上传目录
    form.keepExtensions = true; //保留后缀
    form.type = true;
    form.parse(req, function(err, fields, files) {
    	if (err) {
            LOG(err);
            return;
        }
        var extName = ''; //后缀名
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
        }
        var _path = files.img.path.split('upload_')[0];
        var stamp = Date.parse(new Date());
        var path = _path+stamp+'.'+extName;
        fs.renameSync(files.img.path, path);
        var sql_path = path.split('member\\')[1];
		var str = 'portrait="'+sql_path+'",check_portrait=0';
		mod_member.updateBasicInfo(name,phone,'','',str,function(rows){
			msgToAdmin(req,res,name,phone);
		});
    });
}
this.regHistory = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone; 
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	mod_member.getCpy(name,phone,function(result){
		var cpy = result[0].company;
		mod_member.getEvent(name,cpy,page,function(result){
			if(page==1){
				res.render('./pages/member_reg_history',{
					result: result
				});
			}else{
				SEND(res,200,'',result);
			}
		});
	});
}
this.sign = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	mod_member.getSign(name,phone,function(result){
		var m_sign_arr = [];
		result.forEach(function(items,index){
			var d = items.time.getDate()-1;
			m_sign_arr.push(d);
		});
		res.render('./pages/member_sign',{
			m_sign_arr: m_sign_arr
		});
	});
}
this.checkIn = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	mod_member.checkSign(name,phone,function(result){
		try{
			var date = DATETIME(result[0].time);
		}catch(e){
			var date = DATETIME('2000-01-01');
		}
		var now_date = DATETIME();
		if(now_date==date){
			SEND(res,-1,'今日已签到',[]);
		}else{
			mod_member.addSign(name,phone,function(accu_score){
				mod_member.totalScore(name,phone,accu_score,function(rows){
					SEND(res,200,'签到成功',[]);
				});
			});
		}
	})
}
this.message = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	mod_member.message(name,phone,page,function(result){
		result.forEach(function(items,index){
			result[index].post_time = TIME(items.post_time);
		});
		if(page==1){
			res.render('./pages/member_message',{
				result: result
			});
		}else{
			SEND(res,200,'',result);
		}
	});
}
this.setStar = function(req,res,next){
	var id = req.body.id;
	var mark = req.body.mark;
	mod_member.setStar(id,mark,function(){
		SEND(res,200,'标记成功',[]);
	});
}
this.manage = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var open_id = req.session.open_id;
	mod_member.checkLegalPerson(open_id,function(result){
		if(result[0]==null){
			res.render('./pages/tip',{
				tip: '很抱歉，暂时没有贵公司的会员。'
			});
		}else{
			mod_member.getManageMember(open_id,function(result){
				if(result[0]==null){
					res.render('./pages/tip',{
						tip: '很抱歉，暂时没有贵公司的会员。'
					});
				}else{
					res.render('./pages/manage',{
						result: result
					});
				}
			});
		}	
	});
}
this.dynamic = function(req,res,next){
	var phone = req.path.split('/dynamic/')[1];
	var p_info = new Promise(function(resolve,reject){
		mod_member.getMemberJobInfo(phone,function(info){
			resolve(info);
		});
	});
	var p_msg = new Promise(function(resolve,reject){
		mod_member.getItemInfo(phone,function(result){
			var company = result[0].company;
			var name = result[0].name;
			mod_member.getDynamicMsg(name,company,1,function(msg){
				resolve(msg);
			});
		});
	});
	Promise.all([p_info,p_msg]).then(function(result){
		res.render('./pages/member_dynamic',{
			info: result[0],
			msg: result[1]
		});
	});
}
this.getDynamicMsg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var phone = params.phone;
	mod_member.getItemInfo(phone,function(result){
		var company = result[0].company;
		var name = result[0].name;
		mod_member.getDynamicMsg(name,company,page,function(result){
			SEND(res,200,'',result);
		});
	});
}
this.checkJob = function(req,res,next){
	var phone = req.body.phone;
	var check = parseInt(req.body.check);
	var obj = {
		"legal_person": "法人",
		"reg_person": "注册人",
		"developer": "开发",
		"purchaser": "采购",
		"finance": "财务",
		"other": "其它"
	};
	mod_member.getItemInfo(phone,function(result){
		var _job = result[0].job;
		var _company = result[0].company;
		var bus_score = result[0].business;
		var total_score = result[0].total;
		var job = 'other';
		for(let key in obj){
			if(obj[key]==_job){
				job = key;
			}
		}
		mod_member.getCusStar(_company,function(result){
			var star = result[0].star;
			if(star==0) star = 1;
			mod_member.getItemScore(function(result){
				var cpy_score = result[0].company;
				var job_score = cpy_score * result[0][job] * star / 10;
				if(check){
					bus_score = bus_score + job_score;
					total_score = total_score + job_score;
				}else{
					bus_score = bus_score - job_score;
					total_score = total_score - job_score;
				}
				var p_s = new Promise(function(resolve,reject){
					mod_member.updateScore(phone,bus_score,total_score,function(){
						resolve();
					});
				});
				var p_c = new Promise(function(resolve,reject){
					mod_member.updateCheckJob(phone,check,req.session.name,function(){
						resolve();
					});
				});
				Promise.all([p_s,p_c]).then(function(){
					SEND(res,200,'更新成功',[]);
				});
			});
		});
	});
}
this.report = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var open_id = req.session.open_id;
	var that = this;
	var _p = new Promise(function(resolve,reject){
		mod_member.checkLegalPerson(open_id,function(r){
			if(r[0]==null){
				mod_member.checkJob(open_id,function(ss){
					if(ss[0]==null){
						//fail
						reject();
					}else{
						//ok
						resolve();
					}
				});
			}else{
				//ok
				resolve();
			}
		});
	});
	_p.then(function(){
		mod_member.basicInfo(name,phone,function(result){
			var company = result[0].company;
			that.getCreditBasicData(company,function(o){
				res.render('./pages/contract_report',o);
			});
		});
	}).catch(function(){
		res.render('./pages/tip',{
			tip: '<p>很抱歉，该操作需要符合采购或者财务职位。</p><p>可在“我的会员”中修改职位信息</p>'
		});
	});
}
this.credit = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	var time = params.time;
	this.getCreditData(company,time,function(result){
		SEND(res,200,'',result);
	});
}
this.overList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	this.getOverList(company,function(result){
		res.render('./pages/over_list',{
			route: ROUTER(),
			result: result,
			title: '逾期合同'
		});
	});
}
this.recList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	this.getRecList(company,function(result){
		res.render('./pages/over_list',{
			route: ROUTER(),
			result: result,
			title: '信用期内待付款合同'
		});
	});
}
this.freezeList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	this.getFreezeList(company,function(result){
		res.render('./pages/over_list',{
			route: ROUTER(),
			result: result,
			title: '冻结合同'
		});
	});
}
this.contractsList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	var time = params.time;
	this.getContractsList(company,time,function(result){
		res.render('./pages/contracts_list',{
			route: ROUTER(),
			result: result,
			title: '生效合同'
		});
	});
}
this.paymentsList = function(req,res,next)	{
	var params = url.parse(req.url,true).query;
	var company = params.company;
	var time = params.time;
	this.getPaymentsList(company,time,function(result){
		result.forEach(function(items,index){
			for(var i in items){
				if(i=='arrival'){
					items[i] = DATETIME(items[i]);
				}
			}
		});
		res.render('./pages/payments_list',{
			route: ROUTER(),
			result: result
		});
	});
}
//获取基本信用(open)
this.getCreditBasicData = function(company,cb){
	mod_member.getCompanyInfo(company,function(customers){
		var _p = [],_p_ = [];
		var abb = customers[0].abb;
		var credit_line = 0,credit_period = 0,overPrice = 0,over_time,all_sum = 0;
		_p[0] = new Promise(function(resolve,reject){
			mod_member.getCreditInfo(company,function(credit_records){
				try{
					credit_line = credit_records[0].credit_line;
				}catch(e){
					credit_line = 0;
				}
				try{
					credit_period = credit_records[0].credit_period;
				}catch(e){
					credit_period = 0;
				}
				resolve();
			});
		});
		_p[1] = new Promise(function(resolve,reject){
			mod_member.getContractsInfo(0,abb,function(result){
				var _count = 0;
				result.forEach(function(items,index){
					var over = items.payable - items.paid;
					if(over>0&&_count==0){
						_count = 1;
						over_time = items.delivery_time;
					}
					overPrice += items.payable - items.paid;
				});
				resolve();
			});
		});
		Promise.all(_p).then(function(){
			overPrice = credit_line - overPrice;
			var inside_count = 0,outside_count = 0,freeze_count = 0;
			_p_[0] = new Promise(function(resolve,reject){
				var f_m = getTransMonth(credit_period);
				mod_member.getCountOver(abb,f_m,function(result){
					outside_count = result[0].count;
					resolve();
				});
			});
			_p_[1] = new Promise(function(resolve,reject){
				var f_m = getTransMonth(credit_period);
				mod_member.getCountRecent(abb,f_m,function(result){
					inside_count = result[0].count;
					resolve();
				});
			});
			_p_[2] = new Promise(function(resolve,reject){
				mod_member.getCountFreeze(abb,function(result){
					freeze_count = result[0].count;
					resolve();
				});
			});
			over_time = credit_period *30 - (Date.parse(new Date()) - Date.parse(new Date(over_time)))/(24*3600*1000);
			Promise.all(_p_).then(function(resolve,reject){
				cb({
					company: company,
					abb: abb,
					credit_line: credit_line,
					credit_period: credit_period * 30,
					over_price: overPrice,
					over_time: over_time?parseInt(over_time):credit_period * 30,
					outside_count: outside_count,
					inside_count: inside_count,
					freeze_count: freeze_count
				});
			});
		});
	});
}
//年度信息(open)
this.getCreditData = function(company,time,cb){
	var that = this;
	mod_member.getCompanyInfo(company,function(result){
		var abb = result[0].abb;
		var fromYear = new Date().getFullYear() - time;
		var toYear = new Date().getFullYear();
		var contract_num = 0,sum = 0,favo = 0,payment_num = 0;
		var _p = [];
		_p[0] = new Promise(function(resolve,reject){
			mod_member.getContractsCountByYear(abb,fromYear,toYear,function(result){
				contract_num = result[0].count;
				resolve();
			});
		});
		_p[1] = new Promise(function(resolve,reject){
			mod_member.getContractsInfoByYear(abb,fromYear,toYear,function(result){
				result.forEach(function(items,index){
					sum += items.total_amount;
					favo += items.total_amount - items.payable;
				});
				resolve();
			});
		});
		_p[2] = new Promise(function(resolve,reject){
			if(fromYear==2018){
				mod_member.getPaymentsCountByYear(company,fromYear,toYear,function(result){
					payment_num = result[0].count;
					resolve();
				});
			}else{
				that.getPaymentsList(company,0,function(result){
					var amount = 0;
					result.forEach(function(items,index){
						amount += items.amount;
					});
					mod_member.getAnnualPayment(company,function(result){
						if(result[0]==null){
							payment_num = amount;
						}else{
							if(time==1){
								amount += result[0].amount_17;
							}else if(time==2){
								amount += result[0].amount_17;
								amount += result[0].amount_16;
							}
							payment_num = amount;
							resolve();
						}
					});
				});
			}
		});
		Promise.all(_p).then(function(){
			cb({
				contract_num: contract_num,
				sum: sum,
				favo: favo,
				payment_num: payment_num
			});
		});
	});
}
//逾期合同
this.getOverList = function(company,cb){
	mod_member.getCompanyInfo(company,function(result){
		var abb = result[0].abb;
		mod_member.getCreditInfo(company,function(credit_records){
			try{
				var credit_period = credit_records[0].credit_period;
			}catch(e){
				var credit_period = 0;
			}
			var f_m = getTransMonth(credit_period);
			mod_member.getListOver(abb,f_m,function(result){
				cb(result);
			});
		});
	});
}
//信用期内合同
this.getRecList = function(company,cb){
	mod_member.getCompanyInfo(company,function(result){
		var abb = result[0].abb;
		mod_member.getCreditInfo(company,function(credit_records){
			try{
				var credit_period = credit_records[0].credit_period;
			}catch(e){
				var credit_period = 0;
			}
			var f_m = getTransMonth(credit_period);
			mod_member.getListRec(abb,f_m,function(result){
				cb(result);
			});
		});
	});
}
//冻结合同
this.getFreezeList = function(company,cb){
	mod_member.getCompanyInfo(company,function(result){
		var abb = result[0].abb;
		mod_member.getListFreeze(abb,function(result){
			cb(result);
		});
	});
}
//年度合同列表
this.getContractsList = function(company,time,cb){
	mod_member.getCompanyInfo(company,function(result){
		var abb = result[0].abb;
		var fromYear = new Date().getFullYear() - time;
		var toYear = new Date().getFullYear();
		mod_member.getContractsInfoByYear(abb,fromYear,toYear,function(result){
			cb(result);
		});
	});
}
//年度打款记录
this.getPaymentsList = function(company,time,cb){
	var fromYear = new Date().getFullYear() - time;
	var toYear = new Date().getFullYear();
	mod_member.getPaymentsInfoByYear(company,fromYear,toYear,function(result){
		cb(result);
	});
}

function getTransMonth(credit_period){
	var year = new Date().getFullYear();
	var month = new Date().getMonth()+1;
	var day = new Date().getDate();
	if(month-credit_period<0||month-credit_period==0){
		month = 12 + (month - credit_period);
		year--;
	}else{
		month = month - credit_period;
	}
	if(month<10){
		month = '0'+month;
	}
	if(day<10){
		day = '0'+day;
	}
	var y_m = year+'-'+month+'-'+day;
	return y_m;
}
function msgToAdmin(req,res,name,phone,msg){
	var params_arr = [];
	var params1 = {},params2 = {};
	params1.table = 'admin_message';
	params1.user = [{
		name: name,
		phone: phone
	}];
	params1.type = 'basic';
	params1.title = '会员信息修改';
	params1.message = '会员基本信息已修改，请及时处理。'
	params1.url = ROUTE('m/admin/member_review?name='+name+'$phone='+phone);
	params1.model = 'singleMsg';
	params_arr.push(params1);
	params2.table = 'vip_message';
	params2.user = [{
		name: name,
		phone: phone
	}];
	params2.type = '';
	params2.sender = 'system';
	params2.title = '信息已提交！';
	params2.message = msg?msg:'我们会尽快对您的信息进行审核';
	params2.url = '';
	params2.model = 'singleMsg';
	params_arr.push(params2);
	var str_params = JSON.stringify(params_arr);
	res.redirect(ROUTE('message/member_modify_notice?params='+str_params));
	sendMail(name,phone);
}
function sendMail(name,phone){
	var to_arr = '';
	CONFIG.langjie_receive_reg_msg.forEach(function(items,index){
		to_arr += items.email + ',';
	});
	to_arr = to_arr.slice(0,to_arr.length-1);
	var mailOptions={
        from:CONFIG.langjie_email, //发送者
        to:to_arr,  //接受者，可以同时发送多个，以','号隔开
        // to:'1115634709@qq.com',  //接受者，可以同时发送多个，以','号隔开
        subject:"会员信息修改",    //标题
        html:`<h3>修改人:${name}</h3>
               <h3>手机号:${phone}</h3>`
    };
    var transporter=nodemailer.createTransport({
	    service:'qiye.aliyun',
	    auth:{
	        user:'service@langjie.com',
	        pass:"qw@13871947641"  //QQ授权码
	    }
	});
    transporter.sendMail(mailOptions,function(err,info){
        if(err){
        	LOG(err);
        	return;
        }
    });
}