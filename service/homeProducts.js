const base = require('./base');
const common = require('./common');
const Products = require('../dao').Products;
const Customers = require('../dao').Customers;
const Staff = require('../dao').Staff;
const ContractsHead = require('../dao').ContractsHead;
const VirWarranty = require('../dao').VirWarranty;
const Member = require('../dao').Member;
const VirtualProducts = require('../dao').VirtualProducts;
const PackingList = require('../dao').PackingList;
const serviceModule = require('./service');
const sequelize = require('../dao').sequelize;
const Repairs = require('../dao').Repairs;
const Goods = require('../dao').Goods;
const Op = sequelize.Op;
const VerUnit = require('../dao').VerUnit;
const sendMQ = require('./rabbitmq').sendMQ;
const OtherProducts = require('../dao').OtherProducts;
const SimuProducts = require('../dao').SimuProducts;

const self = this;

async function simpleTransToView(productsArr) {
    const staffMapper = new base.StaffMap().getStaffMap();
    for (let i = 0; i < productsArr.length; i++) {
        try {
            productsArr[i].dataValues.salesman = staffMapper[productsArr[i].dataValues.salesman].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.maker = staffMapper[productsArr[i].dataValues.maker].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.tester = staffMapper[productsArr[i].dataValues.tester].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.EMP_NO = staffMapper[productsArr[i].dataValues.EMP_NO].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.inputPerson = staffMapper[productsArr[i].dataValues.inputPerson].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.update_person = staffMapper[productsArr[i].dataValues.update_person].user_name;
        } catch (e) {
            
        }
        // const result = await Customers.findOne({ where: { isdel: 0, user_id: productsArr[i].dataValues.dealer } });
        // if (result) productsArr[i].dataValues.dealer = result.dataValues.company;
        const result = await VerUnit.findOne({ where: { isdel: 0, user_id: productsArr[i].dataValues.dealer } });
        if (result) {
            productsArr[i].dataValues.dealer = result.dataValues.company;
        } else {
            const memberEntity = await Member.findOne({ where: { isdel: 0, user_id: productsArr[i].dataValues.dealer } });
            if (memberEntity) {
                productsArr[i].dataValues.dealer = memberEntity.dataValues.name;
            }
        }
        // 合同信息
        const contractEntity = await ContractsHead.findOne({ where: { isdel: 0, snGroup: { $like: '%'+productsArr[i].dataValues.serialNo+'%' }}});
        if (contractEntity) {
            productsArr[i].dataValues.salesman = contractEntity.dataValues.sale_person;
            try {
                productsArr[i].dataValues.salesman = staffMapper[productsArr[i].dataValues.salesman].user_name;
            } catch (e) {
                
            }
        }
    }
    return productsArr;
}

