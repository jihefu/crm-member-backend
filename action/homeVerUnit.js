const url = require('url');
const serviceHomeVerUnit = require('../service/homeVerUnit');

exports.getList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    try {
        const result = await serviceHomeVerUnit.getList(params);
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
    const result = await serviceHomeVerUnit.getTarget({user_id});
    res.send(result);
}

exports.update = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeVerUnit.update(params);
    res.send(result);
}