const fs = require('fs');
const sequelize = require('../dao').sequelize;
const SoftProject = require('../dao').SoftProject;
const SoftVersion = require('../dao').SoftVersion;
const SoftEvaluation = require('../dao').SoftEvaluation;
const Affair = require('../dao').Affair;
const RespoAffair = require('../dao').RespoAffair;
const ProjectAffair = require('../dao').ProjectAffair;
const SmallAffair = require('../dao').SmallAffair;
const base = require('./base');
const serviceHomeNotiSystem = require('./homeNotiSystem');
const Staff = require('../dao').Staff;
const common = require('./common');
const BaseEvent = require('../dao').BaseEvent;
const SubEventContent = require('../mongoModel/SubEventContent');
const bluebird = require('bluebird');
const serviceCloudDisk = require('./cloudDisk');

/**
 * 生成异常对象
 * 工厂模式
 */
const createError = (obj) => {
    const error = new Error(obj.msg);
    error.code = obj.code;
    return error;
}

/**
 * 异常返回处理
 * @param {object} e 
 */
const responseError = (e) => {
    if (!e.code) e.code = -1;
    if (!e.data) e.data = [];
    if (e.code == -1) LOG(e);
    return {
        code: e.code,
        msg: e.message,
        data: e.data
    };
}

/**
 * 异常map
 */
const errorMapper = {
    isExist: {
        code: -11001,
        msg: '项目名已存在'
    },
    developNotNull: {
        code: -11002,
        msg: '开发人员不能为空'
    },
    versionMustNeed: {
        code: -11003,
        msg: '版本号不能为空'
    },
    projectIdMustNeed: {
        code: -11004,
        msg: '项目id不能为空'
    },
    versionExist: {
        code: -11005,
        msg: '该版本已存在'
    },
    testStatusNotAllow: {
        code: -11006,
        msg: '当前测试状态不允许对外发布'
    },
    notExist: {
        code: -11007,
        msg: '不存在'
    },
};

/**
 * 根据更新事件获取列表
 */
