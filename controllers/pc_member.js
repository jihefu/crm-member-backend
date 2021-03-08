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
var modAdminMember = require('../model/mod_admin_member.js');
var mod_admin = require('../model/mod_admin.js');

this.renderPage = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	modAdminMember.reviewList(page,num,function(result){
		if(page==1){
			var bs_name = basicAuth(req).name;
			mod_admin.searchUpdataPerson(bs_name,function(id){
				var user_id = id[0].user_id;
				res.render('./pages/member_manage',{
					result: result,
					user_id: user_id
				});
			});
		}else{
			SEND(res,200,'ok',result);
		}	
	});
}
this.getPage = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	modAdminMember.reviewList(page,num,function(list){
		SEND(res,200,'',list);
	});
}
this.index_reviewList = function(req,res,next){
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	modAdminMember.reviewList(1,num,function(result){
		SEND(res,200,'ok',result);	
	});
}
this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var keyword = params.val;
	if(keyword==''){
		if(USERAGENT(req)=='pc'){
			var num = 30;
		}else{
			var num = 10;
		}
		modAdminMember.reviewList(1,num,function(result){
			SEND(res,200,'ok',result);	
		});
	}else{
		modAdminMember.search(keyword,function(rows){
			if(rows[0]==null){
				SEND(res,-1,'不存在该会员',[]);
			}else{
				SEND(res,200,'succeed',rows);
			}
		});
	}
}
this.sort = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var keyword = params.key;
	var page = params.page?params.page:1;
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	page = parseInt(page) + 1;
	modAdminMember.sort(keyword,page,num,function(rows){
		SEND(res,200,'',rows);
	});
}
this.info = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var name = params.name;
	var phone = params.phone;
	mod_member.basicInfo(name,phone,function(result){
		var item_arr=[],check_arr=[],name_arr=[];
		for(var i in result[0]){
			var obj = {};
			obj.key=i;
			obj.val=result[0][i];
			if(i=='name'||i=='phone'||i=='birth'||i=='qq'||i=='addr'||i=='college'||i=='major'||i=='company'||i=='job'){
				item_arr.push(obj);
				name_arr.push(transName(i));
			}else if(i=='check_name'||i=='check_phone'||i=='check_birth'||i=='check_qq'||i=='check_addr'||i=='check_college'||i=='check_major'||i=='check_company'||i=='check_job'){
				check_arr.push(obj);
			}
		}
		var evaluate = result[0].evaluate;
		modAdminMember.getMemberScore(name,phone,function(r){
			var score = r[0].total;
			SEND(res,200,'',[
				{
					result: result[0],
					item_arr: item_arr,
					check_arr: check_arr,
					name_arr: name_arr,
					evaluate: evaluate,
					score: score
				}
			]);
		});
	});
	function transName(i){
		switch(i){
			case 'name':
				return '姓名';
				break;
			case 'phone':
				return '电话';
				break;
			case 'birth':
				return '出生日期';
				break;
			case 'qq':
				return 'QQ';
				break;
			case 'addr':
				return '通讯地址';
				break;
			case 'college':
				return '毕业院校';
				break;
			case 'major':
				return '专业';
				break;
			case 'company':
				return '公司';
				break;
			case 'job':
				return '职位';
				break;
			default: 
				return '其他';
				break;
		}
	}
}
this.subCheck = function(req,res,next){
	var checked_arr = JSON.parse(req.body.arr);
	var notChecked_arr = JSON.parse(req.body.arr2);
	var name = req.body.name;
	var phone = req.body.phone;
	var _job = req.body.job;
	var coefficient = parseFloat(req.body.evaluate);
	var _company = req.body.company;
	// var admin_id = req.session.admin_id;
	var bs_name = basicAuth(req).name;
	//检测公司名
	var p = new Promise(function(resolve,reject){
		if(checked_arr.indexOf('company')!=-1){
			modAdminMember.checkCompanyRight(_company,function(result){
				if(result[0]==null){
					SEND(res,-100,'公司名称错误',[]);
					reject();
				}else{
					resolve();
				}
			});
		}else{
			resolve();
		}	
	});
	p.then(function(){
		for (var i = 0; i < checked_arr.length; i++) {
			if(checked_arr[i]==null){
				checked_arr.splice(i,1);
			}
		}
		for (var i = 0; i < notChecked_arr.length; i++) {
			if(notChecked_arr[i]==null){
				notChecked_arr.splice(i,1);
			}
		}
		mod_admin.searchUpdataPerson(bs_name,function(result){
			var admin_id = result[0].user_id;
			var _str = '';
			checked_arr.forEach(function(items,index){
				if(items!=null) _str += 'check_'+items+'=1,';
			});
			notChecked_arr.forEach(function(items,index){
				if(items!=null) _str += 'check_'+items+'=0,';
			});
			str = _str + 'evaluate = '+coefficient+',check_time="'+TIME()+'",check_person="'+admin_id+'"';
			modAdminMember.updateCheckItem(name,phone,str,admin_id,function(result){
				modAdminMember.getScore(function(result){
					var basic_score = result[0].basic;
					var evaluate = result[0].evaluate;
					var business_score = result[0].company;
					var c = basic_score-evaluate;
					var score1=0,score2=0,company=0,job=0,other=0;
					checked_arr.forEach(function(items,index){
						if(items!='company'&&items!='job'){
							score1 += result[0][items]*c;
						}else if(items=='company'){
							company = result[0][items];
						}
					});
					score1 += coefficient*evaluate;
					other = result[0].other;
					job = result[0][transJob(_job)];
					modAdminMember.getStar(_company,function(result){
						if(result[0]==null){
							if(checked_arr.indexOf('company')!=-1){
								SEND(res,-100,'公司名称错误',[]);
								modAdminMember.checkToZero(name,phone);
								return;
							}else{
								score2 = 0;
							}
						}else{
							if(checked_arr.indexOf('company')!=-1){
								var s = result[0].star!=0?result[0].star:1;
								if(checked_arr.indexOf('job')!=-1){
									score2 = company*(s/10)*job;
								}else{
									score2 = company*(s/10)*other;
								}
							}else{
								score2 = 0;
							}
						}
						modAdminMember.UpdateScore(score1,score2,name,phone,function(result){
							msgToConsumer(req,res,name,phone,admin_id);
						});
					});
				});
			});
		});
		function transJob(items){
			switch(items){
				case '法人':
					return 'legal_person';
					break;
				case '注册人':
					return 'reg_person';
					break;
				case '开发':
					return 'developer';
					break;
				case '采购':
					return 'purchaser';
					break;
				case '财务':
					return 'finance';
					break;
				case '其它':
					return 'other';
					break;
			}
		}
	}).catch(function(e){});
}
/**
 *  新系统暂时
 */
