const Affair = require('../dao').Affair;
const NotiClient = require('../dao').NotiClient;
const NotiClientSub = require('../dao').NotiClientSub;
const OnDuty = require('../dao').OnDuty;
const homeNotiSystem = require('./homeNotiSystem');
const homeStaff = require('./homeStaff');
const homeMember = require('./homeMember');
const homeCustomers = require('./homeCustomers');
const SmallAffair = require('../dao').SmallAffair;
const base = require('./base');

/**
 *  我的客服
 *  需要判断身份（非会员，热线会员，专线会员）
 */
this.onlineService = (params, cb) => {
    const { open_id } = params;
    homeMember.getInfoByOpenId({
        open_id: open_id
    }, result => {
        if (result) {
            const { company } = result.dataValues;
            homeCustomers.getTargetItem({
                targetKey: company
            }, result => {
                if (result.data && result.data.dataValues && result.data.dataValues.company) {
                    const { user_id } = result.data.dataValues;
                    Affair.findOne({
                        where: {
                            customerId: user_id,
                            isdel: 0,
                            state: {
                                '$ne': '关闭'
                            },
                            outerContact: {
                                '$like': '%' + open_id + '%'
                            }
                        }
                    }).then(result => {
                        if (result) {
                            cb({
                                code: 200,
                                msg: '专线会员',
                                data: user_id
                            });
                        } else {
                            cb({
                                code: 100,
                                msg: '热线会员',
                                data: []
                            });
                        }
                    }).catch(e => LOG(e));
                } else {
                    cb({
                        code: 100,
                        msg: '热线会员',
                        data: []
                    });
                }
            });
        } else {
            cb({
                code: -1,
                msg: '非会员',
                data: []
            });
        }
    });
}

/*********************************** 客户热线 *****************************************/

/**
 *  获取指定会员的发言和被回复的消息
 */
