/**
 * 文档库的删除和更新对外发布，需要check
 * 软件更改对外发布和状态，需要check
 * 图库的删除和更新对外发布，需要check
 * 文档库的替换更新需要重新size
 * 软件库的替换需要重新size
 * 图库的照片改变需要重新size
 */

/**
 * 软件1 -> 软件2 -> 软件3
 * 当软件2被云盘引用时，无法更新size，也不能限制必须状态合法
 */

const CloudDisk = require('../mongoModel/CloudDisk');
const SubEventContent = require('../mongoModel/SubEventContent');
const DocLib = require('../dao').DocLib;
const BaseEvent = require('../dao').BaseEvent;
const Customers = require('../dao').Customers;
const fs = require('fs');
const bluebird = require('bluebird');
const base = require('./base');
const Gallery = require('../dao').Gallery;
const GallerySub = require('../dao').GallerySub;
const serviceHomeSoftProject = require('./homeSoftProject');
const BurnDisk = require('../mongoModel/BurnDisk');
const child_process = require('child_process');
const SoftProject = require('../dao').SoftProject;
const serviceHomeFileSys = require('./homeFileSys');
const crypto = require('crypto');
const { promisify } = require("util");
const AssembleDiskPacking = require('../dao').AssembleDiskPacking;

async function getSoftInfo(id) {
    const targetRecord = await serviceHomeSoftProject.findTargetFile(id);
    id = targetRecord.dataValues.id;
    const eventEntity = await BaseEvent.findOne({ where: { id } });
    if (!eventEntity) {
        return {};
    }
    const { contentId, time, person } = eventEntity.dataValues;
    const result = await new Promise(resolve => {
        SubEventContent.findById(contentId, (err, result) => {
            resolve(result);
        });
    });
    if (!result || result.softTestStatus === '关闭' || result.softTestStatus === '被替换' || result.softIsRelease === false) {
        return {};
    }
    result.uploadPerson = person;
    result.uploadTime = time;
    return result;
}

async function getSoftSize(id) {
    const result = await getSoftInfo(id);
    return result.softPackageSize ? result.softPackageSize : 0;
}

async function getDocInfo(id) {
    const result = await DocLib.findOne({ where: { id } });
    if (!result || result.isdel == 1 || result.isRelease == 0) {
        return {};
    }
    return result.dataValues;
}

async function getDocSize(id) {
    const result = await getDocInfo(id);
    let size = 0;
    if (JSON.stringify(result) === '{}') {
        return size;
    }
    const { originalName, suffixName } = result;
    size = await new Promise(resolve => {
        fs.stat(DIRNAME + '/downloads/selfDoc/' + originalName + suffixName, (err, result) => {
            let size = 0;
            if (!err) {
                size = result.size;
            }
            resolve(size);
        });
    });
    return size;
}

async function getGalleryInfo(id) {
    const result = await Gallery.findOne({
        include: {
            model: GallerySub,
            where: { isdel: 0 },
        },
        where: { id },
    });
    if (!result || result.isdel == 1 || result.isRelease == 0) {
        return {};
    }
    return result.dataValues;
}

async function getGallerySize(id) {
    const result = await getGalleryInfo(id);
    let size = 0;
    if (JSON.stringify(result) === '{}') {
        return size;
    }
    const list = await GallerySub.findAll({ where: { gallery_id: id, isdel: 0 } });
    list.forEach(items => size += Number(items.dataValues.size));
    return size;
}

async function trans(result) {
    const staffMapper = new base.StaffMap().getStaffMap();
    const customerMapper = {};
    const customerList = await Customers.findAll({ attributes: ['user_id', 'company'] });
    customerList.forEach(items => customerMapper[items.dataValues.user_id] = items.dataValues.company);
    for (let i = 0; i < result.length; i++) {
        const { docLibId, softId, galleryId, installDiskId, userId } = result[i];
        result[i].type = '';
        result[i].fileName = '';
        result[i].suffixName = '';
        result[i].uploadPerson = result[i].createdPerson;
        result[i].uploadTime = result[i].createdAt;
        result[i].size = 0;
        if (docLibId) {
            result[i].type = '文档';
            result[i].fileName = result[i].docLibInfo.name;
            result[i].suffixName = result[i].docLibInfo.suffixName;
            // result[i].uploadPerson = result[i].docLibInfo.updatePerson;
            // result[i].uploadTime = result[i].docLibInfo.updateTime;
            result[i].size = result[i].docSize;
            // 文档特有属性
            result[i].originalName = result[i].docLibInfo.originalName;
            delete result[i].docLibInfo;
        } else if (softId) {
            result[i].type = '软件';
            result[i].fileName = splitFileName(result[i].softInfo.softPackage).fileName;
            result[i].suffixName = splitFileName(result[i].softInfo.softPackage).suffixName;
            // result[i].uploadPerson = result[i].softInfo.uploadPerson;
            // result[i].uploadTime = result[i].softInfo.uploadTime;
            result[i].size = result[i].softSize;
            // 软件特有属性
            result[i].version = result[i].softInfo.softVersionNo;
            delete result[i].softInfo;
        } else if (galleryId) {
            result[i].type = '图库';
            result[i].fileName = result[i].galleryInfo.name;
            result[i].suffixName = '.gallery';
            // result[i].uploadPerson = result[i].galleryInfo.updatePerson;
            // result[i].uploadTime = result[i].galleryInfo.updateTime;
            result[i].size = result[i].gallerySize;
            // 图库特有属性
            result[i].picList = await getPicArr(galleryId);
        } else if (installDiskId) {
            result[i].type = '安装盘';
            result[i].fileName = result[i].installDiskInfo.diskName;
            result[i].suffixName = '.installDisk';
            result[i].size = result[i].installDiskSize;
        }
        try {
            result[i].uploadPerson = staffMapper[result[i].uploadPerson].user_name;
        } catch (e) {

        }
        if (result[i].isCustomer && customerMapper[userId]) {
            result[i].customer = customerMapper[userId];
        } else {
            result[i].customer = userId;
        }
    }
    return result;

    function splitFileName(totalName) {
        let index = totalName.lastIndexOf('.');
        if (index === -1) {
            index = totalName.length;
        }
        const fileName = totalName.slice(0, index);
        const suffixName = totalName.slice(index, totalName.length);
        return { fileName, suffixName };
    }

    async function getPicArr(gallery_id) {
        const list = await GallerySub.findAll({ where: { isdel: 0, gallery_id } });
        const picArr = list.map(items => ({
            id: items.dataValues.id,
            album: items.dataValues.album,
        }));
        return picArr;
    }
}