this.getListByUpdateTime = (params, cb) => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const that = this;
    BaseEvent.findAndCountAll({
        where: {
            isdel: 0,
            type: { '$in': ['1201', '1202', '1203', '1204'] },
        },
        order: [['time', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    }).then(result => {
        const { rows, count } = result;
        const _p = [];
        const staffMap = new base.StaffMap().getStaffMap();
        rows.forEach((items, index) => {
            const i = index;
            _p[index] = new Promise((resolve, reject) => {
                that.getUpdateSummary({ contentId: items.dataValues.contentId, type: items.dataValues.type }, mongoRes => {
                    let updateSummary = '', softPackage, softPackageSize = 0, softVersionNo, softChildVersionName = '';
                    ; if (mongoRes.code == 200) {
                        updateSummary = mongoRes.data.updateSummary;
                        softPackage = mongoRes.data.softPackage;
                        softPackageSize = mongoRes.data.softPackageSize;
                        softVersionNo = mongoRes.data.softVersionNo;
                        softChildVersionName = mongoRes.data.softChildVersionName;
                    }
                    rows[i].dataValues.updateSummary = updateSummary;
                    rows[i].dataValues.softPackage = softPackage;
                    rows[i].dataValues.softPackageSize = softPackageSize;
                    rows[i].dataValues.softVersionNo = softVersionNo;
                    rows[i].dataValues.softChildVersionName = softChildVersionName;
                    rows[i].dataValues.type = common.eventMapper()[items.dataValues.type]['comment'];
                    rows[i].dataValues.person = staffMap[items.dataValues.person].user_name;
                    return SoftProject.findOne({
                        where: { id: items.dataValues.ownerId }
                    }).then(pRes => {
                        rows[i].dataValues.projectId = pRes.dataValues.projectId;
                        rows[i].dataValues.projectTitle = pRes.dataValues.projectTitle;
                        resolve();
                    }).catch(e => reject(e));
                });
            });
        });
        return Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: {
                    data: rows,
                    total: count,
                    id_arr: [],
                }
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 获取一级列表和二级列表
 */
this.getClsList = (params, cb) => {
    SoftProject.findAll({
        where: {
            isdel: 0
        }
    }).then(result => {
        const hashMap = {};
        result.forEach((items, index) => {
            const { firstCls, secondCls } = items.dataValues;
            if (!hashMap[firstCls]) {
                hashMap[firstCls] = [];
            }
            hashMap[firstCls].push(secondCls);
        });
        for (let key in hashMap) {
            hashMap[key] = [...new Set(hashMap[key])];
        }
        cb({
            code: 200,
            msg: '',
            data: hashMap
        });
    }).catch(e => cb(responseError(e)));
}

/** 
 * 获取开发者列表
 */
this.developList = (params, cb) => {
    SoftProject.findAll({
        where: {
            isdel: 0
        }
    }).then(result => {
        let resArr = [];
        result.forEach((items, index) => {
            let director;
            try {
                director = items.dataValues.developTeam.split(',')[0];
                resArr.push(director);
            } catch (e) {

            }
        });
        resArr = [...new Set(resArr)];
        const staffMap = new base.StaffMap().getStaffMap();
        resArr.forEach((items, index) => {
            try {
                resArr[index] = {
                    user_id: items,
                    user_name: staffMap[items].user_name
                };
            } catch (e) {
                resArr[index] = {
                    user_id: items,
                    user_name: items
                };
            }
        });
        cb({
            code: 200,
            msg: '',
            data: resArr
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 获取更新摘要
 */
this.getUpdateSummary = (params, cb) => {
    const { contentId, type } = params;
    new Promise((resolve, reject) => {
        SubEventContent.findById(contentId, (err, result) => {
            if (err) return reject(err);
            const resObj = {
                updateSummary: '',
                softPackageSize: result.softPackageSize,
                softPackage: result.softPackage,
                softVersionNo: result.softVersionNo,
                softChildVersionName: result.softChildVersionName,
            };
            if (type == '1202' || type == '1204') {
                resObj.updateSummary = result.softCreateDescription;
            } else {
                resObj.updateSummary = result.softContent;
            }
            resolve(resObj);
        });
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result,
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 创建软件工程
 */
this.createProject = (params, cb) => {
    const { projectId, projectTitle, developTeam } = params;
    SoftProject.findOne({
        where: {
            isdel: 0,
            '$or': {
                projectId,
                projectTitle
            }
        }
    }).then(result => {
        if (result) throw createError(errorMapper.isExist);
        if (!developTeam) throw createError(errorMapper.developNotNull);
        return SoftProject.create(params).then(result => {
            cb({
                code: 200,
                msg: '创建成功',
                data: result
            });
        }).catch(e => {
            throw e;
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 发布新版本
 */
this.pushNewVersion = (params, cb) => {
    const { versionNo, soft_project_id, package, admin_id } = params;
    const that = this;
    new Promise((resolve, reject) => {
        if (!versionNo) throw createError(errorMapper.versionMustNeed);
        if (!soft_project_id) throw createError(errorMapper.projectIdMustNeed);
        return new Promise((resolve, reject) => {
            // 检查该工程项目下是否已经有了该版本号
            BaseEvent.findOne({
                where: { isdel: 0, type: '1202', rem: versionNo, ownerId: soft_project_id },
            }).then(result => {
                if (result) reject(errorMapper.versionExist);
                resolve();
            }).catch(e => reject(e));
        }).then(() => {
            return new Promise((resolve, reject) => {
                that.getFilePropsByName({
                    fileName: package
                }, result => {
                    if (result.code == 200) params.packageSize = result.data;
                    resolve();
                });
            }).then(() => {
                common.createEvent({
                    headParams: {
                        person: admin_id,
                        time: TIME(),
                        type: '1202',
                        ownerId: soft_project_id,
                        rem: versionNo,
                    },
                    bodyParams: {
                        softVersionNo: versionNo,
                        softPackage: package,
                        softPackageSize: params.packageSize,
                        softCreateDescription: params.createDescription,
                        softTestStatus: '内测',
                    },
                }, result => {
                    resolve();
                });
            }).catch(e => reject(e));
        }).catch(e => reject(e));
    }).then(result => {
        cb({
            code: 200,
            msg: '发布成功',
            data: result
        });
        // 往关联事务发送消息
        sendMsgToAffair({
            createDescription: params.createDescription,
            package: params.package,
            soft_project_id: params.soft_project_id,
            createPerson: admin_id,
        });
    }).catch(e => cb(responseError(e)));

    function sendMsgToAffair(r) {
        const { createDescription, package, soft_project_id, createPerson } = r;
        SoftProject.findOne({
            where: {
                id: soft_project_id
            }
        }).then(re => {
            if (!re) throw new Error('不存在');
            const { relatedAffair } = re.dataValues;
            Affair.findOne({
                include: [RespoAffair, ProjectAffair, SmallAffair],
                where: {
                    uuid: relatedAffair,
                    isdel: 0
                }
            }).then(result => {
                if (!result) throw new Error('不存在');
                const formData = {
                    class: '',
                    content: createDescription,
                    file: package,
                    fileName: package,
                    noti_client_affair_group_uuid: relatedAffair,
                    priority: '普通',
                    votes: '已阅',
                    title: result.dataValues.name,
                    frontUrl: '/projectAffair',
                    subscriber: ''
                };
                if (result.RespoAffairs) {
                    formData.class = 'respoAffair';
                } else {
                    formData.class = 'projectAndSmallAffair';
                }
                let { team } = result.dataValues;
                const subscriberArr = [];
                const director = team.split(',')[0];
                team.split(',').forEach((items, index) => {
                    if (items != createPerson) subscriberArr.push(items);
                });
                formData.subscriber = subscriberArr.join();
                // 判断前端路由
                new Promise((resolve, reject) => {
                    if (formData.class == 'respoAffair') {
                        Staff.findOne({
                            where: {
                                user_id: director
                            }
                        }).then(result => {
                            const { branch } = result.dataValues;
                            if (branch == '客户关系部') {
                                formData.frontUrl = '/custRelationsAffairs';
                            } else if (branch == '生产部') {
                                formData.frontUrl = '/productsAffairs';
                            } else if (branch == '研发部') {
                                formData.frontUrl = '/researchAffairs';
                            } else {
                                formData.frontUrl = '/manageAffairs';
                            }
                            resolve();
                        }).catch(e => { throw e });
                    } else {
                        resolve();
                    }
                }).then(() => {
                    serviceHomeNotiSystem.notiClientAdd({
                        form_data: formData,
                        admin_id: createPerson
                    }, () => { });
                }).catch(e => {
                    throw e;
                });
            }).catch(e => LOG(e));
        }).catch(e => {
            throw e;
        });
    }
}

/**
 * 发布子版本
 */
this.pushNewChildVersion = async params => {
    const { soft_project_id, versionNo, childVersionName, package, createDescription, admin_id } = params;
    const packageSize = await new Promise(resolve => {
        this.getFilePropsByName({ fileName: package }, result => {
            resolve(result.data);
        });
    });
    const checkResult = await new Promise(async resolve => {
        const allList = await BaseEvent.findAll({
            where: { type: { $in: ['1204'] }, ownerId: soft_project_id },
        });
        const _p = [];
        let code = 200, mongoId;
        allList.forEach((items, index) => {
            _p[index] = new Promise(resolve => {
                const { contentId } = items.dataValues;
                SubEventContent.findById(contentId, (err, result) => {
                    if (result.softChildVersionName == childVersionName) {
                        code = -1;
                        mongoId = contentId;
                    }
                    resolve();
                });
            });
        });
        await Promise.all(_p);
        resolve({ code, data: mongoId });
    });
    if (checkResult.code === -1) {
        const r = errorMapper.versionExist;
        r.data = checkResult.data;
        return r;
    }
    await new Promise(resolve => {
        common.createEvent({
            headParams: {
                person: admin_id,
                time: TIME(),
                type: '1204',
                ownerId: soft_project_id,
                rem: versionNo,
            },
            bodyParams: {
                softVersionNo: versionNo,
                softPackage: package,
                softPackageSize: packageSize,
                softCreateDescription: createDescription,
                softTestStatus: '内测',
                softChildVersionName: childVersionName,
            },
        }, result => {
            resolve();
        });
    });
    return { code: 200, msg: '发布成功' };
}

this.getList = (where, cb) => {
    const that = this;
    SoftProject.findAndCountAll({
        attributes: ['id', 'projectTitle', 'secondCls', 'isStar', 'projectId'],
        where,
        order: [['isStar', 'DESC']]
    }).then(result => {
        let { count, rows } = result;
        const _p = [];
        rows.forEach((items, index) => {
            const i = index;
            _p[index] = new Promise((resolve, reject) => {
                // 获取最新发布的版本
                const { id } = items.dataValues;
                new Promise((resolve, reject) => {
                    BaseEvent.findOne({
                        where: {
                            type: '1202',
                            ownerId: id,
                        },
                        order: [['rem', 'DESC']],
                    }).then(result => {
                        const obj = {
                            softVersionNo: '',
                            time: '',
                            updateSummary: '',
                            packageSize: 0,
                        };
                        if (!result) return resolve(obj);
                        obj.softVersionNo = result.dataValues.rem;
                        obj.time = result.dataValues.time;
                        that.getUpdateSummary({
                            contentId: result.dataValues.contentId,
                            type: result.dataValues.type,
                        }, result => {
                            if (result.code == 200) {
                                obj.updateSummary = result.data.updateSummary;
                                obj.softPackageSize = result.data.softPackageSize;
                                obj.softPackage = result.data.softPackage;
                            }
                            resolve(obj);
                        });
                    }).catch(e => reject(e));
                }).then(result => {
                    rows[i].dataValues.softVersionNo = result.softVersionNo;
                    rows[i].dataValues.time = result.time;
                    rows[i].dataValues.updateSummary = result.updateSummary;
                    rows[i].dataValues.softPackageSize = result.softPackageSize;
                    rows[i].dataValues.softPackage = result.softPackage;
                    resolve();
                }).catch(e => reject(e));
            });
        });
        return Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: rows,
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据树标题获取列表
 */
this.getListByProjectTitle = (params, cb) => {
    const { listLevel, clsName } = params;
    const that = this;
    const where = {
        isdel: 0
    };
    if (listLevel == 1) {
        where.firstCls = clsName;
    } else if (listLevel == 2) {
        where.secondCls = clsName;
    }
    this.getList(where, cb);
}

/**
 * 根据开发者获取列表
 */
this.getListByDevelop = (params, cb) => {
    const { develop } = params;
    const that = this;
    const where = {
        isdel: 0
    };
    if (develop != 0) where.developTeam = {
        '$like': develop + '%'
    };
    this.getList(where, cb);
}

/**
 * 项目星标
 */
this.isStar = (params, cb) => {
    const { isStar, id } = params;
    SoftProject.update({
        isStar
    }, {
        where: {
            id
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '操作成功',
            data: []
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据工程id获取工程属性
 */
this.getPropertyBySoftProjectId = (params, cb) => {
    const { soft_project_id } = params;
    SoftProject.findOne({
        where: {
            id: soft_project_id
        }
    }).then(result => {
        return new Promise((resolve, reject) => {
            if (result) {
                const staffMap = new base.StaffMap().getStaffMap();
                const developTeamName = [];
                try {
                    result.dataValues.developTeam.split(',').forEach((items, index) => {
                        developTeamName.push(staffMap[items].user_name);
                    });
                } catch (e) {

                }
                result.dataValues.developTeam = developTeamName.join();
                if (result.dataValues.relatedAffair) {
                    Affair.findOne({
                        where: {
                            uuid: result.dataValues.relatedAffair
                        }
                    }).then(r => {
                        result.dataValues.relatedAffair = r.dataValues.name;
                        resolve(result);
                    }).catch(e => reject(e));
                } else {
                    resolve(result);
                }
            } else {
                resolve(result);
            }
        }).then(result => {
            getLastestAndLtsVersion(soft_project_id, versionRes => {
                if (versionRes.code === 200) {
                    result.dataValues.latestVersion = versionRes.data.latestVersion;
                    result.dataValues.ltsVersion = versionRes.data.ltsVersion;
                }
                cb({
                    code: 200,
                    msg: '',
                    data: result
                });
            });
        }).catch(e => {
            throw e;
        });
    }).catch(e => cb(responseError(e)));

    function getLastestAndLtsVersion(soft_project_id, cb) {
        let latestVersion, ltsVersion;
        BaseEvent.findAll({
            where: {
                type: '1202',
                isdel: 0,
                ownerId: soft_project_id,
            }
        }).then(result => {
            const contentIdArr = result.map(items => items.dataValues.contentId);
            return new Promise((resolve, reject) => {
                SubEventContent.find({
                    _id: { $in: contentIdArr },
                }, null, {
                    sort: [[['softVersionNo', -1]]]
                }, (err, result) => {
                    if (err) return reject(err);
                    if (result.length === 0) return resolve();
                    latestVersion = result[0].softVersionNo;
                    for (let i = 0; i < result.length; i++) {
                        if (result[i].softIsRelease) {
                            ltsVersion = result[i].softVersionNo;
                            break;
                        }
                    }
                    resolve();
                });
            }).then(result => {
                cb({
                    code: 200,
                    msg: '',
                    data: {
                        latestVersion,
                        ltsVersion,
                    },
                });
            }).catch(e => { throw e });
        }).catch(e => cb(responseError(e)));
    }
}

/**
 * 修改软件工程属性
 */
this.updateProjectProperty = (params, cb) => {
    SoftProject.update(params, {
        where: {
            id: params.id
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '更新成功',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 替换包名和发布说明，并且把原来的包移除掉
 */
this.recoverVersion = (params, cb) => {
    const { versionNo, soft_project_id, package, createDescription, updatePerson } = params;
    const that = this;
    let softId;
    new Promise((resolve, reject) => {
        BaseEvent.findOne({
            where: {
                ownerId: soft_project_id,
                rem: versionNo,
                isdel: 0,
            }
        }).then(result => {
            const mongoId = result.dataValues.contentId;
            softId = result.dataValues.id;
            // SubEventContent.findOne({
            //     softVersionNo: versionNo,
            // }, (err, result) => {
            //     if (err) return reject(err);
            // const { _id } = result;
            that.getFilePropsByName({
                fileName: package
            }, result => {
                const p = {
                    softCreateDescription: createDescription,
                    softPackage: package,
                    softPackageSize: 0,
                };
                if (result.code == 200) p.softPackageSize = result.data;
                SubEventContent.updateOne({
                    _id: mongoId,
                }, p, (err, result) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            // });
        }).catch(e => reject(e));
    }).then(() => {
        cb({
            code: 200,
            msg: '覆盖成功',
            data: []
        });
        // 把person和time修改一下，用作上传人和上传时间
        BaseEvent.update({ person: updatePerson, time: TIME() }, { where: { id: softId } });
        serviceCloudDisk.updateSoftSize({ softId });
    }).catch(e => cb(responseError(e)));
}

this.recoverChildVersion = async params => {
    const { package, createDescription, mongoId, updatePerson } = params;
    await new Promise(async resolve => {
        this.getFilePropsByName({ fileName: package }, result => {
            const p = {
                softCreateDescription: createDescription,
                softPackage: package,
                softPackageSize: 0,
            };
            if (result.code == 200) p.softPackageSize = result.data;
            SubEventContent.updateOne({
                _id: mongoId,
            }, p, (err, result) => {
                resolve();
            });
        });
    });
    const record = await BaseEvent.findOne({ where: { contentId: mongoId } });
    serviceCloudDisk.updateSoftSize({ softId: record.dataValues.id });
    // 把person和time修改一下，用作上传人和上传时间
    BaseEvent.update({ person: updatePerson, time: TIME() }, { where: { id: record.dataValues.id } });
    return { code: 200, msg: '覆盖成功' };
}

/**
 * 根据文件名获取文件属性
 */
this.getFilePropsByName = (params, cb) => {
    let { fileName } = params;
    fs.stat(DIRNAME + '/downloads/notiClient/' + fileName, (err, result) => {
        if (err) {
            cb({
                code: -1,
                msg: err.message,
                data: []
            });
        } else {
            cb({
                code: 200,
                msg: '',
                data: result.size
            });
        }
    });
}

/**
 * 获取所有工程名
 */
this.getAllProjectName = (params, cb) => {
    SoftProject.findAll({
        attributes: ['projectId', 'projectTitle'],
        where: {
            isdel: 0
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据工程id获取发布，发言，测评，分版本
 */
this.getVersionListById = (params, cb) => {
    const { soft_project_id } = params;
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const typeArr = params.typeArr ? (typeof params.typeArr == 'object' ? params.typeArr : JSON.parse(params.typeArr)) : ['1201', '1202', '1203', '1204'];
    BaseEvent.findAll({
        where: {
            isdel: 0,
            type: { '$in': typeArr, },
            ownerId: soft_project_id,
        },
        order: [['time', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    }).then(result => {
        const resArr = result.map(items => items.dataValues);
        const _p = [];
        const staffMap = new base.StaffMap().getStaffMap();
        resArr.forEach((items, index) => {
            const i = index;
            _p[index] = new Promise((resolve, reject) => {
                resArr[i].person = staffMap[items.person].user_name;
                resArr[i].type = common.eventMapper()[items.type].comment;
                SubEventContent.findById(items.contentId, (err, result) => {
                    if (err) return reject(e);
                    resArr[i].subContent = result;
                    resolve();
                });
            });
        });
        return Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: resArr,
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 发言
 */
this.leaveMessage = (params, cb) => {
    const { admin_id, content, id, versionId, versionNo, softChildVersionName } = params;
    common.createEvent({
        headParams: {
            person: admin_id,
            time: TIME(),
            type: '1201',
            ownerId: id,
            rem: versionNo,
        },
        bodyParams: {
            softContent: content,
            softProjectId: versionId,
            softVersionNo: versionNo,
            softChildVersionName,
        },
    }, result => cb({
        code: 200,
        msg: '发言成功',
        data: [],
    }));
}

async function findRootFile(id) {
    const rootId = await find(id);
    const record = await BaseEvent.findOne({ where: { id: rootId } });
    const mongoRes = await new Promise(resolve => {
        SubEventContent.findOne({
            _id: record.dataValues.contentId,
        }, async (err, r) => {
            resolve(r);
        });
    });
    record.dataValues.softInfo = mongoRes;
    return record;

    async function find(softReplaceId) {
        const id = await new Promise(resolve => {
            SubEventContent.findOne({
                softReplaceId,
            }, async (err, r) => {
                if (r) {
                    const record = await BaseEvent.findOne({ where: { contentId: String(r._id) } });
                    resolve(record.dataValues.id);
                } else {
                    resolve();
                }
            });
        });
        if (id) {
            return await find(id);
        } else {
            return softReplaceId;
        }
    }
}
exports.findRootFile = findRootFile;

async function findTargetFile(id) {
    const record = await BaseEvent.findOne({ where: { id } });
    const { contentId } = record.dataValues;
    await new Promise(resolve => {
        SubEventContent.findOne({
            _id: contentId,
        }, (err, r) => {
            record.dataValues.softInfo = r;
            resolve(r);
        });
    });
    if (record.dataValues.softInfo.softReplaceId) {
        return await findTargetFile(record.dataValues.softInfo.softReplaceId);
    } else {
        return record;
    }
}
exports.findTargetFile = findTargetFile;

/**
 * 发表测评
 */
this.createTestReport = async (params, cb) => {
    const { formData, admin_id } = params;
    const { testTime, testOpinion, testAnnex, soft_project_id, versionId, versionNo, testStatus, isRelease, softChildVersionName, replaceId } = formData;
    // 找到根文件
    const rootFile = await findRootFile(versionId);
    // 找到目标文件
    const targetFile = await findTargetFile(versionId);
    // 判断根文件是否在云盘
    const result = await serviceCloudDisk.checkExistInDisk({ type: 'soft', fileId: rootFile.id });
    const r = await serviceCloudDisk.checkExistInDependency({ type: 'soft', fileId: rootFile.id });
    if (result.code === -1 || r.code === -1) {
        // 如果在云盘，目标文件和当前文件就必须为公开并且状态合法
        // 还未形成链表
        if (testStatus === '被替换' && replaceId) {
            const record = await BaseEvent.findOne({ where: { id: replaceId } });
            const { contentId } = record.dataValues;
            const mongoRes = await new Promise(resolve => {
                SubEventContent.findOne({ _id: contentId }, (err, result) => resolve(result));
            });
            const { softIsRelease, softTestStatus } = mongoRes;
            if (!softIsRelease || softTestStatus === '关闭' || softTestStatus === '被替换') {
                cb({ code: -1, msg: '请先公开目标文件' });
                return;
            }
        }
        // 已形成链表
        const { softTestStatus, softIsRelease } = targetFile.dataValues.softInfo;
        if (!softIsRelease || softTestStatus === '关闭') {
            cb({ code: -1, msg: '请先公开目标文件' });
            return;
        } else if (!isRelease || testStatus === '关闭') {
            cb({ code: -1, msg: '被云盘或安装盘引用，无法更新状态' });
            return;
        }
    }
    BaseEvent.findOne({
        where: { id: versionId, isdel: 0 }
    }).then(result => {
        const { contentId } = result.dataValues;
        let oldTestStatus, oldIsRelease;
        new Promise((resolve, reject) => {
            SubEventContent.findOne({
                _id: contentId,
            }, (err, result) => {
                if (err) return reject(err);
                oldTestStatus = result.softTestStatus;
                oldIsRelease = result.softIsRelease;
                SubEventContent.updateOne({
                    _id: contentId,
                }, {
                    softIsRelease: isRelease,
                    softTestStatus: testStatus,
                    softReplaceId: replaceId,
                }, (err, result) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        }).then(() => {
            common.createEvent({
                headParams: {
                    person: admin_id,
                    time: testTime,
                    type: '1203',
                    ownerId: soft_project_id,
                    rem: versionNo,
                },
                bodyParams: {
                    softContent: testOpinion,
                    softTestAnnex: testAnnex,
                    softProjectId: versionId,
                    softChangeTestStatus: [oldTestStatus, testStatus],
                    softChangeIsRelease: [oldIsRelease, isRelease],
                    softChildVersionName,
                    softVersionNo: versionNo,
                },
            }, result => {
                // 重新计算尺寸
                serviceCloudDisk.updateSoftSize({ softId: versionId });
                cb({
                    code: 200,
                    msg: '发表成功',
                    data: [],
                });
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 修改对外发布
 */
this.changeRelease = (params, cb) => {
    const { id, isRelease, admin_id } = params;
    BaseEvent.findOne({ where: { id } }).then(result => {
        const { contentId } = result.dataValues;
        SubEventContent.updateOne({
            _id: contentId,
        }, {
            softIsRelease: isRelease,
        }, (err, result) => {
            if (err) throw err;
            cb({
                code: 200,
                msg: '修改成功',
                data: result
            });
        });
    }).catch(e => cb(responseError(e)));
    // new Promise((resolve,reject) => {
    //     SoftVersion.findOne({
    //         where: {
    //             id
    //         }
    //     }).then(result => {
    //         const { testStatus } = result.dataValues;
    //         if(isRelease==1){
    //             if(testStatus=='稳定'){
    //                 resolve();
    //             }else{
    //                 reject(createError(errorMapper.testStatusNotAllow));
    //             }
    //         }else{
    //             resolve();
    //         }
    //     }).catch(e => reject(e));
    // }).then(() => {
    //     return SoftVersion.update({
    //         isRelease,
    //         updateTime: TIME(),
    //         updatePerson: admin_id
    //     },{
    //         where: {
    //             id
    //         }
    //     }).then(result => {
    //         cb({
    //             code: 200,
    //             msg: '修改成功',
    //             data: result
    //         });
    //     }).catch(e => {throw e});
    // }).catch(e => cb(responseError(e)));
}

/**
 * 修改测试状态
 */
this.changeTestStatus = (params, cb) => {
    const { id, testStatus } = params;
    BaseEvent.findOne({ where: { id } }).then(result => {
        const { contentId } = result.dataValues;
        SubEventContent.updateOne({
            _id: contentId,
        }, {
            softTestStatus: testStatus,
        }, (err, result) => {
            if (err) throw err;
            cb({
                code: 200,
                msg: '修改成功',
                data: result
            });
        });
    }).catch(e => cb(responseError(e)));
}

async function _getTotalOpenSoft() {
    let resArr = [];
    const projectEntityList = await SoftProject.findAll({
        where: { 
            firstCls: { $in: ['应用软件', '安可迅'] },
            secondCls: { $notIn: ['安装包'] },
            isdel: 0,
        },
    });
    await bluebird.map(projectEntityList, async items => {
        const { id, projectId, firstCls, secondCls } = items.dataValues;
        const allList = await BaseEvent.findAll({
            where: { type: { $in: ['1202'] }, ownerId: id, isdel: 0 },
        });
        await bluebird.map(allList, async it => {
            const { contentId } = it.dataValues;
            await new Promise(async resolve => {
                SubEventContent.findById(contentId, (err, result) => {
                    if (result.softIsRelease && !['被替换', '关闭'].includes(result.softTestStatus)) {
                        resArr.push({
                            id: it.dataValues.id,
                            projectId,
                            softVersionNo: result.softVersionNo,
                            softCreateDescription: result.softCreateDescription,
                            firstCls,
                            secondCls,
                            // softChildVersionName: result.softChildVersionName,
                        });
                    }
                    resolve();
                });
            });
        }, { concurrency: 5 });
    }, { concurrency: 5 });
    resArr = resArr.sort((a, b) => b.softVersionNo.localeCompare(a.softVersionNo));
    return resArr;
}
exports._getTotalOpenSoft = _getTotalOpenSoft;

/**
 * 获取对外开放的所有工程名
 * 内部软件配置
 */
this.getTotalOpenSoft = async () => {
    const resArr = await _getTotalOpenSoft();
    const resObj = {};
    resArr.forEach(items => {
        let { projectId, softVersionNo } = items;
        if (!resObj[projectId]) {
            resObj[projectId] = [];
        }
        // if (softChildVersionName) {
        //     softVersionNo = softVersionNo + softChildVersionName;
        // }
        resObj[projectId].push(softVersionNo);
    });
    return { code: 200, msg: '', data: resObj };
}

/**
 * 根据工程名获取对外开放的版本列表
 * 官网对外公开
 */
this.getOpenSoftList = async params => {
    let { projectId, typeArr } = params;
    typeArr = typeArr ? typeArr : ['1202'];
    const projectEntity = await SoftProject.findOne({
        where: {
            projectId,
            isdel: 0,
        },
    });
    if (!projectEntity) return {
        code: -1,
        msg: '不存在该工程',
        data: projectId,
    };
    const { id, usage } = projectEntity.dataValues;
    const allList = await BaseEvent.findAll({
        where: { type: { $in: typeArr }, ownerId: id },
    });
    let _p = [], resArr = [];
    allList.forEach((items, index) => {
        _p[index] = new Promise((resolve, reject) => {
            const { contentId } = items.dataValues;
            SubEventContent.findById(contentId, (err, result) => {
                if (result.softIsRelease) {
                    resArr.push({
                        softVersionNo: result.softVersionNo,
                        softPackage: result.softPackage,
                        softPackageSize: result.softPackageSize,
                        softTestStatus: result.softTestStatus,
                        softCreateDescription: result.softCreateDescription,
                        softChildVersionName: result.softChildVersionName,
                    });
                }
                resolve();
            });
        });
    });
    await Promise.all(_p);
    resArr = resArr.sort(s);
    return {
        code: 200,
        msg: '',
        data: {
            usage,
            versonArr: resArr,
            versionArr: resArr,
        },
    };

    function s(a, b) {
        return b.softVersionNo.localeCompare(a.softVersionNo);
    }
}

/**
 * 下载指定软件的指定版本
 * 官网对外公开
 */
this.downloadSoftVersion = async params => {
    // 先判断是否有该软件，再判断是否有该版本
    const { projectId, version, childVersionName } = params;
    const result = await this.getOpenSoftList({ projectId, typeArr: ['1202', '1204'] });
    if (result.code === -1) return result;
    let softPackage;
    result.data.versonArr.forEach(items => {
        if (items.softVersionNo === version) {
            if (childVersionName && childVersionName == items.softChildVersionName) {
                softPackage = items.softPackage;
            } else if (!childVersionName && !items.softChildVersionName) {
                softPackage = items.softPackage;
            }

        }
    });
    if (softPackage) {
        return {
            code: 200,
            msg: '',
            data: softPackage,
        };
    }
    return {
        code: -1,
        msg: '不存在',
        data: [],
    };
}