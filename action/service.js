var express = require('express');
var url = require('url');
var path = require('path');
var request = require('request');
var service = require('../service/service');
// const sofaActionClient = require('../service/sofaActionClient');
const actionOpen = require('./open');

/**
 *  获取code
 */
this.wxGetCode = (req,res,next) => {
	let { code, state } = url.parse(req.url,true).query;
	state = state.replace(/\$/g, '&');
	if (state.indexOf('?') === -1) {
		state = state + '?code=' + code;
	} else {
		state = state + '&code=' + code;
	}
	res.redirect(state);
}

/**
 *  获取微信静态token
 */
this.wxGetToken = (req,res,next) => {
	const appid = CONFIG.appid;
	const secret = CONFIG.appsecret;
	const infoUrl = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret;
	request.get(infoUrl,(err,response,body) => {
		res.send(body);
	});
}

/**
 *  获取微信指定人的身份信息和unionid
 */
this.wxGetUserInfo = (req,res,next) => {
	const { access_token, openid } = url.parse(req.url,true).query;
	const infoUrl = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=' + access_token + '&openid=' + openid + '&lang=zh_CN';
	request.get(infoUrl,(err,response,body) => {
		res.send(body);
	});
}

/**
 *  向服务号发送消息
 */
this.wxSendMsg = (req,res,next) => {
	const { form_data } = req.body;
	const webHost = CONFIG.proxy_protocol+'://'+CONFIG.proxy_host+':'+CONFIG.proxy_port;
	request.get(webHost + '/wx/getToken',(err,response,body) => {
		body = typeof(body)=='object'?body:JSON.parse(body);
		let access_token;
		try{
			access_token = body.data.access_token;
		}catch(e){
			access_token = body.access_token;
		}
		const msgUrl = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + access_token;
		request.post(msgUrl,(err,response,body) => {
			res.send(body);
		}).form(form_data);
	});
}

