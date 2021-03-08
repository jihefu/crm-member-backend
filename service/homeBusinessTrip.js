const moment = require('moment');
const request = require('request');
const BusinessTrip = require('../dao').BusinessTrip;
const sequelize = require('../dao').sequelize;
const MeetMsg = require('../dao').MeetMsg;
const OtherMsg = require('../dao').OtherMsg;
const BaseMsg = require('../dao').BaseMsg;
const Staff = require('../dao').Staff;
const base = require('./base');
const VerUnit = require('../dao').VerUnit;
const serviceHyApp = require('./hybrid_app');
const NotiClient = require('../dao').NotiClient;
const NotiClientSub = require('../dao').NotiClientSub;
const Member = require('../dao').Member;
const Customers = require('../dao').Customers;
const Affair = require('../dao').Affair;

exports.getList = async params => {
    let { page, num, keywords, isSelf, filter, admin_id } = params;
    page = page ? parseInt(page) : 1;
    num = num ? parseInt(num) : 30;
    keywords = keywords ? keywords : '';
    const $and = { isdel: 0 };
    if (keywords) {
        const staffResult = await Staff.findOne({ where: { isdel: 0, $or: { user_name: keywords, user_id: keywords } }});
        if (staffResult) {
            $and.user_id = staffResult.dataValues.user_id;
            keywords = '';
        }
    }
    filter = typeof filter === 'string' ? JSON.parse(filter) : filter;
    const stateArr = filter.state.split(',').filter(items => items);
    const typeArr = filter.type.split(',').filter(items => items);
    const createTime = filter.create_time.split(',').filter(items => items)[0];
    if (stateArr.length !== 0) $and.state = { $in: stateArr };
    if (typeArr.length !== 0) $and.type = { $in: typeArr };
    if (createTime === '当月') {
        const schemaOrderMonth = moment().format('YYYY-MM');
        $and.create_time = sequelize.literal('date_format(create_time,"%Y-%m")="'+schemaOrderMonth+'"');
    } else if (createTime === '上月') {
        const schemaOrderMonth = moment().subtract(1, 'months').format('YYYY-MM');
        $and.create_time = sequelize.literal('date_format(create_time,"%Y-%m")="'+schemaOrderMonth+'"');
    }
    if (isSelf) $and.user_id = admin_id;
    const result = await BusinessTrip.findAndCountAll({
        where: {
            $and,
        },
        limit: num,
        offset: (page -1) * num,
        order: [[ 'id', 'DESC' ]],
    });
    const amountEntity = await BusinessTrip.findOne({
        attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'amount']],
        where: {
            $and,
        },
    });
    const _p = [];
    result.rows.forEach((items, index) => {
        _p[index] = new Promise(async resolve => {
            const i = index;
            let meetOrderIdArr;
            try {
                meetOrderIdArr = items.dataValues.meet_order_id.split(',').filter(items => items);
            } catch (e) {
                meetOrderIdArr = [];
            }
            const meet_orders = await MeetMsg.findAll({ where: {
                id: { $in: meetOrderIdArr }
            }});
            result.rows[i].dataValues.meet_orders = meet_orders;
            resolve();
        });
    });
    await Promise.all(_p);
    return {
        code: 200,
        msg: '',
        data: {
            data: trans(result.rows),
            total: result.count,
            amount: amountEntity.dataValues.amount ? amountEntity.dataValues.amount : 0,
            id_arr: [],
        },
    };
}

exports.getTarget = async id => {
    const result = await BusinessTrip.findOne({ where: { id } });
    const transResult = trans([result]);
    const resData = transResult[0];
    let meetOrderIdArr;
    try {
        meetOrderIdArr = resData.dataValues.meet_order_id.split(',').filter(items => items);
    } catch (e) {
        meetOrderIdArr = [];
    }
    const meet_orders = await MeetMsg.findAll({ where: {
        id: { $in: meetOrderIdArr }
    }});
    resData.dataValues.meet_orders = meet_orders;
    return {
        code: 200,
        msg: '',
        data: resData,
    };
}

