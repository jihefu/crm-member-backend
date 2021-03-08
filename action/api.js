const url = require('url');
const serviceApi = require('../service/api');
const serviceHomeMember = require('../service/homeMember');

/**
 * 注册威程卡
 */
// exports.regInfo = (req, res, next) => {
//     const { sn } = req.params;
//     serviceApi.regInfo({
//         sn,
//     }, result => {
//         res.send(result);
//     });
// }

/**
 * 根据unionid判断是否是会员
 */
exports.checkMemberScoreInfo = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.unionid = req.params.unionid;
    serviceHomeMember.checkMemberScoreInfo(params, result => {
        res.send(result);
    });
}

/**
 * 获取一定规则的会员
 */
exports.getMemberByScoreRule = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    serviceHomeMember.getMemberByScoreRule(params, result => {
        res.send(result);
    });
}

/**
 * 根据unionid获取会员基本信息和分数
 */
exports.getMemberInfo = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.unionid = req.params.unionid;
    serviceHomeMember.getMemberInfo(params, result => {
        res.send(result);
    });
}