const NotiClient = require('../dao').NotiClient;
const Affair = require('../dao').Affair;
const RespoAffair = require('../dao').RespoAffair;
const SmallAffair = require('../dao').SmallAffair;
const ProjectAffair = require('../dao').ProjectAffair;
const KnowledgeTree = require('../dao/').KnowledgeTree;
const TreeIdToAffairId = require('../dao/').TreeIdToAffairId;
const sequelize = require('../dao/').sequelize;
const base = require('./base');
const Linq = require('linq');

/**
 * 监听例行事务变动后
 * 需要更新节点树
 */
this.changeTreeNode = async () => {
    // 先获取所有例行事务的affairId
    let affairArr = await RespoAffair.findAll();
    affairArr = affairArr.map(items => items.dataValues.noti_client_affair_group_uuid);
    // 筛选不存在tree中的affairId
    let existArr = await KnowledgeTree.findAll({ where: { affairId: { $ne: null }}});
    existArr = existArr.map(items => items.dataValues.affairId);
    let newAffairArr = [];
    Linq.from(affairArr).except(existArr).forEach(affairId => newAffairArr.push(affairId));
    newAffairArr = newAffairArr.filter(items => items);
    // 开事务，保证插入的index正确
    const supId = CONFIG.disabledAffairTreeId;

    for (let i = 0; i < newAffairArr.length; i++) {
        const affairResult = await Affair.findOne({where: {uuid: newAffairArr[i]}});
        await addTreeNode(newAffairArr[i], affairResult.dataValues.name);
    }
    return {
        code: 200,
        msg: '插入成功',
        data: [],
    };

    async function addTreeNode(affairId, name) {
        const t = await sequelize.transaction();
        const result = await sequelize.query('SELECT * FROM knowledge_tree WHERE supId = ' + supId + ' FOR UPDATE', {transaction: t});
        let index;
        if (result[0].length === 0) {
            index = 0;
        } else {
            let max = 0;
            result[0].forEach(items => {
                max = items.index > max ? items.index : max;
            });
            index = max + 1;
        }
        await KnowledgeTree.create({
            name,
            mainId: supId,
            affairId,
            index,
        }, {
            transaction: t,
        });
        return t.commit();
    }
}

/**
 * 根据树id判断是不是来自事务
 */
this.checkIsFromAffair = async params => {
    const { id } = params;
    const result = await KnowledgeTree.findOne({
        where: { id },
    });
    if (result && result.affairId) return true;
    return false;
}

/**
 * 根据树id获取例行事务以及下属所有事务
 */
this.fetchSubAffair = async params => {
    const { id } = params;
    const result = await KnowledgeTree.findOne({
        where: { id },
    });
    const { affairId } = result.dataValues;
    let affairArr = [];

    await dealer([affairId]);
    affairArr.unshift(affairId);
    affairArr = [...new Set(affairArr)];
    const resArr = await Affair.findAll({ where: { uuid: { $in: affairArr } }, order: [['insert_time']]});
    resArr.forEach((items, index) => {
        resArr[index] = {
            name: items.dataValues.name,
            id: items.dataValues.uuid,
            treeId: id,
        };
    });
    return {
        code: 200,
        msg: '查询成功',
        data: resArr,
    };
    
    async function dealer(inputAffairId) {
        let arr = [];
        const _p = [];
        inputAffairId.forEach((items, index) => {
            _p[index] = SmallAffair.findAll({where: {relatedAffairs : {$like: '%'+items+'%'}}})
        });
        const smallArr = await Promise.all(_p);

        const _p2 = [];
        inputAffairId.forEach((items, index) => {
            _p2[index] = ProjectAffair.findAll({where: {relatedAffairs : {$like: '%'+items+'%'}}})
        });
        const projectArr = await Promise.all(_p);
        smallArr[0].forEach((items, index) => {
            affairArr.push(items.dataValues.noti_client_affair_group_uuid);
            arr.push(items.dataValues.noti_client_affair_group_uuid);
        });
        projectArr[0].forEach((items, index) => {
            affairArr.push(items.dataValues.noti_client_affair_group_uuid);
            arr.push(items.dataValues.noti_client_affair_group_uuid);
        });
        arr = [...new Set(arr)];
        if (arr.length === 0) return;
        await dealer(arr);
    }
}

/**
 * 根据affairId获取所有的图片资源或者文档资源
 */
this.fetchSourceByAffairId = async params => {
    const { affairId, isImg } = params;
    const where = {
        noti_client_affair_group_uuid: affairId,
        isdel: 0,
    };
    if (isImg) {
        where.album = {$ne: null};
    } else {
        where.fileName = {$ne: null};
    }
    const result = await NotiClient.findAll({where, order: [['post_time', 'DESC']]});
    const affairResult = await Affair.findOne({where: { uuid: affairId }});
    const staffMap = new base.StaffMap().getStaffMap();
    const respoAffairResult = await RespoAffair.findOne({ where: { noti_client_affair_group_uuid: affairId } });
    const smallAffairResult = await SmallAffair.findOne({ where: { noti_client_affair_group_uuid: affairId } });
    const projectAffairResult = await ProjectAffair.findOne({ where: { noti_client_affair_group_uuid: affairId } });
    let description;
    if (respoAffairResult) {
        description = respoAffairResult.dataValues.resposibility;
    } else if (smallAffairResult) {
        description = smallAffairResult.dataValues.cause;
    } else {
        description = projectAffairResult.dataValues.background;
    }
    if (isImg) {
        const imgResFormat = {
            id: affairResult.dataValues.uuid,
            GallerySubs: getImgArr(result),
            description,
            updatePersonName: staffMap[affairResult.dataValues.update_person].user_name,
            updateTime: affairResult.dataValues.update_time,
        };
        return {
            code: 200,
            msg: '',
            data: imgResFormat,
        };
    } else {
        function getFileArr(result) {
            const resArr = [];
            result.forEach((items, index) => {
                let fileArr;
                try {
                    fileArr = items.dataValues.file.split(',').filter(items => items);
                } catch (e) {
                    fileArr = [];
                }
                fileArr.forEach((it, ind) => {
                    resArr.push({
                        name: breakFile(it, 0),
                        originalName: breakFile(it, 0),
                        suffixName: breakFile(it, 1),
                        id: items.dataValues.mailId + '_' + index + '_' + ind,
                        updatePersonName: staffMap[items.dataValues.sender].user_name,
                        updateTime: items.dataValues.post_time,
                    });
                });
            });
            return resArr;
        }
        const data = getFileArr(result);
        return {
            code: 200,
            msg: '',
            data,
        };
    }

    function getImgArr(result) {
        const resArr = [];
        result.forEach((items, index) => {
            let albumArr;
            try {
                albumArr = items.dataValues.album.split(',').filter(items => items);
            } catch (e) {
                albumArr = [];
            }
            albumArr.forEach((it, ind) => {
                resArr.push({
                    album: it,
                    id: items.dataValues.mailId + '_' + index,
                });
            });
        });
        const endArr = [], hashMapper = {};
        resArr.forEach((items, index) => {
            if (!hashMapper[items.album]) {
                hashMapper[items.album] = 1;
                endArr.push(items);
            }
        });
        return endArr;
    }

    function breakFile(fileName, isSuffixName) {
        const lastIndex = fileName.lastIndexOf('.');
        const name = fileName.slice(0, lastIndex);
        const suffixName = fileName.slice(lastIndex, fileName.length);
        if (isSuffixName) return suffixName;
        return name;
    }
}