function trans(data) {
    const staffMapper = new base.StaffMap().getStaffMap();
    data.forEach((items, index) => {
        try {
            data[index].dataValues.user_name = staffMapper[items.dataValues.user_id].user_name;
        } catch (e) {
            data[index].dataValues.user_name = items.dataValues.user_id;
        }
        try {
            data[index].dataValues.director = staffMapper[items.dataValues.director].user_name;
        } catch (e) {
            
        }
        try {
            data[index].dataValues.check_person = staffMapper[items.dataValues.check_person].user_name;
        } catch (e) {
            
        }
    });
    return data;
}

exports.agree = async params => {
    const { id, admin_id, check_rem, amount } = params;
    await BusinessTrip.update({
        state: '已通过',
        check_person: admin_id,
        check_rem,
        check_time: TIME(),
        update_time: TIME(),
        amount,
    }, { where: { id } });
    return {
        code: 200,
        msg: '操作成功',
        data: [],
    };
}

exports.disagree = async params => {
    const { id, admin_id, check_rem } = params;
    await BusinessTrip.update({
        state: '填报中',
        check_person: admin_id,
        check_rem,
        check_time: TIME(),
        update_time: TIME(),
    }, { where: { id } });
    sendMsgToApplyer({
        admin_id,
        id,
    });
    return {
        code: 200,
        msg: '操作成功',
        data: [],
    };
}

/**
 * 改变报销金额
 */
exports.changeAmount = async params => {
    const { id, amount } = params;
    await BusinessTrip.update({
        amount,
    }, {
        where: { id },
    });
    return { code: 200, msg: '更新成功'};
}

// 被退回审核时，通知对方
async function sendMsgToApplyer(params) {
	const { id, admin_id } = params;
	const result = await BusinessTrip.findOne({ where: { id } });
	const { user_id } = result.dataValues;
	const staffMapper = new base.StaffMap().getStaffMap();
    const checker = staffMapper[admin_id].user_name;
    const applyer = staffMapper[user_id].user_name;
	const mailId = Date.now();
	request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
		console.log(body);
	}).form({
		data: JSON.stringify({
			mailId: mailId,
			class: 'bussinessTrip',
			priority: '普通',
			frontUrl: '/myBusinessTrip',
			sender: admin_id,
			post_time: TIME(),
			title: '出差单管理',
			content: checker + '退回了'+applyer+'的出差单，请重新填写',
			votes: '已阅',
			subscriber: user_id,
			NotiClientSubs: [
				{
					receiver: user_id,
					noti_post_mailId: mailId
				}
			]
		})
	});
}

exports.update = async params => {
    const { addr, type, director, go_out_time, back_time, reason, orders, isSave, id } = params;
    const formData = {
        addr,
        type,
        director,
        go_out_time,
        back_time,
        reason,
        state: isSave ? '填报中' : '报销中',
        update_time: TIME(),
        meet_order_id: orders,
    };
    if (orders === '') formData.meet_order_id = null;
    const staffEntity = await Staff.findOne({ where: { user_name: director } });
    if (staffEntity) {
        formData.director = staffEntity.dataValues.user_id;
    } else {
        delete formData.director;
    }
    await BusinessTrip.update(formData, {
        where: {
            id,
        },
    });
    return {
        code: 200,
        msg: '更新成功',
        data: [],
    };
}

// 批量申请报销
exports.applyExpenseBatch = async params => {
    const { idArr } = params;
    await BusinessTrip.update({ state: '报销中'}, { where: { id: { $in: idArr } } });
    return { code: 200, msg: '批量申请报销成功' };
}

