const ProductOrder = require('../dao').ProductOrder;
const Products = require('../dao').Products;
const AssembleDiskPacking = require('../dao').AssembleDiskPacking;
const PackingList = require('../dao').PackingList;
const ContractsHead = require('../dao').ContractsHead;
const bluebird = require('bluebird');
const serviceContract = require('./contract');
const sendMQ = require('./rabbitmq').sendMQ;
const Customers = require('../dao').Customers;
const homeContracts = require('./homeContracts');
const serviceCloudDisk = require('./cloudDisk');

/*
 *@Description: 手机扫码新增单个序列号
 *@MethodAuthor: zhangligang
 *@Date: 2021-01-19 11:29:59
*/
exports.add = async params => {
    const { serialNo, contract_id, admin_id } = params;
    // 检查数量是否超了
    const contractEntity = await ContractsHead.findOne({ where: { id: contract_id } });
    const { snNum, otherSnNum, snGroup, otherSnGroup, sale_person, cus_abb, purchase, contract_no } = contractEntity.dataValues;
    const assignNum = Number(snNum) + Number(otherSnNum);
    const orderCount = await ProductOrder.count({ where: { isdel: 0, contract_id } });
    if (orderCount >= assignNum) {
        return { code: -100, msg: '超出合同规定数量' };
    }
    // 检查该序列号是否已经被其它合同占用
	const r = await new Promise(async resolve => {
		homeContracts.checkSnHasExistOtherContrats({ sn: serialNo, id: contract_id }, result => resolve(result));
	});
	if (r.code === -1) {
		const existOtherContract = r.data.contract_no;
		return { code: -1, msg: '已被' + existOtherContract + '占用' };
    }
    // 检查是否已存在装箱单内
    const productOrderEntity = await ProductOrder.findOne({ where: { serialNo, isdel: 0 } });
    if (productOrderEntity) {
        return { code: -1, msg: '该序列号已存在' };
    }
    let snGroupArr = transToArr(snGroup);
    let otherSnGroupArr = transToArr(otherSnGroup);
    // 获取序列号的类型
    const productEntity = await Products.findOne({ where: { isdel: 0, serialNo } });
    if (productEntity) {
        snGroupArr.push(String(serialNo));
    } else {
        otherSnGroupArr.push(String(serialNo));
    }
    snGroupArr = [...new Set(snGroupArr)];
    otherSnGroupArr = [...new Set(otherSnGroupArr)];
    const snLackNum = snNum - snGroupArr.length;
    const otherSnLackNum = otherSnNum - otherSnGroupArr.length;
    await ContractsHead.update({ snLackNum, otherSnLackNum, snGroup: snGroupArr.join(), otherSnGroup: otherSnGroupArr.join() }, { where: { id: contract_id } });
    await ProductOrder.create({ serialNo, contract_id });
    // 更新产品表在的dealer
    // 新增销售交易记录
    const ctrlEntity = await Products.findOne({ where: { isdel: 0, serialNo } });
    if (ctrlEntity) {
        const customerEntity = await Customers.findOne({ where: { isdel: 0, abb: cus_abb } });
        await Products.update({ dealer: customerEntity.dataValues.user_id, salesman: sale_person, status: '售出' }, { where: { serialNo } });
        sendMQ.sendQueueMsg('general_deal', JSON.stringify({
            type: '2002',
            no: serialNo,
            noType: '控制器',
            transferor: '杭州朗杰测控技术开发有限公司',
            transferorPerson: sale_person,
            transferee: customerEntity.dataValues.company,
            transfereePerson: purchase,
            credentials: contract_no,
            createType: '管理员',
            createPerson: admin_id,
        }));
    }
    return { code: 200, msg: '新增成功' };

    function transToArr(str) {
        let arr;
        try {
            arr = str.split(',').filter(items => items);
        } catch (e) {
            arr = [];
        }
        return arr;
    }
}

