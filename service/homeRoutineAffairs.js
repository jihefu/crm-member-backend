const Linq = require('linq');
const common = require('./common');
const sequelize = require('../dao').sequelize;
const Staff = require('../dao').Staff;
const base = require('./base');
const Affair = require('../dao').Affair;
const RespoAffair = require('../dao').RespoAffair;
const ProjectAffair = require('../dao').ProjectAffair;
const ProjectAffairProgress = require('../dao').ProjectAffairProgress;
const SmallAffair = require('../dao').SmallAffair;
const NotiClient = require('../dao').NotiClient;
const NotiClientSub = require('../dao').NotiClientSub;
const ProgressUpdateRecord = require('../dao').ProgressUpdateRecord;
const serviceNotiClient = require('./homeNotiSystem');
const serviceHomeMember = require('./homeMember');
const serviceHomeExtends = require('./homeExtends');

const that = this;
//事务抽象类
this.classAbstractAffair = class AbstractAffair {
    constructor(obj){
        this.base_form_data = obj.base_form_data?obj.base_form_data:{};
        this.child_form_data = obj.child_form_data?obj.child_form_data:{};
    }

    add(){

    }

    read(){

    }

    //获取子关联
    getSubRelativeAffair(uuid,cb){
        //递归
        /**
         * @param {String} uuid 
         * @return {Array} cb 
         */
        const recursionFun = (uuid,cb) => {
            const _p_0 = new Promise((resolve,reject) => {
                ProjectAffair.findAll({
                    where: {
                        relatedAffairs: {
                            '$like': '%'+uuid+'%'
                        }
                    }
                }).then(result => {
                    resolve(result);
                }).catch(e => LOG(e));
            });
            const _p_1 = new Promise((resolve,reject) => {
                SmallAffair.findAll({
                    where: {
                        relatedAffairs: {
                            '$like': '%'+uuid+'%'
                        }
                    }
                }).then(result => {
                    resolve(result);
                }).catch(e => LOG(e));
            });
            Promise.all([_p_0,_p_1]).then(result => {
                const resArr = [...result[0],...result[1]];
                const _p = [];
                const endArr = [];
                resArr.forEach((items,index) => {
                    const it = items;
                    const i = index;
                    _p[index] = new Promise((resolve,reject) => {
                        that.getTargetAffair({
                            affairId: items.noti_client_affair_group_uuid
                        },result => {
                            endArr[i] = result.data;
                            resolve();
                        });
                    });
                });
                Promise.all(_p).then(result => {
                    const _arr = [];
                    endArr.forEach((items,index) => {
                        if(items) _arr.push(items);
                    });
                    cb(_arr);
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }

        let arr = [];

        const f = (uuidArr) => {
            const _p = [];
            let resArr = [];
            uuidArr.forEach((items,index) => {
                _p[index] = new Promise((resolve,reject) => {
                    recursionFun(items,_arr => {
                        resArr = [...resArr,..._arr];
                        resolve();
                    });
                });
            });
            Promise.all(_p).then(() => {
                if(resArr.length==0){
                    cb(arr);
                }else{
                    arr = [...arr,...resArr];
                    const affairIdArr = resArr.map(items => items.uuid);
                    f(affairIdArr);
                }
            }).catch(e => LOG(e));
        }

        f([uuid]);
    }

    //获取父关联
    getSupRelativeAffair(it,affairType,cb){
        const endArr = [];
        if(affairType=='respoAffair'){
            cb(endArr);
        }else{
            let relatedAffairs;
            if(it.ProjectAffairs&&it.ProjectAffairs.length!=0){
                relatedAffairs = it.ProjectAffairs[0].relatedAffairs;
            }else if(it.SmallAffairs&&it.SmallAffairs.length!=0){
                relatedAffairs = it.SmallAffairs[0].relatedAffairs;
            }
            let relatedAffairArr;
            try{
                relatedAffairArr = relatedAffairs.split(',');
            }catch(e){
                relatedAffairArr = [];
            }
            const _p = [];
            relatedAffairArr.forEach((items,index) => {
                const i = index;
                _p[index] = new Promise((resolve,reject) => {
                    that.getTargetAffair({
                        affairId: items
                    },result => {
                        endArr[i] = result.data;
                        resolve();
                    });
                });
            });
            Promise.all(_p).then(result => {
                const _arr = [];
                endArr.forEach((items,index) => {
                    if(items) _arr.push(items);
                });
                cb(_arr);
            }).catch(e => LOG(e));
        }
    }
}

class Trans {
    constructor(data){
        this.data = data;
    }

    transToView(cb){
        const staffMap = new base.StaffMap().getStaffMap();
        const _p = [];
        this.data.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                let teamArr,teamName = [];
                let attentionAffairArr,attentionAffairName = [];
                //insert_person转换
                try{
                    items.dataValues.insert_person_name = staffMap[items.dataValues.insert_person].user_name;
                }catch(e){
                    try{
                        items.dataValues.insert_person_name = items.dataValues.insert_person;
                    }catch(e){
                        
                    }
                }
                try{
                    teamArr = items.dataValues.team.split(',');
                }catch(e){ 
                    teamArr = [];
                }
                try{
                    attentionAffairArr = items.dataValues.attentionStaff.split(',');
                }catch(e){
                    attentionAffairArr = [];
                }
                teamArr.forEach((it,ind) => {
                    let name;
                    try{
                        name = staffMap[it]['user_name'];
                    }catch(e){
                        name = it;
                    }
                    teamName.push(name);
                });
                attentionAffairArr.forEach((it,ind) => {
                    let name;
                    try{
                        name = staffMap[it]['user_name'];
                    }catch(e){
                        name = it;
                    }
                    attentionAffairName.push(name);
                });
                try{
                    items.dataValues.teamName = teamName.join();
                }catch(e){
                    // console.log(index);
                }
                try{
                    items.dataValues.attentionStaffName = attentionAffairName.join();
                }catch(e){
                    // console.log(index);
                }
                //外部联系人
                const it = items;
                const i = index;
                let outerContactArr;
                try{
                    outerContactArr = it.dataValues.outerContact.split(',');
                }catch(e){
                    outerContactArr = [];
                }
                if(outerContactArr.length==0){
                    resolve();
                }else{
                    const in_p = [];
                    const outerContactName = [];
                    outerContactArr.forEach((_items,_index) => {
                        in_p[_index] = new Promise((resolve,reject) => {
                            serviceHomeMember.getInfoByOpenId({
                                open_id: _items
                            },result => {
                                try{
                                    outerContactName.push(result.dataValues.name);
                                }catch(e){

                                }
                                resolve();
                            });
                        });
                    });
                    Promise.all(in_p).then(() => {
                        items.dataValues.outerContactName = outerContactName.join();
                        resolve();
                    }).catch(e => LOG(e));
                }
            });
        });
        Promise.all(_p).then(() => cb(this.data)).catch(e => LOG(e));
        // return this.data;
    }
}