exports.updateContractNoBySn = async params => {
    const { id } = params;
    const result = await serviceHyApp.searchNoBySn(params);
    if (result.code === 200) {
        const meetMsgEntity = await MeetMsg.findOne({ where: { id }});
        const { director_work_time, contract_no } = meetMsgEntity.dataValues;
        const contract_no_by_searched = result.data;
        if (contract_no != contract_no_by_searched) {
            await MeetMsg.update({
                contract_no: contract_no_by_searched,
                check_work_time: director_work_time,
            }, {
                where: {
                    id,
                },
            });
            return { code: 200, msg: '检查完成', data: {
                contract_no: contract_no_by_searched,
                check_work_time: director_work_time,
            }};
        } else {
            return { code: -1, msg: '检查完成' };
        }
    }
    return { code: -1, msg: '检查完成' };
}

exports.add = async params => {
    const { admin_id, addr, type, reason, director, go_out_time, back_time } = params;
    const formData = {
        user_id: admin_id,
        create_time: TIME(),
        addr,
        type,
        go_out_time,
        back_time,
        reason,
        state: '填报中',
        update_time: TIME(),
    };
    const _p = [];
    // 部门
    // _p[0] = new Promise(async resolve => {
    //     const staffEntity = await Staff.findOne({ where: { user_id: admin_id } });
    //     if (staffEntity) formData.branch = staffEntity.dataValues.branch;
    //     resolve();
    // });
    // // 地址
    // _p[1] = new Promise(async resolve => {
    //     const verUnitEntity = await VerUnit.findOne({ where: { company, isdel: 0 } });
    //     if (verUnitEntity) formData.addr = verUnitEntity.dataValues.reg_addr;
    //     resolve();
    // });
    // 指派人
    _p[0] = new Promise(async resolve => {
        const staffEntity = await Staff.findOne({ where: { user_name: director } });
        if (staffEntity) formData.director = staffEntity.dataValues.user_id;
        resolve();
    });
    await Promise.all(_p);
    const result = await BusinessTrip.create(formData);
    return {
        code: 200,
        msg: '创建成功',
        data: result,
    };
}

exports.del = async params => {
    const { id } = params;
    const result = await BusinessTrip.update({ isdel: 1 }, {
        where: { id },
    });
    return {
        code: 200,
        msg: '删除成功',
        data: result,
    };
}

exports.remoteSearchMeetOrder = async params => {
    const { go_out_time, back_time, admin_id } = params;
    const result = await MeetMsg.findAll({
        where: {
            isdel: 0,
            create_person: admin_id,
            isEffect: 1,
            contact_time: {
                $between: [ go_out_time, back_time ],
            }
        },
    });
    return {
        code: 200,
        msg: '',
        data: result,
    };
    // const { keywords, admin_id } = params;
    // const result = await MeetMsg.findAll({
    //     // attributes: [ 'id', 'company', 'contact_name', 'purpose', 'content', 'create_time', 'contact_time' ],
    //     where: {
    //         $or: {
    //             company: { $like: '%' + keywords + '%' },
    //             contact_name: { $like: '%' + keywords + '%' },
    //             contact_phone: { $like: '%' + keywords + '%' },
    //             purpose: { $like: '%' + keywords + '%' },
    //             content: { $like: '%' + keywords + '%' },
    //         },
    //         $and: {
    //             isdel: 0,
    //             create_person: admin_id,
    //             isEffect: 1,
    //         },
    //     },
    // });
    // const resArr = result.map(items => {
    //     return {
    //         text: items.dataValues.contact_name + '（' + DATETIME(items.dataValues.contact_time) + '）',
    //         value: items.id,
    //         data: items,
    //     };
    // });
    // return {
    //     code: 200,
    //     msg: '',
    //     data: resArr,
    // };
}

/******************************** 见面联系单 ***********************************/

/**
 * 见面联系单列表
 */

