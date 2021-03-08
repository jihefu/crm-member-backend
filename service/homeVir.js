const Customers = require('../dao').Customers;
const Member = require('../dao').Member;
const Staff = require('../dao').Staff;
const Products = require('../dao').Products;
const request = require('request');
const moment = require('moment');
const SuitableProductList = require('../dao').SuitableProductList;
const MachineType = require('../dao').MachineType;
const homeServiceCustomers = require('./homeCustomers');
const bluebird = require('bluebird');

/**********************************************************************************************/

// 按试验机厂家分类
exports.sortByFactory = async () => {
    const entity = await SuitableProductList.findAll({ attributes: [ 'id', 'name', 'customerId' ], where: { isdel: 0 } });
    // const hashMapper = {}, resArr = [];
    // entity.forEach((items, index) => {
    //     if (!hashMapper[items.dataValues.company]) hashMapper[items.dataValues.company] = [];
    //     hashMapper[items.dataValues.company].push(items.dataValues.model);
    // });
    // for (const key in hashMapper) {
    //     resArr.push({
    //         company: key,
    //         model: hashMapper[key],
    //     });
    // }
    return {
        code: 200,
        msg: '查询成功',
        data: entity,
    };
}

// 按适用方案分类
exports.sortBySolution = async () => {
    let entity = await MachineType.findAll({ attributes: [ 'id', 'name', 'sup_id', 'index' ], where: { isdel: 0 } });
    const nodeArr = [];
    entity = entity.sort((a, b) => a.index - b.index);
    entity.forEach(items => {
        if (!items.sup_id) {
            nodeArr.push({
                id: items.id,
                name: items.name,
                index: items.index,
                sup_id: items.sup_id,
                children: [],
            });
        }
    });
    for (let i = 0; i < nodeArr.length; i++) {
        pushNode(nodeArr[i]);
    }
    
    function pushNode(items) {
        for (let i = 0; i < entity.length; i++) {
            if (entity[i].sup_id === items.id) {
                items.children.push({
                    id: entity[i].id,
                    name: entity[i].name,
                    index: entity[i].index,
                    sup_id: entity[i].sup_id,
                    children: [],
                });
            }
        }
        items.children = items.children.sort((a, b) => a.index - b.index);
        if (items.children.length !== 0) {
            for (let i = 0; i < items.children.length; i++) {
                pushNode(items.children[i]);
            }
        }
    }

    return {
        code: 200,
        msg: '查询成功',
        data: nodeArr,
    };
}

async function trans(data) {
    // 获取所有机型列表和解决方案列表
    const suitList = await SuitableProductList.findAll({ where: { isdel: 0 } });
    const machineTypeArr = await MachineType.findAll({ where: { isdel: 0 } });
    const suitHashMapper = {}, machineTypeHashMapper = {};
    suitList.forEach(items => suitHashMapper[items.id] = items);
    machineTypeArr.forEach(items => machineTypeHashMapper[items.id] = items);
    // 获取所有公司
    const cusResult = await homeServiceCustomers.getAllList();
    const cusHashMapper = {};
    cusResult.data.forEach((items, index) => {
        cusHashMapper[items.user_id] = items.company;
    });
    // 作者转换
    const memberArr = await Member.findAll();
    const memebrHashMapper = {};
    memberArr.forEach((items, index) => {
        memebrHashMapper[items.dataValues.unionid] = items.dataValues.name;
    });
    data.forEach((items, index) => {
        data[index].author = memebrHashMapper[items.author];
        data[index].suitableProductListName = items.suitableProductList.map(items => {
            suitHashMapper[items].dataValues.company = cusHashMapper[suitHashMapper[items].customerId];
            return suitHashMapper[items];
        });
        // 合并同一家公司的多种机型
        const arr = [], obj = {};
        data[index].suitableProductListName.forEach((items, index) => {
            if (!obj[items.dataValues.company]) obj[items.dataValues.company] = [];
            obj[items.dataValues.company].push(items.dataValues.name);
        });
        for (const key in obj) {
            arr.push({
                company: key,
                model: obj[key],
            });
        }
        data[index].suitableProductListName = arr;
        try {
            data[index].machineTypeName = machineTypeHashMapper[items.machineType].name;
        } catch (e) {
            data[index].machineTypeName = '其他';
        }
    });
}

// 模板列表
exports.tempList = async params => {
    let { page, num, keywords } = params;
    page = page ? parseInt(page) : 1;
    num = num ? parseInt(num) : 30;
    let result = await fetch();
    if (keywords) result = result.filter(items => items.name.indexOf(keywords) !== -1);
    const total = result.length;
    const data = result.splice((page - 1) * num, num);
    await trans(data);
    // 适用试验机转换
    // 使用解决方案转换
    return {
        code: 200,
        msg: '查询成功',
        data: {
            data,
            total,
            id_arr: [],
        },
    };

    function fetch() {
        return new Promise(resolve => {
            request.get(CONFIG.actionApiAddr + '/vtc/cfgTemp', (err, response, body) => {
                body = JSON.parse(body);
                resolve(body.data);
            });
        });
    }
}

