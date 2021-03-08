const common = require('./common');
const base = require('./base');
const Linq = require('linq');
const request  = require('request');
const homePricingList = require('./homePricingList');
const customers = require('./customers');
const sequelize = require('../dao').sequelize;
const Staff = require('../dao').Staff;
const ContractsHead = require('../dao').ContractsHead;
const ContractsBody = require('../dao').ContractsBody;
const ContractsOffer = require('../dao').ContractsOffer;
const Customers = require('../dao').Customers;
const PricingList = require('../dao').PricingList;
const ProductsSelectLog = require('../dao').ProductsSelectLog;
const ProductsSpecLog = require('../dao').ProductsSpecLog;
const homeServiceWallet = require('./homeWallet');
const PricingListGoods = require('../dao').PricingListGoods;
const Wallet = require('../dao').Wallet;
const Products = require('../dao').Products;
const sendMQ = require('./rabbitmq').sendMQ;
const homeAttendance = require('./homeAttendance');
const BaseMsg = require('../dao').BaseMsg;
const MeetMsg = require('../dao').MeetMsg;
const OtherMsg = require('../dao').OtherMsg;
const homeBusinessTrip = require('./homeBusinessTrip');
const serviceContracts = require('./contract');
const service = require('./service');
const bluebird = require('bluebird');
const BankDepo = require('../dao').BankDepo;
const PackingList = require('../dao').PackingList;
const moment = require('moment');
const serviceProductOrder = require('./homeProductOrder');

/**
 * 	@param 	{object}
 *  @return {object}
 */
this.listCondition = (params,cb) => {
	const { keywords,filter } = params;

	const manageCustomerId = new base.SearchCustomerId(keywords,filter);
	let whereAnd = manageCustomerId.getWhereAnd();
	cb({
        include: manageCustomerId.getIncludeCondition(),
        distinct: true,
        where: {
            '$or': manageCustomerId.getWhereOr(),
            '$and': whereAnd
        }
    });
}

const trans = (arr,cb) => {
    let _p = [];
    arr.forEach((items,index) => {
        _p[index] = new Promise((resolve,reject) => {
            let i = index;
            let it = items;
            let p1 = new Promise((resolve,reject) => {
                common.idTransToName({
                    user_id: it.sale_person
                },(sale_person) => {
                    arr[i].sale_person = sale_person;
                    resolve();
                });
            });
            let p2 = new Promise((resolve,reject) => {
                common.idTransToName({
                    user_id: it.insert_person
                },(insert_person) => {
                    arr[i].insert_person = insert_person;
                    resolve();
                });
            });
            let p3 = new Promise((resolve,reject) => {
                common.idTransToName({
                    user_id: it.update_person
                },(update_person) => {
                    arr[i].update_person = update_person;
                    resolve();
                });
            });
            let p4 = new Promise((resolve,reject) => {
                common.transToCnAbb({
                    abb: it.cus_abb
                },(result) => {
                    arr[i].cus_abb = result.company?result.company:result;
                    if(result.credit_qualified==1){
                        arr[i].credit_qualified = 1;
                    }else if(result.credit_qualified==0){
                        arr[i].credit_qualified = 0;
                    }else{
                        arr[i].credit_qualified = 2;
                    }
                    resolve();
                });
            });
            Promise.all([p1,p2,p3,p4]).then(() => {
                resolve();
            }).catch(e => LOG(e));
        });
    });
    Promise.all(_p).then(() => {
        cb(arr);
    }).catch(e => {
        LOG(e);
        cb(arr);
    });
}

/**
 *  合同列表
 */