this.checkOpenId = function(req,res,next,cb){
	var open_id = req.session.open_id;
	var params = url.parse(req.url,true).query;
	var originalUrl = req.originalUrl;
    var code = params.code;
    if(params.param!=undefined) req.session.param = params.param;
	service.checkOpenId({
		open_id: open_id,
		code: code,
		originalUrl: originalUrl,
		urlParams: params,
		post: params.param?1:0
	},function(result){
		if(result.code==200){
			try{
				cb(result);
			}catch(e){
				next();
			}
		}else if(result.code==100){
			req.session.open_id = result.data.open_id;
			req.session.unionid = result.data.unionid;
			req.session.wxUserInfo = result.data.info;
			try{
				cb(result);
			}catch(e){
				next();
			}
		}else if(result.code==-10001){
			res.render('./pages/tip',{
				tip: 'code过期，请重新进入'
			});
		}else if(result.code==-10002){
			res.redirect(result.data);
		}
	});
}
this.checkPerson = async function(req, res, next, cb) {
	const { open_id } = req.session;
	const result = await service.checkPerson(open_id);
	req.session.code = result.code;
	if (result.code.includes(10000)) {
		const originalUrl = req.originalUrl;
		if (originalUrl.indexOf('/member/onlineService') !== -1) {
			next();
		} else {
			res.redirect('/vip/reg#'+originalUrl);
		}
		return;
	}
	req.session.uid = result.data.memberInfo.user_id;
	req.session.name = result.data.memberInfo.name;
	req.session.phone = result.data.memberInfo.phone;
	if (result.code.includes(10001)) {
		req.session.admin_id = result.data.adminInfo.user_id;
	} else {
		req.session.user_id_arr = result.data.user_id_arr;
	}
	if (cb) {
		cb(result);
	} else {
		next();
	}
}
this.memberReg = function(req,res,next){
	res.sendFile(DIRNAME+'/public/html/openid.html');
}
this.retailReg = function(req,res,next){
	res.sendFile(DIRNAME+'/public/html/retailReg.html');
}
this.memberRegInfo = function(req,res,next){
	var open_id = req.session.open_id;
	var unionid = req.session.unionid;
	var params = req.body;
	service.memberRegInfo({
		open_id: open_id,
		unionid: unionid,
		params: params
	},function(result){	
		SEND(res,result.code,result.msg,result.data);
	});
}
this.memberEndRegInfo = function(req, res, next) {
	var open_id = req.session.open_id;
	var unionid = req.session.unionid;
	var params = req.body;
	service.endMemberRegInfo({
		open_id: open_id,
		unionid: unionid,
		params: params
	},function(result){	
		SEND(res,result.code,result.msg,result.data);
	});
}
this.productList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var keywords = params.keywords;
	var user_id_arr = req.session.user_id_arr;
	var code = req.session.code;
	const unionid = req.session.unionid;
	service.productList({
		user_id_arr: user_id_arr,
		code: code,
		page: page,
		keywords: keywords,
		unionid,
	},function(result){
		if(result.type=='staff'){
			if(page==undefined){
				res.render('./pages/index_pro',{
					result: result.res_arr
				});
			}else{
				SEND(res,200,'',result.res_arr);
			}
		}else if(result.type=='customers'){
			if(page==undefined){
				res.render('./pages/index',{
					result: result.res_arr
				});
			}else{
				SEND(res,200,'',result.res_arr);
			}
		}else if(result.type=='visitor'){
			if(page==undefined){
				res.render('./pages/index_end',{
					result: result.res_arr
				});
			}else{
				SEND(res,200,'',result.res_arr);
			}
		}
	});
}
this.postInfo = async function(req,res,next){
	console.log(req.session.param);
	var param = JSON.parse(req.session.param);
	var sn = param.SN;
	var code = req.session.code;
	var admin_id = req.session.admin_id;
	// 员工，并存在该卡，提示
	const r = await service.checkIsStaffAndCardExist({ code, sn });
	if (r) {
		res.render('./pages/confirmUpdateCard', {
			sn,
			type: 'vir',
		});
	} else {
		service.postInfo({
			param: param,
			code: code,
			admin_id: admin_id
		},function(result){
			res.redirect('/service/product/vir8/'+sn);
		});
	}
}
exports.postInfoAgain = async (req, res, next) => {
	var param = JSON.parse(req.session.param);
	var sn = param.SN;
	var code = req.session.code;
	var admin_id = req.session.admin_id;
	service.postInfo({
		param: param,
		code: code,
		admin_id: admin_id
	},function(result){
		res.redirect('/service/product/vir8/'+sn);
	});
}
exports.postDyna = async (req, res, next) => {
	var param = JSON.parse(req.session.param);
	var sn = param.SN;
	var code = req.session.code;
	var admin_id = req.session.admin_id;
	// 员工，并存在该卡，提示
	const r = await service.checkIsStaffAndCardExist({ code, sn });
	if (r) {
		res.render('./pages/confirmUpdateCard', {
			sn,
			type: 'dyna',
		});
	} else {
		const result = await service.postDyna({
			param: param,
			code: code,
			admin_id: admin_id
		});
		if (result.code === 200) {
			res.redirect('/service/product/dyna/'+sn);
		} else {
			res.render('./pages/tip', {
				tip: result.msg,
			});
		}
	}
}
exports.postDynaAgain = async (req, res, next) => {
	var param = JSON.parse(req.session.param);
	var sn = param.SN;
	var code = req.session.code;
	var admin_id = req.session.admin_id;
	const result = await service.postDyna({
		param: param,
		code: code,
		admin_id: admin_id
	});
	if (result.code === 200) {
		res.redirect('/service/product/dyna/'+sn);
	} else {
		res.render('./pages/tip', {
			tip: result.msg,
		});
	}
}

