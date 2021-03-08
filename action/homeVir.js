const url = require('url');
const Member = require('../dao').Member;
const Staff = require('../dao').Staff;
const fs = require('fs');
const request = require('request');
const serviceVir = require('../service/homeVir');
const serviceCustomers = require('../service/homeCustomers');
const iconv = require("iconv-lite");
const jschardet = require("jschardet");

/*******************************************************************************************/

// 解析公共模板
exports.parsePublicCfg = async (req, res, next) => {
    const file = req.file;
    const { path, filename } = file;
    const title = req.body.fileTitle;
    fs.readFile(path, async (err, result) => {
        if (err) {
            res.send({
                code: -1,
                msg: '解析失败',
                data: [],
            });
            return;
        }
        let name;
        try {
            name = filename.split('.vtc.json')[0];
        } catch (e) {
            res.send({
                code: -1,
                msg: '文件名非法',
                data: [],
            });
            return;
        }
        fs.unlink(path, () => {});
        const fileEncodeInfo = jschardet.detect(result);
        const encodeStr = fileEncodeInfo.encoding.toUpperCase();
        if (CONFIG.GBCodeArr.indexOf(encodeStr) === -1) {
            res.send({ code: -1, msg: '文件编码格式非法', data: [] });
            return;
        }
        result = iconv.decode(result, 'gbk');
        result = JSON.parse(result);
        if (title && name !== title) {
            // 检查文件名是否相同，如果不相同，则拒绝更新
            res.send({ code: -1, msg: '文件名不同', data: [] });
            return;
        } else if (!title) {
            // 检查name是否已经有了
            const checkResult = await show();
            if (checkResult.data) {
                res.send({ code: -1, msg: '该文件已存在', data: [] });
                return;
            }
        }
        // 更新配置文件
        update();

        async function update() {
            // 根据admin_id获取unionid
            const { admin_id } = req.session;
            const staffData = await Staff.findOne({ where: { user_id: admin_id, on_job: 1, isdel: 0 } });
            const { open_id } = staffData.dataValues;
            const memberData = await Member.findOne({ where: { open_id } });
            const { unionid } = memberData.dataValues;
            const updateFormData = {
                config: result,
                info: {
                    machineType: CONFIG.machineTypeOtherId,
                },
            };
            request({
                url: CONFIG.cloudApiAddr + '/vtc/cfgTemp/public/' + encodeURI(name),
                method: 'put',
                headers: {
                    Accept: 'application/json',
                    primaryunionid: unionid,
                },
                body: updateFormData,
                json: true,
            }, (err, response, body) => {
                if (err) {
                    res.send('未知错误');
                    return;
                }
                body = typeof body === 'string' ? JSON.parse(body) : body;
                res.send({
                    code: body.code,
                    msg: body.msg,
                    data: name,
                });
            });
        }

        async function show() {
            const result = await new Promise(resolve => {
                request({
                    url: CONFIG.cloudApiAddr + '/vtc/cfgTemp/label/' + encodeURI(name),
                    method: 'get',
                }, (err, response, body) => {
                    if (err) {
                        res.send('未知错误');
                        return;
                    }
                    body = typeof body === 'string' ? JSON.parse(body) : body;
                    resolve({
                        code: body.code,
                        msg: body.msg,
                        data: body.data,
                    });
                });
            });
            return result;
        }
    });
}

// 按试验机厂家分类
exports.sortByFactory = async (req, res, next) => {
    const result = await serviceVir.sortByFactory();
    res.send(result);
}

// 按适用方案分类
exports.sortBySolution = async (req, res, next) => {
    const result = await serviceVir.sortBySolution();
    res.send(result);
}

// 获取所有客户列表
exports.getAllCusList = async (req, res, next) => {
    const result = await serviceCustomers.getAllList();
    res.send(result);
}

/************************************** 20200903 威程配置模板列表 ***********************************************/
// 模板列表
// 威程配置模板列表
exports.tempList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceVir.tempList(params);
    res.send(result);
}

// 模板名称列表
// 新增实例时，选择的模板列表
exports.tempNameList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceVir.tempNameList(params);
    res.send(result);
}

// 指定模板
exports.targetTemp = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceVir.targetTemp(params);
    res.send(result);
}

// 更新模板label
exports.updateTemp = async (req, res, next) => {
    const params = req.body;
    // 根据admin_id获取unionid
    const { admin_id } = req.session;
    const staffData = await Staff.findOne({ where: { user_id: admin_id, on_job: 1, isdel: 0 } });
    const { open_id } = staffData.dataValues;
    const memberData = await Member.findOne({ where: { open_id } });
    const { unionid } = memberData.dataValues;
    params.unionid = unionid;
    const result = await serviceVir.updateTemp(params);
    res.send(result);
}

// 删除模板
exports.deleteTemp = async (req, res, next) => {
    const params = req.body;
    // 根据admin_id获取unionid
    const { admin_id } = req.session;
    const staffData = await Staff.findOne({ where: { user_id: admin_id, on_job: 1, isdel: 0 } });
    const { open_id } = staffData.dataValues;
    const memberData = await Member.findOne({ where: { open_id } });
    const { unionid } = memberData.dataValues;
    params.unionid = unionid;
    const result = await serviceVir.deleteTemp(params);
    res.send(result);
}

// 下载模板
exports.downloadTemp = async (req, res, next) => {
    const { name } = req.params;
    request(CONFIG.actionApiAddr + '/vtc/cfgTemp/label/' + encodeURIComponent(name), (err, response, body) => {
        if (err) {
            res.send('未知错误');
            return;
        }
        try {
            body = JSON.parse(body);
            const info = body.data;
            const { contentId } = body.data;
            request(CONFIG.actionApiAddr + '/vtc/cfgTemp/' + contentId, (err, response, body) => {
                try {
                    body = JSON.parse(body);
                    delete body.data._id;
                    const tempStruct = {
                        data: [
                            {
                                info,
                                config: body.data,
                            },
                        ],
                    };
                    let temp = JSON.stringify(tempStruct, null, 4);
                    const filePath = DIRNAME + '/downloads/njiFile/' + name + '.vtc.json';
                    temp = iconv.encode(Buffer.from(temp), 'gbk');
                    const writerStream = fs.createWriteStream(filePath);
                    writerStream.write(temp);
                    writerStream.end();
                    writerStream.on('finish', () =>  {
                        res.download(filePath);
                    });
                } catch (e) {
                    res.send('不存在');
                }
            });
        } catch (error) {
            res.send('不存在');
        }
    });
}

// 创建单个实例
exports.createInstance = async (req, res, next) => {
    const params = req.body;
    const { name } = req.params;
    params.name = name;
    params.admin_id = req.session.admin_id;
    const result = await serviceVir.createInstance(params);
    res.send(result);
}