/**
 * 获取事务“会员接待处”的成员列表
 */
this.getStaffFromMemberAffair = async () => {
    const id = CONFIG.memberAffairId;
    const defaultStaff = '1103';
    const items = await Affair.findOne({ where: { uuid: id } });
    let staffList = [];
    try {
        staffList = items.dataValues.team.split(',').filter(items => items);
    } catch (e) {
        staffList = [defaultStaff];
    }
    return staffList;
}

/**
 * 获取事务“会员私信大厅”的成员列表
 */
this.getStaffFromMemberSiteAffair = async () => {
    const id = CONFIG.memberSiteMsgId;
    const defaultStaff = '1103';
    const items = await Affair.findOne({ where: { uuid: id } });
    let staffList = [];
    try {
        staffList = items.dataValues.team.split(',').filter(items => items);
    } catch (e) {
        staffList = [defaultStaff];
    }
    return staffList;
}

/**
 *  事务新增时获取viewOrder
 */
this.getNewViewOrder = (cb) => {
    Affair.findOne({
        order: [['viewOrder','DESC']]
    }).then(result => {
        let newViewOrder;
        try{
            newViewOrder = ++result.dataValues.viewOrder;
        }catch(e){
            newViewOrder = 0;
        }
        cb(newViewOrder);
    }).catch(e => LOG(e));
}

/**
 *  例行事务新增
 */