exports.dynaProductInfo = async (req, res, next) => {
	const { sn } = req.params;
	const user_id_arr = req.session.user_id_arr;
	const code = req.session.code;
	const result = await service.dynaProductInfo({ sn, user_id_arr, code });
	if(!result.resData){
		res.render('./pages/tip',{
			tip: '不存在该序列号'
		});
		return;
	}
	let pageTitle, pageHref, imgSrc;
	if (result.resData.data.model == 'D700') {
		pageTitle = '代龙700产品参数';
		pageHref = 'https://www.langjie.com/#/dynaProInfo/53';
		imgSrc = '../img/_700.png';
	} else if (result.resData.data.model == 'D900') {
		pageTitle = '代龙900产品参数';
		pageHref = 'https://www.langjie.com/#/dynaProInfo/52';
		imgSrc = '../img/_900.png';
	} else if (result.resData.data.model == 'D910') {
		pageTitle = '代龙910产品参数';
		pageHref = 'https://www.langjie.com/#/dynaProInfo/52';
		imgSrc = '../img/_910.png';
	} else if (result.resData.data.model == 'D921') {
		pageTitle = '代龙921产品参数';
		pageHref = 'https://www.langjie.com/#/dynaProInfo/55';
		imgSrc = '../img/_921.png';
	}
	if(result.type=='visitor'){
		res.render('./pages/dyna_info_end_user',{
			result: result.resData,
			pageTitle,
			pageHref,
			imgSrc,
		});
	}else if(result.type=='otherCustomers'){
		res.render('./pages/dyna_info_member',{
			result: result.resData,
			pageTitle,
			pageHref,
			imgSrc,
		});
	}else if(result.type=='customers'){
		res.render('./pages/dyna_info_customer',{
			result: result.resData,
			pageTitle,
			pageHref,
			imgSrc,
		});
	}else if(result.type=='staff'){
		var params = url.parse(req.url,true).query;
		var add_sn = params.add_sn;
		if(add_sn){
			res.render('./pages/add_dyna_sn',{
				result: result.resData,
				pageTitle,
				pageHref,
				imgSrc,
			});
		}else{
			res.render('./pages/dyna_info_producer',{
				result: result.resData,
				pageTitle,
				pageHref,
				imgSrc,
			});
		}
	}
}

/**
 * 判断控制器类型
 */
exports.checkCtrlCardType = async (req, res, next) => {
	const { sn } = req.params;
	const result = await service.checkCtrlCardType(sn);
	res.send(result);
}

