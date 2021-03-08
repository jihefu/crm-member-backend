const fs = require('fs');
const serviceMember = require('./member');
const Member = require('../dao').Member;
const Staff = require('../dao').Staff;
const Customers = require('../dao').Customers;
const Contacts = require('../dao').Contacts;
const serviceContacts = require('./homeContacts');
const serviceMenu = require('./homeMenu');
const MemberScore = require('../dao').MemberScore;
const ItemScore = require('../dao').ItemScore;
const common = require('./common');
const base = require('./base');
const sequelize = require('../dao').sequelize;
const serviceSMS = require('./SMS');
const sendMQ = require('./rabbitmq').sendMQ;
const aliSms = require('../action/aliSms');
const MemberTrainLog = require('../dao').MemberTrainLog;
const BaseEvent = require('../dao').BaseEvent;
const VerUnit = require('../dao').VerUnit;
const servicehyApp = require('./hybrid_app');
const SubEventContent = require('../mongoModel/SubEventContent');
const bluebird = require('bluebird');
const serviceDeal = require('./deal');
const BankMemberScore = require('../dao').BankMemberScore;
const Wallet = require('../dao').Wallet;
const ExchangeRecord = require('../dao').ExchangeRecord;
const MemberMsg = require('../dao').MemberMsg;
const MemberActivityMapper = require('../dao').MemberActivityMapper;
const request = require('request');
const serviceGoodsForYBScore = require('./goodsForYBScore');
const { encryTicket } = require('./goodsForYBScore');
const GoodsForYBScore = require('../dao').GoodsForYBScore;
const deal = require('./deal');
const FreeExchangeGift = require('../dao').FreeExchangeGift;
const moment = require('moment');

function memberLevelMapper(score) {
    const mapper = {};
    if (score < 300) {
        mapper.type = '白银会员';
        mapper.rate = 1;
    } else if (score >= 300 && score < 400) {
        mapper.type = '黄金会员';
        mapper.rate = 1.2;
    } else if (score >= 400 && score < 500 ) {
        mapper.type = '铂金会员';
        mapper.rate = 1.5;
    } else {
        mapper.type = '钻石会员';
        mapper.rate = 2;
    }
    return mapper;
}
exports.memberLevelMapper = memberLevelMapper;

/**
 * 会员列表
 */
this.list = async (params, cb) => {
    const num = params.num?parseInt(params.num):10;
	const page = params.page?parseInt(params.page):1;
    let keywords = params.keywords?params.keywords:'';
    keywords = keywords.trim();
    let order = params.order ? params.order : 'id';
    params.filter = typeof params.filter === 'string' ? JSON.parse(params.filter) : params.filter;
    let { state, delStatus, isUser, level, activeDegree, isEnterpriseWx } = params.filter;
    let isUserArr, stateArr, isdel = 0, levelArr, isEnterpriseWxArr, activeDegreeArr;
    if (delStatus === '已删除') {
        isdel = 1;
    }
    try {
        isUserArr = isUser.split(',').filter(items => items);
        isUserArr.forEach((items, index) => {
            if (items === '个人') {
                isUserArr[index] = 1;
            } else {
                isUserArr[index] = 0;
            }
        });
    } catch (e) {
        isUserArr = [];
    }
    try {
        stateArr = state.split(',').filter(items => items);
    } catch (e) {
        stateArr = [];
    }
    try {
        levelArr = level.split(',').filter(items => items);
    } catch (e) {
        levelArr = [];
    }
    try {
        isEnterpriseWxArr = isEnterpriseWx.split(',').filter(items => items);
    } catch (e) {
        isEnterpriseWxArr = [];
    }
    try {
        activeDegreeArr = activeDegree.split(',').filter(items => items);
    } catch (e) {
        activeDegreeArr = [];
    }
    stateArr.forEach((items,index) => {
        if(items=='认证申请中') stateArr[index] = '申请认证';
    });
    const where = {
        isdel,
        $or: { 
            name: { $like: '%'+keywords+'%' }, 
            phone: { $like: '%'+keywords+'%' }, 
            company: { $like: '%'+keywords+'%' },
            open_id: { $like: '%'+keywords+'%' },
            unionid: { $like: '%'+keywords+'%' },
            nick_name: { $like: '%'+keywords+'%' },
        } 
    };
    if (stateArr.length !== 0) {
        where.state = stateArr;
    }
    if (isUserArr.length !== 0) {
        where.isUser = isUserArr;
        if (isUserArr.length === 1 && isUserArr[0] === 1) {
            delete where.state;
        }
    }
    if (isEnterpriseWxArr.length === 1) {
        if (isEnterpriseWxArr[0] === '是') {
            where.isEnterpriseWx = 1;
        } else {
            where.isEnterpriseWx = 0;
        }
    }
    if (activeDegreeArr.length !== 0) {
        let limitDateArr = [];
        if (activeDegreeArr.includes('当天活跃')) {
            limitDateArr.push(moment().format('YYYY-MM-DD'));
        }
        if (activeDegreeArr.includes('3天内活跃')) {
            for (let i = 0; i < 3; i++) {
                limitDateArr.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
            }
        }
        if (activeDegreeArr.includes('7天内活跃')) {
            for (let i = 0; i < 7; i++) {
                limitDateArr.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
            }
        }
        if (activeDegreeArr.includes('15天内活跃')) {
            for (let i = 0; i < 15; i++) {
                limitDateArr.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
            }
        }
        if (activeDegreeArr.includes('30天内活跃')) {
            for (let i = 0; i < 30; i++) {
                limitDateArr.push(moment().subtract(i, 'days').format('YYYY-MM-DD'));
            }
        }
        limitDateArr = [...new Set(limitDateArr)];
        let dateStr = '';
        limitDateArr.forEach(items => dateStr += `'${items}',`);
        dateStr = dateStr.slice(0, dateStr.length - 1);
        where.last_login_time = sequelize.literal(`date_format(last_login_time, "%Y-%m-%d") IN (${dateStr})`);
    }
    if (order === 'levelScore') {
        scoreList('score');
    } else if (order === 'ybScore') {
        scoreList('canChangeScore');
    } else {
        normalList();
    }

    async function _getYBScoreMapper() {
        const memberScoreList = await BankMemberScore.findAll();
        const walletList = await Wallet.findAll({ where: { user_id: { $gt: 29999 } } });
        const idScoreMapper = {}, userIdScoreMapper = {};
        walletList.forEach(items => {
            idScoreMapper[items.dataValues.id] = {
                user_id: items.dataValues.user_id,
                score: 0,
            };
        });
        memberScoreList.forEach(items => {
            if (idScoreMapper[items.dataValues.own_id]) {
                idScoreMapper[items.dataValues.own_id].score += items.dataValues.score;
            }
        });
        for (const own_id in idScoreMapper) {
            userIdScoreMapper[idScoreMapper[own_id].user_id] = idScoreMapper[own_id].score;
        }
        return userIdScoreMapper;
    }

    async function _trans(items) {
        const staffMap = new base.StaffMap().getStaffMap();
        try {
            items.check_person = staffMap[items.check_person].user_name;
        } catch (e) {
            
        }
        try {
            items.update_person = staffMap[items.update_person].user_name;
        } catch(e) {

        }
        const memberScoreEntity = await MemberScore.findOne({ where: { openid: items.open_id }});
        if (!memberScoreEntity) {
            return;
        }
        const { total: score } = memberScoreEntity.dataValues;
        items.dataValues.score = score;
        const { type: levelType } = memberLevelMapper(score);
        items.dataValues.type = levelType;
    }

    // 正常排序
    async function normalList() {
        if (order === 'id') {
            order = ['id', 'DESC'];
        } else if (order === 'check_time') {
            order = ['check_time','DESC'];
        } else if (order === 'last_login_time') {
            order = ['last_login_time','DESC'];
        }
        let markOrder;
        const resObj = await new Promise(resolve => {
            common.infoMark({
                type: 'Member'
            }, resObj => resolve(resObj));
        });
        const { str, id_arr } = resObj;
        if (str) {
            markOrder =	[[sequelize.literal('if('+str+',0,1)')], order];
        } else {
            markOrder =	[order];
        }
        // 20210201新增等级分筛选
        if (levelArr.length !== 0) {
            let result = await Member.findAll({
                where,
                order: markOrder,
            });
            // 获取元宝分信息
            const userIdScoreMapper = await _getYBScoreMapper();
            await bluebird.map(result, async items => {
                await _trans(items);
                items.dataValues.canChangeScore = userIdScoreMapper[items.user_id];
            }, { concurrency: 10 });
            result = result.filter(items => levelArr.includes(items.dataValues.type));
            let totalCanChangeScore = 0;
            result.forEach(items => {
                const { user_id } = items.dataValues;
                totalCanChangeScore += userIdScoreMapper[user_id];
            });
            const total = result.length;
            const data = result.splice((page - 1) * num, num);
            cb({
                code: 200,
                msg: '',
                data: {
                    total,
                    data,
                    id_arr,
                    totalCanChangeScore,
                },
            });
        } else {
            const result = await Member.findAndCountAll({
                where,
                order: markOrder,
                limit: num,
                offset: (page - 1) * num,
            });
            // 获取元宝分信息
            const userIdScoreMapper = await _getYBScoreMapper();
            await bluebird.map(result.rows, async items => {
                await _trans(items);
                items.dataValues.canChangeScore = userIdScoreMapper[items.user_id];
            }, { concurrency: 10 });
            // 获取可兑换积分的总数（where条件去除分页）
            const memberTotalList = await Member.findAll({ where });
            let totalCanChangeScore = 0;
            memberTotalList.forEach(items => {
                const { user_id } = items.dataValues;
                totalCanChangeScore += userIdScoreMapper[user_id];
            });
            cb({
                code: 200,
                msg: '',
                data: {
                    total: result.count,
                    data: result.rows,
                    id_arr,
                    totalCanChangeScore,
                },
            });
        }
    }

    // 等级分排序
    // 元宝分排序
    async function scoreList(type) {
        let memberList = await Member.findAll({ where });
        const userIdScoreMapper = await _getYBScoreMapper();
        let totalCanChangeScore = 0;
        await bluebird.map(memberList, async items => {
            const { user_id } = items.dataValues;
            totalCanChangeScore += userIdScoreMapper[user_id];
            await _trans(items);
            items.dataValues.canChangeScore = userIdScoreMapper[items.user_id];
        }, { concurrency: 5 });
        memberList = memberList.sort((a, b) => {
            return b.dataValues[type] - a.dataValues[type];
        });
        if (levelArr.length !== 0) {
            memberList = memberList.filter(items => levelArr.includes(items.dataValues.type));
        }

        const total = memberList.length;
        const data = memberList.splice((page - 1) * num, num);
        cb({
            code: 200,
            msg: '',
            data: {
                total,
                data,
                id_arr: [],
                totalCanChangeScore,
            },
        });
    }
}

