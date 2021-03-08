const KnowledgeTree = require('../dao/').KnowledgeTree;
const FileManage = require('../dao/').FileManage;
const FileModel = require('../mongoModel/FileModel');

const createError = (obj) => {
    const error =  new Error(obj.msg);
    error.code = obj.code;
    return error;
}

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

const errorMapper = {
    lackParams: {
        code: -15001,
        msg: '缺少参数',
    },
    directorError: {
        code: -15002,
        msg: '目录错误',
    },
    fileNameErrorORDirectorError: {
        code: -15003,
        msg: '文件名错误或目录错误',
    },
}

this.getTargetItem = (params, cb) => {
    let { treeNode, targetFile, targetKey } = params;
    const subTreeNode = params['0'];
    const treeArr = subTreeNode.split('/').filter(items => items);
    KnowledgeTree.findAll({
        where: { isdel: 0 },
    }).then(result => {
        let id;
        try {
            id = result.filter(items => items.name == treeNode && !items.mainId)[0].id;
        } catch (e) {
            throw createError(errorMapper.directorError);
        }
        let count = 0;
        const treeId = findTreeId(id);
        return FileManage.findOne({
            where: {
                isdel: 0,
                name: targetFile,
                treeId: { '$like': '%'+treeId+'%' },
            },
        }).then(result => {
            if (!result) throw createError(errorMapper.fileNameErrorORDirectorError);
            return new Promise((resolve, reject) => {
                FileModel.findById(result.dataValues.fileId, (err, result) => {
                    if (err) return reject(e);
                    const v = result['content'][targetKey];
                    resolve(v);
                });
            }).then(result => {
                if (result) {
                    cb({
                        code: 200,
                        msg: '获取成功',
                        data: result,
                    });
                } else {
                    cb({
                        code: -1,
                        msg: '不存在该内容',
                        data: [],
                    });
                }
            }).catch(e => { throw e });
        }).catch(e => { throw e });

        function findTreeId(id) {
            if (count === treeArr.length) return id;
            let _id;
            try {
                _id = result.filter(items => items.dataValues.mainId == id && items.dataValues.name == treeArr[count])[0].id;
            } catch (e) {
                throw createError(errorMapper.directorError);
            }
            count++;
            return findTreeId(_id);
        }
    }).catch(e => cb(responseError(e)));
}