const fs = require('fs');
const bluebird = require('bluebird');
const SimuProducts = require('../dao').SimuProducts;
const Staff = require('../dao').Staff;
const Member = require('../dao').Member;
const serviceHomeProducts = require('./homeProducts');
const serviceHomeVir = require('./homeVir');
const request = require('request');
const moment = require('moment');

async function readFile(dirname) {
    try {
        const result = await new Promise((resolve, reject) => {
            fs.readFile(dirname, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data.toString());
            });
        });
        return { code: 200, data: result };
    } catch (e) {
        return { code: -1, msg: e.message, data: e };
    }
    
}

/**
 * 解决方案列表
 */
this.getSolutionList = async () => {
    const list = await new Promise(resolve => {
        fs.readdir(CONFIG.staticSimuPath + '/simu_factory', (err, data) => {
            if (err) {
                resolve([]);
            }
            resolve(data);
        });
    });
    return {
        code: 200,
        data: list,
    };
}

/**
 * 指定解决方案的机型列表
 */
this.getModelListBySolution = async params => {
    const { solution } = params;
    const modelDirName = CONFIG.staticSimuPath + '/simu_factory/' + solution + '/model';
    const list = await new Promise(resolve => {
        fs.readdir(modelDirName, (err, data) => {
            if (err) {
                resolve([]);
            }
            resolve(data);
        });
    });
    return {
        code: 200,
        data: list,
    };
}

/**
 * 指定解决方案的ats列表
 */
this.getAtsListBySolution = async params => {
    const { solution } = params;
    const atsDirName = CONFIG.staticSimuPath + '/simu_factory/' + solution + '/ats';
    const list = await new Promise(resolve => {
        fs.readdir(atsDirName, (err, data) => {
            if (err) {
                resolve([]);
            }
            resolve(data);
        });
    });
    const resArr = [];
    await bluebird.map(list, async items => {
        await new Promise(async resolve => {
            const atsName = items;
            const fileResult = await readFile(atsDirName + '/' + atsName);
            if (fileResult.code === 200) {
                const obj = {};
                obj[atsName] = fileResult.data.toString();
                resArr.push(obj);
            }
            resolve();
        });
    }, { concurrency: 5 });
    return {
        code: 200,
        data: resArr,
    };
}

// 仿真控制器列表
this.getSimuList = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.num ? Number(params.num) : 30;
    const keywords = params.keywords ? params.keywords : '';
    const filter = params.filter ? JSON.parse(params.filter) : {};
    let workStateArr, isOpenArr;
    try {
        workStateArr = filter.workState.split(',').filter(items => items);
    } catch (e) {
        workStateArr = [];
    }
    try {
        if (typeof filter.isOpen === 'number') {
            filter.isOpen = String(filter.isOpen);
        }
        isOpenArr = filter.isOpen.split(',').filter(items => items);
    } catch (e) {
        isOpenArr = [];
    }
    workStateArr = workStateArr.map(items => {
        if (items === '使用中') {
            return 2;
        } else if (items === '空闲') {
            return 1;
        } else {
            return 0;
        }
    });
    // 获取vtc进程池信息
    const poolInfo = await new Promise(resolve => {
        request.get(CONFIG.vtcServerAddr + '/cloudVtc/connect/poolInfo', (err, response, body) => {
            try {
                body = JSON.parse(body);
                resolve(body.data);
            } catch (e) {
                
            }
        });
    });
    const snArr = poolInfo.childProcessData.map(items => items.sn);
    let result;
    // 获取数据
    if (workStateArr.length === 0 || workStateArr.includes(0)) {
        // 包含离线
        result = await SimuProducts.findAll({
            where: {
                $or: {
                    serialNo: { $like: '%'+ keywords +'%' },
                    machineModel: { $like: '%'+ keywords +'%' },
                },
            },
        });
    } else {
        // 不包含离线
        result = await SimuProducts.findAll({
            where: {
                serialNo: { $in: snArr },
                $or: {
                    serialNo: { $like: '%'+ keywords +'%' },
                    machineModel: { $like: '%'+ keywords +'%' },
                },
            },
        });
    }
    // 赋值
    result.forEach((items, index) => {
        const { serialNo } = items.dataValues;
        result[index].dataValues.workState = 0;
        result[index].dataValues.usePerson = '';
        const it = findTargetProcessBySn(poolInfo, serialNo);
        result[index].dataValues.processInfo = it;
        if (Object.keys(it).length !== 0) {
            result[index].dataValues.rss = it.processInfo.memoryUsage ? it.processInfo.memoryUsage.rss : 0;
            result[index].dataValues.pid = it.processInfo.pid;
            result[index].dataValues.vtcState = it.runningState.vtc;
            if (it.unionid) {
                result[index].dataValues.workState = 2;
                result[index].dataValues.usePerson = it.memberInfo.name;
                result[index].dataValues.logLoginTime = it.logLoginTime;
            } else {
                result[index].dataValues.workState = 1;
            }
        }
    });
    // 排序
    result = result.sort((a, b) => {
        return b.dataValues.workState - a.dataValues.workState;
    });
    // 筛选
    if (workStateArr.length !== 0) {
        result = result.filter(items => workStateArr.includes(items.dataValues.workState));
    }
    if (isOpenArr.length !== 0) {
        result = result.filter(items => isOpenArr.includes(String(items.dataValues.isOpen)));
    }
    let processNum = 0, totalRss = 0;
    result.forEach(items => {
        try {
            totalRss += items.dataValues.processInfo.processInfo.memoryUsage.rss;
            processNum++;
        } catch (e) {
            
        }
    });
    const total = result.length;
    // 分页
    result = result.splice(page -1, pageSize);
    return {
        code: 200,
        msg: '',
        data: {
            data: result,
            total,
            id_arr: [],
            totalRss,
            processNum,
        },
    };

    function findTargetProcessBySn(poolInfo, sn) {
        for (let i = 0; i < poolInfo.childProcessData.length; i++) {
            if (poolInfo.childProcessData[i].sn == sn) {
                return poolInfo.childProcessData[i];
            }
        }
        return {};
    }
}