async function transToView(productsArr, needRegHistory) {
    const staffMapper = new base.StaffMap().getStaffMap();
    for (let i = 0; i < productsArr.length; i++) {
        try {
            productsArr[i].dataValues.salesman = staffMapper[productsArr[i].dataValues.salesman].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.maker = staffMapper[productsArr[i].dataValues.maker].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.tester = staffMapper[productsArr[i].dataValues.tester].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.EMP_NO = staffMapper[productsArr[i].dataValues.EMP_NO].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.inputPerson = staffMapper[productsArr[i].dataValues.inputPerson].user_name;
        } catch (e) {
            
        }
        try {
            productsArr[i].dataValues.update_person = staffMapper[productsArr[i].dataValues.update_person].user_name;
        } catch (e) {
            
        }
        // 获取当前拥有者
        const result = await VerUnit.findOne({ where: { isdel: 0, user_id: productsArr[i].dataValues.dealer } });
        if (result) {
            productsArr[i].dataValues.dealer = result.dataValues.company;
        } else {
            const memberEntity = await Member.findOne({ where: { isdel: 0, user_id: productsArr[i].dataValues.dealer } });
            if (memberEntity) {
                productsArr[i].dataValues.dealer = memberEntity.dataValues.name;
            }
        }
        // 合同信息
        const contractEntity = await ContractsHead.findOne({ where: { isdel: 0, snGroup: { $like: '%'+productsArr[i].dataValues.serialNo+'%' }}});
        if (contractEntity) {
            const customerEntity = await Customers.findOne({ where: { isdel: 0, abb: contractEntity.dataValues.cus_abb } });
            if (customerEntity) {
                productsArr[i].dataValues.contract_company = customerEntity.dataValues.company;
            }
            productsArr[i].dataValues.contract_no = contractEntity.dataValues.contract_no;
            productsArr[i].dataValues.isDirectSale = contractEntity.dataValues.isDirectSale;
            productsArr[i].dataValues.sign_time = contractEntity.dataValues.sign_time;
            productsArr[i].dataValues.purchase = contractEntity.dataValues.purchase;
            productsArr[i].dataValues.delivery_state = contractEntity.dataValues.delivery_state;
            productsArr[i].dataValues.salesman = contractEntity.dataValues.sale_person;
            try {
                productsArr[i].dataValues.salesman = staffMapper[productsArr[i].dataValues.salesman].user_name;
            } catch (e) {
                
            }
            // 装箱单信息
            const packEntityList = await PackingList.findAll({ where: { isdel: 0, contractId: contractEntity.dataValues.id } });
            productsArr[i].dataValues.packingList = packEntityList;
        }
        // 交易信息
        const tradingRecordList = await common.getTradingRecordByOwnerId(productsArr[i].dataValues.serialNo);
        productsArr[i].dataValues.tradingRecordList = tradingRecordList;
        // 保修单信息
        const virWarrantyEntity = await VirWarranty.findOne({ where: { isdel: 0, sn: productsArr[i].dataValues.serialNo } });
        if (virWarrantyEntity) {
            productsArr[i].dataValues.addr = virWarrantyEntity.dataValues.addr;
            productsArr[i].dataValues.insert_date = virWarrantyEntity.dataValues.insert_date;
            productsArr[i].dataValues.valid_date = virWarrantyEntity.dataValues.valid_date;
            const memberEntity = await Member.findOne({ where: { unionid: virWarrantyEntity.dataValues.bind_unionid }});
            productsArr[i].dataValues.bind_unionid = memberEntity ? memberEntity.dataValues.name : virWarrantyEntity.dataValues.bind_unionid;
        }
        // 维修信息
        const repairList = await Repairs.findAll({ where: { isdel: 0, serial_no: { $like: '%'+productsArr[i].dataValues.serialNo+'%' } }, order: [['id', 'DESC']] });
        for (let j = 0; j < repairList.length; j++) {
            repairList[j].dataValues.receive_time = DATETIME(repairList[j].dataValues.receive_time*1000);
        }
        productsArr[i].dataValues.repairList = repairList;
        // 注册历史
        if (needRegHistory) {
            const r = await self.getRegHistory(productsArr[i].dataValues.serialNo);
            productsArr[i].dataValues.regHistoryList = r.data;
        }
        // 软件配置
        const appResult = await self.getApp({ id: productsArr[i].dataValues.id });
        productsArr[i].dataValues.softInfo = appResult.data;
    }
    return productsArr;
}

async function transToModel(params) {
    const { maker, tester } = params;
    const staffMapper = new base.StaffMap().getStaffMap();
    const formData = {};
    for (const user_id in staffMapper) {
        if (staffMapper[user_id].user_name == maker) formData.maker = user_id;
        if (staffMapper[user_id].user_name == tester) formData.tester = user_id;
    }
    return formData;
}

/**
 *  产品列表
 */
