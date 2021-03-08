const url = require('url');
const path = require('path');
const serviceHomeContactsOrder = require('../service/homeContactsOrder');
const base = require('../service/base');
const hybridApp = require('../service/hybrid_app');

/**
 *  列表
 */
this.list = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	let admin_id = req.session.admin_id;
	serviceHomeContactsOrder.list({
		params: params,
		admin_id: admin_id
	},(result) => {
		res.send(result);
	});
}

/**
 *  更新
 */
this.update = (req,res,next) => {
	let form_data = req.body.form_data;
	let admin_id = req.session.admin_id;
	serviceHomeContactsOrder.update({
		form_data: form_data,
		admin_id: admin_id
	},result => {
		res.send(result);
	});
}

/**
 *  获取在线信息
 */
this.getUserStatusInfo = (req,res,next) => {
	const params = url.parse(req.url,true).query;
	serviceHomeContactsOrder.getUserStatusInfo(params,result => {
		res.send(result);
	});
}

/**
 *  获取标签
 */
this.getTags = (req,res,next) => {
	serviceHomeContactsOrder.getTags(result => {
		res.send(result);
	});
}

/**
 *  获取指定联系单
 */
this.getTargetOrder = (req,res,next) => {
	const id = req.params.id;
	hybridApp.orderInfo({
		id: id
	},result => {
		res.send({
			code: 200,
			msg: '',
			data: result[0]
		});
	});
}