this.respoAffairAdd = (params,cb) => {
    let { admin_id,form_data } = params;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    form_data.insert_person = admin_id;
    form_data.insert_time = TIME();
    form_data.update_person = admin_id;
    form_data.update_time = TIME();

    //例行事务类
    class ChildRespoAffair extends this.classAbstractAffair {
        constructor(props){
            super(props);
        }

        //@overload
        add(cb){
            //检查专线已存在
            const checkSpecialLineExist = (cb) => {
                if(this.base_form_data.customerId){
                    Affair.findOne({
                        where: {
                            customerId: this.base_form_data.customerId,
                            state: {
                                '$ne': '关闭'
                            }
                        }
                    }).then(result => {
                        if(result){
                            cb({
                                code: -1,
                                msg: '该专线已存在',
                                data: []
                            });
                        }else{
                            cb({
                                code: 200,
                                msg: '',
                                data: []
                            });
                        }
                    }).catch(e => LOG(e));
                }else{
                    cb({
                        code: 200,
                        msg: '',
                        data: []
                    });
                }
            }
            checkSpecialLineExist(status => {
                if(status.code==200){
                    const base_form_data = this.base_form_data;
                    const child_form_data = this.child_form_data;
                    Promise.all([
                        Affair.create(base_form_data),
                        RespoAffair.create(child_form_data)
                    ]).then(function(result){
                        const affair = result[0];
                        const respoAffair = result[1];
                        affair.setRespoAffairs(respoAffair);
                        cb();
                    }).catch(function(e){
                        LOG(e);
                    });
                }else{
                    cb(status);
                }
            });
        }
    }

    //获取队长所在部门
    const getDepartment = (team,cb) => {
        const directorUserId = team.split(',')[0];
        Staff.findOne({
            where: {
                user_id: directorUserId,
                isdel: 0
            }
        }).then(result => {
            cb(result.dataValues.branch);
        }).catch(e => LOG(e));
    }

    const base_form_data = {},child_form_data = {};
    for(let key in form_data){
        if(key=='resposibility'||key=='labels'){
            child_form_data[key] = form_data[key];
        }else{
            base_form_data[key] = form_data[key];
        }
    }

    getDepartment(form_data.team,branch => {
        child_form_data.department = form_data.department?form_data.department:branch;
        // child_form_data.department = branch;
        const childRespoAffair = new ChildRespoAffair({
            base_form_data: base_form_data,
            child_form_data: child_form_data
        });
        that.getNewViewOrder(viewOrder => {
            base_form_data.viewOrder = viewOrder;
            childRespoAffair.add((result) => {
                if(result&&result.code==-1){
                    cb(result);
                }else{
                    cb({
                        code: 200,
                        msg: '新增成功',
                        data: []
                    });
                    setTimeout(() => {
                        serviceHomeExtends.changeTreeNode();
                    }, 1000);
                }
            });
        });
    });
}

/**
 *  项目事务新增
 */
this.projectAffairAdd = (params,cb) => {
    let { admin_id,form_data } = params;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    form_data.insert_person = admin_id;
    form_data.insert_time = TIME();
    form_data.update_person = admin_id;
    form_data.update_time = TIME();

    const base_form_data = {},child_form_data = {};
    for(let key in form_data){
        if(key=='background'||key=='target'||key=='deadline'||key=='summary'||key=='progress'||key=='completion'||key=='relatedAffairs'||key=='reward'){
            child_form_data[key] = form_data[key];
        }else{
            base_form_data[key] = form_data[key];
        }
    }

    //项目事务类
    class ChildProjectffair extends this.classAbstractAffair {
        constructor(props){
            super(props);
        }

        //@overload
        add(cb){
            const base_form_data = this.base_form_data;
            const child_form_data = this.child_form_data;
            const { progress } = child_form_data;
            delete child_form_data.progress;
            Promise.all([
                Affair.create(base_form_data),
                ProjectAffair.create(child_form_data)
            ]).then(function(result){
                const affair = result[0];
                const projectAffair = result[1];
                affair.setProjectAffairs(projectAffair);
                const { id } = projectAffair.dataValues;
                const _p = [];
                progress.forEach((items,index) => {
                    _p[index] = new Promise((resolve,reject) => {
                        items.project_affair_id = id;
                        ProjectAffairProgress.create(items).then(() => resolve()).catch(e => LOG(e));
                    });
                });
                Promise.all(_p).then(() => {
                    cb();
                }).catch(e => LOG(e));
            }).catch(function(e){
                LOG(e);
            });
        }
    }

    const childProjectffair = new ChildProjectffair({
        base_form_data: base_form_data,
        child_form_data: child_form_data
    });
    that.getNewViewOrder(viewOrder => {
        base_form_data.viewOrder = viewOrder;
        childProjectffair.add(() => {
            cb({
                code: 200,
                msg: '新增成功',
                data: []
            });
        });
    });
}

/**
 *  小事务新增
 */
this.smallAffairAdd = (params,cb) => {
    let { admin_id,form_data } = params;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    form_data.insert_person = admin_id;
    form_data.insert_time = TIME();
    form_data.update_person = admin_id;
    form_data.update_time = TIME();

    const base_form_data = {},child_form_data = {};
    for(let key in form_data){
        if(key=='cause'||key=='deadline'||key=='summary'||key=='completionDegree'||key=='relatedAffairs'){
            child_form_data[key] = form_data[key];
        }else{
            base_form_data[key] = form_data[key];
        }
    }

    //小事务类
    class ChildSmallffair extends this.classAbstractAffair {
        constructor(props){
            super(props);
        }

        //@overload
        add(cb){
            const base_form_data = this.base_form_data;
            const child_form_data = this.child_form_data;
            Promise.all([
                Affair.create(base_form_data),
                SmallAffair.create(child_form_data)
            ]).then(function(result){
                const affair = result[0];
                const smallAffair = result[1];
                affair.setSmallAffairs(smallAffair);
                cb();
            }).catch(function(e){
                LOG(e);
                cb(-1);
            });
        }
    }

    const childSmallffair = new ChildSmallffair({
        base_form_data: base_form_data,
        child_form_data: child_form_data
    });
    that.getNewViewOrder(viewOrder => {
        base_form_data.viewOrder = viewOrder;
        childSmallffair.add((code) => {
            if(code==-1){
                cb({
                    code: -1,
                    msg: '字段过长',
                    data: []
                });
            }else{
                cb({
                    code: 200,
                    msg: '新增成功',
                    data: []
                });
            }
        });
    });
}

