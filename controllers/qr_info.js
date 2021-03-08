var express = require('express');
var path = require('path');
var url = require('url');
var fs = require('fs');
var mod_service = require('../model/mod_service');
var service = require('../controllers/service');

this.info = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var param = JSON.parse(params.param);
	var sn = param.SN;
	req.session.param = param;
	var appid = 'wx0f012ab2b8db902d';
	var redirect = encodeURIComponent(CONFIG.wxRedirectUrl);
	// var state = 'http://www.langjie.com:8090/service/product/vir8/update_qr_info';
	var state = ROUTE('service/product/vir8/update_qr_info');
	var str = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+appid+"&redirect_uri="+redirect+"&response_type=code&scope=snsapi_userinfo&state="+state+"#wechat_redirect";
	CHECKSESSION(req,res,'open_id',function(result){
		if(result==200){
			res.redirect(state);
		}else if(result==-1){
			res.redirect(str);
		}
	});
}
this.update_qr_info = function(req,res){
	CHECKSESSION(req,res,'open_id',function(result){
		var open_id = req.session.open_id;
		info(req,res,open_id);
	});
	function info(req,res,open_id){
		mod_service.identity(open_id,function(result){
			var param = req.session.param;
			try{
				var sn = param.SN;
			}catch(e){
				console.log(param);
				var sn = param.SN;
			}
			if(param.MODEL=='1802'){
				var model = 'Vir802';
			}else if(param.MODEL=='1801'){
				var model = 'Vir801';
			}else if(param.MODEL=='1800'){
				var model = 'Vir800';
			}else if(param.MODEL=='1881'){
				var model = 'Vir881';
			}else if(param.MODEL=='1884'){
				var model = 'Vir884';
			}else{
				var model = 'AD800';
			}
			if(result.code==100){
				var _str = '',in_str1 = '',in_str2 = '';
				for(var i in param){
					if(i=='MODEL'){
						_str += i+'=\"'+model+'\",';
						in_str1 += i+',';
						in_str2 += '\"'+model+'\",';
					}else{
						_str += i+'='+param[i]+',';
						in_str1 += i+',';
						in_str2 += '\"'+param[i]+'\",';
					}
				}
				var str = _str.slice(0,_str.length-1);
				var str1 = in_str1.slice(0,in_str1.length-1);
				var str2 = in_str2.slice(0,in_str2.length-1);
				var arr1 = ['SN','DA_VIB_FREQ','DA_VIB_AMP','MID','AD_MODE','PULSE_MODE','TYPE','USER','REGCODE','VER','MODEL'];
				var arr2 = ['serialNo','vibFreq','vibAMP','machineNo','ad2Mode','pulseMode','authType','oemUser','latestRegNo','fwVer','model'];
				var len = arr1.length;
				for (var i = 0; i < len; i++) {
					str = str.replace(arr1[i],arr2[i]);
					str1 = str1.replace(arr1[i],arr2[i]);
					str2 = str2.replace(arr1[i],arr2[i]);
				}
				mod_service.info(sn,function(result){
					var time = TIME();
					if(result.code==-1){
						SEND(res,-1,'failed',result.data);
						return;
					}
					if(result.data[0]==null){
						mod_service.insertInfo(sn,str1,str2,time,open_id,function(result){
							res.redirect('/service/product/vir8_producer/'+sn);
						});
					}else{
						mod_service.updateInfo(sn,str,time,open_id,function(result){
							res.redirect('/service/product/vir8_producer/'+sn);
						});
					}
				});
			}else if(result.code==0){
				res.redirect('/service/product/vir8_end_user/'+sn);
			}else if(result.code==1){
				var indexType = result.obj;
				indexType.getUserId(function(id){
					indexType.checkDealerCard(id,sn,function(w){
						if(w.msg=='dealer'){
							res.redirect('/service/product/vir8_customer/'+sn);
						}else{
							res.redirect('/service/product/vir8_member/'+sn);
						}
					});
				});
			}else{
				res.redirect('/service/product/vir8_member/'+sn);
			}
		});
	}
}

this.mainTable = function(req,res){
	var pathname = url.parse(req.url,true).pathname;
	CHECKSESSION(req,res,'open_id',function(result){
		if(result==200||result==100){
			var open_id = req.session.open_id;
			// mod_service.indexType(open_id,function(type){
				// req.session.type = type;
				list(req,res,open_id);
			// });
		}else if(result==-1){
			var state = ROUTER()+pathname;
			res.redirect(getOpenId(state));
		}
	});
	function list(req,res,open_id){
		var str = req.path;
		var arr = str.split('/');
		var sn = arr[arr.length-1];
		mod_service.identity(open_id,function(result){
			if(result.code==100){							
				res.redirect('/service/product/vir8_producer/'+sn);
			}else if(result.code==1){
				var indexType = result.obj;
				indexType.getUserId(function(id){
					indexType.checkDealerCard(id,sn,function(w){
						if(w.msg=='dealer'){
							res.redirect('/service/product/vir8_customer/'+sn);
						}else{
							res.redirect('/service/product/vir8_member/'+sn);
						}
					});
				});
			}else if(result.code==0){						
				res.redirect('/service/product/vir8_end_user/'+sn);
			}else{											
				res.redirect('/service/product/vir8_member/'+sn);
			}
		});
	}
}
this.searchEntrance = function(req,res){
	var pathname = url.parse(req.url,true).pathname;
	CHECKSESSION(req,res,'open_id',function(result){
		if(result==200||result==100){
			var open_id = req.session.open_id;
			var type;
			mod_service.identity(open_id,function(result){
				if(result.code==1){
					var indexType = result.obj;
					indexType.getUserId(function(id){
						type = id;
						req.session.type = type;
						service.list(req,res,type);
					});
				}else{
					type = result.msg;
					req.session.type = type;
					service.list(req,res,type);
				}
			});
		}else if(result==-1){
			var state = ROUTER()+pathname;
			res.redirect(getOpenId(state));
		}
	});
}

function getOpenId(state){
	var appid = 'wx0f012ab2b8db902d';
	var redirect = encodeURIComponent(CONFIG.wxRedirectUrl);
	var str = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+appid+"&redirect_uri="+redirect+"&response_type=code&scope=snsapi_userinfo&state="+state+"#wechat_redirect";
	return str;
}