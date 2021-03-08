const common = require('./common');
const base = require('./base');
const moment = require('moment');
const sequelize = require('../dao').sequelize;
const Staff = require('../dao').Staff;
const ContractsHead = require('../dao').ContractsHead;
const Products = require('../dao').Products;
const Customers = require('../dao').Customers;
const Repairs = require('../dao').Repairs;
const modRepairs = require('../model/repair');
const socketCall = require('./socketCall');
const getPinYin = require('./getPinYin');
const bluebird = require('bluebird');
const RepairMsg = require('../dao').RepairMsg;
const Member = require('../dao').Member;
const OtherProducts = require('../dao').OtherProducts;
const request = require('request');

function trans(repairList, notChange) {
    const staffMap = new base.StaffMap().getStaffMap();
    repairList.forEach(async (items, index) => {
        try {
            repairList[index].dataValues.update_person = staffMap[items.dataValues.update_person].user_name;
        } catch (e) {
            
        }
        try {
            repairList[index].dataValues.insert_person = staffMap[items.dataValues.insert_person].user_name;
        } catch (e) {
            
        }
        try {
            repairList[index].dataValues.pri_check_person = staffMap[items.dataValues.pri_check_person].user_name;
        } catch (e) {
            
        }
        try {
            repairList[index].dataValues.again_check_person = staffMap[items.dataValues.again_check_person].user_name;
        } catch (e) {
            
        }
        try {
            repairList[index].dataValues.repair_person = staffMap[items.dataValues.repair_person].user_name;
        } catch (e) {
            
        }
        try {
            repairList[index].dataValues.fee_checker = staffMap[items.dataValues.fee_checker].user_name;
        } catch (e) {
            
        }
        repairList[index].dataValues.update_time = moment(items.dataValues.update_time).format('YYYY-MM-DD HH:mm:ss');
        repairList[index].dataValues.deliver_time = items.dataValues.deliver_time != 0 ? moment(Number(items.dataValues.deliver_time + '000')).format('YYYY-MM-DD') : null;
        if (!notChange) {
            repairList[index].dataValues.receive_time = items.dataValues.receive_time != 0 ? moment(Number(items.dataValues.receive_time + '000')).format('YYYY-MM-DD HH:mm') : null;
        }
    });
    return repairList;
}

exports.trans = trans;