/**
 *  事务列表
 */
this.affairList = (params,cb) => {
    let { keywords,affairType,department,specialLine } = params;
    specialLine = Number(specialLine);
    const that = this;
    let include;
    let where = {
        isdel: 0,
        customerId: {
            '$eq': null
        },
        state: {
            '$notIn': ['关闭','已完成']
        }
    };
    if(specialLine) where.customerId = {'$ne': null};
    const departmentArr = department.split(',');
    //获取查询条件
    (getReadCondition = () => {
        if(affairType=='respoAffair'){
            include = {
                model: RespoAffair,
                where: {
                    id: {
                        '$ne': null
                    },
                    department: {
                        '$in': departmentArr
                    }
                }
            };
        }else if(affairType=='projectAffair'){
            include = {
                model: ProjectAffair,
                where: {
                    id: {
                        '$ne': null
                    }
                },
                include: [ProjectAffairProgress]
            };
        }else if(affairType=='smallAffair'){
            include = {
                model: SmallAffair,
                where: {
                    id: {
                        '$ne': null
                    }
                }
            };
        }else if(affairType=='projectAndSmallAffair'){
            include = [{
                model: ProjectAffair,
                include: [ProjectAffairProgress]
            },{
                model: SmallAffair
            }];
            where['$or'] = [
                sequelize.where(sequelize.col('ProjectAffairs.id'), {
                    '$ne': null
                }),
                sequelize.where(sequelize.col('SmallAffairs.id'), {
                    '$ne': null
                })
            ];
        }else{
            include = [RespoAffair,{
                model: ProjectAffair,
                include: [ProjectAffairProgress]
            },SmallAffair];
        }
    })();
    class ChildAffairList extends this.classAbstractAffair {
        constructor(props){
            super(props);
            this.include = props.include;
            this.where = props.where;
        }

        //@overload
        read(cb){
            Affair.findAll({
                include: this.include,
                where: this.where,
                order: [['viewOrder']]
            }).then(result => {
                cb(result);
            }).catch(e => LOG(e));
        }
    }

    const childAffairList = new ChildAffairList({
        where: where,
        include: include
    });
    childAffairList.read(result => {
        const trans = new Trans(result);
        // const data = trans.transToView();
        trans.transToView(data => {
            const _p = [];
            data.forEach((items,index) => {
                const i = index;
                const it = items;
                _p[index] = new Promise((resolve,reject) => {
                    childAffairList.getSubRelativeAffair(it.uuid,result => {
                        data[i].dataValues.subRelativeAffair = result;
                        childAffairList.getSupRelativeAffair(it,affairType,result => {
                            data[i].dataValues.supRelativeAffair = result;
                            resolve();
                        });
                    });
                });
            });
            Promise.all(_p).then(result => {
                cb({
                    code: 200,
                    msg: '',
                    data: data
                });
            }).catch(e => LOG(e));
        });
    });

}

/**
 *  事务列表（供筛选）
 */
