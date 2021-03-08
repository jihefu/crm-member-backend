var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var crypto = require('crypto');
var service = require('../action/service');
var member = require('../action/member');
module.exports = function(app){
	app.use('/member', function(req,res,next) {
		check(req,res,next);
	});
	app.use('/member_ajax', function(req,res,next) {
		checkAjax(req,res,next);
	});
	app.get('/member/index', function(req,res,next) {
		member.mainInfo(req,res,next);
	});
	app.get('/member/score', function(req,res,next) {
		member.score(req,res,next);
	});
	app.get('/member/basicInfo', function(req,res,next) {
		member.basicInfo(req,res,next);
	});
	app.get('/member/basicInfo_edit', function(req,res,next) {
		member.basicInfoEdit(req,res,next);
	});
	app.get('/member/businessInfo', function(req,res,next) {
		member.businessInfo(req,res,next);
	});
	app.get('/member/businessInfo_edit', function(req,res,next) {
		member.businessInfoEdit(req,res,next);
	});
	app.get('/member/sign', function(req,res,next) {
		member.sign(req,res,next);
	});
	app.get('/member/reg_history', function(req,res,next) {
		member.regHistory(req,res,next);
	});
	app.get('/member/message', function(req,res,next) {
		member.message(req,res,next);
	});
	app.post('/member/sendToMemberMessage', function(req,res,next) {
		member.sendToMemberMessage(req,res,next);
	});
	app.get('/member/member_credit_trend', function(req,res,next) {
		member.creditTrend(req,res,next);
	});
	app.get('/member/safeSet', function(req,res,next) {
		member.safeSet(req,res,next);
	});
	app.get('/member/bindTip/:open_id', function(req,res,next) {
		member.bindTip(req,res,next);
	});
	//ajax
	app.get('/member/searchMemberByKeywords', function(req,res,next) {
		member.searchMemberByKeywords(req,res,next);
	});
	app.get('/member_ajax/getRegList', function(req,res,next) {
		member.regHistory(req,res,next);
	});
	app.put('/member_ajax/dealBind/:open_id', function(req,res,next) {
		member.dealBind(req,res,next);
	});
	app.put('/member_ajax/dealUnbind/:open_id', function(req,res,next) {
		member.dealUnbind(req,res,next);
	});
	app.get('/member_ajax/getList', function(req,res,next) {
		member.message(req,res,next);
	});
	app.put('/member_ajax/subBasicInfo', function(req,res,next) {
		member.subBasicInfo(req,res,next);
	});
	app.post('/member_ajax/upload', function(req,res,next) {
		member.upload(req,res,next);
	});
	app.put('/member_ajax/subBnsInfo', function(req,res,next) {
		member.subBnsInfo(req,res,next);
	});
	app.post('/member_ajax/sign', function(req,res,next) {
		member.checkIn(req,res,next);
	});
	app.put('/member_ajax/setStar', function(req,res,next) {
		member.setStar(req,res,next);
	});
	app.get('/member/manage', function(req,res,next) {
		member.manage(req,res,next);
	});
	app.get('/member/dynamic/:open_id', function(req,res,next) {
		member.dynamic(req,res,next);
	});
	app.get('/member/msgList/:open_id', function(req,res,next) {
		member.msgListTargetItem(req,res,next);
	});
	app.get('/member_ajax/getDynamicMsg', function(req,res,next) {
		member.getDynamicMsg(req,res,next);
	});
	app.post('/member_ajax/checkJob', function(req,res,next) {
		member.checkJob(req,res,next);
	});
	app.get('/member/report', function(req,res,next) {
		member.report(req,res,next);
	});
	app.get('/member_ajax/credit', function(req,res,next) {
		member.credit(req,res,next);
	});
	app.get('/member/rec_list', function(req,res,next) {
		member.recList(req,res,next);
	});
	app.get('/member/over_list', function(req,res,next) {
		member.overList(req,res,next);
	});
	app.get('/member/freeze_list', function(req,res,next) {
		member.freezeList(req,res,next);
	});
	app.get('/member/contracts_list', function(req,res,next) {
		member.contractsList(req,res,next);
	});
	app.get('/member/payments_list', function(req,res,next) {
		member.paymentsList(req,res,next);
	});
	app.get('/member/salesman_info', function(req,res,next) {
		member.salesmanInfo(req,res,next);
	});
	app.get('/member/sendSMS', function(req,res,next) {
		member.sendSMS(req,res,next);
	});
	app.post('/member/sendSMSContent', function(req,res,next) {
		member.sendSMSContent(req,res,next);
	});

	app.get('/member/onlineService', function(req,res,next) {
		member.onlineService(req,res,next);
	});
	app.get('/member/hotLine', function(req,res,next) {
		member.hotLine(req,res,next);
	});
	app.get('/member/getHotList', function(req,res,next) {
		member.getHotList(req,res,next);
	});
	app.post('/member/addHostMsg', function(req,res,next) {
		member.addHostMsg(req,res,next);
	});
	app.post('/member/uploadImgToHotLine', function(req,res,next) {
		member.uploadImgToHotLine(req,res,next);
	});
	app.post('/member/uploadFileToHotLine', function(req,res,next) {
		member.uploadFileToHotLine(req,res,next);
	});
	app.get('/member/specialLine', function(req,res,next) {
		member.specialLine(req,res,next);
	});
	app.get('/member/getSpecialList', function(req,res,next) {
		member.getSpecialList(req,res,next);
	});
	app.post('/member/addSpecialMsg', function(req,res,next) {
		member.addSpecialMsg(req,res,next);
	});
	
	app.get('/getTemporaryList', function(req,res,next) {
		member.getHotList(req,res,next);
	});
	app.post('/addTemporaryMsg', function(req,res,next) {
		member.addHostMsg(req,res,next);
	});
	app.post('/uploadImgToTemporaryLine', function(req,res,next) {
		member.uploadImgToHotLine(req,res,next);
	});
	app.get('/member/getSpecialLineInfoByCustomerId', function(req,res,next) {
		member.getSpecialLineInfoByCustomerId(req,res,next);
	});
	app.put('/member/updateOuterContact', function(req,res,next) {
		member.updateOuterContact(req,res,next);
	});
	app.put('/member/checkWxServerMsg', function(req,res,next) {
		member.checkWxServerMsg(req,res,next);
	});
	app.get('/member/coupon', function(req,res,next) {
		member.coupon(req,res,next);
	});
	app.get('/member/depo', function(req,res,next) {
		member.depo(req,res,next);
	});
	app.get('/member/depo/:contract_no', function(req,res,next) {
		member.depoInfo(req,res,next);
	});
	app.get('/member/activityRecord', function(req,res,next) {
		member.activityRecord(req,res,next);
	});
	app.get('/member/walletInfo', function(req,res,next) {
		member.walletInfo(req,res,next);
	});
	app.get('/open/getNearMember', function(req,res,next) {
		member.getNearMember(req,res,next);
	});
	app.get('/member/certList', function(req,res,next) {
		member.certList(req,res,next);
	});
	app.get('/member/historyStar', function(req,res,next) {
		member.historyStar(req,res,next);
	});
	app.get('/member/userCardList', function(req,res,next) {
		member.userCardList(req,res,next);
	});

	
	app.get('/member/changeCompany', function(req,res,next) {
		member.changeCompany(req,res,next);
	});
	app.get('/member/getMuilCompanyList', function(req,res,next) {
		member.getMuilCompanyList(req,res,next);
	});
	app.post('/member/addMuilCompany', function(req,res,next) {
		member.addMuilCompany(req,res,next);
	});
	app.delete('/member/delMuilCompany', function(req,res,next) {
		member.delMuilCompany(req,res,next);
	});
	app.put('/member/selectMuilCompany', function(req,res,next) {
		member.selectMuilCompany(req,res,next);
	});
	app.put('/member/bankToPersonal', function(req,res,next) {
		member.bankToPersonal(req,res,next);
	});
	app.get('/member/createCompany', function(req,res,next) {
		member.createCompany(req,res,next);
	});
	app.get('/member/personalWallet', function(req,res,next) {
		member.personalWallet(req,res,next);
	});
	app.put('/member/resaleCoup', function(req,res,next) {
		member.resaleCoup(req,res,next);
	});
	app.get('/member/remoteSearchUserId', function(req,res,next) {
		member.remoteSearchUserId(req,res,next);
	});
	app.get('/member/getWalletCoupByOpenid', function(req,res,next) {
		member.getWalletCoupByOpenid(req,res,next);
	});
	app.get('/member/getScoreTicketByUid', function(req,res,next) {
		member.getScoreTicketByUid(req,res,next);
	});
	app.get('/member/resaleOrderCoupPage', function(req,res,next) {
		member.resaleOrderCoupPage(req,res,next);
	});
	app.get('/member/mySource', function(req,res,next) {
		member.mySource(req,res,next);
	});
	app.get('/member/tempJsonDisplay', function(req,res,next) {
		member.tempJsonDisplay(req,res,next);
	});
	app.get('/member/vtcJsonDisplay', function(req,res,next) {
		member.vtcJsonDisplay(req,res,next);
	});
	app.get('/member/iniJsonDisplay', function(req,res,next) {
		member.iniJsonDisplay(req,res,next);
	});
	app.get('/member/myProducts', function(req,res,next) {
		member.myProducts(req,res,next);
	});
	app.post('/member/addIntroducePerson', function(req,res,next) {
		member.addIntroducePerson(req,res,next);
	});
	app.get('/member/exchangeGoodsList', function(req,res,next) {
		member.exchangeGoodsList(req,res,next);
	});
	app.get('/member/exchangeGoodsInfo/:id', function(req,res,next) {
		member.exchangeGoodsInfo(req,res,next);
	});
	app.post('/member/consumeYBScore', function(req,res,next) {
		member.consumeYBScore(req,res,next);
	});
	app.get('/member/freeExchange', function(req,res,next) {
		member.freeExchangePage(req,res,next);
	});
	app.post('/member/freeExchange', function(req,res,next) {
		member.subFreeExchange(req,res,next);
	});

	function check(req,res,next){
		service.checkOpenId(req,res,next,function(){
			service.checkPerson(req,res,next,function(result){
				var open_id = req.session.open_id;
				member.memberInfo(open_id,function(result){
					req.session.name = result.name;
					req.session.phone = result.phone;
					next();
				});
			});
		});
	}
	function checkAjax(req,res,next){
		if(!req.session.name){
			SEND(res,-100,'身份过期，请重新进入',[]);
			return;
		}else{
			next();
		}
	}
}