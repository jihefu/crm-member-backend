const fs = require('fs');
const moment = require('moment');
const xlsx = require('node-xlsx');
const common = require('./common');
const base = require('./base');
const Staff = require('../dao').Staff;
const sequelize = require('../dao').sequelize;
const Goods = require('../dao').Goods;
const GoodsBorrowRecords = require('../dao').GoodsBorrowRecords;
const goodsScanLog = require('../dao').goodsScanLog;
const request = require('request');
const homeMenu = require('./homeMenu');
const BaseEvent = require('../dao').BaseEvent;
const SubEventContent = require('../mongoModel/SubEventContent');
const crypto = require('crypto');

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
        msg: e.message,
        data: e.data
    };
}

/**
 * 异常map
 */
const errorMapper = {
    noManager: {
        code: -13001,
        msg: '无权限录入'
    },
    noMemberInBranch: {
        code: -13002,
        msg: '该部门不存在该成员'
    },
    notAllowBorrow: {
        code: -13003,
        msg: '当前状态不允许借用'
    },
    hasMainId: {
        code: -13004,
        msg: '已经有主体了'
    },
    managerNotConsistent: {
        code: -13005,
        msg: '保管人不一致'
    },
    borrowStatusNotConsistent: {
        code: -13006,
        msg: '借用状态不一致'
    },
    isdelNotConsistent: {
        code: -13007,
        msg: '库存状态不一致'
    },
    presentStatusNotAllowed: {
        code: -13008,
        msg: '当前状态不允许操作'
    },
    notAllowDel: {
        code: -13009,
        msg: '当前状态不允许出库'
    },
    errorOperation: {
        code: -13010,
        msg: '错误操作'
    }
};

/**
 *  trans
 */
this.trans = (arr) => {
    const staffMap = new base.StaffMap().getStaffMap();
    arr.forEach((items, index) => {
        try{
            items.dataValues.manager = staffMap[items.dataValues.manager].user_name;
        }catch(e){}
        try{
            items.dataValues.user = staffMap[items.dataValues.user].user_name;
        }catch(e){}
        try{
            items.dataValues.insertPerson = staffMap[items.dataValues.insertPerson].user_name;
        }catch(e){}
        try{
            items.dataValues.updatePerson = staffMap[items.dataValues.updatePerson].user_name;
        }catch(e){}
        items.dataValues.events.forEach((it, ind) => {
            try{
                it.dataValues.borrower = staffMap[it.dataValues.person].user_name;
            }catch(e){}
            try{
                it.dataValues.content.borrowTaker = staffMap[it.dataValues.content.borrowTaker].user_name;
            }catch(e){}
        });
        // if(items.dataValues.goodsBorrowRecords){
        //     items.dataValues.goodsBorrowRecords.forEach((it,ind) => {
        //         try{
        //             it.dataValues.borrower = staffMap[it.dataValues.borrower].user_name;
        //         }catch(e){}
        //         try{
        //             it.dataValues.taker = staffMap[it.dataValues.taker].user_name;
        //         }catch(e){}
        //     });
        // }
    });
    return arr;
}

this.checkStatus = (params, admin_id, cb) => {
    const { manager, borrowStatus, isdel } = params;
    if(isdel==1){
        cb([-1]);
        return;
    }
    if(borrowStatus=='无借用'){
        if(admin_id==manager){
            cb([3,5]);
        }else{
            cb([1]);
        }
    }else if(borrowStatus=='借用已申请'){
        if(admin_id==manager){
            cb([2,5]);
        }else{
            cb([0]);
        }
    }else if(borrowStatus=='出库已申请'){
        if(admin_id==manager){
            cb([5]);
        }else{
            Staff.findOne({
                where: {
                    isdel: 0,
                    on_job: 1,
                    branch: '管理部',
                    user_id: admin_id
                }
            }).then(result => {
                if(result){
                    cb([4]);
                }else{
                    cb([0]);
                }
            }).catch(e => LOG(e));
        }
    }
}

/**
 * 根据编号新增或返回信息
 */
