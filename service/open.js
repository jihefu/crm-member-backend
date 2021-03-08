const serviceRepair = require('./repair');
const serviceVirCard = require('./service');
const serviceContract = require('./contract');
const Customers = require('../dao').Customers;
const EndUser = require('../dao').EndUser;
const Staff = require('../dao').Staff;
const Member = require('../dao').Member;
const homeFileSys = require('./homeFileSys');
const homeProducts = require('./homeProducts');
const PvUvRecord = require('../dao').PvUvRecord;
const { redisClient } = require('./redis');

// PV UV 统计
exports.recordPVAndUV = async params => {
    const { type, num } = params;
    const date = DATETIME();
    let entity;
    await PvUvRecord.findOrCreate({ where: { date }, default: { date }}).spread(result => {
        entity = result;
    });
    if (type === 'web') {
        await entity.increment('web_pv');
    } else if (type === 'wx') {
        await entity.update({
            wx_uv: num,
        });
    }
    return true;
}

exports.wxPlatReceiveTicket = async params => {
    redisClient.set('open_wx_ticket', JSON.stringify(params));
    return true;
}

exports.wxGetTicket = async () => {
    let result = await new Promise(resolve => {
        redisClient.get('open_wx_ticket', (err, data) => {
            resolve(data);
        });
    });
    try {
        result = JSON.parse(result);
    } catch (e) {
        
    }
    return {
        code: 200,
        msg: '获取成功',
        data: result,
    };
}

exports.checkIsStaff = async open_id => {
    const result = await Staff.findOne({ where: { open_id, isdel: 0, on_job: 1 } });
    if (result) {
        return true;
    }
    return false;
}

exports.refreshSideMenuAuth = async userCodeArr => {

    const resArr = [22];

    // 判断维修
    if (userCodeArr.indexOf(10000) !== -1) return {
        code: 200,
        msg: '',
        data: resArr,
    };
    resArr.push(20);
    if (userCodeArr.indexOf(10001) !== -1 || userCodeArr.indexOf(10004) !== -1 || userCodeArr.indexOf(10005) !== -1 || userCodeArr.indexOf(10007) !== -1 || userCodeArr.indexOf(10008) !== -1) {
        resArr.push(23);
    }
    if (!userCodeArr.includes(10002)) {
        resArr.push(25);
    }
    return {
        code: 200,
        msg: '',
        data: resArr,
    };
}

exports.getRepair = async params => {
    const { page, pageSize, keywords, user_code_arr, company, unionid, repairId } = params;
    const result = await new Promise(async resolve => {
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
        let cn_abb;
        if (customerEntity) {
            cn_abb = customerEntity.dataValues.cn_abb;
        } else {
            const endUserEntity = await EndUser.findOne({ where: { user_name: company, isdel: 0 } });
            cn_abb = endUserEntity ? endUserEntity.dataValues.user_name : '';
        }
        serviceRepair.getList({
            page: Number(page),
            num: Number(pageSize),
            keywords,
            filter: '全部',
            code: user_code_arr,
            cn_abb,
            unionid,
            repairId,
        }, result => resolve(result));
    });
    result.data.album_arr.forEach((items, index) => {
        if (!items) result.data.album_arr[index] = '/no_img_small.png';
        result.data.album_arr[index] = CONFIG.proxy_protocol + '://' + CONFIG.proxy_host + ':' + CONFIG.proxy_port + '/img' + result.data.album_arr[index];
    });
    result.data.res_arr.forEach((items, index) => {
        result.data.res_arr[index].album = result.data.album_arr[index];
        result.data.res_arr[index].id = items.repair_contractno;
    });
    result.data = result.data.res_arr;
    return result;
}

exports.repairTakeConfirm = async params => {
    const { unionid, no } = params;
    const memberEntity = await Member.findOne({ where: { unionid } });
    const { name } = memberEntity.dataValues;
    const result = await new Promise(resolve => {
        serviceRepair.takeGoods({
            no: no,
            name: name
        }, function(result) {
            resolve(result);
        });
    });
    return result;
}

