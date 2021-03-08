const url = require('url');
const serviceBusinessTrip = require('../service/homeBusinessTrip.js');

exports.getList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.admin_id = req.session.admin_id;
    const result = await serviceBusinessTrip.getList(params);
    res.send(result);
}

exports.getTarget = async (req, res, next) => {
    const { id } = req.params;
    const result = await serviceBusinessTrip.getTarget(id);
    res.send(result);
}

exports.agree = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceBusinessTrip.agree(params);
    res.send(result);
}

exports.disagree = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceBusinessTrip.disagree(params);
    res.send(result);
}

/**
 * 改变报销金额
 */
exports.changeAmount = async (req, res, next) => {
    const params = req.body;
    const result = await serviceBusinessTrip.changeAmount(params);
    res.send(result);
}

exports.update = async (req, res, next) => {
    const params = req.body;
    const result = await serviceBusinessTrip.update(params);
    res.send(result);
}

// 批量申请报销
exports.applyExpenseBatch = async (req, res, next) => {
    const { idArr } = req.body;
    const result = await serviceBusinessTrip.applyExpenseBatch({ idArr });
    res.send(result);
}

exports.add = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceBusinessTrip.add(params);
    res.send(result);
}

exports.del = async (req, res, next) => {
    const params = req.body;
    const result = await serviceBusinessTrip.del(params);
    res.send(result);
}

exports.remoteSearchMeetOrder = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.admin_id = req.session.admin_id;
    const result = await serviceBusinessTrip.remoteSearchMeetOrder(params);
    res.send(result);
}

exports.meetOrderList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceBusinessTrip.meetOrderList(params);
    res.send(result);
}

exports.meetOrderNormalAgree = async (req, res, next) => {
    const params = req.params;
    const result = await serviceBusinessTrip.meetOrderNormalAgree(params);
    res.send(result);
}

exports.meetOrderNormalDisAgree = async (req, res, next) => {
    const params = req.params;
    params.admin_id = req.session.admin_id;
    const result = await serviceBusinessTrip.meetOrderNormalDisAgree(params);
    res.send(result);
}

exports.meetOrderAgree = async (req, res, next) => {
    const params = req.body;
    params.id = req.params.id;
    const result = await serviceBusinessTrip.meetOrderAgree(params);
    res.send(result);
}

exports.meetOrderDisAgree = async (req, res, next) => {
    const params = req.params;
    params.admin_id = req.session.admin_id;
    const result = await serviceBusinessTrip.meetOrderDisAgree(params);
    res.send(result);
}

exports.meetOrderchangeWorkTime = async (req, res, next) => {
    const params = req.body;
    params.id = req.params.id;
    params.admin_id = req.session.admin_id;
    const result = await serviceBusinessTrip.meetOrderchangeWorkTime(params);
    res.send(result);
}

exports.contactsOrderAssessment = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceBusinessTrip.contactsOrderAssessment(params);
    res.send(result);
}

exports.getOnlineContactRecord = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceBusinessTrip.targetItemAssessment(params);
    res.send(result);
}

exports.updateContractNoBySn = async (req, res, next) => {
    const params = req.body;
    const result = await serviceBusinessTrip.updateContractNoBySn(params);
    res.send(result);
}

this.getTotalMeetMsgTime = async (req, res, next) => {
    const result = await serviceBusinessTrip.getTotalMeetMsgTime();
    res.send(result);
}

this.getImageListByContactTime = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceBusinessTrip.getImageListByContactTime(params);
    res.send(result);
}