this.listForSelect = (params,cb) => {
    Affair.findAll({
        attributes: ['uuid','name'],
        include: [RespoAffair, ProjectAffair, SmallAffair],
        where: {
            state: {
                '$notIn': ['关闭', '已完成']
            },
            isdel: 0
        },
        order: [['insert_time','DESC']]
    }).then(result => {
        result.forEach((items, index) => {
            if (items.dataValues.RespoAffairs.length != 0) {
                items.dataValues.type = 0;
            } else if(items.dataValues.ProjectAffairs.length != 0) {
                items.dataValues.type = 1;
            } else {
                items.dataValues.type = 2;
            }
            delete items.dataValues.RespoAffairs;
            delete items.dataValues.ProjectAffairs;
            delete items.dataValues.SmallAffairs;
        });
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => LOG(e));
}

/**
 *  指定参数搜索
 */
this.orderParamsAffairs = (params,cb) => {
    Affair.findAll({
        where: params
    }).then(result => {
        cb(result);
    }).catch(e => LOG(e));
}

/**
 *  获取指定事务
 *  不包括关联事务和被关联事务
 */
this.getTargetAffair = (params,cb) => {
    const { affairId } = params;
    Affair.findOne({
        include: [RespoAffair,{
            model: ProjectAffair,
            include: [ProjectAffairProgress]
        },SmallAffair],
        where: {
            uuid: affairId
        }
    }).then(result => {
        const trans = new Trans([result]);
        trans.transToView(data => {
            cb({
                code: 200,
                msg: '',
                data: data[0]
            });
        });
    }).catch(e => LOG(e));
}

/**
 *  获取指定事务
 *  包括关联事务和被关联事务
 */
this.getTargetAffairSupAndSub = (params,cb) => {
    const { affairId } = params;
    Affair.findOne({
        include: [RespoAffair,{
            model: ProjectAffair,
            include: [ProjectAffairProgress]
        },SmallAffair],
        where: {
            uuid: affairId
        }
    }).then(result => {
        const trans = new Trans([result]);
        // let data = trans.transToView()[0];
        trans.transToView(data => {
            data = data[0];
            const abstractAffair = new that.classAbstractAffair({});
            abstractAffair.getSubRelativeAffair(data.dataValues.uuid,result => {
                data.dataValues.subRelativeAffair = result;
                abstractAffair.getSupRelativeAffair(data.dataValues,data.dataValues.uuid,result => {
                    data.dataValues.supRelativeAffair = result;
                    cb({
                        code: 200,
                        msg: '',
                        data: data
                    });
                });
            });
        });
    }).catch(e => LOG(e));
}

/**
 *  删除指定事务
 */
this.deleteTargetAffair = (params,cb) => {
    const { affairId } = params;
    Affair.update({
        isdel: 1
    },{
        where: {
            uuid: affairId
        }
    }).then(result => {
        if(result[0]){
            cb({
                code: 200,
                msg: '删除成功',
                data: []
            });
        }else{
            cb({
                code: -1,
                msg: '操作失败',
                data: []
            });
        }
    }).catch(e => LOG(e));
}

/**************************************更新块*********************************************/

function checkTeamChange(params, cb) {
    const { affairId, team } = params;
    if (!team) return cb();
    // 判断是否为小事务
    Affair.findOne({
        include: [ SmallAffair, ProjectAffair ],
        where: { uuid: affairId }
    }).then(result => {
        if (result.dataValues.SmallAffairs.length !== 0 || result.dataValues.ProjectAffairs.length !== 0) {
            const originalTeam = result.dataValues.team;
            const originalTeamArr = originalTeam.split(',');
            const presentTeamArr = team.split(',');
            const addArr = [];
            Linq.from(presentTeamArr).except(originalTeamArr).forEach(user_id => addArr.push(user_id));
            cb();
            // log假扣钱
            addArr.forEach((items, index) => {
                common.createEvent({
                    headParams: {
                        person: items,
                        time: TIME(),
                        type: 1504,
                        ownerId: affairId,
                    },
                    bodyParams: {},
                }, result => {});
            });
        } else {
            cb();
        }
    }).catch(e => LOG(e));
}

/**
 *  普通父类事务的更新
 *  只更新当前字段
 *  新加成员变化监听，重置type1504
 */
this.affairUpdate = (params,cb) => {
    const { form_data,admin_id } = params;
    // 判断小事务成员是否有变化
    checkTeamChange({
        affairId: form_data.uuid,
        team: form_data.team,
    }, () => {
        form_data.update_person = admin_id;
        form_data.update_time = TIME();
        Affair.update(form_data, {
            where: {
                uuid: form_data.uuid
            }
        }).then(result => {
            if(result[0]){
                cb({
                    code: 200,
                    msg: '更新成功',
                    data: []
                });
            }else{
                cb({
                    code: -1,
                    msg: '更新失败',
                    data: []
                });
            }
        }).catch(e => LOG(e));
    });
}

/**
 *  改变事务成员（例行事务）
 */
this.changeTeamMember = (params,cb) => {
    const { form_data,admin_id } = params;
    const _obj = {};
    _obj.team = form_data.team;
    _obj.update_person = admin_id;
    _obj.update_time = TIME();
    const director = form_data.team.split(',')[0];
    Staff.findOne({
        where: {
            isdel: 0,
            user_id: director
        }
    }).then(result => {
        const branch = form_data.branch?form_data.branch:result.dataValues.branch;
        //开启事务
        sequelize.transaction(t => {
            return Affair.update(_obj,{
                where: {
                    uuid: form_data.uuid
                },
                transaction: t
            })
            .then(() => {
                return RespoAffair.update({
                    department: branch
                },{
                    where: {
                        noti_client_affair_group_uuid: form_data.uuid
                    },
                    transaction: t
                });
            });
        }).then(() => {
            cb({
                code: 200,
                msg: '更新成功',
                data: []
            });
        }).catch(e => {
            cb({
                code: -1,
                msg: '更新失败',
                data: []
            });
            LOG(e);
        });
    }).catch(e => LOG(e));
}

/**
 *  改变事务成员（立项事务）
 */
this.changeProjectTeamMember = (params,cb) => {
    const { form_data,admin_id } = params;
    checkTeamChange({
        affairId: form_data.uuid,
        team: form_data.team,
    }, () => {
        const newTeamStr = form_data.team;
        const newTeamArr = newTeamStr.split(',');
        let oldTeamArr,oldTeamStr;
        Affair.findOne({
            include: [ProjectAffair],
            where: {
                uuid: form_data.uuid
            }
        }).then(result => {
            oldTeamStr = result.dataValues.team;
            oldTeamArr = oldTeamStr.split(',');
            const projectAffairId = result.dataValues.ProjectAffairs[0].dataValues.id;
            if(oldTeamStr==newTeamStr){
                cb({
                    code: 200,
                    msg: '无需更新',
                    data: []
                });
            }else{
                const needAddArr = [],needDelArr = [];
                newTeamArr.forEach((items,index) => {
                    if(oldTeamArr.indexOf(items)==-1) needAddArr.push(items);
                });
                oldTeamArr.forEach((items,index) => {
                    if(newTeamArr.indexOf(items)==-1) needDelArr.push(items);
                });
                const _p = [];
                _p[0] = new Promise((resolve,reject) => {
                    const in_p = [];
                    needAddArr.forEach((items,index) => {
                        in_p[index] = new Promise((resolve,reject) => {
                            ProjectAffairProgress.create({
                                member: items,
                                project_affair_id: projectAffairId
                            }).then(result => {
                                resolve();
                            }).catch(e => LOG(e));
                        });
                    });
                    Promise.all(in_p).then(() => {
                        resolve();
                    }).catch(e => LOG(e));
                });
                _p[1] = new Promise((resolve,reject) => {
                    const in_p = [];
                    needDelArr.forEach((items,index) => {
                        in_p[index] = new Promise((resolve,reject) => {
                            ProjectAffairProgress.destroy({
                                force: true,
                                where: {
                                    member: items,
                                    project_affair_id: projectAffairId
                                }
                            }).then(() => resolve()).catch(e => LOG(e));
                        });
                    });
                    Promise.all(in_p).then(() => {
                        resolve();
                    }).catch(e => LOG(e));
                });
                Promise.all(_p).then(() => {
                    Affair.update({
                        team: newTeamStr,
                        update_person: admin_id,
                        update_time: TIME()
                    },{
                        where: {
                            uuid: form_data.uuid
                        }
                    }).then(result => {
                        cb({
                            code: 200,
                            msg: '更新成功',
                            data: []
                        });
                    }).catch(e => LOG(e));
                }).catch(e => LOG(e));

            }
        }).catch(e => LOG(e));
    });
}

/**
 *  改变例行事务的子字段
 *  只更新当前字段（幂等）
 */
this.respoAffairUpdate = (params,cb) => {
    const { form_data } = params;
    RespoAffair.update(form_data,{
        where: {
            noti_client_affair_group_uuid: form_data.noti_client_affair_group_uuid
        }
    }).then(result => {
        if(result[0]){
            cb({
                code: 200,
                msg: '更新成功',
                data: []
            });
        }else{
            cb({
                code: -1,
                msg: '更新失败',
                data: []
            });
        }
    }).catch(e => LOG(e));
}

/**
 *  改变小事务的子字段
 *  只更新当前字段（幂等）
 */
this.smallAffairUpdate = (params,cb) => {
    const { form_data,par,admin_id } = params;
    let needSend = false;
    const that = this;
    //检测是否填写了完成总结
    const checkNeedSend = (cb) => {
        if(form_data.summary) needSend = true;
        cb();
    }
    //发送消息给创建者
    const sendMsgToInsertPerson = () => {
        if(!needSend) return;
        const _par = {
            class: par.class,
            frontUrl: par.frontUrl,
            title: par.title,
            content: form_data.summary+'（申请完成）',
            votes: '同意,不同意',
            subscriber: par.subscriber,
            noti_client_affair_group_uuid: par.noti_client_affair_group_uuid
        };
        serviceNotiClient.notiClientAdd({
            form_data: _par,
            admin_id: admin_id
        },result => console.log(result));
    }
    //判断队长跟发布人是否是同一个人
    const checkSamePerson = (cb) => {
        Affair.findOne({
            where: {
                uuid: form_data.noti_client_affair_group_uuid
            }
        }).then(result => {
            const { team,insert_person } = result.dataValues;
            const director = team.split(',')[0];
            if(insert_person==director){
                cb(false);
            }else{
                cb(true);
            }
        }).catch(e => LOG(e));
    }
    checkNeedSend(() => {
        SmallAffair.update(form_data,{
            where: {
                noti_client_affair_group_uuid: form_data.noti_client_affair_group_uuid
            }
        }).then(result => {
            if(result[0]){
                cb({
                    code: 200,
                    msg: '更新成功',
                    data: []
                });
            }else{
                cb({
                    code: -1,
                    msg: '更新失败',
                    data: []
                });
            }
            if(!needSend) return;
            checkSamePerson(bool => {
                if(bool){
                    sendMsgToInsertPerson();
                }else{
                    //不用发消息通知，直接100%
                    that.smallAffairUpdateByServer({
                        noti_client_affair_group_uuid: form_data.noti_client_affair_group_uuid,
                        completionDegree: 100,
                    },() => {
                        that.affairComplete({uuid: form_data.noti_client_affair_group_uuid}, () => {});
                    });
                }
            });
        }).catch(e => LOG(e));
    });
}

this.affairComplete = (params, cb) => {
    const { uuid } = params;
    Affair.update({
        state: '已完成',
    }, { where: { uuid } }).then(result => cb({
        code: 200,
        msg: '更新成功',
        data: result,
    })).catch(e => LOG(e));
}

/**
 *  改变项目事务的子字段
 *  只更新当前字段（非幂等）
 */
this.projectAffairUpdate = (params,cb) => {
    const { form_data,par,admin_id } = params;
    let needSend = false;
    const that = this;
    //检测是否填写了完成总结
    const checkNeedSend = (cb) => {
        if(form_data.summary) needSend = true;
        cb();
        // ProjectAffair.findOne({
        //     where: {
        //         noti_client_affair_group_uuid: form_data.noti_client_affair_group_uuid
        //     }
        // }).then(result => {
        //     const { summary,completionDegree } = result.dataValues;
        //     const newSummary = form_data.summary;
        //     if(newSummary) needSend = true;
        //     // if(newSummary&&!summary) needSend = true;
        //     cb();
        // }).catch(e => LOG(e));
    }
    //发送消息给创建者
    const sendMsgToInsertPerson = () => {
        if(!needSend) return;
        const _par = {
            class: par.class,
            frontUrl: par.frontUrl,
            title: par.title,
            content: form_data.summary+'（申请完成）',
            votes: '同意,不同意',
            subscriber: par.subscriber,
            noti_client_affair_group_uuid: par.noti_client_affair_group_uuid
        };
        serviceNotiClient.notiClientAdd({
            form_data: _par,
            admin_id: admin_id
        },result => console.log(result));
    }
    //判断队长跟发布人是否是同一个人
    const checkSamePerson = (cb) => {
        Affair.findOne({
            where: {
                uuid: form_data.noti_client_affair_group_uuid
            }
        }).then(result => {
            const { team,insert_person } = result.dataValues;
            const director = team.split(',')[0];
            if(insert_person==director){
                cb(false);
            }else{
                cb(true);
            }
        }).catch(e => LOG(e));
    }
    checkNeedSend(() => {
        ProjectAffair.update(form_data,{
            where: {
                noti_client_affair_group_uuid: form_data.noti_client_affair_group_uuid
            }
        }).then(result => {
            if(result[0]){
                cb({
                    code: 200,
                    msg: '更新成功',
                    data: []
                });
            }else{
                cb({
                    code: -1,
                    msg: '更新失败',
                    data: []
                });
            }
            if(!needSend) return;
            checkSamePerson(bool => {
                if(bool){
                    sendMsgToInsertPerson();
                }else{
                    //不用发消息通知，直接100%
                    that.projectAffairUpdateByServer({
                        noti_client_affair_group_uuid: form_data.noti_client_affair_group_uuid,
                        completionDegree: 100
                    },() => {
                        that.affairComplete({uuid: form_data.noti_client_affair_group_uuid}, () => {});
                    });
                }
            });
        }).catch(e => LOG(e));
    });
}

/**
 *  改变项目事务的子字段
 *  只更新当前字段（幂等）
 */
this.projectAffairUpdateByServer = (params,cb) => {
    ProjectAffair.update(params,{
        where: {
            noti_client_affair_group_uuid: params.noti_client_affair_group_uuid
        }
    }).then(result => {
        cb(result);
    }).catch(e => LOG(e));
}

/**
 *  改变小事务的子字段
 *  只更新当前字段（幂等）
 */
this.smallAffairUpdateByServer = (params,cb) => {
    SmallAffair.update(params,{
        where: {
            noti_client_affair_group_uuid: params.noti_client_affair_group_uuid
        }
    }).then(result => {
        cb(result);
    }).catch(e => LOG(e));
}

/**
 *  改变项目事务的子字段的项目进展
 *  只更新当前字段（幂等）
 */
this.childProjectAffairUpdate = (params,cb) => {
    const { form_data, admin_id } = params;
    ProjectAffairProgress.update(form_data,{
        where: {
            id: form_data.id
        }
    }).then(result => {
        if(result[0]){
            cb({
                code: 200,
                msg: '更新成功',
                data: []
            });
        }else{
            cb({
                code: -1,
                msg: '更新失败',
                data: []
            });
        }
    }).catch(e => LOG(e));
}


/**
 *  改变事务的排序
 */
this.changeViewOrder = (params,cb) => {
    const { form_data } = params;
    const _p = [];
    form_data.forEach((items,index) => {
        _p[index] = new Promise((resolve,reject) => {
            Affair.update(items,{
                where: {
                    uuid: items.uuid
                }
            }).then(() => {
                resolve();
            }).catch(e => LOG(e));
        });
    });
    Promise.all(_p).then(() => {
        cb({
            code: 200,
            msg: '更新成功',
            data: []
        });
    }).catch(e => LOG(e));
    // sequelize.transaction(t => {
    //     return sequelize.transaction(t1 => {
    //         return Promise.all(_p);
    //     })
    // }).then(() => {
    //     cb({
    //         code: 200,
    //         msg: '更新成功',
    //         data: []
    //     });
    // }).catch(e => LOG(e));
}

/**
 *  点击关注或取关
 */
this.attentionAffair = (params,cb) => {
    const { admin_id,uuid } = params;
    Affair.findOne({
        where: {
            uuid: uuid
        }
    }).then(result => {
        let attentionStaffArr;
        try{
            attentionStaffArr = result.dataValues.attentionStaff.split(',');
        }catch(e){
            attentionStaffArr = [];
        }
        attentionStaffArr = attentionStaffArr.filter(items => items);
        let indexof = attentionStaffArr.indexOf(admin_id);
        if(indexof==-1){
            attentionStaffArr.push(admin_id);
        }else{
            attentionStaffArr.splice(indexof,1);
        }
        let str = attentionStaffArr.join();
        Affair.update({
            attentionStaff: str
        },{
            where: {
                uuid: uuid
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '操作成功',
                data: []
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  获取指定公司id的专线信息
 */
this.getSpecialLineInfoByCustomerId = (params,cb) => {
    const { customerId } = params;
    Affair.findOne({
        where: {
            customerId: customerId,
            isdel: 0,
            state: {
                '$ne': '关闭'
            }
        }
    }).then(result => {
        if(result){
            cb({
                code: 200,
                msg: '',
                data: result.dataValues
            });
        }else{
            cb({
                code: -1,
                msg: '不存在该专线',
                data: []
            });
        }
    }).catch(e => LOG(e));
}

/**
 *  法人修改外部联系人
 */
this.updateOuterContact = (params,cb) => {
    const { customerId,outerContact } = params;
    Affair.update({
        outerContact: outerContact
    },{
        where: {
            customerId: customerId
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '更新成功',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 *  改变进度
 */
this.changeDegree = (params,cb) => {
    const { admin_id, form_data } = params;
    const { affairId, degree } = form_data;
    const that = this;
    this.getTargetAffair({
        affairId: affairId
    },result => {
        if(result.data.ProjectAffairs[0]!=null){
            // let { completionDegree } = result.data.ProjectAffairs[0].dataValues;
            ProjectAffair.findOne({
                where: {
                    noti_client_affair_group_uuid: affairId
                }
            }).then(result => {
                const { id } = result.dataValues;
                ProjectAffairProgress.update({
                    degree: degree
                },{
                    where: {
                        project_affair_id: id,
                        member: admin_id
                    }
                }).then(() => {
                    that.getTargetAffair({
                        affairId: affairId
                    },result => {
                        let min = 0;
                        result.data.ProjectAffairs[0].dataValues.ProjectAffairProgresses.forEach((items,index) => {
                            if(index==0) min = Number(items.degree);
                            min = min<Number(items.degree)?min:Number(items.degree);
                        });
                        ProjectAffair.update({
                            completionDegree: min
                        },{
                            where: {
                                noti_client_affair_group_uuid: affairId
                            }
                        }).then(result => {
                            cb({
                                code: 200,
                                msg: '更新成功',
                                data: []
                            });
                        }).catch(e => LOG(e));
                    });
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }else if(result.data.SmallAffairs){
            SmallAffair.update({
                completionDegree: degree
            },{
                where: {
                    noti_client_affair_group_uuid: affairId
                }
            }).then(result => {
                cb({
                    code: 200,
                    msg: '更新成功',
                    data: []
                });
            }).catch(e => LOG(e));
        }
    });
}