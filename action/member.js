var express = require('express');
var url = require('url');
var path = require('path');
const moment = require('moment');
var request = require('request');
var member = require('../service/member');
const cusClientNotiMsg = require('../service/cusClientNotiMsg');
const homeRoutineAffairs = require('../service/homeRoutineAffairs');
const actionHomeNoti = require('./homeNotiSystem');
const service = require('../service/service');
const redisClient = require('../service/redis');
const serviceHomeCustomers = require('../service/homeCustomers');
const serviceHomeWallet = require('../service/homeWallet');
const serviceHomeMember = require('../service/homeMember');
const serviceDeal = require('../service/deal');
const sendMQ = require('../service/rabbitmq').sendMQ;
const common = require('../service/common');

this.memberInfo = function(open_id,cb){
	member.memberInfo({
		open_id: open_id
	},function(result){
		cb(result);
	});
}

/**
 * 	会员首页
 */
this.mainInfo = function(req,res,next){
	var open_id = req.session.open_id;
	var code = req.session.code;
	if(code==10001){
		res.redirect('/m/staff');
	}else{
		member.mainInfo({
			open_id: open_id,
		},function(result){
			if(result.code==-1){
				res.render('./pages/tip',{
					tip: result.msg
				});
			}else if(result.code==200){
				service.getWxUserInfo({
					open_id,
				}, info => {
					let { headimgurl } = info;
					headimgurl = result.data.result.portrait ? ROUTE('img/member/' + result.data.result.portrait) : headimgurl;
					res.render('./pages/member_info', {
						result: result.data.result,
						headimgurl,
						legal_person: result.data.legal_person,
						hasPower: result.data.hasPower,
						staffCount: result.data.staffCount,
						coupsCount: result.data.coupsCount,
						deposCount: result.data.deposCount,
						over_time: result.data.over_time,
						score: result.data.score,
						certLen: result.data.certLen,
						star: result.data.star,
						userCardLen: result.data.userCardLen,
					});
				});
			}else if(result.code==100){
				res.redirect('/m/staff');
			}
		});
	}
}

/**
 * 积分页面
 */
this.score = async (req, res) => {
	const open_id = req.session.open_id;
	const result = await member.score(open_id);
	res.render('./pages/member_score', result);
}

this.walletInfo = async (req, res) => {
	const params = url.parse(req.url, true).query;
	const result = await member.walletInfo(params);
	res.send(result);
}

this.searchMemberByKeywords = async (req, res) => {
	const { keywords } = url.parse(req.url, true).query;
	const result = await member.searchMemberByKeywords({ keywords });
	res.send(result);
}

/**
 * 活动记录
 */
this.activityRecord = async (req, res) => {
	const open_id = req.session.open_id;
	const result = await member.activityRecord(open_id);
	res.render('./pages/member_activity_record', {
		eventArr: result.data,
		moment,
	});
}

/**
 * 	基本信息
 */
this.basicInfo = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var open_id = req.session.open_id;
	member.basicInfo({
		name: name,
		phone: phone,
		open_id,
	},function(result){
		res.render('./pages/member_basicInfo',{
			result: result
		});
	});
}

/**
 * 	基本信息编辑
 */
this.basicInfoEdit = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var open_id = req.session.open_id;
	member.basicInfo({
		name: name,
		phone: phone,
		open_id,
	},function(result){
		res.render('./pages/member_basicInfo_edit',{
			result: result
		});
	});
}

/**
 * 	商务信息
 */
this.businessInfo = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var open_id = req.session.open_id;
	member.basicInfo({
		name: name,
		phone: phone,
		open_id,
	},function(result){
		res.render('./pages/member_businessInfo',{
			result: result
		});
	});
}

/**
 * 	商务信息编辑
 */
this.businessInfoEdit = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var open_id = req.session.open_id;
	member.businessInfoEdit({
		name: name,
		phone: phone,
		open_id,
	},function(result){
		res.render('./pages/member_businessInfo_edit',{
			result: result.data.result,
			position: result.data.position_arr
		});
	});
}

/**
 * 	签到
 */
