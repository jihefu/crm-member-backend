const url = require('url');
const request = require('request');
const serviceHomeSoftProject = require('../service/homeSoftProject');
const serviceHomeFileSys = require('../service/homeFileSys');
const serviceHomeContracts = require('../service/homeContracts');
const base = require('../service/base');
const Member = require('../dao').Member;
const Staff = require('../dao').Staff;
const Customers = require('../dao').Customers;
const service = require('../service/service');
const open = require('../service/open');
const serviceHomeLogin = require('../service/homeLogin');
const serviceHomeSimuCtrl = require('../service/homeSimuCtrl');
const sendMQ = require('../service/rabbitmq').sendMQ;
const serviceCloudDisk = require('../service/cloudDisk');

this.getEffectUnionid = async (req, res, next) => {
    const { unionid } = req.params;
    const memberEntity = await Member.findOne({ where: { unionid } });
    const { isEffect, bind_id } = memberEntity.dataValues;
    if (isEffect) {
        res.send({
            code: 200,
            msg: '',
            data: { unionid },
        });
        return;
    }
    const actMemberEntity = await Member.findOne({ where: { open_id: bind_id } });
    const actUnionid = actMemberEntity.dataValues.unionid;
    res.send({
        code: 200,
        msg: '',
        data: { unionid: actUnionid },
    });
}

async function getUserAuthCode (unionid) {
    const result = await new Promise(async resolve => {
        const memberEntity = await Member.findOne({ where: { unionid } });
        const { open_id, company } = memberEntity.dataValues;
        const result = await service.checkPerson(open_id);
        resolve({
            code: result.code,
            open_id,
            company,
            user_id_arr: result.data.user_id_arr,
        });
    });
    return result;
}

async function createToken(unionid) {
    const memberEntity = await Member.findOne({ where: { unionid } });
    const { open_id } = memberEntity.dataValues;
    const staffEntity = await Staff.findOne({ where: { open_id, isdel: 0, on_job: 1 } });
    const roles = ['member'];
    if (staffEntity) {
        roles.push('admin');
    }
    const expiresion = 60 * 60 * 24 * 15 * 1000;
    const endDate = Date.now() + expiresion;
    const tokenRes = await serviceHomeLogin.openCreateToken({
        expiresion,
        payload: {
            unionid,
            roles,
        },
    });
    const { token } = tokenRes.data;
    return {
        endDate,
        token,
    };
}

exports.wxPlatReceiveTicket = async (req, res, next) => {
    const params = req.body;
    open.wxPlatReceiveTicket(params);
    res.send('success');
}

exports.wxGetTicket = async (req, res, next) => {
    const result = await open.wxGetTicket();
    res.send(result);
}

exports.getTicket = async (req, res, next) => {
    const ticket = parseInt(Math.random() * 1000000).toString();
    req.session.ticket = ticket;
    res.send({
        code: 200,
        msg: '',
        data: ticket,
    });
}

exports.scanCode = async (req, res, next) => {
    const { code } = req.body;
	const { wxWebLoginAppid, wxWebLoginSecret } = CONFIG;
    getOpenIdByCode(code);
    async function getOpenIdByCode(code) {
	    const cdurl = "https://api.weixin.qq.com/sns/oauth2/access_token?appid="+wxWebLoginAppid+"&secret="+wxWebLoginSecret+"&code="+code+"&grant_type=authorization_code";
	    request.get(cdurl, async (err, response, body) => {
            bodys = JSON.parse(body);
			if (bodys.errcode) {
				res.send({
					code: -1,
					msg: '登陆失败',
					data: bodys,
                });
                return;
			}
            const { unionid } = bodys;
            const result = await Member.findOne({ where: { unionid } });
            if (!result) {
                res.send({
					code: -1,
					msg: '请先在朗杰微信公众号上注册会员',
					data: bodys,
                });
                return;
            }
            const tokenRes = await createToken(unionid);
            const { token, endDate } = tokenRes;
            res.send({
                code: 200,
                msg: '登陆成功',
                data: {
                    lj_token: token,
                    endDate,
                    unionid,
                },
            });
            // 发login MQ消息
            sendMQ.sendQueueMsg('memberActivity', JSON.stringify({
                _class: 'login',
                unionid,
                appName: '官网',
            }), () => {});
	    });
	}
}

