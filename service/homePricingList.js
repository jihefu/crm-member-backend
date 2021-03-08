const request = require('request');
const common = require('./common');
const base = require('./base');
const sequelize = require('../dao').sequelize;
const PricingList = require('../dao').PricingList;
const PricingListGoods = require('../dao').PricingListGoods;
const PricingListGoodsAmount = require('../dao').PricingListGoodsAmount;
const ProductsLibrary = require('../dao').ProductsLibrary;
const serviceWallet = require('./homeWallet');
const serviceStaff = require('./homeStaff');
const serviceCustomers = require('./homeCustomers');
const ContractsHead = require('../dao').ContractsHead;
const Customers = require('../dao').Customers;
const Staff = require('../dao').Staff;
const customers = require('./customers');
const homeContracts = require('./homeContracts');
const bluebird = require('bluebird');

/**
 *  新增定价单
 */
this.add = (params,cb) => {
    const { contracts_head, contracts_body, admin_id } = params;
    const contract_no = contracts_body[0].contract_no;
    const sign_time = contracts_head.sign_time;
    const contract_price = Number(contracts_head.total_amount);
    serviceCustomers.getTargetItem({
        targetKey: contracts_head.cus_abb
    },result => {
        let company;
        try{
            company = result.data.dataValues.company;
        }catch(e){
            company = contracts_head.cus_abb
        }
        sequelize.transaction(t => {
            return PricingList.create({
                contract_no: contract_no,
                sign_time: sign_time,
                company: company,
                contract_price: contract_price,
                insert_person: admin_id,
                update_person: admin_id,
                insert_time: TIME(),
                update_time: TIME()
            }, {
                transaction: t
            }).then(result => {
                const _id = result.dataValues.id;
                return new Promise((resolve,reject) => {
                    const _p = [];
                    contracts_body.forEach((items,index) => {
                        _p[index] = new Promise((resolve,reject) => {
                            PricingListGoods.create({
                                goods_type: items.goods_type,
                                goods_name: items.goods_name,
                                goods_num: items.goods_num,
                                pricing_list_id: _id
                            },{
                                transaction: t
                            }).then(() => resolve()).catch(e => LOG(e));
                        });
                    });
                    Promise.all(_p).then(() => resolve()).catch(e => LOG(e));
                });
            });
        }).then(() => {
            cb({
                code: 200,
                msg: '新增成功',
                data: []
            });
        }).catch(e => {
            LOG(e);
            cb({
                code: -1,
                msg: '新增失败',
                data: []
            });
        });
    });
}

/**
 *  定价单列表
 */
this.list = (params,cb) => {
    let num = params.num?parseInt(params.num):30;
	let page = params.page?parseInt(params.page):1;
    let keywords = params.keywords?params.keywords:'';
    let order = params.order?params.order:'id';
    let filter = params.filter?JSON.parse(params.filter):{};
    const stateArr = filter.state.split(',').filter(items => items);
    const isSubArr = filter.isSub.split(',').filter(items => items);
    const sign_time_start = filter.sign_time_start?filter.sign_time_start:'2018-01-01';
    const sign_time_end = filter.sign_time_end?filter.sign_time_end:'2018-11-08';
    let where = {
        isdel: 0,
        '$or': {
            contract_no: {
                '$like': '%'+keywords+'%'
            },
            company: {
                '$like': '%'+keywords+'%'
            },
        },
        sign_time: {
            '$gte': sign_time_start,
            '$lte': sign_time_end
        }
    };
    if(stateArr.length!=0){
        where.state = {
            '$in': stateArr
        };
    }
    if(isSubArr.length!=0){
        isSubArr.forEach((items,index) => {
            if(items=='已提交'){
                isSubArr[index] = 1;
            }else{
                isSubArr[index] = 0;
            }
        });
        where.isSub = {
            '$in': isSubArr
        };
    }
    PricingList.findAndCountAll({
        include: {
            model: PricingListGoods,
            include: [PricingListGoodsAmount]
        },
        where: where,
        order: [[order,'DESC']],
        distinct: true,
        limit: num,
        offset: (page - 1) * num,
    }).then(result => {
        const staffMap = new base.StaffMap().getStaffMap();
        result.rows.forEach((items,index) => {
            items.dataValues.insert_person = staffMap[items.dataValues.insert_person].user_name;
            items.dataValues.update_person = staffMap[items.dataValues.update_person].user_name;
            items.dataValues.PricingListGoods.forEach((it,ind) => {
                const resArr = [];
                it.dataValues.PricingListGoodsAmounts.forEach((_it,_ind) => {
                    if(_it.dataValues.isdel==0) resArr.push(_it);
                });
                it.dataValues.PricingListGoodsAmounts = resArr;
            });
        });
        cb({
            code: 200,
            msg: '',
            data: {
                data: result.rows,
                id_arr: [],
                total: result.count
            }
        });
    }).catch(e => LOG(e));
}