this.sign = function(req,res,next){
	var open_id = req.session.open_id;
	// var name = req.session.name;
	// var phone = req.session.phone;
	member.sign({
		open_id,
	},function(result){
		res.render('./pages/member_sign',{
			m_sign_arr: result.data
		});
	});
}

/**
 * 	我的注册历史
 */
this.regHistory = function(req,res,next){
	var { open_id } = req.session;
	var params = url.parse(req.url,true).query;
	var page = params.page;
	member.regHistory({
		open_id,
		page: page
	},function(result){
		if(page==undefined){
			res.render('./pages/member_reg_history',{
				result: result
			});
		}else{
			SEND(res,200,'',result);
		}
	});
}

/**
 * 	我的消息
 */
this.message = function(req, res, next) {
	const open_id = req.session.open_id;
	const params = url.parse(req.url, true).query;
	const page = params.page;
	if (page == undefined) {
		member.basicInfo({
			open_id,
		}, result => {
			res.render('./pages/member_message', {
				open_id,
				album: result.portrait,
			});
		});
	} else {
		member.message({
			open_id,
			page,
		}, result => {
			SEND(res, 200, '', result);
		});
	}
}

// 发送站内私信
exports.sendToMemberMessage = async (req, res, next) => {
	const { open_id } = req.session;
	const { content } = req.body;
	const result = await member.sendToMemberMessage({ open_id, content });
	res.send(result);
}

/**
 * 	提交基本信息
 */