this.productInfo = function(req,res,next){
	var sn = url.parse(req.url,true).pathname.split('vir8/')[1];
	var user_id_arr = req.session.user_id_arr;
	var code = req.session.code;
	service.productInfo({
		sn: sn,
		user_id_arr: user_id_arr,
		code: code
	},function(result){
		if(!result.resData){
			res.render('./pages/tip',{
				tip: '不存在该序列号'
			});
			return;
		}
		let pageTitle, pageHref, imgSrc;
		if (result.resData.data.model == 'V884') {
			pageTitle = '威程884产品参数';
			pageHref = 'https://www.langjie.com/#/virProInfo/34';
			imgSrc = '../img/_884.png';
		} else if (result.resData.data.model == 'V882') {
			pageTitle = '威程882产品参数';
			imgSrc = '../img/_884.png';
			pageHref = 'https://www.langjie.com/#/virProInfo/34';
		} else if (result.resData.data.model == 'V881') {
			pageTitle = '威程881产品参数';
			pageHref = 'https://www.langjie.com/#/virProInfo/33';
			imgSrc = '../img/_881.png';
		} else if (result.resData.data.model == 'V802') {
			pageTitle = '威程802产品参数';
			pageHref = 'https://www.langjie.com/#/virProInfo/32';
			imgSrc = '../img/_802.png';
		} else if (result.resData.data.model == 'V801') {
			pageTitle = '威程801产品参数';
			pageHref = 'https://www.langjie.com/#/virProInfo/28';
			imgSrc = '../img/_801.png';
		} else if (result.resData.data.model == 'V800') {
			pageTitle = '威程800产品参数';
			pageHref = '../../../products/vir8/1800';
			imgSrc = '../img/_800.png';
		} else {
			pageTitle = '威程试验卡产品参数';
			pageHref = '../../../products/vir8/800';
			imgSrc = '../img/_ad800.png';
		}
		if(result.type=='visitor'){
			res.render('./pages/vir8_info_end_user',{
				result: result.resData,
				pageTitle,
				pageHref,
				imgSrc,
			});
		}else if(result.type=='otherCustomers'){
			res.render('./pages/vir8_info_member',{
				result: result.resData,
				pageTitle,
				pageHref,
				imgSrc,
			});
		}else if(result.type=='customers'){
			res.render('./pages/vir8_info_customer',{
				result: result.resData,
				pageTitle,
				pageHref,
				imgSrc,
			});
		}else if(result.type=='staff'){
			var params = url.parse(req.url,true).query;
			var add_sn = params.add_sn;
			if(add_sn){
				res.render('./pages/add_sn',{
					result: result.resData,
					pageTitle,
					pageHref,
					imgSrc,
				});
			}else{
				res.render('./pages/vir8_info_producer',{
					result: result.resData,
					pageTitle,
					pageHref,
					imgSrc,
				});
			}
		}
	});
}
this.cardDel = function(req,res,next){
	var sn = req.body.sn;
	var admin_id = req.session.admin_id;
	service.cardDel({
		sn: sn,
		admin_id: admin_id
	},function(result){
		SEND(res,200,'删除成功',[]);
	});
}
this.cardAdd = function(req,res,next){
	var sn = req.body.sn;
	var model = req.body.model;
	var admin_id = req.session.admin_id;
	service.cardAdd({
		sn: sn,
		model,
		admin_id: admin_id
	},function(result){
		SEND(res,result.code,result.msg,'');
	});
}
this.searchInput = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var key = params.key;
	var val = params.val;
	service.searchInput({
		key: key,
		val: val
	},function(result){
		SEND(res,200,'',result);
	});
}
this.dealerUpdateInfo = function(req,res,next){
	var sn = req.body.sn;
	var form_data = JSON.parse(req.body.form_data);
	service.dealerUpdateInfo({
		sn: sn,
		form_data: form_data
	},function(result){
		SEND(res,200,'更新成功',result);
	});
}
this.staffUpdateInfo = function(req,res,next){
	var admin_id = req.session.admin_id;
	var sn = req.body.sn;
	var form_data = JSON.parse(req.body.form_data);
	service.staffUpdateInfo({
		sn: sn,
		form_data: form_data,
		admin_id: admin_id
	},function(result){
		SEND(res,200,'更新成功',result);
	});
}

/**
 * 检验合格
 */
this.checkPass = async (req, res, next) => {
	const { admin_id } = req.session;
	const { sn } = req.params;
	const result = await service.checkPass({ admin_id, sn });
	res.send(result);
}

/**
 * 检验不合格
 */
this.checkNotPass = async (req, res, next) => {
	const { admin_id } = req.session;
	const { sn } = req.params;
	const { notPassRem } = req.body;
	const result = await service.checkNotPass({ admin_id, sn, notPassRem });
	res.send(result);
}

/**
 * 重新检测
 */
this.checkAgain = async (req, res, next) => {
	const { admin_id } = req.session;
	const { sn } = req.params;
	const result = await service.checkAgain({ admin_id, sn });
	res.send(result);
}

this.applyResale = async (req, res, next) => {
	const { resaleCompany, sn } = req.body;
	const { open_id } = req.session;
	const result = await service.applyResale({
		resaleCompany,
		open_id,
		sn,
	});
	res.send(result);
}

