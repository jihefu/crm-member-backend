const BankCoup = require('../dao').BankCoup;
const BankCoupLog = require('../dao').BankCoupLog;
const BankDepo = require('../dao').BankDepo;
const BankDepoLog = require('../dao').BankDepoLog;
const Customers = require('../dao').Customers;
const Member = require('../dao').Member;
const Wallet = require('../dao').Wallet;
const ContractsHead = require('../dao').ContractsHead;
const sendMQ = require('./rabbitmq').sendMQ;
const bluebird = require('bluebird');
const base = require('./base');
const BankMemberScore = require('../dao').BankMemberScore;

function checkCoupNo(startNo, endNo) {
    if (Number(startNo) > Number(endNo)) {
        return false;
    }
    return true;
}

// 抵价券和保证金
async function calculTotalAmount(userIdArr) {
    let findParams = {};
    if (!userIdArr) {
        // 全部重新计算
    } else {
        // 部分计算，0 < len < 3
        findParams = { where: { user_id: { $in: userIdArr } } };
    }
    const walletListEntity = await Wallet.findAll(findParams);
    await bluebird.map(walletListEntity, async items => {
        const { id } = items.dataValues;
        let total_amount = 0;
        const coupList = await BankCoup.findAll({ where: { own_id: id, isPower: 1 } });
        const depoList = await BankDepo.findAll({ where: { own_id: id, isPower: 1, isdel: 0 } });
        coupList.forEach(items => total_amount += Number(items.amount));
        depoList.forEach(items => total_amount += Number(items.amount));
        await Wallet.update({ total_amount }, { where: { id } });
    }, { concurrency: 5 });
}

