const request = require('request');
const Member = require('../dao').Member;
const VirWarranty = require('../dao').VirWarranty;
const ContractsHead = require('../dao').ContractsHead;
const VirtualProducts = require('../dao').VirtualProducts;
const service = require('./service');
const common = require('./common');

async function getSnInfo(sn) {
    let cardInfo = await service.searchInfoBySn(sn);
    if (cardInfo) {
        return cardInfo;
    }
    return VirtualProducts.findOne({ where: { serialNo: sn } });
}

// 说明书信息
exports.showInfo = async params => {
    const { sn } = params;
    const cardInfo = await getSnInfo(sn);
    if (cardInfo) {
        const { machineNo, validTime, model } = cardInfo.dataValues;
        const virWarrantyEntity = await VirWarranty.findOne({ where: { sn, isdel: 0 }});
        let purchase_time, contract_no, valid_date, addr, bind_unionid;
        let name, phone;
        if (virWarrantyEntity) {
            purchase_time = virWarrantyEntity.dataValues.purchase_time;
            contract_no = virWarrantyEntity.dataValues.contract_no;
            valid_date = virWarrantyEntity.dataValues.valid_date;
            addr = virWarrantyEntity.dataValues.addr;
            bind_unionid = virWarrantyEntity.dataValues.bind_unionid;
            const memberEntity = await Member.findOne({ where: { unionid: bind_unionid }});
            name = memberEntity.dataValues.name;
            phone = memberEntity.dataValues.phone;
        } else {
            const contractEntity = await ContractsHead.findOne({ where: { isdel: 0, snGroup: { $like: '%'+sn+'%' } } });
            if (contractEntity) {
                purchase_time = contractEntity.dataValues.sign_time;
                contract_no = contractEntity.dataValues.contract_no;
            }
        }
        return {
            code: 200,
            msg: '',
            data: {
                sn,
                machineNo,
                validTime,
                model,
                contract_no,
                purchase_time,
                valid_date,
                addr,
                bind_unionid,
                name,
                phone,
            },
        };
    } else {
        return { code: -1, msg: '不存在该产品' };
    }
}

// 填写电子保修卡页面
exports.fillWarranty = async params => {
    const { sn, unionid } = params;
    const result = await VirWarranty.findOne({ where: { isdel: 0, sn }});
    if (result) return { code: -1, msg: '已存在电子保修卡' };
    const memebrEntity = await Member.findOne({ where: { unionid }});
    const { addr, name, phone } = memebrEntity.dataValues;
    // 获取合同上的购买时间
    let purchase_time, contract_no;
    const contractEntity = await ContractsHead.findOne({
        where: {
            isdel: 0,
            snGroup: { $like: '%'+sn+'%' },
        },
    });
    if (contractEntity) {
        purchase_time = contractEntity.dataValues.sign_time;
        contract_no = contractEntity.dataValues.contract_no;
    }
    return {
        code: 200,
        msg: '',
        data: {
            addr,
            name,
            phone,
            purchase_time,
            contract_no,
        },
    };
}

// 生成电子保修卡
exports.bindToVir = async params => {
    const { sn, addr, unionid } = params;
    let purchase_time = null, contract_no;
    let valid_date = null;
    const snEntity = await VirWarranty.findOne({ where: { sn, isdel: 0 }});
    if (snEntity) return { code: -1, msg: '该卡已存在电子保修单' };
    // 获取合同上的购买时间
    let contractEntity = await ContractsHead.findOne({
        where: {
            isdel: 0,
            snGroup: { $like: '%'+sn+'%' },
        },
    });
    // 2020.04.28新增
    if (!contractEntity) {
        contractEntity = await ContractsHead.findOne({
            where: {
                isdel: 0,
                otherSnGroup: { $like: '%'+sn+'%' },
            },
        });
    }
    if (contractEntity) {
        purchase_time = contractEntity.dataValues.sign_time;
        contract_no = contractEntity.dataValues.contract_no;
        const validTimeFromContract = Date.parse(purchase_time) + 60 * 60 * 24 * 1000 * 365 * 1.5;
        const validTimeFromNow = Date.now() + 60 * 60 * 24 * 1000 * 365;
        valid_date = validTimeFromContract < validTimeFromNow ? DATETIME(validTimeFromContract) : DATETIME(validTimeFromNow);
    }
    await VirWarranty.create({
        sn,
        contract_no,
        purchase_time,
        valid_date,
        addr,
        valid_range: 12,
        bind_unionid: unionid,
        insert_date: TIME(),
    });
    return { code: 200, msg: '操作成功' };
}

// 申诉
exports.snAppeal = async params => {
    const { sn, content, unionid } = params;
    const memberEntity = await Member.findOne({
        where: {
            unionid,
        }
    });
    const { name, open_id } = memberEntity;
    common.sendToMemberAffair({
        sender: open_id,
        content: name + '申请绑定'+sn+'（'+content+'）',
    });
    return {
        code: 200,
        msg: '提交成功',
    };
}