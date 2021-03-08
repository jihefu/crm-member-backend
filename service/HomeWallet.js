const homeServiceCustomers = require('./homeCustomers');
const Wallet = require('../dao').Wallet;
const Customers = require('../dao').Customers;
const Member = require('../dao').Member;
const deal = require('./deal');
const BankCoup = require('../dao').BankCoup;
const BankCoupLog = require('../dao').BankCoupLog;
const BankDepo = require('../dao').BankDepo;
const BankDepoLog = require('../dao').BankDepoLog;
const bluebird = require('bluebird');
const common = require('./common');
const sequelize = require('../dao').sequelize;
const moment = require('moment');

/**
 *  新增钱包账户
 */
this.addCount = (params,cb) => {
    const { user_id } = params;
    Wallet.findOne({
        where: {
            user_id: user_id
        }
    }).then(result => {
        if(result){
            cb({
                code: -1,
                msg: '账户已存在',
                data: []
            });
        }else{
            Wallet.create({
                user_id: user_id
            }).then(result => {
                cb({
                    code: 200,
                    msg: '账户创建成功',
                    data: []
                });
            }).catch(e => LOG(e));
        }
    }).catch(e => LOG(e));
}

// @Override
this.list = async (params, cb) => {
    let num = params.num?parseInt(params.num):30;
	let page = params.page?parseInt(params.page):1;
    let keywords = params.keywords?params.keywords:'';
    let order = params.order?params.order:'id';
    let { type } = JSON.parse(params.filter);
    if(order=='id'){
        order = [['id','DESC']];
    }else if(order=='hignToLow'){
        order = [['total_amount','DESC']];
    }else{
        order = [['total_amount']];
    }
    const searchTypeResult = await new Promise(async resolve => {
        if (keywords != '') {
            if(/^[\u4e00-\u9fa5]+$/.test(keywords)){
                if (type === '会员') {
                    // 会员名搜索
                    const memberEntityList = await Member.findAll({ where: { isdel: 0, name: { $like: '%'+keywords+'%' } } });
                    const userIdArr = memberEntityList.map(items => items.dataValues.user_id);
                    resolve({type: 1, userIdArr});
                } else {
                    // 公司名搜索
                    const where = { isdel: 0, company: { $like: '%'+keywords+'%' } };
                    const customerEntityList = await Customers.findAll({ where });
                    const userIdArr = customerEntityList.map(items => items.dataValues.user_id);
                    resolve({type: 1, userIdArr});
                }
            }else{  // 合同号或者抵价券搜索
                const walletCoupEntityList = await BankCoup.findAll({where: {isPower: 1,coupon_no: {'$like': '%'+keywords+'%'}}});
                const walletIdCoupArr = walletCoupEntityList.map(items => items.dataValues.own_id);
                const walletDepoEntityList = await BankDepo.findAll({where: {isdel: 0,isPower: 1,contract_no: {'$like': '%'+keywords+'%'}}});
                const walletIdDepoArr = walletDepoEntityList.map(items => items.dataValues.own_id);
                let walletIdArr = [...new Set([...walletIdCoupArr,...walletIdDepoArr])];
                if (type === '会员') {
                    walletIdArr = walletIdArr.filter(items => Number.parseInt(items) > 30000);
                } else {
                    walletIdArr = walletIdArr.filter(items => Number.parseInt(items) < 30000);
                }
                resolve({
                    type: 2,
                    walletIdArr,
                });
            }
        } else {
            resolve({
                type: 0,
            });
        }
    });
    let cond = { where: {}, limit: num, offset: (page -1) * num, order };
    if (searchTypeResult.type === 0) {
        // 直接搜索
        if (type === '会员') {
            cond.where.user_id = { $gt: 30000 };
        } else {
            cond.where.user_id = { $lt: 30000 };
        }
    } else if (searchTypeResult.type === 1) {
        // user_id 搜索
        cond.where = { user_id: { '$in': searchTypeResult.userIdArr }};
    } else {
        // wallet_id 搜索
        cond.where = { id: { '$in': searchTypeResult.walletIdArr }};
    }
    const userIdMapper = {};
    const customerList = await Customers.findAll({ where: { isdel: 0 } });
    const memberList = await Member.findAll({ where: { isdel: 0 } });
    customerList.forEach(items => {
        if (!userIdMapper[items.dataValues.user_id]) {
            userIdMapper[items.dataValues.user_id] = items.dataValues.company;
        }
    });
    memberList.forEach(items => {
        if (!userIdMapper[items.dataValues.user_id]) {
            userIdMapper[items.dataValues.user_id] = items.dataValues.name;
        }
    });
    const walletEntityList = await Wallet.findAndCountAll(cond);
    walletEntityList.rows.forEach((items,index) => {
        walletEntityList.rows[index].dataValues.company = userIdMapper[items.dataValues.user_id];
    });
    cb({
        code: 200,
        msg: '',
        data: {
            data: walletEntityList.rows,
            id_arr: [],
            total: walletEntityList.count,
        }
    });
}