const Coup = {
    // 消费预检查
    _consume_check: async params => {
        const { cus_abb, couponNoArr } = params;
        const customerEntity = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
        const { user_id } = customerEntity.dataValues;
        const walletEntity = await Wallet.findOne({ where: { user_id } });
        const { id: walletId } = walletEntity.dataValues;
        const resObj = { code: 200, msg: '检查合法' };
        await bluebird.map(couponNoArr, async items => {
            const coupon_no = items;
            const coupNoEntity = await BankCoup.findOne({ where: { coupon_no } });
            const { isPower, own_id } = coupNoEntity.dataValues;
            if (walletId != own_id || isPower == 0) {
                resObj.code = -1;
                resObj.msg = '非法操作';
            }
        }, { concurrency: 5 });
        calculTotalAmount([ user_id ]);
        return resObj;
    },
    // 创建抵价券
    create: async params => {
        let { amount, num, admin_id } = params;
        amount = amount ? amount : 100;
        num = num ? num : 1;
        const walletCoupEntity = await BankCoup.findOne({limit: 1, offset: 0, order: [['coupon_no', 'DESC']]});
        const lastNum = walletCoupEntity.dataValues.coupon_no;
        const noArr = [];
        for (let i = 0; i < num; i++) {
            let in_coupon_no = String(Number(lastNum) + i + 1);
            in_coupon_no = in_coupon_no.padStart(7, '0');
            noArr.push({
                coupon_no: in_coupon_no,
                amount,
                original_price: amount,
                isPower: 1,
                endTime: null,
                create_time: TIME(),
                create_person: admin_id,
                is_assign: 0,
            });
        }
        try {
            await BankCoup.bulkCreate(noArr);
        } catch (e) {
            return { code: -1, msg: e.message };
        }
        return { code: 200, msg: '操作成功' };
    },
    // 分配
    // assign: async (params, { admin_id }) => {
    //     let isFormatOk = true;
    //     const calculUserIdArr = [];
    //     const cpyArr = params.map(items => {
    //         const start_no = items[2];
    //         const end_no = items[3] ? items[3] : start_no;
    //         if (!start_no || !end_no) {
    //             isFormatOk = false;
    //         }
    //         return {
    //             company: items[0],
    //             endTime: items[1] ? new Date(1900, 0, items[1] - 1) : DATETIME(Date.parse(TIME()) + 60 * 60 * 1000 * 24 * 365),
    //             start_no,
    //             end_no,
    //         }
    //     });
    //     cpyArr.shift();
    //     if (!isFormatOk) {
    //         return { code: -1, msg: '格式错误' };
    //     }
    //     const customerArr = await Customers.findAll({ where: {isdel: 0} });
    //     const memberArr = await Member.findAll();
    //     const customerHashMapper = {}, memberHashMapper = {};
    //     customerArr.forEach(items => {
    //         customerHashMapper[items.dataValues.company] = { user_id: items.dataValues.user_id, company: items.dataValues.company };
    //     });
    //     // 会员手机号mapper
    //     memberArr.forEach(items => {
    //         memberHashMapper[items.dataValues.phone] = { user_id: items.dataValues.user_id, company: items.dataValues.name };
    //     });
    //     const paramArr = [];
    //     for (let i = 0; i < cpyArr.length; i++) {
    //         const items = cpyArr[i];
    //         const obj = {
    //             endTime: items.endTime,
    //             start_no: String(items.start_no).padStart(7, '0'),
    //             end_no: String(items.end_no).padStart(7, '0'),
    //             transferee: '',
    //             transfereePerson: '',
    //         };
    //         if (!customerHashMapper[items.company] && !memberHashMapper[items.company]) {
    //             return { code: -1, msg: items.company + '不存在' };
    //         }
    //         let user_id;
    //         if (customerHashMapper[items.company]) {
    //             user_id = customerHashMapper[items.company].user_id;
    //             const company = customerHashMapper[items.company].company;
    //             obj.transferee = company;
    //             obj.transfereePerson = '';
    //         } else{
    //             user_id = memberHashMapper[items.company].user_id;
    //             obj.transferee = memberHashMapper[items.company].company;
    //             obj.transfereePerson = '';
    //         }
    //         obj.user_id = user_id;
    //         calculUserIdArr.push(user_id);
    //         paramArr.push(obj);
    //     }
    //     const staffMapper = new base.StaffMap().getStaffMap();
    //     let staffName;
    //     try {
    //         staffName = staffMapper[admin_id].user_name;
    //     } catch (e) {
    //         staffName = admin_id;
    //     }
    //     await bluebird.map(paramArr, async items => {
    //         const { endTime, start_no, end_no, user_id, transferee, transfereePerson } = items;
    //         const checkResult = checkCoupNo(start_no, end_no);
    //         if (!checkResult) {
    //             return;
    //         }
    //         const walletEntity = await Wallet.findOne({ where: { user_id } });
    //         if (walletEntity) {
    //             const { id: own_id } = walletEntity.dataValues;
    //             const bankCoupEntity = await BankCoup.findAll({ where: { is_assign: 0, own_id: 0, coupon_no: { $between: [ start_no, end_no ] }} });
    //             if (bankCoupEntity.length === 0) {
    //                 return;
    //             }
    //             await BankCoup.update({
    //                 endTime,
    //                 is_assign: 1,
    //                 own_id,
    //             }, { where: { is_assign: 0, own_id: 0, coupon_no: { $between: [ start_no, end_no ] }}});
    //             for (let i = 0; i < bankCoupEntity.length; i++) {
    //                 const { coupon_no } = bankCoupEntity[i].dataValues;
    //                 sendMQ.sendQueueMsg('general_deal', JSON.stringify({
    //                     type: '2005',
    //                     no: coupon_no,
    //                     noType: '抵价券',
    //                     transferor: '杭州朗杰测控技术开发有限公司',
    //                     transferorPerson: staffName,
    //                     transferee,
    //                     transfereePerson,
    //                     credentials: coupon_no,
    //                     createType: '管理员',
    //                     createPerson: admin_id,
    //                 }));
    //             }
    //             const totalNoArr = bankCoupEntity.map(items => items.coupon_no);
    //             sendMQ.sendQueueMsg('newCoupon', JSON.stringify({
    //                 user_id,
    //                 totalNoArr,
    //             }), result => console.log(result));
    //         }
    //     }, { concurrency: 10 });
    //     calculTotalAmount(calculUserIdArr);
    //     return { code: 200, msg: '已分配' };
    // },
    // 分配
    assign: async params => {
        const { couponNoArr, userId, endTime, admin_id } = params;
        const staffMapper = new base.StaffMap().getStaffMap();
        let staffName, transferee;
        try {
            staffName = staffMapper[admin_id].user_name;
        } catch (e) {
            staffName = admin_id;
        }
        const customerEntity = await Customers.findOne({ where: { user_id: userId } });
        if (customerEntity) {
            transferee = customerEntity.dataValues.company;
        } else {
            const memberEntity = await Member.findOne({ where: { user_id: userId } });
            if (memberEntity) {
                transferee = memberEntity.dataValues.name;
            } else {
                return { code: -1, msg: '不存在该受让人' };
            }
        }
        // 是否存在对应的钱包账户
        // 遍历判断该抵价券是否被分配了
        const walletEntity = await Wallet.findOne({ where: { user_id: userId } });
        if (!walletEntity) {
            return { code: -1, msg: '不存在该账户' };
        }
        const { id: own_id } = walletEntity.dataValues;
        let checkSuccess = true, failMsg;
        await bluebird.map(couponNoArr, async items => {
            const coupon_no = items;
            const bankCouponEntity = await BankCoup.findOne({ where: { coupon_no } });
            if (!bankCouponEntity) {
                checkSuccess = false;
                failMsg = '不存在' + coupon_no;
                return;
            }
            const { own_id } = bankCouponEntity.dataValues;
            if (own_id != 0) {
                checkSuccess = false;
                failMsg = coupon_no + '已被分配';
            }
        }, { concurrency: 10 });
        if (!checkSuccess) {
            return { code: -1, msg: failMsg };
        }
        await bluebird.map(couponNoArr, async items => {
            const coupon_no = items;
            await BankCoup.update({
                endTime,
                is_assign: 1,
                own_id,
            }, { where: { coupon_no }});
            sendMQ.sendQueueMsg('general_deal', JSON.stringify({
                type: '2005',
                no: coupon_no,
                noType: '抵价券',
                transferor: '杭州朗杰测控技术开发有限公司',
                transferorPerson: staffName,
                transferee,
                transfereePerson: '',
                credentials: coupon_no,
                createType: '管理员',
                createPerson: admin_id,
            }));
        }, { concurrency: 10 });
        sendMQ.sendQueueMsg('newCoupon', JSON.stringify({
            user_id: userId,
            totalNoArr: couponNoArr,
        }), result => console.log(result));
        calculTotalAmount([userId]);
        return { code: 200, msg: '分配成功' };
    },
    // 转手
    transfer: async params => {
        const { owner, buyer, no, open_id } = params;
        // 判断该抵价券是否是当前owner
        // 判断该抵价券是否满足转手条件
        // 判断buyer是否合法
        const coupEntity = await BankCoup.findOne({ where: { coupon_no: no } });
        if (!coupEntity) {
            return { code: -1, msg: '不存在该抵价券' };
        }
        const { isPower, id, own_id } = coupEntity.dataValues;
        const walletEntity = await Wallet.findOne({ where: { id: own_id } });
        if (!walletEntity) {
            return { code: -1, msg: '系统异常' };
        }
        const { user_id: ownerUserId } = walletEntity.dataValues;
        if (owner != ownerUserId) {
            return { code: -1, msg: '非法访问' };
        }
        if (isPower != 1) {
            return { code: -1, msg: '不满足转手条件' };
        }
        const buyerWalletEntity = await Wallet.findOne({ where: { user_id: buyer } });
        if (!buyerWalletEntity) {
            return { code: -1, msg: '未找到接手人账户' };
        }
        const { id: buyerWalletId } = buyerWalletEntity.dataValues;
        await BankCoup.update({ own_id: buyerWalletId }, { where: { id } });
        // 转手记录
        // 找到owner名字
        let transferorPerson = '';
        const ownerMemberEntity = await Member.findOne({ where: { user_id: owner } });
        const { name: transferor } = ownerMemberEntity.dataValues;
        // 找到buyer的名字或单位
        let transferee, transfereePerson = '';
        const buyerMemberEntity = await Member.findOne({ where: { user_id: buyer } });
        if (buyerMemberEntity) {
            transferee = buyerMemberEntity.dataValues.name;
        } else {
            buyerCustomerEntity = await Customers.findOne({ where: { user_id: buyer } });
            const buyerMemberEntity = await Member.findOne({ where: { open_id } });
            transferee = buyerCustomerEntity.dataValues.company;
            transfereePerson = buyerMemberEntity.dataValues.name;
        }
        sendMQ.sendQueueMsg('general_deal', JSON.stringify({
            type: '2005',
            no,
            noType: '抵价券',
            transferor,
            transferorPerson,
            transferee,
            transfereePerson,
            credentials: no,
            createType: '会员',
            createPerson: open_id,
        }));
        calculTotalAmount([ owner, buyer ]);
        return { code: 200, msg: '转手成功' };
    },
    // 消费（合同金额抵用）
    consume: async params => {
        const { cus_abb, contractNo, couponNoArr } = params;
        const customerEntity = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
        const { user_id } = customerEntity.dataValues;
        const walletEntity = await Wallet.findOne({ where: { user_id } });
        const { id: walletId } = walletEntity.dataValues;
        await bluebird.map(couponNoArr, async items => {
            const coupon_no = items;
            const coupNoEntity = await BankCoup.findOne({ where: { coupon_no } });
            const { id, isPower, own_id } = coupNoEntity.dataValues;
            if (walletId != own_id || isPower == 0) {
                return;
            }
            await BankCoup.update({ isPower: 0 }, { where: { coupon_no } });
            await BankCoupLog.create({ action: '1', no: contractNo, create_time: TIME(), bank_coup_id: id });
        }, { concurrency: 5 });
        calculTotalAmount([ user_id ]);
        return { code: 200, msg: '操作成功' };
    },
    // 合同删除或关闭导致重新生效
    effectAgain: async params => {
        const { contractNo, couponNoArr } = params;
        const contractEntity = await ContractsHead.findOne({ where: { contract_no: contractNo, isdel: 0 } });
        const { cus_abb } = contractEntity.dataValues;
        const customerEntity = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
        const { user_id } = customerEntity.dataValues;
        const walletEntity = await Wallet.findOne({ where: { user_id } });
        const { id: walletId } = walletEntity.dataValues;
        await bluebird.map(couponNoArr, async items => {
            const coupon_no = items;
            const coupNoEntity = await BankCoup.findOne({ where: { coupon_no } });
            const { id, isPower, own_id } = coupNoEntity.dataValues;
            if (walletId != own_id || isPower == 1) {
                return;
            }
            await BankCoup.update({ isPower: 1 }, { where: { coupon_no } });
            await BankCoupLog.create({ action: '3', no: contractNo, create_time: TIME(), bank_coup_id: id });
        }, { concurrency: 5 });
        await Depo.del({ contract_no: contractNo });
        calculTotalAmount([ user_id ]);
        return { code: 200, msg: '操作成功' };
    },
    // 过期扫描
    timeout: async () => {
        const list = await BankCoup.findAll({ where: { isPower: 1, endTime: { $lte: DATETIME() } } });
        await bluebird.map(list, async items => {
            const { id } = items.dataValues;
            await BankCoup.update({ isPower: 0 }, { where: { id } });
            await BankCoupLog.create({ action: '2', create_time: TIME(), bank_coup_id: id });
        }, { concurrency: 10 });
        calculTotalAmount();
        return { code: 200, msg: '过期扫描完成' };
    },
};

