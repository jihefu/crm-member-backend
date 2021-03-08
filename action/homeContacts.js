const url = require('url');
const path = require('path');
const serviceHomeContacts = require('../service/homeContacts');
const base = require('../service/base');

/**
 *	联系人列表
 */
this.list = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeContacts.list(params,(result) => {
		res.send(result);
	});
}

/**
 *  根据id获取指定联系人条目
 */
this.getTargetItem = (req,res,next) => {
	let id = req.params.id;
	serviceHomeContacts.getTargetItem({
		id: id
	},(result) => {
		res.send(result);
	});
}

this.checkAdd = async (req, res, next) => {
	const params = req.body;
	const result = await serviceHomeContacts.checkAdd(params);
	res.send(result);
}

/**
 *	插入联系人数据列表
 */
this.add = (req,res,next) => {
	let form_data = req.body.form_data;
	let admin_id = req.session.admin_id;
	const isCover = req.body.isCover;
	serviceHomeContacts.add({
		form_data: form_data,
		admin_id: admin_id,
		isCover,
	},(result) => {
		res.send(result);
	});
}

/**
 *	更新联系人数据列表
 */
this.update = (req,res,next) => {
	let form_data = req.body.form_data;
	let admin_id = req.session.admin_id;
	serviceHomeContacts.update({
		form_data: form_data,
		admin_id: admin_id
	},(result) => {
		res.send(result);
	});
}

this.delContact = async (req, res, next) => {
	let { form_data } = req.body;
	form_data = typeof form_data === 'string' ? JSON.parse(form_data) : form_data;
	const result = await serviceHomeContacts.delContact({
		id: form_data.id,
		admin_id: req.session.admin_id,
	});
	res.send(result);
}

/**
 *  上传图片
 */
this.upload = (req,res,next) => {
	let mulUploadImg = new base.MulUploadImg('/public/img/contacts');
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
 *  搜索联系方式
 */
this.searchInfoByName = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeContacts.searchInfoByName(params,(result) => {
		res.send(result);
	});
}

/**
 *  输入关键字
 *  获取联系人会员的信息
 */
this.searchInfoByKeywords = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeContacts.searchInfoByKeywords(params,(result) => {
		res.send(result);
	});
}

exports.getAmountInProvince = async (req, res, next) => {
	const result = await serviceHomeContacts.getAmountInProvince();
	res.send(result);
}