/**
 *  指定id或合同号的定价单
 */
this.getTargetItem = (params,cb) => {
    const { targetKey } = params;
    PricingList.findOne({
        include: {
            model: PricingListGoods,
            include: [PricingListGoodsAmount]
        },
        where: {
            isdel: 0,
            '$or': {
                contract_no: targetKey,
                id: targetKey
            }
        },
    }).then(result => {
        const staffMap = new base.StaffMap().getStaffMap();
        if(result){
            result.dataValues.insert_person = staffMap[result.dataValues.insert_person].user_name;
            result.dataValues.update_person = staffMap[result.dataValues.update_person].user_name;
            result.dataValues.PricingListGoods.forEach((it,ind) => {
                const resArr = [];
                it.dataValues.PricingListGoodsAmounts.forEach((_it,_ind) => {
                    if(_it.dataValues.isdel==0) resArr.push(_it);
                });
                it.dataValues.PricingListGoodsAmounts = resArr;
            });
        }
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => LOG(e));
}

/**
 *  更新定价单
 */
this.update = (params,cb) => {
    const { form_data, admin_id } = params;
    const { id, contract_no, contract_price, cost_price, achievement, deposit, goodsBreakArr, total_work_hours } = form_data;
    // 获取原分解表
    const getOriginGoods = (pricing_list_good_id, cb) => {
        PricingListGoodsAmount.findAll({
            where: {
                pricing_list_good_id: pricing_list_good_id,
                isdel: 0
            }
        }).then(result => {
            cb(result);
        }).catch(e => LOG(e));
    }

    // 删，增，改
    const dealerItem = (originData, newData, cb) => {
        let needAddArr = [], needDelArr = [], needUpdateArr = [];
        newData.forEach((items, index) => {
            if(!items.id) needAddArr.push(items);
        });
        if(originData.length==0) {   // 完全新增
            needAddArr = newData;
        }else if(newData.length==0){    //完全删除
            needDelArr = originData;
        }else{                      //混合
            for (let i = 0; i < originData.length; i++) {
                for (let j = 0; j < newData.length; j++) {
                    if(originData[i].id == newData[j].id) {
                        needUpdateArr.push(newData[j]);
                        break;
                    }else if(originData[i].id != newData[j].id && j == newData.length-1){
                        // needAddArr.push(newData[j]);
                        needDelArr.push(originData[i]);
                    }
                }
            }
        }
        // console.log(needAddArr);
        // console.log(needDelArr);
        // console.log(needUpdateArr);
        const _p = [];
        _p[0] = new Promise((resolve,reject) => {
            const in_p = [];
            needAddArr.forEach((items,index) => {
                in_p[index] = new Promise((resolve,reject) => {
                    PricingListGoodsAmount.create(items).then(() => resolve()).catch(e => LOG(e));
                });
            });
            Promise.all(in_p).then(() => resolve()).catch(e => LOG(e));
        });
        _p[1] = new Promise((resolve,reject) => {
            const in_p = [];
            needDelArr.forEach((items,index) => {
                in_p[index] = new Promise((resolve,reject) => {
                    PricingListGoodsAmount.update({
                        isdel: 1
                    },{
                        where: {
                            id: items.id
                        }
                    }).then(() => resolve()).catch(e => LOG(e));
                });
            });
            Promise.all(in_p).then(() => resolve()).catch(e => LOG(e));
        });
        _p[2] = new Promise((resolve,reject) => {
            const in_p = [];
            needUpdateArr.forEach((items,index) => {
                in_p[index] = new Promise((resolve,reject) => {
                    PricingListGoodsAmount.update(items,{
                        where: {
                            id: items.id
                        }
                    }).then(() => resolve()).catch(e => LOG(e));
                });
            });
            Promise.all(in_p).then(() => resolve()).catch(e => LOG(e));
        });
        Promise.all(_p).then(() => {
            cb();
        }).catch(e => LOG(e));
    }

    // 钱包操作
            const _p = [];
            goodsBreakArr.forEach((items,index) => {
                _p[index] = new Promise((resolve,reject) => {
                    const it = items;
                    getOriginGoods(items._id,result => {
                        // 删，增，改
                        dealerItem(result, it.pricingListGoodsAmounts , () => {
                            resolve();
                        });
                    });
                });
            });
            Promise.all(_p).then(() => {
                PricingList.update({
                    contract_price,
                    cost_price: cost_price,
                    achievement: achievement,
                    total_work_hours,
                    deposit: deposit,
                    state: '待审核',
                    update_person: admin_id,
                    update_time: TIME(),
                    isSub: 1
                },{
                    where: {
                        id: id
                    }
                }).then(() => {
                    cb({
                        code: 200,
                        msg: '更新完成',
                        data: []
                    });
                    // 往下游推送消息队列
                    // 获取审核员（收件人）
                    serviceStaff.getPricingAuth({},result => {
                        const checker = result.data.checker;
                        if(checker.length==0) return;
                        let subscriber = checker.join();
                        let mailId = Date.now();
                        const NotiClientSubs = [];
                        checker.forEach((items,index) => {
                            NotiClientSubs.push({
                                receiver: items,
                                noti_post_mailId: mailId
                            });
                        });
                        const staffMap = new base.StaffMap().getStaffMap();
                        const user_name = staffMap[admin_id].user_name;
                        request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
                            console.log(body);
                        }).form({
                            data: JSON.stringify({
                                mailId: mailId,
                                class: 'pricing',
                                priority: '普通',
                                frontUrl: '/pricingList',
                                sender: admin_id,
                                post_time: TIME(),
                                title: '定价单管理',
                                content: user_name+'提交了定价单，请及时审核！（合同号：'+contract_no+'）',
                                votes: '已阅',
                                subscriber: subscriber,
                                NotiClientSubs: NotiClientSubs
                            })
                        });
                    });
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
}

/**
 * 新增定价单货品条目
 */
exports.addGoods = async params => {
    const { pricingId, goods_type, goods_name, goods_num } = params;
    const result = await PricingListGoods.create({
        goods_type,
        goods_name,
        goods_num,
        pricing_list_id: pricingId,
        extra_add: 1,
    });
    return { code: 200, msg: '新增成功', data: result.dataValues };
}

/**
 * 删除定价单货品条目
 */
exports.delGoods = async id => {
    await PricingListGoods.destroy({
        where: { id },
        force: true,
    });
    return { code: 200, msg: '删除成功' };
}

/**
 *  同意
 */
this.agree = (params,cb) => {
    const { form_data, admin_id } = params;

    // 钱包操作
    serviceWallet.addDepo({
        contract_no: form_data.contract_no,
        amount: form_data.deposit,
        admin_id,
    },result => {
        if(result.code==200){
            let receiver;
            PricingList.findOne({
                where: {
                    id: form_data.id
                }
            }).then(result => {
                receiver = result.dataValues.update_person;
                let state = result.dataValues.state;
                if(state!='待审核'){
                    cb({
                        code: -1,
                        msg: '操作过期',
                        data: []
                    });
                    return;
                }
                PricingList.update({
                    update_person: admin_id,
                    update_time: TIME(),
                    isPower: 1,
                    state: '已通过'
                },{
                    where: {
                        id: form_data.id
                    }
                }).then(() => {
                    cb({
                        code: 200,
                        msg: '更新成功',
                        data: []
                    });
                    let mailId = Date.now();
                    request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
                        console.log(body);
                    }).form({
                        data: JSON.stringify({
                            mailId: mailId,
                            class: 'pricing',
                            priority: '普通',
                            frontUrl: '/pricingList',
                            sender: admin_id,
                            post_time: TIME(),
                            title: '定价单管理',
                            content: '定价单审核通过！（合同号：'+form_data.contract_no+'）',
                            votes: '已阅',
                            subscriber: receiver,
                            NotiClientSubs: [
                                {
                                    receiver: receiver,
                                    noti_post_mailId: mailId
                                }
                            ]
                        })
                    });
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }else{
            cb(result);
        }
    });
}

/**
 *  不同意
 */
this.notAgree = (params,cb) => {
    const { form_data, admin_id } = params;
    let receiver;
    PricingList.findOne({
        where: {
            id: form_data.id
        }
    }).then(result => {
        receiver = result.dataValues.update_person;
        let state = result.dataValues.state;
        if(state!='待审核'){
            cb({
                code: -1,
                msg: '操作过期',
                data: []
            });
            return;
        }
        PricingList.update({
            update_person: admin_id,
            update_time: TIME(),
            isPower: 0,
            state: '未通过'
        },{
            where: {
                id: form_data.id
            }
        }).then(() => {
            cb({
                code: 200,
                msg: '更新成功',
                data: []
            });
            const nowAggreReason = form_data.nowAggreReason;
            let mailId = Date.now();
            request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
                console.log(body);
            }).form({
                data: JSON.stringify({
                    mailId: mailId,
                    class: 'pricing',
                    priority: '普通',
                    frontUrl: '/pricingList',
                    sender: admin_id,
                    post_time: TIME(),
                    title: '定价单管理',
                    content: '定价单审核未通过！（合同号：'+form_data.contract_no+'，理由：'+nowAggreReason+'）',
                    votes: '已阅',
                    subscriber: receiver,
                    NotiClientSubs: [
                        {
                            receiver: receiver,
                            noti_post_mailId: mailId
                        }
                    ]
                })
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  撤销审核
 */
this.rebackCheck = (params,cb) => {
    const { id, admin_id } = params;
    PricingList.findOne({
        where: {
            id: id
        }
    }).then(result => {
        const { state, contract_no } = result.dataValues;
        if(state!='已通过'){
            cb({
                code: -1,
                msg: '操作过期',
                data: []
            });
            return;
        }
        serviceWallet.failDepo({
            contract_no,
        },result => {
            if(result.code==200){
                PricingList.update({
                    update_person: admin_id,
                    update_time: TIME(),
                    isPower: 0,
                    state: '待审核'
                },{
                    where: {
                        id: id
                    }
                }).then(() => {
                    cb({
                        code: 200,
                        msg: '操作成功',
                        data: []
                    });
                }).catch(e => LOG(e));
            }else{
                cb(result);
            }
        });
    }).catch(e => LOG(e));
}

/**
 *  获取所有业绩信息
 */
this.getAchievementInfo = (params,cb) => {
    const { startTime,endTime } = params;
    const _p = new Promise((resolve,reject) => {
        ContractsHead.findAll({
            attributes: ['contract_no','sign_time','delivery_time','sale_person','id', 'grade', 'cus_abb'],
            where: {
                isdel: 0,
                sign_time: {
                    '$between': [startTime,endTime]
                },
                contract_state: "有效"
            }
        }).then(async result => {
            const customerMapper = {};
            const customerList = await Customers.findAll({ where: { isdel: 0 } });
            customerList.forEach(items => {
                customerMapper[items.dataValues.abb] = items.dataValues.credit_qualified;
            });
            let res_arr = [];
            result.map((items) => {
                if(!items.dataValues.delivery_time){
                    items.dataValues.hasDelivery = 0;
                }else{
                    items.dataValues.hasDelivery = 1;
                }
                if (customerMapper[items.dataValues.cus_abb]) {
                    items.dataValues.credit_qualified = 1;
                } else {
                    items.dataValues.credit_qualified = 0;
                }
                res_arr.push(items.dataValues);
            });
            resolve(res_arr);
        }).catch(e => LOG(e));
    });
    _p.then(res_arr => {
        PricingList.findAll({
            attributes: ['contract_no', 'company', 'achievement'],
            where: {
                isdel: 0,
                isPower: 1
            }
        }).then(result => {
            const hashMapper = {}, endArr = [];
            result.forEach((items,index) => {
                hashMapper[items.dataValues.contract_no] = items.dataValues;
            });
            res_arr.forEach((items,index) => {
                const it = hashMapper[items.contract_no];
                if(it){
                    items.company = it.company;
                    items.achievement = it.achievement;
                    delete items.delivery_time;
                    endArr.push(items);
                }
            });
            cb({
                code: 200,
                msg: '',
                data: endArr
            });
        }).catch(e => LOG(e));
    });
}

/**
 *  获取新客户的业绩
 */
this.getNewCusAchievementInfo = (params,cb) => {
    const year = params.year?params.year:1;
    customers.typeNewList({
        page: 1,
        pageSize: 10000,
        keywords: '',
        qualified: 1,
        year: year
    },resArr => {
        resArr = resArr.data.data;
        const endArr = [];
        PricingList.findAll({
            attributes: ['contract_no', 'company', 'achievement'],
            where: {
                isdel: 0,
                isPower: 1
            }
        }).then(result => {
            const hashMapper = {}, endArr = [];
            result.forEach((items,index) => {
                hashMapper[items.dataValues.contract_no] = items.dataValues;
            });
            resArr.forEach((items,index) => {
                const it = hashMapper[items.contract_no];
                if(it){
                    items.company = it.company;
                    items.achievement = it.achievement;
                    delete items.delivery_time;
                    delete items.delivery_state;
                    delete items.payable;
                    delete items.paid;
                    endArr.push(items);
                }
            });
            cb({
                code: 200,
                msg: '',
                data: endArr
            });
        }).catch(e => LOG(e));
    });
}

/**
 * 除新客户外的业绩接口
 */
this.getSum = (params,cb) => {
    const that = this;
    that.getPricingMapper(pricingMapper => {
        params.pricingMapper = pricingMapper;
        that.getAchievementNumByYearAndStaff(params,result => {
            cb(result);
        });
    });
}

/**
 * 新客户递延业绩
 */
this.newCustomerDeferred = (params,cb) => {
    const { year, sale_person, orderSignYear, orderDeliveryYear } = params;
    const that = this;
    that.getPricingMapper(pricingMapper => {
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
            that.getAchievementNumByYearAndStaff({
                orderSignYear,
                orderDeliveryYear,
                sale_person,
                pricingMapper,
                contractArr,
                searchByContractsNo: 1
            },result => {
                cb(result);
            });
        });
    });
}

/**
 * 获取递延发货和递延退货数据（2021-01-05）
 */
this.getDeferredAchievement = async params => {
    const { year, company, sale_person, orderSignYear, orderDeliveryYear } = params;
    let cus_abb;
    if (company) {
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
        cus_abb = customerEntity.dataValues.abb;
    }

    let creditMapper;
    if (year) {
        creditMapper = await getCreditMapper();
    }

    const deliveryList = await getDeliveryData(year, sale_person, cus_abb);
    const closeList = await getCloseData(year, sale_person, cus_abb);

    const pricingMapper = await new Promise(async resolve => {
        const list = await PricingList.findAll({ attributes: ['contract_no', 'company', 'achievement', 'isPower'], where: { isdel: 0 } });
        const mapper = {};
        list.forEach(items => {
            mapper[items.dataValues.contract_no] = items.dataValues;
        });
        resolve(mapper);
    });

    let deliveryNum = 0, closeNum = 0;
    deliveryList.forEach(items => {
        if (pricingMapper[items.contract_no] && pricingMapper[items.contract_no].isPower == 1) {
            deliveryNum += Number(pricingMapper[items.contract_no].achievement);
        }
    });
    closeList.forEach(items => {
        if (pricingMapper[items.contract_no]) {
            closeNum += Number(pricingMapper[items.contract_no].achievement);
        }
    });
    return { code: 200, data: { deliveryNum, closeNum } };

    async function getSaleGroup(sale_person) {
        const staffList = await Staff.findAll({ where: { isdel: 0 } });
        const groupArr = [];
        if (sale_person === '济南组' || sale_person === '杭州组') {
            staffList.forEach(items => {
                if (items.dataValues.group === sale_person) {
                    groupArr.push(items.dataValues.user_id);
                }
            });
        } else {
            staffList.forEach(items => {
                if (items.dataValues.user_name === sale_person) {
                    groupArr.push(items.dataValues.user_id);
                }
            });
        }
        return groupArr;
    }

    async function getCreditMapper() {
        const customerList = await Customers.findAll({ where: { isdel: 0 } });
        const customerMapper = {};
        customerList.forEach(items => customerMapper[items.dataValues.abb] = items.dataValues.credit_qualified);
        return customerMapper;
    }
    
    async function getDeliveryData(year, sale_person, cus_abb) {
        const query = {
            isdel: 0, 
            contract_state: '有效',
            sign_time: sequelize.literal('date_format(sign_time,"%Y")="'+orderSignYear+'"'),
            delivery_time: sequelize.literal('date_format(delivery_time,"%Y")="'+orderDeliveryYear+'"'),
        };
        if (cus_abb) {
            query.cus_abb = cus_abb;
        }
        if (year) {
            query.grade = year;
        }
        if (sale_person !== '业务部') {
            const group = await getSaleGroup(sale_person);
            query.sale_person = { $in: group };
        }
        const contractList = await ContractsHead.findAll({ attributes: ['contract_no', 'cus_abb'], where: query });
        const resArr = [];
        for (let i = 0; i < contractList.length; i++) {
            const { cus_abb } = contractList[i].dataValues;
            if (year) {
                if (creditMapper[cus_abb] == 1) {
                    resArr.push(contractList[i].dataValues);
                }
            } else {
                resArr.push(contractList[i].dataValues);
            }
        }
        return resArr;
    }

    async function getCloseData(year, sale_person, cus_abb) {
        const query = {
            isdel: 0, 
            contract_state: '关闭',
            sign_time: sequelize.literal('date_format(delivery_time,"%Y")="'+orderSignYear+'"'),
            close_time: sequelize.literal('date_format(close_time,"%Y")="'+orderDeliveryYear+'"'),
        };
        if (cus_abb) {
            query.cus_abb = cus_abb;
        }
        if (year) {
            query.grade = year;
        }
        if (sale_person !== '业务部') {
            const group = await getSaleGroup(sale_person);
            query.sale_person = { $in: group };
        }
        const contractList = await ContractsHead.findAll({ attributes: ['contract_no', 'cus_abb'], where: query });
        const resArr = [];
        for (let i = 0; i < contractList.length; i++) {
            const { cus_abb } = contractList[i].dataValues;
            if (year) {
                if (creditMapper[cus_abb] == 1) {
                    resArr.push(contractList[i].dataValues);
                }
            } else {
                resArr.push(contractList[i].dataValues);
            }
        }
        return resArr;
    }
}

this.getDeferredPayable = async params => {
    const { year, company, sale_person, orderSignYear, orderDeliveryYear } = params;
    let cus_abb;
    if (company) {
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
        cus_abb = customerEntity.dataValues.abb;
    }

    let creditMapper;
    if (year) {
        creditMapper = await getCreditMapper();
    }

    const deliveryList = await getDeliveryData(year, sale_person, cus_abb);
    const closeList = await getCloseData(year, sale_person, cus_abb);

    let deliveryNum = 0, closeNum = 0;
    deliveryList.forEach(items => {
        deliveryNum += Number(items.payable);
    });
    closeList.forEach(items => {
        closeNum += Number(items.payable);
    });
    return { code: 200, data: { deliveryNum, closeNum } };

    async function getSaleGroup(sale_person) {
        const staffList = await Staff.findAll({ where: { isdel: 0 } });
        const groupArr = [];
        if (sale_person === '济南组' || sale_person === '杭州组') {
            staffList.forEach(items => {
                if (items.dataValues.group === sale_person) {
                    groupArr.push(items.dataValues.user_id);
                }
            });
        } else {
            staffList.forEach(items => {
                if (items.dataValues.user_name === sale_person) {
                    groupArr.push(items.dataValues.user_id);
                }
            });
        }
        return groupArr;
    }

    async function getCreditMapper() {
        const customerList = await Customers.findAll({ where: { isdel: 0 } });
        const customerMapper = {};
        customerList.forEach(items => customerMapper[items.dataValues.abb] = items.dataValues.credit_qualified);
        return customerMapper;
    }
    
    async function getDeliveryData(year, sale_person, cus_abb) {
        const query = {
            isdel: 0, 
            contract_state: '有效',
            sign_time: sequelize.literal('date_format(sign_time,"%Y")="'+orderSignYear+'"'),
            delivery_time: sequelize.literal('date_format(delivery_time,"%Y")="'+orderDeliveryYear+'"'),
        };
        if (cus_abb) {
            query.cus_abb = cus_abb;
        }
        if (year) {
            query.grade = year;
        }
        if (sale_person !== '业务部') {
            const group = await getSaleGroup(sale_person);
            query.sale_person = { $in: group };
        }
        const contractList = await ContractsHead.findAll({ attributes: ['contract_no', 'cus_abb', 'payable'], where: query });
        const resArr = [];
        for (let i = 0; i < contractList.length; i++) {
            const { cus_abb } = contractList[i].dataValues;
            if (year) {
                if (creditMapper[cus_abb] == 1) {
                    resArr.push(contractList[i].dataValues);
                }
            } else {
                resArr.push(contractList[i].dataValues);
            }
        }
        return resArr;
    }

    async function getCloseData(year, sale_person, cus_abb) {
        const query = {
            isdel: 0, 
            contract_state: '关闭',
            sign_time: sequelize.literal('date_format(delivery_time,"%Y")="'+orderSignYear+'"'),
            close_time: sequelize.literal('date_format(close_time,"%Y")="'+orderDeliveryYear+'"'),
        };
        if (cus_abb) {
            query.cus_abb = cus_abb;
        }
        if (year) {
            query.grade = year;
        }
        if (sale_person !== '业务部') {
            const group = await getSaleGroup(sale_person);
            query.sale_person = { $in: group };
        }
        const contractList = await ContractsHead.findAll({ attributes: ['contract_no', 'cus_abb', 'payable'], where: query });
        const resArr = [];
        for (let i = 0; i < contractList.length; i++) {
            const { cus_abb } = contractList[i].dataValues;
            if (year) {
                if (creditMapper[cus_abb] == 1) {
                    resArr.push(contractList[i].dataValues);
                }
            } else {
                resArr.push(contractList[i].dataValues);
            }
        }
        return resArr;
    }
}

/**
 * 获取定价单mapper（内部接口）
 */
this.getPricingMapper = (cb) => {
    PricingList.findAll({
        attributes: ['contract_no', 'company', 'achievement'],
        where: {
            isdel: 0,
            isPower: 1
        }
    }).then(result => {
        const hashMapper = {};
        let sum = 0;
        result.forEach((items,index) => {
            hashMapper[items.dataValues.contract_no] = items.dataValues;
        });
        cb(hashMapper);
    }).catch(e => LOG(e));
}

/**
 * 自定义业绩数据（内部接口）
 */
this.getAchievementNumByYearAndStaff = (params,cb) => {
    let { orderSignYear, orderDeliveryYear, company, sale_person, pricingMapper, searchByContractsNo, contractArr } = params;
    let where = {
        isdel: 0,
        contract_state: "有效",
        sign_time: sequelize.literal('date_format(ContractsHead.sign_time,"%Y")="'+orderSignYear+'"'),
        delivery_time: sequelize.literal('date_format(ContractsHead.delivery_time,"%Y")="'+orderDeliveryYear+'"'),
    };
    if(searchByContractsNo){
        where.contract_no = {
            '$in': contractArr
        };
    }
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
            where
        }).then(contractsArr => {
            let sum = 0;
            contractsArr.forEach((items,index) => {
                const it = pricingMapper[items.dataValues.contract_no];
                if(it) sum += Number(it.achievement);
            });
            cb({
                code: 200,
                msg: '',
                data: sum
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  合同体新增变动
 */
this.triggerAddByBodyChange = (params,cb) => {
    const { addArr } = params;
    if(addArr.length==0){
        cb();
    }else{
        const contract_no = addArr[0].contract_no;
        PricingList.findOne({
            where: {
                contract_no,
                isdel: 0
            }
        }).then(result => {
            const { id } = result.dataValues;
            const _p = [];
            addArr.forEach((items,index) => {
                _p[index] = new Promise((resolve,reject) => {
                    PricingListGoods.create({
                        goods_type: items.goods_type,
                        goods_num: items.goods_num,
                        goods_name: items.goods_name,
                        pricing_list_id: id
                    }).then(() => resolve()).catch(e => LOG(e));
                });
            });
            Promise.all(_p).then(() => {
                cb();
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }
}

/**
 *  合同体删除变动
 */
this.triggerDelByBodyChange = (params,cb) => {
    const { delArr } = params;
    if(delArr.length==0){
        cb();
    }else{
        const contract_no = delArr[0].contract_no;
        PricingList.findOne({
            where: {
                contract_no,
                isdel: 0
            }
        }).then(result => {
            const { id } = result.dataValues;
            const _p = [];
            delArr.forEach((items,index) => {
                _p[index] = new Promise((resolve,reject) => {
                    PricingListGoods.destroy({
                        force: true,
                        where: {
                            goods_type: items.goods_type,
                            goods_num: items.goods_num,
                            goods_name: items.goods_name,
                            pricing_list_id: id
                        }
                    }).then(() => resolve()).catch(e => LOG(e));
                });
            });
            Promise.all(_p).then(() => {
                // 重新计算成本价，业绩，服务保证金
                PricingList.findOne({
                    where: {
                        contract_no
                    },
                    include: {
                        model: PricingListGoods,
                        include: [PricingListGoodsAmount]
                    }
                }).then(result => {
                    let { contract_price } = result.dataValues;
                    let achievement = 0,deposit = 0,cost_price = 0;
                    result.dataValues.PricingListGoods.forEach((items,index) => {
                        const goods_num = Number(items.dataValues.goods_num);
                        items.dataValues.PricingListGoodsAmounts.forEach((it,ind) => {
                            const amount = Number(it.dataValues.amount);
                            cost_price += goods_num * amount;
                        });
                    });
                    achievement = Number(contract_price) - cost_price;
                    deposit = achievement * 0.04;
                    PricingList.update({
                        cost_price,
                        achievement,
                        deposit
                    },{
                        where: {
                            contract_no
                        }
                    }).then(() => cb()).catch(e => LOG(e));
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }
}

/**
 * 非今年发货的合同在今年关闭
 * 减业绩用
 */
this.calculClosedAchievement = async params => {
    const { year } = params;
    const contractArr = await homeContracts.filterCloseContracts(year);
    const noArr = contractArr.map(items => items.contract_no);
    const list = await PricingList.findAll({ where: { contract_no: { $in: noArr }, isdel: 0 } });
    for (let i = 0; i < contractArr.length; i++) {
        contractArr[i].achievement = 0;
        for (let j = 0; j < list.length; j++) {
            if (contractArr[i].contract_no === list[j].contract_no) {
                contractArr[i].achievement = Number(list[j].achievement);
            }
        }
    }
    return {
        code: 200,
        msg: '',
        data: contractArr,
    };
}

this.filterNewCustomerContractByContract = async params => {
	const { contractNoArr, year } = params;
	const resArr = [];
	await bluebird.map(contractNoArr, async contract_no => {
		const { cus_abb, sign_time } = await ContractsHead.findOne({
			where: { isdel: 0, contract_no }
		});
		const firstEntity = await ContractsHead.findOne({
			where: {
				isdel: 0,
				cus_abb,
				contract_state: '有效',
				delivery_time: { $ne: null }
			},
			order: [['sign_time']],
        });
		if (!firstEntity || Date.parse(sign_time) - Date.parse(firstEntity.dataValues.sign_time) < 60 * 60 * 24 * 1000 * 30 * 12 * Number(year)) {
			resArr.push(contract_no);
		}
	}, { concurrency: 5 });

	return { code: 200, msg: '', data: resArr };
}