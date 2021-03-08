var express = require('express');
var url = require('url');
var path = require('path');
var notiPost = require('../service/notiPost');

/**
 *  注册名
 *  affairMail，justRead，justReadForAttention
 *  affairMail，justRead 需要投递到消息盒子中
 */

/**
 *  新增
 */
this.notiPostAdd = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    const { regName } = params;
    this.notiMailAdd(req,res,next);
}

/**
 *  更新
 */
this.notiPostUpdate = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    const { regName } = params;
    this.notiMailUpdate(req,res,next);
}

/**
 * 	事务邮件新增
 */
this.notiMailAdd = (req,res,next) => {
    const form_data = typeof(req.body.data)=='object'?req.body.data:JSON.parse(req.body.data);
    const params = url.parse(req.url,true).query;
    const { regName } = params;
    notiPost.notiMailAdd({
        form_data: form_data,
        regName: regName
    },result => {
        res.send(result);
    });
    if(regName=='affairMail'||regName=='justRead'){
        //投递到消息盒子
        notiPost.sendToMsgBox({
            action: '发布',
            form_data: form_data
        });
    }
}

/**
 *  撤回
 */
this.recall = (req,res,next) => {
    const mailId = req.params.mailId;
    notiPost.recall({
        mailId: mailId
    },result => {
        res.send(result);
    });
}

/**
 *  来自非事务系统的撤回
 */
this.recallApply = (req,res,next) => {
    const { aesStr } = req.body;
    notiPost.recallApply({
        aesStr: aesStr
    },result => {
        res.send(result);
    });
}

/**
 * 	事务邮件更新
 */
this.notiMailUpdate = (req,res,next) => {
    const form_data = typeof(req.body.data)=='object'?req.body.data:JSON.parse(req.body.data);
    const params = url.parse(req.url,true).query;
    const { regName } = params;
    notiPost.notiMailUpdate({
        form_data: form_data,
        regName: regName
    },result => {
        res.send(result);
    });
}

/**
 *  来自通知中心的更新
 */
this.fromCenterUpdate = (req,res,next) => {
    const form_data = typeof(req.body.form_data)=='object'?req.body.form_data:JSON.parse(req.body.form_data);
    let { token } = url.parse(req.url,true).query;
    token = decodeURIComponent(token);
    notiPost.fromCenterUpdate({
        form_data: form_data,
        token: token
    },result => {
        res.send(result);
    });
    //投递到消息盒子
    const admin_id = req.session.admin_id;
    notiPost.sendToMsgBox({
        action: '回复',
        form_data: form_data
    });
}

/**
 *  来自通知中心的更新reply
 */
this.fromCenterUpdateReply = (req,res,next) => {
    const form_data = typeof(req.body.form_data)=='object'?req.body.form_data:JSON.parse(req.body.form_data);
    let { token } = url.parse(req.url,true).query;
    token = decodeURIComponent(token);
    notiPost.fromCenterUpdateReply({
        form_data: form_data,
        token: token
    },result => {
        res.send(result);
    });
}

/**
 *  来自通知中心的get
 */
this.fromCenterList = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    notiPost.fromCenterList(params,result => {
        res.send(result);
    });
}