exports.meetOrderList = async params => {
    const staffMapper = new base.StaffMap().getStaffMap();
    const stateMapper = {
        '填报中': 0,
        '反馈中': 3,
        '审核中': 6,
        '不同意': 9,
        '已通过': 12,
    };
    let total_work_time = 0;
    let { page, num, keywords, filter } = params;
    page = page ? parseInt(page) : 1;
    num = num ? parseInt(num) : 30;
    keywords = keywords ? keywords : '';
    filter = typeof filter === 'string' ? JSON.parse(filter) : filter;
    const where = {
        isdel: 0,
        $or: {
            company: { $like: '%' + keywords + '%' },
            contact_name: { $like: '%' + keywords + '%' },
            contact_phone: { $like: '%' + keywords + '%' },
        },
    };
    const { contact_time, purpose, state, staff } = filter;
    const purposeArr = purpose.split(',').filter(items => items);
    if (purposeArr.length !== 0) where.purpose = { $in: purposeArr };
    const stateArr = state.split(',').filter(items => items);
    stateArr.forEach((items, index) => stateArr[index] = stateMapper[items]);
    if (stateArr.length !== 0) where.state = { $in: stateArr };
    const staffArr = staff.split(',').filter(items => items);
    if (staffArr.length !== 0) {
        const staffUserIdArr = [];
        staffArr.forEach(items => {
            for(const key in staffMapper) {
                if (staffMapper[key].user_name == items) {
                    staffUserIdArr.push(key);
                }
            }
        });
        where.create_person = { $in: staffUserIdArr };
    }
    if (contact_time === '当月') {
        const schemaOrderMonth = moment().format('YYYY-MM');
        where.contact_time = sequelize.literal('date_format(contact_time,"%Y-%m")="'+schemaOrderMonth+'"');
    } else if (contact_time === '上月') {
        const schemaOrderMonth = moment().subtract(1, 'months').format('YYYY-MM');
        where.contact_time = sequelize.literal('date_format(contact_time,"%Y-%m")="'+schemaOrderMonth+'"');
    }
    const result = await MeetMsg.findAndCountAll({
        where,
        limit: num,
        offset: ( page - 1 ) * num,
        order: [[ 'id', 'DESC' ]],
    });
    const amountEntity = await MeetMsg.findOne({
        attributes: [[sequelize.fn('SUM', sequelize.col('check_work_time')), 'check_work_time']],
        where,
    });
    total_work_time = amountEntity.dataValues.check_work_time;
    result.rows.forEach((items, index) => {
        try {
            result.rows[index].dataValues.directorName = staffMapper[items.dataValues.director].user_name;
        } catch (e) {
            result.rows[index].dataValues.directorName = items.dataValues.director;
        }
        try {
            result.rows[index].dataValues.create_person_name = staffMapper[items.dataValues.create_person].user_name;
        } catch (e) {
            result.rows[index].dataValues.create_person_name = items.dataValues.create_person;
        }
        try {
            result.rows[index].dataValues.check_person_name = staffMapper[items.dataValues.check_person].user_name;
        } catch (e) {
            result.rows[index].dataValues.check_person_name = items.dataValues.check_person;
        }
    });
    return {
        code: 200,
        msg: '',
        data: {
            data: result.rows,
            total: result.count,
            id_arr: [],
            total_work_time,
        },
    };
}

/**
 * 同意普通见面联系单
 */
exports.meetOrderNormalAgree = async params => {
    const result = await serviceHyApp.normalAgree(params);
    return result;
}

/**
 * 不同意普通见面联系单
 */
exports.meetOrderNormalDisAgree = async params => {
    const result = await serviceHyApp.normalDisAgree(params);
    return result;
}

/**
 * 同意上门见面联系单
 */
exports.meetOrderAgree = async params => {
    const result = await serviceHyApp.agreeMeetOrder(params);
    return result;
}

/**
 * 不同意上门见面联系单
 */
exports.meetOrderDisAgree = async params => {
    const result = await serviceHyApp.disArgeeMeetOrder(params);
    return result;
}

/**
 * 财务修改认定工时
 */
exports.meetOrderchangeWorkTime = async params => {
    const result = await serviceHyApp.meetOrderchangeWorkTime(params);
    return result;
}

/**
 * 联系单考评
 */