/**
 * 创建实例
 */
this.createSimuInstance = async params => {
    const { serialNo, solution, machineModel, admin_id, versionRem } = params;
    // 判断序列号是否存在控制器档案，商品档案中
    const checkResult = await serviceHomeProducts.checkSnExist(serialNo, true);
    if (checkResult.code === -1) {
        return checkResult;
    }
    const vtcResult = await this.createVtcInstance(params);
    const tarResult = await this.createTarInstance(params);
    await this.createAtsInstance(params);
    if (vtcResult.code === -1) {
        return vtcResult;
    }
    if (tarResult.code === -1) {
        return tarResult;
    }
    // mysql 数据库存一下
    const simuEntity = await SimuProducts.findOne({ where: { serialNo, isdel: 0 } });
    if (!simuEntity) {
        await SimuProducts.create({
            serialNo,
            solution,
            machineModel,
            versionRem,
            spaUrl: CONFIG.staticSimuAddr + '/simu_spa/' + solution + '/index.html',
            album: getModelAlbum(machineModel),
            insert_person: admin_id,
            insert_time: TIME(),
        });
    }
    return { code: 200, msg: '创建成功' };

    function getModelAlbum(machineModel) {
        if (machineModel === 'MtsE45-105') {
            return CONFIG.proxy_protocol + '://' + CONFIG.proxy_host + ':' + CONFIG.proxy_port + '/img/MTS120x90.png';
        } else if (machineModel === 'XGWDW-100S') {
            return CONFIG.proxy_protocol + '://' + CONFIG.proxy_host + ':' + CONFIG.proxy_port + '/img/JNXG120x90.png';
        }
        return '';
    }
}

/**
 * 生成vtc实例
 * (被调用)
 */
this.createVtcInstance = async params => {
    const { serialNo, solution, machineModel, admin_id, versionRem, title } = params;
    const vtcConfigDirName = CONFIG.staticSimuPath + '/simu_factory/' + solution + '/config/wdw.vtc.json';
    const vtcIpDirName = CONFIG.staticSimuPath + '/simu_factory/' + solution + '/model/' + machineModel + '/' + machineModel + '.vtc.ip.json';
    const vtcFileResult = await readFile(vtcConfigDirName);
    const ipFileResult = await readFile(vtcIpDirName);
    if (vtcFileResult.code === -1) {
        return vtcFileResult;
    }
    if (ipFileResult.code === -1) {
        return ipFileResult;
    }
    const vtcConfigObj = JSON.parse(vtcFileResult.data);
    const vtcIpObj = JSON.parse(ipFileResult.data);
    for (const key of Object.keys(vtcConfigObj.parameters)) {
        if (vtcIpObj.hasOwnProperty(key)) {
            vtcConfigObj.parameters[key] = vtcIpObj[key];
        }
    }
    const staffEntity = await Staff.findOne({ where: { user_id: admin_id, isdel: 0 } });
    const memberEntity = await Member.findOne({ where: { open_id: staffEntity.dataValues.open_id } });
    const { unionid } = memberEntity.dataValues;
    const createResult = await serviceHomeVir.createVtcInstance({
        nji: vtcConfigObj,
        versionRem: versionRem ? versionRem : '厂家配置',
        title: title ? title : '厂家配置',
        snArr: [serialNo],
        unionid,
        simu: true,
    });
    return createResult;
}

/**
 * 生成tar实例
 * (被调用)
 */
