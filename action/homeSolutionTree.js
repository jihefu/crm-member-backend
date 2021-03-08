const url = require('url');
const serviceHomeSolutionTree = require('../service/homeSolutionTree');

exports.getTree = async (req, res, next) => {
    const result = await serviceHomeSolutionTree.getTree();
    res.send(result);
}

exports.addNode = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeSolutionTree.addNode(params);
    res.send(result);
}

exports.delNode = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeSolutionTree.delNode(params);
    res.send(result);
}

exports.renameNode = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeSolutionTree.renameNode(params);
    res.send(result);
}

exports.removeTree = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeSolutionTree.removeTree(params);
    res.send(result);
}

exports.dragNodeIn = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeSolutionTree.dragNodeIn(params);
    res.send(result);
}