this.list = async (params,cb) => {
    let num = params.num?parseInt(params.num):30;
	let page = params.page?parseInt(params.page):1;
    let keywords = params.keywords?params.keywords:'';
    let order = params.order?params.order:'id';
    let filter = params.filter?JSON.parse(params.filter):{};
    let searchSnRem = false;
    if (['1006', '1101'].includes(String(params.admin_id))) {
        searchSnRem = true;
    }
    let cpyArr = [],staffArr = [];
    const _p = [];
    let idArr = [],total,res_arr = [];
    let sumTotalAmount = 0,sumPayable = 0,sumPaid = 0;
    // if (filter.new_customer == '一年新' || filter.new_customer == '二年新') {
    //     newCustomerSearch();
    //     return;
    // }
    if (checkSearchFun()) {
        simpleSearch();
        return;
    }
    const filterToArrFun = (cb) => {
        try{
            filter.group = typeof filter.group === 'string' ? JSON.parse(filter.group.split(',').filter(items => items)) : filter.group;
        }catch(e){
            filter.group = [];
        }
        try{
            filter.contract_state = filter.contract_state.split(',').filter(items => items);
        }catch(e){
            filter.contract_state = [];
        }
        try{
            filter.delivery_time = filter.delivery_time.split(',').filter(items => items);
        }catch(e){
            filter.delivery_time = [];
        }
        try{
            filter.overdraft = filter.overdraft.split(',').filter(items => items);
        }catch(e){
            filter.overdraft = [];
        }
        try{
            filter.isDirectSale = filter.directSale.split(',').filter(items => items);
        }catch(e){
            filter.isDirectSale = [];
        }
        try{
            filter.delivery_state = filter.delivery_state.split(',').filter(items => items);
        }catch(e){
            filter.delivery_state = [];
        }
        const obj = {};
        const filt_p = new Promise((resolve,reject) => {
            if(filter.group[0]!=null){
                Staff.findAll({
                    where: {
                        isdel: 0,
                        group: {
                            '$in': filter.group
                        }
                    }
                }).then(result => {
                    const userIdArr = result.map(items => items.dataValues.user_id);
                    obj.sale_person = {
                        '$in': userIdArr
                    };
                    resolve();
                }).catch(e => LOG(e));
            }else{
                resolve();
            }
        });
        filt_p.then(() => {
            if(filter.contract_state[0]!=null){
                obj.contract_state = {
                    '$in': filter.contract_state
                };
            }
            /***********是否发货**********/
            if(filter.delivery_time.length==1){
                if(filter.delivery_time[0]=='已发货'){
                    obj.delivery_time = {
                        '$ne': null
                    };
                }else{
                    obj.delivery_time = {
                        '$eq': null
                    };
                }
            }
            /*********是否欠款************/
            if(filter.overdraft.length==1){
                if(filter.overdraft[0]=='欠款'){
                    obj.payable = {
                        '$ne': sequelize.col('paid')
                    };
                }else{
                    obj.payable = {
                        '$eq': sequelize.col('paid')
                    };
                }
            }
            /***********指定时间后*****************/
            let sign_time = filter.sign_time?filter.sign_time:'2013-01';
            obj.sign_time = {
                '$gte': sign_time
            }
            /***********是否直销*****************/
            if (filter.isDirectSale.length === 1) {
                if (filter.isDirectSale[0] == '直销') {
                    obj.isDirectSale = 1;
                } else {
                    obj.isDirectSale = 0;
                }
            }
            if (filter.delivery_state.length !== 0) {
                obj.delivery_state = { $in: filter.delivery_state };
            }
            if (filter.new_customer == '一年新') {
                obj.grade = 1;
            } else if (filter.new_customer == '二年新') {
                obj.grade = 2;
            }
            cb(obj);
        });
    }
    this.listCondition({keywords: keywords,filter: filter},whereCondition => {
        //根据搜索关键字和筛选条件得到的客户结果
		const getAllCpyData = (cb) => {
			Customers.findAll(whereCondition).then(result => {
                cpyArr = result.map(items => items.dataValues.abb);
                cb();
            }).catch(e => LOG(e));
        }

        //根据关键字得到的业务员结果
        const getAllStaffData = (cb) => {
            Staff.findAll(new base.SearchStaffId(keywords).getCondition()).then(result => {
                staffArr = result.map(items => items.dataValues.user_id);
                cb();
            }).catch(e => LOG(e));
        }

        //获取到contractHead的结果
        const dealerResult = (result) => {
            total = result.count;
            const c_p = [];
            result.rows.forEach((items,index) => {
                res_arr.push(items.dataValues);
                c_p[index] = new Promise((resolve,reject) => {
                    let i = index;
                    ContractsBody.findAll({
                        where: {
                            contract_no: items.dataValues.contract_no
                        }
                    }).then(result => {
                        let bodyArr = [];
                        result.forEach((it,ind) => {
                            bodyArr.push(it.dataValues);
                        });
                        res_arr[i].bodyArr = bodyArr;
                        resolve();
                    }).catch(e => LOG(e));
                });
            });
            Promise.all(c_p).then(()=> {
                trans(res_arr,(res_arr) => {
                    for (let i = 0; i < idArr.length; i++) {
                        for (let j = 0; j < res_arr.length; j++) {
                            if(idArr[i]==res_arr[j].id){
                                break;
                            }else if(idArr[i]!=res_arr[j].id&&j==res_arr.length-1){
                                idArr.splice(i,1);
                                i--;
                            }
                        }
                    }
                    cb({
                        code: 200,
                        msg: '',
                        data: {
                            data: res_arr,
                            id_arr: idArr,
                            total: total,
                            sumTotalAmount: sumTotalAmount,
                            sumPayable: sumPayable,
                            sumPaid: sumPaid
                        }
                    });
                });
            }).catch(e => LOG(e));
        }

        //main
        _p[0] = new Promise((resolve,reject) => {
            getAllCpyData(result => resolve());
        });
        _p[1] = new Promise((resolve,reject) => {
            getAllStaffData(result => resolve());
        });
        Promise.all(_p).then(result => {
            filterToArrFun(whereAnd => {
                //标记
                if(order=='id'){
                    order = ['id','DESC'];
                }else if(order=='update_time'){
                    order = ['update_time','DESC'];
                }else if (order=='delivery_state') {
                    order = ['delivery_state'];
                }
                let markOrder;
                common.infoMark({
                    type: 'ContractsHead'
                },resObj => {
                    const { str,id_arr } = resObj;
                    idArr = id_arr;
                    if(str){
                        markOrder =	[[sequelize.literal('if('+str+',0,1)')],order];
                    }else{
                        markOrder =	[order];
                    }
                    if (order=='delivery_state') {
                        markOrder = [...markOrder, ['id','DESC']];
                    }
                    const where = {
                        isdel: 0,
                        '$and': whereAnd,
                        '$or': {
                            cus_abb: {
                                '$in': cpyArr
                            },
                            sale_person: {
                                '$in': staffArr
                            },
                            contract_no: {
                                '$like': '%'+keywords+'%'
                            },
                            snGroup: {
                                $like: '%' + keywords + '%',
                            },
                            otherSnGroup: {
                                $like: '%' + keywords + '%',
                            },
                        }
                    };
                    if (searchSnRem) {
                        where.$or.snGroupRem = { $like: '%' + keywords + '%' };
                        where.$or.otherSnGroupRem = { $like: '%' + keywords + '%' };
                    }
                    /****************************获取数据和sum*******************************/
                    const _in_p = [];
                    _in_p[0] = new Promise((resolve,reject) => {
                        ContractsHead.findAndCountAll({
                            include: [ContractsOffer],
                            where,
                            limit: num,
                            offset: (page -1) * num,
                            order: markOrder,
                            distinct: true
                        }).then(result => {
                            resolve(result);
                        }).catch(e => LOG(e));
                    });
                    _in_p[1] = new Promise((resolve,reject) => {
                        ContractsHead.findAll({
                            attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')),'sumTotalAmount'],
                                        [sequelize.fn('SUM', sequelize.col('payable')),'sumPayable'],
                                        [sequelize.fn('SUM', sequelize.col('paid')),'sumPaid'],],
                            where,
                        }).then(result => {
                            sumTotalAmount = result[0].dataValues.sumTotalAmount;
                            sumPayable = result[0].dataValues.sumPayable;
                            sumPaid = result[0].dataValues.sumPaid;
                            resolve(result);
                        }).catch(e => LOG(e));
                    });
                    Promise.all(_in_p).then(result => {
                        dealerResult(result[0]);
                    }).catch(e => LOG(e));
                });
            });
        }).catch(e => LOG(e));
    });

    function checkSearchFun() {
        try{
            filter.group = filter.group.split(',').filter(items => items);
        }catch(e){
            filter.group = [];
        }
        if (filter.group.length === 1) return false;
        if (keywords) return false;
        return true;
    }

    // 简单搜索
    async function simpleSearch() {
        const where = {
            isdel: 0,
        };
        try{
            filter.contract_state = filter.contract_state.split(',').filter(items => items);
        }catch(e){
            filter.contract_state = [];
        }
        try{
            filter.overdraft = filter.overdraft.split(',').filter(items => items);
        }catch(e){
            filter.overdraft = [];
        }
        try{
            filter.delivery_time = filter.delivery_time.split(',').filter(items => items);
        }catch(e){
            filter.delivery_time = [];
        }
        try{
            filter.isDirectSale = filter.directSale.split(',').filter(items => items);
        }catch(e){
            filter.isDirectSale = [];
        }
        try{
            filter.delivery_state = filter.delivery_state.split(',').filter(items => items);
        }catch(e){
            filter.delivery_state = [];
        }
        if(filter.contract_state.length !== 0){
            where.contract_state = {
                '$in': filter.contract_state,
            };
        }
        if(filter.delivery_time.length==1){
            if(filter.delivery_time[0]=='已发货'){
                where.delivery_time = {
                    '$ne': null
                };
            }else{
                where.delivery_time = {
                    '$eq': null
                };
            }
        }
        if(filter.overdraft.length==1){
            if(filter.overdraft[0]=='欠款'){
                where.payable = {
                    '$ne': sequelize.col('paid')
                };
            }else{
                where.payable = {
                    '$eq': sequelize.col('paid')
                };
            }
        }
        if(filter.isDirectSale.length==1){
            if(filter.isDirectSale[0]=='直销'){
                where.isDirectSale = 1;
            }else{
                where.isDirectSale = 0;
            }
        }
        if (filter.delivery_state.length !== 0) {
            where.delivery_state = { $in: filter.delivery_state };
        }
        if (filter.new_customer == '一年新') {
            where.grade = 1;
        } else if (filter.new_customer == '二年新') {
            where.grade = 2;
        }
        let sign_time = filter.sign_time?filter.sign_time:'2013-01';
        where.sign_time = {
            '$gte': sign_time
        }

        //标记
        if(order=='id'){
            order = ['id','DESC'];
        }else if(order=='update_time'){
            order = ['update_time','DESC'];
        }else if (order=='delivery_state') {
            order = ['delivery_state'];
        }
        let markOrder;
        common.infoMark({
            type: 'ContractsHead'
        },async resObj => {
            const { str,id_arr } = resObj;
            idArr = id_arr;
            if(str){
                markOrder =	[[sequelize.literal('if('+str+',0,1)')],order];
            }else{
                markOrder =	[order];
            }
            if (order=='delivery_state') {
                markOrder = [...markOrder, ['id','DESC']];
            }

            const _in_p = [];

            _in_p[0] = new Promise(async (resolve) => {
                const result = await ContractsHead.findAndCountAll({
                    include: [ContractsOffer],
                    where,
                    limit: num,
                    offset: (page -1) * num,
                    order: markOrder,
                    distinct: true
                });
                resolve(result);
            });

            _in_p[1] = new Promise((resolve,reject) => {
                ContractsHead.findAll({
                    attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')),'sumTotalAmount'],
                                [sequelize.fn('SUM', sequelize.col('payable')),'sumPayable'],
                                [sequelize.fn('SUM', sequelize.col('paid')),'sumPaid'],],
                    where,
                }).then(result => {
                    sumTotalAmount = result[0].dataValues.sumTotalAmount;
                    sumPayable = result[0].dataValues.sumPayable;
                    sumPaid = result[0].dataValues.sumPaid;
                    resolve(result);
                }).catch(e => LOG(e));
            });

            Promise.all(_in_p).then(result => {
                dealerResult(result[0]);
            }).catch(e => LOG(e));
            
        });

        //获取到contractHead的结果
        function dealerResult(result) {
            total = result.count;
            const c_p = [];
            result.rows.forEach((items,index) => {
                res_arr.push(items.dataValues);
                c_p[index] = new Promise((resolve,reject) => {
                    let i = index;
                    ContractsBody.findAll({
                        where: {
                            contract_no: items.dataValues.contract_no
                        }
                    }).then(result => {
                        let bodyArr = [];
                        result.forEach((it,ind) => {
                            bodyArr.push(it.dataValues);
                        });
                        res_arr[i].bodyArr = bodyArr;
                        resolve();
                    }).catch(e => LOG(e));
                });
            });
            Promise.all(c_p).then(()=> {
                trans(res_arr,(res_arr) => {
                    for (let i = 0; i < idArr.length; i++) {
                        for (let j = 0; j < res_arr.length; j++) {
                            if(idArr[i]==res_arr[j].id){
                                break;
                            }else if(idArr[i]!=res_arr[j].id&&j==res_arr.length-1){
                                idArr.splice(i,1);
                                i--;
                            }
                        }
                    }
                    cb({
                        code: 200,
                        msg: '',
                        data: {
                            data: res_arr,
                            id_arr: idArr,
                            total: total,
                            sumTotalAmount: sumTotalAmount,
                            sumPayable: sumPayable,
                            sumPaid: sumPaid
                        }
                    });
                });
            }).catch(e => LOG(e));
        }
    }
}