/*
 *@Description: 删除单个序列号
 *@MethodAuthor: zhangligang
 *@Date: 2021-01-19 13:34:40
*/
exports.del = async params => {
    const { serialNo, contract_id, byReplaced: isReplaced, admin_id } = params;
    // 检查是否已经删除了
    const productOrderEntity = await ProductOrder.findOne({ where: { serialNo, isdel: 0 }, order: [['id', 'DESC']] });
    if (!productOrderEntity) {
        return { code: 200, msg: '删除成功' };
    }
    const contractEntity = await ContractsHead.findOne({ where: { id: contract_id } });
    const { snNum, otherSnNum, snGroup, otherSnGroup, contract_no, purchase, sale_person, cus_abb } = contractEntity.dataValues;
    let snGroupArr = transToArr(snGroup);
    let otherSnGroupArr = transToArr(otherSnGroup);
    snGroupArr = snGroupArr.filter(items => items != serialNo);
    otherSnGroupArr = otherSnGroupArr.filter(items => items != serialNo);
    const snLackNum = snNum - snGroupArr.length;
    const otherSnLackNum = otherSnNum - otherSnGroupArr.length;
    await ContractsHead.update({ snLackNum, otherSnLackNum, snGroup: snGroupArr.join(), otherSnGroup: otherSnGroupArr.join() }, { where: { id: contract_id } });
    await serviceContract.deleteAssembleDiskBySnArr({ snArr: [serialNo], admin_id });
    await ProductOrder.update({ isdel: 1, isReplaced }, { where: { id: productOrderEntity.dataValues.id } });
    // dealer恢复，恢复库存，销售员
    // 发送交易信息
    const ctrlEntity = await Products.findOne({ where: { isdel: 0, serialNo } });
    if (ctrlEntity) {
        const customerEntity = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 }});
        const company = customerEntity.dataValues.company || '';
        await Products.update({ dealer: null, salesman: null, status: '库存', regAppName: null, appVersion: null, appValidTime: null, appRegCode: null, appRegAuth: null }, { where: { serialNo } });
        sendMQ.sendQueueMsg('general_deal', JSON.stringify({
            type: '2003',
            no: serialNo,
            noType: '控制器',
            transferor: company,
            transferorPerson: purchase,
            transferee: '杭州朗杰测控技术开发有限公司',
            transfereePerson: sale_person,
            credentials: contract_no,
            createType: '管理员',
            createPerson: admin_id,
        }));
    }
    return { code: 200, msg: '删除成功' };

    function transToArr(str) {
        let arr;
        try {
            arr = str.split(',').filter(items => items);
        } catch (e) {
            arr = [];
        }
        return arr;
    }
}

/*
 *@Description: 合同退货时触发
 *@MethodAuthor: zhangligang
 *@Date: 2021-01-19 11:30:22
*/
exports.delOrder = async params => {
    const { contract_id } = params;
    await ProductOrder.update({ isdel: 1 }, { where: { contract_id } });
    return { code: 200, msg: '删除成功' };
}

/**
 * 生产单列表
 */