async function searchFileName(keywords) {
    let docLibIdArr = [], galleryIdArr = [], softIdArr = [], installDiskIdArr = [];
    const docLibList = await DocLib.findAll({ attributes: ['id'], where: { isdel: 0, name: { $like: '%' + keywords + '%' } } });
    docLibIdArr = docLibList.map(items => items.dataValues.id);

    const galleryList = await Gallery.findAll({ attributes: ['id'], where: { isdel: 0, name: { $like: '%' + keywords + '%' } } });
    galleryIdArr = galleryList.map(items => items.dataValues.id);

    softIdArr = await new Promise(resolve => {
        SubEventContent.find({
            softPackage: {
                $regex: new RegExp(keywords, 'i'),
            },
        }, {}, async (err, result) => {
            const _idArr = result.map(items => items.id);
            const softIdList = await BaseEvent.findAll({ attributes: ['id'], where: { contentId: { $in: _idArr }, isdel: 0 } });
            const softIdArr = softIdList.map(items => items.dataValues.id);
            resolve(softIdArr);
        });
    });

    installDiskIdArr = await new Promise(resolve => {
        BurnDisk.find({ diskName: { $regex: new RegExp(keywords, 'i') }}, {}, (err, result) => {
            const installDiskIdArr = result.map(items => items._id);
            resolve(installDiskIdArr);
        });
    });

    return {
        docLibIdArr,
        galleryIdArr,
        softIdArr,
        installDiskIdArr,
    };
}

exports.getPublicList = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const keywords = params.keywords || '';
    const findConditions = { isCustomer: false, isdel: false };
    if (keywords) {
        const { docLibIdArr, galleryIdArr, softIdArr, installDiskIdArr } = await searchFileName(keywords);
        findConditions.$or = [];
        findConditions.$or.push({ docLibId: { $in: docLibIdArr } });
        findConditions.$or.push({ galleryId: { $in: galleryIdArr } });
        findConditions.$or.push({ softId: { $in: softIdArr } });
        findConditions.$or.push({ installDiskId: { $in: installDiskIdArr } });
    }
    let result;
    try {
        result = await new Promise((resolve, reject) => {
            CloudDisk.find(findConditions, {}, {
                sort: { _id: -1 },
                limit: pageSize,
                skip: (page - 1) * pageSize,
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(JSON.stringify(res)));
                }
            });
        });
    } catch (e) {
        return { code: -1, msg: e.message };
    }
    await bluebird.map(result, async (items, index) => {
        const _p = [];
        _p[index] = new Promise(async resolve => {
            const ind = index;
            const { docLibId, softId, galleryId, installDiskId } = items;
            if (docLibId) {
                result[ind].docLibInfo = await getDocInfo(docLibId);
            } else if (softId) {
                result[ind].softInfo = await getSoftInfo(softId);
            } else if (galleryId) {
                result[ind].galleryInfo = await getGalleryInfo(galleryId);
            } else if (installDiskId) {
                const { data } = await this.getTargetBurnDisk({ _id: installDiskId }, true);
                result[ind].installDiskInfo = data;
            }
            resolve();
        });
        await Promise.all(_p);
    }, { concurrency: 15 });
    result = await trans(result);
    return { code: 200, data: { data: result } };
}

// 根据uid获取列表
exports.getListByUid = async params => {
    const { uid } = params;
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const keywords = params.keywords || '';
    const findConditions = { userId: Number(uid), isdel: false };
    if (keywords) {
        const { docLibIdArr, galleryIdArr, softIdArr, installDiskIdArr } = await searchFileName(keywords);
        findConditions.$or = [];
        findConditions.$or.push({ docLibId: { $in: docLibIdArr } });
        findConditions.$or.push({ galleryId: { $in: galleryIdArr } });
        findConditions.$or.push({ softId: { $in: softIdArr } });
        findConditions.$or.push({ installDiskId: { $in: installDiskIdArr } });
    }
    let result;
    try {
        result = await new Promise((resolve, reject) => {
            CloudDisk.find(findConditions, {}, {
                sort: { _id: -1 },
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    res = res.sort((a, b) => Boolean(b.isStar) - Boolean(a.isStar));
                    res = res.splice((page - 1) * pageSize, pageSize);
                    resolve(JSON.parse(JSON.stringify(res)));
                }
            });
        });
    } catch (e) {
        return { code: -1, msg: e.message };
    }
    await bluebird.map(result, async (items, index) => {
        const _p = [];
        _p[index] = new Promise(async resolve => {
            const ind = index;
            const { docLibId, softId, galleryId, installDiskId } = items;
            if (docLibId) {
                result[ind].docLibInfo = await getDocInfo(docLibId);
            } else if (softId) {
                result[ind].softInfo = await getSoftInfo(softId);
            } else if (galleryId) {
                result[ind].galleryInfo = await getGalleryInfo(galleryId);
            } else if (installDiskId) {
                const { data } = await this.getTargetBurnDisk({ _id: installDiskId }, true);
                result[ind].installDiskInfo = data;
            }
            resolve();
        });
        await Promise.all(_p);
    }, { concurrency: 15 });
    const totalSize = await new Promise(resolve => {
        CloudDisk.aggregate([{
            $match: findConditions,
        }, {
            $group: {
                _id: "$userId",
                totalDocSize: { $sum: "$docSize" },
                totalSoftSize: { $sum: "$softSize" },
                totalGallerySize: { $sum: "$gallerySize" },
            }
        }], (err, docs) => {
            let totalSize = 0;
            if (docs.length !== 0) {
                totalSize = docs[0].totalDocSize + docs[0].totalSoftSize + docs[0].totalGallerySize;
            }
            resolve(totalSize);
        });
    });
    const totalNum = await new Promise(resolve => {
        CloudDisk.countDocuments(findConditions, (err, res) => {
            resolve(res);
        });
    });
    result = await trans(result);
    return { code: 200, data: { data: result, totalSize, totalNum } };
}