this.targetItem = (params, cb) => {
    const { numbering, admin_id } = params;
    const that = this;
    let ownerId;
    Goods.findOne({
        where: { numbering }
    }).then(result => {
        if (result) {
            ownerId = result.dataValues.id;
            return backRes(result, admin_id);
        }
        // 新增信息
        return Staff.findOne({
            where: {
                isdel: 0,
                on_job: 1,
                branch: '管理部',
                user_id: admin_id
            }
        }).then(result => {
            if(result){
                return Goods.create({
                    numbering,
                    goodsType: '办公用品',
                    manager: admin_id,
                    borrowStatus: '无借用',
                    location: '杭州办',
                    insertPerson: admin_id,
                    insertTime: TIME(),
                    updatePerson: admin_id,
                    updateTime: TIME(),
                }).then(result => {
                    ownerId = result.dataValues.id;
                    // 创建事件
                    common.createEvent({
                        headParams: {
                            ownerId,
                            type: '1001',
                            time: TIME(),
                            person: admin_id,
                        },
                        bodyParams: {
                            borrowType: '库存',
                            borrowLocation: '杭州办',
                        },
                        model: Goods,
                    }, addRes => {
                        if (addRes.code === 200) {
                            return Goods.findOne({
                                where: { numbering }
                            }).then(result => {
                                backRes(result, admin_id, 1);
                            }).catch(e => { throw e });
                        } else {
                            cb(addRes);
                        }
                    });
                }).catch(e => {throw e});
            } else {
                throw createError(errorMapper.noManager);
            }
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));

    function backRes(result, admin_id, isNew) {
        common.getEventById({
            ownerId: result.dataValues.id,
            type: [ '1001', '1002' ],
        }, eventRes => {
            if (eventRes.code !== 200) return cb(eventRes);
            result.dataValues.events = eventRes.data;
            that.checkStatus(result,admin_id,(showCode) => {
                const data = that.trans([result])[0];
                getMainGoodsAndFollowGoods({
                    id: data.dataValues.id
                },result => {
                    const { followArr, mainArr } = result;
                    data.dataValues.followArr = followArr;
                    data.dataValues.mainArr = mainArr;
                    cb({
                        code: 200,
                        msg: '',
                        data: {
                            data,
                            showCode,
                            isNew,
                        }
                    });
                });
            });
        });

        //记录log
        // common.createEvent({
        //     headParams: {
        //         person: admin_id,
        //         time: TIME(),
        //         type: '1005',
        //         ownerId,
        //     },
        //     bodyParams: {
        //         goodsNumbering: numbering,
        //     },
        // }, () => {});
    }
}

/**
 *  物品列表
 */
this.list = (params,cb) => {
    const { admin_id } = params;
    let num = params.num?parseInt(params.num):10;
	let page = params.page?parseInt(params.page):1;
	let keywords = params.keywords?params.keywords:'';
    let order = params.order?params.order:'id';
    let filter = JSON.parse(params.filter);
    let typeArr = [];
    const filterFun = (where,filter) => {
        let goodsTypeArr,locationArr,managementArr,isBorrowArr,borrowStatusArr,isdelArr;
        const transArrFun = (k) => {
            try{
                arr = k.split(',').filter(items => items);
            }catch(e){
                arr = [];
            }
            return arr;
        }
        goodsTypeArr = transArrFun(filter.goodsType);
        locationArr = transArrFun(filter.location);
        managementArr = transArrFun(filter.management);
        isdelArr = transArrFun(filter.isdel);
        if(goodsTypeArr.length!=0 && goodsTypeArr[0]!='全部类型') where.goodsType = { '$in': goodsTypeArr};
        if(locationArr.length!=0) where.location = { '$in': locationArr};
        if(isdelArr.length!=0) {
            for (let i = 0; i < isdelArr.length; i++) {
                if(isdelArr[i]=='已出库'){
                    isdelArr[i] = 1;
                }else{
                    isdelArr[i] = 0;
                }
            }
            where.isdel = { '$in': isdelArr};
        }else{
            where.isdel = 0;
        }
        if(filter.myGoods=='我的物品'){
            where['$and'] = {
                '$or': {
                    manager: admin_id,
                    // user: admin_id
                }
            };
        }
        // typeArr
        if (filter.events.indexOf('入库') !== -1) typeArr.push('1001');
        if (filter.events.indexOf('借用') !== -1) typeArr.push('1002');
        if (filter.events.indexOf('拍照') !== -1) typeArr.push('1003');
        if (filter.events.indexOf('出库') !== -1) typeArr.push('1004');
        if (filter.events.indexOf('扫描') !== -1) typeArr.push('1005');
        if ( typeArr.length === 0 ) typeArr = [ '1001', '1002', '1003', '1004' ];
        return where;
    }
    const that = this;
    if(order == 'id'){
		order = ['id','DESC'];
	} else if(order == 'update_time'){
		order = ['updateTime','DESC'];
    } else if (order == 'albumUpdateTime') {
        order = ['albumUpdateTime'];
    }
    common.infoMark({
		type: 'Goods'
	},resObj => {
		const { str,id_arr } = resObj;
		if(str){
			markOrder =	[[sequelize.literal('if('+str+',0,1)')],order];
		}else{
			markOrder =	[order];
        }
        let where = {
            '$or': {
                serialNo: {
                    '$like': '%'+keywords+'%'
                },
                goodsName: {
                    '$like': '%'+keywords+'%'
                },
                numbering: {
                    '$like': '%'+keywords+'%'
                }
            }
        };
        const staffMapper = new base.StaffMap().getStaffMap();
        for(let key in staffMapper){
            if(staffMapper[key].user_name==keywords){
                where['$or'].manager = key;
            }
        }
        where = filterFun(where,filter);
        const findParams = {
            // include: [{
            //     association: Goods.hasMany(BaseEvent, { sourceKey: 'id', foreignKey: 'ownerId' }),
            // }],
            where: where,
            limit: num,
            offset: (page-1) * num,
            order: markOrder,
        };
        Goods.findAndCountAll(findParams).then(result => {
            const _p = [];
            result.rows.forEach((items, index) => {
                const i = index;
                _p[index] = new Promise((resolve, reject) => {
                    common.getEventById({
                        ownerId: items.dataValues.id,
                        type: typeArr,
                    }, eventRes => {
                        if (eventRes.code === 200) {
                            result.rows[i].dataValues.events = eventRes.data;
                            resolve();
                        }
                    });    
                });
            });
            return Promise.all(_p).then(async () => {
                const _data = that.trans(result.rows);
                _data.forEach((items,index) => {
                    try {
                        _data[index].dataValues.location = items.dataValues.events[items.dataValues.events.length-1].dataValues.content.borrowLocation;
                        _data[index].dataValues.type = items.dataValues.events[items.dataValues.events.length-1].dataValues.content.borrowType;
                        _data[index].dataValues.borrowExpectTime = items.dataValues.events[items.dataValues.events.length-1].dataValues.content.borrowExpectTime;
                    } catch (e) {
                        
                    }
                });
                for (let i = 0; i < id_arr.length; i++) {
					for (let j = 0; j < _data.length; j++) {
						if(id_arr[i]==_data[j].id){
							break;
						}else if(id_arr[i]!=_data[j].id&&j==_data.length-1){
							id_arr.splice(i,1);
							i--;
						}
					}
                }
                // 计算当前条件下，不分页的资产数量价值
                const goodsAmountInfo = await this.getGoodsNumAndAmount(where);
                cb({
                    code: 200,
                    msg: '',
                    data: {
                        data: _data,
                        goodsAmountInfo,
                        id_arr: id_arr,
                        total: result.count
                    }
                });
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });
}

/**
 *  指定id物品
 */
this.getTargetItem = (params,cb) => {
    const { targetKey } = params;
    const that = this;
    Goods.findOne({
        // include: [GoodsBorrowRecords],
        where: {
            id: targetKey
        }
    }).then(result => {
        common.getEventById({
            ownerId: result.dataValues.id,
            type: [ '1002' ],
        }, eventRes => {
            if (eventRes.code !== 200) return cb(eventRes);
            result.dataValues.events = eventRes.data;
            const resData = that.trans([result])[0];
            try {
                resData.dataValues.location = resData.dataValues.events[resData.dataValues.events.length-1].dataValues.content.borrowLocation;
                resData.dataValues.type = resData.dataValues.events[resData.dataValues.events.length-1].dataValues.content.borrowType;
                resData.dataValues.borrowExpectTime = resData.dataValues.events[resData.dataValues.events.length-1].dataValues.content.borrowExpectTime;
            } catch (e) {
                LOG(e);
            }
            cb({
                code: 200,
                msg: '',
                data: resData
            }); 
        });
    }).catch(e => LOG(e));
}

/**
 * 获取指定类型的物品个数和总价
 */
this.getGoodsNumAndAmount = async where => {
    const list = await Goods.findAll({ where });
    let count = list.length;
    let amount = 0, presentAmount = 0;
    list.forEach((items,index) => {
        amount += Number(items.dataValues.originalValue);
        presentAmount += Number(items.dataValues.presentValue);
    });
    return {
        count,
        amount,
        presentAmount,
    };
    // const { goodsType } = params;
    // const where = {
    //     isdel: 0
    // };
    // if(goodsType){
    //     where.goodsType = goodsType;
    // }
    // Goods.findAll({
    //     where
    // }).then(result => {
    //     let count = result.length;
    //     let amount = 0, presentAmount = 0;
    //     result.forEach((items,index) => {
    //         amount += Number(items.dataValues.originalValue);
    //         presentAmount += Number(items.dataValues.presentValue);
    //     });
    //     cb({
    //         code: 200,
    //         msg: '',
    //         data: {
    //             count,
    //             amount,
    //             presentAmount,
    //         }
    //     });
    // }).catch(e => cb(responseError(e)));
}

/**
 * 借用记录
 */
this.borrowHistory = (params,cb) => {
    const { numbering } = params;
    Goods.findOne({
        where: {
            numbering
        }
    }).then(result => {
        return common.getEventById({
            ownerId: result.dataValues.id,
            type: [ '1001', '1002', '1004' ],
        }, result => {
            const staffMap = new base.StaffMap().getStaffMap();
            result.data.forEach((items,index) => {
                try{
                    result.data[index].dataValues.person = staffMap[items.dataValues.person].user_name;
                    result.data[index].dataValues.time = DATETIME(items.dataValues.time);
                    result.data[index].dataValues.type = common.eventMapper()[items.dataValues.type].comment;
                    result.data[index].dataValues.content.borrowExpectTime = items.dataValues.content.borrowExpectTime ? DATETIME(items.dataValues.content.borrowExpectTime) : '';
                }catch(e) {
                    console.log(e);
                }
            });
            cb({
                code: 200,
                msg: '',
                data: result.data
            });
        });
        // return GoodsBorrowRecords.findAll({
        //     where: {
        //         good_id: result.dataValues.id
        //     },
        //     order: [['id','DESC']]
        // }).then(result => {
        //     const staffMap = new base.StaffMap().getStaffMap();
        //     result.forEach((items,index) => {
        //         try{
        //             result[index].dataValues.borrower = staffMap[items.dataValues.borrower].user_name;
        //         }catch(e){

        //         }
        //         try{
        //             result[index].dataValues.taker = staffMap[items.dataValues.taker].user_name;
        //         }catch(e){

        //         }
        //     });
        //     cb({
        //         code: 200,
        //         msg: '',
        //         data: result
        //     });
        // }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 更新
 */
this.update = (params, cb) => {
    let { admin_id, formData } = params;
    formData = typeof formData == 'object' ? formData : JSON.parse(formData);
    delete formData.insertPerson;
    delete formData.insertTime;
    delete formData.user;
    delete formData.borrowStatus;
    delete formData.album;
    formData.updatePerson = admin_id;
    formData.updateTime = TIME();
    let { management, manager } = formData;
    Staff.findOne({
        where: {
            // branch: management,
            user_name: manager,
            isdel: 0,
            on_job: 1
        }
    }).then(result => {
        // if(result){
            formData.manager = result.dataValues.user_id;
            return Goods.update(formData,{
                where: {
                    id: formData.id
                }
            }).then(result => {
                cb({
                    code: 200,
                    msg: '更新成功',
                    data: result
                });
            }).catch(e => { throw e });
        // }else{
        //     // 该部门不存在该成员
        //     throw createError(errorMapper.noMemberInBranch);
        // }
    }).catch(e => cb(responseError(e)));
}

/**
 * 申请借用
 */
this.applyBorrow = (params, cb) => {
    const { id, admin_id } = params;
    Goods.findOne({
        where: {
            id
        }
    }).then(result => {
        const { borrowStatus, mainId } = result.dataValues;
        if(borrowStatus=='无借用'&&!mainId){
            getIdArr({
                id
            }, result => {
                if(result.code==200){
                    const idArr = result.data;
                    idArr.push(id);
                    return Goods.update({
                        user: admin_id,
                        borrowStatus: '借用已申请',
                        updatePerson: admin_id,
                        updateTime: TIME()
                    },{
                        where: {
                            id: {
                                '$in': idArr
                            }
                        }
                    }).then(() => {
                        cb({
                            code: 200,
                            msg: '申请成功',
                            data: []
                        });
                        sendBorrowMsg(id, admin_id);
                    }).catch(e => cb(responseError(e)));
                }else{
                    cb(result);
                }
            });
        }else{
            throw createError(errorMapper.notAllowBorrow);
        }
    }).catch(e => cb(responseError(e)));
}

async function sendBorrowMsg(id, admin_id){
    const goodsEntity = await Goods.findOne({ where: { id }});
    const { goodsName, numbering, manager } = goodsEntity.dataValues;
    const mailId = Date.now();
    const staffMap = new base.StaffMap().getStaffMap();
    const applyUserName = staffMap[admin_id].user_name;
    request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
        console.log(body);
    }).form({
        data: JSON.stringify({
            mailId: mailId,
            class: 'goods',
            priority: '普通',
            frontUrl: '/goods',
            sender: admin_id,
            post_time: TIME(),
            title: '分类物品管理',
            content: applyUserName+'申请借用'+goodsName+'（'+numbering+'），请及时处理！',
            votes: '已阅',
            subscriber: manager,
            NotiClientSubs: [
                {
                    receiver: manager,
                    noti_post_mailId: mailId
                }
            ]
        })
    });
}

/**
 *  批准借用
 */
this.agreeBorrow = (params,cb) => {
    const { id, recordId, admin_id } = params;

    const dealer = (id, cb) => {
        Goods.findOne({ where: { id } }).then(result => {
            const { user } = result.dataValues;
            return Goods.update({
                borrowStatus: '无借用',
                manager: user,
                user: null,
                updatePerson: admin_id,
                updateTime: TIME(),
            },{ where: { id } }).then(() => {
                return BaseEvent.findOne({ where: { id: recordId } }).then(result => {
                    const { contentId } = result.dataValues;
                    return new Promise((resolve, reject) => {
                        common.createEvent({
                            headParams: {
                                ownerId: id,
                                type: '1002',
                                time: TIME(),
                                person: user,
                            },
                            bodyParams: {
                                borrowStartTime: TIME(),
                                borrowType: '借用',
                                borrowLocation: '杭州办',
                            },
                        }, result => {
                            if (result.code === 200) {
                                resolve();
                            } else {
                                reject();
                            }
                        });
                    }).then(() => {
                        cb({
                            code: 200,
                            msg: '操作成功',
                            data: []
                        });
                    }).catch(e => { throw e });
                }).catch(e => { throw e });
            }).catch(e => { throw e });
        }).catch(e => cb(responseError(e)));
    }

    getIdArr({
        id
    },result => {
        if(result.code==200){
            const idArr = result.data;
            idArr.push(id);
            const _p = [];
            idArr.forEach((items, index) => {
                _p[index] = new Promise((resolve,reject) => {
                    dealer(items,() => resolve());
                });
            });
            Promise.all(_p).then(() => {
                cb({
                    code: 200,
                    msg: '操作成功',
                    data: []
                });
            }).catch(e => cb(responseError(e)));
        }else{
            cb(result);
        }
    });

}

/**
 * 新增时直接触发借用
 */
exports.directBorrow = async params => {
    const { id, admin_id, borrowUserId } = params;
    await Goods.update({
        manager: borrowUserId,
        updatePerson: admin_id,
        updateTime: TIME(),
    }, { where: { id } });
    common.createEvent({
        headParams: {
            ownerId: id,
            type: '1002',
            time: TIME(),
            person: borrowUserId,
        },
        bodyParams: {
            borrowStartTime: TIME(),
            borrowType: '借用',
            borrowLocation: '杭州办',
        },
    }, () => {});
    // 发消息给指定借用人
    const staffMapper = new base.StaffMap().getStaffMap();
    let borrowName;
    try {
        borrowName = staffMapper[borrowUserId].user_name;
    } catch (e) {
        borrowName = borrowUserId;
    }
    const goodsEntity = await Goods.findOne({ where: { id }});
    const { numbering } = goodsEntity.dataValues;
    const mailId = Date.now();
    request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
        console.log(body);
    }).form({
        data: JSON.stringify({
            mailId: mailId,
            class: 'goods',
            priority: '普通',
            frontUrl: '/goods',
            sender: admin_id,
            post_time: TIME(),
            title: '分类物品管理',
            content: borrowName+'借用物品（'+numbering+'）',
            votes: '已阅',
            subscriber: borrowUserId,
            NotiClientSubs: [
                {
                    receiver: borrowUserId,
                    noti_post_mailId: mailId
                }
            ]
        })
    });
    return {
        code: 200,
        msg: '更新成功',
    };
}

/**
 *  不批准借用
 */
this.notAggreBorrow = (params,cb) => {
    const { id, admin_id } = params;
    getIdArr({
        id
    }, result => {
        if(result.code==200){
            const idArr = result.data;
            idArr.push(id);
            Goods.update({
                borrowStatus: '无借用',
                user: null,
                updatePerson: admin_id,
                updateTime: TIME()
            },{
                where: {
                    id: {
                        '$in': idArr
                    }
                }
            }).then(result => {
                cb({
                    code: 200,
                    msg: '操作成功',
                    data: []
                });
            }).catch(e => cb(responseError(e)));
        }else{
            cb(result);
        }
    });
}

/**
 * 申请出库
 */
this.applyDel = (params,cb) => {
    const { id, delRem, admin_id } = params;
    Goods.findOne({
        where: {
            id
        }
    }).then(result => {
        const { borrowStatus, mainId } = result.dataValues;
        if(borrowStatus=='无借用'&&!mainId){
            getIdArr({
                id
            },result => {
                if(result.code==200){
                    const idArr = result.data;
                    idArr.push(id);
                    Goods.update({
                        borrowStatus: '出库已申请',
                        delRem,
                        updatePerson: admin_id,
                        updateTime: TIME()
                    },{
                        where: {
                            id: {
                                '$in': idArr
                            }
                        }
                    }).then(async () => {
                        cb({
                            code: 200,
                            msg: '操作成功',
                            data: []
                        });
                        if (await sendCheckMsg(id, admin_id)) {
                            sendDelMsg(id, admin_id);
                        }
                    }).catch(e => cb(responseError(e)));
                }else{
                    cb(result);
                }
            });
        }else{
            throw createError(errorMapper.notAllowDel);
        }
    }).catch(e => cb(responseError(e)));
}

// 检测是否为试产品申请出库
async function sendCheckMsg(id, admin_id) {
    const goodsEntity = await Goods.findOne({ where: { id }});
    const { goodsType, goodsName, numbering } = goodsEntity.dataValues;
    if (goodsType !== '试产品') {
        return true;
    }
    const objStr = JSON.stringify({
        type: 's_goods',
        id,
        admin_id,
    });
    const secret = 'langjie'; 						//密钥
    const cipher = crypto.createCipher('aes128', secret);
    let aesStr = cipher.update(objStr, 'utf8', 'hex'); //编码方式从utf-8转为hex;
    aesStr += cipher.final('hex'); 					//编码方式从转为hex;

    const staffMap = new base.StaffMap().getStaffMap();
    const applyUserName = staffMap[admin_id].user_name;
    const mailId = Date.now();
    request.post(ROUTE('notiPost/add?regName=justReadForAttention'),(err,response,body) => {
        console.log(body);
    }).form({
        data: JSON.stringify({
            mailId: mailId,
            class: 'goods',
            priority: '普通',
            frontUrl: '/goods',
            sender: admin_id,
            post_time: TIME(),
            title: '分类物品管理',
            content: applyUserName+'申请出库'+goodsName+'（'+numbering+'），请及时处理！',
            votes: '同意,不同意',
            aesStr,
            subscriber: '1006',
            NotiClientSubs: [{
                receiver: '1006',
                noti_post_mailId: mailId,
            }],
        })
    });
    return false;
}

async function sendDelMsg(id, admin_id){
    const goodsEntity = await Goods.findOne({ where: { id }});
    const { goodsName, numbering } = goodsEntity.dataValues;
    const mailId = Date.now();
    const staffMap = new base.StaffMap().getStaffMap();
    const applyUserName = staffMap[admin_id].user_name;
    const staffEntityArr = await Staff.findAll({ where: { on_job: 1, isdel: 0, branch: '管理部'}});
    const subscriberArr = [];
    staffEntityArr.forEach(items => {
        const user_id = items.dataValues.user_id;
        if (user_id != admin_id) {
            subscriberArr.push(user_id);
        }
    });
    const NotiClientSubs = subscriberArr.map(items => {
        return {
            receiver: items,
            noti_post_mailId: mailId
        };
    });
    request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
        console.log(body);
    }).form({
        data: JSON.stringify({
            mailId: mailId,
            class: 'goods',
            priority: '普通',
            frontUrl: '/goods',
            sender: admin_id,
            post_time: TIME(),
            title: '分类物品管理',
            content: applyUserName+'申请出库'+goodsName+'（'+numbering+'），请及时处理！',
            votes: '已阅',
            subscriber: subscriberArr.join(),
            NotiClientSubs,
        })
    });
}
exports.sendDelMsg = sendDelMsg;

/**
 *  出库
 */
this.del = (params,cb) => {
    const { id, admin_id } = params;
    const dealer = (id, cb) => {
        return Goods.update({
            isdel: 1,
            borrowStatus: '无借用',
            updatePerson: admin_id,
            updateTime: TIME()
        },{ where: { id } }).then(() => {
            return BaseEvent.findOne({
                where: { ownerId: id },
                order: [['id', 'DESC']],
            }).then(result => {
                const { contentId } = result.dataValues;
                return new Promise((resolve, reject) => {
                    return Goods.findOne({ where: { id } }).then(gr => {
                        common.createEvent({
                            headParams: {
                                ownerId: id,
                                type: '1004',
                                time: TIME(),
                                person: admin_id,
                                rem: gr.dataValues.delRem,
                            },
                            bodyParams: {},
                        }, result => {
                            if (result.code === 200) {
                                resolve();
                            } else {
                                reject();
                            }
                        });
                    }).catch(e => reject(e));
                    // SubEventContent.updateOne({ _id: contentId }, {
                    //     borrowEndTime: TIME(),
                    //     borrowTaker: admin_id,
                    // }, (err, mongoRes) => {
                    //     if (err) return reject(err);
                    //     resolve();
                    // });
                }).then(() => {
                    cb({
                        code: 200,
                        msg: '出库成功',
                        data: []
                    });
                }).catch(e => { throw e });
            }).catch(e => { throw e });
        }).catch(e => cb(responseError(e)));
    }

    getIdArr({
        id
    },result => {
        if(result.code==200){
            const idArr = result.data;
            idArr.push(id);
            const _p = [];
            idArr.forEach((items, index) => {
                _p[index] = new Promise((resolve,reject) => {
                    dealer(items,() => resolve());
                });
            });
            Promise.all(_p).then(() => {
                cb({
                    code: 200,
                    msg: '出库成功',
                    data: []
                });
            }).catch(e => cb(responseError(e)));
        }else{
            cb(result);
        }
    });
}

/**
 * 不同意出库
 */
this.cancelDealDel = (params, cb) => {
    const { id, admin_id } = params;
    Goods.findOne({
        where: {
            id
        }
    }).then(result => {
        const { borrowStatus, mainId } = result.dataValues;
        if(borrowStatus=='出库已申请'&&!mainId){
            getIdArr({
                id
            },result => {
                if(result.code==200){
                    const idArr = result.data;
                    idArr.push(id);
                    Goods.update({
                        borrowStatus: '无借用',
                        delRem: '',
                        updatePerson: admin_id,
                        updateTime: TIME()
                    },{
                        where: {
                            id: {
                                '$in': idArr
                            }
                        }
                    }).then(() => {
                        cb({
                            code: 200,
                            msg: '操作成功',
                            data: []
                        });
                    }).catch(e => cb(responseError(e)));
                }else{
                    cb(result);
                }
            });
        }else{
            throw createError(errorMapper.notAllowDel);
        }
    }).catch(e => cb(responseError(e)));
}

/**
 * 编辑存放点，责任类型，借用截止期页面
 */
this.editBorrow = (params, cb) => {
    const { id } = params;
    BaseEvent.findOne({ where: { id } }).then(result => {
        return new Promise((resolve, reject) => {
            SubEventContent.findById(result.dataValues.contentId, ['borrowExpectTime', 'borrowType', 'borrowLocation', 'rem'], (err, mongoRes) => {
                if (err) return reject(err);
                result.dataValues.content = mongoRes;
                resolve();
            });
        }).then(() => {
            getMainGoodsAndFollowGoods({
                id: result.dataValues.ownerId,
            }, r => {
                const { followArr, mainArr } = r;
                result.dataValues.followArr = followArr;
                result.dataValues.mainArr = mainArr;
                const staffMap = new base.StaffMap().getStaffMap();
                result.dataValues.borrower = staffMap[result.dataValues.person].user_name;
                result.dataValues.borrowStartTime = DATETIME(result.dataValues.time);
                result.dataValues.borrowExpectTime = result.dataValues.content.borrowExpectTime ? DATETIME(result.dataValues.content.borrowExpectTime) : '';
                result.dataValues.type = result.dataValues.content.borrowType;
                result.dataValues.location = result.dataValues.content.borrowLocation;
                result.dataValues.rem = result.dataValues.content.rem;
                cb({
                    code: 200,
                    msg: '',
                    data: result.dataValues,
                });
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 提交编辑存放点，责任类型，借用截止期， rem
 * 从属物品，下属物品
 */
this.updateEditBorrow = (params, cb) => {
    let { id, type, location, borrowExpectTime, good_id, subFollowArr, needRemove, rem } = params;
    const that = this;
    const formData1 = {
        borrowType: type,
        borrowLocation: location,
        borrowExpectTime,
        rem,
    };
    if(!formData1.borrowExpectTime) delete formData1.borrowExpectTime;
    // 上属物品
    return new Promise((resolve, reject) => {
        if (needRemove) {
            return Goods.update({
                mainId: null
            },{
                where: {
                    id: good_id,
                }
            }).then(() => resolve()).catch(e => reject(e));
        } else {
            resolve();
        }
    }).then(() => {
        // 下属物品
        return new Promise((resolve, reject) => {
            if (subFollowArr) {
                subFollowArr = subFollowArr.split(',').filter(items => items);
                const _p = [];
                subFollowArr.forEach((items, index) => {
                    _p[index] = new Promise((resolve, reject) => {
                        return Goods.update({
                            mainId: good_id,
                        },{
                            where: {
                                id: items
                            }
                        }).then(result => resolve()).catch(e => {throw e});
                    });
                });
                return Promise.all(_p).then(() => resolve()).catch(e => { throw e });
            } else {
                resolve();
            }
        }).then(() => {
            return BaseEvent.findOne({ where: { id } }).then(result => {
                const { contentId, ownerId } = result.dataValues;
                return new Promise((resolve, reject) => {
                    SubEventContent.updateOne({
                        _id: contentId
                    }, formData1, (err, mongoRes) => {
                        if (err) return reject(err);
                        resolve();
                    });
                }).then(() => {
                    return Goods.update({
                        location: formData1.borrowLocation,
                        updateTime: TIME(),
                    }, { where: { id: ownerId } }).then(() => {
                        cb({
                            code: 200,
                            msg: '更新成功',
                            data: [],
                        });
                    }).catch(e => { throw e });
                }).catch(e => { throw e });
            }).catch(e => { throw e });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}


this.photoEdit = (params,cb) => {
    const { numbering } = params;
    Goods.findOne({
        attributes: ['album','id','numbering'],
        where: {
            numbering
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
 * 更新照片字段
 * 记录更新照片事件
 */
this.updateAlbum = (params, cb) => {
    let { id, album, admin_id } = params;
    this.getPhotoInfo({
        fileName: album
    }, fileRes => {
        if (fileRes.code === 200) {
            Goods.update({
                album,
                albumUpdateTime: TIME(),
            },{ where: { id } }).then(() => {
                common.createEvent({
                    headParams: {
                        person: admin_id,
                        time: TIME(),
                        ownerId: id,
                        type: '1003',
                        ownerId: id,
                    },
                    bodyParams: { goodsAlbum: album, goodsAlbumBirth: fileRes.data.birthtime },
                }, result => {
                    if (result.code === 200) {
                        cb({
                            code: 200,
                            msg: '更新成功',
                            data: [],
                        });
                    } else {
                        cb(result);
                    }
                });
            }).catch(e => cb(responseError(e)));
        } else {
            cb(fileRes);
        }
    });
}

/**
 *  获取图片拍摄时间
 */
this.getPhotoInfo = (params,cb) => {
    const { fileName } = params;
    fs.stat(DIRNAME+'/public/img/goods/'+fileName,(err,result) => {
        if(err){
            cb({
                code: -1,
                msg: e.message,
                data: []
            });
        }else{
            result.birthtime = TIME(result.birthtime);
            cb({
                code: 200,
                msg: '',
                data: result
            });
        }
    });
}

/**
 *  模糊搜索员工
 */
this.searchStaff = (params,cb) => {
    const { keywords } = params.params;
    Staff.findAll({
        where: {
            on_job: 1,
            isdel: 0,
            '$or': {
                user_id: {
                    '$like': '%'+keywords+'%'
                },
                user_name: {
                    '$like': '%'+keywords+'%'
                },
                English_abb: {
                    '$like': '%'+keywords+'%'
                },
                English_name: {
                    '$like': '%'+keywords+'%'
                }
            }
        }
    }).then(result => {
        const res_arr = [];
        result.forEach((items,index) => {
            res_arr.push({
                text: items.dataValues.user_name,
                value: items.dataValues.user_name
            });
        });
        cb({
            code: 200,
            msg: '',
            data: res_arr
        });
    }).catch(e => LOG(e));
}

/**
 * 添加主体id
 */
this.addMainId = (params, cb) => {
    const { mainId, goodsNumbering } = params;
    // 判断出库状态是否一致
    // 判断管理者是否一致
    // 判断借用状态是否为无借用
    // 判断是否已经有主体了
    // 判断是否存在互相引用的关系
    Goods.findOne({
        where: {
            numbering: goodsNumbering
        }
    }).then(result => {
        const goodsId = result.dataValues.id;
        return Goods.findAll({
            where: {
                id: {
                    '$in': [mainId, goodsId]
                }
            }
        }).then(result => {
            const manager1 = result[0].dataValues.manager;
            const manager2 = result[1].dataValues.manager;
            const borrowStatus1 = result[0].dataValues.borrowStatus;
            const borrowStatus2 = result[1].dataValues.borrowStatus;
            const isdel1 = result[0].dataValues.isdel;
            const isdel2 = result[1].dataValues.isdel;
            if(result[0].dataValues.id == result[1].dataValues.mainId || result[1].dataValues.id == result[0].dataValues.mainId){
                throw createError(errorMapper.errorOperation);
            }
            let originMainId;
            result.forEach((items, index) => {
                if(items.dataValues.id == goodsId && items.dataValues.mainId) {
                    throw createError(errorMapper.hasMainId);
                }
            });
            if(manager1!=manager2) throw createError(errorMapper.managerNotConsistent);
            if(borrowStatus1!=borrowStatus2) throw createError(errorMapper.borrowStatusNotConsistent);
            if(isdel1!=isdel2) throw createError(errorMapper.isdelNotConsistent);
            if(borrowStatus1!='无借用') throw createError(errorMapper.presentStatusNotAllowed);
            return Goods.findOne({
                where: {
                    numbering: goodsNumbering,
                }
            }).then(result => {
                cb({
                    code: 200,
                    msg: '',
                    data: result,
                });
            }).catch(e => { throw e });
            // return Goods.update({
            //     mainId
            // },{
            //     where: {
            //         id: goodsId
            //     }
            // }).then(result => cb({
            //     code: 200,
            //     msg: '组装成功',
            //     data: result
            // })).catch(e => {throw e});
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 移除主体id
 */
this.removeMainId = (params, cb) => {
    const { id } = params;
    Goods.findOne({
        where: {
            id
        }
    }).then(result => {
        const { borrowStatus } = result.dataValues;
        if(borrowStatus=='无借用'){
            Goods.update({
                mainId: null
            },{
                where: {
                    id
                }
            }).then(() => {
                cb({
                    code: 200,
                    msg: '拆卸成功',
                    data: []
                });
            }).catch(e => cb(responseError(e)));
            // getIdArr(params, result => {
            //     if(result.code==200){
            //         const idArr = result.data;
            //         Goods.update({
            //             mainId: null
            //         },{
            //             where: {
            //                 id: {
            //                     '$in': idArr
            //                 }
            //             }
            //         }).then(() => {
            //             cb({
            //                 code: 200,
            //                 msg: '分解成功',
            //                 data: idArr
            //             });
            //         }).catch(e => cb(responseError(e)));
            //     }else{
            //         cb(result);
            //     }
            // });
        }else{
            throw createError(errorMapper.presentStatusNotAllowed);
        }
    }).catch(e => cb(responseError(e)));
}

// 获取被引用的物品idArr
function getIdArr(params, cb) {
    // 递归查找所有引用该物品的id
    function recursionByMainId(id,resolve){
        return Goods.findAll({
            where: {
                mainId: id
            }
        }).then(result => {
            const _p = [];
            result.forEach((items, index) => {
                _p[index] = new Promise((resolve,reject) => {
                    const { id } = items.dataValues;
                    idArr.push(id);
                    if(id) return recursionByMainId(id,resolve);
                    resolve();
                });
            });
            return Promise.all(_p).then(() => resolve());
        });
    }

    const { id } = params;
    const idArr = [];
    new Promise((resolve,reject)=> {
        return recursionByMainId(id,resolve);
    }).then(() => {
        cb({
            code: 200,
            msg: '',
            data: idArr
        });
    }).catch(e => cb(responseError(e)));

}

// 获取有哪些组装件和属于哪个物品
function getMainGoodsAndFollowGoods(params, cb){
    const { id } = params;
    const mainArr = [], followArr = [];
    new Promise((resolve,reject) => {
        getIdArr({
            id
        }, result => {
            if(result.code==200){
                const idArr = result.data;
                Goods.findAll({
                    where: {
                        id: {
                            '$in': idArr
                        }
                    }
                }).then(result => {
                    result.forEach((items,index) => {
                        followArr.push(items.dataValues.goodsName);
                    });
                    resolve();
                });
            }else{
                resolve();
            }
        });
    }).then(() => {
        return Goods.findOne({
            where: {
                id
            }
        }).then(result => {
            const { mainId } = result.dataValues;
            if(mainId){
                return Goods.findOne({
                    where: {
                        id: mainId
                    }
                }).then(result => {
                    mainArr.push(result.dataValues.goodsName);
                    cb({
                        mainArr,
                        followArr
                    });
                });
            }else{
                cb({
                    mainArr,
                    followArr
                });
            }
        });
    });
}

/**
 * 下载本月未拍照的物品
 */
this.downloadNotUpdateImg = (params, cb) => {
    const hasDoneImgArr = [];
    BaseEvent.findAll({
        where: {
            isdel: 0,
            type: '1003',
        }
    }).then(result => {
        result.forEach(items => {
            const { time, ownerId } = items.dataValues;
            if (moment(time).format('YYYY-MM') == moment().format('YYYY-MM')) {
                hasDoneImgArr.push(Number(ownerId));
            }
        });
    }).then(() => {
        return Goods.findAll({
            where: {
                isdel: 0,
                id: {
                    '$notIn': hasDoneImgArr,
                },
            }
        }).then(result => {
            const data = [
                [ '编号', '物品名', '类型', '保管人' ],
            ];
            const staffMap= new base.StaffMap().getStaffMap();
            result.forEach((items, index) => {
                let { numbering, goodsName, goodsType, manager } = items.dataValues;
                manager = staffMap[manager].user_name;
                data.push([ numbering, goodsName, goodsType, manager ]);
            });
            const buffer = xlsx.build([
                {
                    name: 'sheet1',
                    data,
                }
            ]);
            const fileName = '未拍照物品' + moment().format('YYYY-MM') + '.xlsx';
            try {
				fs.writeFileSync(DIRNAME + '/downloads/temp/' + fileName, buffer, { 'flag': 'w' });
			} catch (e) {
				throw e;
            }
            cb({
                code: 200,
                msg: '',
                data: '/temp/' + fileName,
            });
        }).catch(e => { throw e });
    }).catch(e => LOG(e));
}