exports.list = async params => {
    const page = params.page ? parseInt(params.page) : 1;
    const pageSize = params.num ? parseInt(params.num) : 30;
    const keywords = params.keywords || '';
    const filter = params.filter ? JSON.parse(params.filter) : {};
    const { contract_id, isBindPackage, isBindSoft } = filter;
    const where = {
        contract_id,
        $or: {
            $and: { isdel: 1, isReplaced: 1 },
            isdel: 0,
        },
    };
    if (keywords) {
        where.$or.serialNo = { $like: '%'+keywords+'%' };
    }
    let isBindPackageArr, isBindSoftArr;
    try {
        isBindPackageArr = isBindPackage.split(',').filter(items => items).map(items => {
            if (items == '已装箱') {
                return 1;
            }
            return 0;
        });
    } catch (e) {
        isBindPackageArr = [];
    }
    try {
        isBindSoftArr = isBindSoft.split(',').filter(items => items).map(items => {
            if (items == '已装盘') {
                return 1;
            }
            return 0;
        });
    } catch (e) {
        isBindSoftArr = [];
    }
    const result = await ProductOrder.findAndCountAll({
        where,
        order: [['id', 'DESC']],
    });
    const { rows } = result;
    const _p = [];
    const install_disk_id_mapper = {};
    await bluebird.map(rows, async (items, index) => {
        _p[index] = new Promise(async resolve => {
            const i = index;
            const { serialNo, contract_id } = items.dataValues;
            const productEntity = await Products.findOne({ where: { serialNo, isdel: 0 } });
            if (!productEntity) {
                rows[i].dataValues.type = 'other';
                rows[i].dataValues.model = '其它';
                rows[i].dataValues.isTest = 1;
                rows[i].dataValues.isPass = 1;
            } else {
                const { model, isTest, isPass, authType } = productEntity.dataValues;
                rows[i].dataValues.type = 'ctrl';
                rows[i].dataValues.model = model;
                rows[i].dataValues.isTest = isTest;
                rows[i].dataValues.isPass = isPass;
                rows[i].dataValues.authType = authType;
            }
            const packingEntity = await PackingList.findOne({ where: { isdel: 0, contractId: contract_id, $or: { sn: { $like: '%'+serialNo+'%' }, otherSn: { $like: '%'+serialNo+'%' } } } });
            const assembleDiskEntity = await AssembleDiskPacking.findOne({ where: { isdel: 0, contract_id, sn: serialNo } });
            if (packingEntity) {
                rows[i].dataValues.isBindPackage = 1;
            } else {
                rows[i].dataValues.isBindPackage = 0;
            }
            if (assembleDiskEntity) {
                rows[i].dataValues.isBindSoft = 1;
                rows[i].dataValues.install_disk_id = assembleDiskEntity.dataValues.install_disk_id;
                install_disk_id_mapper[assembleDiskEntity.dataValues.install_disk_id] = '';
            } else {
                rows[i].dataValues.isBindSoft = 0;
            }
            resolve();
        });
        await Promise.all(_p);
    }, { concurrency: 10 });

    const packingTotalList = await PackingList.findAll({ where: { isdel: 0, contractId: contract_id } });
    const packingTotalMapper = {};
    packingTotalList.forEach((items, index) => {
        let snArr = [], otherSnArr = [];
        try {
            snArr = items.sn.split(',').filter(items => items);
        } catch (e) {
            snArr = [];
        }
        try {
            otherSnArr = items.otherSn.split(',').filter(items => items);
        } catch (e) {
            otherSnArr = [];
        }
        packingTotalMapper[index + 1] = [...snArr, ...otherSnArr];
    });
    
    for (const install_disk_id in install_disk_id_mapper) {
        const result = await serviceCloudDisk.getTargetBurnDisk({ _id: install_disk_id });
        install_disk_id_mapper[install_disk_id] = {
            diskName: result.data.diskName,
            remark: result.data.remark,
        };
    }
    rows.forEach((items, i) => {
        if (items.dataValues.install_disk_id) {
            rows[i].dataValues.diskName = install_disk_id_mapper[items.dataValues.install_disk_id].diskName;
            rows[i].dataValues.remark = install_disk_id_mapper[items.dataValues.install_disk_id].remark;
        }
        for (const packNum in packingTotalMapper) {
            if (packingTotalMapper[packNum].includes(items.dataValues.serialNo)) {
                rows[i].dataValues.packNum = packNum;
            }
        }
    });

    const assembleDiskPackingList = await AssembleDiskPacking.findAll({ attributes: ['install_disk_id'], where: { isdel: 0, contract_id } });
    let existDiskIdArr = assembleDiskPackingList.map(items => items.dataValues.install_disk_id);
    existDiskIdArr = [...new Set(existDiskIdArr)];

    let resArr = rows;
    if (isBindPackageArr.length !== 0) {
        resArr = rows.filter(items => isBindPackageArr.includes(items.dataValues.isBindPackage));
    }
    if (isBindSoftArr.length !== 0) {
        resArr = resArr.filter(items => isBindSoftArr.includes(items.dataValues.isBindSoft));
    }
    resArr = resArr.sort((a, b) => {
        if (a.dataValues.type == b.dataValues.type) {
            return Number(b.dataValues.id) - Number(a.dataValues.id);
        } else {
            return a.dataValues.type.localeCompare(b.dataValues.type);
        }
    });
    const total = resArr.length;
    const totalSnArr = resArr.filter(items => items.dataValues.isReplaced == 0).map(items => items.dataValues.serialNo);

    return {
        code: 200,
        msg: '',
        data: {
            data: resArr.splice((page - 1) * pageSize, pageSize),
            total,
            id_arr: [],
            existDiskIdArr,
            totalSnArr,
        },
    };
}

/****************************** 装箱单pc操作 **************************/

exports.addPack = async params => {
    const { sn, type, contract_id, admin_id } = params;
    // 找一个isSend为0的单子，不存在则新增
    const packEntity = await PackingList.findOne({ where: { contractId: contract_id, isSend: 0, isdel: 0 } });
    let packId;
    if (packEntity) {
        packId = packEntity.dataValues.id;
    } else {
        const insertRes = await PackingList.create({
            num: 0,
            otherNum: 0,
            contractId: contract_id,
            insertPerson: admin_id,
            insertTime: TIME(),
            updatePerson: admin_id,
            updateTime: TIME(),
        });
        packId = insertRes.dataValues.id;
    }
    let result;
    if (type == 'ctrl') {
        result = await serviceContract.addSingleSn({ id: packId, sn, admin_id });
    } else {
        result = await serviceContract.addSingleOtherSn({ id: packId, sn, admin_id });
    }
    result.data = { packId };
    return result;
}