this.contactsOrderAssessment = async params => {
    const that = this;
    const keywords = params.keywords ? params.keywords : '';
    const filter = params.filter ? JSON.parse(params.filter) : {};
    const $and = {
        isdel: 0,
        on_job: 1,
    };
    if(filter.branch) {
        $and.branch = {
            '$in': filter.branch.split(',').filter(items => items)
        }
    }
    if(filter.group) {
        $and.group = {
            '$in': filter.group.split(',').filter(items => items)
        }
    }
    const startDate = filter.startDate ? filter.startDate : moment().startOf('month').format("YYYY-MM-DD")+" 00:00:00";
    const endDate = filter.endDate ? filter.endDate : moment().endOf('month').format("YYYY-MM-DD")+" 23:59:59";
    const result = await Staff.findAndCountAll({
        where: {
            '$and': $and,
            '$or': {
                user_name: {
                    '$like': '%'+keywords+'%'
                },
                user_id: {
                    '$like': '%'+keywords+'%'
                }
            },
        }
    });
    const count = result.count;
    const _p = [], resArr = [];
    result.rows.forEach((items,index) => {
        _p[index] = new Promise(async (resolve,reject) => {
            const { user_id, user_name } = items.dataValues;
            const resObj = await that.targetItemAssessment({
                user_id,
                startDate,
                endDate,
            });
            resObj.user_id = user_id;
            resObj.user_name = user_name;
            resArr.push(resObj);
            resolve();
        });
    });
    await Promise.all(_p);
    return {
        code: 200,
        msg: '',
        data: {
            total: count,
            id_arr: [],
            data: resArr
        }
    };
}

this.targetItemAssessment = async params => {
    const { user_id, company, startDate, endDate } = params;
    const that = this;
    const _p = [], dataObj = { list: [] };
    const staffMapper = new base.StaffMap().getStaffMap();
    _p[0] = new Promise(async resolve => {
        const where = {
            state: {
                $ne: '关闭',
            },
            incoming_time: {
                $between: [ startDate, endDate ],
            },
        };
        if (user_id) {
            where.staff = user_id;
        } else {
            where.contact_unit = company;
        }
        const result = await BaseMsg.findAndCountAll({
            attributes: ['contact_name', 'contact_unit', 'staff', 'content', 'incoming_time'],
            where,
        });
        dataObj.callNum = result.count;
        result.rows.forEach(items => {
            dataObj.list.push({
                type: 'call',
                staff: items.dataValues.staff,
                staffName: staffMapper[items.dataValues.staff] ? staffMapper[items.dataValues.staff].user_name : items.dataValues.staff,
                contact_name: items.dataValues.contact_name,
                company: items.dataValues.contact_unit,
                time: items.dataValues.incoming_time,
                content: items.dataValues.content,
            });
        });
        resolve();
    });
    _p[1] = new Promise(async resolve => {
        const where = {
            state: 12,
            isEffect: 1,
            contact_time: {
                $between: [ startDate, endDate ],
            },
        };
        if (user_id) {
            where.create_person = user_id;
        } else {
            where.company = company;
        }
        const result = await MeetMsg.findAndCountAll({
            attributes: [ 'company', 'contact_name', 'content', 'create_person', 'contact_time' ],
            where,
        });
        dataObj.meetNum = result.count;

        result.rows.forEach(items => {
            dataObj.list.push({
                type: 'meet',
                staff: items.dataValues.create_person,
                staffName: staffMapper[items.dataValues.create_person] ? staffMapper[items.dataValues.create_person].user_name : items.dataValues.create_person,
                contact_name: items.dataValues.contact_name,
                company: items.dataValues.company,
                time: items.dataValues.contact_time,
                content: items.dataValues.content,
            });
        });

        let workTime = 0;
        result.rows.forEach(items => {
            if (items.dataValues.purpose == '上门服务') {
                workTime += Number(items.dataValues.check_work_time);   
            }
        });
        dataObj.workTime = workTime;
        resolve();
    });
    _p[2] = new Promise(async resolve => {
        const where = {
            isdel: 0,
            contact_time: {
                $between: [ startDate, endDate ],
            },
        };
        if (user_id) {
            where.create_person = user_id;
        } else {
            where.company = company;
        }
        const result = await OtherMsg.findAndCountAll({
            attributes: [ 'company', 'contact_name', 'content', 'create_person', 'contact_time' ],
            where,
        });
        dataObj.otherNum = result.count;
        result.rows.forEach(items => {
            dataObj.list.push({
                type: 'other',
                staff: items.dataValues.create_person,
                staffName: staffMapper[items.dataValues.create_person] ? staffMapper[items.dataValues.create_person].user_name : items.dataValues.create_person,
                contact_name: items.dataValues.contact_name,
                company: items.dataValues.company,
                time: items.dataValues.contact_time,
                content: items.dataValues.content,
            });
        });
        resolve();
    });
    _p[3] = new Promise(async resolve => {
        const result = await that.getOnlineContactRecord({
            startDate,
            endDate,
            user_id,
            company,
            needList: true,
        });
        dataObj.onlineNum = result.onlineNum;
        dataObj.list = [ ...dataObj.list, ...result.list ];
        resolve();
    });
    await Promise.all(_p);
    dataObj.list = dataObj.list.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
    return dataObj;
}