this.checkReg = function(req,res,next){
	var user_id_arr = req.session.user_id_arr;
	service.checkReg({
		user_id_arr: user_id_arr
	},function(result){
		SEND(res,result.code,result.msg,'');
	});
}
this.reg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var code = req.session.code;
	var user_id_arr = req.session.user_id_arr;
	var open_id = req.session.open_id;
	var appName = params.appName?params.appName:params.APPNAME;
	var sn = params.sn?params.sn:params.SN;
	var mid = params.mid?params.mid:params.MID;
	if(req.session.hasSend!=undefined){
		res.render('./pages/tip',{
			tip: '注册申请已提交，请勿重复操作'
		});
		return;
	}
	service.reg({
		code: code,
		user_id_arr: user_id_arr,
		open_id: open_id,
		sn: sn,
		appName: appName,
	},function(result){
		if(result.code==-1){
			// if(code==10009||code==10011){
			// 	req.session.hasSend = sn;
			// }
			request({
				url: CONFIG.cloudApiAddr + '/action/reg/' + sn,
				method: 'get',
				headers: {
					Accept: 'application/json'
				},
			}, (err, response, body) => {
				body = typeof body === 'string' ? JSON.parse(body) : body;
				if (body.code !== 200) {
					res.render('./pages/tip',{
						tip: body.msg
					});
				} else {
					res.render('./pages/regInfo',{
						data: body.data
					});
				}
			});
		}else{
			res.render('./pages/vac_reg',{
				sn:sn,
				mid: mid ? mid : result.data.machineNo,
				appName: appName,
				productInfo: result.data,
			});
		}
	});
}
this.regEvent = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var sn = params.sn;
	var code = req.session.code;
	var open_id = req.session.open_id;
	service.regEvent({
		sn: sn,
		code: code,
		open_id: open_id
	},function(result){
		SEND(res,200,'',result);
	});
}
this.getAppNameList = function(req,res,next){
	service.getAppNameList({},function(result){
		SEND(res,200,'',result);
	});
}
this.subReg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	service.subReg({
		isAppReg: params.isAppReg,
		isFunReg: params.isFunReg,
		funCode: params.funCode,
		sn: params.sn,
		time: params.time,
		phone: params.phone,
		name: params.name,
		mid: params.mid,
		appName: params.appName,
		code: req.session.code,
		admin_id: req.session.admin_id,
		user_id_arr: req.session.user_id_arr,
		open_id: req.session.open_id,
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}
this.vacReg = function(req,res,next){
	var params = url.parse(req.url).query;
	res.redirect('/service/product/reg?'+params);
}

this.getSuperAuth = function(req,res,next){
	// var session = req.session;
	// for(var i in session){
	// 	if(i!='cookie'&&i!='_garbage'){
	// 		delete session[i];
	// 	}
	// }
	service.getSuperAuth({},function(result){
		res.render('./pages/getSuperAuth',{
			result: result
		});
	});
}
this.getSuperAuthMember = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	service.getSuperAuthMember({
		company: company
	},function(result){
		SEND(res,200,'',result);
	});
}
this.postSuperAuthMember = function(req,res,next){
	var open_id = req.body.open_id;
	service.postSuperAuthMember({
		open_id
	},function(result){
		const session = req.session;
		for(var i in session) {
			if(i!='cookie'&&i!='_garbage'){
				delete session[i];
			}
		}
		req.session.open_id = result.open_id;
		req.session.unionid = result.unionid;
		SEND(res,200,'操作成功',[]);
	});
}
this.deleteSuperAuth = function(req,res,next){
	req.session.destroy();
	SEND(res,200,'已安全退出',[]);
}

this.mpIndex = (req,res,next) => {
	const { unionid, open_id } = req.session;
	const url = CONFIG.wxmpUrl+'/member/checkSignIn?unionid='+unionid;
	const lunchUrl = CONFIG.wxmpUrl+'/center/Lunch?unionid='+unionid;
	service.getWxUserInfo({
		open_id: open_id
	},result => {
		const { headimgurl } = result;
		request.get(url,(err,response,body) => {
			if(body=='true'){
				request.get(lunchUrl,(err,response,body) => {
					body = typeof(body)=='object'?body:JSON.parse(body);
					const is_lunch = body[0].is_lunch;
					const checkNo = CONFIG.wxmpUrl+'/center/mineSignInfo?unionid='+unionid;
					request.get(checkNo,(err,response,body) => {
						body = typeof(body)=='object'?body:JSON.parse(body);
						const signIn_id = body.signIn_id;
						res.render('./pages/mpIndex',{
							is_lunch: is_lunch,
							unionid: unionid,
							signIn_id: signIn_id
						});
					});
				});
			}else{
				res.render('./pages/mpSign',{
					headimgurl: headimgurl,
					unionid: unionid
				});
			}
		});
	});
}