this.index = async params => {
    const num = params.num ? parseInt(params.num) : 30;
	const page = params.page ? parseInt(params.page) : 1;
    const keywords = params.keywords ? params.keywords : '';
    const order = params.order ? params.order : 'id';
    const filter = params.filter ? JSON.parse(params.filter) : {};
    const where = {
        $or: {
            serialNo: { $like: '%'+keywords+'%'},
            machineNo: { $like: '%'+keywords+'%'},
        },
        isdel: 0,
    };
    if (keywords) {
        const cusEntity = await Customers.findAll({ where: { isdel: 0, company: { $like: '%'+keywords+'%' } } });
        const dealerArr = cusEntity.map(items => items.dataValues.user_id);
        where.$or.dealer = { $in: dealerArr };
    }
    let statusArr, modelArr, storageArr;
    try {
        statusArr = filter.status.split(',').filter(items => items);
    } catch (e) {
        statusArr = [];
    }
    try {
        modelArr = filter.model.split(',').filter(items => items);
    } catch (e) {
        modelArr = [];
    }
    if (statusArr.length !== 0) {
        where.status = { $in: statusArr };
    }
    if (modelArr.length === 1) {
        if (modelArr[0] === '代龙') {
            where.model = { $like: 'D%' };
        } else {
            where.model = { $notLike: 'D%' };
        }
    }
    if (filter.storage === '济南办' || filter.storage === '杭州办') {
        const borrowSnArr = await filterBorrowCards();
        where.status = '库存';
        where.storage = filter.storage;
        where.serialNo = { $notIn: borrowSnArr };
    } else if (filter.storage === '借用') {
        const borrowSnArr = await filterBorrowCards();
        where.serialNo = { $in: borrowSnArr };
    }
    const result = await Products.findAndCountAll({
        where,
        limit: num,
        offset: (page - 1) * num,
        order: [[ 'inputDate', 'DESC' ]],
    });
    return {
        code: 200,
        msg: '',
        data: {
            data: await simpleTransToView(result.rows),
            id_arr: [],
            total: result.count,
        }
    };

    async function filterBorrowCards() {
        const goodsList = await Goods.findAll({ where: { isdel: 0, goodsType: '试产品' } });
        let totalSnArr = [];
        for (let i = 0; i < goodsList.length; i++) {
            let snStr = '';
            try {
                snStr = goodsList[i].serialNo.replace(/\W/g, ',');
            } catch (e) {
                
            }
            const snArr = snStr.split(',').filter(items => items);
            totalSnArr = [ ...totalSnArr, ...snArr ];
        }
        return totalSnArr;
    }
}

/**
 * 获取所有库存和未入库的序列号
 */
this.getTotalInventorySn = async () => {
    const result = await Products.findAll({ attributes: ['serialNo'], where: { isdel: 0, status: { $in: ['库存', '未入库'] } } });
    return { code: 200, msg: '', data: result.map(items => items.dataValues.serialNo) };
}

/**
 * 指定id产品
 */
this.show = async params => {
    const { id } = params;
    const itemEntity = await Products.findOne({ where: { id } });
    const result = await transToView([itemEntity]);
    return {
        code: 200,
        msg: '查询成功',
        data: result[0],
    };
}

this.showBySn = async (sn, needRegHistory) => {
    const itemEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    const result = await transToView([itemEntity], needRegHistory);
    return {
        code: 200,
        msg: '查询成功',
        data: result[0],
    };
}

/**
 * 删除
 */
this.destroy = async params => {
    const { id } = params;
    const result = await Products.update({
        isdel: 1,
    }, {
        where: { id },
    });
    return {
        code: 200,
        msg: '查询成功',
        data: [],
    };
}

/**
 * 更新
 */