// 根据更新时间获取资源列表
exports.getListByUpdateTime = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const keywords = params.keywords || '';
    const filter = params.filter ? JSON.parse(params.filter) : {};
    const findConditions = {
        // isCustomer: true,
        isdel: false,
    };
    if (keywords) {
        const customerList = await Customers.findAll({ attributes: ['user_id'], where: { isdel: 0, company: { $like: '%' + keywords + '%' } } });
        const userIdArr = customerList.map(items => items.dataValues.user_id);
        findConditions.$or = [];
        findConditions.$or.push({ userId: { $in: userIdArr } });

        const { docLibIdArr, galleryIdArr, softIdArr, installDiskIdArr } = await searchFileName(keywords);
        findConditions.$or.push({ docLibId: { $in: docLibIdArr } });
        findConditions.$or.push({ galleryId: { $in: galleryIdArr } });
        findConditions.$or.push({ softId: { $in: softIdArr } });
        findConditions.$or.push({ installDiskId: { $in: installDiskIdArr } });
    }
    if (filter.type) {
        if (filter.type === '软件') {
            findConditions.softId = { $exists: true };
        } else if (filter.type === '文档') {
            findConditions.docLibId = { $exists: true };
        } else if (filter.type === '图库') {
            findConditions.galleryId = { $exists: true };
        }
    }
    let result;
    try {
        result = await new Promise((resolve, reject) => {
            CloudDisk.find(findConditions, {}, {
                sort: { createdAt: -1 },
                limit: pageSize,
                skip: (page - 1) * pageSize,
            }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(JSON.stringify(res)));
                }
            });
        });
    } catch (e) {
        return { code: -1, msg: e.message };
    }
    await bluebird.map(result, async (items, index) => {
        const _p = [];
        _p[index] = new Promise(async resolve => {
            let ind = index;
            const { docLibId, softId, galleryId, installDiskId } = items;
            if (docLibId) {
                result[ind].docLibInfo = await getDocInfo(docLibId);
            } else if (softId) {
                result[ind].softInfo = await getSoftInfo(softId);
            } else if (galleryId) {
                result[ind].galleryInfo = await getGalleryInfo(galleryId);
            } else if (installDiskId) {
                const { data } = await this.getTargetBurnDisk({ _id: installDiskId }, true);
                result[ind].installDiskInfo = data;
            }
            resolve();
        });
        await Promise.all(_p);
    }, { concurrency: 15 });
    // await bluebird.map(result, async (items, index) => {
    //     const { docLibId, softId, galleryId, installDiskId } = items;
    //     if (docLibId) {
    //         result[index].docLibInfo = await getDocInfo(docLibId);
    //     } else if (softId) {
    //         result[index].softInfo = await getSoftInfo(softId);
    //     } else if (galleryId) {
    //         result[index].galleryInfo = await getGalleryInfo(galleryId);
    //     } else if (installDiskId) {
    //         const { data } = await this.getTargetBurnDisk({ _id: installDiskId });
    //         result[index].installDiskInfo = data;
    //     }
    // }, { concurrency: 15 });
    const totalNum = await new Promise(resolve => {
        CloudDisk.countDocuments(findConditions, (err, res) => {
            resolve(res);
        });
    });
    result = await trans(result);
    return { code: 200, data: { data: result, total: totalNum } };
}

// 根据id直接获取云资源
exports.getSourceById = async params => {
    const { _id } = params;
    let result;
    try {
        result = await new Promise((resolve, reject) => {
            CloudDisk.findOne({ _id }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(JSON.stringify(res)));
                }
            });
        });
    } catch (e) {
        return { code: -1, msg: e.message };
    }
    if (!result) {
        return { code: -1, msg: '不存在' };
    }
    const { docLibId, softId, galleryId, installDiskId } = result;
    if (docLibId) {
        result.docLibInfo = await getDocInfo(docLibId);
    } else if (softId) {
        result.softInfo = await getSoftInfo(softId);
    } else if (galleryId) {
        result.galleryInfo = await getGalleryInfo(galleryId);
    } else if (installDiskId) {
        const { data } = await this.getTargetBurnDisk({ _id: installDiskId });
        result.installDiskInfo = data;
    }
    result = await trans([result]);
    return { code: 200, msg: '', data: result[0] };
}

// 星标
exports.star = async params => {
    const { _id, star } = params;
    await new Promise(resolve => {
        CloudDisk.updateOne({ _id }, { $set: { isStar: star } }, (err, result) => resolve(result));
    });
    return { code: 200, msg: '操作成功' };
}

