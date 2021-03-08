const url = require('url');
const serviceVehicleRegist = require('../service/homeVehicleRegist');

/**
 * 获取车辆使用列表
 */
exports.getList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceVehicleRegist.getList(params);
    res.send(result);
}

/**
 * 根据id获取
 */
exports.getRecordById = async (req, res, next) => {
    const { id } = req.params;
    const result = await serviceVehicleRegist.getRecordById({ id });
    res.send(result);
}

/**
 * 获取上次用车结束的里程
 */
exports.getPrevMile = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceVehicleRegist.getPrevMile(params);
    res.send(result);
}

/**
 * 新增
 */
exports.create = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceVehicleRegist.create(params);
    res.send(result);
}

/**
 * 删除
 */
exports.del = async (req, res, next) => {
    const { id } = req.params;
    const admin_id = req.session.admin_id;
    const result = await serviceVehicleRegist.del({ id, admin_id });
    res.send(result);
}

/**
 * 更新
 */
exports.update = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceVehicleRegist.update(params);
    res.send(result);
}

/**
 * 更新照片
 */
exports.updateAlbum = async (req, res, next) => {
    const params = req.body;
    params.id = req.params.id;
    const result = await serviceVehicleRegist.updateAlbum(params);
    res.send(result);
}