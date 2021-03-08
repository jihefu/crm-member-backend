const url = require('url');
const serviceProductOrder = require('../service/homeProductOrder');
const serviceContract = require('../service/contract');

exports.list = async (req, res) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceProductOrder.list(params);
    res.send(result);
}

exports.add = async (req, res) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceProductOrder.add(params);
    res.send(result);
}

exports.del = async (req, res) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceProductOrder.del(params);
    res.send(result);
}

/****************************** 装箱单pc操作 *******************************/

exports.addPack = async (req, res) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceProductOrder.addPack(params);
    res.send(result);
}

exports.updateExpressNoInPacking = async (req, res) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceContract.updateExpressNoInPacking(params);
    res.send(result);
}