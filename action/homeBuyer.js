const url = require('url');
const serviceBuyer = require('../service/homeBuyer');

exports.getList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    try {
        const result = await serviceBuyer.getList(params);
        res.send(result);
    } catch (error) {
        res.send({
            code: -1,
            msg: error.message,
        });
    }
}

exports.getTarget = async (req, res, next) => {
    const { user_id } = req.params;
    const result = await serviceBuyer.getTarget({user_id});
    res.send(result);
}

exports.update = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceBuyer.update(params);
    res.send(result);
}

exports.create = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceBuyer.create(params);
    res.send(result);
}

exports.destroy = async (req, res, next) => {
    const { user_id } = req.params;
    const result = await serviceBuyer.destroy({
        user_id,
        admin_id: req.session.admin_id,
    });
    res.send(result);
}