this.subCheck2 = function(req,res,next){
	var checked_arr = JSON.parse(req.body.arr);
	var notChecked_arr = JSON.parse(req.body.arr2);
	var name = req.body.name;
	var phone = req.body.phone;
	var _job = req.body.job;
	var coefficient = parseFloat(req.body.evaluate);
	var _company = req.body.company;
	var admin_id = req.session.admin_id;
	// var bs_name = basicAuth(req).name;
	//检测公司名
	var p = new Promise(function(resolve,reject){
		if(checked_arr.indexOf('company')!=-1){
			modAdminMember.checkCompanyRight(_company,function(result){
				if(result[0]==null){
					SEND(res,-100,'公司名称错误',[]);
					reject();
				}else{
					resolve();
				}
			});
		}else{
			resolve();
		}	
	});
	p.then(function(){
		for (var i = 0; i < checked_arr.length; i++) {
			if(checked_arr[i]==null){
				checked_arr.splice(i,1);
			}
		}
		for (var i = 0; i < notChecked_arr.length; i++) {
			if(notChecked_arr[i]==null){
				notChecked_arr.splice(i,1);
			}
		}
		// mod_admin.searchUpdataPerson(bs_name,function(result){
			// var admin_id = result[0].user_id;
			var _str = '';
			checked_arr.forEach(function(items,index){
				if(items!=null) _str += 'check_'+items+'=1,';
			});
			notChecked_arr.forEach(function(items,index){
				if(items!=null) _str += 'check_'+items+'=0,';
			});
			str = _str + 'evaluate = '+coefficient+',check_time="'+TIME()+'",check_person="'+admin_id+'"';
			modAdminMember.updateCheckItem(name,phone,str,admin_id,function(result){
				modAdminMember.getScore(function(result){
					var basic_score = result[0].basic;
					var evaluate = result[0].evaluate;
					var business_score = result[0].company;
					var c = basic_score-evaluate;
					var score1=0,score2=0,company=0,job=0,other=0;
					checked_arr.forEach(function(items,index){
						if(items!='company'&&items!='job'){
							score1 += result[0][items]*c;
						}else if(items=='company'){
							company = result[0][items];
						}
					});
					score1 += coefficient*evaluate;
					other = result[0].other;
					job = result[0][transJob(_job)];
					modAdminMember.getStar(_company,function(result){
						if(result[0]==null){
							if(checked_arr.indexOf('company')!=-1){
								SEND(res,-100,'公司名称错误',[]);
								modAdminMember.checkToZero(name,phone);
								return;
							}else{
								score2 = 0;
							}
						}else{
							if(checked_arr.indexOf('company')!=-1){
								var s = result[0].star!=0?result[0].star:1;
								if(checked_arr.indexOf('job')!=-1){
									score2 = company*(s/10)*job;
								}else{
									score2 = company*(s/10)*other;
								}
							}else{
								score2 = 0;
							}
						}
						modAdminMember.UpdateScore(score1,score2,name,phone,function(result){
							msgToConsumer(req,res,name,phone,admin_id);
						});
					});
				});
			});
		// });
		function transJob(items){
			switch(items){
				case '法人':
					return 'legal_person';
					break;
				case '注册人':
					return 'reg_person';
					break;
				case '开发':
					return 'developer';
					break;
				case '采购':
					return 'purchaser';
					break;
				case '财务':
					return 'finance';
					break;
				case '其它':
					return 'other';
					break;
			}
		}
	}).catch(function(e){});
}
function msgToConsumer(req,res,name,phone,sender){
	var m_message = '工作人员已对您的基本信息进行了确认';
	var m_title = '信息已审核！';
	var m_url = '';
	var p_arr = [];
	var params = {};
	params.user = [
		{
			name: name,
			phone: phone
		}
	];
	params.title = m_title;
	params.message = m_message;
	params.url = m_url;
	params.sender = sender;
	params.model = 'singleMsg';
	params.table = 'vip_message';
	p_arr.push(params);
	var str_params = JSON.stringify(p_arr);
	res.redirect(ROUTE('message/msg_to_consumer?params='+str_params));
}