// 下载文件
exports.downloadFile = async params => {
    const { _id, picId } = params;
    const self = this;
    const record = await new Promise(resolve => {
        CloudDisk.findById(_id, (err, result) => resolve(result));
    });
    if (!record || record.isdel) {
        return { code: -1, msg: '不存在' };
    }
    let result;
    if (record.docLibId) {
        result = await getPath('doc', record.docLibId);
    } else if (record.softId) {
        result = await getPath('soft', record.softId);
    } else if (record.galleryId) {
        result = await getPath('gallery', record.galleryId, picId);
    } else if (record.installDiskId) {
        result = await getPath('installDisk', record.installDiskId);
    }
    if (result.code === 200) {
        // 下载次数加++
        await new Promise(resolve => {
            CloudDisk.updateOne({ _id }, { $inc: { downloadCount: 1 } }, () => resolve());
        });
    }
    return result;

    async function getPath(type, id, picId) {
        const template = {
            _checkIsExist: function (result) {
                if (JSON.stringify(result) === '{}') {
                    return { code: -1, msg: '不存在' };
                }
                return { code: 200 };
            },
            doc: async function (id) {
                const result = await getDocInfo(id);
                const checkRes = this._checkIsExist(result);
                if (checkRes.code === -1) {
                    return checkRes;
                }
                const { originalName, suffixName } = result;
                return { code: 200, data: DIRNAME + '/downloads/selfDoc/' + originalName + suffixName };
            },
            soft: async function (id) {
                const result = await getSoftInfo(id);
                const checkRes = this._checkIsExist(result);
                if (checkRes.code === -1) {
                    return checkRes;
                }
                const { softPackage } = result;
                return { code: 200, data: DIRNAME + '/downloads/notiClient/' + softPackage };
            },
            gallery: async function (id, picId) {
                const result = await getGalleryInfo(id);
                const checkRes = this._checkIsExist(result);
                if (checkRes.code === -1) {
                    return checkRes;
                }
                const picEntity = await GallerySub.findOne({ where: { id: picId } });
                const { album } = picEntity.dataValues;
                return { code: 200, data: DIRNAME + '/public/img/gallery/' + album };
            },
            installDisk: async function(id) {
                const result = await self.buildSoft({ _id: id });
                return result;
            },
        };
        return await template[type](id, picId);
    }
}

// 新增单个云盘文件
this._create = async params => {
    const { userId, type, fileId, remark, createdPerson, isPublic } = params;
    const conditions = { userId, isdel: false };
    const formData = {
        userId,
        isCustomer: isPublic ? false : true,
        downloadCount: 0,
        remark,
        createdPerson,
    };
    await addShortCut(userId, type, fileId);
    if (type === 'doc') {
        conditions.docLibId = fileId;
        const size = await getDocSize(fileId);
        formData.docLibId = fileId;
        formData.docSize = size;
    } else if (type === 'soft') {
        conditions.softId = fileId;
        const size = await getSoftSize(fileId);
        formData.softId = fileId;
        formData.softSize = size;
    } else if (type === 'gallery') {
        conditions.galleryId = fileId;
        const size = await getGallerySize(fileId);
        formData.galleryId = fileId;
        formData.gallerySize = size;
    } else if (type === 'installDisk') {
        conditions.installDiskId = fileId;
        formData.installDiskId = fileId;
        formData.installDiskSize = 0;
    }
    const isExist = await new Promise(resolve => {
        CloudDisk.findOne(conditions, (err, res) => resolve(res));
    });
    if (isExist) {
        return { code: -1, msg: '已存在' };
    }
    await new Promise(resolve => {
        CloudDisk.create(formData, () => resolve());
    });
    return { code: 200, msg: '新增成功' };
}

// 批量新增
exports.batchCreate = async params => {
    const { userIdArr, fileIdArr, type, remark, admin_id } = params;
    if (userIdArr.length === 0) {
        await bluebird.map(fileIdArr, async fileId => {
            await this._create({ type, fileId, remark, createdPerson: admin_id, isPublic: true });
        }, { concurrency: 1 });
    } else {
        await bluebird.map(userIdArr, async userId => {
            await bluebird.map(fileIdArr, async fileId => {
                await this._create({ userId, type, fileId, remark, createdPerson: admin_id });
            }, { concurrency: 1 });
        }, { concurrency: 1 });
    }
    return { code: 200, msg: '操作成功' };
}

// 文档库发生更新时，重新计算size
exports.updateDocSize = async params => {
    const { docLibId } = params;
    const size = await getDocSize(docLibId);
    await new Promise(resolve => {
        CloudDisk.updateOne({ docLibId }, { $set: { docSize: size } }, (err, result) => resolve(result));
    });
    return { code: 200, msg: '更新成功' };
}

// 软件库发生替换时，重新计算size
exports.updateSoftSize = async params => {
    const { softId } = params;
    const size = await getSoftSize(softId);
    // 找到根
    const rootFile = await serviceHomeSoftProject.findRootFile(softId);
    await new Promise(resolve => {
        CloudDisk.updateOne({ softId: rootFile.dataValues.id }, { $set: { softSize: size } }, (err, result) => resolve(result));
    });
    return { code: 200, msg: '更新成功' };
}

// 图库发生更新时，重新计算size
exports.updateGallerySize = async params => {
    const { galleryId } = params;
    const size = await getGallerySize(galleryId);
    await new Promise(resolve => {
        CloudDisk.updateOne({ galleryId }, { $set: { gallerySize: size } }, (err, result) => resolve(result));
    });
    return { code: 200, msg: '更新成功' };
}

// 删除指定文件
exports.del = async params => {
    const { _id } = params;
    await new Promise(resolve => {
        CloudDisk.updateOne({ _id }, { $set: { isdel: true } }, (err, result) => resolve(result));
    });
    // 移除快捷方式
    await removeShortCut(_id);
    return { code: 200, msg: '删除成功' };
}

