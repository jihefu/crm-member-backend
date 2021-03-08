const request = require('request');
const serviceHomeVir = require('./homeVir');
const MachineType = require('../dao').MachineType;
const Staff = require('../dao').Staff;
const Member = require('../dao').Member;

exports.getTree = async () => {
    const result = await serviceHomeVir.sortBySolution();
    let data = result.data;
    trans(data);
    return {
        code: 200,
        msg: '',
        data,
    };

    function trans(data) {
        data.forEach((items, index) => {
            data[index].mainId = items.sup_id;
            data[index].subTreeArr = items.children;
            delete items.sup_id;
            delete items.children;
            if (data[index].subTreeArr.length !== 0) trans(data[index].subTreeArr);
        });
    }
}

exports.addNode = async params => {
    let { mainId, name } = params;
    if (!name) return { code: -1, msg: '节点名不能为空' };
    if (mainId == 0) mainId = null;
    const result = await MachineType.findOne({ where: { isdel: 0, sup_id: mainId }, order: [['index', 'DESC']]});
    let count = 0;
    if (result) count = result.dataValues.index + 1;
    await MachineType.create({
        name,
        index: count,
        sup_id: mainId,
    });
    return {
        code: 200,
        msg: '新增成功',
        data: [],
    };
}

exports.delNode = async params => {
    const { id, admin_id } = params;
    const idArr = [ id ];

    function getAllIdArr(id, resolve) {
        return MachineType.findAll({
            where: {
                sup_id: id,
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

    await new Promise((resolve,reject)=> {
        return getAllIdArr(id,resolve);
    });

    await MachineType.update({
        isdel: 1
    },{
        where: { id: {'$in': idArr}}
    });
    sendUpdateMachineTypeMsg();
    
    return{
        code: 200,
        msg: '删除成功',
        data: []
    };

    // 通知mongodb的模板标签库，把MachineType为变为其它
    async function sendUpdateMachineTypeMsg() {
        // 根据admin_id获取unionid
        const staffData = await Staff.findOne({ where: { user_id: admin_id, on_job: 1, isdel: 0 } });
        const { open_id } = staffData.dataValues;
        const memberData = await Member.findOne({ where: { open_id } });
        const { unionid } = memberData.dataValues;
        request({
            url: CONFIG.cloudApiAddr + '/vtc/cfgTemp/label/updateMachineTypeToOtherId',
            method: 'put',
            headers: {
                Accept: 'application/json',
                primaryunionid: unionid,
            },
            body: {
                otherTypeId: CONFIG.machineTypeOtherId,
                isdelMachineTypeIdArr: idArr,
            },
            json: true,
        }, (err, response, body) => {
            console.log(body);
        });
    }
}

exports.renameNode = async params => {
    const { id, name } = params;
    await MachineType.update({
        name,
    },{
        where: { id },
    });
    return {
        code: 200,
        msg: '更新成功',
        data: [],
    };
}

exports.removeTree = async params => {
    let { newTreeArr } = params;
    newTreeArr = typeof newTreeArr === 'object' ? newTreeArr : JSON.parse(newTreeArr);
    const _p = [];
    newTreeArr.forEach((items, index) => {
        _p[index] = new Promise((resolve, reject) => {
            const sup_id = items.mainId != 0 ? items.mainId : null;
            return MachineType.update({
                index: items.index,
                sup_id,
            }, {
                where: { id: items.id }
            }).then(() => resolve()).catch(e => reject(e));
        });
    });
    try {
        await Promise.all(_p);
        return {
            code: 200,
            msg: '更新成功',
            data: [],
        };
    } catch (e) {
        return {
            code: -1,
            msg: '更新失败',
            data: [],
        };
    }
}

exports.dragNodeIn = async params => {
    const { targetId, selfId } = params;
    await MachineType.update({
        sup_id: targetId,
    }, {
        where: {
            id: selfId,
        }
    });
    return {
        code: 200,
        msg: '更新成功',
        data: [],
    }
}