const url = require('url');
const path = require('path');
const serviceHomeRepairs = require('../service/homeRepairs');
const base = require('../service/base');

/**
 *  合同列表
 */
this.list = (req,res,next) => {
    let params = url.parse(req.url,true).query;
    serviceHomeRepairs.list(params,(result) => {
        res.send(result);
    });
}

this.getOneById = async (req, res, next) => {
    const { id } = req.params;
    const result = await serviceHomeRepairs.getOneById(id);
    res.send(result);
}

/**
 *  搜索历史维修单
 */
this.searchHistory = async (req, res, next) => {
    let { id, sn } = url.parse(req.url, true).query;
    let snArr;
    try {
        snArr = sn.split(',').filter(items => items);
    } catch (e) {
        snArr = [];
    }
    const result = await serviceHomeRepairs.searchHistory({ id, snArr });
    res.send(result);
}

/**
 *  更新维修单
 */
this.update = (req,res,next) => {
    let params = req.body;
    let admin_id = req.session.admin_id;
    serviceHomeRepairs.update({
        params: params,
        admin_id: admin_id
    },(result) => {
        res.send(result);
    });
}

/**
 *  搜索客户用户中文简称
 */
this.searchCnAbb = (req,res,next) => {
    let params = url.parse(req.url,true).query;
    serviceHomeRepairs.searchCnAbb(params,(result) => {
        res.send(result);
    });
}

/**
 *  添加维修单
 */
this.add = (req,res,next) => {
    let params = req.body.form_data;
    let admin_id = req.session.admin_id;
    serviceHomeRepairs.add({
        params: params,
        admin_id: admin_id
    },(result) => {
        res.send(result);
    });
}

/**
 *  删除维修单
 */
this.del = (req,res,next) => {
    let params = req.body;
    let admin_id = req.session.admin_id;
    serviceHomeRepairs.del({
        params: params,
        admin_id: admin_id
    },(result) => {
        res.send(result);
    });
}

/**
 *  上传图片
 */
this.upload = (req,res,next) => {
	let mulUploadImg = new base.MulUploadImg('/public/img/repair');
	mulUploadImg.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
        });
        mulUploadImg.resize();
        mulUploadImg.smallSize();
        mulUploadImg.anySize(104);
	});
}

/**
 * n年维修率
 * user_id
 */
this.getRepairRateByYear = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeRepairs.getRepairRateByYear(params);
    res.send(result);
}

this.updateRem = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeRepairs.updateRem(params);
    res.send(result);
}

/*********************************** 状态变化 ***************************************/
this.toFirstCheck = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeRepairs.toFirstCheck(params);
    res.send(result);
}

this.toRepairing = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeRepairs.toRepairing(params);
    res.send(result);
}

this.toSecondCheck = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeRepairs.toSecondCheck(params);
    res.send(result);
}

this.toPrepareSend = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeRepairs.toPrepareSend(params);
    res.send(result);
}

this.toHasSend = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeRepairs.toHasSend(params);
    res.send(result);
}

this.toHasReceive = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeRepairs.toHasReceive(params);
    res.send(result);
}

this.getRepairRateData = async (req, res, next) => {
    const result = await serviceHomeRepairs.getRepairRateData();
    res.send(result);
}

this.addRepairMsg = async (req, res, next) => {
    const { admin_id, open_id } = req.session;
    const { sn, content, repair_no } = req.body;
    const result = await serviceHomeRepairs.addRepairMsg({ sn, content, admin_id, open_id, repair_no });
    res.send(result);
}

this.getRepairMsg = async (req, res, next) => {
    const { sn, repair_no } = url.parse(req.url, true).query;
    const result = await serviceHomeRepairs.getRepairMsg({ sn, repair_no });
    res.send(result);
}