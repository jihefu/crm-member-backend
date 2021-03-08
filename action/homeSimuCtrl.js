const url = require('url');
const homeSimuCtrl = require('../service/homeSimuCtrl');

exports.getSolutionList = async (req, res, next) => {
    const result = await homeSimuCtrl.getSolutionList();
    res.send(result);
}

exports.getModelListBySolution = async (req, res, next) => {
    const { solution } = url.parse(req.url, true).query;
    const result = await homeSimuCtrl.getModelListBySolution({ solution });
    res.send(result);
}

exports.getAtsListBySolution = async (req, res, next) => {
    const { solution } = url.parse(req.url, true).query;
    const result = await homeSimuCtrl.getAtsListBySolution({ solution });
    res.send(result);
}

exports.getSimuList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await homeSimuCtrl.getSimuList(params);
    res.send(result);
}

exports.createSimuInstance = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await homeSimuCtrl.createSimuInstance(params);
    res.send(result);
}