const url = require('url');
const serviceHomeProducts = require('../service/homeProducts');
const service = require('../service/service');
const serviceMember = require('../service/member');
const base = require('../service/base');

/**
 *  获取产品列表
 */
this.index = async (req, res, next) => {
    const params = url.parse(req.url,true).query;
    const result = await serviceHomeProducts.index(params);
    res.send(result);
}

/**
 * 获取所有库存和未入库的序列号
 */
this.getTotalInventorySn = async (req, res, next) => {
    const result = await serviceHomeProducts.getTotalInventorySn();
    res.send(result);
}

/**
 *  获取指定id产品
 */
this.show = async (req, res, next) => {
    const params = req.params;
    const result = await serviceHomeProducts.show(params);
    res.send(result);
}

this.showBySn = async (req, res, next) => {
    const { sn } = req.params;
    const result = await service.productInfoLabel(sn, true, [10001]);
    res.send(result);
}

/**
 *  删除指定id产品
 */
this.destroy = async (req, res, next) => {
    const params = req.params;
    const result = await serviceHomeProducts.destroy(params);
    res.send(result);
}

/**
 *  更新指定id产品
 */
this.update = async (req, res, next) => {
    const { id } = req.params;
    const { admin_id } = req.session;
    const params = req.body;
    params.id = id;
    params.admin_id= admin_id;
    const result = await serviceHomeProducts.update(params);
    res.send(result);
}

// 报废
this.scrapped = async (req, res, next) => {
    const { id } = req.params;
    const { admin_id } = req.session;
    const params = req.body;
    params.id = id;
    params.admin_id= admin_id;
    const result = await serviceHomeProducts.scrapped(params);
    res.send(result);
}

/**
 * 新增自费app
 */
this.addApp = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeProducts.addApp(params);
    res.send(result);
}

/**
 * 删除自费app
 */
this.delApp = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeProducts.delApp(params);
    res.send(result);
}

/**
 * 获取app
 */
this.getApp = async (req, res, next) => {
    const params = req.params;
    const result = await serviceHomeProducts.getApp(params);
    res.send(result);
}

/**
 * 获取注册历史
 */
this.getRegHistory = async (req, res, next) => {
    const { sn } = req.params;
    const result = await serviceHomeProducts.getRegHistory(sn);
    res.send(result);
}

/**
 * 来自软件客户端的新增sn请求
 * 收集用
 */
this.postCardFromClient = async (req, res, next) => {
    const { serialNo } = req.body;
    const result = await service.postCardFromClient(serialNo);
    res.send(result);
}

/**
 * 获取虚拟产品列表
 */
this.getVirtualList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeProducts.getVirtualList(params);
    res.send(result);
}

this.remoteSearchUserId = async (req, res, next) => {
    const { keywords } = url.parse(req.url, true).query;
    const result = await serviceMember.remoteSearchUserId({ keywords });
    res.send({
        code: 200,
        msg: '',
        data: result,
    });
}

/**
 * 新增转手记录
 */
this.addResaleRecord = async (req, res, next) => {
    const { admin_id } = req.session;
    const { sn, user_id } = req.body;
    const result = await serviceHomeProducts.addResaleRecord({ admin_id, sn, user_id });
    res.send(result);
}

/**
 * 新增判定记录
 */
this.addJudgeRecord = async (req, res, next) => {
    const { admin_id } = req.session;
    const { sn, user_id } = req.body;
    const result = await serviceHomeProducts.addJudgeRecord({ admin_id, sn, user_id });
    res.send(result);
}

this.addCtrlInfo = async (req, res, next) => {
    const { admin_id } = req.session;
    const params = req.body;
    params.admin_id = admin_id;
    const result = await serviceHomeProducts.addCtrlInfo(params);
    res.send(result);
}

/******************************************* 其它产品 ********************************************/
this.otherProducts = {
    getList: async (req, res, next) => {
        const params = url.parse(req.url, true).query;
        const result = await serviceHomeProducts.otherProducts.getList(params);
        res.send(result);
    },
    add: async (req, res, next) => {
        const params = req.body;
        const { admin_id } = req.session;
        params.admin_id = admin_id;
        const result = await serviceHomeProducts.otherProducts.add(params);
        res.send(result);
    },
    edit: async (req, res, next) => {
        const { id } = req.params;
        const params = req.body;
        const { admin_id } = req.session;
        params.admin_id = admin_id;
        params.id = id;
        const result = await serviceHomeProducts.otherProducts.edit(params);
        res.send(result);
    },
    del: async (req, res, next) => {
        const { id } = req.params;
        const result = await serviceHomeProducts.otherProducts.del({ id });
        res.send(result);
    },
    uploadAlbum: async (req, res, next) => {
        const mulUploadImg = new base.MulUploadImg('/public/img/otherProducts');
        mulUploadImg.upload(req,(name,fields) => {
            res.send({
                code: 200,
                msg: '上传成功',
                data: [name]
            });
            mulUploadImg.resize();
            mulUploadImg.smallSize();
            mulUploadImg.anySize(104);
        });
    },
};