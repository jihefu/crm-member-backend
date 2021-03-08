const url = require('url');
const path = require('path');
const serviceHomeContracts = require('../service/homeContracts');
const base = require('../service/base');
const contracts = require('../service/contract');

/**
 *  合同列表
 */
this.list = (req,res,next) => {
    let params = url.parse(req.url,true).query;
    const { admin_id } = req.session;
    params.admin_id = admin_id;
    serviceHomeContracts.list(params,(result) => {
        res.send(result);
    });
}

/**
 *  restful
 */
this.getTargetItem = (req,res,next) => {
    const { targetKey } = req.params;
    serviceHomeContracts.getTargetItem({
        targetKey: targetKey
    },(result) => {
        res.send(result);
    });
}

this.getTargetItemBody = (req,res,next) => {
    const { targetKey } = req.params;
    serviceHomeContracts.getTargetItemBody({
        targetKey: targetKey
    },(result) => {
        res.send(result);
    });
}

exports.getPackingList = async (req, res, next) => {
    const { id } = req.params;
    const result = await contracts.getPackingList({ contractId: id });
    res.send(result);
}

/**
 *  新增合同
 */
this.add = (req,res,next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeContracts.add(params,result => {
        res.send(result);
    });
}

this.addAgain = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeContracts.addAgain(params, result => {
        res.send(result);
    });
}

/**
 *  更新合同
 */
this.update = (req,res,next) => {
    let params = req.body;
    let admin_id = req.session.admin_id;
    serviceHomeContracts.update({
        params: params,
        admin_id: admin_id
    },(result) => {
        res.send(result);
    });
}

exports.turnToAllowDelivery = async (req, res, next) => {
    const { contract_no } = req.params;
    const { admin_id } = req.session;
    const result = await serviceHomeContracts.turnToAllowDelivery({ contract_no, admin_id });
    res.send(result);
}

exports.queryExpress = async (req, res, next) => {
    const { no } = req.params;
    const result = await serviceHomeContracts.queryExpress({ no });
    res.send(result);
}

/**
 *  删除合同
 */
this.del = (req,res,next) => {
    let params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeContracts.deleteContract(params,(result) => {
        res.send(result);
    });
}

/**
 *  上传图片
 */
this.upload = (req,res,next) => {
	let mulUploadImg = new base.MulUploadImg('/public/img/contract');
	mulUploadImg.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
        });
        mulUploadImg.resize();
        mulUploadImg.smallSize();
	});
}

/**
 *  远程保证金搜索
 */
this.remoteSearchForDeposit = (req,res,next) => {
    const { keywords,cus_abb } = url.parse(req.url,true).query;
	serviceHomeContracts.remoteSearchForDeposit({
        keywords: keywords,
        cus_abb: cus_abb
	},result => {
		res.send(result);
	});
}

/**
 *  获取所有已选择过的货品以及型号单价
 */
this.getAllProductsSelected = (req,res,next) => {
	serviceHomeContracts.getAllProductsSelected({},result => {
		res.send(result);
	});
}

/**
 *  修改合同物品的后三项
 */
this.changeGoods = (req,res,next) => {
	const params = req.body;
	serviceHomeContracts.changeGoods(params,result => {
		res.send(result);
	});
}

this.getSum = (req,res,next) => {
	const params = url.parse(req.url,true).query;
	serviceHomeContracts.getSum(params,result => {
		res.send(result);
	});
}

this.newCustomerDeferred = (req,res,next) => {
	const params = url.parse(req.url,true).query;
	serviceHomeContracts.newCustomerDeferred(params,result => {
		res.send(result);
	});
}

exports.getAmountInProvince = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeContracts.getAmountInProvince(params);
    res.send(result);
}

exports.updateGoodsType = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeContracts.updateGoodsType(params);
    res.send(result);
}

this.removeVirSnToOther = async (req, res, next) => {
	const { contract_no } = req.params;
	const result = await serviceHomeContracts.removeVirSnToOther({ contract_no });
	res.send(result);
}

exports.returnGoods = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeContracts.returnGoods(params);
    res.send(result);
}

exports.subSnRem = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeContracts.subSnRem(params);
    res.send(result);
}

/********************************************* 装盘单 **************************************************/

exports.getAssembleDisk = async (req, res, next) => {
    const { contract_id } = url.parse(req.url, true).query;
    const result = await contracts.getAssembleDisk({ contract_id });
    res.send(result);
}

exports.createAssembleDisk = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await contracts.createAssembleDisk(params);
    res.send(result);
}

exports.createAssembleDiskBatch = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await contracts.createAssembleDiskBatch(params);
    res.send(result);
}

// 改变安装盘
exports.changeDiskBatch = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await contracts.changeDiskBatch(params);
    res.send(result);
}