this.list = async (params, cb) => {
    let num = params.num ? parseInt(params.num) : 10;
	let page = params.page ? parseInt(params.page) : 1;
    let keywords = params.keywords ? params.keywords : '';
    let order = params.order ? params.order : 'id';
    const where = {
        isdel: 0,
        $or: {
            repair_contractno: { $like: '%'+keywords+'%' },
            cust_name: { $like: '%'+keywords+'%' },
            serial_no: { $like: '%'+keywords+'%' },
        },
    };
    const filter = params.filter ? JSON.parse(params.filter) : {};
    const { delivery_state, sign_time_start, sign_time_end } = filter;
    if (delivery_state) {
        let delivery_state_arr;
        try {
            delivery_state_arr = delivery_state.split(',').filter(items => items);
        } catch (e) {
            delivery_state_arr = [];
        }
        where.deliver_state = { $in: delivery_state_arr };
    }
    where.receive_time = { $between: [ Date.parse(sign_time_start)/1000, Date.parse(sign_time_end)/1000 ] };
    if (order === 'id') {
        order = ['deliver_state'];
    } else if (order === 'update_time') {
        order = ['update_time', 'DESC'];
    }
    const { markOrder, id_arr } = await new Promise(async resolve => {
        let markOrder;
        common.infoMark({
            type: 'Repairs'
        }, resObj => {
            const { str, id_arr } = resObj;
            if (str) {
                markOrder =	[[sequelize.literal('if('+str+',0,1)')], order, ['receive_time', 'DESC']];
                // markOrder =	[[sequelize.literal('if('+str+',0,1)')], [sequelize.literal('if(Repairs.deliver_state="关闭",1,0)')], [sequelize.literal('if(Repairs.deliver_time=0,0,1)')], order];
            } else {
                markOrder =	[order, ['receive_time', 'DESC']];
                // markOrder =	[[sequelize.literal('if(Repairs.deliver_state="关闭",1,0)')], [sequelize.literal('if(Repairs.deliver_time=0,0,1)')], order];
            }
            resolve({
                markOrder,
                id_arr,
            });
        });
    });
    const repairList = await Repairs.findAndCountAll({
        where,
        limit: num,
        offset: (page -1) * num,
        order: markOrder,
    });
    const averageRepairDay = await this.getAverageRepairDay(where);
    repairList.rows = trans(repairList.rows);
    // 判断序列号是什么类型
    for (let i = 0; i < repairList.rows.length; i++) {
        const { serial_no } = repairList.rows[i].dataValues;
        const ctrlEntity = await Products.findOne({ where: { serialNo: serial_no, isdel: 0 } });
        if (ctrlEntity) {
            if (/V/.test(ctrlEntity.dataValues.model) || /AD/.test(ctrlEntity.dataValues.model)) {
                repairList.rows[i].dataValues.modelType = 'V';
            } else {
                repairList.rows[i].dataValues.modelType = 'D';
            }
        } else {
            repairList.rows[i].dataValues.modelType = 'O';
        }
    }
    const result = {
        code: 200,
        msg: '',
        data: {
            data: repairList.rows,
            id_arr: id_arr,
            total: repairList.count,
            averageRepairDay: averageRepairDay.average,
            averageRepairCount: averageRepairDay.count,
        },
    };
    if (cb) {
        cb(result);
    }
    return result;
}

this.getAverageRepairDay = async where => {
    where.deliver_time = { $ne: 0 };
    where.deliver_state = { $ne: '关闭' };
    const repairList = await Repairs.findAll({
        where,
    });
    let total = 0, len = repairList.length;
    if (len === 0) {
        return {
            count: 0,
            average: 0,
        };
    }
    repairList.forEach(items => {
        const receive_time = moment(items.dataValues.receive_time * 1000).format('YYYY-MM-DD');
        const deliver_time = moment(items.dataValues.deliver_time * 1000).format('YYYY-MM-DD');
        total += (Date.parse(deliver_time) - Date.parse(receive_time)) / (60 * 60 * 24 * 1000);
    });
    return {
        count: len,
        average: (total / len).toFixed(2),
    }
}

this.getOneById = async id => {
    const result = await Repairs.findOne({ where: { id } });
    return {
        code: 200,
        msg: '',
        data: trans([result])[0],
    };
}

