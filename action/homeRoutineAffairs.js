const url = require('url');
const path = require('path');
const serviceHomeAffairs = require('../service/homeRoutineAffairs');
const base = require('../service/base');

/**
 *  例行事务新增
 */
this.respoAffairAdd = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.respoAffairAdd({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  项目事务新增
 */
this.projectAffairAdd = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.projectAffairAdd({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  小事务新增
 */
this.smallAffairAdd = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.smallAffairAdd({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  事务列表
 */
this.affairList = (req,res,next) => {
    const form_data = url.parse(req.url,true).query;
    serviceHomeAffairs.affairList(form_data,result => {
        res.send(result);
    });
}

/**
 *  事务列表（供筛选）
 */
this.listForSelect = (req,res,next) => {
    const form_data = url.parse(req.url,true).query;
    serviceHomeAffairs.listForSelect(form_data,result => {
        res.send(result);
    });
}

/**
 *  获取指定事务
 */
this.getTargetAffair = (req,res,next) => {
    const affairId = req.params.affairId;
    serviceHomeAffairs.getTargetAffair({
        affairId: affairId
    },result => {
        res.send(result);
    });
}

/**
 *  获取指定事务
 *  包括关联事务和被关联事务
 */
this.getTargetAffairSupAndSub = (req,res,next) => {
    const affairId = req.params.affairId;
    serviceHomeAffairs.getTargetAffairSupAndSub({
        affairId: affairId
    },result => {
        res.send(result);
    });
}

/**
 *  删除指定事务
 */
this.deleteTargetAffair = (req,res,next) => {
    const affairId = req.params.affairId;
    serviceHomeAffairs.deleteTargetAffair({
        affairId: affairId
    },result => {
        res.send(result);
    });
}

/**
 *  普通父类事务的更新
 *  只更新当前字段（幂等）
 */
this.affairUpdate = (req,res,next) => {
    let form_data = req.body.form_data;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.affairUpdate({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  改变事务成员（例行事务）
 */
this.changeTeamMember = (req,res,next) => {
    let form_data = req.body.form_data;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.changeTeamMember({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  改变事务成员（立项事务）
 */
this.changeProjectTeamMember = (req,res,next) => {
    let form_data = req.body.form_data;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.changeProjectTeamMember({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  改变例行事务的子字段
 *  只更新当前字段（幂等）
 */
this.respoAffairUpdate = (req,res,next) => {
    let form_data = req.body.form_data;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.respoAffairUpdate({
        form_data: form_data
    },result => {
        res.send(result);
    });
}

/**
 *  改变小事务的子字段
 *  只更新当前字段（幂等）
 */
this.smallAffairUpdate = (req,res,next) => {
    let form_data = req.body.form_data;
    let par = req.body.par;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    par = typeof(par)=='object'?par:JSON.parse(par);
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.smallAffairUpdate({
        form_data: form_data,
        par: par,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  改变项目事务的子字段
 *  只更新当前字段（幂等）
 */
this.projectAffairUpdate = (req,res,next) => {
    let form_data = req.body.form_data;
    let par = req.body.par;
    const admin_id = req.session.admin_id;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    par = typeof(par)=='object'?par:JSON.parse(par);
    serviceHomeAffairs.projectAffairUpdate({
        form_data: form_data,
        par: par,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  改变项目事务的子字段的项目进展
 *  只更新当前字段（幂等）
 */
this.childProjectAffairUpdate = (req,res,next) => {
    let form_data = req.body.form_data;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.childProjectAffairUpdate({
        form_data: form_data,
        admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  改变事务的排序
 */
this.changeViewOrder = (req,res,next) => {
    let form_data = req.body.viewOrderArr;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    serviceHomeAffairs.changeViewOrder({
        form_data: form_data
    },result => {
        res.send(result);
    });
}

/**
 *  点击关注或取关
 */
this.attentionAffair = (req,res,next) => {
    const params = req.body;
    const { uuid } = params;
    const admin_id = req.session.admin_id;
    serviceHomeAffairs.attentionAffair({
        uuid: uuid,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  改变进度
 */
this.changeDegree = (req,res,next) => {
    const { admin_id } = req.session;
    const form_data = req.body;
    serviceHomeAffairs.changeDegree({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}