this.update = async params => {
    const { model, maker, tester, remark, machineNo, caliCoeff, chnlNum, admin_id, id } = params;
    const formData = await transToModel({
        maker,
        tester,
    });
    formData.model = model;
    formData.remark = remark;
    formData.machineNo = machineNo;
    formData.caliCoeff = caliCoeff;
    formData.chnlNum = chnlNum;
    // formData.EMP_NO = admin_id;
    formData.update_person = admin_id;
    formData.update_time = TIME();
    const result = await Products.update(formData, {
        where: { id },
    });
    return {
        code: 200,
        msg: '更新成功',
        data: result,
    };
}

/**
 * 报废
 */
this.scrapped = async params => {
    const { id, scrappedRem, admin_id } = params;
    await Products.update({ scrappedRem, status: '报废', update_person: admin_id, update_time: TIME() }, { where: { id } });
    return { code: 200, msg: '更新成功' };
}

/**
 * 新增自费app
 */
this.addApp = async params => {
    let { appName, _version, _validDate, _regCode, _regAuth, id, admin_id, sn } = params;
    let productInfo;
    if (id) {
        productInfo = await Products.findOne({ where: { id } });
    } else {
        productInfo = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    }
    if (!productInfo) {
        return { code: -1, msg: '不存在' };
    }
    const { regAppName, appVersion, appValidTime, appRegCode, appRegAuth } = productInfo.dataValues;
    id = productInfo.dataValues.id;
    let regAppNameArr, appVersionArr, appValidTimeArr, appRegCodeArr, appRegAuthArr;
    try {
        regAppNameArr = regAppName.split(',').filter(items => items);
    } catch (e) {
        regAppNameArr = [];
    }
    try {
        appVersionArr = appVersion.split(',').filter(items => items);
    } catch (e) {
        appVersionArr = [];
    }
    try {
        appValidTimeArr = appValidTime.split(',').filter(items => items);
    } catch (e) {
        appValidTimeArr = [];
    }
    try {
        appRegCodeArr = appRegCode.split(',').filter(items => items);
    } catch (e) {
        appRegCodeArr = [];
    }
    try {
        appRegAuthArr = appRegAuth.split(',').filter(items => items);
    } catch (e) {
        appRegAuthArr = [];
    }
    if (regAppNameArr.indexOf(appName) !== -1) return { code: -1, msg: '该App已存在' };
    _version = _version ? _version : '1.0.0';
    _validDate = _validDate ? _validDate : 'null';
    _regCode = _regCode ? _regCode : 0;
    _regAuth = _regAuth ? _regAuth : 0;
    regAppNameArr.push(appName);
    appVersionArr.push(_version);
    appValidTimeArr.push(_validDate);
    appRegCodeArr.push(_regCode);
    appRegAuthArr.push(_regAuth);
    const result = await Products.update({
        regAppName: regAppNameArr.join(),
        appVersion: appVersionArr.join(),
        appValidTime: appValidTimeArr.join(),
        appRegCode: appRegCodeArr.join(),
        appRegAuth: appRegAuthArr.join(),
        // EMP_NO: admin_id,
        update_person: admin_id,
        update_time: TIME(),
    }, { where: { id } });
    return {
        code: 200,
        msg: '新增成功',
        data: result,
    };
}

// setTimeout(() => {
    // this.addApp({ appName: 'MaxTest', id: 27565, admin_id: 1702 }).then(result => console.log(result));
    // this.getApp({ id: 27565 }).then(result => console.log(result));
    // this.delApp({ appName: 'MaxTest-Wdw', id: 27565, admin_id: 1702 }).then(result => console.log(result));
// }, 1000);

/**
 * 删除自费app
 */