this.subBasicInfo = function(req,res,next){
	var name = req.body.name;
	var phone = req.body.phone;
	var newName = req.body.newName;
	var newPhone = req.body.newPhone;
	const open_id = req.session.open_id;
	var form_data = JSON.parse(req.body.form_data);
	member.subBasicInfo({
		open_id,
		name: name,
		phone: phone,
		newName: newName,
		newPhone: newPhone,
		form_data: form_data
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 * 	上传头像
 */
this.upload = function(req,res,next){
	const { open_id } = req.session;
	var name = req.session.name;
	var phone = req.session.phone;
	member.upload({
		open_id,
		name,
		phone,
		req: req
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 * 	提交商务信息
 */
this.subBnsInfo = function(req,res,next){
	var name = req.session.name;
	var phone = req.session.phone;
	var open_id = req.session.open_id;
	var form_data = JSON.parse(req.body.form_data);
	member.subBnsInfo({
		name: name,
		phone: phone,
		open_id,
		form_data: form_data
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 * 	每日签到
 */
this.checkIn = function(req,res,next){
	const { open_id } = req.session;
	member.checkIn({
		open_id,
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 * 	设为星标
 */
this.setStar = function(req,res,next){
	var id = req.body.id;
	var mark = req.body.mark;
	member.setStar({
		id: id,
		mark: mark
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

// 安全设置
this.safeSet = async (req, res, next) => {
	const { open_id } = req.session;
	const isIntroced = await member.checkAddIntro(open_id);
	res.render('./pages/member_safe_set', {
		isIntroced,
	});
}

this.bindTip = async (req, res, next) => {
	const { open_id } = req.params;
	service.getWxUserInfo({ open_id }, result => {
		res.send(result);
	});
}

this.dealBind = async (req, res, next) => {
	const { open_id } = req.params;
	const self_open_id = req.session.open_id;
	const result = await member.dealBind({ open_id, self_open_id });
	var session = req.session;
	for(var i in session){
		if(i!='cookie'&&i!='_garbage'){
			delete session[i];
		}
	}
	res.send(result);
}

this.dealUnbind = async (req, res, next) => {
	const { open_id } = req.params;
	const self_open_id = req.session.open_id;
	const result = await member.dealUnbind({ open_id, self_open_id });
	var session = req.session;
	for(var i in session){
		if(i!='cookie'&&i!='_garbage'){
			delete session[i];
		}
	}
	res.send(result);
}

/**
 * 	法人控制台
 */
this.manage = function(req,res,next){
	var open_id = req.session.open_id;
	member.manage({
		open_id: open_id
	},function(result){
		if(result.code==-1){
			res.render('./pages/tip',{
				tip: result.msg
			});
		}else{
			res.render('./pages/manage',{
				result: result.data
			});
		}
	});
}

/**
 * 	法人查看公司员工的动态信息
 */
this.dynamic = function(req,res,next){
	const { open_id } = req.params;
	member.dynamic({
		open_id,
	},function(result){
		res.render('./pages/member_dynamic',{
			info: [result.data.info],
			jobArr: result.data.jobArr,
			checkedJobArr: result.data.checkedJobArr,
			msg: result.data.msg,
			hasSpecialLine: result.data.hasSpecialLine,
			isMember: result.data.isMember
		});
	});
}

/**
 * 	法人查看公司员工的动态消息（分页）
 */
this.getDynamicMsg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	const { open_id } = params;
	member.getMoreDynamicMsg({
		open_id,
		page: page
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 * 	法人自己审核员工职位
 */
this.checkJob = function(req,res,next){
	var params = req.body;
	member.checkJob(params,function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

this.msgListTargetItem = (req,res,next) => {
	const { open_id } = req.params;
	member.msgListTargetItem({
		open_id,
	},function(result){
		res.render('./pages/member_msg_list',{
			msg: result
		});
	});
}

/**
 * 抵价券
 */
this.coupon = async (req, res, next) => {
	const { open_id } = req.session;
	this.memberInfo(open_id, result => {
		const { company } = result;
		serviceHomeCustomers.getTargetItem({
			targetKey: company,
		}, async result => {
			const { user_id } = result.data.dataValues;
			const walletInfo = await serviceHomeWallet.getCustomCoup(user_id);
			res.render('./pages/member_coupon', {
				WalletCoups: walletInfo.dataValues.WalletCoups,
			});
		});
	});
}

/**
 * 保证金
 */
this.depo = async (req, res, next) => {
	const { open_id } = req.session;
	this.memberInfo(open_id, result => {
		const { company } = result;
		serviceHomeCustomers.getTargetItem({
			targetKey: company,
		}, async result => {
			const { user_id } = result.data.dataValues;
			serviceHomeWallet.getTargetItem({ user_id }, result => {
				const { WalletDepos } = result.data.dataValues;
				let amount = 0;
				WalletDepos.forEach(items => amount += items.amount);
				const url = CONFIG.proxy_protocol +'://'+ CONFIG.proxy_host + ':' + CONFIG.proxy_port + '/';
				res.render('./pages/member_depo', {
					WalletDepos,
					amount,
					url,
				});
			});
		});
	});
}

/**
 * 保证金详情
 */
this.depoInfo = async (req, res, next) => {
	const { contract_no } = req.params;
	const result = await serviceHomeWallet.depoInfo(contract_no);
	if (result) {
		res.render('./pages/member_depo_info', {
			result,
		});
	} else {
		res.render('./pages/tip', {
			tip: '不存在改保证金',
		});
	}
}

/**
 * 历史评级
 */
this.historyStar = async (req, res, next) => {
	const { open_id } = req.session;
	const result = await member.historyStar({
		open_id,
	});
	res.render('./pages/historyStar', {
		result: result.data,
	});
}

/**
 * 	信用管理
 */
this.report = function(req,res,next){
	// var name = req.session.name;
	// var phone = req.session.phone;
	var open_id = req.session.open_id;
	member.report({
		// name: name,
		// phone: phone,
		open_id: open_id
	},function(result){
		if(result.code==-1){
			res.render('./pages/tip',{
				tip: result.msg
			});
		}else{
			res.render('./pages/contract_report',result.data);
		}
	});
}

/**
 * 	合同统计报告
 */
this.credit = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	var time = params.time;
	member.credit({
		company: company,
		time: time
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 * 	信用期内待付款合同
 */
this.recList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	member.recList({
		company: company
	},function(result){
		res.render('./pages/over_list',result.data);
	});
}

/**
 * 	逾期合同
 */
this.overList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	member.overList({
		company: company
	},function(result){
		res.render('./pages/over_list',result.data);
	});
}

/**
 * 	冻结合同
 */
this.freezeList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	member.freezeList({
		company: company
	},function(result){
		res.render('./pages/over_list',result.data);
	});
}

/**
 * 	合同列表
 */
this.contractsList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	var time = params.time;
	member.contractsList({
		company: company,
		time: time
	},function(result){
		res.render('./pages/contracts_list',result.data);
	});
}

/**
 * 	已支付货款列表
 */
this.paymentsList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var company = params.company;
	var time = params.time;
	member.paymentsList({
		company: company,
		time: time
	},function(result){
		res.render('./pages/payments_list',result.data);
	});
}

/**
 * 	获取业务员信息
 */
this.salesmanInfo = function(req,res,next){
	var open_id = req.session.open_id;
	member.salesmanInfo({
		open_id: open_id
	},function(result){
		if(result.code==-1){	
			res.render('./pages/tip',{
				tip: result.msg
			});
		}else{
			res.render('./pages/salesman_info',{
				result: result.data
			});
		}
	});
}

/**
 * 	会员发送短信给业务员页面
 */
this.sendSMS = function(req,res,next){
	res.render('./pages/sendSMS');
}

/**
 * 	会员发送短信给业务员(ajax)
 */
this.sendSMSContent = function(req,res,next){
	var text = req.body.text;
	var phone = req.body.phone;
	var open_id = req.session.open_id;
	member.sendSMSContent({
		text: text,
		phone: phone,
		open_id: open_id
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

this.creditTrend = function(req,res,next){
	res.render('./pages/member_credit_trend');
}

/**
 *  我的客服
 *  需要判断身份（非会员，认证会员，专线会员）
 */
this.onlineService = (req,res,next) => {
	const open_id = req.session.open_id;
	const that = this;
	cusClientNotiMsg.onlineService({
		open_id: open_id
	},result => {
		if(result.code==200){	//专线会员
			req.session.customerId = result.data;
			that.specialLine(req,res,next);
		}else if(result.code==100){	//热线会员
			req.session.customerId = null;
			that.hotLine(req,res,next);
		}else{	//非会员
			that.temporaryLine(req,res,next);
		}
	});
}

/*************************** 热线 *****************************/

/**
 *  线上大厅页面
 */
this.hotLine = (req,res,next) => {
	// var name = req.session.name;
	// var phone = req.session.phone;
	const { open_id } = req.session;
	member.basicInfo({
		open_id,
		// name: name,
		// phone: phone
	},function(result){
		res.render('./pages/hotline',{
			open_id: req.session.open_id,
			album: result.portrait
		});
	});
}

/**
 *  发送图片
 */
this.uploadImgToHotLine = (req,res,next) => {
	actionHomeNoti.imgUpload(req,res,next);
}

/**
 *  发送文件
 */
this.uploadFileToHotLine = (req,res,next) => {
	actionHomeNoti.fileUpload(req,res,next);
}

/**
 *  获取指定会员的发言和被回复的消息
 */
this.getHotList = (req,res,next) => {
	const open_id = req.session.open_id;
	const form_data = url.parse(req.url,true).query;
	const page = form_data.page?Number(form_data.page):1;
	const num = form_data.num?Number(form_data.num):10;
	const self = form_data.self?true:false;
	cusClientNotiMsg.getHotList({
		open_id: open_id,
		page: page,
		num: num,
		self: self
	},result => {
		res.send(result);
	});
}

/**
 *  发布消息
 */
this.addHostMsg = async (req,res,next) => {
	const open_id = req.session.open_id;
	const form_data = typeof(req.body.form_data)=='object'?req.body.form_data:JSON.parse(req.body.form_data);
	const self = req.body.self?true:false;
	cusClientNotiMsg.addHostMsg({
		open_id: open_id,
		form_data: form_data,
		self: self
	},result => {
		res.send(result);
	});
	addMemberActivityScore(open_id);
}

async function addMemberActivityScore(open_id) {
	// 添加发送消息事件
	await new Promise(resolve => {
		common.createEvent({
			headParams: {
				ownerId: open_id,
				type: '1310',
				time: TIME(),
			},
			bodyParams: {},
		}, () => resolve());
	});
	// 发消息，增加元宝分
	sendMQ.sendQueueMsg('memberActivity', JSON.stringify({
		_class: 'sendOnlineMsg',
		open_id,
	}), () => {});
}

/************************ 专线 ****************************/

/**
 *  专线页面
 */
this.specialLine = (req,res,next) => {
	const { open_id } = req.session;
	// var name = req.session.name;
	// var phone = req.session.phone;
	const customerId = req.session.customerId;
	member.basicInfo({
		open_id,
	},function(result){
		homeRoutineAffairs.orderParamsAffairs({
			customerId: customerId,
			isdel: 0,
			state: {
				'$ne': '关闭'
			}
		},affairData => {
			if(affairData.length==0){
				//防止意外发生，理论上不会走到这里
				res.render('./pages/hotline',{
					open_id: req.session.open_id,
					album: result.portrait
				});
			}else{
				let title = affairData[0].dataValues.name;
				res.render('./pages/specialLine',{
					open_id: req.session.open_id,
					album: result.portrait,
					title: title,
					isSub: result.isSub
				});
			}
		});
	});
}

/**
 *  获取指定会员的专线消息
 */
this.getSpecialList = (req,res,next) => {
	const open_id = req.session.open_id;
	const form_data = url.parse(req.url,true).query;
	const page = form_data.page?Number(form_data.page):1;
	const num = form_data.num?Number(form_data.num):10;
	cusClientNotiMsg.getSpecialList({
		open_id: open_id,
		page: page,
		num: num
	},result => {
		res.send(result);
	});
}

/**
 *  发送专线消息
 */
this.addSpecialMsg = (req,res,next) => {
	const open_id = req.session.open_id;
	const form_data = typeof(req.body.form_data)=='object'?req.body.form_data:JSON.parse(req.body.form_data);
	cusClientNotiMsg.addSpecialMsg({
		open_id: open_id,
		form_data: form_data
	},result => {
		res.send(result);
	});
	addMemberActivityScore(open_id);
}

/**
 *  获取指定公司专线的相关信息
 */
this.getSpecialLineInfoByCustomerId = (req,res,next) => {
	const customerId = req.session.customerId;
	const open_id = req.session.open_id;
	member.getInfoByCustomerId({
		customerId: customerId,
		open_id: open_id
	},result => {
		res.send(result);
	});
}

/**
 *  法人更新外部联系人
 */
this.updateOuterContact = (req,res,next) => {
	const customerId = req.session.customerId;
	const outerContact = req.body.outerContact;
	homeRoutineAffairs.updateOuterContact({
		customerId: customerId,
		outerContact: outerContact
	},result => {
		res.send(result);
	});
}

/*********************** 临时 ******************************/

/**
 *  临时咨询页面
 */
this.temporaryLine = (req,res,next) => {
	const open_id = req.session.open_id;
	service.getWxUserInfo({
		open_id: open_id
	},result => {
		const form_data = {
			open_id: result.openid,
			album: result.headimgurl,
			nickname: result.nickname
		};
		res.render('./pages/temporaryLine',{
			open_id: result.openid,
			album: result.headimgurl
		});
		//存进redis数据库，供后台管理模块使用
		new redisClient.classWxUserInfo().setInfo(open_id,form_data,() => {});
	});
}

/**
 *  是否订阅服务号消息
 */
this.checkWxServerMsg = (req,res,next) => {
	const open_id = req.session.open_id;
	const { isSub } = req.body;
	member.checkWxServerMsg({
		open_id: open_id,
		isSub: isSub
	},result => {
		res.send(result);
	});
}

/**
 * 获取江浙沪会员手机号
 */
this.getNearMember = async (req, res, next) => {
	const result = await member.getNearMember();
	res.send(result);
}

this.certList = async (req, res, next) => {
	const open_id = req.session.open_id;
	const result = await serviceHomeMember.getTrainLog({
		open_id,
	});
	if (result.data.length === 0) {
		res.render('./pages/tip',{
			tip: '您未参与培训，暂无相关证书信息',
		});
	} else {
		res.render('./pages/certList',{
			data: result.data,
		});
	}
}

/**
 * 用户卡列表
 */
this.userCardList = async (req, res, next) => {
	const { unionid } = req.session;
	const result = await member.userCardList({
		unionid,
	});
	res.render('./pages/userCardList', {
		list: result.data,
		route: ROUTE('retail/vir/'),
	});
}

exports.changeCompany = async (req, res, next) => {
	const { open_id } = req.session;
	member.memberInfo({ open_id }, result => {
		const { isUser } = result;
		res.render('./pages/changeCompany', {
			isUser,
		});
	});
}

exports.getMuilCompanyList = async (req, res, next) => {
	const { open_id } = req.session;
	const result = await member.getMuilCompanyList(open_id);
	res.send(result);
}

exports.addMuilCompany = async (req, res, next) => {
	const { open_id } = req.session;
	const { company, job } = req.body;
	const result = await member.addMuilCompany({
		open_id,
		company,
		job,
	});
	res.send(result);
}

exports.delMuilCompany = async (req, res, next) => {
	const { open_id } = req.session;
	const { company } = req.body;
	const result = await member.delMuilCompany({
		open_id,
		company,
	});
	res.send(result);
}

exports.selectMuilCompany = async (req, res, next) => {
	const { open_id } = req.session;
	const { company } = req.body;
	const result = await member.selectMuilCompany({
		open_id,
		company,
	});
	res.send(result);
}

/**
 * 切回自己的个人身份
 */
exports.bankToPersonal= async (req, res, next) => {
	const { open_id } = req.session;
	const result = await member.bankToPersonal(open_id);
	res.send(result);
}

/**
 * 创建公司
 */
exports.createCompany = async (req, res, next) => {
	res.render('./pages/memberCreateCompany', {
		position: ['法人','合伙人','注册人','开发','采购','财务','其它'],
	});
}

exports.personalWallet = async (req, res, next) => {
	res.render('./pages/memberWallet');
}

/**
 * 抵价券转手
 */
exports.resaleCoup = async (req, res, next) => {
	const { buyer, no } = req.body;
	const { open_id } = req.session;
	const result = await member.resaleCoup({
		buyer,
		open_id,
		no,
	});
	res.send(result);
}

exports.remoteSearchUserId = async (req, res, next) => {
	const { type, keywords } = url.parse(req.url, true).query;
	const result = await member.remoteSearchUserId({
		type,
		keywords,
	});
	res.send(result);
}

/**
 * 根据openid获取相应的抵价券
 */
this.getWalletCoupByOpenid = async (req, res, next) => {
	const { open_id } = req.session;
	const result = await member.getWalletCoupByOpenid({
		open_id,
	});
	res.send(result);
}

/**
 * 根据uid获取相应的积分券
 */
this.getScoreTicketByUid = async (req, res, next) => {
	const { uid } = req.session;
	const { page, pageSize } = url.parse(req.url, true).query;
	const result = await serviceDeal.MemberScore.getList({ user_id: uid, page, pageSize });
	res.send(result);
}

exports.resaleOrderCoupPage = async (req, res, next) => {
	const { no } = url.parse(req.url, true).query;
	const info = await serviceHomeWallet.couponNoInfo(no);
	res.render('./pages/resaleOrderCoupPage', {
		info,
	});
}

exports.mySource = async (req, res, next) => {
	const { unionid } = req.session;
	const result = await member.getMyActionSource({ unionid });
	res.render('./pages/member_my_source', {
		result: result.data,
	});
}

exports.tempJsonDisplay = async (req, res, next) => {
	const { contentId, name } = url.parse(req.url, true).query;
	const { unionid } = req.session;
	const result = await new Promise(resolve => {
		request.get(CONFIG.actionApiAddr+'/vtc/cfgTemp/' + contentId, (err, response, body) => {
			if (err) {
				reject(err);
			}
			resolve(JSON.parse(body));
		});
	});
	if (result.code === 200) {
		try {
			delete result.data._id;
			const delUrl = `${CONFIG.actionApiAddr}/vtc/cfgTemp/self/${name}`;
			res.render('./pages/jsonDisplay', {
				title: '模板内容',
				result: result.data,
				delUrl,
				unionid,
			});
		} catch (e) {
			res.send(result.data);
		}
	} else {
		res.render('./pages/tip', { tip: result.msg });
	}
}

exports.vtcJsonDisplay = async (req, res, next) => {
	const { sn } = url.parse(req.url, true).query;
	const { unionid } = req.session;
	const result = await new Promise(resolve => {
		request.get(CONFIG.actionApiAddr+'/vtc/nji/' + sn, (err, response, body) => {
			if (err) {
				reject(err);
			}
			resolve(JSON.parse(body));
		});
	});
	if (result.code === 200) {
		try {
			const delUrl = `${CONFIG.actionApiAddr}/vtc/nji/${result.data.info.sn}/${result.data.info._id}`;
			res.render('./pages/jsonDisplay', {
				title: 'vtc',
				result: result.data.config,
				delUrl,
				unionid,
			});
		} catch (e) {
			res.send(result.data);
		}
	} else {
		res.render('./pages/tip', { tip: result.msg });
	}
}

exports.iniJsonDisplay = async (req, res, next) => {
	const { sn } = url.parse(req.url, true).query;
	const { unionid } = req.session;
	const result = await new Promise(resolve => {
		request.get(CONFIG.actionApiAddr+'/maxtest/ini/' + sn, (err, response, body) => {
			if (err) {
				reject(err);
			}
			resolve(JSON.parse(body));
		});
	});
	if (result.code === 200) {
		try {
			const delUrl = `${CONFIG.actionApiAddr}/maxtest/ini/${result.data.info.sn}/${result.data.info._id}`;
			res.render('./pages/jsonDisplay', {
				title: 'ini',
				result: result.data.config,
				delUrl,
				unionid,
			});
		} catch (e) {
			res.send(result.data);
		}
	} else {
		res.render('./pages/tip', { tip: result.msg });
	}
}

exports.myProducts = async (req, res, next) => {
	const { uid } = req.session;
	const data = await member.myProducts({ user_id_arr: [ uid ] });
	res.render('./pages/member_my_products', {
		list: data.data,
	});
}

/**
 * 添加介绍人
 */
exports.addIntroducePerson = async (req, res, next) => {
	const { open_id } = req.session;
	const { phone } = req.body;
	const result = await member.addIntroducePerson({ open_id, phone });
	res.send(result);
}

exports.consumeYBScore = async (req, res, next) => {
	const { unionid } = req.session;
	const { goodsId } = req.body;
	const result = await member.consumeYBScore({ unionid, goodsId });
	res.send(result);
}

exports.exchangeGoodsList = async (req, res, next) => {
	const { data: list } = await member.exchangeGoodsList();
	res.render('./pages/member_exchange_goods_list', {
		list,
	});
}

exports.exchangeGoodsInfo = async (req, res, next) => {
	const { id } = req.params;
	const { data: list } = await member.exchangeGoodsList();
	const selectedItem = list.filter(items => items.id == id)[0];
	if (!selectedItem) {
		res.render('./pages/tip', {
			tip: '不存在',
		});
		return;
	}
	let { description } = selectedItem.dataValues;
	description = description.replace(/\n/g, '</br>');
    description = description.replace(/\s/g, '&nbsp;');
	res.render('./pages/member_exchange_goods_info', {
		info: selectedItem.dataValues,
		description,
	});
}

exports.freeExchangePage = async (req, res, next) => {
	const { unionid } = req.session;
	const result = await member.listFreeExchange({ unionid });
	if (result.data.length === 0) {
		res.render('./pages/tip', { tip: '当前暂无可领取礼品' });
	} else {
		res.render('./pages/member_free_exchange_gift', {
			list: result.data,
		});
	}
}

exports.subFreeExchange = async (req, res, next) => {
	const { unionid } = req.session;
	const { goodsId } = req.body;
	const result = await member.subFreeExchange({ unionid, goodsId });
	res.send(result);
}