// 检查指定资源id是否在云盘
this.checkExistInDisk = async params => {
    const { type, fileId } = params;
    const conditions = { isdel: false };
    if (type === 'doc') {
        conditions.docLibId = fileId;
    } else if (type === 'soft') {
        conditions.softId = fileId;
    } else if (type === 'gallery') {
        conditions.galleryId = fileId;
    } else if (type === 'installDisk') {
        conditions.installDiskId = fileId;
    }
    const isExist = await new Promise(resolve => {
        CloudDisk.findOne(conditions, (err, res) => resolve(res));
    });
    if (isExist) {
        return { code: -1, msg: '已存在' };
    }
    return { code: 200, msg: '不存在' };
}

// 添加快捷方式
async function addShortCut(userId, type, fileId) {
    if (!userId) {
        return;
    }
    if (type === 'doc') {
        const docLibEntity = await getDocInfo(fileId);
        if (JSON.stringify(docLibEntity) === '{}') {
            return;
        }
        const { shareUserId } = docLibEntity;
        let shareUserIdArr;
        try {
            shareUserIdArr = shareUserId.split(',').filter(items => items);
        } catch (e) {
            shareUserIdArr = [];
        }
        shareUserIdArr.push(userId);
        shareUserIdArr = [...new Set(shareUserIdArr)];
        await DocLib.update({ shareUserId: shareUserIdArr.join() }, { where: { id: fileId } });
    } else if (type === 'gallery') {
        const galleryEntity = await getGalleryInfo(fileId);
        if (JSON.stringify(galleryEntity) === '{}') {
            return;
        }
        const { shareUserId } = galleryEntity;
        let shareUserIdArr;
        try {
            shareUserIdArr = shareUserId.split(',').filter(items => items);
        } catch (e) {
            shareUserIdArr = [];
        }
        shareUserIdArr.push(userId);
        shareUserIdArr = [...new Set(shareUserIdArr)];
        await Gallery.update({ shareUserId: shareUserIdArr.join() }, { where: { id: fileId } });
    } else if (type === 'soft') {
        const mongoRes = await getSoftInfo(fileId);
        if (JSON.stringify(mongoRes) === '{}') {
            return;
        }
        let softShareUserId = mongoRes.softShareUserId ? mongoRes.softShareUserId : [];
        softShareUserId.push(userId);
        softShareUserId = [...new Set(softShareUserId)];
        await new Promise(resolve => {
            SubEventContent.updateOne({ _id: mongoRes._id }, { $set: { softShareUserId } }, (err, result) => resolve(result));
        });
    }
}

// 移除快捷方式
async function removeShortCut(fileId) {
    const cloudDiskEntity = await new Promise(resolve => {
        CloudDisk.findOne({ _id: fileId }, (err, res) => resolve(res));
    });
    const { docLibId, softId, galleryId, userId } = cloudDiskEntity;
    if (!userId) {
        return;
    }
    if (docLibId) {
        const docLibEntity = await getDocInfo(docLibId);
        const { shareUserId } = docLibEntity;
        if (!shareUserId) {
            return;
        }
        let shareUserIdArr;
        try {
            shareUserIdArr = shareUserId.split(',').filter(items => items);
        } catch (e) {
            shareUserIdArr = [];
        }
        shareUserIdArr = shareUserIdArr.filter(items => items != userId);
        await DocLib.update({ shareUserId: shareUserIdArr.join() }, { where: { id: docLibId } });
    } else if (galleryId) {
        const galleryEntity = await getGalleryInfo(galleryId);
        const { shareUserId } = galleryEntity;
        if (!shareUserId) {
            return;
        }
        let shareUserIdArr;
        try {
            shareUserIdArr = shareUserId.split(',').filter(items => items);
        } catch (e) {
            shareUserIdArr = [];
        }
        shareUserIdArr = shareUserIdArr.filter(items => items != userId);
        await Gallery.update({ shareUserId: shareUserIdArr.join() }, { where: { id: galleryId } });
    } else if (softId) {
        const mongoRes = await getSoftInfo(softId);
        if (JSON.stringify(mongoRes) === '{}') {
            return;
        }
        let softShareUserId = mongoRes.softShareUserId ? mongoRes.softShareUserId : [];
        softShareUserId = softShareUserId.filter(items => items != userId);
        await new Promise(resolve => {
            SubEventContent.updateOne({ _id: mongoRes._id }, { $set: { softShareUserId } }, (err, result) => resolve(result));
        });
    }
}

/*
 *@Description: 判断指定客户的指定安装盘是否已存在
 *@MethodAuthor: zhangligang
 *@Date: 2020-12-11 11:04:29
*/
exports.findOrCreateInstallDisk = async params => {
    const { installDiskId, userId, remark, admin_id } = params;
    const findOne = promisify(CloudDisk.findOne).bind(CloudDisk);
    const result = await findOne({ installDiskId, userId, isdel: false });
    if (result) {
        return false;
    }
    await this._create({ userId, type: 'installDisk', fileId: installDiskId, remark, createdPerson: admin_id });
    return true;
}

exports.findByCustom = async params => {
    const findOne = promisify(CloudDisk.findOne).bind(CloudDisk);
    const result = await findOne(params);
    return result;
}

/************************************************* 刻盘管理 **************************************************/

async function burnDiskTrans(result) {
    const customerList = await Customers.findAll({ where: { isdel: 0 } });
    const customerMapper = {};
    customerList.forEach(items => customerMapper[items.user_id] = items.cn_abb);
    await bluebird.map(result, async items => {
        const { projectPrimaryId, userIds } = items;
        const customerArr = [];
        userIds.forEach(items => {
            if (customerMapper[items]) {
                customerArr.push({ user_id: items, cn_abb: customerMapper[items] });
            } else {
                customerArr.push({ user_id: items, cn_abb: cn_abb });
            }
        });
        items.customerList = customerArr;
        const { projectId, projectTitle } = await SoftProject.findOne({ where: { id: projectPrimaryId } });
        items.projectId = projectId;
        items.projectTitle = projectTitle;
    }, { concurrency: 5 });
    return result;
}