exports.getRepairInfo = async params => {
    const { repair_contractno, user_code_arr, company, unionid, repairId } = params;
    const result = await new Promise(async resolve => {
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
        let cn_abb;
        if (customerEntity) {
            cn_abb = customerEntity.dataValues.cn_abb;
        } else {
            cn_abb = company;
            // const endUserEntity = await EndUser.findOne({ where: { user_name: company, isdel: 0 } });
            // cn_abb = endUserEntity ? endUserEntity.dataValues.user_name : '';
        }
        serviceRepair.getInfo({
            repair_contractno,
            code: user_code_arr,
            cn_abb,
            unionid,
            repairId,
        }, result => resolve(result));
    });
    return result;
}

exports.getVirCard = async params => {
    const { page, pageSize, keywords, user_code_arr, user_id_arr } = params;
    const result = await new Promise(async resolve => {
        serviceVirCard.productList({
            page: Number(page),
            pageSize: Number(pageSize),
            keywords,
            code: user_code_arr,
            user_id_arr,
        }, result => resolve(result));
    });
    result.res_arr.forEach((items, index) => {
        result.res_arr[index].id = items.serialNo;
        let albumStr = CONFIG.proxy_protocol + '://' + CONFIG.proxy_host + ':' + CONFIG.proxy_port;
        if (items.model === 'V884') {
            albumStr += '/img/small_884.png';
        } else if (items.model === 'V881') {
            albumStr += '/img/small_881.png';
        } else if (items.model === 'V802') {
            albumStr += '/img/small_802.png';
        } else if (items.model === 'V801') {
            albumStr += '/img/small_801.png';
        } else if (items.model === 'V800') {
            albumStr += '/img/small_800.png';
        } else if (items.model === 'D700') {
            albumStr += '/img/small_700.png';
        } else if (items.model === 'D900') {
            albumStr += '/img/small_900.png';
        } else if (items.model === 'D910') {
            albumStr += '/img/small_910.png';
        } else if (items.model === 'D921') {
            albumStr += '/img/small_921.png';
        } else {
            albumStr += '/img/small_ad800.png';
        }
        result.res_arr[index].album = albumStr;
    });
    const resData = {
        code: 200,
        msg: '',
        data: result.res_arr,
    };
    return resData;
}

exports.getVirCardInfo = async params => {
    const { sn, user_code_arr, user_id_arr, unionid } = params;
    const result = await new Promise(async resolve => {
        serviceVirCard.productInfo({
            sn,
            code: user_code_arr,
            user_id_arr,
            unionid,
            needRegHistory: true,
        }, result => resolve(result));
    });
    const { type, resData } = result;
    if (!resData) {
        return {
            code: -1,
            msg: '不存在序列号' + sn,
        };
    }
    const resArr = splitType(result, false);
    return {
        code: 200,
        msg: '',
        data: resArr,
    };

    function splitType(result, isOldInterface) {
        if (isOldInterface) {
            const resArr = [];
            const labelObj = result.resData.label;
            for (const key in labelObj) {
                resArr.push({
                    column_name: key,
                    column_comment: labelObj[key].name,
                    val: labelObj[key].val,
                });
            }
            return resArr;
        }
        const typeObj = {
            productInfo: [],
            hardInfo: [],
            softInfo: result.resData.data.softInfo,
            contractInfo: [],
            regHistoryList: result.resData.data.regHistoryList,
            warrantyInfo: [],
            resaleList: result.resData.data.resaleList,
            repairList: result.resData.data.repairList,
            tradingRecordList: result.resData.data.tradingRecordList,
        };
        const labelObj = result.resData.label;
        for (const key in labelObj) {
            const o = { column_name: key, column_comment: labelObj[key].name, val: labelObj[key].val };
            if (['contract_company', 'isDirectSale','contract_no','sign_time','purchase','delivery_state','dealer','salesman'].includes(key)) {
                if (key === 'dealer' && !labelObj[key].val) {
                    
                } else {
                    typeObj.contractInfo.push(o);
                }
            } else if (['addr','bind_unionid','insert_date','valid_date'].includes(key)) {
                typeObj.warrantyInfo.push(o);
            } else if (['model','serialNo','batch','inputDate','maker','tester','isTest','isPass','notPassRem','testTime', 'status', 'storage','chnlNum','caliCoeff','remark'].includes(key)) {
                typeObj.productInfo.push(o);
            } else {
                typeObj.hardInfo.push(o);
            }
        }
        if (type === 'visitor') {
            delete typeObj.contractInfo;
        }
        // if (type !== 'staff') {
        //     delete typeObj.warrantyInfo;
        // }
        if (type !== 'staff' && type !== 'customers') {
            delete typeObj.regHistoryList;
        }
        if (typeObj.warrantyInfo.length === 0) {
            typeObj.warrantyInfo = {};
        }
        return typeObj;
    }
}