/**
 *  指定id
 */
this.targetItem = (params,cb) => {
    const { id } = params;
    Member.findOne({
        where: {
            id: id
        }
    }).then(result => {
        const staffMap = new base.StaffMap().getStaffMap();
        try{
            result.dataValues.check_person = staffMap[result.dataValues.check_person].user_name;
        }catch(e){

        }
        try{
            result.dataValues.update_person = staffMap[result.dataValues.update_person].user_name;
        }catch(e){

        }
        MemberScore.findOne({
            where: {
                openid: result.dataValues.open_id,
                // name: result.dataValues.name,
                // phone: result.dataValues.phone
            }
        }).then(_result => {
            let score = _result.dataValues.total;
            const { type } = memberLevelMapper(score);
            result.dataValues.score = score;
            result.dataValues.type = type;
            cb({
                code: 200,
                msg: '',
                data: result
            });
        });
    }).catch(e => LOG(e));
}

/**
 *  指定参数搜索
 */
this.orderParamsList = (params,cb) => {
	Member.findAll({
		where: params
	}).then(result => {
		cb({
			code: 200,
			msg: '',
			data: result
		});
	}).catch(e => LOG(e));
}

/**
 * 获取会员分数
 */
exports.getMemberScore = async ({ open_id }) => {
    const result = await MemberScore.findOne({ where: { openid: open_id } });
    return { code: 200, msg: '', data: result };
}

/**
 * 标记删除会员
 */
this.delMember = (params, cb) => {
    const { id, admin_id } = params;
    Member.update({isdel: 1},{where: {id}}).then(result => {
        cb({
            code: 200,
            msg: '删除成功',
            data: result,
        });
        serviceMenu.remAdd({
            content: "进行了删除操作",
            type: "Member",
            typeKey: id,
            admin_id,
        }, () => {});
    }).catch(e => LOG(e));
}

/**
 * 标记恢复会员
 */
this.recoverMember = (params, cb) => {
    const { id, admin_id } = params;
    Member.update({isdel: 0},{where: {id}}).then(result => {
        cb({
            code: 200,
            msg: '恢复成功',
            data: result,
        });
        serviceMenu.remAdd({
            content: "进行了恢复操作",
            type: "Member",
            typeKey: id,
            admin_id,
        }, () => {});
    }).catch(e => LOG(e));
}

//认证会员
exports.checkInfo = async (form_data, cb) => {
    if (form_data.state == '申请认证' || form_data.state == '已认证') {
        serviceContacts.validateCertified({
            verified: 1,
            company: form_data.company,
            witness: form_data.witness,
            verifiedPerson: form_data.check_person,
            witnessRelation: form_data.witnessRelation
        },async result => {
            if (result.code == -1) {
                cb(result);
            } else {
                // 判断改公司为客户公司
                const r = await VerUnit.findOne({ where: { isdel: 0, company: form_data.company } });
                if (r.dataValues.sub_type.indexOf('客') !== -1) {
                    //验证该公司确实有该会员的各种属性
                    const jobArr = form_data.job.split(',');
                    Customers.findOne({
                        where: {
                            isdel: 0,
                            company: form_data.company
                        }
                    }).then(result => {
                        let { legal_person,partner,reg_person,finance,purchase } = result.dataValues;
                        let partnerArr,regPersonArr,financeArr,purchaseArr;
                        try{
                            partnerArr = partner.split(',');
                        }catch(e){
                            partnerArr = [];
                        }
                        try{
                            regPersonArr = reg_person.split(',');
                        }catch(e){
                            regPersonArr = [];
                        }
                        try{
                            financeArr = finance.split(',');
                        }catch(e){
                            financeArr = [];
                        }
                        try{
                            purchaseArr = purchase.split(',');
                        }catch(e){
                            purchaseArr = [];
                        }
                        const name = form_data.name;
                        let _result = {
                            code: 200,
                            msg: '',
                            data: []
                        }
                        for (let i = 0; i < jobArr.length; i++) {
                            if(jobArr[i]=='法人'){
                                if(legal_person!=name){
                                    _result = {
                                        code: -1,
                                        msg: '无效的法人',
                                        data: []
                                    };
                                    break;
                                }
                            }else if(jobArr[i]=='合伙人'){
                                if(partnerArr.indexOf(name)==-1){
                                    _result = {
                                        code: -1,
                                        msg: '无效的合伙人',
                                        data: []
                                    };
                                    break;
                                }
                            }else if(jobArr[i]=='注册人'){
                                if(regPersonArr.indexOf(name)==-1){
                                    _result = {
                                        code: -1,
                                        msg: '无效的注册人',
                                        data: []
                                    };
                                    break;
                                }
                            }else if(jobArr[i]=='财务'){
                                if(financeArr.indexOf(name)==-1){
                                    _result = {
                                        code: -1,
                                        msg: '无效的财务',
                                        data: []
                                    };
                                    break;
                                }
                            }else if(jobArr[i]=='采购'){
                                if(purchaseArr.indexOf(name)==-1){
                                    _result = {
                                        code: -1,
                                        msg: '无效的采购',
                                        data: []
                                    };
                                    break;
                                }
                            }
                        }
                        cb(_result);
                    }).catch(e => LOG(e));
                } else {
                    cb(result);
                }
            }
        });

        // async function dealer() {
        //     const result = await common.checkInfoValid({
        //         company: form_data.company,
        //         witness: form_data.witness,
        //         verifiedPerson: form_data.check_person,
        //         witnessRelation: form_data.witnessRelation,
        //         codeArr,
        //     });
        //     cb(result);
        // }
    }else{
        cb({
            code: 200,
            msg: '无需进入认证环节',
            data: []
        });
    }
}

