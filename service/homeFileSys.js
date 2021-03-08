const xlsx = require('node-xlsx');
const fs = require('fs');
const Linq = require('linq');
const base = require('./base');
const common = require('./common');
const sequelize = require('../dao/').sequelize;
const KnowledgeTree = require('../dao/').KnowledgeTree;
const FileManage = require('../dao/').FileManage;
const FileModel = require('../mongoModel/FileModel');
const FileShooting = require('../mongoModel/FileShooting');
const FilenameModel = {};
const Gallery = require('../dao/').Gallery;
const GallerySub = require('../dao/').GallerySub;
const DocLib = require('../dao/').DocLib;
const DocLibList = require('../dao/').DocLibList;
const serviceHomeExtends = require('./homeExtends');
const serviceCloudDisk = require('./cloudDisk');

/**
 * 生成异常对象
 * 工厂模式
 */
const createError = (obj) => {
    const error =  new Error(obj.msg);
    error.code = obj.code;
    return error;
}

/**
 * 异常返回处理
 * @param {object} e 
 */
const responseError = (e) => {
    if(!e.code) e.code = -1;
    if(!e.data) e.data = [];
    if(e.code==-1) LOG(e);
    return {
        code: e.code,
        msg: e.message ? e.message : e.msg,
        data: e.data
    };
}

/**
 * 异常map
 */
const errorMapper = {
    lackParams: {
        code: -14001,
        msg: '缺少参数'
    },
    treeNotExist: {
        code: -14002,
        msg: '该目录不存在'
    },
    noAuth: {
        code: -14003,
        msg: '无权限操作'
    },
    fileNotExist: {
        code: -14004,
        msg: '该文件不存在'
    },
    fileCircleReference: {
        code: -14005,
        msg: '文件存在循环引用',
    },
    sameFileName: {
        code: -14006,
        msg: '文件名冲突',
    },
    notOrderTree: {
        code: -14007,
        msg: '请指定目录',
    },
    fileIsExist: {
        code: -14008,
        msg: '文件已存在',
    },
};

/**
 * 获取目录树
 */
this.getKnowledgeTree = (params, cb) => {
    KnowledgeTree.findAll({
        attributes: ['id', 'name', 'mainId', 'index', 'affairId'],
        where: {
            isdel: 0
        }
    }).then(result => {
        let resArr = [];
        result.forEach((items, index) => {
            if (items.dataValues.id === CONFIG.disabledAffairTreeId) items.dataValues.disabled = true;
            if (!items.dataValues.mainId) resArr.push(items);
        });
        treeSort(resArr);
        cb({
            code: 200,
            msg: '',
            data: resArr,
        });

        function treeSort(arr) {
            arr = arr.sort(s);
            for (let i = 0; i < arr.length; i++) {
                arr[i].dataValues.subTreeArr = [];
                for (let j = 0; j < result.length; j++) {
                    if (result[j].dataValues.mainId == arr[i].dataValues.id) {
                        arr[i].dataValues.subTreeArr.push(result[j]);
                    }
                }
                treeSort(arr[i].dataValues.subTreeArr);
            }
        }

        function s(a, b) {
            return a.dataValues.index - b.dataValues.index;
        }

    }).catch(e => cb(responseError(e)));
}

/**
 * 新增树
 */
