const serviceCloudDisk = require('../service/cloudDisk');
const url = require('url');
const base = require('../service/base');
const service = require('../service/service');

exports.cloudDiskIndex = async (req, res, next) => {
    const { user_id_arr, admin_id } = req.session;
    const params = url.parse(req.url, true).query;
    if (admin_id) {
        params.pageSize = params.pageSize ? params.pageSize : 10;
        const result = await serviceCloudDisk.getListByUpdateTime(params);
        result.data.data.forEach((items, index) => {
            result.data.data[index].uploadTime = DATETIME(items.uploadTime);
        });
        const wrapData = {
            list: result.data.data,
            totalSize: result.data.totalSize,
            totalNum: result.data.total,
            isAdmin: 1,
        };
        if (req.headers.accept.indexOf('application/json') !== -1) {
            res.send(wrapData);
        } else {
            res.render('./pages/memberCloudDiskIndex', wrapData);
        }
        return;
    }
    if (!user_id_arr || user_id_arr.length === 0) {
        res.render('./pages/tip', { tip: '暂无资源' });
        return;
    }
    const uid = user_id_arr[0];
    params.uid = uid;
    const result = await serviceCloudDisk.getListByUid(params);
    if (result.code === -1) {
        res.render('./pages/tip', { tip: result.msg });
    } else {
        result.data.data.forEach((items, index) => {
            result.data.data[index].uploadTime = DATETIME(items.uploadTime);
        });
        const wrapData = {
            list: result.data.data,
            totalSize: result.data.totalSize,
            totalNum: result.data.totalNum,
            isAdmin: 0,
        };
        if (req.headers.accept.indexOf('application/json') !== -1) {
            res.send(wrapData);
        } else {
            res.render('./pages/memberCloudDiskIndex', wrapData);
        }
    }
}

exports.getPublicList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceCloudDisk.getPublicList(params);
    result.data.data.forEach((items, index) => {
        result.data.data[index].uploadTime = DATETIME(items.uploadTime);
    });
    res.send(result);
}

exports.cloudDiskInfo = async (req, res, next) => {
    const { fileId } = url.parse(req.url, true).query;
    const result = await serviceCloudDisk.getSourceById({ _id: fileId });
    if (result.code === -1) {
        res.render('./pages/tip', { tip: result.msg });
        return;
    }
    result.data.uploadTime = DATETIME(result.data.uploadTime);
    res.render('./pages/memberCloudDiskInfo', {
        info: result.data,
        httpSrc: ROUTER(),
    });
}

exports.getListByUpdateTime = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceCloudDisk.getListByUpdateTime(params);
    res.send(result);
}

// 星标
exports.star = async (req, res, next) => {
    const params = req.body;
    const result = await serviceCloudDisk.star(params);
    res.send(result);
}

exports.downloadFile = async (req, res, next) => {
    const { fileId, picId } = req.params;
    const result = await serviceCloudDisk.downloadFile({ _id: fileId, picId });
    if (result.code === 200) {
        result.data = base.AESCrypto.aesEncrypt(result.data);
    }
    res.send(result);
}

exports.batchCreate = async (req, res, next) => {
    const { userIdArr, fileIdArr, type, remark } = req.body;
    const { admin_id } = req.session;
    const result = await serviceCloudDisk.batchCreate({ userIdArr, fileIdArr, type, remark, admin_id });
    res.send(result);
}

exports.del = async (req, res, next) => {
    const { fileId } = req.params;
    const result = await serviceCloudDisk.del({ _id: fileId });
    res.send(result);
}

/************************************************* 刻盘管理 **************************************************/

/**
 * 已刻盘列表
 */
exports.getList = async (req, res) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceCloudDisk.getList(params);
    res.send(result);
}

/**
 * 指定刻盘
 */
exports.getTargetBurnDisk = async (req, res) => {
    const { _id } = req.params;
    const result = await serviceCloudDisk.getTargetBurnDisk({ _id });
    res.send(result);
}

/**
 * 删除指定刻盘
 */
exports.deleteTargetBurnDisk = async (req, res) => {
    const { _id } = req.params;
    const result = await serviceCloudDisk.deleteTargetBurnDisk({ _id });
    res.send(result);
}

/**
 * 获取应用软件->安装包下的工程列表
 */
exports.getRootInstallPackList = async (req, res) => {
    const result = await serviceCloudDisk.getRootInstallPackList();
    res.send(result);
}

/**
 * 新增一份补丁表
 */
exports.createPackageTable = async (req, res) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceCloudDisk.createPackageTable(params);
    res.send(result);
}

/**
 * 复制一份补丁表
 */
exports.copyPackageTable = async (req, res) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceCloudDisk.copyPackageTable(params);
    res.send(result);
}

/**
 * 更新适用客户
 */
exports.updateInfo = async (req, res) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceCloudDisk.updateInfo(params);
    res.send(result);
}

/**
 * 依赖升级
 */
exports.updateDependenciesToLatest = async (req, res) => {
    const { admin_id } = req.session;
    const params = req.body;
    params.admin_id = admin_id;
    const result = await serviceCloudDisk.updateDependenciesToLatest(params);
    res.send(result);
}

/**
 * 获取可用的依赖列表
 */
exports.getDependenciesList = async (req, res) => {
    const result = await serviceCloudDisk.getDependenciesList();
    res.send(result);
}

/**
 * 打包
 */
exports.buildSoft = async (req, res) => {
    const { _id } = req.params;
    const result = await serviceCloudDisk.buildSoft({ _id });
    if (result.code === 200) {
        result.data = base.AESCrypto.aesEncrypt(result.data);
    }
    res.send(result);
}

exports.buildSoftBySn = async (req, res) => {
    const { sn } = req.params;
    const { unionid, code, user_code_arr, admin_id } = req.session;
    const userCode = code || user_code_arr; // 兼容官网和微信
    if (!admin_id && (!userCode || !userCode.includes(10001))) {
        // 验证该访问者是否有权访问
        // 商务会员，dealer指向该会员所在单位
        // 个人会员，dealer指向该会员的user_id
        const r = await service.checkSnAccess(unionid, sn);
        if (!r) {
            res.send({ code: -1, msg: '无权限访问' });
            return;
        }
    }
    const result = await serviceCloudDisk.buildSoftBySn({ sn });
    if (result.code === 200) {
        result.data = base.AESCrypto.aesEncrypt(result.data);
    }
    res.send(result);
}

/**
 * 打包单个依赖
 */
exports.buildDependency = async (req, res) => {
    const params = req.body;
    const { _id } = req.params;
    params._id = _id;
    const result = await serviceCloudDisk.buildDependency(params);
    if (result.code === 200) {
        result.data = base.AESCrypto.aesEncrypt(result.data);
    }
    res.send(result);
}

/**
 * 下载
 */
exports.downloadSoftDisk = async (req, res) => {
    const { id } = req.params;
    try {
        const path = base.AESCrypto.aesDecrypt(id);
        res.download(path);
    } catch (e) {
        res.send(e.message);
    }
}