this.mpGoods = (req,res,next) => {
	const { unionid, open_id } = req.session;
	res.render('./pages/mpGoods',{
		unionid: unionid
	});
}

this.mpMeetingPeople = (req,res,next) => {
	const { unionid, open_id } = req.session;
	res.render('./pages/mpMeetingPeople',{
		unionid: unionid
	});
}

this.hasShare = (req, res, next) => {
	const { open_id } = req.session;
	const { no } = url.parse(req.url, true).query;
	service.hasShare({
		open_id,
		no,
	}, result => {
		res.send(result);
	});
}

this.hasRead = (req, res, next) => {
	const { open_id } = req.session;
	const { no } = url.parse(req.url, true).query;
	service.hasRead({
		open_id,
		no,
	}, result => {
		res.send(result);
	});
}

this.queryExpress = (req, res, next) => {
	const params = url.parse(req.url, true).query;
	service.queryExpress(params, result => res.send(result));
}

// 往云注册对外发布
this.releaseReg = (req, res, next) => {
	const params = req.body;
	service.releaseReg(params, result => {
		res.send(result);
	});
}

// 根据sn获取当前云注册的信息
this.getRegInfoFromCloud = async (req, res, next) => {
	const { sn } = req.params;
	// const result = await sofaActionClient.show({ sn: Number(sn) });
	// res.send(result);
	request({
		url: CONFIG.cloudApiAddr + '/action/reg/' + sn + '?fromWxWeb=1',
		method: 'get',
		headers: {
			Accept: 'application/json'
		},
	}, (err, response, body) => {
		body = typeof body === 'string' ? JSON.parse(body) : body;
		res.send(body);
	});
}

// 取消对外公开
this.releaseRegDestroy = (req, res, next) => {
	const { sn } = req.params;
	service.releaseRegDestroy({ sn }, result => {
		res.send(result);
	});
}

// 软件扫码
exports.scanClientQrcode = async (req, res, next) => {
	const { sn } = req.params;
	const { unionid } = req.session;
	const params = url.parse(req.url, true).query;
	const { timestamp } = params;
	if ((Date.now() - timestamp) > 60 * 60 * 1000) {
		res.render('./pages/tip', {
			tip: '二维码过期，请刷新重试',
		});
		return;
	}
	const appName = params.appName ? params.appName : '';
	// 将sn和open_id存入redis
	// 登陆
	let result = await new Promise(async resolve => {
		request.post(CONFIG.cloudApiAddr + '/login/getTokenByUnionid', {
			form: {
				unionid,
				appName,
			},
			headers: {
				primaryunionid: '111',
			},
		}, (err,response,body) => {
			resolve(body);
		});
	});
	// 将结果存入redis
	result = JSON.parse(result);
	result.data.appName = appName;
	result = JSON.stringify(result);
	new Promise(resolve => {
		request.post(CONFIG.cloudApiAddr + '/login/saveTokenInfo/' + sn, {
			form: {
				data: result,
			},
		}, (err,response,body) => {
			resolve(body);
		});
	});
	res.render('./pages/clientScanSuccess', {
		appName,
	});
}

/**
 * 虚拟控制器列表
 */
exports.simuCtrlList = async (req, res, next) => {
	const list = await actionOpen.simuResultDeal(req);
	const { unionid } = req.session;
	res.render('./pages/simuCtrlList', {
		list,
		unionid,
	});
}

exports.checkSnAccess = async (req, res, next) => {
	const { unionid } = req.session;
	const { sn } = url.parse(req.url, true).query;
	const result = await service.checkSnAccess(unionid, sn);
	res.send({ code: result ? 200 : -1 });
}