this.getOnlineContactRecord = async params => {
    const { startDate, endDate, user_id, needList, company } = params;
    const staffMapper = new base.StaffMap().getStaffMap();
    const list = [];
    const in_p = [];
    let onlineNum = 0;
    if (user_id) {
        await byAdminId();
    } else {
        await byCompany();
    }
    await Promise.all(in_p);
    return {
        list,
        onlineNum,
    };

    async function byAdminId() {
        in_p[0] = new Promise(async reso => {
            const result = await NotiClient.findAndCountAll({
                attributes: [ 'sender', 'post_time', 'title', 'content' ],
                where: {
                    sender: user_id,
                    frontUrl: '/specialLine',
                    isFromCall: 0,
                    post_time: {
                        $between: [ startDate, endDate ],
                    },
                    isdel: 0,
                },
                // distinct: true,
            });
            onlineNum += result.count;
            if (needList) {
                result.rows.forEach(items => {
                    list.push({
                        type: 'online',
                        staff: items.dataValues.sender,
                        staffName: staffMapper[items.dataValues.sender] ? staffMapper[items.dataValues.sender].user_name : items.dataValues.sender,
                        contact_name: items.dataValues.title,
                        company: items.dataValues.title,
                        time: items.dataValues.post_time,
                        content: items.dataValues.content,
                    });
                });
            }
            reso();
        });
        in_p[1] = new Promise(async reso => {
            const result = await NotiClientSub.findAndCountAll({
                include: {
                    model: NotiClient,
                    where: {
                        isdel: 0,
                        isFromCall: 0,
                        sender: { $like: '%ox%' },
                    },
                },
                where: {
                    receiver: user_id,
                    replyTime: {
                        $between: [ startDate, endDate ],
                    },
                    atReply: {
                        '$ne': null,
                    },
                },
                // distinct: true,
            });
            onlineNum += result.count;
            if (needList) {
                const end_p = [];
                result.rows.forEach(async (items, index) => {
                    end_p[index] = new Promise(async resolve => {
                        const open_id = items.dataValues.NotiClient.dataValues.sender;
                        const memebrResult = await Member.findOne({ where: { open_id } });
                        list.push({
                            type: 'online',
                            staff: items.dataValues.receiver,
                            staffName: staffMapper[items.dataValues.receiver] ? staffMapper[items.dataValues.receiver].user_name : items.dataValues.receiver,
                            contact_name: memebrResult ? memebrResult.dataValues.name : '非会员',
                            company: memebrResult ? memebrResult.dataValues.company : '非会员',
                            time: items.dataValues.replyTime,
                            content: items.dataValues.atReply,
                        });
                        resolve();
                    });
                });
                await Promise.all(end_p);
                reso();
            } else {
                reso();
            }
        });
    }

    async function byCompany() {
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 }});
        const memberEntity = await Member.findAll({ where: { company } });
        const customer_id = customerEntity.dataValues.user_id;
        const open_id_arr = [];
        const openIdMapper = {};
        memberEntity.forEach(items => {
            open_id_arr.push(items.dataValues.open_id);
            openIdMapper[items.dataValues.open_id] = items.dataValues;
        });
        // 专线
        in_p[0] = new Promise(async reso => {
            const affairResult = await Affair.findOne({
                where: {
                    customerId: customer_id,
                },
            });
            if (!affairResult) {
                reso();
                return;
            }
            const { uuid } = affairResult.dataValues;
            const result = await NotiClient.findAndCountAll({
                where: {
                    isdel: 0,
                    noti_client_affair_group_uuid: uuid,
                    isFromCall: 0,
                },
            });
            onlineNum += result.count;
            if (needList) {
                result.rows.forEach(items => {
                    list.push({
                        type: 'online',
                        staff: items.dataValues.sender,
                        staffName: staffMapper[items.dataValues.sender] ? staffMapper[items.dataValues.sender].user_name : items.dataValues.sender,
                        contact_name: items.dataValues.title,
                        company: items.dataValues.title,
                        time: items.dataValues.post_time,
                        content: items.dataValues.content,
                    });
                });
            }
            reso();
        });
        // 热线
        in_p[1] = new Promise(async reso => {
            if (open_id_arr.length === 0) {
                reso();
                return;
            }
            const result = await NotiClient.findAndCountAll({
                where: {
                    sender: { $in: open_id_arr },
                    frontUrl: { $ne: '/specialLine' },
                    isFromCall: 0,
                    isdel: 0,
                },
            });
            onlineNum += result.count;
            if (needList) {
                result.rows.forEach(items => {
                    const staff = items.dataValues.subscriber.split(',')[0];
                    list.push({
                        type: 'online',
                        contact_name: openIdMapper[items.dataValues.sender].name,
                        company: openIdMapper[items.dataValues.sender].company,
                        staff,
                        staffName: staffMapper[staff] ? staffMapper[staff].user_name : staff,
                        time: items.dataValues.post_time,
                        content: items.dataValues.content,
                    });
                });
            }
            reso();
        });
    }
}

