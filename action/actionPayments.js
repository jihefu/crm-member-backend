const url = require('url');
const path = require('path');
const serviceHomePayments = require('../service/homePayments');
const base = require('../service/base');

/**
 *  到账列表
 */
this.list = (req,res,next) => {
    let params = url.parse(req.url,true).query;
    serviceHomePayments.list(params,(result) => {
        res.send(result);
    });
}

/**
 *  对应公司的欠款合同
 */
this.searchContractNo = (req,res,next) => {
    let params = url.parse(req.url,true).query;
    serviceHomePayments.searchContractNo(params,(result) => {
        res.send(result);
    });
}

/**
 *  指定到账条目
 */
this.targetPaymentItem = (req,res,next) => {
    const id = req.params.id;
    serviceHomePayments.targetPaymentItem({
        id: id
    },result => {
        res.send(result);
    });
}

/**
 *  删除对应到账
 */
this.deletePayment = (req,res,next) => {
    const id = req.params.id;
    const admin_id = req.session.admin_id;
    serviceHomePayments.deletePayment({
        id: id,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  删除payuse
 */
this.deletePayUse = (req,res,next) => {
    const id = req.params.id;
    const pay_id = req.body.pay_id;
    const admin_id = req.session.admin_id;
    serviceHomePayments.deletePayUse({
        id: id,
        pay_id: pay_id,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  新增到账
 */
this.paymentAdd = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomePayments.paymentAdd({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  新增用途
 */
this.payUseAdd = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomePayments.payUseAdd({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}