/**
 *  获取指定user_id的钱包
 */
this.getTargetItem = async (params,cb) => {
    const { user_id } = params;
    const walletEntity = await Wallet.findOne({ where: { user_id } });
    const { id: own_id } = walletEntity.dataValues;
    const bankCoupList = await BankCoup.findAll({ where: { own_id, isPower: 1, amount: { $ne: 0 } }, order: [[ 'id', 'DESC' ]] });
    const WalletCoups = bankCoupList.map(items => items.dataValues);
    const bankDepoList = await BankDepo.findAll({ where: { own_id, isPower: 1, amount: { $ne: 0 }, isdel: 0 }, order: [[ 'id', 'DESC' ]] });
    const WalletDepos = bankDepoList.map(items => items.dataValues);
    walletEntity.dataValues.WalletCoups = WalletCoups;
    walletEntity.dataValues.WalletDepos = WalletDepos;
    const customerEntity = await Customers.findOne({ where: { user_id } });
    if (customerEntity) {
        walletEntity.dataValues.company = customerEntity.dataValues.company;
    } else {
        const memberEntity = await Member.findOne({ where: { user_id } });
        walletEntity.dataValues.company = memberEntity ? memberEntity.dataValues.name : '';
    }
    cb({
        code: 200,
        msg: '',
        data: walletEntity,
    });
}

this.getCustomCoup = async user_id => {
    const walletEntity = await Wallet.findOne({ where: { user_id } });
    const { id: own_id } = walletEntity.dataValues;
    const bankCoupList = await BankCoup.findAll({ where: { own_id }, order: [[ 'id', 'DESC' ]] });
    const coupArr = bankCoupList.map(items => items.dataValues);
    walletEntity.dataValues.WalletCoups = coupArr;
    return walletEntity;
}

// 指定抵价券的流水和交易记录
exports.getTargetCoupLog = async coupon_no => {
    const bankCoupEntity = await BankCoup.findOne({ where: { coupon_no } });
    const { id: bank_coup_id } = bankCoupEntity.dataValues;
    const list = await BankCoupLog.findAll({ where: { bank_coup_id } });
    const lifeList = list.map((items, index) => {
        const { action, create_time } = items.dataValues;
        if (action == 1) {
            list[index].dataValues.actionName = '消费';
        } else if (action == 2) {
            list[index].dataValues.actionName = '过期';
        } else if (action == 3) {
            list[index].dataValues.actionName = '恢复';
        }
        list[index].dataValues.create_time = TIME(create_time);
        return items.dataValues;
    });
    bankCoupEntity.dataValues.lifeList = lifeList;
    const dealList = await common.getTradingRecordByOwnerId(coupon_no, [ '2005' ]);
    dealList.map((items, index) => {
        const { create_time } = items;
        dealList[index].create_time = TIME(create_time);
    });
    bankCoupEntity.dataValues.dealList = dealList;
    bankCoupEntity.dataValues.logs = mergeLifeAndDeal(lifeList, dealList);
    return bankCoupEntity;

    function mergeLifeAndDeal(lifeList, dealList) {
        let list = [ ...lifeList, ...dealList ];
        list.forEach((items, index) => {
            if (!items.actionName) {
                list[index].actionName = '交易';
            }
        });
        list = list.sort((a, b) => {
            return Date.parse(a.create_time) - Date.parse(b.create_time);
        });
        return list;
    }
}