exports.checkToken = async (req, res, next) => {
    const lj_token = req.headers.lj_token;
    const result = await serviceHomeLogin.openCheckToken({ token: lj_token });
    if (result.code === 200) {
        const { unionid } = result.data;
        // if (!req.session.user_code_arr) {
            const checkResult = await getUserAuthCode(unionid);
            req.session.user_code_arr = checkResult.code;
            req.session.unionid = unionid;
            req.session.open_id = checkResult.open_id;
            req.session.company = checkResult.company;
            req.session.user_id_arr = checkResult.user_id_arr;
        // }
        next();
    } else {
        res.send(result);
    }
}

exports.checkVerCode = async (req, res, next) => {
    const { phone, verCode, appName } = req.body;
    request({
        url: CONFIG.cloudApiAddr + '/login/checkVerCode',
        method: 'post',
        form: {
            phone,
            verCode,
            appName,
        },
    }, async (err, response, body) => {
        body = typeof body === 'string' ? JSON.parse(body) : body;
        if (body.code === 200) {
            const { unionid } = body.data;
            const tokenRes = await createToken(unionid);
            const { token, endDate } = tokenRes;
            res.send({
                code: 200,
                msg: '登陆成功',
                data: {
                    lj_token: token,
                    endDate,
                    unionid,
                },
            });
        } else {
            res.send(body);
        }
    });
}

// 超级权限
async function checkIsStaff(open_id) {
    const checkRes = await open.checkIsStaff(open_id);
    if (!checkRes) return { code: -1, msg: '非法访问' };
    return { code: 200 };
}

exports.getSuperAuth = async (req, res, next) => {
    const checkRes = await checkIsStaff(req.session.open_id);
    if (checkRes.code === -1) {
        res.send(checkRes);
        return;
    }
    const result = await new Promise(resolve => {
        service.getSuperAuth({}, result => resolve(result));
    });
    res.send({
        code: 200,
        msg: '',
        data: result,
    });
}

exports.getSuperAuthMember = async (req, res, next) => {
    const checkRes = await checkIsStaff(req.session.open_id);
    if (checkRes.code === -1) {
        res.send(checkRes);
        return;
    }
    const { company } = url.parse(req.url, true).query;
    const result = await new Promise(resolve => {
        service.getSuperAuthMember({ company }, result => resolve(result));
    });
    res.send({
        code: 200,
        msg: '',
        data: result,
    });
}

exports.postSuperAuthMember = async (req, res, next) => {
    const checkRes = await checkIsStaff(req.session.open_id);
    if (checkRes.code === -1) {
        res.send(checkRes);
        return;
    }
    const params = req.body;
    const result = await new Promise(resolve => {
        service.postSuperAuthMember(params, result => resolve(result));
    });
    const { unionid } = result;
    const tokenRes = await createToken(unionid);
    const { token, endDate } = tokenRes;
    res.send({
        code: 200,
        msg: '登陆成功',
        data: {
            lj_token: token,
            endDate,
            unionid,
        },
    });
}

exports.refreshSideMenuAuth = async (req, res, next) => {
    const lj_token = req.headers.lj_token;
    const result = await serviceHomeLogin.openCheckToken({ token: lj_token });
    if (result.code === 200) {
        const { unionid } = result.data;
        const checkResult = await getUserAuthCode(unionid);
        req.session.user_code_arr = checkResult.code;
        req.session.unionid = unionid;
        req.session.open_id = checkResult.open_id;
        req.session.company = checkResult.company;
        // 只有能注册的客户才有
        req.session.user_id_arr = checkResult.user_id_arr;
        // 返回允许的菜单栏
        const r = await open.refreshSideMenuAuth(checkResult.code);
        res.send(r);
    } else {
        res.send(result);
    }
}

exports.getRepair = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.user_code_arr = req.session.user_code_arr;
    params.company = req.session.company;
    params.unionid = req.session.unionid;
    params.repairId = req.session.repairId;
    const result = await open.getRepair(params);
    res.send(result);
}

exports.repairTakeConfirm = async (req, res, next) => {
    const { no } = req.params;
    const { unionid } = req.session;
    const result = await open.repairTakeConfirm({ no, unionid });
    res.send(result);
}

