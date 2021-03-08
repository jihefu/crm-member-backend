const url = require('url');
const serviceSeckill = require('../service/seckill');

/************************************** 管理员操作区 *****************************************/
/**
 * 创建秒杀
 */
exports.createSeckillOrder = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceSeckill.createSeckillOrder(params);
    res.send(result);
}

/**
 * 删除秒杀记录
 */
exports.delSeckillOrder = async (req, res, next) => {
    const { order_id } = req.params;
    const { goods_id } = req.body;
    const { admin_id } = req.session;
    const result = await serviceSeckill.delSeckillOrder({ order_id, goods_id, admin_id });
    res.send(result);
}

/**
 * 修改秒杀信息
 * 开始时间，计划数量，存活时间，秒杀价
 */
exports.updateSeckillOrder = async (req, res, next) => {
    const params = req.body;
    const { admin_id } = req.session;
    const result = await serviceSeckill.updateSeckillOrder({ formData: params, admin_id });
    res.send(result);
}

/**
 * 获取秒杀列表
 */
exports.listSeckill = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceSeckill.listSeckill(params);
    res.send(result);
}


/************************************** 用户操作区 *****************************************/

/**
 * 当前是否允许秒杀
 */
exports.checkStatus = async (req, res, next) => {
    const { order_id, goods_id } = url.parse(req.url, true).query;
    const result = await serviceSeckill.checkStatus({ order_id, goods_id });
    res.send(result);
}

/**
 * 当前用户是否秒杀成功
 * 前端秒杀点击后，轮询用
 */
exports.checkSuccess = async (req, res, next) => {
    const { order_id, goods_id } = url.parse(req.url, true).query;
    const { unionid } = req.session;
    const result = await serviceSeckill.checkSuccess({ order_id, goods_id, unionid });
    res.send(result);
}

/**
 * 用户点击秒杀
 */
exports.userRequestSeckill = async (req, res, next) => {
    const { order_id, goods_id } = req.body;
    const { unionid } = req.session;
    const result = await serviceSeckill.userRequestSeckill({ order_id, goods_id, unionid });
    res.send(result);
}