this.getRepairRateData = async () => {
    const standData = [['2020-08', 248]];
    const year = 2;
    const now = DATETIME();
    const diff = getDiffMonth(now, standData[0][0]);
    const currentSn = standData[0][1] + diff;
    const oldSn = currentSn - 12 * year;
    const outputMapper = await getOutputMapper();
    const contractMapper = await getContractMapper();
    const resultMapper = {};
    const repairSnArr = await getRepairSnArr();
    for (let key of Object.keys(outputMapper)) {
        resultMapper[key] = { product: outputMapper[key].length, delivery: 0, repair: 0 };
    }
    for (const date in outputMapper) {
        // 合同
        if (contractMapper[date]) {
            const totalArr = outputMapper[date];
            const deliveryArr = contractMapper[date];
            for (let i = 0; i < totalArr.length; i++) {
                if (deliveryArr.includes(totalArr[i])) {
                    resultMapper[date].delivery++;
                }
            }
        }
        // 维修
        for (let i = 0; i < outputMapper[date].length; i++) {
            for (let j = 0; j < repairSnArr.length; j++) {
                if (outputMapper[date][i] == repairSnArr[j]) {
                    resultMapper[date].repair++;
                }
            }
        }
    }
    return {
        code: 200,
        msg: '',
        data: resultMapper,
    };

    async function getOutputMapper() {
        let outputMapper = {};
        const productList = await Products.findAll({
            attributes: ['serialNo'],
            where: {
                isdel: 0,
                serialNo: { $between: [ String(oldSn - 1).padEnd('9999'), String(currentSn).padEnd('9999') ] },
            },
        });
        productList.map(items => {
            const { serialNo } = items.dataValues;
            const diff = standData[0][1] - Number(serialNo.slice(0, 3));
            const date = moment(new Date()).subtract(diff, 'months').format('YYYY-MM');
            if (!outputMapper[date]) {
                outputMapper[date] = [];
            }
            outputMapper[date].push(serialNo);
        });
        let arr = [];
        for (const key in outputMapper) {
            arr.push({ key, value: outputMapper[key] });
        }
        arr = arr.sort((a, b) => {
            return Date.parse(a.key) - Date.parse(b.key);
        });
        const newMapper = {};
        arr.forEach(items => {
            newMapper[items.key] = items.value;
        });
        return newMapper;
    }

    async function getContractMapper() {
        const contractMapper = {};
        const contractList = await ContractsHead.findAll({
            where: {
                isdel: 0,
                contract_state: '有效',
            }
        });
        for (let i = 0; i < contractList.length; i++) {
            const { delivery_time, snGroup } = contractList[i].dataValues;
            if (!delivery_time) {
                continue;
            }
            let snArr;
            try {
                snArr = snGroup.split(',').filter(items => items);
            } catch (e) {
                snArr = [];
            }
            if (snArr.length === 0) {
                continue;
            }
            const dateKey = moment(delivery_time).format('YYYY-MM');
            if (!contractMapper[dateKey]) {
                contractMapper[dateKey] = [];
            }
            contractMapper[dateKey] = [...contractMapper[dateKey], ...snArr];
        }
        return contractMapper;
    }

    async function getRepairSnArr() {
        const repairList = await Repairs.findAll({ where: { isdel: 0 } });
        let totalArr = [];
        for (let i = 0; i < repairList.length; i++) {
            let { serial_no } = repairList[i].dataValues;
            serial_no = serial_no.replace(/\D/ig, ',');
            let snArr;
            try {
                snArr = serial_no.split(',').filter(items => items);
            } catch (e) {
                snArr = [];
            }
            totalArr = [...totalArr, ...snArr];
            // for (let j = 0; j < snArr.length; j++) {
            //     for (const date in outputMapper) {
            //         for (let z = 0; z < outputMapper[date].length; z++) {
            //             if (outputMapper[date][z] == snArr[i]) {
            //                 resultMapper[date].repair++;
            //             }
            //         }
            //     }
            // }
        }
        return totalArr;
    }

    function getDiffMonth(date1, date2) {
        date1 = moment(date1).format('YYYY-MM');
        date2 = moment(date2).format('YYYY-MM');
        date1 = moment(date1);
        date2 = moment(date2);
        return date2.diff(date1, 'month');
    }
}

/**
 *  搜索历史维修单
 */
this.searchHistory = async (params, cb) => {
    const { snArr, id } = params;
    const repairMapper = {};
    await bluebird.map(snArr, async sn => {
        const list = await Repairs.findAll({ where: { isdel: 0, serial_no: { $like: '%'+sn+'%' } } });
        list.forEach(items => {
            const { id: _id } = items.dataValues;
            if (id != _id && !repairMapper[_id]) {
                repairMapper[_id] = items.dataValues;
            }
        });
    }, { concurrency: 10 });
    const resArr = [];
    for (const value of Object.values(repairMapper)) {
        resArr.push(value);
    }
    const result = { code: 200, msg: '', data: resArr };
    if (cb) {
        cb(result);
    }
    return result;
}

/**
 *  新增维修单
 */