const Depo = {
    _consume_check: async params => {
        const { use_contract_no, use_amount } = params;
        // 判断保证金是否有效
        // 判断保证金的可用值是否够用
        const bankDepoEntity = await BankDepo.findOne({ where: { contract_no: use_contract_no, isdel: 0 } });
        const { isPower, amount } = bankDepoEntity.dataValues;
        if (isPower == 0) {
            return { code: -1, msg: '保证金已失效' };
        }
        if (Number(use_amount) > Number(amount)) {
            return { code: -1, msg: '保证金余额不足' };
        }
        return { code: 200, msg: '检查合法' };
    },
    // 创建保证金（生成一笔交易记录）
    create: async params => {
        const { contract_no, original_amount, admin_id } = params;
        // 先把原来的作废，不考虑原保证金是否被使用过
        await BankDepo.update({ isdel: 1 }, { where: { contract_no } });
        const contractEntity = await ContractsHead.findOne({ where: { contract_no, isdel: 0 } });
        const { cus_abb, company } = contractEntity.dataValues;
        const customerEntity = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
        const { user_id } = customerEntity.dataValues;
        const walletEntity = await Wallet.findOne({ where: { user_id } });
        const { id: walletId } = walletEntity.dataValues;
        await BankDepo.create({
            contract_no,
            original_amount,
            amount: original_amount,
            isPower: 1,
            create_time: TIME(),
            create_person: admin_id,
            own_id: walletId,
            isdel: 0,
            endTime: DATETIME(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2),
        });
        // 生成交易记录
        const staffMapper = new base.StaffMap().getStaffMap();
        let staffName;
        try {
            staffName = staffMapper[admin_id].user_name;
        } catch (e) {
            staffName = admin_id;
        }
        const transferee = company;
        const transfereePerson = '';
        sendMQ.sendQueueMsg('general_deal', JSON.stringify({
            type: '2006',
            no: contract_no,
            noType: '保证金',
            transferor: '杭州朗杰测控技术开发有限公司',
            transferorPerson: staffName,
            transferee,
            transfereePerson,
            credentials: contract_no,
            createType: '管理员',
            createPerson: admin_id,
        }));
        calculTotalAmount([ user_id ]);
        return { code: 200, msg: '新增成功' };
    },
    // 消费
    consume: async function(params) {
        const { use_contract_no, use_amount, to_contract_no } = params;
        const checkRes = await this._consume_check(params);
        if (checkRes.code === -1) {
            return checkRes;
        }
        const bankDepoEntity = await BankDepo.findOne({ where: { contract_no: use_contract_no, isdel: 0 } });
        const { amount, id, own_id } = bankDepoEntity.dataValues;
        const walletEntity = await Wallet.findOne({ where: { id: own_id } });
        const { user_id } = walletEntity.dataValues;
        let lastAmount = Number(amount) - Number(use_amount);
        lastAmount = lastAmount < 0 ? 0 : lastAmount;
        const _isPower = lastAmount === 0 ? 0 : 1;
        await BankDepo.update({ amount: lastAmount, isPower: _isPower }, { where: { id } });
        await BankDepoLog.create({
            action: '1',
            no: to_contract_no,
            use_amount,
            create_time: TIME(),
            bank_depo_id: id,
        });
        calculTotalAmount([ user_id ]);
        return { code: 200, msg: '消费成功' };
    },
    // 重新生效
    effectAgain: async function(params) {
        const { use_contract_no, use_amount, to_contract_no } = params;
        const { amount, original_amount, id, own_id } = await BankDepo.findOne({ where: { contract_no: use_contract_no, isdel: 0 } });
        const walletEntity = await Wallet.findOne({ where: { id: own_id } });
        const { user_id } = walletEntity.dataValues;
        let newAmount = Number(use_amount) + Number(amount);
        newAmount = newAmount > Number(original_amount) ? Number(original_amount) : newAmount;
        await BankDepo.update({ isPower: 1, amount: newAmount }, { where: { id } });
        await BankDepoLog.create({
            action: '3',
            no: to_contract_no,
            use_amount,
            create_time: TIME(),
            bank_depo_id: id,
        });
        // 生成的保证金需要失效掉
        await this.del({ contract_no: to_contract_no });
        calculTotalAmount([ user_id ]);
        return { code: 200, msg: '操作成功' };
    },
    // 此保证金失效
    del: async function(params) {
        const { contract_no } = params;
        const toDepoEntity = await BankDepo.findOne({ where: { contract_no, isdel: 0 } });
        if (toDepoEntity) {
            const { id: toId, amount, own_id } = toDepoEntity.dataValues;
            await BankDepo.update({ isdel: 1 }, { where: { id: toId } });
            await BankDepoLog.create({
                action: '4',
                use_amount: amount,
                create_time: TIME(),
                bank_depo_id: toId,
            });
            const walletEntity = await Wallet.findOne({ where: { id: own_id } });
            const { user_id } = walletEntity.dataValues;
            calculTotalAmount([ user_id ]);
        }
        return { code: 200, msg: '删除保证金成功' };
    },
    // 过期扫描
    timeout: async () => {
        const list = await BankDepo.findAll({ where: { isPower: 1, endTime: { $lte: DATETIME() } } });
        await bluebird.map(list, async items => {
            const { id } = items.dataValues;
            await BankDepo.update({ isPower: 0 }, { where: { id } });
            await BankDepoLog.create({ action: '2', create_time: TIME(), bank_depo_id: id });
        }, { concurrency: 10 });
        calculTotalAmount();
        return { code: 200, msg: '过期扫描完成' };
    },
};

