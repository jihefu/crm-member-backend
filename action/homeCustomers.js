const url = require('url');
const path = require('path');
const serviceHomeCustomers = require('../service/homeCustomers');
const base = require('../service/base');
const oldFileCustomers = require('../service/customers');

/**
 *	客户数据列表
 */
this.list = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeCustomers.list(params,(result) => {
		res.send(result);
	});
}

this.getAllCustomers = async (req, res, next) => {
	const result = await oldFileCustomers.getAllCustomers();
	res.send(result);
}

this.typeDList = (req, res, next) => {
	const params = url.parse(req.url, true).query;
	oldFileCustomers.typeDList(params, result => {
		res.send(result);
	});
}

/**
 *	获取指定id的信息
 */
this.getTargetItem = (req,res,next) => {
	let { targetKey } = req.params;
	serviceHomeCustomers.getTargetItem({
		targetKey: targetKey
	},(result) => {
		res.send(result);
	});
}

/**
 *	插入客户数据列表
 */
this.add = (req,res,next) => {
	let form_data = req.body.form_data;
	let admin_id = req.session.admin_id;
	serviceHomeCustomers.add({
		form_data: form_data,
		admin_id: admin_id
	},(result) => {
		res.send(result);
	});
}

/**
 *	更新客户数据列表
 */
this.update = (req,res,next) => {
	let form_data = req.body.form_data;
	let admin_id = req.session.admin_id;
	serviceHomeCustomers.update({
		form_data: form_data,
		admin_id: admin_id
	},(result) => {
		res.send(result);
	});
}

/**
 *  上传图片
 */
this.upload = (req,res,next) => {
	let mulUploadImg = new base.MulUploadImg('/public/img/customers');
	mulUploadImg.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
		});
		mulUploadImg.resize();
	});
}

/**
 *  公司列表（远程搜索用）
 */
this.remoteSearchCustomers = (req,res,next) => {
	const keywords = url.parse(req.url,true).query.keywords;
	serviceHomeCustomers.remoteSearchCustomers({
		keywords: keywords
	},result => {
		res.send(result);
	});
}

/**
 * 导出指定字段
 */
this.exportXlsx = (req,res,next) => {
	const params = req.body;
	serviceHomeCustomers.exportXlsx(params,result => {
		res.send(result);
	});
}

/**
 * 获取指定公司的评级记录
 */
this.getRatingHistoryList = (req,res,next) => {
	const params = url.parse(req.url,true).query;
	serviceHomeCustomers.getRatingHistoryList(params,result => {
		res.send(result);
	});
}

/**
 * 新增评级记录
 */
this.addRatingHistory = (req,res,next) => {
	const params = req.body;
	serviceHomeCustomers.addRatingHistory(params,result => {
		res.send(result);
	});
}

exports.uploadDSolution = async (req, res, next) => {
	const file = req.file;
	const { user_id } = req.params;
	const { originalname } = file;
	// 存下文件，改变意向度以及热度
	// 检查改公司是否有会员
	const checkRes = await oldFileCustomers.checkExistMember({
		user_id,
	});
	if (checkRes.code === -1) {
		res.send(checkRes);
		return;
	}
	const result = await oldFileCustomers.changeIntentDegree({
		intent_degree: 4,
		user_id,
		technical_solution: originalname,
	});
	res.send(result);
}

exports.changeDegree = async (req, res, next) => {
	const { user_id } = req.params;
	const { intent_degree } = req.body;
	const result = await oldFileCustomers.changeIntentDegree({
		intent_degree,
		user_id,
	});
	res.send(result);
}