this.addKnowledgeTree = (params, cb) => {
    let { mainId, name } = params;
    return new Promise((resolve, reject) => {
        if (!name) reject(errorMapper.lackParams);
        resolve();
    }).then(result => {
        if (mainId == 0) mainId = null;
        return KnowledgeTree.findAll({
            where: {
                mainId,
                isdel: 0,
            },
            order: [['index', 'DESC']],
        }).then(result => {
            let index;
            if (result.length === 0) {
                index = 0;
            } else {
                index = result[0].dataValues.index + 1;
            }
            return KnowledgeTree.create({
                mainId,
                name,
                index,
            }).then(result => {
                cb({
                    code: 200,
                    msg: '新增成功',
                    data: result
                });
            }).catch(e => {throw e});
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 删除树
 */
this.delKnowledgeTree = (params, cb) => {
    const { id } = params;
    const idArr = [ id ];

    function getAllIdArr(id, resolve) {
        return KnowledgeTree.findAll({
            where: {
                mainId: id,
                isdel: 0
            }
        }).then(result => {
            const _p = [];
            result.forEach((items, index) => {
                _p[index] = new Promise((resolve,reject) => {
                    const { id } = items.dataValues;
                    idArr.push(id);
                    if(id) return getAllIdArr(id,resolve);
                    resolve();
                });
            });
            return Promise.all(_p).then(() => resolve());
        });
    }

    new Promise((resolve,reject)=> {
        return getAllIdArr(id,resolve);
    }).then(() => {
        return KnowledgeTree.update({
            isdel: 1
        },{
            where: { id: {'$in': idArr}}
        }).then(result => {
            cb({
                code: 200,
                msg: '删除成功',
                data: []
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 重命名
 */
this.renameTree = (params, cb) => {
    const { id, name } = params;
    return KnowledgeTree.update({
        name
    },{
        where: { id }
    }).then(result => cb({
        code: 200,
        msg: '更新成功',
        data: []
    })).catch(e => cb(responseError(e)));
}

/**
 * 移动树
 */
this.removeTree = (params, cb) => {
    let { newTreeArr } = params;
    newTreeArr = typeof newTreeArr === 'object' ? newTreeArr : JSON.parse(newTreeArr);
    const _p = [];
    newTreeArr.forEach((items, index) => {
        _p[index] = new Promise((resolve, reject) => {
            return KnowledgeTree.update({
                index: items.index,
                mainId: items.mainId,
            }, {
                where: { id: items.id }
            }).then(() => resolve()).catch(e => reject(e));
        });
    });
    return Promise.all(_p).then(() => {
        cb({
            code: 200,
            msg: '更新成功',
            data: [],
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 拖到节点里面
 */
this.dragNodeIn = (params, cb) => {
    const { targetId, selfId } = params;
    return KnowledgeTree.update({
        mainId: targetId,
    }, {
        where: {
            id: selfId,
        }
    }).then(() => {
        cb({
            code: 200,
            msg: '更新成功',
            data: [],
        });
    }).catch(e => cb(responseError(e)));
}

/************************************ 快照 ******************************************* */

/**
 * 记录快照
 */
this.recordShooting = (params, cb) => {
    const { type, admin_id, time, fileHeadId, originalParams } = params;
    const { originalHeadInfo, originalContent } = originalParams;
    const obj = {
        fileHeadId,
        originalHeadInfo,
        originalContent,
        newHeadInfo: {},
        newContent: {},
        shootingPerson: admin_id,
        shootingTime: time,
        rem: '',
    };
    const staffMapper = new base.StaffMap().getStaffMap();
    const shootingPersonName = staffMapper[admin_id].user_name;
    
    new Promise((resolve, reject) => {
        return FileManage.findOne({
            where: {
                id: fileHeadId,
            }
        }).then(result => {
            obj.newHeadInfo = result.dataValues;
            const { fileId } = result.dataValues;
            FileModel.findById(fileId, (err, result) => {
                if (err) return reject(e);
                obj.newContent = result.content;
                if (type == 'delete') {
                    obj.rem = shootingPersonName + '删除了' + originalHeadInfo.name;
                    delete obj.originalHeadInfo;
                    delete obj.originalContent;
                    FileShooting.create(obj, (err, result) => {
                        if (err) reject(e);
                        resolve();
                    });
                } else {
                    return diff(resolve, reject);
                }
            });
        }).catch(e => reject(e));
    }).then(() => {
        if (cb) cb();
    }).catch(e => LOG(e));

    function diff(resolve, reject) {
        let newHeadInfo = obj.newHeadInfo, newContent = obj.newContent;
        if (originalHeadInfo.isTable) {
            obj.rem = '更新了内容';
            delete obj.originalHeadInfo;
            delete obj.originalContent;
            FileShooting.create(obj, (err, result) => {
                if (err) reject(e);
                resolve();
            });
        } else {
            // 内容进行对比
            const changeKeyArr = [], addKeyArr = [], removeKeyArr = [];
            let changeLink = false;
            for (const key in originalContent) {
                if (key == '') continue;
                if (typeof originalContent[key] === 'object' && typeof newContent[key] === 'object') {
                    if (JSON.stringify(originalContent[key]) !=  JSON.stringify(newContent[key])) {
                        changeKeyArr.push(key);
                    }
                } else {
                    if (originalContent[key] != newContent[key]) {
                        if (!newContent[key]) {
                            removeKeyArr.push(key);
                        } else {
                            changeKeyArr.push(key);
                        }
                    }
                }
            }
            for (const key in newContent) {
                if (key == '') continue;
                if (!originalContent[key]) addKeyArr.push(key);
            }
            // 引用对比
            let originalLinkArr, newLinkArr;
            try {
                originalLinkArr = originalHeadInfo.link.split(',');
            } catch (e) {
                originalLinkArr = [];
            }
            try {
                newLinkArr = newHeadInfo.link.split(',');
            } catch (e) {
                newLinkArr = [];
            }
            if (originalLinkArr.join() != newLinkArr.join()) changeLink = true;
            if (changeKeyArr.length === 0 && addKeyArr.length === 0 && removeKeyArr.length === 0 && !changeLink) {
                // 未发生变化
                resolve();
            } else {
                // 发生了变化，生成rem
                let str = '';
                if (addKeyArr.length !== 0) {
                    str += '新增了';
                    addKeyArr.forEach(items => {
                        str += items + '、';
                    });
                    str = str.slice(0, str.length - 1);
                    str += '；';
                }
                if (removeKeyArr.length !== 0) {
                    str += '移除了';
                    removeKeyArr.forEach(items => {
                        str += items + '、';
                    });
                    str = str.slice(0, str.length - 1);
                    str += '；';
                }
                if (changeKeyArr.length !== 0) {
                    str += '修改了';
                    changeKeyArr.forEach(items => {
                        str += items + '、';
                    });
                    str = str.slice(0, str.length - 1);
                    str += '；';
                }
                if (changeLink) str += '改变了引用文件；';
                obj.rem = str;
                delete obj.originalHeadInfo;
                delete obj.originalContent;
                FileShooting.create(obj, (err, result) => {
                    if (err) reject(e);
                    resolve();
                });
            }
        }
    }
}

/**
 * 搜索快照列表
 */
this.getShootingList = (params, cb) => {
    const { fileHeadId } = params;
    new Promise((resolve, reject) => {
        FileShooting.find({
            fileHeadId,
        }, [ 'shootingTime', 'shootingPerson', 'rem' ], {
            sort: [[['shootingTime', -1]]]
        }, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    }).then(result => {
        const staffMapper = new base.StaffMap().getStaffMap();
        result.forEach(items => {
            items.shootingPerson = staffMapper[items.shootingPerson].user_name
        });
        cb({
            code: 200,
            msg: '',
            data: result,
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 获取指定快照内容
 */
this.getShootingItem = (params, cb) => {
    const { _id } = params;
    const that = this;
    new Promise((resolve, reject) => {
        FileShooting.findById(_id, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    }).then(result => {
        const obj = result.newHeadInfo;
        obj.content = result.newContent;
        // 转换名字
        const staffMapper = new base.StaffMap().getStaffMap();
        let inAuthorArr = [];
        try {
            inAuthorArr = obj.author.split(',');
        } catch (e) {
            
        }
        inAuthorArr.forEach((it,ind) => {
            inAuthorArr[ind] = staffMapper[it].user_name;
        });
        obj.authorName = inAuthorArr.join();
        // 引用
        try {
            obj.link = obj.link.split(',');
        } catch (e) {
            obj.link = [];
        }
        obj.link = obj.link.filter(items => items);
        const _p = [];
        let resArr = [obj];
        obj.link.forEach((items, index) => {
            _p[index] = new Promise((resolve, reject) => {
                that.getFileContent({
                    id: items
                }, result => {
                    if (result.code === 200) {
                        resArr = [ ...resArr, ...result.data ];
                        resolve();
                    } else {
                        reject(result.msg);
                    }
                });
            });
        });
        return Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: resArr,
            });
        }).catch(e => reject(e));
    }).catch(e => cb(responseError(e)));
}

function sortStar(arr, admin_id) {
    const newArr = [];
    arr.forEach((items, index) => {
        let bookMarkArr = [];
        try {
            bookMarkArr = items.bookMark.split(',').filter(items => items);
        } catch (e) {
            bookMarkArr = [];
        }
        if (bookMarkArr.indexOf(admin_id) !== -1) {
            newArr.push(items);
            arr[index] = null;
        }
    });
    arr = arr.filter(items => items);
    const resArr = [...newArr, ...arr];
    return resArr;
}


/************************************************************************************/

/**
 * 检查文件名冲突
 */
this.checkSameFileName = (params, cb) => {
    const { id, name } = params;
    FileManage.findAll({
        where: {
            name,
            isdel: 0,
        }
    }).then(result => {
        if (result.length === 0 || (result.length === 1 && id === result[0].dataValues.id )) {
            cb(true);
        } else {
            cb(false);
        }
    }).catch(e => cb(false));
}

/**
 * 判断是否有权限操作当前文档
 */
this.checkPower = (params, cb) => {
    const { admin_id, id } = params;
    FileManage.findOne({
        where: {
            id
        },
    }).then(result => {
        const _id = result.dataValues.fileId;
        return FileManage.findOne({
            where: {
                fileId: _id,
                $or: [
                    { author: admin_id },
                    { insertPerson: admin_id },
                ],
            }
        }).then(result => {
            if (result) return cb(200);
            if (!result) cb(createError(errorMapper.noAuth));
        }).catch(e => cb(e));
    }).catch(e => cb(e));
}

/**
 * 检查是否存在循环引用
 */
this.checkCircleReference = (params, cb) => {
    let hasCircle = false;
    let { id, link } = params;
    const idArr = [];
    typeof link === 'string' ? link.split(',') : link;
    if (link.length === 0) return cb(hasCircle);
    FileManage.findOne({
        where: {
            id,
        }
    }).then(result => {
        let originLinkArr;
        try {
            originLinkArr = result.link.join();
        } catch (error) {
            originLinkArr = [];
        }
        const diffArr = [];
        // 取差集
        Linq.from(link).except(originLinkArr).forEach(i => {
            diffArr.push(i);
        });
        if (diffArr.length === 0) return cb(hasCircle);
        // 递归找出所有被引用的id_arr
        new Promise((resolve, reject) => {
            return getIdArr(diffArr, resolve, reject);
        }).then(() => {
            for (let i = 0; i < idArr.length; i++) {
                if (Number(idArr[i]) === Number(id)) {
                    return cb(!hasCircle);
                }
            }
            cb(hasCircle);
        });
    }).catch(e => LOG(e));

    function getIdArr(arr, resolve, reject) {
        const in_p = [];
        arr.forEach((items, index) => {
            in_p[index] = new Promise((resolve, reject) => {
                const itemId = items;
                return FileManage.findOne({
                    where: {
                        id: items,
                    }
                }).then(result => {
                    let resLink = result.dataValues.link;
                    if (!resLink) {
                        idArr.push(itemId);
                        resolve();
                    } else {
                        return getIdArr(resLink.split(','), resolve, reject);
                    }
                }).catch(e => reject(e));
            });
        });
        return Promise.all(in_p).then(() => resolve()).catch(e => reject(e));
    }
}

/**
 * 根据所选目录获取文件列表
 */
this.getFileList = (params, cb) => {
    const { id, admin_id } = params;
    let { keywords, showAll, showMark, showSelf } = params;
    let isdelStr = '';
    // 回收站
    if (id == CONFIG.recycleBinId) return this.getRecycleBin({ model: FileManage }, cb);
    if (id != 0) isdelStr = 'isdel = 0 AND ';
    const idArr = [id];
    const searchItem = [];
    const resArr = [];
    let sqlstr = 'SELECT * FROM file_manage WHERE ' + isdelStr + ' name LIKE "%'+keywords+'%" AND ( powerPerson = "" OR powerPerson IS NULL OR find_in_set('+admin_id+', powerPerson) )';
    if (showMark==1) sqlstr += ' AND find_in_set('+admin_id+', bookMark)';
    if (showAll==0) sqlstr += ' AND isHide = 0';

    function findIdArr(id, resolve, reject) {
        return KnowledgeTree.findAll({
            where: {
                mainId: id
            }
        }).then(result => {
            const _p = [];
            result.forEach((items, index) => {
                _p[index] = new Promise((resolve, reject) => {
                    idArr.push(items.dataValues.id);
                    return findIdArr(items.dataValues.id, resolve, reject);
                });
            });
            return Promise.all(_p).then(() => resolve()).catch(e => reject(e));
        }).catch(e => reject(e));
    }

    new Promise((resolve, reject) => {
        if (!id || id == 0) {
            if (showSelf==1) sqlstr += ' AND treeId IS NULL';
            sqlstr += ' ORDER BY isImportant DESC, updateTime DESC';
            return sequelize.query(sqlstr).then(result => {
                if (result[0][0]) result[0].map(items => { resArr.push(items) });
                resolve(resArr);
            }).catch(e => reject(e));
        }
        return new Promise((resolve, reject) => {
            if (showSelf==1) return resolve();
            return findIdArr(id, resolve, reject);
        }).then(() => {
            const _p = [];
            idArr.forEach((items, index) => {
                _p[index] = new Promise((resolve, reject) => {
                    return sequelize.query(sqlstr + ' AND find_in_set('+items+', treeId) ORDER BY isImportant DESC, updateTime DESC').then(result => {
                        if (result[0][0]) result[0].map(items => { resArr.push(items) });
                        resolve();
                    }).catch(e => {throw e});
                });
            });
            return Promise.all(_p).then(() => {
                resolve(resArr);
            }).catch(e => reject(e));
        }).catch(e => reject(e));
    }).then(_result => {
        const resMapper = {};
        const result = [];
        _result.forEach(items => {
            if (!resMapper[items.id]) resMapper[items.id] = items;
        });
        for (const key in resMapper) {
            result.push(resMapper[key]);
        }
        const s = (a, b) => {
            if (a.isImportant == b.isImportant) {
                return Date.parse(b.updateTime) - Date.parse(a.updateTime);
            } else {
                return b.isImportant - a.isImportant;
            }
        }
        cb({
            code: 200,
            msg: '',
            data: sortStar(result.sort(s), admin_id),
        });
    }).catch(e => cb(responseError(e)));
}

exports.targetTableFileList = async id => {
    const str = 'SELECT * FROM file_manage WHERE isdel = 0 AND isRelease = 1 AND find_in_set('+id+', treeId) ORDER BY updateTime DESC LIMIT 0, 1';
    const result = await sequelize.query(str);
    const item = result[0][0];
    if (!item) return item;
    item.content = await new Promise(async resolve => {
        FileModel.findById(item.fileId, (err, r) => {
            if (err) return resolve({});
            resolve(r.content);
        });
    });
    return item;
}

/**
 * 新增文档
 */
this.createDoc = (params, cb) => {
    const { name, admin_id, isTable } = params;
    let { treeId, content } = params;
    treeId = treeId ? treeId.join() : null;
    const that = this;
    new Promise((resolve, reject) => {
        if (!name) return reject(errorMapper.lackParams);
        that.checkSameFileName({
            name,
        }, notSame => {
            if (!notSame) return reject(errorMapper.sameFileName);
            content = content ? content : { '': '' };
            FileModel.create({
                content,
            }, (err, result) => {
                if (err) return reject(err);
                const fileId = result._id.toString();
                return FileManage.create({
                    treeId,
                    name,
                    author: admin_id,
                    insertPerson: admin_id,
                    updateTime: TIME(),
                    fileId,
                    isTable,
                }).then(result => resolve(result)).catch(e => reject(e));
            });
        });
    }).then(result => {
        cb({
            code: 200,
            msg: '新增成功',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 删除文件
 */
this.delFile = (params, cb) => {
    const { admin_id, id } = params;
    const that = this;
    let originalHeadInfo, originalContent;
    new Promise((resolve, reject) => {
        if (!id) return reject(errorMapper.lackParams);
        // that.checkPower({
        //     admin_id,
        //     id,
        // }, result => {
        //     if (result != 200) return reject(result);
            return FileManage.findOne({
                where: {
                    id,
                }
            }).then(result => {
                originalHeadInfo = result.dataValues;
                const { fileId } = originalHeadInfo;
                FileModel.findById(fileId, (err, result) => {
                    if (err) return reject(e);
                    originalContent = result.content;
                    resolve();
                });
            }).catch(e => reject(e));
        // });
    }).then(result => {
        return FileManage.update({
            isdel: 1,
            isHide: 1,
        }, {
            where: {
                id
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '删除成功',
                data: result
            });
            that.recordShooting({
                type: 'delete',
                admin_id,
                time: TIME(),
                fileHeadId: id,
                originalParams: {
                    originalHeadInfo,
                    originalContent,
                },
            });
        }).catch(e => reject(e));
    }).catch(e => cb(responseError(e)));
}

/**
 * 还原文件
 */
this.recycleBinRollback = (params, cb) => {
    const { id, admin_id } = params;
    FileManage.update({
        isdel: 0,
        isHide: 0,
        updatePerson: admin_id,
        updateTime: TIME(),
    }, {
        where: { id },
    }).then(result => {
        cb({
            code: 200,
            msg: '还原成功',
            data: result,
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 编辑文件头信息
 */
this.editFileHead = (params, cb) => {
    const { id, treeId, name, isHide, isRelease, powerPerson, admin_id } = params;
    const that = this;
    // 检查文件名是否重复
    new Promise((resolve, reject) => {
        that.checkSameFileName({
            id,
            name
        }, notSame => {
            if (!notSame) return reject(errorMapper.sameFileName);
            // 检查引用树是否存在
            // if (!treeId || treeId.length === 0) return reject(errorMapper.treeNotExist);
            resolve();
        });
    }).then(result => {
        return FileManage.findOne({
            where: { id }
        }).then(result => {
            let { author } = result.dataValues;
            let authorArr = author.split(',');
            authorArr.push(admin_id);
            authorArr = [...new Set(authorArr)];
            author = authorArr.join();
            let treeIdStr;
            try {
                if (treeId.length===0) {
                    treeIdStr = null;
                } else {
                    treeIdStr = treeId.join();
                }
            } catch (e) {
                treeIdStr = null;
            }
            return FileManage.update({
                treeId: treeIdStr,
                name,
                isHide,
                author,
                isRelease,
                powerPerson,
                updateTime: TIME(),
            }, {
                where: { id }
            }).then(result => cb({
                code: 200,
                msg: '更新成功',
                data: result
            })).catch(e => { throw e });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 编辑文件内容
 */
this.editFileContent = (params, cb) => {
    const { _id, content } = params;
    const that = this;
    new Promise((resolve, reject) => {
        if (!_id || !content) return reject(errorMapper.lackParams);
        FilenameModel.updateOne({
            _id
        }, {
            content,
        }, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    }).then(result => {
        cb({
            code: 200,
            msg: '更新成功',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据关键字搜索文件信息
 */
this.searchFile = (params, cb) => {
    const { keywords } = params;
    FileManage.findAll({
        where: {
            name: {
                '$like': '%'+keywords+'%',
            },
            isdel: 0,
        }
    }).then(result => {
        const resArr = result.map(items => {
            return {
                text: items.name,
                value: items.id,
                data: {
                    name: items.name,
                    id: items.id,
                },
            };
        });
        cb({
            code: 200,
            msg: '',
            data: resArr
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据指定文件获取内容以及引用
 */
this.getFileContent = (params, cb) => {
    const { id } = params;
    const resArr = [];
    new Promise((resolve, reject) => {
        return getFileId([id], resolve, reject);
    }).then(() => {
        const staffMapper = new base.StaffMap().getStaffMap();
        resArr.forEach(items => {
            let inAuthorArr = [];
            try {
                inAuthorArr = items.author.split(',');
            } catch (e) {
                
            }
            inAuthorArr.forEach((it,ind) => {
                inAuthorArr[ind] = staffMapper[it].user_name;
            });
            items.authorName = inAuthorArr.join();
        });
        cb({
            code: 200,
            msg: '',
            data: resArr,
        });
    }).catch(e => cb(responseError(e)));

    function getFileId(idArr, resolve, reject) {
        return FileManage.findAll({
            where: {
                id: {'$in': idArr},
                // isdel: 0,
            }
        }).then(result => {
            const _p = [];
            result.forEach((items, index) => {
                const { id, name, fileId, link, author, insertPerson, isMerage, isTable, isRelease } = items.dataValues;
                _p[index] = new Promise((resolve, reject) => {
                    const o = { 
                        id,
                        name,
                        fileId,
                        author,
                        insertPerson,
                        isMerage,
                        isTable,
                        isRelease,
                    };
                    FileModel.findById(fileId, (err, r) => {
                        if (err) return reject(err);
                        o.content = r.content;
                        o.updatedAt = r.updatedAt;
                        let linkArr;
                        try {
                            linkArr = link.split(',').filter(items => items);
                        } catch (error) {
                            linkArr = [];
                        }
                        o.link = linkArr;
                        resArr.push(o);
                        if (linkArr.length === 0) {
                            resolve();
                        } else {
                            return getFileId(linkArr, resolve, reject);
                        }
                    });
                });
            });
            return Promise.all(_p).then(() => resolve()).catch(e => reject(e));
        }).catch(e => reject(e));
    }
}

/**
 * 复制文件
 */
this.copyFile = (params, cb) => {
    const { id, admin_id } = params;
    FileManage.findOne({
        where: { id }
    }).then(result => {
        const { treeId, name, fileId, link, isMerage } = result.dataValues;
        new Promise((resolve, reject) => {
            FileModel.findById(fileId, (err, result) => {
                if (err) return reject(err);
                const { content } = result;
                FileModel.create({
                    content
                }, (err, result) => {
                    if (err) return reject(err);
                    resolve(result._id.toString());
                });
            });
        }).then(_id => {
            return FileManage.create({
                treeId,
                name: name + parseInt(Math.random() * 1000),
                fileId: _id,
                link,
                isMerage,
                insertPerson: admin_id,
                updateTime: TIME(),
                author: admin_id,
            }).then(() => {
                cb({
                    code: 200,
                    msg: '复制成功',
                    data: [],
                });
            }).catch(e => { throw e });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 提交
 */
this.subEdit = (params, cb) => {
    let { id, fileId, content, link, isMerage, admin_id } = params;
    let originalHeadInfo, originalContent;
    content = typeof content === 'object' ? content : JSON.parse(content);
    const that = this;
    // 检查当link不存在时，isMerage必须为0
    if (!link || link.length === 0) isMerage = 0;

    new Promise((resolve, reject) => {
        // 检查是否存在循环引用
        that.checkCircleReference({
            id,
            link,
        }, hasCircle => {
            if (hasCircle) return reject(errorMapper.fileCircleReference);
            resolve();
        });
    }).then(() => {
        return FileManage.findOne({
            where: { id },
        }).then(result => {
            let { author, fileId } = result.dataValues;
            let authorArr = author.split(',');
            authorArr.push(admin_id);
            authorArr = [...new Set(authorArr)];
            author = authorArr.join();
            originalHeadInfo = JSON.parse(JSON.stringify(result.dataValues));
            return FileManage.update({
                link: typeof link === 'object' ? link.join(): link,
                isMerage,
                author,
                updateTime: TIME(),
            },{
                where: { id }
            }).then(() => {
                return new Promise((resolve, reject) => {
                    FileModel.findById(fileId, (err, result) => {
                        if (err) return reject(err);
                        originalContent = result.content;
                        FileModel.updateOne({
                            _id: fileId
                        }, {
                            content,
                        }, (err, result) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    });
                }).then(() => {
                    cb({
                        code: 200,
                        msg: '提交成功',
                        data: [],
                    });
                    that.recordShooting({
                        type: 'update',
                        admin_id,
                        time: TIME(),
                        fileHeadId: id,
                        originalParams: {
                            originalHeadInfo,
                            originalContent,
                        },
                    });
                }).catch(e => { throw e });
            }).catch(e => { throw e });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 设为关注或取消
 */
this.fileMark = (params, cb) => {
    const { id, admin_id } = params;
    FileManage.findOne({
        where: { id }
    }).then(result => {
        let bookMarkArr, newBookMark;
        let msg;
        try {
            bookMarkArr = result.dataValues.bookMark.split(',').filter(items => items);
        } catch (e) {
            bookMarkArr = [];
        }
        if (bookMarkArr.indexOf(admin_id) === -1) {
            bookMarkArr.push(admin_id);
            newBookMark = bookMarkArr.join();
            msg = '已收藏';
        } else {
            newBookMark = bookMarkArr.filter(items => items!=admin_id).join();
            msg = '已取消收藏';
        }
        return FileManage.update({
            bookMark: newBookMark
        }, {
            where: { id }
        }).then(result => {
            cb({
                code: 200,
                msg,
                data: result,
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 设为重要或取消
 */
this.fileImportant = (params, cb) => {
    const { id } = params;
    FileManage.findOne({
        where: { id }
    }).then(result => {
        let { isImportant } = result.dataValues;
        let msg;
        if (isImportant==0) {
            isImportant = 1;
            msg = '设置重要成功';
        } else {
            isImportant = 0;
            msg = '取消重要成功';
        }
        return FileManage.update({
            isImportant,
        }, {
            where: { id }
        }).then(result => {
            cb({
                code: 200,
                msg,
                data: result,
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 解析excel
 */
this.parseExcel = (params, cb) => {
    const filePath = DIRNAME + params.path;
    try {
        const result = xlsx.parse(filePath)[0].data;
        cb({
            code: 200,
            msg: '解析完成',
            data: result,
        });
    } catch (e) {
        cb({
            code: -1,
            msg: e.message,
            data: [],
        });
    }
}


/**************************************************************************************/

/**
 * 检查文件名冲突
 */
this.checkSameGalleryName = (params, cb) => {
    const { id, name } = params;
    Gallery.findAll({
        where: {
            name,
            isdel: 0,
        }
    }).then(result => {
        if (result.length === 0 || (result.length === 1 && id === result[0].dataValues.id )) {
            cb(true);
        } else {
            cb(false);
        }
    }).catch(e => LOG(e));
}

/**
 * 获取图库组
 */
this.getGalleryGroup = async (params, cb) => {
    const { id, admin_id } = params;
    let { keywords, showMark, treeId, showSelf, showAll } = params;
    let isdelStr = '';
    const idArr = [];
    // 回收站
    if (id == CONFIG.recycleBinId) return this.getRecycleBin({ model: Gallery }, cb);
    if (await serviceHomeExtends.checkIsFromAffair({id})) {
        const result = await serviceHomeExtends.fetchSubAffair({id});
        cb(result);
        return;
    }
    if (id != 0) isdelStr = 'isdel = 0 AND ';
    let sqlstr = 'SELECT * FROM gallery WHERE '+ isdelStr +'name LIKE "%'+ keywords +'%"';
    if (showMark==1) sqlstr += ' AND find_in_set('+admin_id+', bookMark)';
    if (showAll==0) sqlstr += ' AND isHide = 0';

    new Promise((resolve, reject) => {
        if (id == 0) {
            if (showSelf==1) sqlstr += ' AND treeId IS NULL';
            return resolve();
        }
        idArr.push(id);
        if (showSelf==1) return resolve();
        return findIdArr(id, resolve, reject);
    }).then(result => {
        if (idArr.length!==0) {
            sqlstr += ' AND (';
            idArr.forEach((items) => {
                sqlstr += ' find_in_set('+items+', treeId) OR';
            });
            sqlstr = sqlstr.slice(0, sqlstr.length-2);
            sqlstr += ')';
        }
        sqlstr += ' ORDER BY updateTime DESC';
        return sequelize.query(sqlstr).then(result => {
            const resArr = [];
            if (result[0][0]) result[0].map(items => { resArr.push(items) });
            const staffMap = new base.StaffMap().getStaffMap();
            resArr.forEach((items,index) => {
                resArr[index].insertPersonName = staffMap[items.insertPerson].user_name;
                resArr[index].updatePersonName = staffMap[items.updatePerson].user_name;
            });
            cb({
                code: 200,
                msg: '',
                data: sortStar(resArr, admin_id),
            })
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));


    function findIdArr(id, resolve, reject) {
        return KnowledgeTree.findAll({
            where: {
                mainId: id
            }
        }).then(result => {
            const _p = [];
            result.forEach((items, index) => {
                _p[index] = new Promise((resolve, reject) => {
                    idArr.push(items.dataValues.id);
                    return findIdArr(items.dataValues.id, resolve, reject);
                });
            });
            return Promise.all(_p).then(() => resolve()).catch(e => reject(e));
        }).catch(e => reject(e));
    }
}

// 获取所有可分享的图库列表
this.getTotalOpenGalleryList = async () => {
    const result = await Gallery.findAll({
        attributes: ['id', 'name'],
        include: {
            model: GallerySub,
            where: { isdel: 0 },
        },
        where: {
            isdel: 0,
            isRelease: 1,
        }
    });
    return result;
}

/**
 * 获取指定图库组信息
 */
this.getGalleryGroupItem = async (params, cb) => {
    const { id } = params;
    if (String(id).length > 10) {
        const result = await serviceHomeExtends.fetchSourceByAffairId({affairId: id, isImg: true});
        cb(result);
        return;
    }
    Gallery.findOne({
        include: {
            model: GallerySub,
        },
        where: {
            id,
        }
    }).then(result => {
        if (result) {
            const staffMap = new base.StaffMap().getStaffMap();
            result.dataValues.insertPersonName = staffMap[result.dataValues.insertPerson].user_name;
            result.dataValues.updatePersonName = staffMap[result.dataValues.updatePerson].user_name;
            result.dataValues.GallerySubs = result.dataValues.GallerySubs.filter(items => items.dataValues.isdel === 0);
            cb({
                code: 200,
                msg: '',
                data: result,
            });
        } else {
            cb({
                code: -1,
                msg: '不存在',
                data: [],
            });
        }
    }).catch(e => cb(responseError(e)));
}

/**
 * 新增图库组
 */
this.createGalleryGroup = (params, cb) => {
    const { name, admin_id } = params;
    let { treeId } = params;
    treeId = treeId[0] == 0 ? null : treeId.join();
    const that = this;
    new Promise((resolve, reject) => {
        if (!name) return reject(errorMapper.lackParams);
        that.checkSameGalleryName({
            name,
        }, notSame => {
            if (notSame === false) return reject(errorMapper.sameFileName);
            Gallery.create({
                treeId,
                name,
                insertPerson: admin_id,
                updatePerson: admin_id,
                updateTime: TIME(),
                insertTime: TIME(),
            }).then(result => resolve(result)).catch(e => reject(e));
        });
    }).then(result => {
        cb({
            code: 200,
            msg: '新增成功',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 删除图库组
 */
this.delGalleryGroup = async (params, cb) => {
    const { id } = params;
    const result = await serviceCloudDisk.checkExistInDisk({ type: 'gallery', fileId: id });
    if (result.code === -1) {
        cb({ code: -1, msg: '该图库被云盘引用，不允许删除' });
        return;
    }
    const r = await serviceCloudDisk.checkExistInDependency({ type: 'gallery', fileId: id });
    if (r.code === -1) {
        cb({ code: -1, msg: '该图库被安装盘引用，不允许删除' });
        return;
    }
    new Promise((resolve, reject) => {
        if (!id) return reject(errorMapper.lackParams);
        return Gallery.update({
            isdel: 1,
            isHide: 1,
        }, {
            where: {
                id
            }
        }).then(result => resolve(result)).catch(e => reject(e));
    }).then(result => {
        cb({
            code: 200,
            msg: '删除成功',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 还原图库组
 */
this.recycleBinGalleryRollback = (params, cb) => {
    const { id, admin_id } = params;
    Gallery.update({
        isdel: 0,
        isHide: 0,
        updatePerson: admin_id,
        updateTime: TIME(),
    }, {
        where: { id },
    }).then(result => {
        cb({
            code: 200,
            msg: '还原成功',
            data: result,
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 图库组设为关注或取消
 */
this.galleryMark = (params, cb) => {
    const { id, admin_id } = params;
    Gallery.findOne({
        where: { id }
    }).then(result => {
        let bookMarkArr, newBookMark;
        let msg;
        try {
            bookMarkArr = result.dataValues.bookMark.split(',').filter(items => items);
        } catch (e) {
            bookMarkArr = [];
        }
        if (bookMarkArr.indexOf(admin_id) === -1) {
            bookMarkArr.push(admin_id);
            newBookMark = bookMarkArr.join();
            msg = '已收藏';
        } else {
            newBookMark = bookMarkArr.filter(items => items!=admin_id).join();
            msg = '已取消收藏';
        }
        return Gallery.update({
            bookMark: newBookMark
        }, {
            where: { id }
        }).then(result => {
            cb({
                code: 200,
                msg,
                data: result,
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 图库组修改所属目录和文件名
 */
this.changeGalleryInfo = async (params, cb) => {
    let { id, treeId, name, description, isRelease } = params;
    const that = this;
    if (isRelease == 0) {
        const result = await serviceCloudDisk.checkExistInDisk({ type: 'gallery', fileId: id });
        if (result.code === -1) {
            cb({ code: -1, msg: '该图库被云盘引用，必须对外发布' });
            return;
        }
        const r = await serviceCloudDisk.checkExistInDependency({ type: 'gallery', fileId: id });
        if (r.code === -1) {
            cb({ code: -1, msg: '该图库被安装盘引用，必须对外发布' });
            return;
        }
    }
    // 检查文件名是否重复
    new Promise((resolve, reject) => {
        that.checkSameGalleryName({
            id,
            name
        }, notSame => {
            if (!notSame) return reject(errorMapper.sameFileName);
            // 检查引用树是否存在
            // if (!treeId || treeId.length === 0) return reject(errorMapper.treeNotExist);
            resolve();
        });
    }).then(result => {
        try {
            if (treeId.length===0) {
                treeId = null;
            } else {
                treeId = treeId.join();
            }
        } catch (e) {
            treeId = null;
        }
        return Gallery.update({
            treeId,
            name,
            description,
            isRelease,
        }, {
            where: { id }
        }).then(result => cb({
            code: 200,
            msg: '更新成功',
            data: result
        })).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 修改图片
 */
this.changeAlbum = (params, cb) => {
    let { id, albumArr, newAlbumArr, admin_id } = params;
    albumArr = albumArr.split(',').filter(items => items);
    newAlbumArr = newAlbumArr.split(',').filter(items => items);
    albumArr = albumArr.map(items => {
        if (Number(items) == items) {
            return Number(items);
        }
    });
    const delArr = [];
    GallerySub.findAll({
        where: {
            gallery_id: id,
            isdel: 0,
        }
    }).then(result => {
        const originalIdArr = result.map(items => items.id);
        // 取差集
        Linq.from(originalIdArr).except(albumArr).forEach(i => {
            delArr.push(i);
        });
        const _p = [];
        delArr.forEach((items, index) => {
            _p[index] = new Promise((resolve, reject) => {
                GallerySub.update({
                    isdel: 1
                }, {
                    where: {
                        id: items,
                    }
                }).then(() => resolve()).catch(e => reject(e));
            });
        });
        return Promise.all(_p).then(() => {
            const _p = [];
            newAlbumArr.forEach((items, index) => {
                _p[index] = new Promise((resolve, reject) => {
                    const albumName = items;
                    fs.stat(DIRNAME + '/public/img/gallery/' + albumName, (err, result) => {
                        if (err) return reject(err);
                        const { size, birthtime } = result;
                        GallerySub.create({
                            album: albumName,
                            gallery_id: id,
                            size,
                            shootingTime: birthtime,
                        }).then(() => resolve()).catch(e => reject(e));
                    });
                });
            });
            return Promise.all(_p).then(() => {
                return Gallery.update({
                    updatePerson: admin_id,
                    updateTime: TIME(),
                }, {
                    where: { id }
                }).then(() => {
                    cb({
                        code: 200,
                        msg: '更新成功',
                        data: [],
                    });
                    // 发送到云盘，重新计算文件大小
                    serviceCloudDisk.updateGallerySize({ galleryId: id });
                }).catch(e => { throw e });
            }).catch(e => { throw e });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**************************************************************************** */ 

/**
 * 文档列表
 */
this.docList = async (params, cb) => {
    const { id, admin_id } = params;
    let { keywords, showMark, treeId, showSelf, showAll } = params;
    let isdelStr = '';
    keywords = keywords ? keywords : '';
    showMark = showMark==1 ? 1 : 0; 
    if (id == CONFIG.recycleBinId) return this.getRecycleBin({ model: DocLib }, cb);
    if (await serviceHomeExtends.checkIsFromAffair({id})) {
        const result = await serviceHomeExtends.fetchSubAffair({id});
        cb(result);
        return;
    }
    if (id != 0) isdelStr = 'isdel = 0 AND ';
    const idArr = [];
    let sqlstr = 'SELECT * FROM doc_lib WHERE '+ isdelStr +'name LIKE "%'+ keywords +'%"';
    if (showMark==1) sqlstr += ' AND find_in_set('+admin_id+', bookMark)';
    if (showAll==0) sqlstr += ' AND isHide = 0';
    
    new Promise((resolve, reject) => {
        if (id == 0) {
            if (showSelf==1) sqlstr += ' AND treeId IS NULL';
            return resolve();
        }
        idArr.push(id);
        if (showSelf==1) return resolve();
        return findIdArr(id, resolve, reject);
    }).then(result => {
        if (idArr.length!==0) {
            sqlstr += ' AND (';
            idArr.forEach((items) => {
                sqlstr += ' find_in_set('+items+', treeId) OR';
            });
            sqlstr = sqlstr.slice(0, sqlstr.length-2);
            sqlstr += ')';
        }
        sqlstr += ' ORDER BY isImportant DESC, updateTime DESC';
        return sequelize.query(sqlstr).then(result => {
            const resArr = [];
            if (result[0][0]) result[0].map(items => { resArr.push(items) });
            const staffMap = new base.StaffMap().getStaffMap();
            resArr.forEach((items,index) => {
                resArr[index].insertPersonName = staffMap[items.insertPerson].user_name;
                resArr[index].updatePersonName = staffMap[items.updatePerson].user_name;
            });
            cb({
                code: 200,
                msg: '',
                data: sortStar(resArr, admin_id),
            })
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));


    function findIdArr(id, resolve, reject) {
        return KnowledgeTree.findAll({
            where: {
                mainId: id
            }
        }).then(result => {
            const _p = [];
            result.forEach((items, index) => {
                _p[index] = new Promise((resolve, reject) => {
                    idArr.push(items.dataValues.id);
                    return findIdArr(items.dataValues.id, resolve, reject);
                });
            });
            return Promise.all(_p).then(() => resolve()).catch(e => reject(e));
        }).catch(e => reject(e));
    }
}

// 获取所有可分享的文档列表
this.getTotalOpenDocList = async () => {
    let result = await DocLib.findAll({
        attributes: ['id', 'name'],
        where: {
            isdel: 0,
            isRelease: 1,
        },
    });
    result = result.map(items => items.dataValues);
    return result;
}

this.fetchSourceByAffairId = async (params, cb) => {
    const { id } = params;
    const result = await serviceHomeExtends.fetchSourceByAffairId({affairId: id, isImg: false});
    cb(result);
    return;
}

this.getTargetDoc = async docId => {
    const docEntity = await DocLib.findOne({ where: { id: docId, isdel: 0, isRelease: 1 } });
    return docEntity;
}

/**
 * 新增文档
 */
this.addDoc = (params, cb) => {
    const { file, admin_id, param } = params;
    const { originalname } = file;
    const name = originalname.slice(0, originalname.lastIndexOf('.'));
    const suffixName = originalname.slice(originalname.lastIndexOf('.'), originalname.length);
    let { treeId } = param;
    treeId = JSON.parse(treeId);
    if (treeId[0] == 0 || !treeId[0]) {
        treeId = null;
    } else {
        treeId = treeId.join();
    }
    new Promise((resolve, reject) => {
        return DocLib.findOne({
            where: {
                isdel: 0,
                name,
            }
        }).then(result => {
            if (result) return reject(createError(errorMapper.sameFileName));
            fs.rename(file.path, DIRNAME + '/downloads/selfDoc/' + originalname, (err, result) => {
                if (err) return reject(err);
                resolve();
            });
        }).catch(e => { throw e });
    }).then(() => {
        return DocLib.create({
            treeId,
            name,
            originalName: name,
            suffixName,
            insertPerson: admin_id,
            insertTime: TIME(),
            updatePerson: admin_id,
            updateTime: TIME(),
        }).then(result => {
            cb({
                code: 200,
                msg: '上传成功',
                data: result,
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 提交文档信息
 */
this.updateDocInfo = async (params, cb) => {
    let { treeId, name, id, admin_id, isRelease } = params;
    if (isRelease == 0) {
        const result = await serviceCloudDisk.checkExistInDisk({ type: 'doc', fileId: id });
        if (result.code === -1) {
            cb({ code: -1, msg: '该文档被云盘引用，必须对外发布' });
            return;
        }
        const r = await serviceCloudDisk.checkExistInDependency({ type: 'doc', fileId: id });
        if (r.code === -1) {
            cb({ code: -1, msg: '该文档被安装盘引用，必须对外发布' });
            return;
        }
    }
    new Promise((resolve, reject) => {
        try {
            if (treeId.length===0) {
                treeId = null;
            } else {
                treeId = treeId.join();
            }
        } catch (e) {
            treeId = null;
        }
        return DocLib.findAll({
            where: {
                isdel: 0,
                name,
            }
        }).then(result => {
            if (result.length === 1 && result[0].dataValues.id != id || (result.length > 1 )) return reject(createError(errorMapper.sameFileName));
            resolve();
        }).catch(e => reject(e));
    }).then(() => {
        return DocLib.update({
            name,
            treeId,
            isRelease,
            // updatePerson: admin_id,
            // updateTime: TIME(),
        }, {
            where: {
                id,
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '更新成功',
                data: result,
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 删除文档
 */
this.delDoc = async(params, cb) => {
    const { admin_id, id } = params;
    const result = await serviceCloudDisk.checkExistInDisk({ type: 'doc', fileId: id });
    if (result.code === -1) {
        cb({ code: -1, msg: '该文档被云盘引用，不允许删除' });
        return;
    }
    const r = await serviceCloudDisk.checkExistInDependency({ type: 'doc', fileId: id });
    if (r.code === -1) {
        cb({ code: -1, msg: '该文档被安装盘引用，不允许删除' });
        return;
    }
    DocLib.update({
        isdel: 1,
        isHide: 1,
        updatePerson: admin_id,
        updateTime: TIME(),
    }, {
        where: {
            id,
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '删除成功',
            data: result,
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 还原文档
 */
this.recycleBinDocRollback = (params, cb) => {
    const { id, admin_id } = params;
    DocLib.update({
        isdel: 0,
        isHide: 0,
        updatePerson: admin_id,
        updateTime: TIME(),
    }, {
        where: { id },
    }).then(result => {
        cb({
            code: 200,
            msg: '还原成功',
            data: result,
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 文档设为关注或取消
 */
this.docMark = (params, cb) => {
    const { id, admin_id } = params;
    DocLib.findOne({
        where: { id }
    }).then(result => {
        let bookMarkArr, newBookMark;
        let msg;
        try {
            bookMarkArr = result.dataValues.bookMark.split(',').filter(items => items);
        } catch (e) {
            bookMarkArr = [];
        }
        if (bookMarkArr.indexOf(admin_id) === -1) {
            bookMarkArr.push(admin_id);
            newBookMark = bookMarkArr.join();
            msg = '已收藏';
        } else {
            newBookMark = bookMarkArr.filter(items => items!=admin_id).join();
            msg = '已取消收藏';
        }
        return DocLib.update({
            bookMark: newBookMark
        }, {
            where: { id }
        }).then(result => {
            cb({
                code: 200,
                msg,
                data: result,
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 文档设为重要或不重要
 */
this.docSetImportant = (params, cb) => {
    const { id } = params;
    DocLib.findOne({
        where: { id }
    }).then(result => {
        let { isImportant } = result.dataValues;
        let msg;
        if (isImportant==0) {
            isImportant = 1;
            msg = '设置重要成功';
        } else {
            isImportant = 0;
            msg = '取消重要成功';
        }
        return DocLib.update({
            isImportant,
        }, {
            where: { id }
        }).then(result => {
            cb({
                code: 200,
                msg,
                data: result,
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 图库设为重要或不重要
 */
this.gallerySetImportant = async params => {
    const { id } = params;
    const result = await Gallery.findOne({
        where: { id }
    });
    let { isImportant } = result.dataValues;
    let msg;
    if (isImportant==0) {
        isImportant = 1;
        msg = '设置重要成功';
    } else {
        isImportant = 0;
        msg = '取消重要成功';
    }
    await Gallery.update({
        isImportant,
    }, {
        where: { id }
    });
    return {
        code: 200,
        msg,
        data: [],
    };
}

/**
 * 替换文件
 */
this.replaceFile = (params, cb) => {
    const { originalname, id, admin_id } = params;
    const name = originalname.slice(0, originalname.lastIndexOf('.'));
    const suffixName = originalname.slice(originalname.lastIndexOf('.'), originalname.length);
    DocLib.update({
        originalName: name,
        suffixName,
        updatePerson: admin_id,
        updateTime: TIME(),
    }, {
        where: {
            id,
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '替换成功',
            data: [originalname],
        });
        fs.rename(DIRNAME + '/downloads/temp/' + originalname, DIRNAME + '/downloads/selfDoc/' + originalname, (err, result) => {});
        // 发送到云盘，重新计算文件大小
        serviceCloudDisk.updateDocSize({ docLibId: id });
    }).catch(e => cb(responseError(e)));
}

/**
 * 更新最新文件
 */
this.pushFile = async params => {
    const { originalname, id } = params;
    // 根据id找出最新节点，获得originalName
    const libEntity = await DocLib.findOne({ where: { id }});
    const { originalName: _fileName, updateTime, suffixName } = libEntity.dataValues;
    // 通过originalName + updateTime获得新originalName
    const newOriginalName = _fileName + Date.parse(updateTime);
    // 文件系统重命名
    await new Promise(resolve => {
        fs.rename(DIRNAME + '/downloads/selfDoc/' + _fileName + suffixName, DIRNAME + '/downloads/selfDoc/' + newOriginalName + suffixName, (err, result) => {
            resolve();
        });
    });
    // 生成新的链节点
    await DocLibList.create({
        treeId: libEntity.dataValues.treeId,
        name: libEntity.dataValues.name,
        suffixName: libEntity.dataValues.suffixName,
        originalName: newOriginalName,
        bookMark: libEntity.dataValues.bookMark,
        isImportant: libEntity.dataValues.isImportant,
        insertPerson: libEntity.dataValues.insertPerson,
        insertTime: libEntity.dataValues.insertTime,
        updatePerson: libEntity.dataValues.updatePerson,
        updateTime: libEntity.dataValues.updateTime,
        isHide: libEntity.dataValues.isHide,
        isRelease: libEntity.dataValues.isRelease,
        isdel: libEntity.dataValues.isdel,
        masterId: id,
    });
    // 执行替换文件的方法
    await new Promise(resolve => {
        this.replaceFile(params, () => resolve());
    });
    return {
        code: 200,
        msg: '更新成功',
        data: [originalname],
    };
}

/**
 * 获取历史版本节点
 */
this.getFileHistoryList = async masterId => {
    const staffMapper = new base.StaffMap().getStaffMap();
    const list = await DocLibList.findAll({ where: { masterId }, order: [[ 'id', 'DESC' ]] });
    for (let i = 0; i < list.length; i++) {
        list[i].dataValues.isHistory = true;
        list[i].dataValues.updatePersonName = staffMapper[list[i].dataValues.updatePerson].user_name;
    }
    return {
        code: 200,
        msg: '',
        data: list,
    };
}

/**
 * 文档资源归并
 * 从事务系统复制到文档库
 */
this.pipeToDoc = (params, cb) => {
    let { fileName, treeId, mailId, admin_id } = params;
    const name = fileName.slice(0, fileName.lastIndexOf('.'));
    const suffixName = fileName.slice(fileName.lastIndexOf('.'), fileName.length);
    DocLib.findOne({
        where: {
            name,
            isdel: 0,
        }
    }).then(result => {
        if (result) throw createError(errorMapper.fileIsExist);
        return new Promise((resolve, reject) => {
            const readable = fs.createReadStream(DIRNAME + '/downloads/notiClient/'+ fileName);
            const writable = fs.createWriteStream(DIRNAME + '/downloads/selfDoc/'+ fileName);
            readable.pipe(writable);
            resolve();
        }).then(() => {
            treeId = JSON.parse(treeId);
            if (treeId[0] == 0 || !treeId[0]) {
                treeId = null;
            } else {
                treeId = treeId.join();
            }
            return DocLib.create({
                treeId,
                name,
                originalName: name,
                suffixName,
                insertPerson: admin_id,
                insertTime: TIME(),
                updatePerson: admin_id,
                updateTime: TIME(),
            }).then(result => {
                cb({
                    code: 200,
                    msg: '归档成功',
                    data: result,
                });

                // common.createEvent({
                //     headParams: {
                //         ownerId: mailId,
                //         type: '1101',
                //         time: TIME(),
                //         person: admin_id,
                //     },
                //     bodyParams: {},
                // },() => {});
            }).catch(e => { throw e });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 获取回收站数据
 */
this.getRecycleBin = (params, cb) => {
    const { model } = params;
    return model.findAll({
        where: { isdel: 1 },
        order: [['id', 'DESC']],
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result,
        });
    }).catch(e => cb(responseError(e)));
}