exports.getRepairInfo = async (req, res, next) => {
    const { repair_contractno } = req.params;
    const user_code_arr = req.session.user_code_arr;
    const company = req.session.company;
    const unionid = req.session.unionid;
    const repairId = req.session.repairId;
    const result = await open.getRepairInfo({
        repair_contractno,
        user_code_arr,
        repairId,
        company,
        unionid,
    });
    res.send(result);
}

exports.repairPage = async (req, res, next) => {
    const ticket = req.session.ticket;
    const repair_contractno = req.params.no;
    const user_code_arr = req.session.user_code_arr;
    const company = req.session.company;
    const repairId = req.session.repairId;
    const params = url.parse(req.url, true).query;
    if (ticket == params.ticket) {
        req.session.ticket = null;
        const result = await open.getRepairInfo({
            repair_contractno,
            user_code_arr,
            company,
            repairId,
        });
        let status;
        result.data.res_arr.forEach(items => {
            if (items.column_name == 'deliver_state') {
                status = items.val;
            }
        });
        res.render('./pages/repair_info_m', {
            result: result.data.res_arr,
            status,
            showExpressBtn: false,
        });
    } else {
        res.render('./pages/tip',{
            tip: '<p>非法访问</p>'
        });
    }
}

exports.getVirCard = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.user_code_arr = req.session.user_code_arr;
    params.company = req.session.company;
    params.user_id_arr = req.session.user_id_arr;
    params.unionid = req.session.unionid;
    const result = await open.getVirCard(params);
    res.send(result);
}

exports.getVirCardInfo = async (req, res, next) => {
    const { sn } = req.params;
    const user_code_arr = req.session.user_code_arr;
    const user_id_arr = req.session.user_id_arr;
    const unionid = req.session.unionid;
    const result = await open.getVirCardInfo({
        sn,
        user_code_arr,
        user_id_arr,
        unionid,
    });
    res.send(result);
}

exports.getContract = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.user_code_arr = req.session.user_code_arr;
    params.company = req.session.company;
    params.user_id_arr = req.session.user_id_arr;
    params.unionid = req.session.unionid;
    const result = await open.getContract(params);
    res.send(result);
}

exports.getContractInfo = async (req, res, next) => {
    const { contract_no } = req.params;
    const user_code_arr = req.session.user_code_arr;
    const company = req.session.company;
    const { unionid } = req.session;
    const result = await open.getContractInfo({
        contract_no,
        user_code_arr,
        company,
        unionid,
    });
    res.send(result);
}

exports.queryExpress = async (req, res, next) => {
    const { no } = req.params;
    const result = await serviceHomeContracts.queryExpress({ no });
    res.send(result);
}

exports.contractTakeConfirm = async (req, res, next) => {
    const { no } = req.params;
    const { unionid } = req.session;
    const result = await open.contractTakeConfirm({ no, unionid });
    res.send(result);
}

exports.getCloudDiskListByUid = async (req, res, next) => {
    const { unionid } = req.session;
    const params = url.parse(req.url, true).query;
    const memberEntity = await Member.findOne({ where: { unionid } });
    const { user_id, checked, company, isStaff } = memberEntity.dataValues;
    if (isStaff == 1 && checked == 1) {
        const result = await serviceCloudDisk.getListByUpdateTime(params);
        result.data.totalNum = result.data.total;
        result.data.isAdmin = 1;
        res.send(result);
        return;
    }
    if (checked == 0) {
        params.uid = user_id;
    } else {
        const customerEntity = await Customers.findOne({ where: { isdel: 0, company } });
        const { user_id } = customerEntity.dataValues;
        params.uid = user_id;
    }
    const result = await serviceCloudDisk.getListByUid(params);
    result.data.isAdmin = 0;
    res.send(result);
}

exports.getCloudDiskPublicList = async (req, res) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceCloudDisk.getPublicList(params);
    res.send(result);
}

exports.getCloudDiskInfo = async (req, res, next) => {
    const { fileId } = url.parse(req.url, true).query;
    const result = await serviceCloudDisk.getSourceById({ _id: fileId });
    res.send(result);
}