this.getHotList = (params, cb) => {
    let { open_id, page, num, self } = params;
    let _p = [], resArr = [];
    //获取线上服务大厅的uuid
    const uuid = CONFIG.onlineId;
    _p[0] = new Promise((resolve, reject) => {
        NotiClient.findAll({
            include: {
                model: NotiClientSub
            },
            where: {
                sender: open_id,
                isdel: 0
            },
            // limit: num,
            // offset: (page-1) * num
        }).then(result => {
            for (let index = 0; index < result.length; index++) {
                const items = result[index];
                if (self && uuid != items.noti_client_affair_group_uuid) continue;
                let obj = {
                    sender: items.sender,
                    post_time: items.post_time,
                    content: items.content,
                    album: items.album,
                    file: items.file
                };
                resArr.push(obj);
                items.NotiClientSubs.forEach((it, ind) => {
                    if (it.replied && it.atMe && it.atReply.trim()) {
                        let obj = {
                            sender: it.receiver,
                            post_time: it.replyTime,
                            content: it.atReply
                        };
                        resArr.push(obj);
                    }
                });
            }
            resolve();
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(result => {
        const s = (a, b) => {
            return Date.parse(b.post_time) - Date.parse(a.post_time);
        }
        resArr = resArr.sort(s);
        resArr = resArr.splice((page - 1) * num, num);
        resArr = resArr.reverse();
        cb({
            code: 200,
            msg: '',
            data: resArr
        });
    }).catch(e => LOG(e));
}

/**
 *  发布消息
 */
this.addHostMsg = (params, cb) => {
    const { open_id, form_data, self, fromCallPerson } = params;
    form_data.class = 'respoAffair';
    form_data.priority = '普通';
    form_data.frontUrl = '/custRelationsAffairs';
    form_data.sender = open_id;
    form_data.post_time = TIME();
    form_data.title = '线上服务大厅';
    OnDuty.findOne({
        where: {
            type: 2,
            date: DATETIME(),
            isdel: 0
        }
    }).then(result => {
        let onDutyPerson;
        new Promise((resolve, reject) => {
            if (fromCallPerson) {
                onDutyPerson = fromCallPerson;
                resolve();
                return;
            }
            if (result) {
                onDutyPerson = result.dataValues.user_id;
                resolve();
            } else {
                homeStaff.orderParamsList({
                    duty: '客服主管',
                    isdel: 0,
                    on_job: 1
                }, result => {
                    if (result.data.length == 0) {
                        onDutyPerson = '1103';
                    } else {
                        onDutyPerson = result.data[0].dataValues.user_id;
                    }
                    resolve();
                });
            }
        }).then(result => {
            new Promise((resolve, reject) => {
                if (self) {   //获取专线的团队
                    Affair.findOne({
                        where: {
                            isdel: 0,
                            state: {
                                '$ne': '关闭'
                            },
                            outerContact: {
                                '$like': '%' + open_id + '%'
                            }
                        }
                    }).then(result => {
                        const { team } = result.dataValues;
                        let _atSomeone = team.split(',')[0];
                        let _subscriber = team;
                        let _subscriberArr = _subscriber.split(',');
                        _subscriberArr.push(onDutyPerson);
                        _subscriberArr = [...new Set(_subscriberArr)];
                        _subscriber = _subscriberArr.join();
                        form_data.atSomeone = _atSomeone;
                        form_data.subscriber = _subscriber;
                        form_data.votes = '已阅';
                        resolve();
                    }).catch(e => LOG(e));
                } else {
                    form_data.atSomeone = onDutyPerson;
                    form_data.subscriber = onDutyPerson;
                    resolve();
                }
            }).then(result => {
                Affair.findOne({
                    where: {
                        name: '线上服务大厅'
                    }
                }).then(result => {
                    form_data.noti_client_affair_group_uuid = result.dataValues.uuid;
                    homeNotiSystem.notiClientAdd({
                        form_data: form_data,
                        notSendToBox: true
                    }, result => {
                        cb(result);
                    });
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}


/************************************** 客户专线 ****************************************/

/**
 *  获取指定会员专线的邮件
 */
this.getSpecialList = (params, cb) => {
    const { open_id, page, num } = params;
    homeMember.getInfoByOpenId({
        open_id: open_id
    }, result => {
        const { company } = result.dataValues;
        homeCustomers.getTargetItem({
            targetKey: company
        }, result => {
            const { user_id } = result.data.dataValues;
            Affair.findOne({
                where: {
                    customerId: user_id,
                    isdel: 0,
                    state: {
                        '$ne': '关闭'
                    }
                }
            }).then(result => {
                if (result) {
                    const { uuid } = result.dataValues;
                    //获取子事务
                    SmallAffair.findAll({
                        where: {
                            relatedAffairs: {
                                '$like': '%' + uuid + '%'
                            }
                        }
                    }).then(result => {
                        let uuidArr = result.map(items =>
                            items.dataValues.noti_client_affair_group_uuid
                        );
                        uuidArr.push(uuid);
                        uuidArr = [...new Set(uuidArr)];
                        NotiClient.findAll({
                            include: [NotiClientSub],
                            where: {
                                noti_client_affair_group_uuid: {
                                    '$in': uuidArr
                                },
                                isdel: 0
                            }
                        }).then(result => {
                            let resArr = [];
                            result.forEach((items, index) => {
                                let obj = {
                                    sender: items.sender,
                                    post_time: items.post_time,
                                    content: items.content,
                                    album: items.album,
                                    file: items.file
                                };
                                resArr.push(obj);
                                items.NotiClientSubs.forEach((it, ind) => {
                                    if (it.replied && it.atMe && it.atReply.trim()) {
                                        let obj = {
                                            sender: it.receiver,
                                            post_time: it.replyTime,
                                            content: it.atReply
                                        };
                                        resArr.push(obj);
                                    }
                                });
                            });
                            const s = (a, b) => {
                                return Date.parse(b.post_time) - Date.parse(a.post_time);
                            }
                            resArr = resArr.sort(s);
                            resArr = resArr.splice((page - 1) * num, num);
                            resArr = resArr.reverse();
                            //转换open_id -> name
                            const _p = [];
                            const staffMap = new base.StaffMap().getStaffMap();
                            resArr.forEach((items, index) => {
                                _p[index] = new Promise((resolve, reject) => {
                                    const it = items;
                                    const i = index;
                                    if (it.sender.indexOf('oxI') == -1) {
                                        try {
                                            resArr[i].senderName = staffMap[resArr[i].sender].user_name;
                                        } catch (e) {
                                            resArr[i].senderName = resArr[i].sender;
                                        }
                                        resolve();
                                    } else {
                                        homeMember.getInfoByOpenId({
                                            open_id: it.sender
                                        }, result => {
                                            resArr[i].senderName = result.dataValues.name;
                                            resArr[i].portrait = result.dataValues.portrait;
                                            resolve();
                                        });
                                    }
                                });
                            });
                            Promise.all(_p).then(() => {
                                cb({
                                    code: 200,
                                    msg: '',
                                    data: resArr
                                });
                            }).catch(e => LOG(e));
                        }).catch(e => LOG(e));
                    }).catch(e => LOG(e));
                } else {
                    cb({
                        code: -1,
                        msg: '没有该专线',
                        data: []
                    });
                }
            }).catch(e => LOG(e));
        });
    });
}

/**
 *  发送专线消息
 */
this.addSpecialMsg = (params, cb) => {
    const { open_id, form_data, fromCallPerson } = params;
    form_data.class = 'respoAffair';
    form_data.priority = '普通';
    form_data.frontUrl = '/specialLine';
    form_data.sender = open_id;
    form_data.post_time = TIME();
    Affair.findOne({
        where: {
            name: form_data.title,
            isdel: 0,
            state: {
                '$ne': '关闭'
            },
            outerContact: {
                '$like': '%' + open_id + '%'
            }
        }
    }).then(result => {
        const { uuid, team } = result.dataValues;
        let atSomeone = team.split(',')[0];
        form_data.atSomeone = atSomeone;
        form_data.subscriber = team;
        form_data.votes = '已阅';
        form_data.noti_client_affair_group_uuid = uuid;
        let addDuty;
        OnDuty.findOne({
            where: {
                type: 2,
                date: DATETIME(),
                isdel: 0
            }
        }).then(result => {
            new Promise((resolve, reject) => {
                if (result) {
                    addDuty = result.dataValues.user_id;
                    resolve();
                } else {
                    homeStaff.orderParamsList({
                        duty: '客服主管',
                        isdel: 0,
                        on_job: 1
                    }, result => {
                        if (result.data.length == 0) {
                            addDuty = '1103';
                        } else {
                            addDuty = result.data[0].dataValues.user_id;
                        }
                        resolve();
                    });
                }
            }).then(() => {
                let subscriberArr = form_data.subscriber.split(',');
                subscriberArr.push(addDuty);
                //来自电话联系单的业务员，只需要他回复，别人已阅就行！！！！！！！！！！！！！！！
                if (fromCallPerson) {
                    form_data.atSomeone = fromCallPerson;
                    subscriberArr.push(fromCallPerson);
                }
                subscriberArr = [...new Set(subscriberArr)];
                form_data.subscriber = subscriberArr.join();
                homeNotiSystem.notiClientAdd({
                    form_data: form_data,
                    notSendToBox: true
                }, result => {
                    cb(result);
                });
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}