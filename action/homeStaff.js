const url = require('url');
const path = require('path');
const serviceHomeStaff = require('../service/homeStaff');
const base = require('../service/base');

/**
 *	员工列表
 */
this.list = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeStaff.list(params,(result) => {
		res.send(result);
	});
}

/**
 *	获得指定id的信息
 */
this.getTargetItem = (req,res,next) => {
	let id = req.params.id;
	serviceHomeStaff.getTargetItem({
		id: id
	},(result) => {
		res.send(result);
	});
}

/**
 *	根据行政等级获取员工
 */
this.getListByLevel = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeStaff.getListByLevel(params,(result) => {
		res.send(result);
	});
}

/**
 *  获取所有在职员工信息
 */
this.staffAll = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeStaff.staffAll(params,(result) => {
		res.send(result);
	});
}

/**
 *  user_id转换成user_name
 */
this.idTransToName = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeStaff.idTransToName(params,(result) => {
		res.send(result);
	});
}

/**
 *	员工自身信息
 */
this.self = (req,res,next) => {
	let admin_id = req.session.admin_id;
	serviceHomeStaff.self({
		admin_id: admin_id
	},(result) => {
		res.send(result);
	});
}

/**
 *  获取定价单操作权限
 */
this.getPricingAuth = (req,res,next) => {
	serviceHomeStaff.getPricingAuth({},result => {
		res.send(result);
	});
}

/**
 *	更新员工信息
 */
this.update = (req,res,next) => {
	let form_data = JSON.parse(req.body.form_data);
	let admin_id = req.session.admin_id;
	serviceHomeStaff.update({
		form_data: form_data,
		admin_id: admin_id
	},(result) => {
		res.send(result);
	});
}

/**
 * 批量删除员工
 */
exports.delBatch = async (req, res, next) => {
	const params = req.body;
	params.admin_id = req.session.admin_id;
	const result = await serviceHomeStaff.delBatch(params);
	res.send(result);
}

/**
 *	新增员工信息
 */
this.add = (req,res,next) => {
	let form_data = JSON.parse(req.body.form_data);
	let admin_id = req.session.admin_id;
	serviceHomeStaff.add({
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
	let mulUploadImg = new base.MulUploadImg('/public/img/employees');
	mulUploadImg.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
		});
	});
	mulUploadImg.resize();
}

/**
 *  远程搜索
 */
this.remoteSearchStaff = (req,res,next) => {
	const params = url.parse(req.url,true).query;
	serviceHomeStaff.remoteSearchStaff(params,result => {
		res.send(result);
	});
}