// 指定保证金的流水
exports.getTargetDepoLog = async contract_no => {
    const bankDepoEntity = await BankDepo.findOne({ where: { contract_no, isdel: 0 } });
    const { id: bank_depo_id } = bankDepoEntity.dataValues;
    const list = await BankDepoLog.findAll({ where: { bank_depo_id } });
    list.map((items, index) => {
        const { action, create_time } = items.dataValues;
        if (action == 1) {
            list[index].dataValues.actionName = '消费';
        } else if (action == 2) {
            list[index].dataValues.actionName = '过期';
        } else if (action == 3) {
            list[index].dataValues.actionName = '恢复';
        } else if (action == 4) {
            list[index].dataValues.actionName = '失效';     // 合同关闭导致
        }
        list[index].dataValues.create_time = TIME(create_time);
    });
    bankDepoEntity.dataValues.lifeList = list;
    return bankDepoEntity;
}

/*********************************************** 保证金 ******************************************************/

/**
 *   同意定价单
 *   新增服务保证金
 *  （定价单管理的下游服务）
 *  ---------------------
 */
this.addDepo = async (params,cb) => {
    const { contract_no, amount, admin_id } = params;
    const result = await deal.Depo.create({
        contract_no,
        original_amount: amount,
        admin_id,
    });
    cb(result);
}

/**
 *  删除关闭合同时触发
 *  --------------------------
 */
this.delDepo = async (params,cb) => {
    let { couponNoArr, depoArr, contractNo } = params;
    couponNoArr = couponNoArr.filter(items => items);
    await deal.Coup.effectAgain({ contractNo, couponNoArr });
    await bluebird.map(depoArr, async items => {
        await deal.Depo.effectAgain(items);
    }, { concurrency: 5 });
    if (cb) {
        cb({ code: 200, msg: '操作成功' });
    }
    return { code: 200, msg: '操作成功' };
}

/**
 *  确认优惠金额是否大于保证金面值金额
 */
this.checkDepoAmount = async (params,cb) => {
    const { contract_no, outputAmount } = params;
    const result = await deal.Depo._consume_check({
        use_contract_no: contract_no,
        use_amount: outputAmount,
    });
    cb(result);
}

/**
 *  确认优惠金额是否大于抵价券面值金额
 */
this.checkCoupAmount = async (params,cb) => {
    let { cus_abb, contractNo, couponNoArr } = params;
    couponNoArr = couponNoArr.filter(items => items);
    const result = await deal.Coup._consume_check({ cus_abb, contractNo, couponNoArr });
    if (cb) {
        cb(result);
    }
    return result;
}

/**
 *  新增合同，优惠选项时触发
 *  ----------------------
 */
this.useCoup = async (params,cb) => {
    let { cus_abb, contractNo, couponNoArr } = params;
    couponNoArr = couponNoArr.filter(items => items);
    const result = await deal.Coup.consume({ cus_abb, contractNo, couponNoArr });
    if (cb) {
        cb(result);
    }
    return result;
}

/**
 *  新增合同，优惠选项时触发
 *  ----------------------
 */
this.useDepo = async (params,cb) => {
    const { use_contract_no, use_amount, to_contract_no } = params;
    const result = await deal.Depo.consume({ use_contract_no, use_amount, to_contract_no });
    cb(result);
}

/**
 *  撤销定价单审核
 *  -------------
 */
this.failDepo = async (params,cb) => {
    // 作废该保证金
    const { contract_no } = params;
    const result = await deal.Depo.del({ contract_no });
    cb(result);
}

/**
 *  远程搜索抵价券
 *  @return 有效的有余额的抵价券
 */
this.remoteSearchCouponNo = (params,cb) => {
    const { cus_abb, keywords } = params;
    if(!cus_abb) return;
    homeServiceCustomers.getTargetItem({
        targetKey: cus_abb
    },result => {
        const user_id = result.data.dataValues.user_id;
        Wallet.findOne({
            where: {
                user_id,
            }
        }).then(async result => {
            const { id } = result.dataValues;
            const r = await BankCoup.findAll({ where: { own_id: id, isPower: 1, amount: { $ne: 0 }, coupon_no: { $like: '%'+keywords+'%' }} });
            const resArr = [];
            r.forEach(items => {
                resArr.push({
                    text: items.dataValues.coupon_no,
                    value: items.dataValues.coupon_no,
                    data: {
                        coupon_no: items.dataValues.coupon_no,
                        amount: items.dataValues.amount
                    }
                });
            });
            cb({
                code: 200,
                msg: '',
                data: resArr
            });
        }).catch(e => LOG(e));
    });
}

/**
 *  抵价券过期失效
 */
this.overTimeCoup = async (params,cb) => {
    const result = await deal.Coup.timeout();
    cb(result);
}

/**
 *  保证金过期失效
 */