this.add = async (params, cb) => {
    const form_data = JSON.parse(params.params);
    const admin_id = params.admin_id;
    const receive_time = DATETIME(form_data.receive_time);
    form_data.receive_time = form_data.receive_time ? Date.parse(form_data.receive_time)/1000 : 0;
    form_data.update_person = admin_id;
    form_data.update_time = TIME();
    form_data.insert_person = admin_id;
    form_data.insert_time = DATETIME();

    const { cust_name } = form_data;
    let yy = receive_time.split('-')[0].slice(2,4);
    let mm = receive_time.split('-')[1];
    let dd = receive_time.split('-')[2];
    let repair_contractno;
    const customerEntity = await Customers.findOne({ where: { cn_abb: cust_name, isdel: 0 } });
    if (customerEntity) {
        repair_contractno = 'WX'+customerEntity.dataValues.abb+'-'+yy+mm+dd;
    } else {
        repair_contractno = 'WX'+getPinYin.getAbb(getPinYin.getPinYin(cust_name, '', true))+'-'+yy+mm+dd;
    }
    let len = await Repairs.count({where: { repair_contractno: {$like: '%'+repair_contractno+'%'}, isdel: 0}});
    len++;
    repair_contractno = repair_contractno +'-0'+len;
    form_data.repair_contractno = repair_contractno;
    // 根据序列号查产品
    const { serial_no } = form_data;
    const ctrlEntity = await Products.findOne({ where: { serialNo: serial_no } });
    if (ctrlEntity) {
        form_data.goods = ctrlEntity.dataValues.model;
    } else {
        const otherProductsEntity = await OtherProducts.findOne({ where: { serialNo: serial_no } });
        if (otherProductsEntity) {
            form_data.goods = otherProductsEntity.dataValues.model;
            form_data.standrd = otherProductsEntity.dataValues.standrd;
        } else {
            return { code: -1, msg: '找不到该序列号' };
        }
    }
    const repairEntity = await Repairs.create(form_data);
    const result = { code: 200, msg: '新增成功', data: { repair_contractno } };
    //群发通知
    form_data.type = 'new';
    form_data.receive_time = receive_time;
    socketCall.changeRepairState(form_data);

    // 切换状态
    this.toFirstCheck({ id: repairEntity.dataValues.id });

    if (cb) {
        cb(result);
    }
    return result;
}

/**
 *  删除维修单
 */
this.del = async (params, cb) => {
    const { id, admin_id } = params;
    await Repairs.update({ isdel: 1, update_person: admin_id, update_time: TIME() }, { where: { id } });
    const result = { code: 200, msg: '删除成功', data: [] };
    if (cb) {
        cb(result);
        return result;
    }
}

/**
 *  搜索客户用户中文简称
 */
this.searchCnAbb = (params, cb) => {
    let { keywords } = params;
    common.searchCusAndUserInfo({
        keywords: keywords
    },result => {
        let res_arr = [];
        result.forEach((items,index) => {
            if(items.dataValues.cn_abb&&res_arr.indexOf(items.dataValues.cn_abb)==-1){
                res_arr.push({
                    text: items.dataValues.cn_abb,
                    value: items.dataValues.cn_abb
                });
            }
        });
        cb({
            code: 200,
            msg: '',
            data: res_arr
        });
    });
}

/**
 *  更新维修单
 */