/**
 *  会员审核
 */
this.subCheck = async (params,cb) => {
    let { form_data,admin_id } = params;
    const _memberEntity = await Member.findOne({ where: { id: form_data.id } });
    if (_memberEntity.dataValues.isUser == 1 && form_data.company) {
        cb({
            code: -1,
            msg: '当前为个人用户，无法认证',
        });
    }
    if (form_data.company == '杭州朗杰测控技术开发有限公司') form_data.isStaff = 1;
    const that = this;

    this.checkInfo(form_data, async result => {
        if(result.code==-1){
            cb(result);
        }else{
            //认证分离
            if(form_data.witnessRelation=='员工'&&form_data.state=='申请认证'){
                //进入事务系统认证流程
                serviceContacts.applyVerified({
                    form_data: form_data,
                    admin_id: admin_id,
                    otherParams: {
                        class: 'member',
                        frontUrl: '/member',
                        title: '会员管理'
                    }
                });
            }else if(form_data.witnessRelation!='员工'&&form_data.state=='申请认证'){
                form_data.checked = 1;
                form_data.state = '已认证';
                form_data.check_company = 1;
                form_data.check_job = 1;
                that.sendMsgToLegalPerson(form_data.id,admin_id);
                const memberEntity = await Member.findOne({ where: { id: form_data.id } });
                const { open_id } = memberEntity.dataValues;
                sendMQ.sendQueueMsg('memberActivity', JSON.stringify({
                    open_id,
                    _class: 'businessCert',
                }), () => {});
            } else if (form_data.state=='待认证' || form_data.state=='未通过') {
                form_data.checked = 0;
                form_data.check_company = 0;
                form_data.check_job = 0;
            }
            common.staffNameTransToUserId({
                user_name: form_data.check_person
            },async user_id => {
                form_data.check_person = user_id;
                form_data.update_person = admin_id;
                form_data.check_time = TIME();
                // 把mult_company的公司和职位改掉
                const memberEntity = await Member.findOne({ where: { id: form_data.id } });
                const { mult_company, company } = memberEntity.dataValues;
                const multCompanyArr = JSON.parse(mult_company);
                // 判断公司名是否有重复
                let count = 0;
                multCompanyArr.forEach((items, index) => {
                    if (items.company == form_data.company) {
                        count++;
                    }
                });
                if ((count == 1 && company != form_data.company)) {
                    cb({
                        code: -1,
                        msg: '该公司已存在，请客户自己切换'
                    });
                    return;
                }
                multCompanyArr.forEach((items, index) => {
                    if (items.company == company) {
                        multCompanyArr[index].company = form_data.company;
                        multCompanyArr[index].job = form_data.job;
                    }
                });
                await Member.update({ mult_company: JSON.stringify(multCompanyArr) }, { where: { id: form_data.id } });
                Member.update(form_data,{
                    where: {
                        id: form_data.id
                    }
                }).then(result => {
                    if(result[0]==0){
                        cb({
                            code: -1,
                            msg: '系统出错',
                            data: []
                        });
                        return;
                    }
                    Member.findOne({
                        where: {
                            id: form_data.id
                        }
                    }).then(result => {
                        //认证通过后计算分数
                        cb({
                            code: 200,
                            msg: '更新成功',
                            data: result
                        });
                        const p = { open_id: result.dataValues.open_id };
                        sendMQ.sendQueueMsg('memberStatic', JSON.stringify(p), result => {
                            console.log(result);
                        });
                        require('../cache/cacheCustomerInfo').clearCache();
                        // const calculScore = new base.CalculScore(result.dataValues);
                        // calculScore.getItemScore(() => {
                        //     calculScore.getPartScore(() => {
                        //         calculScore.updateMemberScore(() => {
                        //             //分数计算完毕，发送消息给会员，审核已完成
                        //             // common.middleMsg({
                        //             //     name: [form_data.name],
                        //             //     phone: [form_data.phone],
                        //             //     sender: admin_id,
                        //             //     title: '信息已审核！',
                        //             //     message: '工作人员已对您的基本信息进行了确认'
                        //             // },result => {
                        //                 cb({
                        //                     code: 200,
                        //                     msg: '更新成功',
                        //                     data: result
                        //                 });
                        //             // });
                        //         });
                        //     });
                        // });
                    }).catch(e => LOG(e));
                }).catch(e => LOG(e));
            });
        }
    });
}

/**
 *  监听同事审核的结果
 */