this.delApp = async params => {
    let { appName, id, admin_id, sn } = params;
    let productInfo;
    if (id) {
        productInfo = await Products.findOne({ where: { id } });
    } else {
        productInfo = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    }
    if (!productInfo) {
        return { code: -1, msg: '不存在' };
    }
    const { regAppName, appVersion, appValidTime, appRegCode, appRegAuth } = productInfo.dataValues;
    id = productInfo.dataValues.id;
    let regAppNameArr, appVersionArr, appValidTimeArr, appRegCodeArr, appRegAuthArr;
    try {
        regAppNameArr = regAppName.split(',').filter(items => items);
    } catch (e) {
        regAppNameArr = [];
    }
    try {
        appVersionArr = appVersion.split(',').filter(items => items);
    } catch (e) {
        appVersionArr = [];
    }
    try {
        appValidTimeArr = appValidTime.split(',').filter(items => items);
    } catch (e) {
        appValidTimeArr = [];
    }
    try {
        appRegCodeArr = appRegCode.split(',').filter(items => items);
    } catch (e) {
        appRegCodeArr = [];
    }
    try {
        appRegAuthArr = appRegAuth.split(',').filter(items => items);
    } catch (e) {
        appRegAuthArr = [];
    }
    const ind = regAppNameArr.indexOf(appName);
    if (ind === -1) return { code: -1, msg: '该App已删除' };
    regAppNameArr.splice(ind, 1);
    appVersionArr.splice(ind, 1);
    appValidTimeArr.splice(ind, 1);
    appRegCodeArr.splice(ind, 1);
    appRegAuthArr.splice(ind, 1);
    const result = await Products.update({
        regAppName: regAppNameArr.join(),
        appVersion: appVersionArr.join(),
        appValidTime: appValidTimeArr.join(),
        appRegCode: appRegCodeArr.join(),
        appRegAuth: appRegAuthArr.join(),
        // EMP_NO: admin_id,
        update_person: admin_id,
        update_time: TIME(),
    }, { where: { id } });
    return {
        code: 200,
        msg: '删除成功',
        data: result,
    };
}

/**
 * 获取app
 */
this.getApp = async params => {
    const { id } = params;
    const productInfo = await Products.findOne({ where: { id } });
    const { regAppName, appVersion, appValidTime, appRegCode, appRegAuth } = productInfo.dataValues;
    let regAppNameArr, appVersionArr, appValidTimeArr, appRegCodeArr, appRegAuthArr;
    try {
        regAppNameArr = regAppName.split(',').filter(items => items);
    } catch (e) {
        regAppNameArr = [];
    }
    try {
        appVersionArr = appVersion.split(',').filter(items => items);
    } catch (e) {
        appVersionArr = [];
    }
    try {
        appValidTimeArr = appValidTime.split(',').filter(items => items);
    } catch (e) {
        appValidTimeArr = [];
    }
    try {
        appRegCodeArr = appRegCode.split(',').filter(items => items);
    } catch (e) {
        appRegCodeArr = [];
    }
    try {
        appRegAuthArr = appRegAuth.split(',').filter(items => items);
    } catch (e) {
        appRegAuthArr = [];
    }
    const resArr = [];
    regAppNameArr.forEach((items, index) => {
        resArr.push({
            regAppName: items,
            appVersion: appVersionArr[index],
            appValidTime: (appValidTimeArr[index] == 'null' || appValidTimeArr[index] == undefined) ? null : appValidTimeArr[index],
            appRegCode: appRegCodeArr[index],
            appRegAuth: appRegAuthArr[index],
        });
    });
    return {
        code: 200,
        msg: '查询成功',
        data: resArr,
    };
}

/**
 * 获取指定sn的注册历史
 */
this.getRegHistory = async sn => {
    const result = await new Promise(resolve => {
        serviceModule.regEvent({
            sn,
            code: [ 10001 ],
        }, result => resolve(result));
    });
    return {
        code: 200,
        msg: '查询成功',
        data: result,
    };
}

/**
 * 获取虚拟产品列表
 */