this.update = (params,cb) => {
    const trans = (form_data,cb) => {
        if(form_data.receive_time){
            form_data.receive_time = form_data.receive_time?Date.parse(form_data.receive_time)/1000:0;
        }
        if(form_data.deliver_time){
            form_data.deliver_time = form_data.deliver_time?Date.parse(form_data.deliver_time)/1000:0;
        }
        if(form_data.pri_check_person){
            common.staffNameTransToUserId({
                user_name: form_data.pri_check_person
            },user_id => {
                form_data.pri_check_person = user_id;
                cb();
            });
        }else{
            if(form_data.again_check_person){
                common.staffNameTransToUserId({
                    user_name: form_data.again_check_person
                },user_id => {
                    form_data.again_check_person = user_id;
                    cb();
                });
            }else{
                cb();
            }
        }
    }

    let form_data = JSON.parse(params.params.form_data);
    let admin_id = params.admin_id;
    const that = this;
    const repair_contractno = form_data.repair_contractno;
    //转换
    trans(form_data,() => {
        //判断是否完成
        if(form_data.deliver_state=='已收件'){
            form_data.complete = 1;
        }else{
            form_data.complete = 0;
        }
        delete form_data.insert_person;
        delete form_data.insert_time;
        form_data.update_person = admin_id;
        form_data.update_time = TIME();
        Repairs.update(form_data,{
            where: {
                id: form_data.id
            }
        }).then(() => {
            that.list({
                keywords: repair_contractno,
                type: 0
            },result => {
                cb({
                    code: 200,
                    msg: '更新成功',
                    data: result
                });
                //状态变动
                let socketRes = result.data.data[0];
                socketCall.changeRepairState(socketRes);
            });
        }).catch(e => LOG(e));
    });
}

/**
 *  更新维修单
 *  不涉及状态的更新，前端控制
 */
this.update = async (params, cb) => {
    const form_data = JSON.parse(params.params.form_data);
    if (form_data.hasOwnProperty('deliver_time')) {
        if (form_data.deliver_time) {
            form_data.deliver_time = Date.parse(form_data.deliver_time) / 1000;
        } else {
            form_data.deliver_time = 0;
        }
    }
    const { admin_id } = params;
    form_data.update_person = admin_id;
    form_data.update_time = TIME();
    await Repairs.update(form_data, { where: { id: form_data.id } });
    if (cb) {
        cb({ code: 200, msg: '更新成功' });
    }
    return { code: 200, msg: '更新成功' };
}

/*********************************** 状态变化 ***************************************/

this.stateChangeNotifiy = async id => {
    const result = await this.getOneById(id);
    socketCall.changeRepairState(result.data);
}

this.toFirstCheck = async params => {
    const { id } = params;
    const repairEntity = await Repairs.findOne({ where: { id } });
    const fromData = { deliver_state: '送修检验中', complete: 0 };
    if (!repairEntity.dataValues.stage0) {
        fromData.stage0 = TIME();
    }
    await Repairs.update(fromData, { where: { id } });
    return { code: 200, msg: '状态更新成功' };
}

this.toRepairing = async params => {
    const { id, admin_id } = params;
    const repairEntity = await Repairs.findOne({ where: { id } });
    const { stage1, conclusion, treatement } = repairEntity.dataValues;
    if (!conclusion || !treatement) {
        return { code: -1, msg: '不能为空' };
    }
    const fromData = { deliver_state: '维修中', complete: 0 };
    if (!stage1) {
        fromData.stage1 = TIME();
        fromData.pri_check_person = admin_id;
    }
    await Repairs.update(fromData, { where: { id } });
    this.stateChangeNotifiy(id);
    return { code: 200, msg: '状态更新成功' };
}

this.toSecondCheck = async params => {
    const { id, admin_id } = params;
    const repairEntity = await Repairs.findOne({ where: { id } });
    const { stage2, repair_conclusion } = repairEntity.dataValues;
    if (!repair_conclusion) {
        return { code: -1, msg: '维修操作不能为空' };
    }
    const fromData = { deliver_state: '维修检验中', complete: 0 };
    if (!stage2) {
        fromData.repair_person = admin_id;
        fromData.stage2 = TIME();
    }
    await Repairs.update(fromData, { where: { id } });
    this.stateChangeNotifiy(id);
    return { code: 200, msg: '状态更新成功' };
}

this.toPrepareSend = async params => {
    const { id, admin_id } = params;
    const repairEntity = await Repairs.findOne({ where: { id } });
    const { stage3, again_conclusion, repair_person } = repairEntity.dataValues;
    if (!again_conclusion) {
        return { code: -1, msg: '维修检验不能为空' };
    }
    if (admin_id == repair_person) {
        return { code: -1, msg: '维修人与检验人不能相同' };
    }
    const fromData = { deliver_state: '待发件', complete: 0 };
    if (!stage3) {
        fromData.stage3 = TIME();
        fromData.again_check_person = admin_id;
    }
    await Repairs.update(fromData, { where: { id } });
    this.stateChangeNotifiy(id);
    return { code: 200, msg: '状态更新成功' };
}

