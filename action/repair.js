var express = require('express');
var url = require('url');
var path = require('path');
var request = require('request');
var repair = require('../service/repair');
var serverHomeRepair = require('../service/homeRepairs');
const serviceHomeOutput = require('../service/homeOutput');
const actionHomeContacts = require('../action/homeContacts');
const actionHomeOutput = require('../action/homeOutput');

/**
 * 	获得名字和公司信息（认证中间件）
 */
this.getNameAndAbb = function(params,cb){
	var open_id = params.open_id;
	repair.getNameAndAbb({
		open_id: open_id
	},function(result){
		cb(result);
	});
}

/**
 * 	获得维修列表
 */
this.getList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var num = params.num;
	var keywords = params.keywords;
	var filter = params.filter;
	var cn_abb = req.session.cn_abb_for_repair;
	var code = req.session.code;
	const repairId = req.session.repairId;
	const { unionid } = req.session;
	repair.getList({
		page,
		num,
		keywords,
		filter,
		cn_abb,
		code,
		repairId,
		unionid,
	},function(result){
		if(page==undefined){
			res.render('./pages/repair_list',{
				result: result.data.res_arr,
				arr: result.data.album_arr,
				code,
			});
		}else{
			SEND(res,200,'',result.data);
		}
	});	
}

/**
 * 	获得维修单信息
 */
this.getInfo = function(req,res,next){
	var repair_contractno = url.parse(req.url,true).pathname.split('info/')[1];
	repair_contractno = decodeURIComponent(repair_contractno);
	var cn_abb = req.session.cn_abb_for_repair;
	const { repairId, code } = req.session;
	const { unionid } = req.session;
	repair.getInfo({
		repair_contractno,
		cn_abb,
		code,
		repairId,
		unionid,
	},function(result){
		if (result.code == -1) {
			res.render('./pages/tip', {
				tip: result.msg,
			});
			return;
		} else {
			let isStaff = 0;
			if (code.includes(10001)) {
				isStaff = 1;
			}
			res.render('./pages/repair_info',{
				result: result.data.res_arr,
				status: result.data.status,
				data: result.data.data,
				isStaff,
			});
		}
	});
}

this.stateDetail = async (req, res, next) => {
	const { no } = req.params;
	const { code } = req.session;
	const result = await repair.stateDetail({ no });
	if (result.code === -1) {
		res.render('./pages/tip', {
			tip: result.msg,
		});
	} else {
		if (result.data.deliver_state == '关闭') {
			res.render('./pages/tip', {
				tip: '该维修单已关闭',
			});
		} else {
			if (code.includes(10001)) {
				res.render('./pages/repairStateDatailStaff', {
					data: result.data,
				});
			} else {
				res.render('./pages/repairStateDatail', {
					data: result.data,
				});
			}
		}
	}
}

/**
 * 	查看图片轮播
 */
this.slider = function(req,res,next){
	var repair_contractno = url.parse(req.url,true).pathname.split('slider/')[1];
	repair_contractno = decodeURIComponent(repair_contractno);
	var cn_abb = req.session.cn_abb_for_repair;
	var code = req.session.code;
	const { repairId } = req.session;
	repair.getInfo({
		repair_contractno,
		cn_abb,
		code,
		repairId,
	},function(result){
		var res_arr = result.data.res_arr;
		var album_arr;
		res_arr.forEach(function(items,index){
			if(items.column_name=='album'){
				album_arr = items.val.split(',');
			}
		});
		res.render('./pages/contract_slider',{
			result: album_arr,
			title: '维修件照片'
		});
	});
}

/**
 * 	确认收货
 */
this.takeGoods = function(req,res,next){
	var no = decodeURIComponent(req.body.no);
	var name = req.session.name;
	const open_id = req.session.open_id;
	repair.takeGoods({
		no: no,
		name: name,
		open_id,
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 * 	提交
 */
this.sub = function(req,res,next){
	var data = req.body;
	var no = req.body.repair_contractno;
	var admin_id = req.session.admin_id;
	repair.sub({
		data: data,
		admin_id: admin_id
	},function(){
		res.redirect(ROUTE('repair/info/'+no));
	});
}

/**
 * 	下一状态
 */
this.nextStatus = function(req,res,next){
	var no = req.body.no;
	var status = req.body.status;
	var admin_id = req.session.admin_id;
	var data = {};
	data.repair_contractno = no;
	data.deliver_state = status;
	repair.sub({
		data: data,
		admin_id: admin_id
	},function(){
		SEND(res,200,'',[]);
	});
}

exports.updateAlbum = async (req, res, next) => {
	const params = req.body;
	params.admin_id = req.session.admin_id;
	const result = await repair.updateAlbum(params);
	res.send(result);
}

this.getNotDeliveryNoBySn = async (req, res, next) => {
	const { sn, type } = url.parse(req.url, true).query;
	const result = await serverHomeRepair.getNotDeliveryNoBySn(sn);
	if (type == 'json') {
		res.send(result);
	} else {
		if (result.code === 200) {
			res.redirect('/repair/info/' + result.data.repair_contractno);
		} else {
			res.redirect('/repair/addRepair?sn=' + sn);
		}
	}
}

this.addRepair = async (req, res, next) => {
	const { sn } = url.parse(req.url, true).query;
	res.render('./pages/addRepair', {
		sn,
	});
}

this.searchCnAbb = async (req, res, next) => {
	const params = url.parse(req.url, true).query;
	serverHomeRepair.searchCnAbb(params, result => {
		result.data = result.data.slice(0, 5);
		res.send(result.data);
	});
}

this.createRepairNo = async (req, res, next) => {
	const params = req.body;
	const { admin_id } = req.session;
	const result = await serverHomeRepair.add({
		params: JSON.stringify(params),
		admin_id,
	});
	res.send(result);
}

this.deliverGoods = async (req, res, next) => {
	const { code } = req.session;
	if (!code.includes(10001)) {
		res.render('./pages/tip', {
			tip: '非法访问',
		});
		return;
	}
	res.render('./pages/deliverGoods');
}

this.searchFullCpy = async (req, res, next) => {
	const { keywords } = url.parse(req.url, true).query;
	serviceHomeOutput.searchCpy({ keywords }, result => {
		res.send(result.data);
	});
}

this.searchContactsInfoByKeywords = async (req, res, next) => {
	actionHomeContacts.searchInfoByKeywords(req, res, next);
}

this.addDeliveryNo = async (req, res, next) => {
	actionHomeOutput.add(req, res, next);
}

this.msg = async (req, res, next) => {
	const { sn, repair_no } = url.parse(req.url, true).query;
	const repairResult = await repair.getInfo({ repair_contractno: repair_no, code: [10001] });
	const { deliver_state } = repairResult.data.data;
	const result = await serverHomeRepair.getRepairMsg({ sn, repair_no });
	result.data.forEach((items, index) => {
		result.data[index].dataValues.send_time = TIME(items.dataValues.send_time);
	});
	res.render('./pages/repairMsg', {
		list: result.data,
		sn,
		repair_no,
		deliver_state,
	});
}