// 获取所有时间
this.getTotalMeetMsgTime = async () => {
    const meetMsgList = await MeetMsg.findAll({ order: [['contact_time', 'DESC']] });
    const timeSet = new Set();
    meetMsgList.forEach(items => {
        let { contact_time } = items.dataValues;
        contact_time = moment(contact_time).format('YYYY-MM-DD');
        timeSet.add(contact_time);
    });
    let timeArr = [...timeSet];
    timeArr = timeArr.sort((a, b) => {
        return Date.parse(b) - Date.parse(a);
    });
    const mapper = {};
    timeArr.forEach(items => {
        const yyyymm = moment(items).format('YYYY-MM');
        if (!mapper[yyyymm]) {
            mapper[yyyymm] = [];
        }
        mapper[yyyymm].push(items);
    });
    return { code: 200, msg: '', data: mapper };
}

// 根据时间获取照片列表
this.getImageListByContactTime = async params => {
    const { contact_time } = params;
    const where = { isdel: 0 };
    if (contact_time) {
        if (contact_time.split('-').length === 2) {
            where.contact_time = sequelize.literal('date_format(contact_time,"%Y-%m")="'+contact_time+'"');
        } else {
            where.contact_time = contact_time;
        }
    }
    const meetMsgList = await MeetMsg.findAll({ where, order: [['contact_time', 'DESC']] });
    let imageArr = [];
    meetMsgList.forEach(items => {
        let arr;
        try {
            arr = items.dataValues.album.split(',').filter(items => items);
        } catch (e) {
            arr = [];
        }
        imageArr = [ ...imageArr, ...arr ];
    });
    return { code: 200, msg: '', data: imageArr };
}