// 检查指定资源id是否在依赖中
exports.checkExistInDependency = async params => {
    const { type, fileId } = params;
    const conditions = { isdel: false, 'dependencies.id': fileId, 'dependencies.type': type };
    if (type === 'doc') {
        conditions['dependencies.type'] = 'docLib';
    }
    const isExist = await new Promise(resolve => {
        BurnDisk.findOne(conditions, (err, res) => resolve(res));
    });
    if (isExist) {
        return { code: -1, msg: '已存在' };
    }
    return { code: 200, msg: '不存在' };
}

/**
 * 已刻盘列表
 */
exports.getList = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.num ? Number(params.num) : 30;
    const keywords = params.keywords || '';
    const filter = params.filter ? (typeof params.filter === 'string' ? JSON.parse(params.filter) : params.filter) : {};
    const findCondition = { isdel: false };
    if (keywords) {
        findCondition.diskName = { $regex: new RegExp(keywords) };
    }
    const { projectId } = filter;
    if (projectId) {
        let projectIdArr;
        try {
            projectIdArr = projectId.split(',').filter(items => items);
        } catch (e) {
            projectIdArr = [];
        }
        let projectPrimaryIdArr = await SoftProject.findAll({ attributes: ['id'], where: { isdel: 0, projectId: { $in: projectIdArr } } });
        projectPrimaryIdArr = projectPrimaryIdArr.map(items => items.dataValues.id);
        findCondition.projectPrimaryId = { $in: projectPrimaryIdArr };
    }
    const result = await new Promise(resolve => {
        BurnDisk.find(findCondition, {}, {
            sort: { updatedAt: -1 },
            limit: pageSize,
            skip: (page - 1) * pageSize,
        }, (err, result) => {
            resolve(JSON.parse(JSON.stringify(result)));
        });
    });
    const totalNum = await new Promise(resolve => {
        BurnDisk.countDocuments(findCondition, (err, res) => resolve(res));
    });
    const data = await burnDiskTrans(result);
    return { code: 200, data: { data, total: totalNum, id_arr: [] } };
}

/**
 * 指定刻盘
 */
this.getTargetBurnDisk = async (params, noTrans) => {
    const { _id } = params;
    const result = await new Promise(resolve => {
        BurnDisk.findOne({ _id }, (err, result) => {
            resolve(JSON.parse(JSON.stringify(result)));
        });
    });
    let data;
    if (noTrans) {
        data = [result];
    } else {
        data = await burnDiskTrans([result]);
    }
    return { code: 200, data: data[0] };
}

/**
 * 删除指定刻盘
 */
exports.deleteTargetBurnDisk = async params => {
    const { _id } = params;
    const result = await this.checkExistInDisk({ type: 'installDisk', fileId: _id });
    if (result.code === -1) {
        return { code: -1, msg: '被云盘引用，无法删除' };
    }
    await new Promise(resolve => {
        BurnDisk.updateOne({
            _id
        }, {
            $set: {
                isdel: true,
            },
        }, () => resolve());
    });
    return { code: 200, msg: '删除成功' };
}

/**
 * 获取应用软件->安装包下的工程列表
 */
exports.getRootInstallPackList = async () => {
    const list = await new Promise(resolve => {
        serviceHomeSoftProject.getListByProjectTitle({
            listLevel: 2,
            clsName: '安装包',
        }, result => {
            const res = result.data.map(items => ({
                projectPrimaryId: items.dataValues.id,
                projectId: items.dataValues.projectId,
                projectTitle: items.dataValues.projectTitle,
            }));
            resolve(res);
        });
    });
    return { code: 200, msg: '', data: list };
}

/**
 * 新增一份补丁表
 */
exports.createPackageTable = async params => {
    const { projectPrimaryId, remark, admin_id } = params;
    // 盘名默认为工程标题
    const { projectTitle } = await SoftProject.findOne({ where: { id: projectPrimaryId } });
    // 检查盘名是否重复
    const diskName = await new Promise(resolve => {
        BurnDisk.findOne({ diskName: projectTitle }, (err, result) => {
            if (!result) {
                resolve(projectTitle);
            } else {
                resolve(projectTitle + Date.now());
            }
        });
    });
    await new Promise(resolve => {
        BurnDisk.create({
            projectPrimaryId,
            diskName,
            dependencies: [],
            userIds: [],
            createdPerson: admin_id,
            updatedPerson: admin_id,
            remark,
        }, () => resolve());
    });
    return { code: 200, msg: '创建成功' };
}

/**
 * 复制一份补丁表
 */
exports.copyPackageTable = async params => {
    const { _id, admin_id } = params;
    const doc = await new Promise(resolve => {
        BurnDisk.findOne({ _id, isdel: false }, (err, res) => resolve(res));
    });
    if (!doc) {
        return { code: -1, msg: '源文件不存在' };
    }
    const { projectTitle } = await SoftProject.findOne({ where: { id: doc.projectPrimaryId } });
    const diskName = projectTitle + Date.now();
    const newDoc = {
        projectPrimaryId: doc.projectPrimaryId,
        userIds: doc.userIds,
        diskName,
        dependencies: doc.dependencies,
        remark: doc.remark,
        createdPerson: admin_id,
        updatedPerson: admin_id,
    };
    await new Promise(resolve => {
        BurnDisk.create(newDoc, () => resolve());
    });
    return { code: 200, msg: '复制成功' };
}

/**
 * 更新
 */