exports.getContract = async params => {
    const { page, pageSize, keywords, user_code_arr, company, unionid } = params;
    const abb = await new Promise(async resolve => {
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
        const abb = customerEntity ? customerEntity.dataValues.abb : '';
        resolve(abb);
    });
    const result = await new Promise(async resolve => {
        serviceContract.getList({
            page: Number(page),
            num: Number(pageSize),
            keywords,
            code: user_code_arr,
            abb,
            unionid,
        }, result => resolve(result));
    });
    return result;
}

exports.getContractInfo = async params => {
    const { contract_no, user_code_arr, company, unionid } = params;
    const abb = await new Promise(async resolve => {
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
        const abb = customerEntity ? customerEntity.dataValues.abb : '';
        resolve(abb);
    });
    const result = await serviceContract.head({
        contract_no,
        code: user_code_arr,
        abb,
        unionid,
        needOtherInfo: true,
    });
    return {
        code: 200,
        msg: '',
        data: result,
    };
}

exports.contractTakeConfirm = async params => {
    const { unionid, no } = params;
    const memberEntity = await Member.findOne({ where: { unionid } });
    const { name } = memberEntity.dataValues;
    const result = await new Promise(resolve => {
        serviceContract.takeGoods({
            contract_no: no,
            name,
        }, function(result){
            resolve(result);
        });
    });
    return result;
}

// 推荐阅读
exports.recommendReading = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const resArr = await getListByReadingOrActivity({
        page,
        pageSize,
        id: CONFIG.recommendReadingId,
    });
    return {
        code: 200,
        msg: '',
        data: resArr,
    };
}

async function getListByReadingOrActivity(params) {
    const { page, pageSize, id } = params;
    let fileList = await new Promise(async resolve => {
        homeFileSys.getFileList({
            id,
            showSearch: false,
            keywords: '',
            showAll: 0,
            showMark: 0,
            showSelf: 0,
            showByCreate: 1,
            admin_id: 1702,
        }, result => {
            resolve(result.data);
        });
    });
    const resArr = [];
    const _p = [];
    fileList = fileList.splice((page - 1) * pageSize, pageSize);
    fileList.forEach((items, index) => {
        _p[index] = new Promise(async resolve => {
            const obj = {
                id: items.id,
                title: items.name,
            };
            const i = index;
            homeFileSys.getFileContent({
                id: items.id,
            }, result => {
                try {
                    obj.content = result.data[0].content;
                } catch (e) {
                    obj.content = {};
                }
                resArr[i] = obj;
                resolve();
            });
        });
    });
    await Promise.all(_p);
    return resArr;
}

// 近期活动
this.recentActivity = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const resArr = await getListByReadingOrActivity({
        page,
        pageSize,
        id: CONFIG.recentActivityId,
    });
    return {
        code: 200,
        msg: '',
        data: resArr,
    };
}

// 首页文章推荐
this.indexArticle = async () => {
    const readingResult = await homeFileSys.targetTableFileList(CONFIG.recommendReadingId);
    const activityResult = await homeFileSys.targetTableFileList(CONFIG.recentActivityId);
    const resData = {
        title: '',
        content: {},
        href: '',
    };
    if (readingResult && activityResult) {
        if (Date.parse(readingResult.updateTime) > Date.parse(activityResult.updateTime)) {
            resData.title = readingResult.name;
            resData.content = readingResult.content;
            resData.href = '/home/recommendReading';
        } else {
            resData.title = activityResult.name;
            resData.content = activityResult.content;
            resData.href = '/home/activity';
        }
    } else if (readingResult) {
        resData.title = readingResult.name;
        resData.content = readingResult.content;
        resData.href = '/home/recommendReading';
    } else if (activityResult) {
        resData.title = activityResult.name;
        resData.content = activityResult.content;
        resData.href = '/home/activity';
    }
    return {
        code: 200,
        msg: '',
        data: resData,
    };
}