this.overTimeDepo = async (params,cb) => {
    const result = await deal.Depo.timeout();
    cb(result);
}

/**
 * 抵价券印钞
 */
this.printCoup = async params => {
    const { amount, num, admin_id } = params;
    const result = await deal.Coup.create({ amount, num, admin_id });
    return result;
}

/**
 * 抵价券列表
 */
this.bankCoupList = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.num ? Number(params.num) : 30;
    const keywords = params.keywords ? params.keywords : '';
    const filter = params.filter ? JSON.parse(params.filter) : {};
    let order = params.order ? params.order : 'coupon_no';
    if (order === 'coupon_no') {
        order = ['coupon_no'];
    } else if (order === 'coupon_no_desc') {
        order = ['coupon_no', 'DESC'];
    }
    const findParams = {
        include: [{
            model: Wallet,
            association: BankCoup.hasMany(Wallet, { foreignKey: 'id', sourceKey: 'own_id'}),
        }],
        where: { coupon_no: { $like: '%'+keywords+'%' }},
        order: [ order ],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        required: false,
    };
    const { status, closeToEndTime } = filter;
    if (status === '未分配') {
        findParams.where.is_assign = 0;
    } else if (status === '未使用') {
        findParams.where.is_assign = 1;
        findParams.where.isPower = 1;
        if (closeToEndTime === '半年') {
            findParams.where.endTime = { $between: [moment().format('YYYY-MM-DD'), moment().subtract(-6, 'months').format('YYYY-MM-DD')] };
        } else if (closeToEndTime === '三个月') {
            findParams.where.endTime = { $between: [moment().format('YYYY-MM-DD'), moment().subtract(-3, 'months').format('YYYY-MM-DD')] };
        } else if (closeToEndTime === '一个月') {
            findParams.where.endTime = { $between: [moment().format('YYYY-MM-DD'), moment().subtract(-1, 'months').format('YYYY-MM-DD')] };
        }
    } else if (status === '已使用') {
        findParams.where.is_assign = 1;
        findParams.where.isPower = 0;
        findParams.include.push({
            model: BankCoupLog,
            where: { action: 1 },
        });
    } else {
        // 已过期
        findParams.where.is_assign = 1;
        findParams.where.isPower = 0;
        findParams.include.push({
            model: BankCoupLog,
            where: { action: 2 },
        });
    }
    const result = await BankCoup.findAndCountAll(findParams);
    const memberList = await Member.findAll();
    const customerList = await Customers.findAll({ where: { isdel: 0 } });
    const memberMapper = {}, customerMapper = {};
    customerList.forEach(items => customerMapper[items.dataValues.user_id] = items.dataValues.company);
    memberList.forEach(items => memberMapper[items.dataValues.user_id] = items.dataValues.name);
    result.rows.forEach((items, index) => {
        result.rows[index].dataValues.status = filter.status;
        if (items.dataValues.Wallets.length !== 0) {
            const user_id = items.dataValues.Wallets[0].user_id;
            if (customerMapper[user_id]) {
                result.rows[index].dataValues.owner = customerMapper[user_id];
            } else if (memberMapper[user_id]) {
                result.rows[index].dataValues.owner = memberMapper[user_id];
            }
        }
    });
    return {
        code: 200,
        msg: '',
        data: {
            id_arr: [],
            data: result.rows,
            total: result.count,
        },
    };
}

/**
 * 批量分配抵价券
 */
this.createCouponByExcel = async (params, options, cb) => {
    const result = await deal.Coup.assign(params, options);
    cb(result);
}

this.assignCouponByUserId = async params => {
    let { couponNoArr, userId, endTime, admin_id } = params;
    couponNoArr = typeof couponNoArr === 'string' ? JSON.parse(couponNoArr) : couponNoArr;
    const result = await deal.Coup.assign({ couponNoArr, userId, endTime, admin_id });
    return result;
}

/**
 * 转手抵价券
 */
this.resaleCoup = async params => {
    const { owner, buyer, no, open_id } = params;
    const result = await deal.Coup.transfer({ owner, buyer, no, open_id });
    return result;
}

/**
 * 指定抵价券信息
 */
exports.couponNoInfo = async coupon_no => {
    return await BankCoup.findOne({ where: { coupon_no } });
}

/**
 * 指定保证金信息
 */
exports.depoInfo = async contract_no => {
    return await BankDepo.findOne({ where: { contract_no, isdel: 0 } });
}