exports.updateInfo = async params => {
    const { _id, userIds, dependencies, remark, diskName, admin_id } = params;
    // 检查diskName是否冲突
    const isExist = await new Promise(resolve => {
        BurnDisk.findOne({ diskName, _id: { $ne: _id } }, (err, result) => resolve(result));
    });
    if (isExist) {
        return { code: -1, msg: '盘名冲突' };
    }
    await new Promise(resolve => {
        BurnDisk.updateOne({
            _id
        }, {
            $set: {
                diskName,
                userIds,
                dependencies,
                remark,
                updatedPerson: admin_id,
            },
        }, () => resolve());
    });
    return { code: 200, msg: '更新成功' };
}

/**
 * 依赖升级
 */
exports.updateDependenciesToLatest = async params => {
    const { idArr, admin_id } = params;
    const softArr = await serviceHomeSoftProject._getTotalOpenSoft();
    await bluebird.map(idArr, async _id => {
        const { data } = await this.getTargetBurnDisk({ _id });
        const { dependencies } = data;
        for (let i = 0; i < dependencies.length; i++) {
            const { type, name, version } = dependencies[i];
            if (type !== 'soft') {
                continue;
            }
            for (let j = 0; j < softArr.length; j++) {
                if (name === softArr[j].projectId) {
                    if (version !== softArr[j].softVersionNo) {
                        dependencies[i].id = softArr[j].id;
                        dependencies[i].version = softArr[j].softVersionNo;
                        dependencies[i].description = softArr[j].softCreateDescription;
                    }
                    break;
                }
            }
        }
        await new Promise(resolve => {
            BurnDisk.updateOne({ _id }, { $set: { dependencies, updatedPerson: admin_id }}, () => resolve());
        });
    }, { concurrency: 5 });
    return { code: 200, msg: '升级成功' };
}

/**
 * 获取可用的依赖列表
 */
exports.getDependenciesList = async () => {
    // 软件
    const softArr = await serviceHomeSoftProject._getTotalOpenSoft();
    // 文档
    const docLibArr = await serviceHomeFileSys.getTotalOpenDocList();
    // 图库
    const galleryArr = await serviceHomeFileSys.getTotalOpenGalleryList();
    return { code: 200, data: { soft: softArr, docLib: docLibArr, gallery: galleryArr }};
}

/**
 * 打包下载
 */
this.buildSoft = async params => {
    const { _id } = params;
    let fileHashCode;
    const checkRes = await preCheckBuild(_id);
    if (checkRes.code === -1) {
        return checkRes;
    }
    const { filePathArr } = checkRes.data;
    const diskName = await new Promise(resolve => {
        BurnDisk.findOne({ _id }, (err, res) => {
            let { diskName, remark } = res;
            if (remark) {
                diskName += `（${remark}）`;
            }
            resolve(diskName);
        });
    });
    try {
        fileHashCode = hashFileHeadInfo(filePathArr);
        // 检查是否存在已打包完成的
        const cacheFilePath = `${DIRNAME}/downloads/temp/cache-build-${fileHashCode}/${diskName}.zip`;
        if (fs.existsSync(cacheFilePath)) {
            return { code: 200, msg: '打包成功', data: cacheFilePath };
        }
    } catch (e) {

    }
    /*********************************************************************************************/
    // 生成临时文件夹
    let targetPath = DIRNAME + '/downloads/temp';
    targetPath += '/build-' + _id + '-' + Date.now();
    try {
        fs.mkdirSync(targetPath);
    } catch (e) {

    }
    targetPath += '/' + diskName;
    try {
        fs.mkdirSync(targetPath);
    } catch (e) {

    }
    // 解压
    let buildFail = false, failMessage;
    for (let i = 0; i < filePathArr.length; i++) {
        const { relativePath, path } = filePathArr[i];
        try {
            if (/(.zip|.rar)$/.test(path)) {
                await uncompress(path, targetPath, relativePath);
            } else {
                copyFile(path, targetPath, relativePath);
            }
        } catch (e) {
            buildFail = true;
            failMessage = e.message;
            break;
        }
    }
    if (buildFail) {
        return { code: -1, msg: failMessage };
    }
    const zipPathName = targetPath + '.zip';
    try {
        if (fs.existsSync(zipPathName)) {
            fs.unlinkSync(zipPathName); //删除压缩包, 实际不会发生
        }
        await compress(targetPath);
    } catch (e) {
        buildFail = true;
        failMessage = e.message;
    }
    // 把临时文件全部删了
    delDir(targetPath);
    if (buildFail) {
        return { code: -1, msg: failMessage };
    }
    /************************************************************************************************/
    // 把打包完成的文件存放到缓存中，之后的请求可以直接进行下载
    let cacheFilePath = `${DIRNAME}/downloads/temp/cache-build-${fileHashCode}`;
    try {
        fs.mkdirSync(`${DIRNAME}/downloads/temp/cache-build-${fileHashCode}`);
    } catch (e) {

    }
    cacheFilePath += `/${diskName}.zip`;
    fs.copyFileSync(zipPathName, cacheFilePath);
    return { code: 200, msg: '打包成功', data: zipPathName };

    function makeRelativeDir(targetPath, relativePath) {
        if (relativePath) {
            let relativePathArr;
            try {
                relativePathArr = relativePath.split('/').filter(items => items);
            } catch (e) {
                relativePathArr = [];
            }
            for (let i = 0; i < relativePathArr.length; i++) {
                // relativePathArr[i] = relativePathArr[i].trim();
                targetPath += '/' + relativePathArr[i];
                try {
                    fs.mkdirSync(targetPath);
                } catch (e) {

                }
            }
        }
        return targetPath;
    }

    async function copyFile(path, targetPath, relativePath) {
        const index = path.lastIndexOf('/');
        if (index === -1) {
            throw new Error(`${path}错误`);
        }
        const len = path.length;
        const fileName = path.slice(index, len);
        targetPath = makeRelativeDir(targetPath, relativePath);
        fs.copyFileSync(path, targetPath + fileName);
    }

    async function uncompress(path, targetPath, relativePath) {
        targetPath = makeRelativeDir(targetPath, relativePath);
        await new Promise((resolve, reject) => {
            const cmdStr = `winrar x -o+ -inul "${path}" "${targetPath}"`;
            child_process.exec(cmdStr, (e, stdout) => {
                if (e) {
                    reject(e);
                }
                resolve();
            });
        });
    }

    async function compress(targetPath) {
        await new Promise((resolve, reject) => {
            const cmdStr = `winrar a -inul -ep1 "${targetPath}.zip" "${targetPath}"`;
            child_process.exec(cmdStr, (e, stdout) => {
                if (e) {
                    reject(e);
                }
                resolve();
            });
        });
    }

    function delDir(path) {
        let files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach((file, index) => {
                let curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) {
                    delDir(curPath); //递归删除文件夹
                } else {
                    fs.unlinkSync(curPath); //删除文件
                }
            });
            fs.rmdirSync(path);
        }
    }

    function hashFileHeadInfo(filePathArr) {
        let str = '';
        for (let i = 0; i < filePathArr.length; i++) {
            const { path, name } = filePathArr[i];
            try {
                const result = fs.statSync(path);
                const mtime = String(Date.parse(result.mtime));
                str += `${name}${mtime}`;
            } catch (e) {
                throw e;
            }
        }
        const hash = crypto.createHash('MD5');
        hash.update(str);
        return hash.digest('hex');
    }
}

