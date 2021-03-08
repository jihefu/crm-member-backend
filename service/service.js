var express = require('express');
var url = require('url');
var path = require('path');
const crypto = require('crypto');
var request = require('request');
var fs = require('fs');
var base = require('./base');
var ucode = require('../lib/ucode.node');
var common = require('./common');
var sequelize = require('../dao').sequelize;
var Member = require('../dao').Member;
var Staff = require('../dao').Staff;
var Customers = require('../dao').Customers;
var Users = require('../dao').Users;
var Products = require('../dao').Products;
var RegEvent = require('../dao').RegEvent;
var AppNameLib = require('../dao').AppNameLib;
var ItemScore = require('../dao').ItemScore;
var MemberScore = require('../dao').MemberScore;
var MemberSignScore = require('../dao').MemberSignScore;
var BaseEvent = require('../dao').BaseEvent;
// const sofaActionClient = require('../service/sofaActionClient');
var VirWarranty = require('../dao').VirWarranty;
const ContractsHead = require('../dao').ContractsHead;
const homeProducts = require('./homeProducts');
const cusClientNotiMsg = require('./cusClientNotiMsg');
const Affair = require('../dao').Affair;
const { WxUvCalcul } = require('./redis');
const VerUnit = require('../dao').VerUnit;
const homeWallet = require('./homeWallet');
const sendMQ = require('./rabbitmq').sendMQ;
const bluebird = require('bluebird');
let serviceMember;

/**
 * 	open_id检查
 */
this.checkOpenId = function(params, cb) {
    serviceMember = require('./member');
    const appid = CONFIG.appid;
    const appsecret = CONFIG.appsecret;
    const redirect = encodeURIComponent(CONFIG.wxRedirectUrl);
    var open_id = params.open_id;
    var code = params.code;
    var originalUrl = params.originalUrl.split('?')[0];
    var urlParams = params.urlParams;
    var post = params.post;
    if (open_id == undefined) {
        if (code == undefined) {
            var str = '?';
            for (var key in urlParams) {
                str += key + '=' + urlParams[key] + '$';
            }
            str = str.slice(0, str.length - 1);
            if (post) str = '';
            var state = CONFIG.proxy_protocol + '://' + CONFIG.proxy_host + ':' + CONFIG.proxy_port + originalUrl + str;
            // var state = ROUTER()+originalUrl+str;
            var str = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + appid + "&redirect_uri=" + redirect + "&response_type=code&scope=snsapi_userinfo&state=" + state + "#wechat_redirect";
            cb({
                code: -10002,
                msg: '',
                data: str
            });
        } else {
            getOpenIdByCode(code, async function(bodys) {
                if (bodys == -1) {
                    cb({
                        code: -10001,
                        msg: 'code过期',
                        data: ''
                    });
                } else {
                    //获得了open_id
                    await WxUvCalcul.AddUser(bodys.unionid);
                    // 刷新最后登陆时间，更新活跃度
                    serviceMember.refreshLastLoginTime({ unionid: bodys.unionid });
                    serviceMember.refreshActiveDegree({ unionid: bodys.unionid });
                    cb({
                        code: 100,
                        msg: '',
                        data: bodys
                    });
                }
            });
        }
    } else {
        cb({
            code: 200,
            msg: '',
            data: ''
        });
    }

    function getOpenIdByCode(code, cb) {
        var cdurl = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + appid + "&secret=" + appsecret + "&code=" + code + "&grant_type=authorization_code";
        request.get(cdurl, async function(err, response, body) {
            var bodys = JSON.parse(body);
            if (bodys.errcode) {
                cb(-1);
            } else {
                // 查询是否有绑定id
                let open_id, unionid, info = {};
                const result = await Member.findOne({
                    where: {
                        open_id: bodys.openid,
                    }
                });
                if (result && result.dataValues.bind_id) {
                    open_id = result.dataValues.bind_id;
                    unionid = result.dataValues.unionid;
                    info = {
                        openid: open_id,
                        unionid
                    };
                } else {
                    open_id = bodys.openid;
                    unionid = bodys.unionid;
                    info = bodys;
                }
                cb({
                    open_id,
                    unionid,
                    info,
                });
            }
        });
    }
}

/**
 *  获取微信用户的个人信息和unionid
 */
this.getWxUserInfo = async (params, cb) => {
    const { open_id } = params;
    let access_token = params.access_token;
    if (!access_token) {
        access_token = await new Promise(resolve => {
            request.get('https://wx.langjie.com/wx/getToken', (err, response, body) => {
                body = JSON.parse(body);
                let access_token;
                try {
                    access_token = body.data.access_token;
                } catch (e) {
                    access_token = body.access_token;
                }
                resolve(access_token);
            });
        });
    }
    const result = await new Promise(resolve => {
        request.get('https://wx.langjie.com/wx/getUserInfo?access_token=' + access_token + '&openid=' + open_id, (err, response, body) => {
            body = JSON.parse(body);
            if (body.data) body = body.data;
            resolve(body);
        });
    });
    if (cb) {
        cb(result);
    }
    return result;
}

/**
 *  往服务号发送消息
 */
this.sendMsgToWxServer = (params, cb) => {
    request.post({
        url: 'https://wx.langjie.com/wx/sendMsg',
        headers: {
            "content-type": "application/json",
        },
    }, (err, response, body) => {
        if (body) {
            body = JSON.parse(body);
            cb(body);
        }
    }).form(params);
}

// 访问者身份确认
this.checkPerson = async open_id => {
    // 是否会员
    const memberEntity = await Member.findOne({ where: { open_id } });
    if (!memberEntity) {
        return { code: [10000], msg: '非会员', data: {}};
    }
    // 是否员工
    const staffEntity = await Staff.findOne({ where: { isdel: 0, on_job: 1, open_id } });
    if (staffEntity) {
        return { code: [10001], msg: '员工', data: { memberInfo: memberEntity.dataValues, adminInfo: staffEntity.dataValues }};
    }
    const { user_id: uid } = memberEntity.dataValues;
    // 是否代表个人
    if (memberEntity.dataValues.checked == 0) {
        return { code: [10002], msg: '会员未认证', data: { memberInfo: memberEntity.dataValues, user_id_arr: [Number(uid)] }};
    }
    // 是否客户
    const { company, name } = memberEntity.dataValues;
    const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
    if (!customerEntity) {
        const verUnitEntity = await VerUnit.findOne({ where: { company, isdel: 0 } });
        const { user_id } = verUnitEntity.dataValues;
        const user_id_arr = user_id ? [Number(user_id)] : [];
        return { code: [10010], msg: '非客户', data: { memberInfo: memberEntity.dataValues, user_id_arr }};
    }
    // 客户职位细分
    const { legal_person, reg_person, partner, finance, purchase, user_id } = customerEntity.dataValues;
    const getPropArr = (_arr) => {
        let arr;
        try {
            arr = _arr.split(',').filter(items => items);
        } catch (e) {
            arr = [];
        }
        return arr;
    }
    const partnerArr = getPropArr(partner);
    const regPersonArr = getPropArr(reg_person);
    const financeArr = getPropArr(finance);
    const purchaseArr = getPropArr(purchase);
    const resArr = [];
    //验证法人
    if (legal_person == name) resArr.push(10004);

    //验证合伙人
    if (partnerArr.indexOf(name) != -1) resArr.push(10005);

    //验证注册人
    if (regPersonArr.indexOf(name) != -1) resArr.push(10006);

    //验证财务
    if (financeArr.indexOf(name) != -1) resArr.push(10007);

    //验证采购
    if (purchaseArr.indexOf(name) != -1) resArr.push(10008);

    //其他职位
    if (resArr.length === 0) resArr.push(10009);

    return {
        code: resArr,
        msg: '客户',
        data: {
            memberInfo: memberEntity.dataValues,
            user_id_arr: [Number(user_id)],
        },
    };
}