/**
 *  获知指定的条目
 *  restful
 */
this.getTargetItem = (params,cb) => {
    let { targetKey, isdel } = params;
    isdel = isdel ? 1 : 0;
    ContractsHead.findOne({
        where: {
            isdel: isdel,
            '$or': {
                contract_no: targetKey,
                id: targetKey
            }
        }
    }).then(result => {
        trans([result],result => {
            cb({
                code: 200,
                msg: '',
                data: result[0]
            });
        });
    }).catch(e => LOG(e));
}

this.getTargetItemBody = (params,cb) => {
    let { targetKey } = params;
    ContractsBody.findAll({
        where: {
            contract_no: targetKey,
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => LOG(e));
}

async function getContractGrade(cus_abb) {
    let grade = 1;
    const firstContractEntity = await ContractsHead.findOne({
        where: {
            isdel: 0,
            contract_state: '有效',
            cus_abb,
        },
        order: [['sign_time']],
    });
    if (!firstContractEntity) {
        return grade;
    }
    const { sign_time } = firstContractEntity.dataValues;
    grade = Math.ceil(moment().diff(moment(sign_time), 'years', true));
    return grade;
}

/**
 *  新增合同
 *  强制把初始状态改为审核中2020.05.19
 */
this.add = (params,cb) => {
    params.contracts_head.delivery_state = '审核中';
    let { contracts_head,contracts_body,contracts_offer,admin_id } = params;
    const that = this;
    contracts_head = typeof(contracts_head)=='object'?contracts_head:JSON.parse(contracts_head);
    contracts_body = typeof(contracts_body)=='object'?contracts_body:JSON.parse(contracts_body);
    contracts_offer = typeof(contracts_offer)=='object'?contracts_offer:JSON.parse(contracts_offer);
    const { contract_no, cus_abb } = contracts_head;
    //判断合同号是否已存在
    ContractsHead.findOne({
        where: {
            isdel: 0,
            contract_no: contract_no
        }
    }).then(async result => {
        if(result){
            cb({
                code: -1,
                msg: '该合同号已存在，请先删除原合同',
                data: []
            });
            return;
        }
        // 验证优惠金额是否大于面值
        const check_p = [];
        let isOver = false;
        const couponNoArr = contracts_offer.map(items => {
            if (items.coupon_no) {
                return items.coupon_no;
            }
        });
        const coupCheckRes = await homeServiceWallet.checkCoupAmount({ cus_abb, contractNo: contract_no, couponNoArr });
        if (coupCheckRes.code === -1) {
            isOver = true;
        }
        contracts_offer.forEach((items,index) => {
            check_p[index] = new Promise((resolve,reject) => {
                if(items.service_deposit_no){
                    homeServiceWallet.checkDepoAmount({
                        contract_no: items.service_deposit_no,
                        outputAmount: items.service_deposit_value
                    },result => {
                        if(result.code==-1) isOver = true;
                        resolve();
                    });
                }else{
                    resolve();
                }
            });
        });
        Promise.all(check_p).then(async () => {
            if(isOver){
                cb({
                    code: -1,
                    msg: '优惠金额大于面值金额',
                    data: []
                });
                return;
            }
            contracts_head.insert_person = admin_id;
            contracts_head.update_person = admin_id;
            contracts_head.insert_time = TIME();
            contracts_head.update_time = TIME();
            contracts_head.grade = await getContractGrade(contracts_head.cus_abb);
            //进行插入
            sequelize.transaction(t => {
                return ContractsHead.create(contracts_head, {
                    transaction: t
                }).then(result => {
                    const contracts_head_id = result.dataValues.id;
                    return new Promise((resolve,reject) => {
                        const _p = [];
                        contracts_body.forEach((items,index) => {
                            _p[index] = new Promise((resolve,reject) => {
                                ContractsBody.create(items,{
                                    transaction: t
                                }).then(() => resolve()).catch(e => LOG(e));
                            });
                        });
                        Promise.all(_p).then(() => resolve()).catch(e => LOG(e));
                    }).then(() => {
                        return new Promise((resolve,reject) => {
                            const _p = [];
                            contracts_offer.forEach((items,index) => {
                                items.contracts_head_id = contracts_head_id;
                                _p[index] = new Promise((resolve,reject) => {
                                    ContractsOffer.create(items,{
                                        transaction: t
                                    }).then(() => resolve()).catch(e => LOG(e));
                                });
                            });
                            Promise.all(_p).then(() => resolve()).catch(e => LOG(e));
                        });
                    });
                });
            }).then(() => {
                cb({
                    code: 200,
                    msg: '新增成功',
                    data: []
                });
                // 钱包对应扣款
                // 抵价券，保证金
                const dealer = async () => {
                    await homeServiceWallet.useCoup({ cus_abb, contractNo: contract_no, couponNoArr });
                    contracts_offer.forEach(items => {
                        if (items.service_deposit_no) {
                            homeServiceWallet.useDepo({
                                use_contract_no: items.service_deposit_no, 
                                use_amount: items.service_deposit_value,
                                to_contract_no: contract_no,
                            }, () => {});
                        }
                    });
                }
                dealer();
                //新增定价单
                homePricingList.add({
                    contracts_head: contracts_head,
                    contracts_body: contracts_body,
                    admin_id: admin_id
                },() => {});
                that.addProductsSelectLog({
                    contracts_body: contracts_body
                },() => {});
                that.sendNotiToSaleMan(contracts_head);
                // 通知用户使用了抵价券
                sendMQ.sendQueueMsg('useCoupon', JSON.stringify({
                    contracts_offer,
                    contracts_head,
                }), result => {
                    console.log(result);
                });
            }).catch(e => {
                LOG(e);
                cb({
                    code: -1,
                    msg: '新增失败',
                    data: []
                });
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
    // 清空信用总览缓存
	require('../cache/creditInfo').clearCache();
}

// 强制把初始状态改为审核中2020.05.19
this.addAgain = async (params, cb) => {
    let { contracts_head,contracts_body,contracts_offer,admin_id } = params;
    contracts_head.delivery_state = '审核中';
    const staffMapper = new base.StaffMap().getStaffMap();
    for (const user_id in staffMapper) {
        if (staffMapper[user_id].user_name == contracts_head.sale_person) {
            contracts_head.sale_person = user_id;
        }
    }
    const that = this;
    contracts_head = typeof(contracts_head)=='object'?contracts_head:JSON.parse(contracts_head);
    contracts_body = typeof(contracts_body)=='object'?contracts_body:JSON.parse(contracts_body);
    contracts_offer = typeof(contracts_offer)=='object'?contracts_offer:JSON.parse(contracts_offer);
    // 判断中间商是否需要转换
    const customerEntity = await Customers.findOne({ where: { company: contracts_head.cus_abb, isdel: 0 }});
    if (customerEntity) contracts_head.cus_abb = customerEntity.dataValues.abb;
    const { contract_no, cus_abb } = contracts_head;
    // 验证优惠金额是否大于面值
    const check_p = [];
    let isOver = false;
    const couponNoArr = contracts_offer.map(items => {
        if (items.coupon_no) {
            return items.coupon_no;
        }
    });
    const coupCheckRes = await homeServiceWallet.checkCoupAmount({ cus_abb, contractNo: contract_no, couponNoArr });
    if (coupCheckRes.code === -1) {
        isOver = true;
    }
    contracts_offer.forEach((items,index) => {
        check_p[index] = new Promise((resolve,reject) => {
            if(items.service_deposit_no){
                homeServiceWallet.checkDepoAmount({
                    contract_no: items.service_deposit_no,
                    outputAmount: items.service_deposit_value
                },result => {
                    if(result.code==-1) isOver = true;
                    resolve();
                });
            }else{
                resolve();
            }
        });
    });
    Promise.all(check_p).then(async () => {
        if(isOver){
            cb({
                code: -1,
                msg: '优惠金额大于面值金额',
                data: []
            });
            return;
        }
        contracts_head.update_person = admin_id;
        contracts_head.update_time = TIME();
        contracts_head.madeInApp = 0;
        //进行插入
        sequelize.transaction(t => {
            return ContractsHead.update(contracts_head, {
                where: {
                    contract_no,
                    isdel: 0,
                },
                transaction: t
            }).then(async result => {
                const contractHeadEntity = await ContractsHead.findOne({ where: { contract_no, isdel: 0 }});
                const contracts_head_id = contractHeadEntity.dataValues.id;
                return new Promise((resolve,reject) => {
                    const _p = [];
                    contracts_body.forEach((items,index) => {
                        _p[index] = new Promise((resolve,reject) => {
                            ContractsBody.create(items,{
                                transaction: t
                            }).then(() => resolve()).catch(e => LOG(e));
                        });
                    });
                    Promise.all(_p).then(() => resolve()).catch(e => LOG(e));
                }).then(() => {
                    return new Promise((resolve,reject) => {
                        const _p = [];
                        contracts_offer.forEach((items,index) => {
                            items.contracts_head_id = contracts_head_id;
                            _p[index] = new Promise((resolve,reject) => {
                                ContractsOffer.create(items,{
                                    transaction: t
                                }).then(() => resolve()).catch(e => LOG(e));
                            });
                        });
                        Promise.all(_p).then(() => resolve()).catch(e => LOG(e));
                    });
                });
            });
        }).then(() => {
            cb({
                code: 200,
                msg: '新增成功',
                data: []
            });
            // 钱包对应扣款
            // 抵价券，保证金
            const dealer = async () => {
                await homeServiceWallet.useCoup({ cus_abb, contractNo: contract_no, couponNoArr });
                contracts_offer.forEach(items => {
                    if (items.service_deposit_no) {
                        homeServiceWallet.useDepo({
                            use_contract_no: items.service_deposit_no, 
                            use_amount: items.service_deposit_value,
                            to_contract_no: contract_no,
                        }, () => {});
                    }
                });
            }
            dealer();
            //新增定价单
            homePricingList.add({
                contracts_head: contracts_head,
                contracts_body: contracts_body,
                admin_id: admin_id
            },() => {});
            that.addProductsSelectLog({
                contracts_body: contracts_body
            },() => {});
            that.sendNotiToSaleMan(contracts_head);
            // 通知用户使用了抵价券
            sendMQ.sendQueueMsg('useCoupon', JSON.stringify({
                contracts_offer,
                contracts_head,
            }), result => {
                console.log(result);
            });
        }).catch(e => {
            LOG(e);
            cb({
                code: -1,
                msg: '新增失败',
                data: []
            });
        });
    }).catch(e => LOG(e));
    // 清空信用总览缓存
	require('../cache/creditInfo').clearCache();
}

this.addFromApp = async params => {
    let { admin_id, contract_no, cus_abb } = params;
    const contractEntity = await ContractsHead.findOne({ where: { contract_no, isdel: 0 }});
    if (contractEntity) {
        return { code: -1, msg: '该合同号已存在' };
    }
    cus_abb = cus_abb ? cus_abb :'LJZJS';
    const grade = await getContractGrade(cus_abb);
    await ContractsHead.create({
        contract_no,
        grade,
        cus_abb,
        sign_time: DATETIME(),
        total_amount: 0,
        payable: 0,
        paid: 0,
        sale_person: admin_id,
        insert_person: admin_id,
        insert_time: TIME(),
        madeInApp: 1,
    });
    // 通知财务和内勤
    const user_id = await new Promise(resolve => {
        homeAttendance.getOrderDutyStaff({
            date: DATETIME(),
        }, result => {
            let user_id;
            result.data.forEach(items => {
                if (items.isdel == 0 && items.type == 3) {
                    user_id = items.user_id;
                }
            });
            resolve(user_id);
        });
    });
    const staffArr = await Staff.findAll({ where: { branch: '管理部', isdel: 0, on_job: 1 }});
    let subscriberArr = staffArr.map(items => {
        return items.dataValues.user_id;
    });
    if (user_id) subscriberArr.push(user_id);
    subscriberArr = [ ...new Set(subscriberArr) ];
    let mailId = Date.now();
    request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
        console.log(body);
    }).form({
        data: JSON.stringify({
            mailId: mailId,
            class: 'contract',
            priority: '普通',
            frontUrl: '/contracts',
            sender: admin_id,
            post_time: TIME(),
            title: '合同管理',
            content: '合同已在App端录入，请及时处理！（合同号：'+contract_no+'）',
            votes: '已阅',
            subscriber: subscriberArr.join(),
            NotiClientSubs: subscriberArr.map(items => {
                return {
                    receiver: items,
                    noti_post_mailId: mailId,
                };
            }),
        })
    });
    return {
        code: 200,
        msg: '新增成功',
    };
}

/**
 * 更新合同重写
 */
this.update = async (params, cb) => {
    const form_data = JSON.parse(params.params.form_data);
    const admin_id = params.admin_id;
    const that = this;

    // 先检查版本号
    const old_v = form_data._v;
    let sql_v;
    const _contractsHeadEntity = await ContractsHead.findOne({ where: { isdel: 0, contract_no: form_data.contract_no } });
    sql_v = _contractsHeadEntity.dataValues._v;
    if (old_v != sql_v) {
        cb({ code: -1, msg: '数据已被他处更新，请重新获取数据' });
        return;
    }
    
    delete form_data.cus_abb;
    delete form_data.sale_person;
    delete form_data.insert_person;
    delete form_data.update_person;

    const result = await new Promise(resolve => {
        that.getTargetItem({
            targetKey: form_data.contract_no,
        }, result => resolve(result));
    });
    const originState = result.data.contract_state;
    if (originState !== '有效' && form_data.contract_state === '有效') {
        // 前端已经不允许当前状态的发生了
        // 定价单生效
        that.effectPricing(form_data.contract_no);
    } else if (originState === '有效' && form_data.contract_state !== '有效') {
        // 定价单失效
        that.cancelPricing(form_data.contract_no);
        // 生成的保证金作废
        // 被该合同使用的保证金和抵价券重新生效
        const offerObj = await findContractOffer(form_data.contract_no);
        const { couponNoArr, depoArr } = offerObj;
        await homeServiceWallet.delDepo({ couponNoArr, depoArr, contractNo: form_data.contract_no });
        // 触发退货
        await this.returnGoods({ id: form_data.id, admin_id });
    }

    form_data.update_person = admin_id;
    form_data.update_time = TIME();
    if (parseInt(form_data.paid) > parseInt(form_data.payable)) {
        form_data.paid = form_data.payable;
    }
    // 处理snLackNum, otherSnLackNum
    const { snNum, otherSnNum } = form_data;
    const { snGroup, otherSnGroup } = result.data;
    let snGroupArr, otherSnGroupArr;
    try {
        snGroupArr = snGroup.split(',').filter(items => items);
    } catch (e) {
        snGroupArr = [];
    }
    try {
        otherSnGroupArr = otherSnGroup.split(',').filter(items => items);
    } catch (e) {
        otherSnGroupArr = [];
    }
    form_data.snLackNum = snNum - snGroupArr.length;
    form_data.otherSnLackNum = otherSnNum - otherSnGroupArr.length;
    await ContractsHead.update(form_data, { where: { id: form_data.id } });
    
    await new Promise(resolve => {
        that.checkContractComplete({ form_data }, () => resolve());
    });

    await new Promise(resolve => {
        that.checkFreeze({ form_data }, () => resolve());
    });

    cb({
        code: 200,
        msg: '更新成功',
        data: [],
    });
}

async function findContractOffer(contract_no) {
    const contractsHeadEntity = await ContractsHead.findOne({ where: { contract_no, isdel: 0 } });
    const { id } = contractsHeadEntity.dataValues;
    const offerList = await ContractsOffer.findAll({ where: { contracts_head_id: id, isdel: 0 } });
    const couponNoArr = [];
    const depoArr = [];
    offerList.forEach(items => {
        if (items.coupon_no) {
            couponNoArr.push(items.coupon_no);
        } else if (items.service_deposit_no) {
            depoArr.push({
                use_contract_no: items.service_deposit_no,
                use_amount: items.service_deposit_value,
                to_contract_no: contract_no,
            });
        }
    });
    return {
        couponNoArr,
        depoArr,
    };
}

/**
 * 允许发货
 */
exports.turnToAllowDelivery = async params => {
    return await serviceContracts.turnToAllowDelivery(params);
}

exports.queryExpress = async params => {
    const { no } = params;
    const result = await new Promise(resolve => {
        service.queryExpress({ no }, result => {
            resolve(result);
        });
    });
    return { code: 200, msg: '查询成功', data: result };
}

/**
 * 将非威程序列号移到其它序列号中
 */
this.removeVirSnToOther = async params => {
    const { contract_no } = params;
    const contractEntity = await ContractsHead.findOne({ where: { contract_no, isdel: 0 }});
    const { snGroup, otherSnGroup } = contractEntity.dataValues;
    let snGroupArr = [], otherSnGroupArr = [];
    try {
        snGroupArr = snGroup.split(',');
    } catch (e) {
        snGroupArr = [];
    }
    try {
        otherSnGroupArr = otherSnGroup.split(',');
    } catch (e) {
        otherSnGroupArr = [];
    }
    const _p = [];
    snGroupArr.forEach((items, index) => {
        _p[index] = new Promise(async resolve => {
            const sn = items;
            const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
            if (!productEntity) {
                otherSnGroupArr.push(sn);
            }
            resolve();
        });
    });
    await Promise.all(_p);
    otherSnGroupArr = [ ...new Set(otherSnGroupArr) ];
    otherSnGroupArr = otherSnGroupArr.filter(items => items);
    return {
        code: 200,
        msg: '检查完成',
        data: otherSnGroupArr,
    };
}

// 当合同关闭或删除时，把定价单失效掉
this.cancelPricing = async contract_no => {
    await PricingList.update({
        isPower: 0,
    }, {
        where: { contract_no },
    });
}

// 当合同变为有效时，把定价单重新有效
this.effectPricing = async contract_no => {
    await PricingList.update({
        isPower: 1,
    }, {
        where: { contract_no },
    });
}

/**
 * 判断合同是否完成
 */
this.checkContractComplete = (params,cb) => {
    let { form_data } = params;

    //判断合同是否付清
    //@return BOOLEAN
    const checkPay = () => {
        let { payable,paid } = form_data;
        if(parseInt(payable)==parseInt(paid)){
            return 1;
        }else{
            return 0;
        }
    }

    //判断状态是否完成
    //@return BOOLEAN
    const checkState = () => {
        let { delivery_state,install } = form_data;
        if(install){
            if(delivery_state=='已验收') {
                return 1;
            }else{
                return 0;
            }
        }else{
            if(delivery_state=='已收货') {
                return 1;
            }else{
                return 0;
            }
        }
    }

    let complete = 0;
    if(checkPay()&&checkState()){
        complete = 1;
    }

    ContractsHead.update({
        complete: complete
    },{
        where: {
            id: form_data.id
        }
    }).then(result => {
        cb();
    }).catch(e => LOG(e));
}

/**
 * 判断是否解冻
 */
this.checkFreeze = (params,cb) => {
    let { form_data } = params;
    let { isFreeze,payable,paid,id } = form_data;
    if(isFreeze){
        if(parseInt(payable) == parseInt(paid)){
            isFreeze = 0;
            ContractsHead.update({
                isFreeze: isFreeze
            },{
                where: {
                    id: id
                }
            }).then(result => {
                cb();
            }).catch(e => LOG(e));
        }else{
            cb();
        }
    }else{
        cb();
    }
}

/**
 * 删除合同
 */
this.deleteContract = (params,cb) => {
    const { id } = JSON.parse(params.form_data);
    const { admin_id } = params;
    const that = this;
    ContractsHead.findOne({
        where: {
            id: id
        }
    }).then(async result => {
        let contract_no = result.dataValues.contract_no;
        if (Number.parseInt(result.dataValues.paid) !== 0) {
            cb({
                code: -1,
                msg: '该合同已有到账，不允许删除',
                data: [],
            });
            return;
        }
        await this.returnGoods({ id, admin_id });
        // 被该合同使用的保证金，抵价券重新生效
        const offerObj = await findContractOffer(contract_no);
        const { couponNoArr, depoArr } = offerObj;
        await homeServiceWallet.delDepo({ couponNoArr, depoArr, contractNo: contract_no });
        /*开启事务，自动提交和回滚*/
        sequelize.transaction(t => {
            return ContractsHead.update({
                isdel: 1
            },{
                where: {
                    contract_no: contract_no
                },
                transaction: t
            }).then(() => {
                return ContractsBody.destroy({
                    force: true,
                    where: {
                        contract_no: contract_no
                    },
                    transaction: t
                }).then(() => {
                    return PricingList.update({
                        isdel: 1
                    },{
                        where: {
                            contract_no: contract_no
                        },
                        transaction: t
                    });
                });
            });
        }).then(async () => {
            cb({
                code: 200,
                msg: '删除成功',
                data: []
            });
            that.cancelPricing(contract_no);
        }).catch(e => {
            LOG(e);
            cb({
                code: -1,
                msg: '操作失败',
                data: []
            });
        });
    }).catch(e => LOG(e));
}

/**
 * 更新物品类型
 */
exports.updateGoodsType = async params => {
    const { bodyArr, contract_no } = params;
    const pricingResult = await PricingList.findOne({ where: { contract_no, isdel: 0 } });
    if (pricingResult.dataValues.isPower) {
        return {
            code: -1,
            msg: '该定价单已生效，不允许更改',
            data: [],
        };
    }
    const pricingId = pricingResult.dataValues.id;
    const _p = [];
    bodyArr.forEach((items, index) => {
        const { id, goods_type, goods_name } = items;
        _p[index] = new Promise(async resolve => {
            await ContractsBody.update({
                goods_type,
            }, {
                where: { id }
            });
            await PricingListGoods.update({
                goods_type,
            }, {
                where: {
                    goods_name,
                    pricing_list_id: pricingId,
                },
            });
            resolve();
        });
    });
    await Promise.all(_p);
    return {
        code: 200,
        msg: '更新成功',
        data: [],
    };
}

/**
 *  远程保证金搜索
 */
this.remoteSearchForDeposit = (params,cb) => {
    const { keywords,cus_abb } = params;
    Customers.findOne({
        where: {
            $or: {
                abb: cus_abb,
                company: cus_abb,
            },
        }
    }).then(result => {
        const { user_id } = result.dataValues;
        Wallet.findOne({
            where: {
                user_id
            }
        }).then(async result => {
            const { id } = result.dataValues;
            const r = await BankDepo.findAll({ where: {
                isdel: 0,
                isPower: 1,
                contract_no: {
                    '$like': '%'+keywords+'%'
                },
                amount: {
                    '$ne': 0
                },
                own_id: id,
            }});
            const resArr = [];
            r.forEach((items,index) => {
                resArr.push({
                    text: items.dataValues.contract_no,
                    value: items.dataValues.contract_no,
                    data: {
                        contract_no: items.dataValues.contract_no,
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
    }).catch(e => LOG(e));
}

/**
 *  获取所有已选择过的货品以及型号单价
 */
this.getAllProductsSelected = (params,cb) => {
    ProductsSelectLog.findAll({
        include: [ProductsSpecLog],
        order: [['product_coe','DESC'],['id','DESC'],[{model: ProductsSpecLog},'product_spec_coe','DESC'],[{model: ProductsSpecLog},'id','DESC']]
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => LOG(e));
}

/**
 *  新增货品记录
 */
this.addProductsSelectLog = (params,cb) => {
    let { contracts_body } = params;
    const goodsMaxLevel = CONFIG.goodsMaxLevel;
    const goodsSelectedScore = CONFIG.goodsSelectedScore;
    const len = contracts_body.length;
    let dealerIndex = 0;
    // main
    const dealer = () => {
        calculCoe(() => {
            dealerIndex++;
            if(dealerIndex >= len){
                //结束
                cb({
                    code: 200,
                    msg: '操作成功',
                    data: []
                });
            }else{
                dealer();
            }
        });
    }
    // 判断操作类型
    const calculCoe = (cb) => {
        const { goods_name, goods_spec, goods_price } = contracts_body[dealerIndex];
        // 判断该物品是否存在
        const dealerGoods = (cb) => {
            ProductsSelectLog.findOne({
                where: {
                    product_name: goods_name
                }
            }).then(result => {
                if(result){
                    let product_coe = Number(result.dataValues.product_coe);
                    product_coe += Number(goodsSelectedScore);
                    product_coe = product_coe > goodsMaxLevel ? goodsMaxLevel : product_coe;
                    ProductsSelectLog.update({
                        product_coe: product_coe
                    },{
                        where: {
                            id: result.dataValues.id
                        }
                    }).then(() => {
                        cb({
                            id: result.dataValues.id
                        });
                    }).catch(e => LOG(e));
                }else{
                    ProductsSelectLog.create({
                        product_name: goods_name,
                        product_coe: goodsSelectedScore
                    }).then(result => {
                        cb({
                            id: result.dataValues.id
                        });
                    }).catch(e => LOG(e));
                }
            }).catch(e => LOG(e));
        }
        // 判断该型号价格是否存在
        const dealerSpec = (ProductsSelectLogId,cb) => {
            ProductsSpecLog.findOne({
                where: {
                    product_spec: goods_spec,
                    product_spec_price: goods_price,
                    ProductsSelectLogId: ProductsSelectLogId
                }
            }).then(result => {
                if(result){
                    // 加分
                    let product_spec_coe = Number(result.dataValues.product_spec_coe);
                    product_spec_coe += Number(goodsSelectedScore);
                    product_spec_coe = product_spec_coe > goodsMaxLevel ? goodsMaxLevel : product_spec_coe;
                    ProductsSpecLog.update({
                        product_spec_coe: product_spec_coe
                    },{
                        where: {
                            id: result.dataValues.id
                        }
                    }).then(() => {
                        cb();
                    }).catch(e => LOG(e));
                }else{
                    // 新增
                    ProductsSpecLog.create({
                        product_spec: goods_spec,
                        product_spec_coe: goodsSelectedScore,
                        product_spec_price: goods_price,
                        ProductsSelectLogId: ProductsSelectLogId
                    }).then(() => {
                        cb();
                    }).catch(e => LOG(e));
                }
            }).catch(e => LOG(e));
        }
        dealerGoods(params => {
            const ProductsSelectLogId = params.id;
            dealerSpec(ProductsSelectLogId,() => {
                cb();
            });
        });
    }
    dealer();
}

/**
 *  比重系数衰减
 */
this.reduceCoe = (params,cb) => {
    const goodsReduceCoe = CONFIG.goodsReduceCoe;
    const _p = [];
    _p[0] = new Promise((resolve,reject) => {
        ProductsSelectLog.findAll().then(result => {
            const in_p = [];
            result.forEach((items,index) => {
                in_p[index] = new Promise((resolve,reject) => {
                    let product_coe = items.dataValues.product_coe;
                    product_coe = product_coe * goodsReduceCoe;
                    ProductsSelectLog.update({
                        product_coe: product_coe
                    },{
                        where: {
                            id: items.id
                        }
                    }).then(result => {
                        resolve();
                    }).catch(e => LOG(e));
                });
            });
            Promise.all(in_p).then(() => resolve()).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });
    _p[1] = new Promise((resolve,reject) => {
        ProductsSpecLog.findAll().then(result => {
            const in_p = [];
            result.forEach((items,index) => {
                in_p[index] = new Promise((resolve,reject) => {
                    let product_coe = items.dataValues.product_spec_coe;
                    product_coe = product_coe * goodsReduceCoe;
                    ProductsSpecLog.update({
                        product_spec_coe: product_coe
                    },{
                        where: {
                            id: items.id
                        }
                    }).then(result => {
                        resolve();
                    }).catch(e => LOG(e));
                });
            });
            Promise.all(in_p).then(() => resolve()).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(() => cb({
        code: 200,
        msg: '更新成功',
        data: []
    })).catch(e => LOG(e));
}

/**
 *  修改合同物品的后三项
 */
this.changeGoods = (params,cb) => {
    let { contracts_body, contract_no } = params;
    contracts_body = typeof(contracts_body)=='object'?contracts_body:JSON.parse(contracts_body);
    const _p = [];
    ContractsBody.findAll({
        where: {
            contract_no,
            goods_type: {
                '$in': ['附加配件','现场服务','技术服务','升级服务']
            }
        }
    }).then(result => {
        const originBodys = result.map(items => items.dataValues);
        let addArr = [],delArr = [];
        const getAddDelArr = () => {
            if(originBodys.length==0){
                addArr = contracts_body;
            }else if(contracts_body.length==0){
                delArr = originBodys;
            }else{
                const newArr = contracts_body.map(items => items.goods_name+'<<>>'+items.goods_type);
                const oldArr = originBodys.map(items => items.goods_name+'<<>>'+items.goods_type);
                Linq.from(newArr).except(oldArr).forEach(i => {
                    contracts_body.forEach((items,index) => {
                        if(items.goods_name==i.split('<<>>')[0]&&items.goods_type==i.split('<<>>')[1]){
                            addArr.push(items);
                        }
                    });
                });
                Linq.from(oldArr).except(newArr).forEach(i => {
                    originBodys.forEach((items,index) => {
                        if(items.goods_name==i.split('<<>>')[0]&&items.goods_type==i.split('<<>>')[1]){
                            delArr.push(items);
                        }
                    });
                });
            }
        }
        getAddDelArr();
        console.log(addArr);
        console.log(delArr);
        const dealerAdd = (cb) => {
            const _p = [];
            addArr.forEach((items,index) => {
                _p[index] = new Promise((resolve,reject) => {
                    ContractsBody.create(items).then(() => resolve()).catch(e => LOG(e));
                });
            });
            Promise.all(_p).then(() => {
                homePricingList.triggerAddByBodyChange({
                    addArr
                },() => {
                    cb();
                });
            }).catch(e => LOG(e));
        }
        const dealerDel = (cb) => {
            const _p = [];
            delArr.forEach((items,index) => {
                _p[index] = new Promise((resolve,reject) => {
                    ContractsBody.destroy({
                        force: true,
                        where: {
                            id: items.id
                        }
                    }).then(() => resolve()).catch(e => LOG(e));
                });
            });
            Promise.all(_p).then(() => {
                homePricingList.triggerDelByBodyChange({
                    delArr
                },() => {
                    cb();
                });
            }).catch(e => LOG(e));
        }
        dealerAdd(() => {
            dealerDel(() => {
                cb({
                    code: 200,
                    msg: '操作成功',
                    data: []
                });
            });
        });
    }).catch(e => LOG(e));
}

this.getSum = (params,cb) => {
    const { company, sale_person, orderSignYear, orderDeliveryYear } = params;
    const where = {
        isdel: 0,
        contract_state: '有效',
        sign_time: sequelize.literal('date_format(ContractsHead.sign_time,"%Y")="'+orderSignYear+'"'),
        delivery_time: sequelize.literal('date_format(ContractsHead.delivery_time,"%Y")="'+orderDeliveryYear+'"')
    };
    new Promise((resolve,reject) => {
        if(company){
            Customers.findOne({
                where: {
                    isdel: 0,
                    company
                }
            }).then(result => {
                if(result) where.cus_abb = result.dataValues.abb;
                doSalePerson();
            }).catch(e => LOG(e));
        }else{
            doSalePerson();
        }
        function doSalePerson() {
            if(sale_person){
                if(sale_person=='业务部'){
                    resolve();
                }else if(sale_person=='济南组'||sale_person=='杭州组'){
                    Staff.findAll({
                        where: {
                            isdel: 0,
                            on_job: 1,
                            group: sale_person
                        }
                    }).then(result => {
                        where.sale_person = {
                            '$in': result.map(items => items.dataValues.user_id)
                        };
                        resolve();
                    }).catch(e => LOG(e));
                }else{
                    Staff.findOne({
                        where: {
                            isdel: 0,
                            on_job: 1,
                            user_name: sale_person
                        }
                    }).then(result => {
                        where.sale_person = result.dataValues.user_id;
                        resolve();
                    }).catch(e => LOG(e));
                }
            }else{
                resolve();
            }
        }
    }).then(() => {
        ContractsHead.findAll({
            where: where
        }).then(contractsArr => {
            let sum = 0;
            contractsArr.forEach((items,index) => {
                sum += Number(items.payable);
            });
            cb({
                code: 200,
                msg: '',
                data: sum
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

this.newCustomerDeferred = (params,cb) => {
    const { year, sale_person, orderSignYear, orderDeliveryYear } = params;
    const where = {
        isdel: 0,
        contract_state: '有效',
        sign_time: sequelize.literal('date_format(ContractsHead.sign_time,"%Y")="'+orderSignYear+'"'),
        delivery_time: sequelize.literal('date_format(ContractsHead.delivery_time,"%Y")="'+orderDeliveryYear+'"')
    };
    customers.newIncomingCustomers({
        page: 1,
        num: 1000,
        keywords: '',
        year
    },result => {
        let contractArr = [];
        result.data.data.forEach((items,index) => {
            contractArr = [...contractArr,...items.contractArr];
        });
        contractArr = [...new Set(contractArr)];
        where.contract_no = {
            '$in': contractArr
        };
        doSalePerson(() => {
            ContractsHead.findAll({
                where
            }).then(contractsArr => {
                let sum = 0;
                contractsArr.forEach((items,index) => {
                    sum += Number(items.payable);
                });
                cb({
                    code: 200,
                    msg: '',
                    data: sum
                });
            }).catch(e => LOG(e));
        });
    });

    function doSalePerson(cb) {
        if(sale_person){
            if(sale_person=='业务部'){
                cb();
            }else if(sale_person=='济南组'||sale_person=='杭州组'){
                Staff.findAll({
                    where: {
                        isdel: 0,
                        on_job: 1,
                        group: sale_person
                    }
                }).then(result => {
                    where.sale_person = {
                        '$in': result.map(items => items.dataValues.user_id)
                    };
                    cb();
                }).catch(e => LOG(e));
            }else{
                Staff.findOne({
                    where: {
                        isdel: 0,
                        on_job: 1,
                        user_name: sale_person
                    }
                }).then(result => {
                    where.sale_person = result.dataValues.user_id;
                    cb();
                }).catch(e => LOG(e));
            }
        }else{
            cb();
        }
    }
}

this.sendNotiToSaleMan = async params => {
    const { sale_person, contract_no, update_person } = params;
    // 获取当天内勤人员
    const user_id = await new Promise(resolve => {
        homeAttendance.getOrderDutyStaff({
            date: DATETIME(),
        }, result => {
            let user_id;
            result.data.forEach(items => {
                if (items.isdel == 0 && items.type == 3) {
                    user_id = items.user_id;
                }
            });
            resolve(user_id);
        });
    });
    let subscriberArr = [ sale_person ];
    if (user_id) {
        subscriberArr.push(user_id);
        subscriberArr = [ ...new Set(subscriberArr) ];
    }
    let mailId = Date.now();
    request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
        console.log(body);
    }).form({
        data: JSON.stringify({
            mailId: mailId,
            class: 'pricing',
            priority: '普通',
            frontUrl: '/pricingList',
            sender: update_person,
            post_time: TIME(),
            title: '定价单管理',
            content: '合同已录入，请及时填写定价单！（合同号：'+contract_no+'）',
            votes: '已阅',
            subscriber: subscriberArr.join(),
            NotiClientSubs: subscriberArr.map(items => {
                return {
                    receiver: items,
                    noti_post_mailId: mailId,
                };
            }),
        })
    });
}

/************************************************************* */

/**
 * 检查该序列号是否已被占用
 */
this.checkSnHasEntry = (params, cb) => {
    const { sn } = params;
    Products.findOne({
        where: {
            serialNo: sn,
            isdel: 0,
        }
    }).then(result => {
        const { dealer } = result.dataValues;
        if (dealer) throw new Error('已占用');
        cb({
            code: 200,
            msg: '未被分配',
            data: [],
        });
    }).catch(e => cb({
        code: -1,
        msg: '',
        data: [],
    }));
}

/**
 * 检查该序列号是否存在别的有效合同中
 */
this.checkSnHasExistOtherContrats = (params, cb) => {
    const { sn, id } = params;
    ContractsHead.findOne({
        where: {
            isdel: 0,
            contract_state: '有效',
            $or: {
                snGroup: {
                    '$like': '%'+sn+'%',
                },
                otherSnGroup: {
                    '$like': '%'+sn+'%',
                },
            },
            id: {
                '$ne': id,
            },
        },
    }).then(result => {
        if (result) {
            cb({
                code: -1,
                msg: '',
                data: {
                    contract_no: result.dataValues.contract_no
                },
            });
        } else {
            cb({
                code: 200,
                msg: '',
                data: [],
            });
        }
    }).catch(e => console.log(e));
}

/**
 * 获取近一年销售额在各省的分布
 */
exports.getAmountInProvince = async params => {
    const { type, startTime, endTime } = params;
    const today = endTime;
    let lastday = startTime;
    // if (type == '近一年') {
    //     lastday = DATETIME(Date.parse(today) - 60 * 60 * 1000 * 24 * 365);
    // } else if (type == '近半年') {
    //     lastday = DATETIME(Date.parse(today) - 60 * 60 * 1000 * 24 * 30 * 6);
    // } else if (type == '近三月') {
    //     lastday = DATETIME(Date.parse(today) - 60 * 60 * 1000 * 24 * 30 * 3);
    // } else if (type == '近一月') {
    //     lastday = DATETIME(Date.parse(today) - 60 * 60 * 1000 * 24 * 30 * 1);
    // } else if (type == '今年') {
    //     lastday = new Date(DATETIME()).getFullYear() + '-01-01';
    // }
    const contractAbbMap = {};
    const customerAbbMap = {};
    const provinceMap = {};
    const contractEntity = await ContractsHead.findAll({
        where: {
            isdel: 0,
            contract_state: '有效',
            sign_time: {
                $between: [ lastday, today ],
            },
        },
    });
    contractEntity.forEach(items => {
        const abb = items.dataValues.cus_abb;
        if (!contractAbbMap[abb]) contractAbbMap[abb] = 0;
        contractAbbMap[abb] += Number(items.dataValues.payable);
    });
    // 获取所有客户
    const customerEntity = await Customers.findAll({
        where: { isdel: 0 },
    });
    customerEntity.forEach(items => {
        const { abb, company, province } = items.dataValues;
        if (!customerAbbMap[abb]) customerAbbMap[abb] = {};
        customerAbbMap[abb] = {
            company,
            province,
        };
    });
    for (const abb in contractAbbMap) {
        if (!customerAbbMap[abb]) continue;
        const province = customerAbbMap[abb].province;
        if (!province) continue;
        if (!provinceMap[province]) provinceMap[province] = { amount: 0 };
        provinceMap[province].amount += contractAbbMap[abb];
    }
    // 联系单
    const contactOrderArr = [];
    const _p = [];
    _p[0] = new Promise(async resolve => {
        const result = await BaseMsg.findAll({ attributes: [ 'contact_unit', 'incoming_time' ], where: { isdel: 0, incoming_time: { $between: [ lastday, today ] } } });
        result.forEach(items => contactOrderArr.push(items.dataValues));
        resolve();
    });
    _p[1] = new Promise(async resolve => {
        const result = await MeetMsg.findAll({ attributes: [ [ 'company', 'contact_unit' ], [ 'contact_time', 'incoming_time' ] ], where: { isdel: 0, isEffect: 1, contact_time: { $between: [ lastday, today ] } } });
        result.forEach(items => contactOrderArr.push(items.dataValues));
        resolve();
    });
    _p[2] = new Promise(async resolve => {
        const result = await OtherMsg.findAll({ attributes: [ [ 'company', 'contact_unit' ], [ 'contact_time', 'incoming_time' ] ], where: { isdel: 0, contact_time: { $between: [ lastday, today ] } } });
        result.forEach(items => contactOrderArr.push(items.dataValues));
        resolve();
    });
    await Promise.all(_p);
    const ordersMap = {};
    contactOrderArr.forEach(items => {
        if (!ordersMap[items.contact_unit]) ordersMap[items.contact_unit] = 0;
        ordersMap[items.contact_unit]++;
    });
    const ordersArr = [];
    for (const company in ordersMap) {
        ordersArr.push(company);
    }
    const o_p = [];
    ordersArr.forEach((items, index) => {
        o_p[index] = new Promise(async resolve => {
            const company = items;
            try {
                const result = await homeBusinessTrip.getOnlineContactRecord({
                    startDate: lastday,
                    endDate: today,
                    company,
                });
                const { onlineNum } = result;
                ordersMap[company] += onlineNum;
            } catch (e) {
                
            }
            resolve();
        });
    });
    await Promise.all(o_p);
    for (const company in ordersMap) {
        for (const abb in customerAbbMap) {
            if (company === customerAbbMap[abb].company) {
                if (!provinceMap[customerAbbMap[abb].province]) provinceMap[customerAbbMap[abb].province] = { orders: 0 };
                if (!provinceMap[customerAbbMap[abb].province].orders) provinceMap[customerAbbMap[abb].province].orders = 0;
                provinceMap[customerAbbMap[abb].province].orders += ordersMap[company];
                break;
            }
        }
    }
    return {
        code: 200,
        msg: '',
        data: provinceMap,
    };
}

/**
 * 退货
 */
this.returnGoods = async params => {
    const { id, admin_id } = params;
    const contractEntity = await ContractsHead.findOne({ where: { id } });
    const { snGroup, cus_abb, sale_person, purchase, contract_no } = contractEntity.dataValues;
    let snGroupArr;
    try {
        snGroupArr = snGroup.split(',').filter(items => items);
    } catch (e) {
        snGroupArr = [];
    }
	const customerEntity = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
    const { company } = customerEntity.dataValues;
    // 产品
    await bluebird.map(snGroupArr, async items => {
        const sn = items;
        await Products.update({ dealer: null, salesman: null, status: '库存', regAppName: null, appVersion: null, appValidTime: null, appRegCode: null, appRegAuth: null }, { where: { serialNo: sn } });
        sendMQ.sendQueueMsg('general_deal', JSON.stringify({
            type: '2003',
            no: sn,
            noType: '控制器',
            transferor: company,
            transferorPerson: purchase,
            transferee: '杭州朗杰测控技术开发有限公司',
            transfereePerson: sale_person,
            credentials: contract_no,
            createType: '管理员',
            createPerson: admin_id,
        }));
	}, { concurrency: 5 });
    await ContractsHead.update({
        contract_state: '关闭',
        close_time: TIME(),
        close_reason: '退货',
        snGroup: null,
        otherSnGroup: null,
        update_person: admin_id,
        update_time: TIME(),
    }, { where: { id } });
    // 装箱单
    await PackingList.update({ isdel: 1 }, { where: { contractId: id } });
    // 装盘单
    await serviceContracts.deleteAssembleDiskByContractId({ contract_id: id, admin_id });
    // 生产单
    await serviceProductOrder.delOrder({ contract_id: id });
    return {
        code: 200,
        msg: '操作成功',
        data: [],
    };
}

exports.subSnRem = async params => {
    const { snGroupRem, otherSnGroupRem, id } = params;
    await ContractsHead.update({
        snGroupRem,
        otherSnGroupRem
    }, { where: { id } });
    return {
        code: 200,
        msg: '更新成功',
        data: [],
    };
}

/**
 * 去年发货的合同在今年关闭
 * 减业绩用
 */
this.filterCloseContracts = async year => {
    const list = await ContractsHead.findAll({
        attributes: ['contract_no', 'sale_person', 'payable', 'cus_abb'],
        where: { 
            contract_state: '关闭',
            isdel: 0,
            close_time: sequelize.literal('date_format(close_time,"%Y")="'+year+'"'),
            delivery_time: sequelize.literal('date_format(delivery_time,"%Y")="'+(Number(year) - 1)+'"'),
        }
    });
    const noArr = list.map(items => {
        return {
            contract_no: items.dataValues.contract_no,
            sale_person: items.dataValues.sale_person,
            payable: items.dataValues.payable,
            cus_abb: items.dataValues.cus_abb,
        };
    });
    return noArr;
}

this.calculClosedPayable = async params => {
    const { year } = params;
    const contractArr = await this.filterCloseContracts(year);
    return {
        code: 200,
        msg: '',
        data: contractArr,
    };
}