this.getVirtualList = async params => {
    const num = params.num ? parseInt(params.num) : 30;
	const page = params.page ? parseInt(params.page) : 1;
    const keywords = params.keywords ? params.keywords : '';
    const result = await VirtualProducts.findAndCountAll({
        where: {
            $or: {
                serialNo: { $like: '%'+ keywords +'%' },
                contractNo: { $like: '%'+ keywords +'%' },
            },
        },
        limit: num,
        offset: (page - 1) * num,
        order: [['insertTime', 'DESC']],
    });
    const customerList = await Customers.findAll({ where: { isdel: 0 } });
    const companyMapper = {};
    customerList.forEach(items => companyMapper[items.dataValues.abb] = items.dataValues.company);
    const _p = [];
    result.rows.forEach((items, index) => {
        _p[index] = new Promise(async resolve => {
            const i = index;
            if (items.dataValues.contractNo) {
                const contractEntity = await ContractsHead.findOne({ where: { isdel: 0, contract_no: items.dataValues.contractNo } });
                if (contractEntity) {
                    const abb = contractEntity.dataValues.cus_abb;
                    result.rows[i].dataValues.company = companyMapper[abb];
                }
            }
            resolve();
        });
    });
    await Promise.all(_p);
    return {
        code: 200,
        msg: '',
        data: {
            data: result.rows,
            id_arr: [],
            total: result.count,
        }
    };
}

/**
 * 新增转手记录
 */
this.addResaleRecord = async params => {
    const { sn, user_id, admin_id } = params;
    // 找出当前的所属单位
    // 找出接手的所属单位
    const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    const { dealer } = productEntity.dataValues;
    let transferor, transferee;
    const transferorCustomerEntity = await Customers.findOne({ where: { user_id: dealer } });
    const transferorMemberEntity = await Member.findOne({ where: { user_id: dealer } });
    const transfereeCustomerEntity = await Customers.findOne({ where: { user_id } });
    const transfereeMemberEntity = await Member.findOne({ where: { user_id } });
    if (transferorCustomerEntity) {
        transferor = transferorCustomerEntity.dataValues.company;
    } else {
        if (transferorMemberEntity) {
            transferor = transferorMemberEntity.dataValues.name;
        } else {
            transferor = '杭州朗杰测控技术开发有限公司';
        }
    }
    if (transfereeCustomerEntity) {
        transferee = transfereeCustomerEntity.dataValues.company;
    } else {
        if (transfereeMemberEntity) {
            transferee = transfereeMemberEntity.dataValues.name;
        } else {
            return { code: -1, msg: '找不到受让方' };
        }
    }
    sendMQ.sendQueueMsg('general_deal', JSON.stringify({
        type: '2001',
        no: sn,
        noType: '控制器',
        transferor,
        transferorPerson: '',
        transferee,
        transfereePerson: '',
        credentials: admin_id,
        createType: '管理员',
        createPerson: admin_id,
    }));
    await Products.update({ dealer: user_id }, { where: { serialNo: sn, isdel: 0 }});
    return {
        code: 200,
        msg: '操作成功',
        data: [],
    };
}

/**
 * 新增判定记录
 */
this.addJudgeRecord = async params => {
    const { sn, user_id, admin_id } = params;
    // 找出当前的所属单位
    // 找出接手的所属单位
    const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    const { dealer } = productEntity.dataValues;
    let transferor, transferee;
    const transferorCustomerEntity = await Customers.findOne({ where: { user_id: dealer } });
    const transferorMemberEntity = await Member.findOne({ where: { user_id: dealer } });
    const transfereeCustomerEntity = await Customers.findOne({ where: { user_id } });
    const transfereeMemberEntity = await Member.findOne({ where: { user_id } });
    if (transferorCustomerEntity) {
        transferor = transferorCustomerEntity.dataValues.company;
    } else {
        if (transferorMemberEntity) {
            transferor = transferorMemberEntity.dataValues.name;
        } else {
            transferor = '杭州朗杰测控技术开发有限公司';
        }
    }
    if (transfereeCustomerEntity) {
        transferee = transfereeCustomerEntity.dataValues.company;
    } else {
        if (transfereeMemberEntity) {
            transferee = transfereeMemberEntity.dataValues.name;
        } else {
            return { code: -1, msg: '找不到受让方' };
        }
    }
    sendMQ.sendQueueMsg('general_deal', JSON.stringify({
        type: '2004',
        no: sn,
        noType: '控制器',
        transferor,
        transferorPerson: '',
        transferee,
        transfereePerson: '',
        credentials: admin_id,
        createType: '管理员',
        createPerson: admin_id,
    }));
    await Products.update({ dealer: user_id }, { where: { serialNo: sn, isdel: 0 }});
    return {
        code: 200,
        msg: '操作成功',
        data: [],
    };
}