// 是否具备拥有权
this.checkOwnerPower = async (code, user_id_arr, sn) => {
    const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    if (!productEntity) {
        return { code: -1, msg: '不存在该卡' };
    }
    const { dealer } = productEntity.dataValues;
    if (code.includes(10000)) {         // 非会员
        return false;
    } else if (code.includes(10001)) {  // 员工
        return true;
    } else {                            // 代表背后公司
        if (user_id_arr.includes(Number(dealer))) {
            return true;
        }
    }
    return false;
}

// 是否具备注册权
this.checkRegPower = async (code, user_id_arr, sn) => {
    const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    if (!productEntity) {
        return { code: -1, msg: '不存在该卡' };
    }
    const { dealer } = productEntity.dataValues;
    if (code.includes(10001)) {
        return true;
    }
    const { hasRegPower } = await Customers.findOne({ attributes: ['hasRegPower'], where: { isdel: 0, user_id: dealer } });
    if (hasRegPower == 0) {
        return false;
    }
    if (user_id_arr.includes(Number(dealer))) {
        if (code.includes(10004) || code.includes(10005) || code.includes(10006)) {
            return true;
        }
    }
    return false;
}

/**
 * 	产品列表
 *  200228修改
 *  200723修改
 */
this.productList = function(params, cb) {
    var page = params.page ? params.page : 1;
    var user_id_arr = params.user_id_arr;
    var code = params.code;
    var pageSize = params.pageSize ? Number(params.pageSize) : 10;
    var keywords = params.keywords ? params.keywords : '';
    //员工
    const staffList = async () => {
        const list = await Products.findAll({
            attributes: ['serialNo', 'model', 'validTime'],
            where: {
                isdel: 0,
                $or: {
                    serialNo: { $like: '%'+keywords+'%' },
                    machineNo: { $like: '%'+keywords+'%' },
                },
            },
            order: [['inputDate', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });
        const resArr = list.map(items => items.dataValues);
        cb({
            type: 'staff',
            res_arr: resArr,
        });    
    }
    //客户
    const customersList = async () => {
        const list = await Products.findAll({
            attributes: ['serialNo', 'model', 'validTime'],
            where: {
                isdel: 0,
                dealer: { $in: user_id_arr },
                $or: {
                    serialNo: { $like: '%'+keywords+'%' },
                    machineNo: { $like: '%'+keywords+'%' },
                },
            },
            order: [['inputDate', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });
        const resArr = list.map(items => items.dataValues);
        cb({
            type: 'customers',
            res_arr: resArr,
        });
    }
    //随机三张
    const otherList = async () => {
        const params = {
            attributes: ['serialNo', 'model', 'validTime'],
            where: { isdel: 0 },
            order: [['inputDate', 'DESC']],
            limit: 100,
            offset: 0,
        };
        const res_arr = [];
        if (keywords == '') {
            const list = await Products.findAll(params);
            for (let i = 0; i < 3; i++) {
                const random_num = Math.floor(Math.random() * 100);
                res_arr.push(list[random_num].dataValues);
            }
        } else {
            params.where.serialNo = keywords;
            params.limit = 3;
            const list = await Products.findAll(params);
            list.forEach(items => res_arr.push(items.dataValues));
        }
        cb({
            type: 'visitor',
            res_arr,
        });
    }

    if (code.includes(10001)) {
        staffList();
    } else if (code.includes(10000)) {
        otherList();
    } else {
        customersList();
    }
}

this.productInfoLabel = async(sn, needRegHistory, codeArr, user_id_arr) => {
    const labelObj = {
        // 出厂
        model: {
            name: '型号',
        },
        serialNo: {
            name: '序列号',
        },
        batch: {
            name: '批次',
        },
        inputDate: {
            name: '组装日期',
        },
        maker: {
            name: '组装人',
        },
        tester: {
            name: '测试人',
        },
        isTest: {
            name: '是否测试',
        },
        isPass: {
            name: '是否合格',
        },
        notPassRem: {
            name: '不合格备注',
        },
        testTime: {
            name: '测试日期',
        },
        status: {
            name: '产品状态',
        },
        scrappedRem: {
            name: '报废说明',
        },
        storage: {
            name: '存放地',
        },
        chnlNum: {
            name: '通道数',
        },
        caliCoeff: {
            name: '标比',
        },
        remark: {
            name: '附注',
        },
        // 硬件配置
        modelCode: {
            name: '型号编码',
        },
        fwVer: {
            name: '固件版本',
        },
        authType: {
            name: '规格',
        },
        oemUser: {
            name: '用户软件许可',
        },
        VBGN: {
            name: '名义试用起始',
        },
        VEND: {
            name: '名义试用终止',
        },
        machineNo: {
            name: '机器码',
        },
        latestRegNo: {
            name: '注册码',
        },
        validTime: {
            name: '注册状态',
        },
        ad2Mode: {
            name: 'AD采集模式',
        },
        pulseMode: {
            name: 'PM脉冲模式',
        },
        vibFreq: {
            name: 'DA伺服颤振频率',
        },
        vibAmp: {
            name: 'DA伺服颤振幅值',
        },
        SSI_MODE: {
            name: 'DIO模式',
        },
        SPWM_AC_AMP: {
            name: 'SPWM交流幅值',
        },
        HOURS: {
            name: '已用小时数',
        },
        EMP_NO: {
            name: '最近操作者',
        },
        max_count: {
            name: '最多使用次数',
        },
        user_count: {
            name: '已使用次数',
        },
        GP0: {
            name: '参数0',
        },
        GP1: {
            name: '参数1',
        },
        GP2: {
            name: '参数2',
        },
        GP3: {
            name: '参数3',
        },
        GP4: {
            name: '参数4',
        },
        GP5: {
            name: '参数5',
        },
        // 订单
        isDirectSale: {
            name: '是否直销',
        },
        contract_no: {
            name: '合同号',
        },
        contract_company: {
            name: '购方',
        },
        purchase: {
            name: '购方采购人',
        },
        salesman: {
            name: '业务员',
        },
        sign_time: {
            name: '签订时间',
        },
        delivery_state: {
            name: '合同状态',
        },
        packingList: {
            name: '装箱单',
        },
        dealer: {
            name: '当前拥有者',
        },
        // 电子保修单
        addr: {
            name: '安装地点',
        },
        bind_unionid: {
            name: '安装人',
        },
        insert_date: {
            name: '安装日期',
        },
        valid_date: {
            name: '有效保修日期',
        },
        repairList: {
            name: '维修列表',
        },
        // 注册历史
        regHistoryList: {
            name: '注册历史',
        },
    };
    let result = await homeProducts.showBySn(sn, needRegHistory);
    result = appSplit();
    toLabel();

    let needDelKey = [];

    if (codeArr.includes(10001)) {
        // 员工
    } else {
        // 需要身份权限
        // 代表公司或自己拥有
            // 注册权       1
            // 无注册权     2
        // 什么都不是       3
        needDelKey = [...needDelKey, 'storage', 'scrappedRem'];
        const ownerPower = await this.checkOwnerPower(codeArr, user_id_arr, sn);
        const regPower = await this.checkRegPower(codeArr, user_id_arr, sn);
        if (ownerPower) {
            if (regPower) {
                
            } else {
                needDelKey = [...needDelKey, 'EMP_NO', 'VBGN', 'VEND', 'machineNo', 'latestRegNo', 'HOURS', 'regAuth', 'remark'];
            }
        } else {
            needDelKey = [...needDelKey, 'validTime', 'EMP_NO', 'VBGN', 'VEND', 'machineNo', 'latestRegNo', 'HOURS', 'regAuth', 'remark', 'isDirectSale', 'contract_no', 'contract_company', 'dealer', 'purchase', 'salesman', 'sign_time', 'delivery_state'];
        }
    }
    needDelKey.forEach(items => {
        delete result[items];
        delete labelObj[items];
    });

    return {
        data: result,
        label: labelObj,
    };

    function appSplit() {
        const itemObj = {};
        const itemArr = ['regAppName', 'appValidTime', 'appRegCode', 'appRegAuth'];
        let len = 0;
        try {
            const arr = result.data.dataValues[itemArr[0]].split(',').filter(items => items);
            len = arr.length;
        } catch (e) {

        }
        for (let i = 0; i < len; i++) {
            for (let j = 0; j < itemArr.length; j++) {
                let arr = [];
                try {
                    arr = result.data.dataValues[itemArr[j]].split(',').filter(items => items);
                } catch (e) {
                    arr = [];
                }
                itemObj[itemArr[j] + i] = arr[i];
            }
        }
        delete result.data.dataValues.regAppName;
        delete result.data.dataValues.appValidTime;
        delete result.data.dataValues.appRegCode;
        delete result.data.dataValues.appRegAuth;
        result = {...result.data.dataValues, ...itemObj };
        return result;
    }

    function toLabel() {
        for (const key in labelObj) {
            labelObj[key].val = result[key] == undefined ? '' : result[key];
        }
        labelObj['isTest'].val = labelObj['isTest'].val == 1 ? '是' : '否';
        labelObj['isPass'].val = labelObj['isPass'].val == 1 ? '是' : '否';
        labelObj['testTime'].val = labelObj['testTime'].val ? DATETIME(labelObj['testTime'].val) : '';
        labelObj['validTime'].val = labelObj['validTime'].val == '0' ? '永久注册' : labelObj['validTime'].val;
        labelObj['isDirectSale'].val = labelObj['isDirectSale'].val == 0 ? '否' : '是';

        delete labelObj['packingList'];
        delete labelObj['regHistoryList'];
        delete labelObj['repairList'];
        if (result.isTest == 0) {
            delete labelObj['isPass'];
            delete labelObj['notPassRem'];
        } else {
            if (result.isPass == 1) {
                delete labelObj['notPassRem'];
            }
        }
        if (!result.contract_no) {
            delete labelObj['contract_no'];
            delete labelObj['contract_company'];
            delete labelObj['isDirectSale'];
            // if (!labelObj['dealer'].val) delete labelObj['dealer'];
            delete labelObj['purchase'];
            delete labelObj['salesman'];
            delete labelObj['sign_time'];
            delete labelObj['delivery_state'];
        }
        if (!result.bind_unionid) {
            delete labelObj['bind_unionid'];
            delete labelObj['insert_date'];
            delete labelObj['valid_date'];
            delete labelObj['addr'];
        }
        if (!/^D/.test(result.model)) {
            // 威程
            delete labelObj['max_count'];
            delete labelObj['user_count'];
            delete labelObj['GP0'];
            delete labelObj['GP1'];
            delete labelObj['GP2'];
            delete labelObj['GP3'];
            delete labelObj['GP4'];
            delete labelObj['GP5'];
        } else {
            // 代龙
            delete labelObj['VBGN'];
            delete labelObj['VEND'];
            delete labelObj['machineNo'];
            delete labelObj['latestRegNo'];
            delete labelObj['validTime'];
            delete labelObj['ad2Mode'];
            delete labelObj['pulseMode'];
            delete labelObj['vibFreq'];
            delete labelObj['vibAmp'];
            delete labelObj['SSI_MODE'];
            delete labelObj['SPWM_AC_AMP'];
            delete labelObj['HOURS'];
            delete labelObj['EMP_NO'];
        }
        if (result.status !== '报废') {
            delete labelObj['scrappedRem'];
        }
    }
}

/**
 * 	产品详情
 * 	200228修改
 *  20200724
 */
this.productInfo = async function(params, cb) {
    var sn = params.sn;
    var user_id_arr = params.user_id_arr;
    var code = params.code;
    var attributes = { exclude: ['isdel', 'state', 'type', 'tongdao'] };
    const result = await Products.findOne({ attributes, where: {
        serialNo: sn,
        isdel: 0,
    }});
    if (!result) {
        cb({
            resData: null,
        });
        return;
    }
    const needRegHistory = params.needRegHistory ? true : false;
    const res = await this.productInfoLabel(sn, needRegHistory, code, user_id_arr);
    const ownerPower = await this.checkOwnerPower(code, user_id_arr, sn);
    const regPower = await this.checkRegPower(code, user_id_arr, sn);
    let type;
    if (code.includes(10001)) {
        type = 'staff';
    } else {
        if (ownerPower) {
            if (regPower) {
                type = 'customers';
            } else {
                type = 'otherCustomers';
            }
        } else {
            type = 'visitor';
        }
    }
    cb({
        type,
        resData: res,
    });
}

/**
 * 代龙产品详情
 * 20200724
 */
exports.dynaProductInfo = async params => {
    const sn = params.sn;
    const user_id_arr = params.user_id_arr;
    const code = params.code;
    const result = await Products.findOne({ where: {
        serialNo: sn,
        isdel: 0,
    }});
    if (!result) {
        return({
            resData: null,
        });
    }
    const res = await this.productInfoLabel(sn, false, code, user_id_arr);
    const ownerPower = await this.checkOwnerPower(code, user_id_arr, sn);
    const regPower = await this.checkRegPower(code, user_id_arr, sn);
    let type;
    if (code.includes(10001)) {
        type = 'staff';
    } else {
        if (ownerPower) {
            if (regPower) {
                type = 'customers';
            } else {
                type = 'otherCustomers';
            }
        } else {
            type = 'visitor';
        }
    }
    return({
        type,
        resData: res,
    });
}

exports.searchInfoBySn = async sn => {
    const result = await Products.findOne({
        where: {
            isdel: 0,
            serialNo: sn,
        },
    });
    return result;
}

/**
 * 判断是否员工并且卡已经存在
 */
exports.checkIsStaffAndCardExist = async params => {
    const { code, sn } = params;
    if (code.indexOf(10001) != -1) {
        const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
        if (productEntity) {
            return true;
        }
    }
    return false;
}

/**
 * 	威程卡扫码录入
 */
this.postInfo = function(params, cb) {
    var param = params.param;
    var admin_id = params.admin_id;
    var sn = param.SN;
    var code = params.code;
    if (code.indexOf(10001) != -1) {
        var res_obj = {};
        var from_arr = ['SN', 'AD_MODE', 'PULSE_MODE', 'DA_VIB_FREQ', 'DA_VIB_AMP', 'SPWM_AC_AMP', 'SSI_MODE', 'HOURS', 'EMP_NO', 'TYPE', 'USER', 'VBGN', 'VEND', 'REGCODE', 'MID', 'MODEL', 'VER'];
        var to_arr = ['serialNo', 'ad2Mode', 'pulseMode', 'vibFreq', 'vibAMP', 'SPWM_AC_AMP', 'SSI_MODE', 'HOURS', 'EMP_NO', 'authType', 'oemUser', 'VBGN', 'VEND', 'latestRegNo', 'machineNo', 'model', 'fwVer'];
        // var from_arr = ['SN','DA_VIB_FREQ','DA_VIB_AMP','MID','AD_MODE','PULSE_MODE','TYPE','USER','REGCODE','VER','MODEL'];
        // var to_arr = ['serialNo','vibFreq','vibAMP','machineNo','ad2Mode','pulseMode','authType','oemUser','latestRegNo','fwVer','model'];
        for (var key in param) {
            from_arr.forEach(function(items, index) {
                if (key == items) {
                    res_obj[to_arr[index]] = param[key];
                }
            });
        }
        res_obj.modelCode = res_obj['model'];
        if (res_obj['model'] == 1802) {
            res_obj['model'] = 'V802';
        } else if (res_obj['model'] == 1801) {
            res_obj['model'] = 'V801';
        } else if (res_obj['model'] == 1800) {
            res_obj['model'] = 'V800';
        } else if (res_obj['model'] == 1881) {
            res_obj['model'] = 'V881';
        } else if (res_obj['model'] == 1884) {
            res_obj['model'] = 'V884';
        } else if (res_obj['model'] == 1882) {
            res_obj['model'] = 'V882';
        } else {
            res_obj['model'] = 'AD800';
        }
        //检测卡是否已经存在
        Products.findAll({
            where: {
                serialNo: sn,
                isdel: 0
            }
        }).then(function(result) {
            if (result[0] == null) {
                //新增卡
                res_obj.inputPerson = admin_id;
                res_obj.update_person = admin_id;
                res_obj.inputDate = TIME();
                res_obj.update_time = TIME();
                // res_obj.EMP_NO = admin_id;
                res_obj.maker = admin_id;
                // res_obj.tester = '1103';
                // VEND转成validTime
                res_obj.validTime = vendToValidTime(res_obj.VEND);
                Products.create(res_obj).then(function(result) {
                    cb();
                }).catch(function(e) {
                    LOG(e);
                });
            } else {
                //更新卡
                res_obj.update_person = admin_id;
                res_obj.update_time = TIME();
                // res_obj.EMP_NO = admin_id;
                Products.update(res_obj, {
                    where: {
                        serialNo: sn,
                        isdel: 0
                    }
                }).then(function(result) {
                    cb();
                }).catch(function(e) {
                    LOG(e);
                });
            }
        }).catch(function(e) {
            LOG(e);
        });
    } else {
        cb();
    }

    function vendToValidTime(VEND) {
        if (!VEND || VEND == 0) {
            return VEND;
        }
        var validTime;
        VEND = String(VEND);
        validTime = '20' + VEND.slice(0, 2) + '-' + VEND.slice(2, 4);
        return validTime;
    }
}

/**
 * 代龙卡扫码录入
 */
exports.postDyna = async params => {
    const { admin_id, code, param } = params;
    const { SN, PMD_CODE, OSVER, TYPE, USER, MAX_COUNT, USED_COUNT, GP0, GP1, GP2, GP3, GP4, GP5 } = param;
    if (code.indexOf(10001) === -1) {
        return { code: 200 };
    }
    const formData = {
        serialNo: SN,
        modelCode: PMD_CODE,
        fwVer: OSVER,
        authType: TYPE,
        oemUser: USER,
        max_count: MAX_COUNT,
        user_count: USED_COUNT,
        GP0,
        GP1,
        GP2,
        GP3,
        GP4,
        GP5,
        update_time: TIME(),
        update_person: admin_id,
    };
    if (PMD_CODE == 1700) {
        formData.model = 'D700';
    } else if (PMD_CODE == 1900) {
        formData.model = 'D900';
    } else if (PMD_CODE == 1910) {
        formData.model = 'D910';
    } else if (PMD_CODE == 1921) {
        formData.model = 'D921';
    } else {
        return { code: -1, msg: '暂不支持该型号' };
    }
    const exist = await Products.findOne({ where: { serialNo: SN, isdel: 0 } });
    if (exist) {
        await Products.update(formData, { where: { serialNo: SN, isdel: 0 } });
    } else {
        formData.inputDate = TIME();
        formData.inputPerson = admin_id;
        formData.maker = admin_id;
        await Products.create(formData);
    }
    return { code: 200 };
}

exports.postCardFromClient = async serialNo => {
    const productEntity = await Products.findOne({ where: { serialNo, isdel: 0 } });
    if (productEntity) {
        return { code: -1, msg: '无需新增' };
    } else {
        await Products.create({
            serialNo,
            status: '售出',
            inputDate: TIME(),
        });
        return { code: 200, msg: '新增成功' };
    }
}

/**
 * 判断控制器类型
 */
this.checkCtrlCardType = async sn => {
    const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    if (!productEntity) {
        return { code: -1, msg: '不存在序列号' };
    }
    const { model } = productEntity.dataValues;
    let type;
    if (/^D/.test(model)) {
        type = 'D';
    } else {
        type = 'V';
    }
    return { code: 200, data: { type } };
}

/**
 * 	删除威程卡
 */
this.cardDel = function(params, cb) {
    var sn = params.sn;
    var admin_id = params.admin_id;
    Products.update({
        isdel: 1,
        update_person: admin_id,
        update_time: TIME(),
        // EMP_NO: admin_id
    }, {
        where: {
            serialNo: sn
        }
    }).then(function(result) {
        cb(result);
    }).catch(function(e) {
        LOG(e);
    })
}

/**
 * 	新增卡
 */
this.cardAdd = function(params, cb) {
    var sn = params.sn;
    var model = params.model;
    var admin_id = params.admin_id;
    Products.findAll({
        where: {
            serialNo: sn,
            isdel: 0
        }
    }).then(function(result) {
        if (result[0] == null) {
            //新增卡
            Products.create({
                serialNo: sn,
                model,
                update_time: TIME(),
                inputDate: TIME(),
                update_person: admin_id,
                inputPerson: admin_id,
                // EMP_NO: admin_id,
                maker: admin_id,
            }).then(function(result) {
                cb({
                    code: 200,
                    msg: '新增成功',
                    data: {}
                });
            }).catch(function(e) {
                LOG(e);
            });
        } else {
            cb({
                code: -1,
                msg: '序列号已存在',
                data: {}
            });
        }
    }).catch(function(e) {
        LOG(e);
    });
}

/**
 * 	搜索中间商，业务员，最终用户，生产者，测试者
 */
this.searchInput = function(params, cb) {
    var key = params.key;
    var val = params.val;
    if (key == 'dealer') {
        Customers.findAll({
            attributes: ['cn_abb', 'user_id'],
            where: {
                isdel: 0,
                '$or': {
                    company: {
                        '$like': '%' + val + '%'
                    },
                    abb: {
                        '$like': '%' + val + '%'
                    }
                }
            },
            limit: 5,
            offset: 0
        }).then(function(result) {
            var res_arr = dealer(result);
            cb(res_arr);
        }).catch(function(e) {
            LOG(e);
        });
    } else if (key == 'endUser') {
        Users.findAll({
            attributes: ['cn_abb', 'user_id'],
            where: {
                isdel: 0,
                '$or': {
                    company: {
                        '$like': '%' + val + '%'
                    },
                    abb: {
                        '$like': '%' + val + '%'
                    }
                }
            },
            limit: 5,
            offset: 0
        }).then(function(result) {
            var res_arr = dealer(result);
            cb(res_arr);
        }).catch(function(e) {
            LOG(e);
        });
    } else {
        Staff.findAll({
            attributes: ['user_name', 'user_id'],
            where: {
                isdel: 0,
                on_job: 1,
                '$or': {
                    user_name: {
                        '$like': '%' + val + '%'
                    },
                    English_abb: {
                        '$like': '%' + val + '%'
                    }
                }
            },
            limit: 5,
            offset: 0
        }).then(function(result) {
            var res_arr = dealer(result);
            cb(res_arr);
        }).catch(function(e) {
            LOG(e);
        });
    }
}

/**
 * 	中间商提交信息
 */
this.dealerUpdateInfo = function(params, cb) {
    var form_data = params.form_data;
    var sn = params.sn;
    Products.update(form_data, {
        where: {
            serialNo: sn
        }
    }).then(function(result) {
        cb();
    }).catch(function(e) {
        LOG(e);
    });
}

/**
 * 	员工提交信息
 */
this.staffUpdateInfo = async function(params, cb) {
    var form_data = params.form_data;
    var sn = params.sn;
    var admin_id = params.admin_id;
    form_data.update_person = admin_id;
    // form_data.EMP_NO = admin_id;
    form_data.update_time = TIME();
    await Products.update(form_data, {
        where: {
            serialNo: sn
        }
    });
    // 检测库存地是否更新，未入库 -> 库存
    const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    const { status, storage, id } = productEntity.dataValues;
    if ((status === '未入库') && (storage === '杭州办' || storage === '济南办')) {
        await Products.update({ status: '库存' }, { where: { id } });
    }
    cb();
    return;
    // 原来的代码
    var p_arr = [];
    var s_arr = [];
    for (var key in form_data) {
        if (key == 'dealer') {
            if (form_data[key] != '') {
                s_arr.push({
                    key: key,
                    val: form_data[key]
                });
            }
        } else if (key == 'endUser') {
            if (form_data[key] != '') {
                s_arr.push({
                    key: key,
                    val: form_data[key]
                });
            }
        } else if (key == 'salesman' || key == 'maker' || key == 'tester' || key == 'EMP_NO' || key == 'inputPerson' || key == 'update_person') {
            if (form_data[key] != '') {
                s_arr.push({
                    key: key,
                    val: form_data[key]
                });
            }
        }
    }
    s_arr.forEach(function(items, index) {
        p_arr[index] = new Promise(function(resolve, reject) {
            if (items.key == 'dealer') {
                Customers.findAll({
                    where: {
                        isdel: 0,
                        cn_abb: items.val
                    }
                }).then(function(result) {
                    try {
                        resolve(result[0].dataValues.user_id);
                    } catch (e) {
                        resolve(items.val);
                    }
                }).catch(function(e) { reject(e); });
            } else if (items.key == 'endUser') {
                Users.findAll({
                    where: {
                        isdel: 0,
                        cn_abb: items.val
                    }
                }).then(function(result) {
                    try {
                        resolve(result[0].dataValues.user_id);
                    } catch (e) {
                        resolve(items.val);
                    }
                }).catch(function(e) { reject(e); });
            } else {
                Staff.findAll({
                    where: {
                        isdel: 0,
                        user_name: items.val
                    }
                }).then(function(result) {
                    try {
                        resolve(result[0].dataValues.user_id);
                    } catch (e) {
                        resolve(items.val);
                    }
                }).catch(function(e) { reject(e); });
            }
        });
    });
    Promise.all(p_arr).then(function(result) {
        s_arr.forEach(function(items, index) {
            s_arr[index].val = result[index];
        });
        s_arr.forEach(function(items, index) {
            for (var i in form_data) {
                if (items.key == i) {
                    form_data[i] = items.val;
                }
            }
        });
        form_data.update_person = admin_id;
        form_data.EMP_NO = admin_id;
        form_data.update_time = TIME();
        Products.update(form_data, {
            where: {
                serialNo: sn
            }
        }).then(function() {
            cb();
        }).catch(function(e) {
            LOG(e);
        });
    }).catch(function(e) {
        LOG(e);
    });
}

/**
 * 检验合格
 */
this.checkPass = async params => {
    const { sn, admin_id } = params;
    const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    const { maker, isTest, status, id } = productEntity.dataValues;
    if (maker == admin_id) {
        return { code: -1, msg: '生产者与测试者必须为两个人' };
    }
    if (isTest) {
        return { code: -1, msg: '已检测' };
    }
    await Products.update({ isTest: 1, isPass: 1, tester: admin_id, testTime: TIME(), update_person: admin_id, update_time: TIME() }, { where: { serialNo: sn, isdel: 0 } });
    if (status === '未入库') {
        await Products.update({ status: '库存' }, { where: { id } });
    }
    return { code: 200, msg: '更新成功' };
}

/**
 * 检验不合格
 */
this.checkNotPass = async params => {
    const { sn, notPassRem, admin_id } = params;
    const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
    const { maker, isTest, status, id } = productEntity.dataValues;
    if (maker == admin_id) {
        return { code: -1, msg: '生产者与测试者必须为两个人' };
    }
    if (isTest) {
        return { code: -1, msg: '已检测' };
    }
    await Products.update({ isTest: 1, isPass: 0, notPassRem, testTime: TIME(), tester: admin_id, update_person: admin_id, update_time: TIME() }, { where: { serialNo: sn, isdel: 0 } });
    if (status === '未入库') {
        await Products.update({ status: '库存' }, { where: { id } });
    }
    return { code: 200, msg: '更新成功' };
}

/**
 * 重新检测
 */
this.checkAgain = async params => {
    const { sn, admin_id } = params;
    await Products.update({ isTest: 0, isPass: 0, testTime: null, tester: null, notPassRem: null, update_person: admin_id, update_time: TIME() }, { where: { serialNo: sn, isdel: 0 } });
    return { code: 200, msg: '更新成功' };
}

/**
 * 申请转手
 */
this.applyResale = async params => {
    const { resaleCompany, sn,  open_id } = params;
    // 判断发送专线还是热线
    const result = await new Promise(resolve => {
        cusClientNotiMsg.onlineService({
            open_id,
        }, result => resolve(result));
    });
    if (result.code === 200) {
        // 专线
        // 找到会员所在的事务，然后获取到事务名称
        const memberEntity = await Member.findOne({ where: { open_id } });
        const { company } = memberEntity.dataValues;
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
        const { user_id } = customerEntity.dataValues;
        const affairEntity = await Affair.findOne({ where: { isdel: 0, customerId: user_id } });
        const { name } = affairEntity.dataValues;
        cusClientNotiMsg.addSpecialMsg({
            open_id,
            form_data: {
                content: '申请将' + sn + '转手给' + resaleCompany,
                title: name,
            },
        }, result => console.log(result));
    } else if (result.code === 100) {
        // 热线
        cusClientNotiMsg.addHostMsg({
            open_id,
            form_data: { content: '申请将' + sn + '转手给' + resaleCompany},
            self: false,
        }, result => console.log(result));
    }
    return {
        code: 200,
        msg: '已提交申请，等待朗杰业务员操作'
    };
}

/**
 * 	信用判断
 */
this.checkReg = function(params, cb) {
    var user_id = params.user_id_arr[0];
    Customers.findAll({
        where: {
            isdel: 0,
            user_id: user_id
        }
    }).then(function(result) {
        result = result[0].dataValues;
        if (result.level == 'F') {
            cb({
                code: -1004,
                msg: '无权限注册',
                data: {}
            });
        } else {
            if (result.credit_qualified == 1) {
                cb({
                    code: 200,
                    msg: '',
                    data: {}
                });
            } else {
                cb({
                    code: -1003,
                    msg: '信用不足',
                    data: {}
                });
            }
        }
    }).catch(function(e) {
        LOG(e);
    });
}

/**
 * 	注册页面
 */
this.reg = async function(params, cb) {
    var code = params.code;
    var user_id_arr = params.user_id_arr;
    var sn = params.sn;
    var appName = params.appName;
    const productInfo = await Products.findOne({
        where: {
            serialNo: sn,
            isdel: 0,
        },
    })
    let funCodeAuth = 0;
    const { dealer } = productInfo.dataValues;
    const customerEntity = await Customers.findOne({ where: { user_id: dealer } });
    if (customerEntity) {
        funCodeAuth = customerEntity.dataValues.funCodeAuth;
    }
    productInfo.dataValues.funCodeAuth = funCodeAuth;
    if (code.indexOf(10001) != -1) {
        cb({
            code: 200,
            msg: '',
            data: productInfo,
        });
    } else if (code.indexOf(10004) != -1 || code.indexOf(10005) != -1 || code.indexOf(10006) != -1) {
        // 判断该卡是否是该公司名下
        const regPower = await this.checkRegPower(code, user_id_arr, sn);
        if (regPower) {
            cb({
                code: 200,
                msg: '',
                data: productInfo,
            });
        } else {
            cb({
                code: -1,
                msg: '暂无注册权限',
                data: {}
            });
        }
    } else {
        cb({
            code: -1,
            msg: '暂无注册权限',
            data: {}
        });
    }
}

/**
 * 	注册历史
 */
this.regEvent = function(params, cb) {
    var sn = params.sn;
    var code = params.code;
    var open_id = params.open_id;
    var where = {};
    where.sn = sn;
    if (code.indexOf(10001) == -1) {
        // if(code!=10001){
        Member.findAll({
            where: {
                open_id: open_id
            }
        }).then(function(result) {
            var company = result[0].dataValues.company;
            where.company = company;
            getRegEvent();
        }).catch(function(e) {
            LOG(e);
        });
    } else {
        getRegEvent();
    }

    function getRegEvent() {
        RegEvent.findAll({
            where: where,
            order: [
                ['id', 'desc']
            ]
        }).then(function(result) {
            cb(dealer(result));
        }).catch(function(e) {
            LOG(e);
        });
    }
}

/**
 * 	获得AppName列表
 */
this.getAppNameList = function(params, cb) {
    AppNameLib.findAll({
        order: [
            ['score', 'DESC']
        ],
        limit: 10,
        offset: 0
    }).then(function(result) {
        cb(dealer(result));
    }).catch(function(e) {
        LOG(e);
    });
}


/**
 * 	提交注册
 */
this.subReg = async(params, cb) => {
    const that = this;
    let { sn, mid, time, appName, code, admin_id, user_id_arr, open_id, isAppReg, isFunReg, funCode } = params;
    let user_id;
    let regCode, authOperKey;

    //获得格式化时间
    function getTime() {
        if (time == 0) {
            var yymm = 0;
        } else {
            var yyyy = time.split('-')[0];
            var mm = time.split('-')[1];
            var yy = yyyy.slice(2, 4);
            var yymm = parseInt(yy + mm);
        }
        return yymm;
    }

    //appName的hash算法
    function AppNameCode(appName) {
        appName = appName.toLowerCase();
        let hash = RelayStringHash(0, appName);
        let posiHash = hash & 0x7FFFFFFF;
        return (posiHash % 5000) + 5000;

        function RelayStringHash(num, str) {
            let hash = num;
            let len = str.length;
            for (let i = 0; i < len; i++) {
                hash ^= (hash << 5) + str.charCodeAt(i) + (hash >>> 2);
            }
            return (hash);
        }
    }

    // 操作码生成算法
    function AutoOperKey(str) {
        let hash = 101010;
        for (let i = 0; i < str.length; i++) {
            hash ^= (hash<<5) + (str.charCodeAt(i)) + (hash>>>2);
        }
        return ((hash>>>0) % 1000000);
    }

    // 注册
    async function getRegResult() {
        const yymm = getTime();
        sn = parseInt(sn);
        mid = parseInt(mid);
        user_id = parseInt(user_id);
        const res_data = {};
        if (isAppReg) {
            const appNameCode = AppNameCode(appName);
            regCode = ucode.getAppRegCode(sn, appNameCode, yymm);
        } else if (isFunReg) {
            regCode = ucode.GenerateAppRegCode(sn, Number(funCode), yymm);
        } else {
            regCode = ucode.getVacRegCode(mid, yymm);
        }
        let operKey = ucode.myOperKey(user_id, sn); //操作码
        if (operKey === 0) {
            // 获取客户简称
            const { abb, hasRegPower } = await Customers.findOne({ where: { user_id, isdel: 0 } });
            if (hasRegPower == 0) {
                cb({
                    code: -10002,
                    msg: '无权注册，请联系朗杰客服。',
                    data: {},
                });
                return;
            }
            operKey = AutoOperKey(abb);
        }
        authOperKey = ucode.getAuthOperKey(sn, regCode, operKey);
        res_data.authOperKey = authOperKey;
        if (isAppReg) {
            res_data.appRegCode = regCode;
        } else if (isFunReg) {
            res_data.regCode = regCode;
        } else {
            res_data.regCode = regCode;
        }
        // 生成记录
        const infoData = await createRegEvent();
        if (isFunReg) {
            cb({
                code: 200,
                msg: '',
                data: res_data,
            });
            return;
        }
        // 更新表信息
        updateInfo(infoData);
        // 对外公开
        releaseReg(infoData, () => {
            cb({
                code: 200,
                msg: '',
                data: res_data,
            });
        });
    }

    // 生成记录
    async function createRegEvent() {
        const info_data = {};
        info_data.sn = sn;
        info_data.mid = mid ? mid : 0;
        info_data.validDate = time;
        info_data.regDate = TIME();
        info_data.regCode = regCode;
        info_data.authOperKey = authOperKey;
        if (code == 10001) {
            //员工注册
            const result = await Staff.findOne({
                where: {
                    open_id: open_id,
                }
            });
            info_data.name = result.dataValues.user_name;
            info_data.company = '杭州朗杰测控技术开发有限公司';
        } else {
            //注册人注册
            const result = await Member.findOne({
                where: {
                    open_id: open_id
                }
            });
            info_data.name = result.dataValues.name;
            info_data.company = result.dataValues.company;
        }
        if (isAppReg) {
            info_data.product = appName;
            info_data.isFunReg = 0;
        } else if (isFunReg) {
            info_data.product = '功能码' + funCode;
            info_data.isFunReg = 1;
        } else {
            const result = await Products.findOne({
                where: {
                    serialNo: sn,
                    isdel: 0,
                }
            });
            info_data.product = result.dataValues.model;
            info_data.isFunReg = 0;
        }
        await RegEvent.create(info_data);
        return info_data;
    }

    // 对外公开
    function releaseReg(info_data, cb) {
        that.releaseRegInfoAfterReg(info_data, () => {
            cb();
        });
    }

    // 更新表信息
    async function updateInfo(infoData) {
        const { validDate, regCode, authOperKey, product } = infoData;
        if (!isAppReg) {
            // 卡注册
            await Products.update({
                validTime: validDate,
                latestRegNo: regCode,
                regAuth: authOperKey,
            }, { where: { serialNo: sn } });
        } else {
            // 软件注册
            const productsEntity = await Products.findOne({ where: { serialNo: sn } });
            const { regAppName, appValidTime, appRegCode, appRegAuth } = productsEntity.dataValues;
            let regAppNameArr, appValidTimeArr, appRegCodeArr, appRegAuthArr;
            try {
                regAppNameArr = regAppName.split(',').filter(items => items);
            } catch (e) {
                regAppNameArr = [];
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
            const index = regAppNameArr.indexOf(product);
            if (index === -1) return;
            appValidTimeArr[index] = validDate;
            appRegCodeArr[index] = regCode;
            appRegAuthArr[index] = authOperKey;
            await Products.update({
                appValidTime: appValidTimeArr.join(),
                appRegCode: appRegCodeArr.join(),
                appRegAuth: appRegAuthArr.join(),
            }, { where: { serialNo: sn } });
        }
    }

    const productEntity = await Products.findOne({
        where: {
            isdel: 0,
            serialNo: sn,
        }
    });
    // 不存在该序列号
    if (!productEntity) {
        cb({
            code: -1,
            msg: '不存在该序列号',
            data: [],
        });
        return;
    }

    if (code.indexOf(10004) != -1 || code.indexOf(10005) != -1 || code.indexOf(10006) != -1) {
        const dealer = productEntity.dataValues.dealer;
        for (var i = 0; i < user_id_arr.length; i++) {
            if (user_id_arr[i] == dealer) {
                user_id = dealer;
                getRegResult();
                break;
            } else if (user_id_arr[i] != dealer && i == user_id_arr.length - 1) {
                cb({
                    code: -10001,
                    msg: '暂无注册权限',
                    data: {}
                });
            }
        }
    } else {
        user_id = admin_id;
        getRegResult();
    }
}

/**
 * 	提交会员身份注册信息
 */
this.memberRegInfo = function(params, cb) {
    var open_id = params.open_id;
    var unionid = params.unionid;
    var params = params.params;
    const self = this;
    Member.findAll({
        where: {
            '$or': {
                open_id: open_id,
                phone: params.mobile
            }
        }
    }).then(async function(result) {
        if (result[0] == null) {
            const user_id = await getMemberUserId();
            // 获取会员昵称
            let nick_name = '';
            const { subscribe, nickname } = await self.getWxUserInfo({ open_id });
            if (subscribe) {
                nick_name = nickname;
            }
            // 新增到会员表
            Member.create({
                user_id,
                name: params.name,
                nick_name,
                phone: params.mobile,
                gender: '男',
                company: '',
                job: '其它',
                open_id: open_id,
                unionid: unionid,
                submit_time: TIME(),
                last_login_time: TIME(),
                active_degree: 1,
                mult_company: JSON.stringify([]),
                isUser: 1,
            }).then(function(result) {
                //获取分数标准并计算
                ItemScore.findAll({}).then(function(result) {
                    result = result[0].dataValues;
                    var basic_score = result.basic;
                    var evaluate_score = result.evaluate;
                    var name_score = (basic_score - evaluate_score) * result.name;
                    var phone_score = (basic_score - evaluate_score) * result.phone;
                    var basic = name_score + phone_score;
                    //添加到会员分数
                    MemberScore.create({
                        openid: open_id,
                        name: params.name,
                        phone: params.mobile,
                        basic: basic,
                        total: basic
                    }).then(function(result) {
                        //新增到签到表
                        MemberSignScore.create({
                            openid: open_id,
                            name: params.name,
                            phone: params.mobile
                        }).then(async function(result) {
                            // 新增钱包账户
                            homeWallet.addCount({ user_id }, () => {});
                            //发送站内消息
                            common.middleMsg({
                                openid: open_id,
                                name: [params.name],
                                phone: [params.mobile],
                                sender: 'system',
                                title: '注册成功',
                                message: '欢迎注册杭州朗杰测控会员！完善信息，可获得更多积分！'
                            }, function() {
                                cb({
                                    code: 200,
                                    msg: '注册成功',
                                    data: {}
                                });
                            });
                            //发送notimsg提醒
                            common.sendToMemberAffair({
                                sender: open_id,
                                content: '有新会员加入！（' + params.name + '）',
                            });
                            // 新会员奖励
                            sendMQ.sendQueueMsg('memberActivity', JSON.stringify({
                                open_id,
                                _class: 'newMember',
                            }), () => {});
                        }).catch(function(e) {
                            LOG(e);
                        });
                    }).catch(function(e) {
                        LOG(e);
                    });
                }).catch(function(e) {
                    LOG(e);
                });
            }).catch(function(e) {
                LOG(e);
            });
        } else {
            //已存在会员
            cb({
                code: -1,
                msg: '该微信号已注册',
                data: {}
            });
        }
    }).catch(function(e) {
        LOG(e);
    });
}

/**
 * 最终用户会员身份注册
 * 应该弃用
 */
this.endMemberRegInfo = function(params, cb) {
    var open_id = params.open_id;
    var unionid = params.unionid;
    var params = params.params;
    Member.findAll({
        where: {
            '$or': {
                open_id: open_id,
                phone: params.mobile
            }
        }
    }).then(async function(result) {
        const user_id = await getMemberUserId();
        if (result[0] == null) {
            //新增到会员表
            Member.create({
                user_id,
                name: params.name,
                phone: params.mobile,
                addr: params.addr,
                gender: '男',
                company: '',
                job: '其它',
                open_id: open_id,
                unionid: unionid,
                submit_time: TIME(),
                mult_company: JSON.stringify([{ company: params.cpy, job: params.job, checked: 0, selected: 1 }]),
            }).then(function(result) {
                //获取分数标准并计算
                ItemScore.findAll({}).then(function(result) {
                    result = result[0].dataValues;
                    var basic_score = result.basic;
                    var evaluate_score = result.evaluate;
                    var name_score = (basic_score - evaluate_score) * result.name;
                    var phone_score = (basic_score - evaluate_score) * result.phone;
                    var basic = name_score + phone_score;
                    //添加到会员分数
                    MemberScore.create({
                        openid: open_id,
                        name: params.name,
                        phone: params.mobile,
                        basic: basic,
                        total: basic
                    }).then(function(result) {
                        //新增到签到表
                        MemberSignScore.create({
                            openid: open_id,
                            name: params.name,
                            phone: params.mobile
                        }).then(function(result) {
                            //发送站内消息
                            common.middleMsg({
                                openid: open_id,
                                name: [params.name],
                                phone: [params.mobile],
                                sender: 'system',
                                title: '注册成功',
                                message: '欢迎注册杭州朗杰测控会员！'
                            }, function() {
                                cb({
                                    code: 200,
                                    msg: '注册成功',
                                    data: {}
                                });
                            });
                        }).catch(function(e) {
                            LOG(e);
                        });
                    }).catch(function(e) {
                        LOG(e);
                    });
                }).catch(function(e) {
                    LOG(e);
                });
            }).catch(function(e) {
                LOG(e);
            });
        } else {
            //已存在会员
            cb({
                code: -1,
                msg: '该微信号已注册',
                data: {}
            });
        }
    }).catch(function(e) {
        LOG(e);
    });
}

async function getMemberUserId() {
    const result = await Member.findOne({
        order: [
            ['user_id', 'DESC']
        ]
    });
    const { user_id } = result.dataValues;
    return user_id + 1;
}

/**
 * 	ORM 结果处理
 */
function dealer(result) {
    var res_arr = [];
    result.forEach(function(items, index) {
        res_arr.push(items.dataValues);
    });
    return res_arr;
}

this.getSuperAuth = function(params, cb) {
    var res_arr = [];
    sequelize.query('SELECT * FROM vip_basic ORDER BY CONVERT(company USING gbk) asc', { model: Member }).then(function(result) {
        result.forEach(function(items, index) {
            if (items.dataValues.company != null) {
                res_arr.push(items.dataValues.company);
            }
        });
        res_arr = common.arrayUnique(res_arr);
        var langjie_arr = [];
        for (var i = 0; i < res_arr.length; i++) {
            if (res_arr[i].indexOf('朗杰') != -1) {
                langjie_arr.push(res_arr[i]);
                res_arr.splice(i, 1);
                i--;
            }
        }
        res_arr = langjie_arr.concat(res_arr);
        for (var i = 0; i < res_arr.length; i++) {
            if (res_arr[i] == '杭州朗杰测控技术开发有限公司') res_arr.splice(i, 1);
        }
        cb(res_arr);
    }).catch(function(e) {
        LOG(e);
    });
}
this.getSuperAuthMember = (params, cb) => {
    const company = params.company;
    Member.findAll({
        attributes: ['name', 'job', 'check_company', 'check_job', 'open_id'],
        where: {
            company: company
        }
    }).then((result) => {
        cb(dealer(result));
    }).catch((e) => {
        LOG(e);
    });
}
this.postSuperAuthMember = (params, cb) => {
    const { open_id } = params;
    Member.findOne({
        where: {
            open_id,
        }
    }).then((result) => {
        cb(result.dataValues);
    }).catch((e) => {
        LOG(e);
    });
}

exports.refreshMemberNickName = async () => {
    const list = await Member.findAll();
    const access_token = await getToken();
    await bluebird.map(list, async items => {
        const { open_id, id } = items.dataValues;
        const result = await this.getWxUserInfo({ open_id, access_token });
        const { subscribe, nickname } = result;
        if (subscribe) {
            try {
                await Member.update({ nick_name: nickname }, { where: { id } });
            } catch (e) {
                
            }
        }
    }, { concurrency: 3 });

    async function getToken() {
        return await new Promise(resolve => {
            request.get('https://wx.langjie.com/wx/getToken',(err,response,body) => {
                body = JSON.parse(body);
                resolve(body.access_token);
            });
        });
    }
}

this.hasShare = (params, cb) => {
    // const { open_id, no } = params;
    // Member.findOne({
    //     where: { open_id }
    // }).then(result => {
    //     if (!result) return cb({
    //         code: -1,
    //         msg: '不存在该会员',
    //         data: [],
    //     });
    //     const { open_id, name, phone, id } = result.dataValues;
    //     BaseEvent.findOne({
    //         where: {
    //             ownerId: open_id,
    //             type: '1304',
    //             rem: no,
    //         }
    //     }).then(result => {
    //         if (result) return cb({
    //             code: -1,
    //             msg: '已分享过了',
    //             data: [],
    //         });
    //         common.createEvent({
    //             headParams: {
    //                 ownerId: open_id,
    //                 type: '1304',
    //                 time: TIME(),
    //                 person: name,
    //                 rem: no,
    //             },
    //             bodyParams: {},
    //         }, result => {
    //             cb({
    //                 code: 200,
    //                 msg: '分享成功',
    //                 data: [],
    //             });
    //             // 发消息给积分模块
    //             const p = {
    //                 _class: 'share',
    //                 openId: open_id,
    //                 id,
    //                 name,
    //                 phone,
    //             };
    //             sendMQ.sendQueueMsg('memberActivity', JSON.stringify(p), result => {
    //                 console.log(result);
    //             });
    //         });
    //     }).catch(e => { throw e });
    // }).catch(e => LOG(e));
}

this.hasRead = (params, cb) => {
    // const { open_id, no } = params;
    // Member.findOne({
    //     where: { open_id }
    // }).then(result => {
    //     if (!result) return cb({
    //         code: -1,
    //         msg: '不存在该会员',
    //         data: [],
    //     });
    //     const { open_id, name, phone, id } = result.dataValues;
    //     BaseEvent.findOne({
    //         where: {
    //             ownerId: open_id,
    //             type: '1303',
    //             rem: no,
    //         }
    //     }).then(result => {
    //         if (result) return cb({
    //             code: -1,
    //             msg: '已阅读过了',
    //             data: [],
    //         });
    //         common.createEvent({
    //             headParams: {
    //                 ownerId: open_id,
    //                 type: '1303',
    //                 time: TIME(),
    //                 person: name,
    //                 rem: no,
    //             },
    //             bodyParams: {},
    //         }, result => {
    //             cb({
    //                 code: 200,
    //                 msg: '阅读成功',
    //                 data: [],
    //             });
    //             // 发消息给积分模块
    //             const p = {
    //                 _class: 'read',
    //                 openId: open_id,
    //                 id,
    //                 name,
    //                 phone,
    //             };
    //             sendMQ.sendQueueMsg('memberActivity', JSON.stringify(p), result => {
    //                 console.log(result);
    //             });
    //         });
    //     }).catch(e => { throw e });
    // }).catch(e => LOG(e));
}

this.queryExpress = (params, cb) => {
    const { no, type, count } = params;
    const host = "https://wuliu.market.alicloudapi.com";
    const path = "/kdi";
    const appcode = "f5587617e1144226ac4b32263715f37d";
    const headers = {
        Authorization: "APPCODE " + appcode
    };
    let newNo;
    if (no.indexOf('SF') !== -1) {
        newNo = count ? no + ':4578' : no + ':1425';
    } else {
        newNo = no;
    }
    // const newNo = count ? no + ':4578' : no + ':1425';
    request.get({
        url: host + path + '?no=' + newNo,
        headers,
        method: 'GET',
    }, (err, response, body) => {
        body = typeof body === 'object' ? body : JSON.parse(body);
        if (count === 1 || body.status != '205') {
            cb(body);
        } else {
            this.queryExpress({ no, count: 1 }, cb);
        }
    });
}

// 往云注册对外发布
this.releaseReg = async(params, cb) => {
    const { sn } = params;
    // const result = await sofaActionClient.show({ sn: Number(sn) });
    // if (result.code == '200') {
    // 	// 更新
    // 	const res = await sofaActionClient.update(params);
    // 	cb(res);
    // } else {
    // 	// 新增
    // 	const res = await sofaActionClient.create(params);
    // 	cb(res);
    // }
    request({
        url: CONFIG.cloudApiAddr + '/action/reg/' + sn,
        method: 'get',
        headers: {
            Accept: 'application/json'
        },
    }, (err, response, body) => {
        body = typeof body === 'string' ? JSON.parse(body) : body;
        params.aesStr = crypto.createHash('md5').update(String(sn) + String(CONFIG.AUTH_PRIMARY_KEY)).digest('hex');
        if (body.code == 200) {
            // 更新
            request({
                url: CONFIG.cloudApiAddr + '/action/reg/' + sn,
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                },
                body: params,
                json: true,
            }, (err, response, body) => {
                body = typeof body === 'string' ? JSON.parse(body) : body;
                cb(body);
            });
        } else {
            // 新增
            request({
                url: CONFIG.cloudApiAddr + '/action/reg',
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body: params,
                json: true,
            }, (err, response, body) => {
                body = typeof body === 'string' ? JSON.parse(body) : body;
                cb(body);
            });
        }
    });
}

// 取消对外公开
this.releaseRegDestroy = async(params, cb) => {
    const { sn } = params;
    // const res = await sofaActionClient.destroy({ sn: Number(sn) });
    // cb(res);
    const formData = {};
    formData.aesStr = crypto.createHash('md5').update(String(sn) + String(CONFIG.AUTH_PRIMARY_KEY)).digest('hex');
    request({
        url: CONFIG.cloudApiAddr + '/action/reg/' + sn,
        method: 'delete',
        headers: {
            Accept: 'application/json'
        },
        body: formData,
        json: true,
    }, (err, response, body) => {
        body = typeof body === 'string' ? JSON.parse(body) : body;
        cb(body);
    });
}

this.releaseRegInfoAfterReg = async(params, cb) => {
    const pd = params.product;
    if (pd.indexOf('V') === -1 && pd.indexOf('800') === -1) {
        params.appRegCode = params.regCode;
        params.appAuthOperKey = params.authOperKey;
        params.appValidDate = params.validDate;
        params.appRegDate = params.regDate;
        params.appRegPerson = params.regPerson;
        delete params.regCode;
        delete params.authOperKey;
        delete params.validDate;
        delete params.regDate;
        delete params.regPerson;
    }
    cb();
    this.releaseReg(params, () => {});
}

// 验证该访问者是否有权访问
// 商务会员，dealer指向该会员所在单位
// 个人会员，dealer指向该会员的user_id
exports.checkSnAccess = async (unionid, sn) => {
    const memberEntity = await Member.findOne({ where: { unionid } });
    const productEntity = await Products.findOne({ where: { serialNo: sn, isdel: 0 }});
    if (!productEntity) {
        return false;
    }
    const { user_id, checked, company, isStaff } = memberEntity.dataValues;
    const { dealer } = productEntity.dataValues;
    if (isStaff) {
        return true;
    }
    if (checked == 0) {
        if (dealer != user_id) {
            return false;
        }
    } else {
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 } });
        if (!customerEntity) {
            return false;
        }
        const { user_id: customerId } = customerEntity.dataValues;
        if (dealer != customerId) {
            return false;
        }
    }
    return true;
}