/**
 * 根据sn打包下载
 */
this.buildSoftBySn = async params => {
    const { sn } = params;
    const assembleDiskPackingEntity = await AssembleDiskPacking.findOne({ where: { sn, isdel: 0 } });
    if (!assembleDiskPackingEntity) {
        return { code: -1, msg: '不存在' };
    }
    const { install_disk_id } = assembleDiskPackingEntity.dataValues;
    return this.buildSoft({ _id: install_disk_id });
}

/**
 * 打包单个依赖
 */
exports.buildDependency = async params => {
    const { _id, type, fileId } = params;
    const res = await preCheckBuild(_id);
    if (res.code === -1) {
        return { code: -1, msg: '打包失败' };
    }
    const { filePathArr } = res.data;
    const selectedItem = filePathArr.filter(items => items.type === type && items.id == fileId)[0];
    return { code: 200, msg: '打包成功', data: selectedItem.path };
}

// 预打包检查，返回各依赖和文件路径
async function preCheckBuild(_id) {
    const doc = await new Promise(resolve => {
        BurnDisk.findOne({ _id, isdel: false }, (err, res) => resolve(res));
    });
    if (!doc) {
        return { code: -1, msg: '找不到源文件' };
    }
    const filePathArr = [];
    // 找到基础安装包
    const { projectPrimaryId, dependencies } = doc;
    const installPackage = await new Promise(resolve => {
        serviceHomeSoftProject.getVersionListById({
            soft_project_id: projectPrimaryId,
            typeArr: ['1202'],
        }, result => resolve(result.data[0]));
    });
    if (!installPackage) {
        return { code: -1, msg: '找不到基础安装包' };
    }
    const installPackagePath = DIRNAME + '/downloads/notiClient/' + installPackage.subContent.softPackage;
    const installPackageIsExist = await new Promise(resolve => {
        fs.exists(installPackagePath, exists => resolve(exists));
    });
    if (!installPackageIsExist) {
        return { code: -1, msg: '找不到基础安装包' };
    }
    filePathArr.push({ relativePath: '/', path: installPackagePath });
    // 找到所有依赖
    let dependencyExist = true, notFoundDependency = '';
    for (let i = 0; i < dependencies.length; i++) {
        try {
            const pathRes = await getDependenciesPath(dependencies[i]);
            if (pathRes instanceof Array) {
                pathRes.forEach(path => filePathArr.push(path));
            } else {
                filePathArr.push(pathRes);
            }
        } catch (e) {
            dependencyExist = false;
            notFoundDependency = e.message;
            break;
        }
    }
    if (!dependencyExist) {
        return { code: -1, msg: notFoundDependency };
    }
    return { code: 200, data: { filePathArr, projectPrimaryId } };

    // 获取依赖的路径
    async function getDependenciesPath(dependency) {
        const { type, name, id, relativePath, picId } = dependency;
        if (type === 'soft') {
            let result;
            try {
                result = await getSoftInfo(id);
            } catch (e) {
                throw e;
            }
            if (result.softPackage) {
                dependency.path = DIRNAME + '/downloads/notiClient/' + result.softPackage;
                return dependency;
            } else {
                throw new Error(`获取${name}失败`);
            }
        } else if (type === 'docLib') {
            let result;
            try {
                result = await getDocInfo(id);
            } catch (e) {
                throw e;
            }
            if (result.originalName) {
                dependency.path = DIRNAME + '/downloads/selfDoc/' + result.originalName + result.suffixName;
                return dependency;
            } else {
                throw new Error(`获取${name}失败`);
            }
        } else if (type === 'gallery') {
            let result;
            try {
                result = await getGalleryInfo(id);
            } catch (e) {
                throw e;
            }
            const pathArr = [];
            if (result.name) {
                result.GallerySubs.forEach(items => {
                    const { id, album } = items.dataValues;
                    if (picId.includes(id)) {
                        dependency.path = DIRNAME + '/public/img/gallery/' + album;
                        pathArr.push(dependency);
                    }
                });
                if (pathArr.length === 0) {
                    throw new Error(`图库照片为空`);
                } else {
                    return pathArr;
                }
            } else {
                throw new Error(`获取${name}失败`);
            }
        }
        throw new Error(`不支持的类型：${type}`);
    }
}
exports.preCheckBuild = preCheckBuild;