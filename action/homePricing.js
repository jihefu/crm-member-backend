const url = require('url');
const path = require('path');
const serviceHomePricing = require('../service/homePricingList');

/**
 *  获取合同列表
 */
this.list = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomePricing.list(params,result => {
        res.send(result);
    });
}

/**
 *  指定id或合同号的定价单
 */
this.getTargetItem = (req,res,next) => {
    const { targetKey } = req.params;
    serviceHomePricing.getTargetItem({
        targetKey: targetKey
    },result => {
        res.send(result);
    });
}

/**
 *  产品库远程搜索
 */
this.searchProductsLibrary = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomePricing.searchProductsLibrary(params,result => {
        res.send(result);
    });
}

/**
 *  更新定价单
 */
this.update = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomePricing.update({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 * 新增定价单货品条目
 */
exports.addGoods = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomePricing.addGoods(params);
    res.send(result);
}

/**
 * 删除定价单货品条目
 */
exports.delGoods = async (req, res, next) => {
    const { id } = req.params;
    const result = await serviceHomePricing.delGoods(id);
    res.send(result);
}

/**
 *  同意
 */
this.agree = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomePricing.agree({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  不同意
 */
this.notAgree = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomePricing.notAgree({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  撤销审核
 */
this.rebackCheck = (req,res,next) => {
    const { id } = req.body;
    const admin_id = req.session.admin_id;
	serviceHomePricing.rebackCheck({
        id: id,
        admin_id: admin_id
	},result => {
		res.send(result);
	});
}

/**
 *  获取业绩信息
 */
this.getAchievementInfo = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomePricing.getAchievementInfo(params,result => {
		res.send(result);
	});
}

this.getClosedAchievementInfo = async (req, res, next) => {
    const params = url.parse(req.url,true).query;
    const result = await serviceHomePricing.calculClosedAchievement(params);
    res.send(result);
}

/**
 *  获取新客户的业绩
 */
this.getNewCusAchievementInfo = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomePricing.getNewCusAchievementInfo(params,result => {
		res.send(result);
	});
}

this.getSum = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomePricing.getSum(params,result => {
		res.send(result);
	});
}

/**
 * 新客户递延业绩
 */
this.newCustomerDeferred = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomePricing.newCustomerDeferred(params,result => {
		res.send(result);
	});
}

this.filterNewCustomerContractByContract = async (req, res) => {
    const params = req.body;
    const result = await serviceHomePricing.filterNewCustomerContractByContract(params);
    res.send(result);
}

/**
 * 获取递延发货和递延退货数据（2021-01-05）
 */
this.getDeferredAchievement = async (req, res) => {
    const params = url.parse(req.url,true).query;
    const result = await serviceHomePricing.getDeferredAchievement(params);
    res.send(result);
}

/**
 * 获取递延发货和递延退货数据（2021-01-05）
 */
this.getDeferredPayable = async (req, res) => {
    const params = url.parse(req.url,true).query;
    const result = await serviceHomePricing.getDeferredPayable(params);
    res.send(result);
}