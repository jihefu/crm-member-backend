const url = require('url');
const path = require('path');
const serviceHomeOutput = require('../service/homeOutput');

/**
 *	发货数据列表
 */
this.list = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeOutput.list(params,(result) => {
		res.send(result);
	});
}

/**
 *  获取指定发货记录
 */
this.getTargetItem = (req,res,next) => {
	let targetKey = req.params.targetKey;
	serviceHomeOutput.getTargetItem({
		targetKey: targetKey
	},(result) => {
		res.send(result);
	});
}

/**
 *	更新指定发货记录
 */
this.update = (req,res,next) => {
	let form_data = req.body.form_data;
	let admin_id = req.session.admin_id;
	serviceHomeOutput.update({
		admin_id: admin_id,
		form_data: form_data
	},(result) => {
		res.send(result);
	});
}

/**
 *	新增发货记录
 */
this.add = (req,res,next) => {
	let form_data = req.body.form_data;
	let admin_id = req.session.admin_id;
	serviceHomeOutput.add({
		admin_id: admin_id,
		form_data: form_data
	},(result) => {
		res.send(result);
	});
}

/**
 *	搜索公司
 */
this.searchCpy = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeOutput.searchCpy(params,(result) => {
		res.send(result);
	});
}

/**
 *	搜索单号
 */
this.searchNo = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeOutput.searchNo(params,(result) => {
		res.send(result);
	});
}