this.createTarInstance = async params => {
    const { serialNo, solution, machineModel, admin_id, versionRem } = params;
    const tarConfigDirName = CONFIG.staticSimuPath + '/simu_factory/' + solution + '/config/wdw.tar.json';
    const tarIpDirName = CONFIG.staticSimuPath + '/simu_factory/' + solution + '/model/' + machineModel + '/' + machineModel + '.tar.ip.json';
    const tarFileResult = await readFile(tarConfigDirName);
    const ipFileResult = await readFile(tarIpDirName);
    if (tarFileResult.code === -1) {
        return tarFileResult;
    }
    if (ipFileResult.code === -1) {
        return ipFileResult;
    }
    const tarConfigObj = JSON.parse(tarFileResult.data);
    const tarIpObj = JSON.parse(ipFileResult.data);
    // merge
    for (const key of Object.keys(tarConfigObj.parameters)) {
        if (tarIpObj.hasOwnProperty(key)) {
            tarConfigObj.parameters[key] = tarIpObj[key];
        }
    }
    for (const key of Object.keys(tarConfigObj.tags)) {
        if (tarIpObj.hasOwnProperty(key)) {
            const tarValue = tarIpObj[key].replace(/\${\w+}/ig, serialNo);
            tarConfigObj.tags[key] = tarValue;
        }
    }
    // 创建目录，并拷贝一份
    const tempFrameDirName = CONFIG.staticSimuPath + '/simu_factory/' + solution + '/model/' + machineModel + '/' + machineModel + '_frame.png';
    const tempBeamDirName = CONFIG.staticSimuPath + '/simu_factory/' + solution + '/model/' + machineModel + '/' + machineModel + '_beam.png';
    const targetFrameDirName = CONFIG.staticSimuPath + '/simu_image_instance/' + serialNo + '/' + machineModel + '_frame.png';
    const targetBeamDirName = CONFIG.staticSimuPath + '/simu_image_instance/' + serialNo + '/' + machineModel + '_beam.png';
    await createDirectory(serialNo, tempFrameDirName, targetFrameDirName);
    await createDirectory(serialNo, tempBeamDirName, targetBeamDirName);
    const staffEntity = await Staff.findOne({ where: { user_id: admin_id, isdel: 0 } });
    const memberEntity = await Member.findOne({ where: { open_id: staffEntity.dataValues.open_id } });
    const { unionid } = memberEntity.dataValues;
    const createResult = await createInstance({
        tar: tarConfigObj,
        versionRem: versionRem ? versionRem : '厂家配置',
        snArr: [serialNo],
        unionid,
    });
    return createResult;

    async function createInstance(params) {
        const { tar, versionRem, snArr, unionid } = params;
        let createResult;
        await bluebird.map(snArr, async items => {
            const serialNo = items;
            await new Promise(resolve => {
                request({
                    url: CONFIG.actionApiAddr + '/tar/instance/' + serialNo,
                    method: 'POST',
                    headers: {
                        primaryunionid: unionid,
                    },
                    form: {
                        info: {
                            versionRem: versionRem ? versionRem : '厂家配置',
                            saveTime: moment().format('YYYY/M/D HH:mm:ss'),
                            uploadFrom: '网页',
                        },
                        config: JSON.stringify(tar),
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

    async function createDirectory(serialNo, tempDirName, targetDirName) {
        const imageDirName = CONFIG.staticSimuPath + '/simu_image_instance/' + serialNo;
        const exists = await new Promise(resolve => {
            fs.exists(imageDirName, exists => resolve(exists));
        });
        if (!exists) {
            await new Promise(resolve => {
                fs.mkdir(imageDirName, () => resolve());
            });
        }
        await new Promise(resolve => {
            fs.copyFile(tempDirName, targetDirName, () => resolve());
        });
    }
}

/**
 * 生成ats实例
 * (被调用)
 */
this.createAtsInstance = async params => {
    const { serialNo, solution, admin_id, versionRem } = params;
    let { data: atsList } = await this.getAtsListBySolution({ solution });
    atsList = atsList.filter(items => Object.values(items)[0] !== '');
    await bluebird.map(atsList, async items => {
        const atsName = Object.keys(items)[0].split('.ats.json')[0];
        const ats = Object.values(items)[0];
        await createInstance({
            atsName,
            ats,
            versionRem: versionRem ? versionRem : '厂家配置',
            snArr: [serialNo],
        });
    }, { concurrency: 1 });
    return {
        code: 200,
        msg: '创建成功',
    };

    async function createInstance(params) {
        const { atsName, ats, versionRem, snArr } = params;
        const staffEntity = await Staff.findOne({ where: { user_id: admin_id, isdel: 0 } });
        const memberEntity = await Member.findOne({ where: { open_id: staffEntity.dataValues.open_id } });
        const { unionid } = memberEntity.dataValues;
        let createResult;
        await bluebird.map(snArr, async items => {
            const serialNo = items;
            await new Promise(resolve => {
                request({
                    url: CONFIG.actionApiAddr + '/ats/instance/' + serialNo + '/' + atsName,
                    method: 'POST',
                    headers: {
                        primaryunionid: unionid,
                    },
                    form: {
                        info: {
                            versionRem: versionRem ? versionRem : '厂家配置',
                            uploadFrom: '网页',
                            simu: true,
                        },
                        config: ats,
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
        }, { concurrency: 1 });
        return createResult;
    }
}