// 指定软件的所有版本
exports.getSoftList = async (req, res, next) => {
    const { projectId } = req.params;
    const result = await serviceHomeSoftProject.getOpenSoftList({
        projectId,
    });
    res.send(result);
}

// 下载指定软件的指定版本
exports.downloadSoftVersion = async (req, res, next) => {
    const { projectId, version, childVersionName } = req.params;
    const result = await serviceHomeSoftProject.downloadSoftVersion({
        projectId,
        version,
        childVersionName,
    });
    if (result.code === -1) {
        res.send(result);
    } else {
        res.download(DIRNAME + '/downloads/notiClient/' + result.data);
    }
}

// 获取指定知识库的某一json文档
exports.getKnowlegeJson = async (req, res, next) => {
    const { id } = req.params;
    serviceHomeFileSys.getFileContent({
        id,
    }, result => {
        if (result.data.length !== 0) {
            if (result.data[0].isRelease) {
                res.send(result);
            } else {
                res.send({
                    code: -1,
                    msg: '不存在',
                    data: [],
                });
            }
        } else {
            res.send({
                code: -1,
                msg: '不存在',
                data: [],
            });
        }
    });
}

// 推荐阅读
exports.recommendReading = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await open.recommendReading(params);
    res.send(result);
}

// 近期活动
exports.recentActivity = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await open.recentActivity(params);
    res.send(result);
}

// 首页文章推荐
exports.indexArticle = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await open.indexArticle(params);
    res.send(result);
}

// 获取指定图库组的照片集合
exports.getGallery = async (req, res, next) => {
    const { galleryId } = req.params;
    serviceHomeFileSys.getGalleryGroupItem({
        id: galleryId,
    }, result => {
        if (result.code === 200 && result.data.isRelease) {
            res.send(result);
        } else {
            res.send({
                code: -1,
                msg: '不存在',
                data: galleryId,
            });
        }
    });
}

// 下载指定图库组的指定照片
exports.getGalleryImg = async (req, res, next) => {
    const { galleryId, imgId } = req.params;
    serviceHomeFileSys.getGalleryGroupItem({
        id: galleryId,
    }, result => {
        if (result.code === 200 && result.data.isRelease) {
            let imgName;
            result.data.GallerySubs.forEach(items => {
                if (items.id == imgId) {
                    imgName = items.album;
                }
            });
            if (imgName) {
                res.download(DIRNAME + '/public/img/gallery/' + imgName);
            } else {
                res.send({
                    code: -1,
                    msg: '不存在',
                    data: galleryId,
                });
            }
        } else {
            res.send({
                code: -1,
                msg: '不存在',
                data: galleryId,
            });
        }
    });
}

// 下载指定文档
exports.downloadDoc = async (req, res, next) => {
    const { docId } = req.params;
    const docEntity = await serviceHomeFileSys.getTargetDoc(docId);
    if (!docEntity) {
        res.send({
            code: -1,
            msg: '不存在',
            data: docId,
        });
    } else {
        res.download(DIRNAME + '/downloads/selfDoc/' + docEntity.originalName + docEntity.suffixName);
    }
}

// 公开的虚拟控制器列表
exports.simuCtrlList = async (req, res, next) => {
    const resArr = await simuResultDeal(req);
    res.send({ code: 200, msg: '获取成功', data: resArr });
}

async function simuResultDeal(req) {
    const params = url.parse(req.url, true).query;
    const { page, num } = params;
    const result = await serviceHomeSimuCtrl.getSimuList({
        page,
        num,
        filter: JSON.stringify({
            workState: '使用中,空闲',
            isOpen: 1,
        }),
    });
    const { data: list } = result.data;
    const resArr = list.map(items => {
        let nickname;
        if (items.dataValues.processInfo && items.dataValues.processInfo.memberInfo) {
            nickname = items.dataValues.processInfo.memberInfo.nickname;
        }
        return {
            serialNo: items.dataValues.serialNo,
            workState: items.dataValues.workState,
            solution: items.dataValues.solution,
            machineModel: items.dataValues.machineModel,
            spaUrl: items.dataValues.spaUrl,
            album: items.dataValues.album,
            nickname,
        };
    });
    return resArr;
}
exports.simuResultDeal = simuResultDeal;