this.toHasSend = async params => {
    const { id } = params;
    const repairEntity = await Repairs.findOne({ where: { id } });
    const { stage4, express, deliver_time } = repairEntity.dataValues;
    if (!express || !deliver_time) {
        return { code: -1, msg: '发件快递单号或发件时间不能为空' };
    }
    const fromData = { deliver_state: '已发件', complete: 0 };
    if (!stage4) {
        fromData.stage4 = TIME();
    }
    await Repairs.update(fromData, { where: { id } });
    this.stateChangeNotifiy(id);
    return { code: 200, msg: '状态更新成功' };
}

this.toHasReceive = async params => {
    const { id } = params;
    const repairEntity = await Repairs.findOne({ where: { id } });
    const { stage5, take_person, take_time } = repairEntity.dataValues;
    if (!take_person || !take_time) {
        return { code: -1, msg: '签收人或客户收件时间不能为空' };
    }
    const fromData = { deliver_state: '已收件', complete: 1 };
    if (!stage5) {
        fromData.stage5 = TIME();
    }
    await Repairs.update(fromData, { where: { id } });
    this.stateChangeNotifiy(id);
    return { code: 200, msg: '状态更新成功' };
}

// 根据序列号判断是否有未发货的维修单
this.getNotDeliveryNoBySn = async serial_no => {
    const result = await Repairs.findOne({
        where: {
            serial_no: { $like: '%'+serial_no+'%' },
            isdel: 0,
            deliver_time: 0,
        },
        order: [['id', 'DESC']],
    });
    if (result) {
        return { code: 200, msg: '', data: trans([result])[0] };
    }
    return { code: -1, msg: '不存在', data: null };
}

// 新增消息
this.addRepairMsg = async params => {
    const { sn, admin_id, open_id, content, repair_no } = params;
    const formData = { sn, send_time: TIME(), content };
    if (admin_id) {
        const staffMapper = new base.StaffMap().getStaffMap();
        formData.name = staffMapper[admin_id].user_name;
        formData.admin_id = admin_id;
    } else {
        const memberEntity = await Member.findOne({ where: { open_id } });
        formData.name = memberEntity.dataValues.name;
        formData.open_id = open_id;
    }
    const result = await Repairs.findOne({ where: { isdel: 0, repair_contractno: repair_no } });
    if (result) {
        formData.repair_no = repair_no;
        formData.repair_state = result.dataValues.deliver_state;
    }
    await RepairMsg.create(formData);
    // 发消息通知运营系统
    if (!admin_id) {
        sendMsgToAdmin(open_id, content, sn, repair_no);
    }
    return { code: 200, msg: '新增成功' };

    async function sendMsgToAdmin(open_id, content, sn, repair_no) {
        const mailId = Date.now();
        request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
            console.log(body);
        }).form({
            data: JSON.stringify({
                mailId: mailId,
                class: 'repairs',
                priority: '普通',
                frontUrl: '/repairs',
                sender: open_id,
                post_time: TIME(),
                title: '维修管理',
                content: content + '（'+ sn + '，' + repair_no +'）',
                votes: '已阅',
                subscriber: '1006',
                NotiClientSubs: [
                    {
                        receiver: '1006',
                        noti_post_mailId: mailId
                    }
                ]
            })
        });
    }
}

this.getRepairMsg = async params => {
    const { sn, repair_no } = params;
    const list = await RepairMsg.findAll({ where: { sn, repair_no } });
    return { code: 200, msg: '', data: list };
}

/**
 * n年维修率
 * user_id
 */
