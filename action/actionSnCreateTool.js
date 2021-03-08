const url = require('url');
const path = require('path');
const serviceSnCreateTool = require('../service/homeSnCreateTool');

exports.index = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceSnCreateTool.index(params);
    res.send(result);
}

exports.create = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceSnCreateTool.create(params);
    res.send(result);
}