this.addCtrlInfo = async params => {
    const { serialNo, admin_id } = params;
    const checkResult = await checkSnExist(serialNo);
    if (checkResult.code === -1) {
        return checkResult;
    }
    params.maker = admin_id;
    params.update_person = admin_id;
    params.update_time = TIME();
    params.inputPerson = admin_id;
    params.inputDate = TIME();
    await Products.create(params);
    return { code: 200, msg: '新增成功' };
}

/******************************************* 其它产品 ********************************************/
this.otherProducts = {
    getList: async function(params) {
        const num = params.num ? parseInt(params.num) : 30;
        const page = params.page ? parseInt(params.page) : 1;
        const keywords = params.keywords ? params.keywords : '';
        const order = params.order ? params.order : 'id';
        const filter = params.filter ? JSON.parse(params.filter) : {};
        const result = await OtherProducts.findAndCountAll({
            where: {
                serialNo: { $like: '%'+keywords+'%' },
                isdel: 0,
            },
            limit: num,
            offset: ( page - 1 ) * num,
            order: [['id', 'DESC']],
        });
        const staffMapper = new base.StaffMap().getStaffMap();
        for (let i = 0; i < result.rows.length; i++) {
            const items = result.rows[i];
            const repairList = await Repairs.findAll({ where: { isdel: 0, serial_no: { $like: '%'+items.dataValues.serialNo+'%' } }, order: [['id', 'DESC']] });
            result.rows[i].dataValues.repairList = repairList;
            try {
                result.rows[i].dataValues.insert_person = staffMapper[items.dataValues.insert_person].user_name;
            } catch (e) {
                
            }
        }
        return {
            code: 200,
            msg: '',
            data: {
                total: result.count,
                data: result.rows,
                id_arr: [],
            },
        };
    },
    add: async function(params) {
        const { serialNo, admin_id } = params;
        if (!serialNo) {
            return { code: -1, msg: '序列号不能为空' };
        }
        const checkResult = await checkSnExist(serialNo);
        if (checkResult.code === -1) {
            return checkResult;
        }
        params.insert_person = admin_id;
        params.insert_time = TIME();
        await OtherProducts.create(params);
        return { code: 200, msg: '新增成功' };
    },
    edit: async function(params) {
        await OtherProducts.update(params, { where: { id: params.id } });
        return { code: 200, msg: '更新成功' };
    },
    del: async function(params) {
        const { id } = params;
        await OtherProducts.update({ isdel: 1 }, { where: { id } });
        return { code: 200, msg: '删除成功' };
    },
};

async function checkSnExist(serialNo, excludeSimu) {
    const productsEntity = await Products.findOne({ where: { isdel: 0, serialNo } });
    const otherProductsEntity = await OtherProducts.findOne({ where: { isdel: 0, serialNo } });
    const simuProductsEntity = await SimuProducts.findOne({ where: { isdel: 0, serialNo } });
    if (excludeSimu) {
        if (productsEntity || otherProductsEntity) {
            return { code: -1, msg: '该序列号已存在' };
        }
    } else {
        if (productsEntity || otherProductsEntity || simuProductsEntity) {
            return { code: -1, msg: '该序列号已存在' };
        }
    }
    return { code: 200 };
}

exports.checkSnExist = checkSnExist;