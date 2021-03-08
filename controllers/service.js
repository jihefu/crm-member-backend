var express = require('express');
var url = require('url');
var nodemailer=require("nodemailer")
var ucode = require('../lib/ucode.node');
var request = require('request');
var base = require('./base');
var message = require('./message');
var mod_service = require('../model/mod_service.js');

this.developer = function(req,res){
	res.cookie('developer',1); 
	res.render('./pages/developer');
}
this.ifDeveloper = function(req,res,next){
	if(req.cookies.developer){
		next();
	}else{
		res.render('./pages/maintain');
	}
}

this.info = function(req,res){
	var params = url.parse(req.url,true).query;
	var sn = params.sn;
	mod_service.getInfo(sn,function(result){
		res.send(result);
	});
}
this.renderPagePro1 = function(req,res){
	var path = req.path;
	var sn = path.split('vir8_producer/')[1];
	mod_service.getInfo(sn,function(info){
		if(info.data[0]==null){
			res.render('./pages/tip',{
				tip:'不存在该产品'
			});
		}else{
			if(!req.session.open_id){
				res.render('./pages/vir8_info_end_user',{
					result:info.data[0]
				});
			}else{
				res.render('./pages/vir8_info_producer',{
					result:info.data[0]
				});
			}
		}
	});
}
this.renderPagePro2 = function(req,res){
	var path = req.path;
	var sn = path.split('vir8_customer/')[1];
	mod_service.getInfo(sn,function(info){
		var open_id = req.session.open_id;
		if(info.data[0]==null){
			res.render('./pages/tip',{
				tip:'不存在该产品'
			});
		}else{
			mod_service.identity(open_id,function(result){
				if(result.code==1){
					var indexType = result.obj;
					indexType.getUserId(function(id){
						indexType.checkDealerCard(id,sn,function(w){
							if(w.msg=='dealer'){
								res.render('./pages/vir8_info_customer',{
									result:info.data[0]
								});
							}else{
								res.render('./pages/vir8_info_member',{
									result:info.data[0]
								});
							}
						});
					});
				}else if(result.code==0){
					res.render('./pages/vir8_info_end_user',{
						result:info.data[0]
					});
				}else{
					res.render('./pages/vir8_info_member',{
						result:info.data[0]
					});
				}
			});
		}
	});
}
this.renderPagePro3 = function(req,res){
	var path = req.path;
	var sn = path.split('vir8_end_user/')[1];
	mod_service.getInfo(sn,function(info){
		if(info.data[0]==null){
			res.render('./pages/tip',{
				tip:'不存在该产品'
			});
		}else{
			res.render('./pages/vir8_info_end_user',{
				result:info.data[0]
			});
		}
	});
}
this.renderPagePro4 = function(req,res){
	var path = req.path;
	var sn = path.split('vir8_member/')[1];
	mod_service.getInfo(sn,function(info){
		if(info.data[0]==null){
			res.render('./pages/tip',{
				tip:'不存在该产品'
			});
		}else{
			res.render('./pages/vir8_info_member',{
				result:info.data[0]
			});
		}
	});
}
this.updateInfo = function(req,res){
	var str = req.body.str;
	var sn = req.body.sn;
	var time = TIME();
	var open_id = req.session.open_id;
	mod_service.updateInfo(sn,str,time,open_id,function(result){
		res.send(result);
	});
}
this.dealerUpdateInfo = function(req,res,next){
	var str = req.body.str;
	var sn = req.body.sn;
	mod_service.dealerUpdateInfo(sn,str,function(result){
		SEND(res,200,'提交成功',[]);
	});
}
this.cardDel = function(req,res){
	var sn = req.body.sn;
	var time = TIME();
	var open_id = req.session.open_id;
	mod_service.cardDel(sn,time,open_id,function(result){
		SEND(res,200,'删除成功',[]);
	});
}
this.check_reg = function(req,res){
	var open_id = req.session.open_id;
	var params = url.parse(req.url,true).query;
	var sn = params.sn;
	mod_service.checkCredit(open_id,function(result){
		if(result[0].level=='F'){
			SEND(res,-1004,'无权限注册',[]);
		}else{
			if(result[0].credit_qualified==1){
				SEND(res,200,'',[]);
			}else{
				SEND(res,-1003,'信用不足',[]);
			}
		}
	});
}
this.fromVTCReg = function(req,res,next){
	CHECKSESSION(req,res,'open_id',function(result){
		if(result==200||result==100){
			if(req.session.vtcRegSession){
				var param = req.session.vtcRegSession;
				req.session.vtcRegSession = null;
			}else{
				var params = url.parse(req.url,true).query;
				var param = JSON.parse(params.param);
			}
			var sn = param.SN;
			var mid = param.MID;
			var appName = param.APPNAME;

			var open_id = req.session.open_id;
			mod_service.identity(open_id,function(result){
				switch(result.code){
					case 0:
						res.sendFile(DIRNAME+'/public/html/openid.html');
						break;
					case 100:
						res.render('./pages/vac_reg',{	
							sn: sn,
							mid: mid,
							appName: appName
						});
						break;
					case 400:
						//添加最终用户
						mod_service.getMemberInfo(open_id,function(result){
							result[0].sn = sn;
							result[0].mid = mid;
							endUserSendMail(result[0],res);
						});
						break;
					case -1:
						res.render('./pages/tip',{		
							tip: '公司名称正在审核中'
						});
						break;
					case -2:
						res.render('./pages/tip',{		
							tip: '职位正在审核中'
						});
						break;
					case -3:
						res.render('./pages/tip',{		
							tip: '您的职位没有注册权限'
						});
						break;
					case -7:
						res.render('./pages/tip',{
							tip: '暂无注册权限，请及时联系朗杰客服。'		
						});
						break;
					case 1:
						var indexType = result.obj;
						indexType.getUserId(function(id){
							indexType.checkDealerCard(id,sn,function(w){
								if(w.code==1){
									res.render('./pages/vac_reg',{	
										sn:sn,
										mid:mid,
										appName:appName
									});
								}else if(w.code==-4){
									res.render('./pages/tip',{
										tip: '数据空缺，请及时联系朗杰客服。'	
									});
								}else if(w.code==-5){
									res.render('./pages/tip',{
										tip: '数据空缺，请及时联系朗杰客服。'	
									});
								}else if(w.code==-6){
									res.render('./pages/tip',{
										tip: '数据匹配错误，请及时联系朗杰客服。'	
									});
								}
							});
						});
						break;
					case -9: 
						res.render('./pages/tip',{
							tip: '暂无申请注册权限。'
						});
						break;
					case -10: 
						res.render('./pages/tip',{
							tip: '您的职位没有申请注册权限'
						});
						break;
					case -11:
						res.render('./pages/tip',{
							tip: '暂无权限申请注册'
						});
						break;
					case -12:
						res.render('./pages/tip',{
							tip: '暂无权限申请注册'
						});
						break;
					case 2: 
						var indexType = result.obj;
						indexType.getUserId(function(id){
							indexType.checkEndUserCard(id,sn,function(w){
								if(w.code==2){
									//最终用户申请注册
									//分有中间商和无中间商
									if(req.session.timer==sn){
										res.render('./pages/tip',{
											tip: '<p>注册申请已通知供应商</p><p>请勿重复操作</p>'
										});
										return;
									}
									mod_service.checkDealer(open_id,sn,function(all_arr,part_arr,rows){
										req.session.timer = sn;
										if(all_arr=='no_dealer'){
											//添加用户
											mod_service.getMemberInfo(open_id,function(result){
												result[0].sn = sn;
												result[0].mid = mid;
												sendMail(result[0],res);
											});
										}else{
											if(all_arr[0]==null||part_arr[0]==null){
												mod_service.getMemberInfo(open_id,function(result){
													result[0].sn = sn;
													result[0].mid = mid;
													sendMail(result[0],res);
												});
												return;
											}
											//告诉中间商
											var user = [];
											all_arr.forEach(function(items,index){
												var name = items.name;
												part_arr.forEach(function(it,ind){
													if(name==it) user.push(items);
												});
											});
											if(user[0]==null){
												mod_service.getMemberInfo(open_id,function(result){
													result[0].sn = sn;
													result[0].mid = mid;
													sendMail(result[0],res);
												});
												return;
											}
											var company = rows[0].company?rows[0].company:'公司未知';
											var message = rows[0].name+'('+company+')申请注册威程卡，序列号：'+rows[0].sn+'，机器号：'+mid+'，手机号码：'+rows[0].phone;
											var params_arr = [
												{
													table: 'vip_message',
													user: user,
													model: 'regLinkMsg',
													title: '注册提醒',
													url: ROUTE('service/product/vac_reg?sn='+sn+'$mid='+mid+'$phone='+rows[0].phone+'$name='+rows[0].name),
													message: message,
													sender: 'system'
												}
											];
											var baseSend = new base.SendStationNews(params_arr);
											baseSend.sendMsg(res,ROUTE('message/msg_to_dealer'));
										}
									});
								}else if(w.code==-24){
									res.render('./pages/tip',{
										tip: '暂时无法申请注册。'
									});
								}else if(w.code==-25){
									res.render('./pages/tip',{
										tip: '暂时无法申请注册。'	
									});
								}else if(w.code==-26){
									res.render('./pages/tip',{
										tip: '暂时无法申请注册。'	
									});
								}
							});
						});
						break;
				}
			});
		}else if(result==-1){
			var pathname = url.parse(req.url,true).pathname;
			var params = url.parse(req.url,true).query;
			var param = JSON.parse(params.param);
			req.session.vtcRegSession = param;
			var state = ROUTER()+pathname;
			res.redirect(getOpenId(state));
		}
	});
}
this.vac_reg_page = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var sn = params.sn;
	var mid = params.mid;
	var appName = params.appName;
	res.render('./pages/vac_reg',{
		sn:sn,
		mid:mid
	});
}
this.vac_reg = function(req,res){
	var params = url.parse(req.url,true).query;
	var sn = params.sn;
	var mid = params.mid;
	var appName = params.appName;
	CHECKSESSION(req,res,'open_id',function(result){
		if(result==200||result==100){
			var open_id = req.session.open_id;
			mod_service.identity(open_id,function(result){
				if(result.code==100){
					res.render('./pages/vac_reg',{
						sn:sn,
						mid:mid,
						appName: appName
					});
				}else if(result.code==0){
					res.sendFile(DIRNAME+'/public/html/openid.html');
				}else if(result.code==1){
					mod_service.checkCredit(open_id,function(result){
						if(result[0].level=='F'){
							res.render('./pages/vac_reg',{
								tip:'无权限注册',
							});
						}else{
							if(result[0].credit_qualified==1){
								res.render('./pages/vac_reg',{
									sn:sn,
									mid:mid,
									appName: appName
								});
							}else{
								res.render('./pages/vac_reg',{
									tip:'信用不足',
								});
							}
						}
					});
				}else{
					res.render('./pages/tip',{				
						tip: '暂无权限'
					});
				}
			});
		}else if(result==-1){
			var pathname = url.parse(req.url,true).pathname;
			var params = '?sn='+sn+'$mid='+mid;
			var state = ROUTER()+pathname+params;
			res.redirect(getOpenId(state));
		}
	});
}
function sendMail(result,res){
	var mailOptions = {
        from:'service@langjie.com', //发送者
        to:'845676641@qq.com,1115634709@qq.com',  //接受者，可以同时发送多个，以','号隔开
        subject:"威程卡申请注册",    //标题
        html:`<h3>申请人:${result.name}</h3>
               <h3>手机号:${result.phone}</h3>
               <h3>公司:${result.company}</h3>
               <h3>申请卡序列号:${result.sn}</h3>
               <h3>申请卡机器号:${result.mid}</h3>`
    };
    var baseSend = new base.SendEmail(mailOptions);
    baseSend.sendMsg(function(){
    	res.render('./pages/tip',{
			tip: '注册申请已通知供应商'
		});
    });
}
function endUserSendMail(result,res){
	var mailOptions = {
        from:'service@langjie.com', //发送者
        to:'845676641@qq.com,1115634709@qq.com',  //接受者，可以同时发送多个，以','号隔开
        subject:"最终用户申请注册",    //标题
        html:`<h3>申请人:${result.name}</h3>
               <h3>手机号:${result.phone}</h3>
               <h3>公司:${result.company}</h3>
               <h3>职位:${result.job}</h3>
               <h3>申请卡序列号:${result.sn}</h3>
               <h3>申请卡机器号:${result.mid}</h3>`
    };
    var baseSend = new base.SendEmail(mailOptions);
    baseSend.sendMsg(function(){
    	res.render('./pages/tip',{
			tip: '注册申请已通知供应商'
		});
    });
}
function RelayStringHash(num,str){
	let hash = num;
	let len = str.length;
	for(let i = 0; i < len; i++) {
		hash ^= (hash<<5) + str.charCodeAt(i) + (hash>>>2);
	}
	return(hash);
}
function AppName2Code(appName){
	appName = appName.toLowerCase();
	let hash = RelayStringHash(0, appName);
	
	let posiHash = hash & 0x7FFFFFFF;
	return (posiHash % 5000) + 5000;
}
this.reg = function(req,res){
	var params = url.parse(req.url,true).query;
	var sn = parseInt(params.sn);
	var time = params.time;
	var phone = params.phone;
	var name = params.name;
	if(time==0){
		var yymm = 0;
	}else{
		var yyyy = time.split('-')[0];
		var mm = time.split('-')[1];
		var yy = yyyy.slice(2,4);
		var yymm = parseInt(yy+mm);
	}
	//控制器OR软件注册
	if(params.mid){
		var mid = parseInt(params.mid);
		var regCode = ucode.getVacRegCode(mid, yymm);
	}else{
		var appName = params.appName.toLowerCase();
		var appNameCode = AppName2Code(appName);
		var appRegCode = ucode.getAppRegCode(sn, appNameCode, yymm);
	}
	var open_id = req.session.open_id;
	mod_service.identity(open_id,function(result){
		if(result.code==1){
			var indexType = result.obj;
			indexType.getUserId(function(id){
				indexType.checkDealerCard(id,sn,function(w){
					if(w.code==1){
						cardReg(req,res,id);
					}else{
						SEND(res,-1,'无权注册',[]);
						return;
					}
				});
			});
		}else if(result.code==100){
			mod_service.getEmpId(open_id,function(user_id){
				cardReg(req,res,user_id);
			});
		}else{
			SEND(res,-1,'无权注册',[]);
		}
	});
	function cardReg(req,res,user_id){
		if(user_id instanceof Array){
			user_id = parseInt(user_id[0]);
		}else{
			user_id = parseInt(user_id);
		}
		sn = parseInt(sn);
		regCode = parseInt(regCode);
		var operKey = ucode.myOperKey(user_id,sn);		//操作码
		if(operKey==0){
			SEND(res,-1,'无权注册，请联系朗杰客服。',[]);
			return;
		}
		var data = {};
		var regDate = TIME();
		var _data = {
			'sn':sn,
			'validDate':time,
			'regDate':regDate,
			'open_id':open_id
		};
		if(params.mid){
			var authOperKey = ucode.getAuthOperKey(sn,regCode,operKey);
			data.regCode = regCode;
			_data.regCode = regCode;
			data.authOperKey = authOperKey;
			_data.authOperKey = authOperKey;
			_data.mid = mid;
			mod_service.updateRegNo(sn,regCode,authOperKey,time);
			mod_service.putRegEvent(_data,function(){
				var middleWare = new base.Middleware();
				middleWare.use(function(){
					SEND(res,200,'succeed',data);
					this.next();
				});
				middleWare.use(function(){
					mod_service.getLegalInfo(_data.company,function(result){
						if(result[0]!=null){
							var _operator = _data.name?_data.name:_data.user_name;
							var _str = _data.validDate==0?'已永久注册':'有效期至'+_data.validDate;
							message.middleMsg({
								name: result[0].name,
								phone: result[0].phone,
								sender: 'system',
								title: '注册提醒',
								message: _operator+'，注册产品'+_data.model+'，'+_str+'。注册码：'+_data.regCode+'，授权操作码：'+_data.authOperKey+'。（序列号：'+_data.sn+'，机器号：'+_data.mid+'。）',
								model: 'linkMsg',
								url: ROUTE('service/product/vac_reg?sn='+_data.sn+'&mid='+_data.mid)
							},function(){});
						}
					});
				});
				middleWare.handleRequest();
			});
		}else{
			var authOperKey = ucode.getAuthOperKey(sn,appRegCode,operKey);
			data.appRegCode = appRegCode;
			_data.appRegCode = appRegCode;
			_data.appName = params.appName;
			data.authOperKey = authOperKey;
			_data.authOperKey = authOperKey;
			mod_service.updateAppRegNo(sn,appRegCode,authOperKey,time,params.appName);
			mod_service.putAppRegEvent(_data,function(){
				var middleWare = new base.Middleware();
				middleWare.use(function(){
					SEND(res,200,'succeed',data);
					this.next();
				});
				middleWare.use(function(){
					mod_service.searchAppName(params.appName,function(result){
						if(result[0]==null){
							//appName add
							mod_service.InsertAppName(params.appName,function(){});
						}else{
							//score ++
							var score = parseInt(result[0].score);
							score++;
							mod_service.UpdateAppNameScore(params.appName,score,function(){});
						}
					});
					this.next();
				});
				middleWare.use(function(){
					mod_service.getLegalInfo(_data.company,function(result){
						if(result[0]!=null){
							var _operator = _data.name?_data.name:_data.user_name;
							var _str = _data.validDate==0?'已永久注册':'有效期至'+_data.validDate;
							message.middleMsg({
								name: result[0].name,
								phone: result[0].phone,
								sender: 'system',
								title: '注册提醒',
								message: _operator+'，注册产品'+_data.appName+'，'+_str+'。注册码：'+_data.appRegCode+'，授权操作码：'+_data.authOperKey+'。（序列号：'+_data.sn+'。）',
								model: 'linkMsg',
								url: ROUTE('service/product/vac_reg?sn='+_data.sn+'&mid=')
							},function(){});
						}
					});
				});
				middleWare.handleRequest();
			});
		}
	}
}
this.regEvent = function(req,res){
	var params = url.parse(req.url,true).query;
	var open_id = req.session.open_id;
	var sn = params.sn;
	mod_service.identity(open_id,function(result){
		var p;
		if(result.code==100){
			p = 1;
			getRegEvent(sn,p);
		}else{
			var indexType = result.obj;
			indexType.getUserId(function(id){
				p = id;
				getRegEvent(sn,p);
			});
		}
	});
	function getRegEvent(sn,p){
		mod_service.getRegEvent(sn,p,function(result){
			res.send(result);
		});
	}
}
this.list = function(req,res,t){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var type = req.session.type?req.session.type:t;
	if(type=='dealer_member'||type=='endUser_member'||type=='no_member'){
		mod_service.visitorList(page,function(result){
			if(page==1){
				var arr = [];
				for (var i = 0; i < 3; i++) {
					var index = Math.floor(Math.random()*100);
					arr.push(result[index]);
				};
				res.render('./pages/index_end',{
					result:arr
				});
			}else{
				SEND(res,200,'succeed',result);
			}
		});
	}else if(type=='employee'){
		mod_service.proList(page,function(result){
			if(page==1){
				res.render('./pages/index_pro',{
					result:result
				});
			}else{
				SEND(res,200,'succeed',result);
			}
		});
	}else if(type=='endUser'){
		var open_id = req.session.open_id;
		mod_service.endUserList(open_id,page,function(result){
			if(page==1){
				res.render('./pages/index',{
					result:result
				});
			}else{
				SEND(res,200,'succeed',result);
			}
		});
	}else{
		mod_service.custList(type,page,function(result){
			if(page==1){
				res.render('./pages/index',{
					result:result
				});
			}else{
				SEND(res,200,'succeed',result);
			}
		});
	}
}
this.search = function(req,res){
	var params = url.parse(req.url,true).query;
	var sn = params.sn;
	var type = req.session.type;
	if(sn==''){
		if(type=='employee'){
			mod_service.proList(1,function(result){
				SEND(res,200,'ok',result);
			});
		}else if(type=='dealer_member'||type=='endUser_member'||type=='no_member'){
			mod_service.visitorList(1,function(result){
				var arr = [];
				for (var i = 0; i < 3; i++) {
					var index = Math.floor(Math.random()*100);
					arr.push(result[index]);
				};
				SEND(res,200,'ok',arr);
			});
		}else if(type=='endUser'){
			var open_id = req.session.open_id;
			mod_service.endUserList(open_id,1,function(result){
				SEND(res,200,'succeed',result);
			});
		}else{
			mod_service.custList(type,1,function(result){
				SEND(res,200,'ok',result);
			});
		}
	}else{
		if(type=='dealer_member'||type=='endUser_member'||type=='no_member'){
			mod_service.seaEndUser(sn,function(result){
				var arr1 = [];
				result.forEach(function(items,index){
					if(items.serialNo==sn){
						arr1.push(items);
					}else if(items.machineNo==sn){
						arr1.push(items);
					}
				});
				SEND(res,200,'succeed',arr1);
			});
		}else if(type=='employee'){
			mod_service.search(sn,function(result){
				var arr1 = [],arr2 = [],_arr = [];
				result.forEach(function(items,index){
					if(items.serialNo==sn){
						arr1.push(items);
					}else if(items.machineNo==sn){
						arr1.push(items);
					}else{
						arr2.push(items);
					}
				});
				var arr = _arr.concat(arr1,arr2);
				var arrEnd = arr.slice(0,10);
				SEND(res,200,'succeed',arrEnd);
			});
		}else if(type=='endUser'){
			var open_id = req.session.open_id;
			mod_service.searchEnd(sn,open_id,function(result){
				var arr1 = [],arr2 = [],_arr = [];
				result.forEach(function(items,index){
					if(items.serialNo==sn){
						arr1.push(items);
					}else if(items.machineNo==sn){
						arr1.push(items);
					}else{
						arr2.push(items);
					}
				});
				var arr = _arr.concat(arr1,arr2);
				var arrEnd = arr.slice(0,10);
				SEND(res,200,'succeed',arrEnd);
			});
		}else{
			mod_service.searchCust(sn,type,function(result){
				var arr1 = [],arr2 = [],_arr = [];
				result.forEach(function(items,index){
					if(items.serialNo==sn){
						arr1.push(items);
					}else if(items.machineNo==sn){
						arr1.push(items);
					}else{
						arr2.push(items);
					}
				});
				var arr = _arr.concat(arr1,arr2);
				var arrEnd = arr.slice(0,10);
				SEND(res,200,'succeed',arrEnd);
			});
		}
	}
}
this.getProducts = function(req,res){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var sn = params.sn;
	var type = req.session.type;
	var open_id = req.session.open_id;
	mod_service.searchScr(open_id,type,page,sn,function(result){
		SEND(res,200,'',result);
	});
}
this.searchInput = function(req,res){
	var params = url.parse(req.url,true).query;
	var key = params.key;
	var val = params.val;
	if(key=='dealer'){
		mod_service.searchDealer(key,val,function(result){
			try{
				var arr = [];
				for (var i = 0; i < result.length; i++) {
					if(result.length!=0&&result[i].cn_abb){
						arr.push(result[i]);
					}else{
						arr.push(result[i].name);
					}
				};
				SEND(res,200,key,arr);
			}catch(e){
				SEND(res,200,key,[]);
			}
		});
	}else if(key=='endUser'){
		mod_service.searchEndUser(key,val,function(result){
			try{
				var arr = [];
				for (var i = 0; i < result.length; i++) {
					if(result.length!=0&&result[i].cn_abb){
						arr.push(result[i]);
					}else{
						arr.push(result[i].name);
					}
				};
				SEND(res,200,key,arr);
			}catch(e){
				SEND(res,200,key,[]);
			}
		});
	}else if(key=='salesman'||key=='manager'){
		mod_service.searchSalesman(key,val,function(result){
			try{
				var arr = [];
				for (var i = 0; i < result.length; i++) {
					arr.push(result[i]);
				};
				if(val=='jn'||val=='jnz'||val=='济南组'){
					arr[0] = {'user_name':'济南组','user_id':'济南组'};
				}else if(val=='hz'||val=='hzz'||val=='杭州组'){
					arr[0] = {'user_name':'杭州组','user_id':'杭州组'};
				}
				SEND(res,200,'salesman',arr);
			}catch(e){
				var arr = [];
				if(val=='jn'||val=='jnz'||val=='济南组'){
					arr[0] = {'user_name':'济南组','user_id':'济南组'};
				}else if(val=='hz'||val=='hzz'||val=='杭州组'){
					arr[0] = {'user_name':'杭州组','user_id':'杭州组'};
				}
				SEND(res,200,'salesman',arr);
			}
		});
	}else if(key=='maker'){
		mod_service.searchMaker(key,val,function(result){
			try{
				var arr = [];
				for (var i = 0; i < result.length; i++) {
					arr.push(result[i]);
				};
				SEND(res,200,'maker',arr);
			}catch(e){
				SEND(res,200,'maker',[]);
			}
		});
	}else if(key=='tester'){
		mod_service.searchTester(key,val,function(result){
			try{
				var arr = [];
				for (var i = 0; i < result.length; i++) {
					arr.push(result[i]);
				};
				SEND(res,200,'tester',arr);
			}catch(e){
				SEND(res,200,'tester',[]);
			}
		});
	}
}
this.dealerTrans = function(req,res){
	var params = url.parse(req.url,true).query;
	var val = params.val;
	var arr = val.split('|');
	mod_service.dealerTrans(arr,function(result){
		res.send(result);
	});
}
this.add = function(req,res){
	var sn = req.body.sn;
	mod_service.add(sn,function(result){
		res.send(result);
	});
}
this.addSn = function(req,res){
	var params = url.parse(req.url,true).query;
	var sn = parseInt(params.sn);
	mod_service.addSn(sn,function(result){
		if(result[1].status=='-1'){
			for(var i in result[0]){
				result[0][i] = '';
			}
		}
		res.render('./pages/add_sn',{
			result: result[0]
		});
	});
}
this.insertInfo = function(req,res){
	var open_id = req.session.open_id;
	var sn = req.body.sn;
	var str = req.body.str;
	var arr = str.split(',');
	var str1 = '',str2 = '';
	arr.forEach(function(items,index){
		var key = items.split('=')[0];
		var val = items.split('=')[1];
		str1 += key+',';
		if(key=='fwVer'||key=='oemUser'||key=='latestRegNo'||key=='VBGN'||key=='VEND'||key=='ad2Mode'||key=='pulseMode'||key=='vibFreq'||key=='vibAmp'||key=='SPWM_AC_AMP'||key=='SSI_MODE'||key=='HOURS'||key=='EMP_NO'){
			if(val=="\"\""){
				str2 += 0+',';
			}else{
				str2 += items.split('=')[1].replace(/\"/g,'')+',';
			}
		}else{
			str2 += items.split('=')[1]+',';
		}
	});
	var _str1 = str1.slice(0,str1.length-1);
	var _str2 = str2.slice(0,str2.length-1);
	var _arr1 = _str1.split(',');
	var _arr2 = _str2.split(',');
	var _str = '';
	for (var i = 0; i < _arr1.length; i++) {
		_str += _arr1[i]+'='+_arr2[i]+',';
	};
	var str_end = _str.slice(0,_str.length-1);
	mod_service.insertNewInfo(sn,_str1,_str2,str_end,open_id,function(result){
		if(result=='添加成功'){
			mod_service.getNewAddInfo(sn,open_id,function(result){
				SEND(res,200,'添加成功',result);
			});
		}else if(result=='更新成功'){
			mod_service.getNewAddInfo(sn,open_id,function(result){
				SEND(res,200,'更新成功',result);
			});
		}else{
			SEND(res,-1,'添加失败',[]);
		}	
	});
}
this.transEndUser = function(req,res){
	var params = url.parse(req.url,true).query;
	var val = params.val;
	mod_service.transEndUser(val,function(result){
		SEND(res,200,'succeed',result);
	});
}
this.getAppName = function(req,res,next){
	mod_service.getAppName(function(result){
		SEND(res,200,'',result);
	});
}
this.vipEnter = function(req,res){
	CHECKSESSION(req,res,'open_id',function(result){
		if(result==200){
			res.sendFile(DIRNAME+'/public/html/openid.html');
		}else{
			res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx0f012ab2b8db902d&redirect_uri=http%3A%2F%2Fwww.langjie.com%2Fredirect.html&response_type=code&scope=snsapi_userinfo&state=http://www.langjie.com:8090/service/vip_reg#wechat_redirect');
		}
	});
}
this.applyReg = function(req,res){
	var appid="wx0f012ab2b8db902d";
	var appsecret="e9f1f204691863715cc18e9e0439c069";
	
    var query=url.parse(req.url,true).query;
    var code=query.code;
    var name=query.name;
    var mobile=query.mobile;
    var cpy=query.cpy;
    var job=query.job;
    var gender=query.gender;
    var addr=query.addr;
    var cdurl="https://api.weixin.qq.com/sns/oauth2/access_token?appid="+appid+"&secret="+appsecret+"&code="+code+"&grant_type=authorization_code";
    request.get(cdurl,function(err,response,body){
        var bodys=JSON.parse(body);
        if(bodys.errcode){
        	if(req.session.open_id){
        		connMysql(req,bodys,name,res,mobile,cpy,job,gender,addr);
        	}else{
        		console.log(name+"获取openid失败");		//err.ejs
            	res.end('fail');
        	}
        }else{
            connMysql(req,bodys,name,res,mobile,cpy,job,gender,addr);
        }
    });
}
function connMysql(req,bodys,name,res,mobile,cpy,job,gender,addr){
    var now=new Date();
    var month=now.getMonth()+1;
    var time=now.getFullYear()+"年"+month+"月"+now.getDate()+"日"+now.toLocaleTimeString();
    var openid=bodys.openid?bodys.openid:req.session.open_id;
    mod_service.applyReg(openid,name,res,mobile,cpy,job,gender,addr,time,function(result){
    	if(result=='succ'){
    		var mailOptions={
	            from:'service@langjie.com', //发送者
	            to:'845676641@qq.com,1115634709@qq.com',  //接受者，可以同时发送多个，以','号隔开
	            subject:"用户注册",    //标题
	            html:`<h3>注册人:${name}</h3>
	                   <h3>注册公司:${cpy}</h3>
	                   <h3>职位:${job}</h3>
	                   <h3>性别:${gender}</h3>
	                   <h3>注册手机:${mobile}</h3>
	                   <h3>openid:${openid}</h3>
	                   <h3>注册时间:${time}</h3>`
	        };
	        var baseSend = new base.SendEmail(mailOptions);
		    baseSend.sendMsg(function(){
		    	sendMsg(req,res,name,mobile);
	            res.send("succ");
			});
			require('../cache/cacheCustomerInfo').clearCache();
    	}else{
    		res.send(result);
    	}
    });
}
function sendMsg(req,res,name,phone){
	var params_arr = [];
	var params = {};
	params.table = 'vip_message';
	params.user = [{
		name: name,
		phone: phone
	}];
	params.type = '';
	params.sender = 'system';
	params.title = '注册成功！';
	params.message = '欢迎注册杭州朗杰测控会员！完善信息，可获得更多积分！';
	params.url = '';
	params.model = 'singleMsg';
	params_arr.push(params);
	var str_params = JSON.stringify(params_arr);
	res.redirect(ROUTE('message/member_modify_notice?params='+str_params));
}
function getOpenId(state){
	var appid = 'wx0f012ab2b8db902d';
	var redirect = encodeURIComponent(CONFIG.wxRedirectUrl);
	var str = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+appid+"&redirect_uri="+redirect+"&response_type=code&scope=snsapi_userinfo&state="+state+"#wechat_redirect";
	return str;
}