this.updateVerified = async (params) => {
    const { replyRes,id,admin_id, msgCompany, msgJob } = params;
    let checked,state,check_company,check_job;
    const that = this;
    const memberEntity = await Member.findOne({ where: { id } });
    const { mult_company, company, job } = memberEntity.dataValues;
	if(replyRes=='同意'){
        // 安全起见，再验证一下
        // 判断消息中的公司职位跟现有的是否一致
        if (msgCompany != company || msgJob != job) {
            return {
                code: -1,
                msg: '消息已过期',
            };
        }
        checked = 1;
        state = '已认证';
        check_company = 1;
        check_job = 1;
        that.sendMsgToLegalPerson(id,admin_id);
        // 新增联系簿
        addVerContatcs();
	}else{
		checked = 0;
        state = '待认证';
        check_company = 0;
        check_job = 0;
    }
    const multCompanyArr = JSON.parse(mult_company);
    multCompanyArr.forEach((items, index) => {
        if (items.company == company) {
            multCompanyArr[index].checked = 1;
        }
    });
    await Member.update({ mult_company: JSON.stringify(multCompanyArr) }, { where: { id } });
	Member.update({
        checked: checked,
        state: state,
        check_company: check_company,
        check_job: check_job
	},{
		where: {
			id: id
		}
	}).then(() => {
        Member.findOne({
            where: {
                id: id
            }
        }).then(result => {
            //认证通过后计算分数
            const p = { open_id: result.dataValues.open_id };
            sendMQ.sendQueueMsg('memberStatic', JSON.stringify(p), result => {
                console.log(result);
            });
            setTimeout(() => {
                if (replyRes == '同意') {
                    sendMQ.sendQueueMsg('memberActivity', JSON.stringify({
                        open_id: result.dataValues.open_id,
                        _class: 'businessCert',
                    }), () => {});
                }
            }, 2000);
            //分数计算完毕，发送消息给会员，审核已完成
            common.middleMsg({
                name: [result.dataValues.name],
                phone: [result.dataValues.phone],
                sender: 'system',
                title: '信息已审核！',
                message: '工作人员已对您的基本信息进行了确认'
            },result => {});
            require('../cache/cacheCustomerInfo').clearCache();
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));

    async function addVerContatcs() {
        const result = await Member.findOne({ where: { id } });
        const { name, phone, company, job } = result.dataValues;
        servicehyApp.addVerContacts({
            name,
            phone,
            company,
            job,
        });
    }
}

/**
 *  认证通过
 *  发送短信给法人
 */
this.sendMsgToLegalPerson = (memberId,admin_id) => {
    Member.findOne({
        where: {
            id: memberId
        }
    }).then(result => {
        const { name,phone,company,job } = result.dataValues;
        if(job=='法人') return;
        Customers.findOne({
            where: {
                company: company,
                isdel: 0
            }
        }).then(result => {
            if(!result) return;
            let legal_person = result.dataValues.legal_person;
            if(!legal_person) return;
            let isVerified = false,legalPersonPhone,_p = [];
            let saleMan,saleManPhone;
            _p[0] = new Promise((resolve,reject) => {
                Contacts.findOne({
                    where: {
                        name: legal_person,
                        verified: 1,
                        company: company
                    }
                }).then(result => {
                    if(result) {
                        isVerified = true;
                        legalPersonPhone = result.dataValues.phone1;
                    }
                    resolve();
                }).catch(e => LOG(e));
            });
            _p[1] = new Promise((resolve,reject) => {
                Member.findOne({
                    where: {
                        name: legal_person,
                        checked: 1,
                        company: company
                    }
                }).then(result => {
                    if(result) {
                        isVerified = true;
                        legalPersonPhone = result.dataValues.phone;
                    }
                    resolve();
                }).catch(e => LOG(e));
            });
            _p[2] = new Promise((resolve,reject) => {
                Staff.findOne({
                    where: {
                        user_id: admin_id,
                        isdel: 0
                    }
                }).then(result => {
                    const { user_name,phone } = result.dataValues;
                    saleMan = user_name;
                    saleManPhone = phone;
                    resolve();
                }).catch(e => LOG(e));
            });
            Promise.all(_p).then(() => {
                if(!isVerified) return;
                legal_person = legal_person[0]+'总';
                console.log(legal_person+'<<>>'+legalPersonPhone+'<<>>'+saleMan+'<<>>'+saleManPhone);
                if(CONFIG.debug) return;
                aliSms.sendAliSms({
                    type: 'idVerNoti',
                    PhoneNumbers: legalPersonPhone,
                    TemplateParam: JSON.stringify({
                        legal_person,
                        name,
                        phone,
                        company,
                        saleMan,
                        saleManPhone,
                    }),
                });
                // new serviceSMS.classSms({
                //     templateid: CONFIG.SMSTemp.verified_pass,
                //     mobiles: JSON.stringify([legalPersonPhone]),
                //     params: JSON.stringify([legal_person,name,phone,company,saleMan,saleManPhone]),
                // }).sendMsg(() => {});
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  根据公司名获取已经认证的同事
 */
this.getRegColleague = (params,cb) => {
    const { company } = params;
    let resArr = [];
    const _p = [];
    _p[0] = new Promise((resolve,reject) => {
        Member.findAll({
            where: {
                company: company,
                checked: 1
            }
        }).then(result => {
            result.forEach((items,index) => {
                resArr.push(items.dataValues.name);
            });
            resolve();
        }).catch(e => LOG(e));
    });
    _p[1] = new Promise((resolve,reject) => {
        serviceContacts.orderParamsList({
            company: company,
            verified: 1
        },result => {
            result.data.forEach((items,index) => {
                resArr.push(items.dataValues.name);
            });
            resolve();
        });
    });
    Promise.all(_p).then(() => {
        resArr = [...new Set(resArr)];
        cb({
            code: 200,
            msg: '',
            data: resArr
        });
    }).catch(e => LOG(e));
}

/**
 *  获取指定openId的会员信息
 */
this.getInfoByOpenId = (params,cb) => {
    const { open_id } = params;
    Member.findOne({
        where: {
            open_id: open_id
        }
    }).then(result => {
        cb(result);
    }).catch(e => LOG(e));
}

/**
 *  根据公司名获取认证会员列表
 */
this.getRegMemberByCompany = (params,cb) => {
    const { company } = params;
    Member.findAll({
        where: {
            checked: 1,
            company: company
        }
    }).then(result => {
        const resArr = [];
        result.forEach((items,index) => {
            resArr.push({
                text: items.dataValues.name,
                value: items.dataValues.open_id,
                data: []
            });
        });
        cb({
            code: 200,
            msg: '',
            data: resArr
        });
    }).catch(e => LOG(e));
}

/**
 *  认证接口
 */
this.verifiedRelation = (params,cb) => {
    const { keywords } = params;
    let companyArr = [],contactArr = [];
    const _p = [];
    _p[0] = new Promise((resolve,reject) => {
        Customers.findAll({
            where: {
                isdel: 0,
                certified: 1,
                '$or': {
                    company: {
                        '$like': '%'+keywords+'%'
                    },
                    cn_abb: {
                        '$like': '%'+keywords+'%'
                    },
                    user_id: {
                        '$like': '%'+keywords+'%'
                    },
                    abb: {
                        '$like': '%'+keywords+'%'
                    },
                    legal_person: {
                        '$like': '%'+keywords+'%'
                    }
                }
            }
        }).then(result => {
            result.map(items => {
                companyArr.push(items.dataValues.company);
            });
            resolve();
        }).catch(e => LOG(e));
    });
    _p[1] = new Promise((resolve,reject) => {
        serviceContacts.orderParamsList({
            isdel: 0,
            verified: 1,
            '$or': {
                name: {
                    '$like': '%'+keywords+'%'
                },
                phone1: {
                    '$like': '%'+keywords+'%'
                },
                company: {
                    '$like': '%'+keywords+'%'
                }
            }
        },result => {
            result.data.map(items => {
                contactArr.push({
                    name: items.dataValues.name,
                    phone: items.dataValues.phone1,
                    company: items.dataValues.company,
                    type: 'contacts'
                });
            });
            resolve();
        });
    });
    _p[2] = new Promise((resolve,reject) => {
        Member.findAll({
            where: {
                checked: 1,
                '$or': {
                    name: {
                        '$like': '%'+keywords+'%'
                    },
                    phone: {
                        '$like': '%'+keywords+'%'
                    },
                    company: {
                        '$like': '%'+keywords+'%'
                    }
                }
            }
        }).then(result => {
            result.map(items => {
                contactArr.push({
                    name: items.dataValues.name,
                    phone: items.dataValues.phone,
                    company: items.dataValues.company,
                    job: items.dataValues.job,
                    type: 'member'
                });
            });
            resolve();
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(() => {
        //认证联系人和会员去重，会员优先
        let resContactArr = [],hashObj = {};
        contactArr.forEach((items,index) => {
            companyArr.push(items.company);
            let key = items.name+items.phone+items.company;
            if(!hashObj[key]){
                hashObj[key] = 1;
                resContactArr.push(items);
            }else{
                resContactArr.forEach((it,ind) => {
                    if(it.name==items.name&&it.phone==items.phone&&it.company==items.company){
                        if(it.type=='contacts') resContactArr[ind] = items;
                    }
                });
            }
        });
        companyArr = [...new Set(companyArr)];
        cb({
            code: 200,
            msg: '查询完成',
            data: {
                company: companyArr,
                contacts: resContactArr
            }
        });
    }).catch(e => LOG(e));
}

/**
 *  根据公司名和姓名判断联系人是什么类型
 */
this.checkContactType = (params,cb) => {
    const { company,name } = params;
    let type;
    Member.findOne({
        where: {
            company: company,
            name: name,
            checked: 1
        }
    }).then(result => {
        if(result){
            cb('会员');
        }else{
            serviceContacts.orderParamsList({
                isdel: 0,
                verified: 1,
                name: name,
                company: company
            },result => {
                if(result.data.length==0){
                    cb('一般联系人');
                }else{
                    cb('认证联系人');
                }
            });
        }
    }).catch(e => LOG(e));
}

/**
 * 获取一定规则的会员
 * range 0所有 1济南 2非济南
 */
this.getMemberByScoreRule = (params, cb) => {
    const { activity, total, range } = params;
    const findParams = {
        '$or': {},
    };
    if (activity) findParams['$or'].activity = { '$gte': Number(activity) };
    if (total) findParams['$or'].total = { '$gte': Number(total) };
    MemberScore.findAll({
        where: findParams,
    }).then(accordMemberArr => {
        const accordMemberHashMapper = {};
        const allMemberHashMapepr = {};
        let filterAccordMemberArr = [];
        return Member.findAll().then(allMember => {
            allMember.forEach(items => allMemberHashMapepr[items.name + items.phone] = items);
            accordMemberArr.forEach((items, index) => {
                if (!accordMemberHashMapper[items.name + items.phone]) {
                    accordMemberHashMapper[items.name + items.phone] = 1;
                    filterAccordMemberArr.push(items);
                }
            });
            filterAccordMemberArr.forEach((items, index) => {
                try {
                    filterAccordMemberArr[index].dataValues.company = allMemberHashMapepr[items.name + items.phone].company;
                    filterAccordMemberArr[index].dataValues.addr = allMemberHashMapepr[items.name + items.phone].addr;
                    filterAccordMemberArr[index].dataValues.isStaff = allMemberHashMapepr[items.name + items.phone].isStaff;
                    filterAccordMemberArr[index].dataValues.checked = allMemberHashMapepr[items.name + items.phone].checked;
                    filterAccordMemberArr[index].dataValues.open_id = allMemberHashMapepr[items.name + items.phone].open_id;
                    filterAccordMemberArr[index].dataValues.unionid = allMemberHashMapepr[items.name + items.phone].unionid;
                } catch (e) {
                    console.log(e);
                }
            });
            // filterAccordMemberArr = filterAccordMemberArr.filter(items => items.dataValues.isStaff == 0 && items.dataValues.checked == 1);
            filterRange(filterAccordMemberArr, range);
        }).catch(e => { throw e });
    }).catch(e => cb({
        code: -1,
        msg: e.message,
        data: e.data,
    }));

    function filterRange(filterAccordMemberArr, range) {
        if (range == 0 || !range) {
            cb({
                code: 200,
                msg: '查询成功',
                data: {
                    total: filterAccordMemberArr.length,
                    data: filterAccordMemberArr,
                },
            });
        } else {
            Customers.findAll({
                where: { 
                    isdel: 0,
                    '$or': {
                        company: { '$like': '%济南%' },
                        town: { '$like': '%济南%' },
                        reg_addr: { '$like': '%济南%' },
                    },
                },
            }).then(jinanCustomerArr => {
                const jinanCustomerHashMapper = {};
                jinanCustomerArr.map(items => jinanCustomerHashMapper[items.company] = 1);
                const isJinanArr = [], isNotJinanArr = [];
                filterAccordMemberArr.forEach(items => {
                    if (jinanCustomerHashMapper[items.dataValues.company]) {
                        isJinanArr.push(items);
                    } else {
                        isNotJinanArr.push(items);
                    }
                });
                let total, data;
                if (range == 1) {
                    total = isJinanArr.length;
                    data = isJinanArr;
                } else {
                    total = isNotJinanArr.length;
                    data = isNotJinanArr;
                }
                cb({
                    code: 200,
                    msg: '查询成功',
                    data: {
                        total,
                        data,
                    },
                });
            }).catch(e => LOG(e));
        }
    }
}

/**
 * 判断该会员是否有资格抽奖
 * 100
 * 300
 */
this.checkMemberScoreInfo = (params, cb) => {
    const { unionid } = params;
    const activity = params.activity ? Number(params.activity) : 100;
    const total = params.total ? Number(params.total) : 300;
    const that = this;
    Member.findOne({
        where: {
            unionid,
        }
    }).then(result => {
        if (!result) throw errorFactory(-10001, '请先注册会员');
        // const { checked, isStaff } = result;
        // if (checked == 0) throw errorFactory(-10002, '暂未认证');
        // if (isStaff == 1) throw errorFactory(-10003, '朗杰员工不允许参加');
        // return new Promise((resolve, reject) => {
        //     that.getMemberInfo({
        //         unionid
        //     }, result => {
        //         if (result.data.dataValues.activity < 10) {
        //             reject(errorFactory(-10005, '活动分不足'));
        //         } else {
        //             resolve();
        //         }
        //     });
        // }).then(() => {
            that.getMemberByScoreRule({
                activity,
                total,
            }, result => {
                let canLottery = true;
                result.data.data.forEach(items => {
                    if (items.dataValues.unionid == unionid) canLottery = false;
                });
                if (canLottery) {
                    cb({
                        code: 200,
                        msg: '具备抽奖资格',
                        data: [],
                    });
                } else {
                    cb({
                        code: -10004,
                        msg: '当前分数已具备获奖资格',
                        data: [],
                    });
                }
            });
        // }).catch(e => { throw e });
    }).catch(e => cb({
        code: e.code,
        msg: e.message,
        data: e.data,
    }));
}

function errorFactory(code, msg, data) {
    const error = new Error(msg);
    error.code = code;
    error.data = data;
    return error;
}

/**
 * 根据unionid获取会员基本信息和分数
 */
this.getMemberInfo = (params, cb) => {
    const { unionid } = params;
    Member.findOne({
        where: { unionid }
    }).then(result => {
        if (!result) {
            throw errorFactory(-10001, '请先注册会员');
            return;
        }
        const { open_id } = result.dataValues;
        return MemberScore.findOne({
            where: {
                openid: open_id,
            }
        }).then(scoreInfo => {
            result.dataValues.activity = scoreInfo.dataValues.activity;
            result.dataValues.total = scoreInfo.dataValues.total;
            cb({
                code: 200,
                msg: '查询成功',
                data: result,
            });
        }).catch(e => { throw e });
    }).catch(e => cb({
        code: e.code,
        msg: e.message,
        data: e.data,
    }));
}

/**
 * 添加培训认证记录，更新会员分数
 */
this.addTrainLog = async params => {
    const { open_id, score, admin_id, content, title, album, join_time, award_time } = params;
    const dealer = async () => {
        return new Promise((resolve, reject) => {
            return sequelize.transaction(function (transaction) {
                return Member.findOne({
                    where: { open_id, isdel: 0 },
                }, { transaction }).then(async result => {
                    const { open_id } = result.dataValues;
                    const memberScoreEntity = await MemberScore.findOne({ where: { openid: open_id } });
                    const { certificate } = memberScoreEntity.dataValues;
                    let newScore = Number(certificate) + Number(score);
                    newScore = newScore > 200 ? 200 : newScore;
                    return MemberScore.update({ certificate: newScore }, { where: { openid: open_id }, transaction }).then(() => {
                        return MemberTrainLog.create({
                            open_id,
                            score,
                            title,
                            content,
                            join_time,
                            award_time,
                            award_person: admin_id,
                            album,
                        });
                    });
                });
            }).then(function (result) {
                // 事务已被提交
                // result 是 promise 链返回到事务回调的结果
                resolve();
            }).catch(function (err) {
                // 事务已被回滚
                // err 是拒绝 promise 链返回到事务回调的错误
                reject(err);
            });
        });
    }

    try {
        await dealer();
        // 发消息更新会员静态分数
        sendMQ.sendQueueMsg('memberStatic', JSON.stringify({ open_id }), result => {});
        return { code: 200, msg: '添加成功' };
    } catch (e) {
        return { code: -1, msg: '添加失败' };
    }
}

/**
 * 删除培训认证记录，更新会员分数
 */
this.delTrainLog = async params => {
    const { open_id, id } = params;
    const dealer = async () => {
        return new Promise((resolve, reject) => {
            return sequelize.transaction(function (transaction) {
                return Member.findOne({
                    where: { open_id, isdel: 0 },
                }, { transaction }).then(result => {
                    const { open_id } = result.dataValues;
                    return MemberTrainLog.update({ isdel: 1 }, {
                        where: { id },
                        transaction,
                    }).then(() => {
                        return MemberTrainLog.findOne({ where: { id } }).then(async result => {
                            const { score } = result.dataValues;
                            const memberScoreEntity = await MemberScore.findOne({ where: { openid: open_id } });
                            const { certificate } = memberScoreEntity.dataValues;
                            let newScore = Number(certificate) - score;
                            newScore = newScore < 0 ? 0 : newScore;
                            return MemberScore.update({ certificate: newScore }, { where: { openid: open_id }, transaction });
                        });
                    });
                });
            }).then(function (result) {
                // 事务已被提交
                // result 是 promise 链返回到事务回调的结果
                resolve();
            }).catch(function (err) {
                // 事务已被回滚
                // err 是拒绝 promise 链返回到事务回调的错误
                reject(err);
            });
        });
    }

    try {
        await dealer();
        // 发消息更新会员静态分数
        sendMQ.sendQueueMsg('memberStatic', JSON.stringify({ open_id }), result => {});
        return { code: 200, msg: '删除成功' };
    } catch (e) {
        return { code: -1, msg: '删除失败' };
    }
}

/**
 * 获取培训认证记录
 */
this.getTrainLog = async params => {
    const { open_id } = params;
    const result = await MemberTrainLog.findAll({ where: { isdel: 0, open_id } });
    return {
        code: 200,
        msg: '查询成功',
        data: result,
    };
}

/**
 * 添加活动记录
 */
this.addActivityRecord = async params => {
    const { open_id, content, admin_id } = params;
    const { memberActivityType, memberActivityTitle, memberActivityDate, memberActivityContent, memberActivityResult, memberTrainScore, memberTrainAlbum } = content;
    if (memberActivityType === '培训') {
        await this.addTrainLog({
            open_id,
            score: memberTrainScore,
            admin_id,
            content: memberActivityContent,
            title: memberActivityTitle,
            album: memberTrainAlbum,
            join_time: memberActivityDate,
            award_time: memberActivityDate,
        });
    }
    await new Promise(async resolve => {
        common.createEvent({
            headParams: {
                ownerId: open_id,
                type: '1901',
                time: TIME(),
                person: admin_id,
            },
            bodyParams: content,
        }, result => resolve());
    });
    return {
        code: 200,
        msg: '操作成功',
        data: [],
    };
}

/**
 * 删除活动记录
 */
this.delActivityRecord = async params => {
    const { open_id, id } = params;
    const that = this;
    const eventEntity = await BaseEvent.findOne({ where: { id, isdel: 0 } });
    if (!eventEntity) return { code: -1, msg: '已删除' };
    const { contentId } = eventEntity.dataValues;
    await new Promise(async resolve => {
        await BaseEvent.update({ isdel: 1 }, { where: { id } });
        SubEventContent.findById(contentId, async (err, result) => {
            if (result.memberActivityType === '培训') {
                const trainEntity = await MemberTrainLog.findOne({
                    where: {
                        isdel: 0,
                        open_id,
                        album: result.memberTrainAlbum,
                    },
                });
                try {
                    const trainId = trainEntity.dataValues.id;
                    await that.delTrainLog({ open_id, id: trainId });
                } catch (e) {
                    
                }
                resolve();
            } else {
                resolve();
            }
        });
    });
    return {
        code: 200,
        msg: '操作成功',
        data: [],
    };
}

/**
 * 查看活动记录
 */
this.getActivityRecord = async params => {
    const { open_id } = params;
    const eventArr = await BaseEvent.findAll({
		where: {
			type: { $in: [ 1901, 1314 ] },
			ownerId: open_id,
			isdel: 0,
        },
        order: [[ 'time', 'DESC' ]],
    });
    const _p = [];
    eventArr.forEach((items, index) => {
        _p[index] = new Promise(async resolve => {
            const { contentId } = items.dataValues;
            const i = index;
            SubEventContent.findById(contentId, (err, result) => {
                eventArr[i].dataValues.content = result;
                resolve();
            });
        });
    });
    await Promise.all(_p);
    const activityIdArr = await MemberActivityMapper.findAll();
    const activityMapper = {};
    activityIdArr.forEach(items => activityMapper[items.dataValues.activityId] = items.dataValues.activityName);
    eventArr.forEach((items, index) => {
        if (items.dataValues.type == '1314') {
            if (activityMapper[items.dataValues.rem]) {
                eventArr[index].dataValues.content.memberActivityContent = eventArr[index].dataValues.content.memberActivityTitle = activityMapper[items.dataValues.rem];
            } else {
                eventArr[index].dataValues.content.memberActivityContent = eventArr[index].dataValues.content.memberActivityTitle = items.dataValues.rem;
            }
            eventArr[index].dataValues.content.memberActivityDate = items.dataValues.time;
        }
    });
	return {
		code: 200,
		msg: '',
		data: eventArr,
	};
}

/**
 * 查看兑换记录
 */
exports.getExchangeRecord = async params => {
    const list = await ExchangeRecord.findAll({ order: [['id', 'DESC']] });
    const memberList = await Member.findAll();
    const unionidMapper = {};
    memberList.forEach(items => {
        const { name, unionid } = items.dataValues;
        if (unionid) {
            unionidMapper[unionid] = name;
        }
    });
    list.forEach((items, index) => {
        list[index].dataValues.memberName = unionidMapper[items.dataValues.unionid];
    });
    return { code: 200, msg: '', data: list };
}

/**
 * 发送站内私信
 */
exports.sendMiddleMsg = async params => {
    const { open_id, title, content, album, admin_id } = params;
    const memberEntity = await Member.findOne({ where: { open_id } });
    const { name, phone } = memberEntity.dataValues;
    await new Promise(resolve => {
        common.middleMsg({
            openid: open_id,
            name: [name],
            phone: [phone],
            title,
            message: content,
            sender: admin_id,
            album,
            type: 2,
        }, () => resolve());
    });
    return { code: 200, msg: '发送成功' };
}

/**
 * 根据open_id获取站内消息
 */
exports.getMiddleMsg = async params => {
    const { page, pageSize, open_id } = params;
    const list = await MemberMsg.findAll({
        where: {
            $or: {
                openid: open_id,
                sender: open_id,
            },
            isdel: 0,
        },
        order: [[ 'post_time', 'DESC' ]],
        limit: Number(pageSize),
        offset: (Number(page) - 1) * Number(pageSize),
    });
    return { code: 200, msg: '', data: list };
}

/**
 * 获取所有的站内消息
 */
exports.getTotalMiddleMsg = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const filter = params.filter ? typeof params.filter === 'string' ? JSON.parse(params.filter) : params.filter : {};
    const where = { isdel: 0, type: 2 };
    if (filter.sender) {
        where.$or = { openid: filter.sender, sender: filter.sender };
    }
    const list = await MemberMsg.findAll({
        where,
        order: [[ 'post_time', 'DESC' ]],
        limit: Number(pageSize),
        offset: (Number(page) - 1) * Number(pageSize),
    });
    const resArr = [];
    const memberMapper = {}, staffMapper = new base.StaffMap().getStaffMap();
    const memberList = await Member.findAll();
    memberList.forEach(items => memberMapper[items.dataValues.open_id] = items.dataValues.name);
    list.forEach(items => {
        const resObj = { NotiClientSubs: [] };
        resObj.class = 'respoAffair';
        resObj.frontUrl = '/memberAffairs';
        resObj.mailId = items.id;
        resObj.locationId = items.id;
        resObj.post_time = items.post_time;
        resObj.sender = items.sender;
        resObj.senderName = getSenderName(items.sender);
        resObj.openid = items.openid;
        resObj.receiverName = getSenderName(items.openid);
        resObj.content = items.message;
        resObj.album = items.album;
        // 强行兼容前端跳转
        if (items.openid) {
            resObj.skipId = items.openid;
            resObj.skipPage = '/member';
        }
        resArr.push(resObj);
    });
    return { code: 200, msg: '', data: resArr };

    function getSenderName(sender) {
        if (sender === 'system') {
            return '系统';
        }
        if (memberMapper[sender]) {
            return memberMapper[sender];
        }
        if (staffMapper[sender]) {
            return staffMapper[sender].user_name;
        }
        return sender;
    }
}

/**
 * 自定义添加站内消息
 */
this.addCustomMiddleMsg = async params => {
    const { post_time, open_id, admin_id, title, content, album } = params;
    const memberEntity = await Member.findOne({ where: { open_id } });
    const { name, phone } = memberEntity.dataValues;
    const formData = {
        name,
        phone,
        post_time,
        type: 2,
        title,
        message: content,
        album: album ? album : '',
        model: 'singleMsg',
        is_read: 1,
        read_time: post_time,
    };
    if (admin_id) {
        // 后台发的消息
        formData.openid = open_id;
        formData.sender = admin_id;
    } else {
        // 会员发的消息
        formData.sender = open_id;
    }
    await MemberMsg.create(formData);
    return { code: 200, msg: '新增成功' };
}

// 获取所有未读消息
exports.getUnreadMsgList = async params => {
	const { unionid } = params;
	const memberEntity = await Member.findOne({ where: { unionid } });
	if (!memberEntity) {
		return { code: -1, msg: '不存在会员' };
	}
	const { open_id } = memberEntity.dataValues;
	const list = await MemberMsg.findAll({
		where: {
			$or: {
				openid: open_id,
				sender: open_id,
            },
            is_read: 0,
			isdel: 0
		},
		order: [['post_time', 'DESC']]
	});
	return { code: 200, msg: '', data: list };
}

// 更新已读
exports.updateMsgHasRead = async params => {
	const { unionid } = params;
	const memberEntity = await Member.findOne({ where: { unionid } });
	if (!memberEntity) {
		return { code: -1, msg: '不存在会员' };
	}
	const { open_id } = memberEntity.dataValues;
	await MemberMsg.update({ read_time: TIME(), is_read: 1 }, { where: { openid: open_id, is_read: 0 } });
	return { code: 200, msg: '更新成功' };
}

/************************************************* 会员活动管理 ***********************************************/
/**
 * 后台元宝分录入
 */
this.inputYBScoreByCustom = async params => {
    const { openIdArr, score, activityId, type, create_person } = params;
    openIdArr.forEach(open_id => {
        sendMQ.sendQueueMsg('memberActivity', JSON.stringify({
            _class: 'customInput',
            open_id,
            score: Number(score),
            activityId,
            type,
            create_person,
        }), () => {});
    });
    return { code: 200, msg: '录入成功' };
}

async function sendCheckNotiMsg({ sender, content, subscriberArr }) {
    const mailId = Date.now();
    if (!subscriberArr) {
        const staffList = await Staff.findAll({ where: { isdel: 0, on_job: 1, branch: '管理部' } });
        subscriberArr = staffList.map(items => items.dataValues.user_id);
    }
    const subscriber = subscriberArr.join();
    const NotiClientSubs = subscriberArr.map(subscriber => ({ receiver: subscriber, noti_post_mailId: mailId }));
    request.post(ROUTE('notiPost/add?regName=justReadForAttention'),(err,response,body) => {
        console.log(body);
    }).form({
        data: JSON.stringify({
            mailId: mailId,
            class: 'ybScore',
            priority: '普通',
            frontUrl: '/ybScore',
            sender,
            post_time: TIME(),
            title: '会员活动管理',
            content,
            votes: '已阅',
            subscriber,
            NotiClientSubs,
        })
    });
}

/**
 * 提交审核
 */
exports.applyCheck = async params => {
    const { id, openIdArr, admin_id } = params;
    const recordEntity = await MemberActivityMapper.findOne({ where: { id } });
    const { check_state, activityName } = recordEntity.dataValues;
    if (check_state != 0) {
        return { code: -1, msg: '提交失败' };
    }
    await MemberActivityMapper.update({ add_person: admin_id, check_state: 1, open_id_arr: openIdArr.join() }, { where: { id } });
    const staffMapper = new base.StaffMap().getStaffMap();
    const applyName = staffMapper[admin_id].user_name;
    sendCheckNotiMsg({
        sender: admin_id,
        content: `${applyName}提交了“${activityName}”会员分配名单，请及时审核！`,
    });
    return { code: 200, msg: '提交成功' };
}

/**
 * 审核通过
 */
exports.checkPass = async params => {
    const { id, admin_id } = params;
    const self = this;
    const recordEntity = await MemberActivityMapper.findOne({ where: { id } });
    const { check_state, open_id_arr, score, activityId, activityName, add_person, type, miniProgramActivityId } = recordEntity.dataValues;
    if (check_state != 1) {
        return { code: -1, msg: '操作失败' };
    }
    const openIdArr = open_id_arr.split(',').filter(items => items);
    await MemberActivityMapper.update({ check_person: admin_id, check_state: 2 }, { where: { id } });
    if (type == 2) {
        await inputMiniScore(miniProgramActivityId, openIdArr, score, activityId, activityName);
    } else {
        await this.inputYBScoreByCustom({ openIdArr, score, activityId, type: activityName });
    }
    const staffMapper = new base.StaffMap().getStaffMap();
    const checkerName = staffMapper[admin_id].user_name;
    sendCheckNotiMsg({
        sender: admin_id,
        content: `${checkerName}通过了“${activityName}”会员分配名单`,
        subscriberArr: [add_person],
    });
    return { code: 200, msg: '审核通过' };

    async function inputMiniScore(id, openIdArr, totalScore, activityId, type) {
        const data = await self.getMiniMemberListById(id);
        const dataMapper = {}, scoreMapper = {};
        data.data.forEach(items => {
            dataMapper[items.open_id] = items.scoreRatio;
        });
        openIdArr.forEach(open_id => {
            if (dataMapper.hasOwnProperty(open_id)) {
                const scoreRatio = dataMapper[open_id];
                const score = scoreRatio * totalScore;
                if (!scoreMapper[score]) {
                    scoreMapper[score] = [];
                }
                scoreMapper[score].push(open_id);
            }
        });
        await bluebird.map(Object.entries(scoreMapper), async entry => {
            const score = Number(entry[0]);
            const openIdArr = entry[1];
            await self.inputYBScoreByCustom({ openIdArr, score, activityId, type });
        }, { concurrency: 1 });
    }
}

/**
 * 审核不通过
 */
exports.checkNotPass = async params => {
    const { id, admin_id } = params;
    const recordEntity = await MemberActivityMapper.findOne({ where: { id } });
    const { check_state, activityName, add_person } = recordEntity.dataValues;
    if (check_state != 1) {
        return { code: -1, msg: '操作失败' };
    }
    await MemberActivityMapper.update({ check_person: admin_id, check_state: 0 }, { where: { id } });
    const staffMapper = new base.StaffMap().getStaffMap();
    const checkerName = staffMapper[admin_id].user_name;
    sendCheckNotiMsg({
        sender: admin_id,
        content: `${checkerName}未通过“${activityName}”会员分配名单，请重新处理！`,
        subscriberArr: [add_person],
    });
    return { code: 200, msg: '操作成功' };
}

/**
 * 更新活动属性
 */
exports.updateActivityProps = async params => {
    await MemberActivityMapper.update(params, { where: { id: params.id } });
    return { code: 200, msg: '更新成功' };
}

/**
 * 获取活动mapper
 */
exports.getActivityMapper = async params => {
    const keywords = params.keywords ? params.keywords : '';
    const result = await MemberActivityMapper.findAndCountAll({ where: { isdel: 0, activityName: { $like: '%'+keywords+'%' } } });
    const staffMapper = new base.StaffMap().getStaffMap();
    const memberList = await Member.findAll({ attributes: ['open_id', 'name', 'phone', 'company'] });
    const memberMapper = {};
    memberList.forEach(items => {
        memberMapper[items.dataValues.open_id] = items.dataValues;
    });
    result.rows.forEach((items, index) => {
        try {
            result.rows[index].dataValues.add_person = staffMapper[items.dataValues.add_person].user_name;
        } catch (e) {
            
        }
        try {
            result.rows[index].dataValues.check_person = staffMapper[items.dataValues.check_person].user_name;
        } catch (e) {
            
        }
        try {
            result.rows[index].dataValues.create_person = staffMapper[items.dataValues.create_person].user_name;
        } catch (e) {
            
        }
        let teamName;
        try {
            teamName = items.dataValues.team.split(',').map(items => {
                try {
                    return staffMapper[items].user_name;
                } catch (e) {
                    
                }
            });
        } catch (e) {
            teamName = [];
        }
        result.rows[index].dataValues.teamName = teamName.join();

        let { open_id_arr } = items.dataValues;
        try {
            open_id_arr = open_id_arr.split(',').filter(items => items);
        } catch (e) {
            open_id_arr = [];
        }
        const memberArr = open_id_arr.map(open_id => {
            return memberMapper[open_id];
        });
        result.rows[index].dataValues.memberArr = memberArr;
    });
    return { code: 200, msg: '', data: { data: result.rows, total: result.count, id_arr: [] } };
}

/**
 * 创建活动
 */
exports.createActivity = async (params, admin_id) => {
    const { activityName } = params;
    const isExist = await MemberActivityMapper.findOne({ where: { activityName, isdel: 0 } });
    if (isExist) {
        return { code: -1, msg: '已存在' };
    }
    let lastActivity = 'custom_web_1000';
    const lastEntity = await MemberActivityMapper.findOne({ order: [['id', 'DESC']] });
    if (lastEntity) {
        lastActivity = lastEntity.dataValues.activityId;
    }
    let numId = Number(lastActivity.split('custom_web_')[1]);
    numId++;
    const newActivityId = 'custom_web_' + numId;
    params.activityId = newActivityId;
    params.create_person = admin_id;
    params.create_time = TIME();
    await MemberActivityMapper.create(params);
    return { code: 200, msg: '新增成功' };
}

/**
 * 删除活动
 */
exports.deleteActivity = async params => {
    const { activityId } = params;
    await MemberActivityMapper.update({ isdel: 1 }, { where: { activityId } });
    return { code: 200, msg: '删除成功', data: [] };
}

/**
 * 删除活动批量
 */
exports.deleteActivityBatch = async params => {
    const { activityIdArr } = params;
    await MemberActivityMapper.update({ isdel: 1 }, { where: { activityId: { $in: activityIdArr } } });
    return { code: 200, msg: '批量删除成功', data: [] };
}

/**
 * 根据phone获取openId
 */
exports.getOpenIdByPhoneArr = async phoneArr => {
    const memberList = await Member.findAll({ attributes: ['name', 'phone', 'company', 'open_id'], where: { phone: { $in: phoneArr } } });
    return { code: 200, msg: '解析成功', data: memberList };
}

/**
 * 获取所有元宝分
 */
exports.getTotalYbTicket = async () => {
    const list = await BankMemberScore.findAll();
    const walletList = await Wallet.findAll();
    const memberList = await Member.findAll();
    const walletMapper = {}, memberMapper = {};
    walletList.forEach(items => {
        walletMapper[items.id] = items.user_id;
    });
    memberList.forEach(items => {
        memberMapper[items.user_id] = { name: items.name, company: items.company };
    });
    list.forEach((items, index) => {
        list[index].dataValues.user_id = walletMapper[items.dataValues.own_id];
        try {
            list[index].dataValues.name = memberMapper[walletMapper[items.dataValues.own_id]].name;
            list[index].dataValues.company = memberMapper[walletMapper[items.dataValues.own_id]].company;   
        } catch (e) {
            
        }
    });
    return { code: 200, msg: '', data: list };
}

/**
 * 获取参与小程序问答活动的人员列表
 */
this.getMiniMemberListById = async id => {
    const data = await getOriginalMiniData(id);
    const memberList = await Member.findAll({ attributes: ['name', 'phone', 'company', 'open_id', 'unionid'] });
    const memberMapper = {};
    memberList.forEach(items => {
        memberMapper[items.dataValues.unionid] = items.dataValues;
    });
    const resArr = [];
    data.map(items => {
        if (memberMapper[items.unionId]) {
            memberMapper[items.unionId].scoreRatio = items.scoreRatio;
            resArr.push(memberMapper[items.unionId]);
        }
    });
    return { code: 200, msg: '', data: resArr };

    async function getOriginalMiniData(id) {
        const data = await new Promise(resolve => {
            request.get('https://mp.langjie.com/easyAnswer/open/answerList?id=' + id, (err, response, body) => {
                body = JSON.parse(body);
                resolve(body.data.data);
            });
        });
        return data;
    }
}

/******************************************** 元宝分礼品 *********************************************/

exports.getGiftList = async params => {
    return await serviceGoodsForYBScore.getList(params);
}

exports.createGift = async params => {
    return await serviceGoodsForYBScore.create(params);
}

exports.updateGift = async params => {
    return await serviceGoodsForYBScore.update(params);
}

exports.delGift = async params => {
    return await serviceGoodsForYBScore.del(params);
}

exports.totalMemberList = async params => {
    const list = await Member.findAll({ attributes: ['unionid', 'name', 'phone', 'company'] } );
    return { code: 200, msg: '', data: list };
}

// 赠送
exports.giving = async params => {
    const { goodsId, unionid, score, notSendToBackend, type } = params;
    const s = score || 0;
    const ty = type || '赠送';
    const memberEntity = await Member.findOne({ where: { unionid } });
    if (!memberEntity) {
        return { code: -1, msg: '不存在会员' };
    }
    const { name, phone, open_id, user_id } = memberEntity.dataValues;
    const goodsEntity = await GoodsForYBScore.findOne({ where: { id: goodsId } });
    if (!goodsEntity) {
        return { code: -1, msg: '不存在该礼品' };
    }
    const { goodsName } = goodsEntity.dataValues;
    // 减库存，开启事务
    const t = await sequelize.transaction();
    try {
        const tGoodsEntity = await sequelize.query('SELECT inventory FROM goods_for_yb_score WHERE id = ' + goodsId + ' FOR UPDATE', { transaction: t });
        let inventory = tGoodsEntity[0][0].inventory;
        if (inventory <= 0) {
            throw new Error('库存不足');
        }
        inventory--;
        await GoodsForYBScore.update({ inventory }, { where: { id: goodsId }, transaction: t });
        // 消费元宝分
        const r = await deal.MemberScore.consume({ user_id, score: s, consumeRem: goodsName });
        if (r.code == -1) {
            throw new Error(r.msg);
        }
        t.commit();
    } catch (e) {
        t.rollback();
        return { code: -1, msg: e.message };
    }
    // 生成经过加密的兑换码
    const no = encryTicket.create(String(goodsId).padStart(3, '0') + String(s).padStart(5, '0') + String(user_id) + String(Date.now()) + String(parseInt(Math.random() * 1000)));
    const result = await encryTicket.consume(no, unionid, ty);
    if (result.code == 200 && !notSendToBackend) {
        // 发送运营系统消息
		common.sendToMemberAffair({
			sender: open_id,
			content: name + '免费兑换了' + goodsName + '！（' + phone + '）',
		});
    }
    return result;
}

// 添加可限免名单
exports.saveFreeExchangeRecord = async params => {
    const { unionid, goodsIds, admin_id } = params;
    await FreeExchangeGift.create({ unionid, goodsIds, createPerson: admin_id, createTime: TIME() });
    return { code: 200, msg: '添加成功' };
}

// 删除限免名单
exports.delFreeExchangeRecord = async params => {
    const { id } = params;
    await FreeExchangeGift.update({ isdel: 1 }, { where: { id } });
    return { code: 200, msg: '删除成功' };
}

// 获取限免名单
exports.listFreeExchange = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.num ? Number(params.num) : 30;
    const keywords = params.keywords || '';
    const filter = params.filter ? typeof params.filter === 'string' ? JSON.parse(params.filter) : {} : {};
    const where = { isdel: 0 };
    if (filter.isExchange) {
        let isExchangeArr;
        try {
            isExchangeArr = filter.isExchange.split(',').filter(items => items);
        } catch (e) {
            isExchangeArr = [];
        }
        if (isExchangeArr.length === 1) {
            if (isExchangeArr[0] === '已兑换') {
                where.isExchange = 1;
            } else {
                where.isExchange = 0;
            }
        }
    }
    if (keywords) {
        const memberList = await Member.findAll({
            attributes: ['unionid'],
            where: {
                $or: {
                    name: { $like: '%'+keywords+'%' },
                    phone: { $like: '%'+keywords+'%' },
                    company: { $like: '%'+keywords+'%' },
                },
            },
        });
        const unionidArr = memberList.map(items => items.dataValues.unionid);
        where.unionid = { $in: unionidArr };
    }
    const result = await FreeExchangeGift.findAndCountAll({
        where,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: [['id', 'DESC']],
    });
    const totalGoodsList = await GoodsForYBScore.findAll();
    for (let i = 0; i < result.rows.length; i++) {
        const items = result.rows[i];
        let recordgoodsIdArr;
        try {
            recordgoodsIdArr = items.dataValues.goodsIds.split(',').filter(items => items);
        } catch (e) {
            recordgoodsIdArr = [];
        }
        const goodsNameList = [];
        totalGoodsList.forEach(it => {
            const { id, goodsName } = it.dataValues;
            if (recordgoodsIdArr.includes(String(id))) {
                goodsNameList.push(goodsName);
            }
            if (id == items.dataValues.exchangeGoodsId) {
                items.dataValues.exchangeGoodsName = goodsName;
            }
        });
        items.dataValues.goodsNameList = goodsNameList;

        const memberEntity = await Member.findOne({ where: { unionid: items.dataValues.unionid } });
        items.dataValues.memberName = memberEntity.dataValues.name;
    }
    return { code: 200, msg: '', data: { data: result.rows, total: result.count, id_arr: [] } };
}