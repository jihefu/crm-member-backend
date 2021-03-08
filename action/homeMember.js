const url = require('url');
const path = require('path');
const serviceHomeMember = require('../service/homeMember');
const ctrlMember = require('../controllers/pc_member');
const base = require('../service/base');
const actionHomeFileSys = require('./homeFileSys');
const serviceDeal = require('../service/deal');

/**
 *  会员列表
 */
this.list = (req,res,next) => {
    let params = url.parse(req.url,true).query;
    serviceHomeMember.list(params,(result) => {
        res.send(result);
    });
}

/**
 *  指定id
 */
this.targetItem = (req,res,next) => {
    const id = req.params.id;
    serviceHomeMember.targetItem({id: id},(result) => {
        res.send(result);
    });
}

/**
 * 获取会员分数
 */
exports.getMemberScore = async (req, res, next) => {
    const { open_id } = req.params;
    const result = await serviceHomeMember.getMemberScore({ open_id });
    res.send(result);
}

/**
 * 标记删除会员
 */
this.delMember = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeMember.delMember(params, result => {
        res.send(result);
    });
}

/**
 * 标记恢复会员
 */
this.recoverMember = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeMember.recoverMember(params, result => {
        res.send(result);
    });
}

/**
 *  会员审核（copy from controllers pc_member）
 */
this.subCheck = (req,res,next) => {
    const form_data = JSON.parse(req.body.form_data);
    const admin_id = req.session.admin_id;
    serviceHomeMember.subCheck({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
    // ctrlMember.subCheck2(req,res,next);
}

/**
 *  根据公司名获取已经认证的同事
 */
this.getRegColleague = (req,res,next) => {
    const company = url.parse(req.url,true).query.company;
    serviceHomeMember.getRegColleague({
        company: company
    },result => {
        res.send(result);
    });
}

/**
 *  根据公司名获取认证会员列表
 */
this.getRegMemberByCompany = (req,res,next) => {
    const company = url.parse(req.url,true).query.company;
    serviceHomeMember.getRegMemberByCompany({
        company: company
    },result => {
        res.send(result);
    });
}

/**
 *  认证接口
 */
this.verifiedRelation = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeMember.verifiedRelation(params,result => {
        res.send(result);
    });
}

/**
 * 获取一定规则的会员
 */
this.getMemberByScoreRule = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    serviceHomeMember.getMemberByScoreRule(params, result => {
        res.send(result);
    });
}

this.getTrainLog = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeMember.getTrainLog(params);
    res.send(result);
}

this.addTrainLog = async (req, res, next) => {
    const params = req.body;
    params.admin_id= req.session.admin_id;
    const result = await serviceHomeMember.addTrainLog(params);
    res.send(result);
}

this.delTrainLog = async (req, res, next) => {
    const params = req.body;
    const { open_id } = params;
    const { id } = req.params;
    const result = await serviceHomeMember.delTrainLog({
        open_id,
        id,
    });
    res.send(result);
}

this.getActivityRecord = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeMember.getActivityRecord(params);
    res.send(result);
}

this.delActivityRecord = async (req, res, next) => {
    const params = req.body;
    const { open_id } = params;
    const { id } = req.params;
    const result = await serviceHomeMember.delActivityRecord({
        open_id,
        id,
    });
    res.send(result);
}

this.addActivityRecord = async (req, res, next) => {
    const params = req.body;
    const { admin_id } = req.session;
    params.admin_id = admin_id;
    const result = await serviceHomeMember.addActivityRecord(params);
    res.send(result);
}

// 上传培训认证证书
this.uploadCerImg = async (req, res, next) => {
    let mulUploadImg = new base.MulUploadImg('/public/img/memberCertImg');
    mulUploadImg.upload(req,(name,fields) => {
        res.send({
            code: 200,
            msg: '上传成功',
            data: [name]
        });
        mulUploadImg.resize();
    });
}

/**
 * 查看兑换记录
 */
exports.getExchangeRecord = async (req, res, next) => {
    const result = await serviceHomeMember.getExchangeRecord();
    res.send(result);
}

/**
 * 发送站内私信
 */
exports.sendMiddleMsg = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeMember.sendMiddleMsg(params);
    res.send(result);
}

/**
 * 根据open_id获取站内消息
 */
exports.getMiddleMsg = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeMember.getMiddleMsg(params);
    res.send(result);
}

/**
 * 获取所有的站内消息
 */