// 模板名称列表
exports.tempNameList = async params => {
    const keywords = params.keywords ? params.keywords : '';
    const result = await new Promise(resolve => {
        request.get(CONFIG.actionApiAddr + '/vtc/cfgTemp', (err, response, body) => {
            body = JSON.parse(body);
            resolve(body.data);
        });
    });
    let resArr = result.map(items => {
        if (items.name.indexOf(keywords) !== -1) {
            return {
                text: items.name,
                value: items.name,
            };
        } else {
            return '';
        }
    });
    resArr = resArr.filter(items => items);
    return {
        code: 200,
        msg: '查询成功',
        data: resArr,
    };
}

// 指定模板
exports.targetTemp = async params => {
    const { name } = params;
    const result = await new Promise(resolve => {
        request(CONFIG.actionApiAddr + '/vtc/cfgTemp/label/' + encodeURI(name), (err, response, body) => {
            body = typeof body === 'string' ? JSON.parse(body) : body;
            resolve(body.data);
        });
    });
    await trans([result]);
    return {
        code: 200,
        msg: '',
        data: result,
    };
}

// 更新模板label
exports.updateTemp = async params => {
    const { name, remark, machineType, unionid } = params;
    const formData = {
        info: {
            remark,
            machineType: machineType ? machineType : CONFIG.machineTypeOtherId,
        },
    };
    if (!remark) delete formData.info.remark;
    const result = await new Promise(resolve => {
        request({
            url: CONFIG.cloudApiAddr + '/vtc/cfgTemp/public/' + encodeURI(name),
            method: 'put',
            headers: {
                Accept: 'application/json',
                primaryunionid: unionid,
            },
            body: formData,
            json: true,
        }, (err, response, body) => {
            body = typeof body === 'string' ? JSON.parse(body) : body;
            resolve(body);
        });
    });
    return result;
}

// 删除模板
exports.deleteTemp = async params => {
    const { unionid, name } = params;
    const result = await new Promise(resolve => {
        request({
            url: CONFIG.cloudApiAddr + '/vtc/cfgTemp/public/' + encodeURI(name),
            method: 'delete',
            headers: {
                Accept: 'application/json',
                primaryunionid: unionid,
            },
        }, (err, response, body) => {
            body = typeof body === 'string' ? JSON.parse(body) : body;
            resolve(body);
        });
    });
    return result;
}

// 创建单个实例
exports.createInstance = async params => {
    const { startSn, endSn, versionRem, name, admin_id } = params;
    const snArr = [];
    for (let i = startSn; i <= endSn; i++) {
        snArr.push(i);
    }
    // 根据admin_id获取unionid
    const staffEntity = await Staff.findOne({ where: { user_id: admin_id, isdel: 0 } });
    const { open_id } = staffEntity.dataValues;
    const memberEntity = await Member.findOne({ where: { open_id, } });
    const { unionid } = memberEntity.dataValues;
    const nji = await fetchDoc();
    const result = await createVtcInstance({
        nji,
        versionRem: versionRem ? versionRem : '厂家配置',
        snArr,
        unionid,
    });
    return result;

    // 获取模板内容
    function fetchDoc() {
        return new Promise(resolve => {
            request(CONFIG.actionApiAddr + '/vtc/cfgTemp/label/' + encodeURI(name), (err, response, body) => {
                body = JSON.parse(body);
                const _id = body.data.contentId;
                request(CONFIG.actionApiAddr + '/vtc/cfgTemp/' + _id, (err, response, body) => {
                    body = JSON.parse(body);
                    delete body.data._id;
                    resolve(body.data);
                });
            });
        });
    }
}

// 创建实例
// 给威程网页调用或仿真网页调用
async function createVtcInstance(params) {
    const { nji, versionRem, title, snArr, unionid, simu } = params;
    let createResult;
    await bluebird.map(snArr, async items => {
        await new Promise(resolve => {
            request({
                url: CONFIG.actionApiAddr + '/vtc/nji/' + items,
                method: 'POST',
                headers: {
                    primaryunionid: unionid,
                },
                form: {
                    info: {
                        title: title ? title : '厂家配置',
                        versionRem: versionRem ? versionRem : '厂家配置',
                        saveTime: moment().format('YYYY/M/D HH:mm:ss'),
                        uploadFrom: '网页',
                        simu: simu ? true : false,
                    },
                    config: JSON.stringify(nji),
                },
            }, (err, response, body) => {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    
                }
                createResult = body;
                resolve(body);
            });
        });
    }, { concurrency: 3 });
    return createResult;
}
exports.createVtcInstance = createVtcInstance;