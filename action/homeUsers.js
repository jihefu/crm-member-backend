const url = require('url');
const path = require('path');
const serviceHomeUsers = require('../service/homeUsers');
const base = require('../service/base');

/**
 *	用户数据列表
 */
this.list = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeUsers.list(params,(result) => {
		res.send(result);
	});
}

/**
 *	插入用户数据列表
 */
this.add = (req,res,next) => {
	let form_data = req.body.form_data;
	let admin_id = req.session.admin_id;
	serviceHomeUsers.add({
		form_data: form_data,
		admin_id: admin_id
	},(result) => {
		res.send(result);
	});
}

/**
 *	更新用户数据列表
 */
this.update = (req,res,next) => {
	let form_data = req.body.form_data;
	let admin_id = req.session.admin_id;
	serviceHomeUsers.update({
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
	let mulUploadImg = new base.MulUploadImg('/public/img/users');
	mulUploadImg.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
		});
		mulUploadImg.resize();
	});
}