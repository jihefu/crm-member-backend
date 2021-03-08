const url = require('url');
const path = require('path');
const serviceHomeProductsLibrary = require('../service/homeProductsLibrary');

/**
 *  获取成本列表
 */
this.list = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeProductsLibrary.list(params,result => {
        res.send(result);
    });
}

/**
 *  指定物品成本
 */
this.getTargetItem = (req,res,next) => {
    const { targetKey } = req.params;
    serviceHomeProductsLibrary.getTargetItem({
        targetKey: targetKey
    },result => {
        res.send(result);
    });
}

/**
 *  添加成本
 */
this.add = (req,res,next) => {
    const admin_id = req.session.admin_id;
    const form_data = req.body;
    serviceHomeProductsLibrary.add({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  更新成本
 */
this.update = (req,res,next) => {
    const admin_id = req.session.admin_id;
    const form_data = req.body;
    serviceHomeProductsLibrary.update({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  删除成本
 */
this.del = (req,res,next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeProductsLibrary.del(params,result => {
        res.send(result);
    });
}

/**
 *  产品库远程搜索
 */
this.searchProductsLibrary = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeProductsLibrary.searchProductsLibrary(params,result => {
        res.send(result);
    });
}

/**
 *  获取物品种类
 */
this.getGoodsType = (req,res,next) => {
    serviceHomeProductsLibrary.getGoodsType({},result => {
        res.send(result);
    });
}

/**
 *  获取现场服务成本
 */
this.getServerPriceMap = (req,res,next) => {
	res.send({
        code: 200,
        msg: '',
        data: CONFIG.serverPriceMap
    });
}

exports.updateCount = (req,res,next) => {
    const { id } = req.params;
	serviceHomeProductsLibrary.updateCount(id,result => {
        res.send(result);
    });
}

exports.getWorkHoursChartData = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeProductsLibrary.getWorkHoursChartData(params);
    res.send(result);
}

exports.getDerredData = async (req, res, next) => {
    const result = await serviceHomeProductsLibrary.getDerredData();
    res.send(result);
}