exports.getTotalMiddleMsg = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeMember.getTotalMiddleMsg(params);
    res.send(result);
}

/**
 * 自定义添加站内消息
 */
this.addCustomMiddleMsg = async (req, res) => {
    const params = req.body;
    const result = await serviceHomeMember.addCustomMiddleMsg(params);
    res.send(result);
}

// 获取所有未读消息
exports.getUnreadMsgList = async (req, res) => {
    const { unionid } = url.parse(req.url, true).query;
    const result = await serviceHomeMember.getUnreadMsgList({ unionid });
    res.send(result);
}

// 更新已读
exports.updateMsgHasRead = async (req, res) => {
    const { unionid } = req.body;
    const result = await serviceHomeMember.updateMsgHasRead({ unionid });
    res.send(result);
}

/**
 * 后台元宝分录入
 */
exports.inputYBScoreByCustom = async (req, res, next) => {
    const params = req.body;
    params.create_person = req.session.admin_id;
    const result = await serviceHomeMember.inputYBScoreByCustom(params);
    res.send(result);
}

/**
 * 提交审核
 */
exports.applyCheck = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeMember.applyCheck(params);
    res.send(result);
}

/**
 * 审核通过
 */
exports.checkPass = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeMember.checkPass(params);
    res.send(result);
}

/**
 * 审核不通过
 */
exports.checkNotPass = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeMember.checkNotPass(params);
    res.send(result);
}

/**
 * 更新活动属性
 */
exports.updateActivityProps = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeMember.updateActivityProps(params);
    res.send(result);
}

/**
 * 获取活动mapper
 */
exports.getActivityMapper = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeMember.getActivityMapper(params);
    res.send(result);
}

/**
 * 创建活动
 */
exports.createActivity = async (req, res, next) => {
    const params = req.body;
    const admin_id = req.session.admin_id;
    const result = await serviceHomeMember.createActivity(params, admin_id);
    res.send(result);
}

/**
 * 删除活动
 */
exports.deleteActivity = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeMember.deleteActivity(params);
    res.send(result);
}

/**
 * 删除活动批量
 */
exports.deleteActivityBatch = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeMember.deleteActivityBatch(params);
    res.send(result);
}

/**
 * 解析excel的电话列表返回open_id
 */
exports.parseExcelPhoneForActivity = async (req, res, next) => {
    actionHomeFileSys.parseExcel(req, res, next, async result => {
		if (result.code === 200) {
            const phoneArr = result.data.map(items => items[0]);
            result = await serviceHomeMember.getOpenIdByPhoneArr(phoneArr);
        }
        res.send(result);
	});
}

/**
 * 获取参与小程序问答活动的人员列表
 */
exports.getMiniMemberListById = async (req, res, next) => {
    const { id } = req.params;
    const result = await serviceHomeMember.getMiniMemberListById(id);
    res.send(result);
}

/**
 * 根据uid获取元宝分获取记录
 */
exports.getScoreTicketByUid = async (req, res, next) => {
    const { user_id, page, pageSize } = url.parse(req.url, true).query;
    const result = await serviceDeal.MemberScore.getList({ user_id, page, pageSize });
	res.send(result);
}

/**
 * 获取所有元宝分
 */
exports.getTotalYbTicket = async (req, res, next) => {
    const result = await serviceHomeMember.getTotalYbTicket();
	res.send(result);
}

/******************************************** 元宝分礼品 *********************************************/

exports.getGiftList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeMember.getGiftList(params);
	res.send(result);
}

exports.createGift = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeMember.createGift(params);
	res.send(result);
}

exports.updateGift = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeMember.updateGift(params);
	res.send(result);
}

exports.delGift = async (req, res, next) => {
    const { id } = req.params;
    const result = await serviceHomeMember.delGift({ id });
	res.send(result);
}

exports.totalMemberList = async (req, res) => {
    const result = await serviceHomeMember.totalMemberList();
	res.send(result);
}

// 赠送
exports.giving = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeMember.giving(params);
	res.send(result);
}

// 添加可限免名单
exports.saveFreeExchangeRecord = async (req, res) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeMember.saveFreeExchangeRecord(params);
	res.send(result);
}

exports.delFreeExchangeRecord = async (req, res) => {
    const params = req.body;
    const result = await serviceHomeMember.delFreeExchangeRecord(params);
	res.send(result);
}

exports.listFreeExchange = async (req, res) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeMember.listFreeExchange(params);
	res.send(result);
}