const MemberScore = {
    // 创建新的元宝券
    create: async function(params) {
        const { user_id, score, type, event_code, create_person } = params;
        const walletEntity = await Wallet.findOne({ where: { user_id } });
        const { id: own_id } = walletEntity.dataValues;
        // 新增券
        await BankMemberScore.create({
            score,
            create_person,
            create_time: TIME(),
            own_id,
            rem: type,
            event_code,
        });
        // 计算并更新总分
        const list = await BankMemberScore.findAll({ where: { own_id } });
        let yb_score = 0;
        list.forEach(items => yb_score += Number(items.dataValues.score));
        await Wallet.update({ yb_score }, { where: { id: own_id } });
        return { code: 200, msg: '新增成功' };
    },
    // 消费积分券
    consume: async params => {
        const { user_id, score, consumeRem } = params;
        // 判断自己是否有足够的分
        const walletEntity = await Wallet.findOne({ where: { user_id } });
        const { id: own_id, yb_score } = walletEntity.dataValues;
        if (Number(score) > Number(yb_score)) {
            return { code: -1, msg: '元宝分不足' };
        }
        await BankMemberScore.create({
            score: Math.abs(score) * -1,
            create_time: TIME(),
            own_id,
            rem: consumeRem,
        });
        const list = await BankMemberScore.findAll({ where: { own_id } });
        let new_yb_score = 0;
        list.forEach(items => new_yb_score += Number(items.dataValues.score));
        await Wallet.update({ yb_score: new_yb_score }, { where: { id: own_id } });
        return { code: 200, msg: '消费成功' };
    },
    getList: async params => {
        const { user_id } = params;
        const page = params.page ? Number(params.page) : 1;
        const pageSize = params.pageSize ? Number(params.pageSize) : 10;
        const walletEntity = await Wallet.findOne({ where: { user_id } });
        const { id: own_id } = walletEntity.dataValues;
        const list = await BankMemberScore.findAll({
            where: { own_id },
            order: [[ 'id', 'DESC' ]],
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });
        const staffMapper = new base.StaffMap().getStaffMap();
        const ticketList = list.map((items, index) => {
            list[index].dataValues.create_time = TIME(items.dataValues.create_time);
            if (items.dataValues.create_person) {
                try {
                    list[index].dataValues.create_person_name = staffMapper[items.dataValues.create_person].user_name;
                } catch (e) {
                    list[index].dataValues.create_person_name = items.dataValues.create_person;
                }
            }
            return items.dataValues;
        });
        let ticketScore = await BankMemberScore.sum('score', { where: { own_id } });
        ticketScore = ticketScore ? ticketScore : 0;
        return {
            code: 200,
            msg: '',
            data: {
                ticketScore,
                ticketList,
            },
        };
    },
};

exports.Coup = Coup;
exports.Depo = Depo;
exports.calculTotalAmount = calculTotalAmount;
exports.MemberScore = MemberScore;