this.getRepairRateByYear = async params => {
    const { user_id, year } = params;
    let total = 0;
    const getSnArr = serial_no => {
        let v_arr = [];
        let v_str = '';
        for (let i = 0; i < serial_no.length; i++) {
            if(/\d/.test(serial_no[i])&&i!=serial_no.length-1){
                v_str += serial_no[i];
            }else if((!/\d/.test(serial_no[i]))&&/\d/.test(serial_no[i-1])){
                v_arr.push(v_str);
                v_str = '';
            }else if(/\d/.test(serial_no[i])&&i==serial_no.length-1){
                v_str += serial_no[i];
                v_arr.push(v_str);
            }
        };
        return v_arr;
    }
    const where = { isdel: 0 };
    if (user_id) where.dealer = user_id;
    const snArr = await Products.findAll({
        where,
    });
    const oneYearRepair = {repairNum: 0, data: []},
        twoYearRepair = {repairNum: 0, data: []},
        threeYearRepair = {repairNum: 0, data: []};
    const productsMapper = {};
    snArr.forEach(items => {
        if (new Date(items.dataValues.inputDate).getFullYear() === Number(year)) {
            total++;
            productsMapper[items.dataValues.serialNo] = items.dataValues.inputDate;
        }
    });
    let cn_abb;
    if (user_id) {
        const customerEntity = await Customers.findOne({ where: { user_id } });
        if (!customerEntity) return {
            code: -1,
            msg: '不存在该客户',
            data: [],
        };
        cn_abb = customerEntity.dataValues.cn_abb;
    }
    const repairWhere = { isdel: 0 };
    if (cn_abb) repairWhere.cust_name = cn_abb;
    const repairEntity = await Repairs.findAll({ where: repairWhere });
    for (let i = 0; i < repairEntity.length; i++) {
        const items = repairEntity[i].dataValues;
        const { serial_no, insert_time, sql_stamp } = items;
        const repairTime = insert_time ? insert_time : sql_stamp;
        const inSnArr = getSnArr(serial_no);
        for (let j = 0; j < inSnArr.length; j++) {
            const inputDate = productsMapper[inSnArr[j]];
            // 该卡是指定年份生产的
            if (inputDate) {
                const repairYear = new Date(repairTime).getFullYear();
                const diff = repairYear - Number(year);
                if (diff === 0) {
                    // 一年维修
                    oneYearRepair.repairNum++;
                    oneYearRepair.data.push(inSnArr[j]);
                } else if (diff === 1) {
                    // 二年维修
                    twoYearRepair.repairNum++;
                    twoYearRepair.data.push(inSnArr[j]);
                } else if (diff === 2) {
                    // 三年维修
                    threeYearRepair.repairNum++;
                    threeYearRepair.data.push(inSnArr[j]);
                } else {
                    // 三年以上维修
                }
            }
        }
    }
    oneYearRepair.rate = Number(parseFloat(oneYearRepair.repairNum / total * 100).toFixed(2)) + '%';
    twoYearRepair.rate = Number(parseFloat(twoYearRepair.repairNum / total * 100).toFixed(2)) + '%';
    threeYearRepair.rate = Number(parseFloat(threeYearRepair.repairNum / total * 100).toFixed(2)) + '%';
    const totalSnLen = oneYearRepair.data.length + twoYearRepair.data.length + threeYearRepair.data.length;
    const repairAgainLen = [...new Set([ ...oneYearRepair.data, ...twoYearRepair.data, ...threeYearRepair.data ])].length;
    const againRate = Number(parseFloat((totalSnLen - repairAgainLen) / totalSnLen * 100).toFixed(2)) + '%';
    return {
        code: 200,
        msg: '查询成功',
        data: {
            total,
            againRate,
            oneYearRepair,
            twoYearRepair,
            threeYearRepair,
        },
    };
}

this.updateRem = async params => {
    const { id, rem } = params;
    await Repairs.update({ rem }, { where: { id } });
    return { code: 200, msg: '备注更新成功' };
}