const common = require('./common');
const base = require('./base');
const Staff = require('../dao').Staff;
const AttendanceDate = require('../dao').AttendanceDate;
const StaffSign = require('../dao').StaffSign;
const StaffSignLog = require('../dao').StaffSignLog;
const StaffOutLog = require('../dao').StaffOutLog;
const sequelize = require('../dao').sequelize;
const StaffOverWork = require('../dao').StaffOverWork;
const StaffAbsenceReason = require('../dao').StaffAbsenceReason;
const OnDuty = require('../dao').OnDuty;
const CompanyCalendar = require('../dao').CompanyCalendar;
const NotiPost = require('../dao').NotiPost;
const NotiPostSub = require('../dao').NotiPostSub;
const NotiClient = require('../dao').NotiClient;
const NotiClientSub = require('../dao').NotiClientSub;
const Affair = require('../dao').Affair;
const SmallAffair = require('../dao').SmallAffair;
const ProjectAffair = require('../dao').ProjectAffair;
const ProjectAffairProgress = require('../dao').ProjectAffairProgress;
const ProgressUpdateRecord = require('../dao').ProgressUpdateRecord;
const BaseEvent = require('../dao').BaseEvent;
const SubEventContent = require('../mongoModel/SubEventContent');
const Linq = require('linq');
const moment = require('moment');
const request = require('request');

/**
 *  需要签到的日期列表
 */
this.dateList = (params,cb) => {
    CompanyCalendar.findAll({
        where: {
            isworkingday: 1
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => LOG(e));
}

/**
 *  新增需要签到的日期列表
 */
this.addDateList = (params,cb) => {
    const that = this;
    const form_data = JSON.parse(params.form_data);
    const { needDelArr,needAddArr } = form_data;
    let todayChange = false;
    const updateWorkingDay = (isworkingday,dateArr,cb) => {
        isworkingday = isworkingday?isworkingday:0;
        CompanyCalendar.update({
            isworkingday: isworkingday
        },{
            where: {
                date: {
                    '$in': dateArr
                }
            }
        }).then(() => {
            cb();
        }).catch(e => LOG(e));
    }

    const date = DATETIME();
    if(needDelArr.indexOf(date)!=-1||needAddArr.indexOf(date)!=-1){
        todayChange = true;
    }

    const p_0 = new Promise((resolve,reject) => {
        updateWorkingDay(0,needDelArr,() => resolve());
    });

    const p_1 = new Promise((resolve,reject) => {
        updateWorkingDay(1,needAddArr,() => resolve());
    });

    Promise.all([p_0,p_1]).then(() => {
        cb({
            code: 200,
            msg: '提交成功',
            data: []
        });
        if(todayChange){
            that.updateSignStatus();
        }
    }).catch(e => LOG(e));
}

/**
 * 判断当天是否工作日
 */
this.checkIsWorkDay = (params, cb) => {
    CompanyCalendar.findOne({
        where: {
            date: DATETIME(),
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result.dataValues.isworkingday,
        });
    }).catch(e => LOG(e));
}

/**
 * 获取前n工作日的时间和非工作日
 * 包括自己，工作日调用该方法
 */
this.getDayByOrderNum = (params, cb) => {
    const { num } = params;
    const presentDate = DATETIME();
    CompanyCalendar.findAll({
        where: {
            date: {
                '$lte': presentDate,
            },
        },
        limit: 30,
        page: 1,
        order: [[ 'date', 'DESC' ]],
    }).then(result => {
        const dateArr = [];
        let workDay = 0;
        result.forEach((items, index) => {
            if (items.dataValues.isworkingday) {
                workDay++;
            }
            if (workDay < num + 2) {
                dateArr.push(items.dataValues);
            }
        });
        cb({
            code: 200,
            msg: '',
            data: dateArr,
        });
    }).catch(e => LOG(e));
}

/**处理未阅读，未回复 */
this.dealerNotReplyMsg = (params, cb) => {
    this.getDayByOrderNum({ num: CONFIG.affairMaxReplyTime }, dateArr => {
        dateArr = dateArr.data;
        dateArr.shift();
        dateArr = dateArr.map(items => items.date);
        const notiMsgArr = [], _p = [];
        dateArr.forEach((items, index) => {
            _p[index] = new Promise((resolve, reject) => {
                NotiClient.findAll({
                    where: {
                        post_time: sequelize.literal('date_format(NotiClient.post_time,"%Y-%m-%d") = "'+items+'"'),
                        isdel: 0,
                    },
                }).then(result => {
                    result.map(items => {
                        notiMsgArr.push(items.dataValues.mailId);
                    });
                    resolve();
                }).catch(e => LOG(e));
            });
        });
        return Promise.all(_p).then(() => {
            return NotiClientSub.findAll({
                where: {
                    noti_client_mailId: { $in: notiMsgArr },
                    isdel: 0,
                }
            }).then(result => {
                const notReadArr = [], notReplyArr = [];
                result.forEach((items, index) => {
                    if (!items.dataValues.replied) {
                        if (items.dataValues.atMe && !items.dataValues.atReply) {
                            notReplyArr.push({
                                mailId: items.dataValues.noti_client_mailId,
                                user_id: items.dataValues.receiver,
                            });
                        } else {
                            notReadArr.push({
                                mailId: items.dataValues.noti_client_mailId,
                                user_id: items.dataValues.receiver,
                            });
                        }
                    }
                });
                getNotiInfo(notReadArr, notReadArr => {
                    const _p = [];
                    notReadArr.forEach((items, index) => {
                        _p[index] = new Promise((resolve, reject) => {
                            items.eventCode = '1501';
                            logNotDealerEvent(items, () => resolve());
                        });
                    });
                    Promise.all(_p).then(() => console.log('未读记录完毕')).catch(e => LOG(e));
                });
                getNotiInfo(notReplyArr, notReplyArr => {
                    const _p = [];
                    notReplyArr.forEach((items, index) => {
                        _p[index] = new Promise((resolve, reject) => {
                            items.eventCode = '1502';
                            logNotDealerEvent(items, () => resolve());
                        });
                    });
                    Promise.all(_p).then(() => console.log('未回复记录完毕')).catch(e => LOG(e));
                });
            }).catch(e => { throw e });
        }).catch(e => LOG(e));
    });

    function getNotiInfo(arr, cb) {
        const _p = [];
        arr.forEach((items, index) => {
            const i = index;
            _p[index] = new Promise((resolve, reject) => {
                NotiClient.findOne({
                    where: {
                        mailId: items.mailId,
                        isdel: 0,
                    },
                }).then(result => {
                    arr[i].title = result.dataValues.title;
                    arr[i].post_time = result.dataValues.post_time;
                    arr[i].content = result.dataValues.content;
                    arr[i].sender = result.dataValues.sender;
                    resolve();
                }).catch(e => reject(e));
            });
        });
        return Promise.all(_p).then(() => {
            cb(arr);
        }).catch(e => LOG(e));
    }

    function logNotDealerEvent(params, cb) {
        common.createEvent({
            headParams: {
                person: params.user_id,
                time: TIME(),
                type: params.eventCode,
                ownerId: params.mailId,
            },
            bodyParams: {
                notiMailId: params.mailId,
                notiTitle: params.title,
                notiPostTime: params.post_time,
                notiContent: params.content,
                notiSender: params.sender,
                notiSenderName: new base.StaffMap().getStaffMap()[params.sender].user_name,
            },
        }, result => {
            cb();
        });
    }
}

/**处理未更新 */
this.dealerAffairNotUpdate = (params, cb) => {
    this.getDayByOrderNum({ num: CONFIG.affairMaxUpdateTime - 1 }, dateArr => {
        dateArr = dateArr.data;
        dateArr = dateArr.map(items => items.date);
        const logNotUpdateArr = [];
        Affair.findAll({
            include: [ProjectAffair,SmallAffair],
            where: {
                isdel: 0,
                priority: {
                    $ne: '暂缓',
                },
            }
        }).then(result => {
            const _p = [];
            result.forEach((items,index) => {
                _p[index] = new Promise((resolve,reject) => {
                    const { uuid, priority, insert_time, team, name, state } = items.dataValues;
                    if((items.dataValues.ProjectAffairs.length==0&&items.dataValues.SmallAffairs.length==0) || state=='已完成' || state=='关闭'){
                        resolve();
                    }else{
                        let completionDegree;
                        try{
                            completionDegree = items.dataValues.ProjectAffairs[0].dataValues.completionDegree;
                        }catch(e){
                            completionDegree = items.dataValues.SmallAffairs[0].dataValues.completionDegree;
                        }
                        if(completionDegree<90) {
                            const teamArr = team.split(',');
                            const in_p = [];
                            teamArr.forEach((items, index) => {
                                in_p[index] = new Promise((resolve, reject) => {
                                    let inAffairDate, logDate;
                                    // 找出该事务下，我最后一次发言时间，找不到，则为事务创建时间
                                    // 找出该事务我被log扣款的记录，获取扣款时间
                                    // 取max
                                    // 判断max是否在指定时间区间内
                                    const user_id = items;
                                    getSpeakTime({
                                        affairId: uuid,
                                        user_id: items,
                                    }, result => {
                                        inAffairDate = result;
                                        getHasLogTime({
                                            affairId: uuid,
                                            user_id: items,
                                        }, result => {
                                            logDate = result;
                                            if (!logDate) logDate = inAffairDate;
                                            const maxDate = Date.parse(inAffairDate) > Date.parse(logDate) ? inAffairDate: logDate;
                                            if (dateArr.indexOf(maxDate) === -1) {
                                                // 未在指定时间区间内
                                                // 超时log
                                                logNotUpdateArr.push({
                                                    user_id,
                                                    affairId: uuid,
                                                });
                                            }
                                            resolve();
                                        });
                                    });
                                });
                            });
                            Promise.all(in_p).then(() => resolve()).catch(e => reject(e));
                        }else{
                            resolve();
                        }
                    }
                });
            });
            Promise.all(_p).then(() => {
                // 记录未更新事件
                const _p = [];
                logNotUpdateArr.forEach((items, index) => {
                    _p[index] = new Promise((resolve, reject) => {
                        const it = items;
                        common.createEvent({
                            headParams: {
                                person: items.user_id,
                                time: TIME(),
                                type: 1504,
                                ownerId: items.affairId,
                            },
                            bodyParams: {},
                        }, result => {
                            return Affair.findOne({
                                where: {
                                    uuid: it.affairId,
                                }
                            }).then(result => {
                                const { name } = result.dataValues;
                                common.createEvent({
                                    headParams: {
                                        person: it.user_id,
                                        time: TIME(),
                                        type: 1503,
                                        ownerId: it.affairId,
                                    },
                                    bodyParams: {
                                        notiTitle: name,
                                    },
                                }, result => resolve());
                            }).catch(e => reject(e));
                        });
                    });
                });
                Promise.all(_p).then(() => console.log('未更新处理完成')).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });

    // 找出该事务下，我最后一次发言时间，找不到，则为事务创建时间
    function getSpeakTime(params, cb) {
        const { affairId, user_id } = params;
        NotiClient.findOne({
            where: {
                noti_client_affair_group_uuid: affairId,
                sender: user_id,
                isdel: 0,
            },
            order: [[ 'post_time', 'DESC' ]],
        }).then(result => {
            if (!result) {
                Affair.findOne({ where: { uuid: affairId } }).then(result => {
                    cb(DATETIME(result.dataValues.insert_time));
                }).catch(e => LOG(e));
            } else {
                cb(DATETIME(result.dataValues.post_time));
            }
        }).catch(e => LOG(e));
    }

    // 找出该事务我被log扣款的记录，获取扣款时间
    function getHasLogTime(params, cb) {
        const { affairId, user_id } = params;
        BaseEvent.findOne({
            where: {
                type: '1504',
                ownerId: affairId,
                person: user_id,
            },
            order: [['id', 'DESC']],
        }).then(result => {
            if (result) {
                cb(DATETIME(result.dataValues.time));
            } else {
                cb(null);
            }
        }).catch(e => LOG(e));
    }
}

/**指定类型，时间段，人的事件 */
this.getTargetEvent = (params, cb) => {
    const { type, startDate, endDate, user_id } = params;
    BaseEvent.findAll({
        where: {
            type,
            person: user_id,
            time: {
                '$gte': startDate,
                "$lte": endDate,
            },
        },
    }).then(resArr => {
        const _p = [];
        resArr.forEach((items, index) => {
            _p[index] = new Promise((resolve, reject) => {
                const i = index, it = items;
                const { contentId } = it.dataValues;
                SubEventContent.findById(contentId, (err, result) => {
                    resArr[i].dataValues.content = result;
                    resolve();
                });
            });
        });
        return Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '查询成功',
                data: resArr,
            });
        }).catch(e => { throw e });
    }).catch(e => cb({code: -1, msg: e.message}));
}

/***************************** 签到事务 ***********************************/
/**
 *  获取规定工时
 */
this.getFixWorkTime = (params,cb) => {
    const { yyyymm } = params;
    CompanyCalendar.findAll({
        where: {
            isworkingday: 1,
            date: sequelize.literal('date_format(date,"%Y-%m")="'+yyyymm+'"')
        }
    }).then(result => {
        const workTime = CONFIG.workTime;
        let fixWorkTime = result.length * workTime;
        cb({
            code: 200,
            msg: '',
            data: fixWorkTime
        });
    }).catch(e => LOG(e));
}

/**
 *  获取正常考勤数据和加班数据时间段
 *  @return Array {on_time,off_time}
 */
this.getSignPeriod = (params,cb) => {
    const { yyyymm,admin_id } = params;
    StaffSign.findAll({
        where: {
            user_id: admin_id,
            date: sequelize.literal('date_format(date,"%Y-%m")="'+yyyymm+'"')
        }
    }).then(result => {
        const staffSignIdArr = result.map(items => 
            items.dataValues.id
        );
        const allTimeArr = [];
        const p_0 = new Promise((resolve,reject) => {
            StaffSignLog.findAll({
                where: {
                    isdel: 0,
                    staff_sign_id: {
                        '$in': staffSignIdArr
                    }
                }
            }).then(signLogArr => {
                signLogArr.forEach((items,index) => {
                    allTimeArr.push({
                        on_time: items.dataValues.on_time,
                        off_time: items.dataValues.off_time,
                        rate: 1,
                    });
                });
                resolve();
            }).catch(e => LOG(e));
        });
        const p_1 = new Promise((resolve,reject) => {
            StaffOverWork.findAll({
                where: {
                    check: 1,
                    isdel: 0,
                    staff_sign_id: {
                        '$in': staffSignIdArr
                    }
                }
            }).then(result => {
                result.forEach((items,index) => {
                    allTimeArr.push({
                        on_time: items.dataValues.on_time,
                        off_time: items.dataValues.off_time,
                        rate: items.dataValues.rate,
                    });
                });
                resolve();
            }).catch(e => LOG(e));
        });
        Promise.all([p_0,p_1]).then(() => {
            cb(allTimeArr);
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  获取实际工时
 *  （加班工时和正常工时）
 */
this.getActWorkTime = (params,cb) => {
    const { yyyymm,admin_id } = params;
    const that = this;
    let workTime = 0,overWorkTime = 0;

    //获取指定月份的公司月历数据
    //@return Array
    const getWorkdayArr = (cb) => {
        CompanyCalendar.findAll({
            where: {
                date: sequelize.literal('date_format(date,"%Y-%m")="'+yyyymm+'"')
            }
        }).then(fixWorkTimeArr => {
            cb(fixWorkTimeArr);
        }).catch(e => LOG(e));
    }

    //计算各时间段对应的工时类型
    const calculTime = (params) => {
        let { on_time,off_time,isworkingday, rate } = params;
        let type,workTime;
        let sign_on_time = Date.parse(on_time);
        let todayNineClock = Date.parse(DATETIME(on_time)+' 09:00:00');
        let todayFifteenClock = Date.parse(DATETIME(on_time)+' 17:00:00');
        let todaySixteenClock = Date.parse(DATETIME(on_time)+' 18:00:00');
        if(sign_on_time<todayNineClock){    //9点前
            sign_on_time = todayNineClock;
        }else if(sign_on_time<todaySixteenClock&&sign_on_time>todayFifteenClock){   //17点-18点
            sign_on_time = todaySixteenClock;
        }
        off_time = off_time?off_time:on_time;
        let resStamp = Date.parse(off_time) - Number(sign_on_time);
        resStamp = Number(resStamp)<0?0:Number(resStamp);
        workTime = resStamp/1000/60/60;
        workTime = workTime>CONFIG.workTime?CONFIG.workTime:parseFloat(workTime);
        workTime = parseFloat(workTime * rate);
        if(isworkingday==0){
            type = 1;
        }else{
            if(sign_on_time<todayFifteenClock){
                type = 0;
            }else{
                type = 1;
            }
        }
        return {
            time: workTime,
            type: type
        };
    }

    getWorkdayArr(fixWorkTimeArr => {
        that.getSignPeriod({
            yyyymm: yyyymm,
            admin_id: admin_id
        },allTimeArr => {
            for (let i = 0; i < fixWorkTimeArr.length; i++) {
                for (let j = 0; j < allTimeArr.length; j++) {
                    if(DATETIME(allTimeArr[j].on_time)==fixWorkTimeArr[i].date){
                        let obj = {
                            on_time: allTimeArr[j].on_time,
                            off_time: allTimeArr[j].off_time,
                            rate: allTimeArr[j].rate,
                            isworkingday: fixWorkTimeArr[i].isworkingday
                        };
                        const res = calculTime(obj);
                        if(res.type==0){
                            workTime += Number(res.time);
                        }else if(res.type==1){
                            overWorkTime += Number(res.time);
                        }
                    }
                }
            }
            cb({
                workTime: parseInt(workTime * 100) / 100,
                overWorkTime: parseInt(overWorkTime * 100) / 100
                // workTime: Number(workTime.toFixed(2)),
                // overWorkTime: Number(overWorkTime.toFixed(2))
            });
        });
    });

}


/***************************************************************************************/

/**
 *  签到首页
 */
this.workingNum = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    const that = this;
    let self_id,status,notUpdate = 0;
    let checkTime,overWorkCheckTime;
    const staffSignInfo = (infoArr,cb) => {
        const _p = [];
        infoArr.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                let it = items;
                common.idTransToName({
                    user_id: it.dataValues.user_id
                },user_name => {
                    it.dataValues.user_name = user_name;
                    const in_p = [];
                    it.dataValues.StaffOutLogs.forEach((_it,_ind) => {
                        in_p[index] = new Promise((resolve,reject) => {
                            common.idTransToName({
                                user_id: _it.dataValues.director
                            },user_name => {
                                _it.dataValues.director = user_name;
                                resolve();
                            });
                        });
                    });
                    Promise.all(in_p).then(result => {
                        resolve();
                    }).catch(e => LOG(e));
                });
            });
        });
        Promise.all(_p).then(result => {
            cb(infoArr);
        }).catch(e => LOG(e));
    }
    StaffSign.findAll({
        include: [StaffSignLog,StaffOutLog,StaffOverWork,StaffAbsenceReason],
        where: {
            date: date,
        }
    }).then(result => {
        result.forEach((items) => {
            if(items.dataValues.user_id==admin_id) {
                self_id = items.dataValues.id;
                status = items.dataValues.status;
                try{
                    for (let i = 0; i < items.StaffSignLogs.length; i++) {
                        if(items.StaffSignLogs[i].dataValues.isdel==0){
                            checkTime = items.StaffSignLogs[i].dataValues.on_time;
                            break;
                        }
                    }
                }catch(e){
                    checkTime = null;
                }
                try{
                    for (let i = 0; i < items.StaffOverWorks.length; i++) {
                        if(items.StaffOverWorks[i].dataValues.isdel==0){
                            overWorkCheckTime = items.StaffOverWorks[i].dataValues.on_time;
                            break;
                        }
                    }
                }catch(e){
                    overWorkCheckTime = null;
                }
            }
        });
        staffSignInfo(result,(staffSignInfoArr) => {
            let workTime = 0,overWorkTime = 0,onDutyTime = 0,total = 0;
            let onDutyStaff,onDutyStaffId,onCusDutyStaff,onCusDutyStaffId;
            let onDutyInsideStaff, onDutyInsideStaffId;
            const p_0 = new Promise((resolve,reject) => {
                that.getActWorkTime({
                    yyyymm: date.split('-')[0]+'-'+date.split('-')[1],
                    admin_id: admin_id
                },result => {
                    workTime = result.workTime;
                    overWorkTime = result.overWorkTime;
                    resolve();
                });
            });
            const p_1 = new Promise((resolve,reject) => {
                that.getOnDutyNum({
                    yyyymm: date.split('-')[0]+'-'+date.split('-')[1],
                    admin_id: admin_id
                },result => {
                    onDutyTime = result.data.length;
                    resolve();
                });
            });
            const p_2 = new Promise((resolve,reject) => {
                that.getOrderDutyStaff({
                    date: date
                },result => {
                    if(result.length==0){
                        onDutyStaff = null;
                        onDutyStaffId = null;
                        onCusDutyStaff = null;
                        onCusDutyStaffId = null;
                        resolve();
                    }else{
                        const staffMap = new base.StaffMap().getStaffMap();
                        result.data.forEach((items,index) => {
                            if(items.dataValues.type==1){
                                onDutyStaffId = items.dataValues.user_id;
                                onDutyStaff = staffMap[items.dataValues.user_id].user_name;
                            } else if (items.dataValues.type==2){
                                onCusDutyStaffId = items.dataValues.user_id;
                                onCusDutyStaff = staffMap[items.dataValues.user_id].user_name;
                            } else {
                                onDutyInsideStaffId = items.dataValues.user_id;
                                onDutyInsideStaff = staffMap[items.dataValues.user_id].user_name;
                            }
                        });
                        resolve();
                    }
                });
            });
            const p_3 = new Promise((resolve,reject) => {
                that.getFixWorkTime({
                    yyyymm: date.split('-')[0]+'-'+date.split('-')[1]
                },result => {
                    total = result.data;
                    resolve();
                });
            });
            const p_4 = new Promise((resolve,reject) => {
                BaseEvent.count({
                    where: {
                        type: '1503',
                        date: sequelize.literal('date_format(time,"%Y-%m")=date_format("'+DATETIME()+'","%Y-%m")'),
                        person: admin_id,
                    }
                }).then(result => {
                    notUpdate = result;
                    resolve();
                }).catch(e => LOG(e));
                // StaffSign.findAll({
                //     where: {
                //         user_id: admin_id,
                //         date: sequelize.literal('date_format(date,"%Y-%m")=date_format("'+date+'","%Y-%m")')
                //     }
                // }).then(result => {
                //     result.forEach((items,index) => {
                //         notUpdate += Number(items.dataValues.notUpdate);
                //     });
                //     resolve();
                // }).catch(e => LOG(e));
            });
            Promise.all([p_0,p_1,p_2,p_3,p_4]).then(result => {
                cb({
                    code: 200,
                    msg: '',
                    data: {
                        status: status,
                        checkTime: checkTime,
                        overWorkCheckTime: overWorkCheckTime,
                        staffSignInfoArr: staffSignInfoArr,
                        workTime: workTime,
                        overWorkTime: overWorkTime,
                        onDutyTime: onDutyTime,
                        total: total,
                        onDutyStaff: onDutyStaff,
                        onDutyStaffId: onDutyStaffId,
                        onCusDutyStaff: onCusDutyStaff,
                        onCusDutyStaffId: onCusDutyStaffId,
                        onDutyInsideStaff,
                        onDutyInsideStaffId,
                        notUpdate
                    }
                });
            }).catch(e => LOG(e));
        });
    }).catch(e => LOG(e));
}

/**
 *  获取值日天数
 */
this.getOnDutyNum = (params,cb) => {
    const { admin_id,yyyymm } = params;
    OnDuty.findAll({
        where: {
            user_id: admin_id,
            date: sequelize.literal('date_format(date,"%Y-%m")="'+yyyymm+'"'),
            isdel: 0
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => LOG(e));
}

/**
 *  获取指定日期的值日人
 */
this.getOrderDutyStaff = (params,cb) => {
    const { date } = params;
    OnDuty.findAll({
        where: {
            isdel: 0,
            date: date
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => LOG(e));
}

/**
 *  申请安卫值日
 */
this.applyDuty = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    this.getOrderDutyStaff({
        date: date,
    },result => {
        let hasApply = false;
        result.data.forEach((items,index) => {
            if(items.dataValues.type==1){
                hasApply = true;
            }
        });
        if(!hasApply){
            OnDuty.create({
                user_id: admin_id,
                date: date,
                type: 1
            }).then(result => {
                cb({
                    code: 200,
                    msg: '申请成功',
                    data: []
                });
            }).catch(e => LOG(e));
        }else{
            cb({
                code: -1,
                msg: '已有值日人员！',
                data: []
            });
        }
    });
}

/**
 *  取消申请安卫值日
 */
this.cancelApplyDuty = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    OnDuty.update({
        isdel: 1
    },{
        where: {
            user_id: admin_id,
            date: date,
            type: 1
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '取消成功',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 *  申请客服值日
 */
this.applyCusDuty = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    this.getOrderDutyStaff({
        date: date,
    },result => {
        let hasApply = false;
        result.data.forEach((items,index) => {
            if(items.dataValues.type==2){
                hasApply = true;
            }
        });
        if(!hasApply){
            OnDuty.create({
                user_id: admin_id,
                date: date,
                type: 2
            }).then(result => {
                cb({
                    code: 200,
                    msg: '申请成功',
                    data: []
                });
            }).catch(e => LOG(e));
        }else{
            cb({
                code: -1,
                msg: '已有值日人员！',
                data: []
            });
        }
    });
}

/**
 *  取消申请客服值日
 */
this.cancelApplyCusDuty = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    OnDuty.update({
        isdel: 1
    },{
        where: {
            user_id: admin_id,
            date: date,
            type: 2
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '取消成功',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 *  申请内勤值日
 */
this.applyInsideDuty = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    this.getOrderDutyStaff({
        date: date,
    },result => {
        let hasApply = false;
        result.data.forEach((items,index) => {
            if(items.dataValues.type==3){
                hasApply = true;
            }
        });
        if(!hasApply){
            OnDuty.create({
                user_id: admin_id,
                date: date,
                type: 3
            }).then(result => {
                cb({
                    code: 200,
                    msg: '申请成功',
                    data: []
                });
            }).catch(e => LOG(e));
        }else{
            cb({
                code: -1,
                msg: '已有值日人员！',
                data: []
            });
        }
    });
}

/**
 *  取消申请内勤值日
 */
this.cancelInsideDuty = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    OnDuty.update({
        isdel: 1
    },{
        where: {
            user_id: admin_id,
            date: date,
            type: 3
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '取消成功',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 *  获取访问者当天签到状态码
 *  0 -> 未签到
 *  1 -> 正常上班
 *  2 -> 外出
 *  3 -> 非工作时间（17点后或者双休日）
 *  4 -> 非工作时间加班中
 */
this.checkSign = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    StaffSign.findOne({
        where: {
            user_id: admin_id,
            date: date
        }
    }).then(result => {
        let status;
        try{
            status = result.dataValues.status;
            cb({
                code: 200,
                msg: '',
                data: {
                    status: status
                }
            });
        }catch(e){

        }
    }).catch(e => LOG(e));
}

/**
 *  更新签到主表信息
 */
this.updateMainSign = (params,cb) => {
    const { form_data,where } = params;
    StaffSign.update(form_data,{
        where: where
    }).then(result => {
        cb();
    }).catch(e => LOG(e));
}

/**
 *  验证当前提交时的状态与数据库的状态一致
 */
this.checkStatusSync = (params,cb) => {
    const { status,date,admin_id } = params;
    StaffSign.findOne({
        where: {
            date: date,
            user_id: admin_id
        }
    }).then(result => {
        let sqlStatus = result.dataValues.status;
        if(status==sqlStatus){
            cb({
                code: 200,
                msg: '',
                data: []
            });
        }else{
            cb({
                code: -1,
                msg: '请刷新重试',
                data: []
            });
        }
    }).catch(e => LOG(e));
}

/**
 *  签到 0 -> 1
 */
this.sign = (params,cb) => {
    const _p = [];
    const that = this;
    const date = DATETIME();
    const { admin_id,form_data } = params;
    const on_time = TIME(); //服务器时间为准
    const gps = form_data.gps;
    _p[0] = new Promise((resolve,reject) => {
        that.updateMainSign({
            form_data: {
                status: 1
            },
            where: {
                date: date,
                user_id: admin_id
            }
        },() => resolve());
    });
    _p[1] = new Promise((resolve,reject) => {
        StaffSign.findOne({
            where: {
                date: date,
                user_id: admin_id
            }
        }).then(result => {
            const staffSignId = result.dataValues.id;
            StaffSignLog.create({
                staff_sign_id: staffSignId,
                on_time: on_time,
                gps: gps
            }).then(() => resolve()).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(result => {
        cb({
            code: 200,
            msg: '签到成功',
            data: []
        });
        if(!form_data.isNotApp) that.checkSignByApp({
            user_id: admin_id,
            date
        },() => {});
    }).catch(e => LOG(e));
}

/**
 *  补签到的gps信息
 */
this.signGps = (params,cb) => {
    const { admin_id,gps } = params;
    const date = DATETIME();
    StaffSign.findOne({
        where: {
            user_id: admin_id,
            date: date
        }
    }).then(result => {
        const staff_sign_id = result.dataValues.id;
        StaffSignLog.findAll({
            where: {
                staff_sign_id: staff_sign_id
            }
        }).then(result => {
            const id = result[result.length-1].dataValues.id;
            StaffSignLog.update({
                gps: gps
            },{
                where: {
                    id: id
                }
            }).then(() => {
                cb({
                    code: 200,
                    msg: '',
                    data: []
                });
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  离岗 1 -> 0
 */
this.leave = (params,cb) => {
    const _p = [];
    const that = this;
    const date = DATETIME();
    const { admin_id,form_data } = params;
    // const off_time = form_data.off_time?form_data.off_time:TIME();
    const off_time = TIME(); //服务器时间为准
    _p[0] = new Promise((resolve,reject) => {
        that.updateMainSign({
            form_data: {
                status: 0
            },
            where: {
                date: date,
                user_id: admin_id
            }
        },() => resolve());
    });
    _p[1] = new Promise((resolve,reject) => {
        StaffSign.findOne({
            where: {
                date: date,
                user_id: admin_id
            }
        }).then(result => {
            const staffSignId = result.dataValues.id;
            StaffSignLog.findOne({
                where: {
                    staff_sign_id: staffSignId,
                    isdel: 0
                },
                order: [['id','DESC']]
            }).then(result => {
                const id = result.dataValues.id;
                StaffSignLog.update({
                    off_time: off_time
                },{
                    where: {
                        id: id
                    }
                }).then(result => resolve()).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(result => {
        cb({
            code: 200,
            msg: '离岗成功',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 *  外出 1 -> 2
 */
this.goOut = (params,cb) => {
    const _p = [];
    const that = this;
    const date = DATETIME();
    const { admin_id,form_data } = params;
    const { director,reason } = form_data;
    const out_time = TIME();    //服务器时间为准
    _p[0] = new Promise((resolve,reject) => {
        that.updateMainSign({
            form_data: {
                status: 2
            },
            where: {
                date: date,
                user_id: admin_id
            }
        },() => resolve());
    });
    _p[1] = new Promise((resolve,reject) => {
        StaffSign.findOne({
            where: {
                date: date,
                user_id: admin_id
            }
        }).then(result => {
            const staffSignId = result.dataValues.id;
            common.staffNameTransToUserId({user_name: director},user_id => {
                StaffOutLog.create({
                    staff_sign_id: staffSignId,
                    director: user_id,
                    reason: reason,
                    out_time: out_time
                }).then(() => resolve()).catch(e => LOG(e));
            });
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(result => {
        cb({
            code: 200,
            msg: '申请成功',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 *  返岗 2 -> 1
 */
this.outBack = (params,cb) => {
    const _p = [];
    const that = this;
    const date = DATETIME();
    const { admin_id,form_data } = params;
    // const back_time = form_data.back_time?form_data.back_time:TIME();
    const back_time = TIME(); //服务器时间为准
    _p[0] = new Promise((resolve,reject) => {
        that.updateMainSign({
            form_data: {
                status: 1
            },
            where: {
                date: date,
                user_id: admin_id
            }
        },() => resolve());
    });
    _p[1] = new Promise((resolve,reject) => {
        StaffSign.findOne({
            where: {
                date: date,
                user_id: admin_id
            }
        }).then(result => {
            const staffSignId = result.dataValues.id;
            StaffOutLog.findOne({
                where: {
                    staff_sign_id: staffSignId
                },
                order: [['id','DESC']]
            }).then(result => {
                const id = result.dataValues.id;
                StaffOutLog.update({
                    back_time: back_time
                },{
                    where: {
                        id: id
                    }
                }).then(result => resolve()).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(result => {
        cb({
            code: 200,
            msg: '返岗成功',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 *  在外离岗 2 -> 0
 */
this.outLeave = (params,cb) => {
    const that = this;
    that.outBack(params,() => {
        that.leave(params,() => {
            cb({
                code: 200,
                msg: '离岗成功',
                data: []
            });
        });
    });
}

/**
 *  加班 3 -> 4
 */
this.overWork = (params,cb) => {
    const _p = [];
    const that = this;
    const date = DATETIME();
    const { admin_id,form_data } = params;
    // const on_time = form_data.on_time?form_data.on_time:TIME();
    const on_time = TIME();
    const { director,reason,on_gps } = form_data;
    _p[0] = new Promise((resolve,reject) => {
        that.updateMainSign({
            form_data: {
                status: 4
            },
            where: {
                date: date,
                user_id: admin_id
            }
        },() => resolve());
    });
    _p[1] = new Promise((resolve,reject) => {
        StaffSign.findOne({
            where: {
                date: date,
                user_id: admin_id
            }
        }).then(result => {
            const staffSignId = result.dataValues.id;
            // common.staffNameTransToUserId({user_name: director},user_id => {
                StaffOverWork.create({
                    staff_sign_id: staffSignId,
                    on_time: on_time,
                    on_gps: on_gps,
                    // director: user_id,
                    // reason: reason
                }).then(() => resolve()).catch(e => LOG(e));
            // });
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(result => {
        cb({
            code: 200,
            msg: '加班签到成功',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 *  补加班的gps信息
 */
this.overWorkGps = (params,cb) => {
    const { admin_id,on_gps } = params;
    const date = DATETIME();
    StaffSign.findOne({
        where: {
            user_id: admin_id,
            date: date
        }
    }).then(result => {
        const staff_sign_id = result.dataValues.id;
        StaffOverWork.findAll({
            where: {
                staff_sign_id: staff_sign_id
            }
        }).then(result => {
            const id = result[result.length-1].dataValues.id;
            StaffOverWork.update({
                on_gps: on_gps
            },{
                where: {
                    id: id
                }
            }).then(() => {
                cb({
                    code: 200,
                    msg: '',
                    data: []
                });
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  结束加班 4 -> 3
 */
this.endOverWork = (params,cb) => {
    const _p = [];
    const that = this;
    const date = DATETIME();
    const { admin_id,form_data } = params;
    // const off_time = form_data.off_time?form_data.off_time:TIME();
    const off_time = TIME();
    const off_gps = form_data.off_gps;
    // const content = form_data.content;
    // const album = form_data.album;
    _p[0] = new Promise((resolve,reject) => {
        that.updateMainSign({
            form_data: {
                status: 3
            },
            where: {
                date: date,
                user_id: admin_id
            }
        },() => resolve());
    });
    _p[1] = new Promise((resolve,reject) => {
        StaffSign.findOne({
            where: {
                date: date,
                user_id: admin_id
            }
        }).then(result => {
            const staffSignId = result.dataValues.id;
            StaffOverWork.findOne({
                where: {
                    staff_sign_id: staffSignId
                },
                order: [['id','DESC']]
            }).then(result => {
                const id = result.dataValues.id;
                StaffOverWork.update({
                    off_time: off_time,
                    off_gps: off_gps,
                    // content: content,
                    // album: album
                },{
                    where: {
                        id: id
                    }
                }).then(result => resolve()).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(result => {
        cb({
            code: 200,
            msg: '请及时填写加班详情！',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 * 请假
 */
this.applyAbsence = (params, cb) => {
    const { staff_sign_id, description } = params;
    StaffAbsenceReason.create({
        staff_sign_id,
        description,
    }).then(result => {
        cb({
            code: 200,
            msg: '提交成功',
            data: result,
        });
    }).catch(e => LOG(e));
}

/**
 *  撤销签到
 */
this.recall = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    /*开启事务，自动提交和回滚*/
	sequelize.transaction(t => {
		return StaffSign.update({
			status: 0
		},{
			where: {
                user_id: admin_id,
                date: date
			},
			transaction: t
		}).then(() => {
            return StaffSign.findOne({
                where: {
                    user_id: admin_id,
                    date: date
                },
                transaction: t
            }).then((result) => {
                let id = result.dataValues.id;
                return StaffSignLog.findAll({
                    where: {
                        staff_sign_id: id
                    },
                    transaction: t
                }).then(result => {
                    let targetId = result[result.length-1].dataValues.id;
                    return StaffSignLog.update({
                        isdel: 1
                    },{
                        where: {
                            id: targetId
                        },
                        transaction: t
                    });
                });
            });
		});
	}).then(() => cb({
        code: 200,
        msg: '撤销成功',
        data: []
    })).catch(e => LOG(e));
}

/**
 *  撤销加班
 */
this.recallOverWork = (params,cb) => {
    const { admin_id } = params;
    const date = DATETIME();
    /*开启事务，自动提交和回滚*/
	sequelize.transaction(t => {
		return StaffSign.update({
			status: 3
		},{
			where: {
                user_id: admin_id,
                date: date
			},
			transaction: t
		}).then(() => {
            return StaffSign.findOne({
                where: {
                    user_id: admin_id,
                    date: date
                },
                transaction: t
            }).then((result) => {
                let id = result.dataValues.id;
                return StaffOverWork.findAll({
                    where: {
                        staff_sign_id: id
                    },
                    transaction: t
                }).then(result => {
                    let targetId = result[result.length-1].dataValues.id;
                    return StaffOverWork.update({
                        isdel: 1
                    },{
                        where: {
                            id: targetId
                        },
                        transaction: t
                    });
                });
            });
		});
	}).then(() => cb({
        code: 200,
        msg: '撤销成功',
        data: []
    })).catch(e => LOG(e));
}

/**
 *  获取指定员工指定月份的考勤数据
 *  @param admin_id为,分割的字符串
 */
this.getAllMonthData = (params,cb) => {
    const { yyyymm,admin_id } = params;
    const _p = [];
    _p[0] = new Promise((resolve,reject) => {
        StaffSign.findAll({
            include: [StaffSignLog,StaffOutLog,StaffOverWork],
            where: {
                user_id: {
                    '$in': admin_id.split(',')
                },
                date: sequelize.literal('date_format(date,"%Y-%m")="'+yyyymm+'"'),
                // '$or': [
                //     sequelize.where(sequelize.col('StaffSignLogs.isdel'), {
                //         '$ne': 1
                //     }),
                //     sequelize.where(sequelize.col('StaffOutLogs.isdel'), {
                //         '$ne': 1
                //     }),
                //     sequelize.where(sequelize.col('StaffOverWorks.isdel'), {
                //         '$ne': 1
                //     }),
                // ]
            }
        }).then(result => {
            for (let i = 0; i < result.length; i++) {
                for (let j = 0; j < result[i].StaffSignLogs.length; j++) {
                    if(result[i].StaffSignLogs[j].isdel==1){
                        result[i].StaffSignLogs.splice(j,1);
                        j--;
                    }
                }
                for (let j = 0; j < result[i].StaffOutLogs.length; j++) {
                    if(result[i].StaffOutLogs[j].isdel==1){
                        result[i].StaffOutLogs.splice(j,1);
                        j--;
                    }
                }
                for (let j = 0; j < result[i].StaffOverWorks.length; j++) {
                    if(result[i].StaffOverWorks[j].isdel==1){
                        result[i].StaffOverWorks.splice(j,1);
                        j--;
                    }
                }
            }
            resolve(result);
        }).catch(e => LOG(e));
    });
    _p[1] = new Promise((resolve,reject) => {
        CompanyCalendar.findAll({
            where: {
                date: sequelize.literal('date_format(date,"%Y-%m")="'+yyyymm+'"'),
                isworkingday: 1
            }
        }).then(result => {
            resolve(result);
        }).catch(e => LOG(e));
    });
    _p[2] = new Promise((resolve,reject) => {
        OnDuty.findAll({
            where: {
                user_id: admin_id,
                date: sequelize.literal('date_format(date,"%Y-%m")="'+yyyymm+'"'),
                isdel: 0
            }
        }).then(result => {
            resolve(result);
        }).catch(e => LOG(e));
    });
    Promise.all(_p).then(result => {
        const in_p = [];
        result[0].forEach((items,index) => {
            in_p[index] = new Promise((resolve,reject) => {
                let user_id = items.dataValues.user_id;
                common.idTransToName({
                    user_id: user_id
                },user_name => {
                    items.dataValues.user_name = user_name;
                    resolve();
                });
            });
        });
        Promise.all(in_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: result
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  获取所有员工指定月份的考勤工时，加班工时，总工时,值日天数
 *  配合 getAllMonthData() 方法
 *  考勤结算用
 */
this.getAllStaffAllMonthData = (params,cb) => {
    const that = this;
    const yyyymm = params.yyyymm;
    const params_user_id = params.user_id;
    let where = {on_job: 1,isdel: 0};
    if(params_user_id) where.user_id = params_user_id;
    Staff.findAll({
        where: where
    }).then(result => {
        const _p = [];
        const resObj = {};
        result.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const user_id = items.dataValues.user_id;
                resObj[user_id] = {};
                resObj[user_id]['user_name'] = items.dataValues.user_name;
                const in_p =  [];
                in_p[0] = new Promise((resolve,reject) => {
                    //获取正常工时和加班工时
                    that.getActWorkTime({
                        yyyymm: yyyymm,
                        admin_id: user_id
                    },result => {
                        resObj[user_id]['onHours'] = result.workTime;
                        resObj[user_id]['overWorkTime'] = result.overWorkTime;
                        resolve();
                    });
                });
                in_p[1] = new Promise((resolve,reject) => {
                    //获取值日天数
                    that.getOnDutyNum({
                        yyyymm: yyyymm,
                        admin_id: user_id
                    },result => {
                        resObj[user_id]['onDuty'] = result.data.length;
                        resolve();
                    });
                });
                in_p[2] = new Promise((resolve,reject) => {
                    //获取规定工时
                    that.getFixWorkTime({
                        yyyymm: yyyymm
                    },result => {
                        resObj[user_id]['total'] = result.data;
                        resolve();
                    });
                });
                Promise.all(in_p).then(() => resolve()).catch(e => LOG(e));
            });
        });
        Promise.all(_p).then(result => {
            cb(resObj);
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}


/**
 *  获取指定月份加班数据
 */
this.getOverWorkData = (params,cb) => {
    const { admin_id,isDirector } = params;
    let num = params.num?parseInt(params.num):10;
	let page = params.page?parseInt(params.page):1;
    let keywords = params.keywords?params.keywords:'';
    let order = params.order?params.order:'on_time';
    let filter = params.filter?JSON.parse(params.filter):{};
    let { workTime,check } = filter;
    let orderMonth;
    if(workTime=='当月'){
        let schemaOrderMonth = moment().format('YYYY-MM');
        orderMonth = sequelize.literal('date_format(StaffSign.date,"%Y-%m")="'+schemaOrderMonth+'"');
    }else if(workTime=='上月'){
        let schemaOrderMonth = moment().subtract(1, 'months').format('YYYY-MM');
        orderMonth = sequelize.literal('date_format(StaffSign.date,"%Y-%m")="'+schemaOrderMonth+'"');
    }else{
        orderMonth = sequelize.literal('date_format(StaffSign.date,"%Y-%m")>2018-01');
    }
    let checkArr = check.split(',').filter(items => items);
    let useCheckArr = [];
    if(checkArr.length==0){
        useCheckArr = [0,1,2];
    }else{
        checkArr.forEach((items,index) => {
            if(items=='填报中'){
                useCheckArr.push(0);
            }else if(items=='已通过'){
                useCheckArr.push(1);
            }else{
                useCheckArr.push(2);
            }
        });
    }
    let where = {
        on_time: orderMonth,
        '$and': [
            sequelize.where(sequelize.col('isdel'), {
                '$eq': 0
            }),
            // sequelize.where(sequelize.col('StaffSign.user_id'), {
            //     '$eq': admin_id
            // }),
            sequelize.where(sequelize.col('check'), {
                '$in': useCheckArr
            })
        ],
        '$or': [
            sequelize.where(sequelize.col('reason'), {
                '$like': '%'+keywords+'%'
            }),
            sequelize.where(sequelize.col('content'), {
                '$like': '%'+keywords+'%'
            }),
            sequelize.where(sequelize.col('reason'), {
                '$eq': null
            }),
            sequelize.where(sequelize.col('content'), {
                '$eq': null
            })
        ]
    };
    if(isDirector){
        // where['$and'].push(sequelize.where(sequelize.col('director'), {
        //     '$ne': null
        // }));
    }else{
        where['$and'].push(sequelize.where(sequelize.col('StaffSign.user_id'), {
            '$eq': admin_id
        }));
    }
    StaffOverWork.findAndCountAll({
        include: {
            model: StaffSign
        },
        where: where,
        limit: num,
        offset: (page -1) * num,
        order: [[order,'DESC']]
    }).then(async result => {
        const staffMap = new base.StaffMap().getStaffMap();
        result.rows.forEach((items,index) => {
            result.rows[index].dataValues.name = staffMap[items.StaffSign['user_id']]['user_name'];
            try{
                items.dataValues.director = staffMap[items.dataValues.director]['user_name'];
            }catch(e){}
        });
        // 获取加班工时
        const totalWorkTime = await getOverWorkTime(where);
        cb({
            code: 200,
            msg: '',
            data: {
                data: result.rows,
                total: result.count,
                totalWorkTime: totalWorkTime.toFixed(2),
                id_arr: []
            }
        });
    }).catch(e => LOG(e));

    async function getOverWorkTime(where) {
        const result = await StaffOverWork.findAll({ include: { model: StaffSign }, where });
        let workTime = 0;
        result.forEach((items, index) => {
            const { on_time, off_time, check, rate } = items.dataValues;
            workTime += caculOverWorkTime(on_time, off_time, check, rate);
        });
        return workTime;

        function caculOverWorkTime(on_time, off_time, check, rate) {
            let workTime = 0;
            let startTimeStamp;
            let date = moment(on_time).format('YYYY-MM-DD');
            const nineNode = Date.parse(date+' 09:00:00');
            const seventeenNode = Date.parse(date+' 17:00:00');
            const eighteenNode = Date.parse(date+' 18:00:00');
            if(Date.parse(on_time)<=nineNode){  //九点前签到
                startTimeStamp = nineNode;
            }else if(Date.parse(on_time)>nineNode&&Date.parse(on_time)<=seventeenNode){ //17点前签到
                startTimeStamp = Date.parse(on_time);
            }else if(Date.parse(on_time)>seventeenNode&&Date.parse(on_time)<=eighteenNode){ //18点前签到
                startTimeStamp = eighteenNode;
            }else{  //18点后签到
                startTimeStamp = Date.parse(on_time);
            }
            workTime = (Date.parse(off_time) - Number(startTimeStamp))/(1000*60*60);
            workTime = workTime * rate;
            if (check != 1) {
                workTime = 0;
            }
            return parseInt(workTime * 100) / 100;
        }
    }
}

/**
 *  获取指定月份的director为我的加班数据
 */
this.directorGetOverWorkData = (params,cb) => {
    params.isDirector = true;
    this.getOverWorkData(params,result => {
        cb(result);
    });
}

/**
 *  获取目标加班条目
 */
this.targetOverWorkItem = (params,cb) => {
    const { id } = params;
    StaffOverWork.findOne({
        where: {
            id: id
        }
    }).then(result => {
        const staffMap = new base.StaffMap().getStaffMap();
        result.dataValues.director = staffMap[result.dataValues.director].user_name;
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => LOG(e));
}

/**
 *  审核加班单
 */
this.checkOverWorkOrder = (params,cb) => {
    const { admin_id } = params;
    const { check,id } = params.form_data;
    const check_time = TIME();
    StaffOverWork.update({
        check: check,
        check_time: check_time,
        check_person: admin_id
    },{
        where: {
            id: id
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: []
        });
        if (check == 0) {
            sendMsgToApplyer();
        }
    }).catch(e => LOG(e));

    async function sendMsgToApplyer() {
        const result = await StaffOverWork.findOne({ where: { id } });
        const { staff_sign_id } = result.dataValues;
        const sEntity = await StaffSign.findOne({ where: { id: staff_sign_id } });
        const { user_id } = sEntity.dataValues;
        const staffMapper = new base.StaffMap().getStaffMap();
        const checker = staffMapper[admin_id].user_name;
        const receiver = staffMapper[user_id].user_name;
        const mailId = Date.now();
        request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
            console.log(body);
        }).form({
            data: JSON.stringify({
                mailId: mailId,
                class: 'overWorkManage',
                priority: '普通',
                frontUrl: '/myOverWork',
                sender: admin_id,
                post_time: TIME(),
                title: '加班单管理',
                content: checker + '退回了'+receiver+'的加班单，请重新填写',
                votes: '已阅',
                subscriber: user_id,
                NotiClientSubs: [
                    {
                        receiver: user_id,
                        noti_post_mailId: mailId
                    }
                ]
            })
        });
    }
}

/**
 *  更新加班单
 *  (更新完成后，往通知中心发信息)
 */
this.updateOverWork = (params,cb) => {
    const { form_data,admin_id } = params;
    common.staffNameTransToUserId({
        user_name: form_data.director
    },user_id => {
        form_data.director = user_id;
        form_data.check = 2;
        StaffOverWork.update(form_data,{
            where: {
                id: form_data.id
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '提交成功',
                data: []
            });
            const staffMap = new base.StaffMap().getStaffMap();
            const user_name = staffMap[admin_id].user_name;
            let mailId = Date.now();
            request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
                console.log(body);
            }).form({
                data: JSON.stringify({
                    mailId: mailId,
                    class: 'overwork',
                    priority: '普通',
                    frontUrl: '/overWorkManage',
                    sender: admin_id,
                    post_time: TIME(),
                    title: '加班单管理',
                    content: user_name+'提交了加班单，请及时审核！',
                    votes: '已阅',
                    subscriber: form_data.director,
                    NotiClientSubs: [
                        {
                            receiver: form_data.director,
                            noti_post_mailId: mailId
                        }
                    ]
                })
            });
        }).catch(e => LOG(e));
    });
}

/**
 * 评分加班单
 */
this.rateOverWork = async params => {
    const { id, rem, rate } = params;
    await StaffOverWork.update({
        rem,
        rate,
    }, { where: { id } });
    return {
        code: 200,
        msg: '更新成功',
        data: [],
    };
}

/**
 *  未读++
 */
this.notReadAdd = (params,cb) => {
    const { user_id, date } = params;
    return sequelize.transaction().then(function (transaction) {
        return sequelize.query('SELECT * FROM staff_sign WHERE user_id = "'+user_id+'" AND date = "'+date+'" FOR UPDATE',{transaction})
        .then(result => {
            try{
                let not_read = Number(result[0][0].not_read);
                not_read++;
                return StaffSign.update({
                    notRead: not_read
                },{
                    where: {
                        user_id: user_id,
                        date: date
                    },
                    transaction: transaction
                });
            }catch(e){
                throw new Error(e);
            }
        })
        .then(() => {
            cb();
            return transaction.commit();
        }).catch(err => {
            LOG(err);
            return transaction.rollback();
        });
    });
}

/**
 *  未回复++
 */
this.notReplyAdd = (params,cb) => {
    const { user_id, date } = params;
    return sequelize.transaction().then(function (transaction) {
        return sequelize.query('SELECT * FROM staff_sign WHERE user_id = "'+user_id+'" AND date = "'+date+'" FOR UPDATE',{transaction})
        .then(result => {
            try{
                let not_reply = Number(result[0][0].not_reply);
                not_reply++;
                return StaffSign.update({
                    notReply: not_reply
                },{
                    where: {
                        user_id: user_id,
                        date: date
                    },
                    transaction: transaction
                });
            }catch(e){
                throw new Error(e);
            }
        })
        .then(() => {
            cb();
            return transaction.commit();
        }).catch(err => {
            LOG(err);
            return transaction.rollback();
        });
    });
}

/**
 *  用app签到
 */
this.checkSignByApp = (params,cb) => {
    const { user_id, date } = params;
    StaffSign.update({
        signByApp: 1
    },{
        where: {
            user_id,
            date
        }
    }).then(result => {
        cb();
    }).catch(e => LOG(e));
}

/**
 *  在线使用情况统计
 */
this.onlineAssessment = (params,cb) => {
    const that = this;
    const keywords = params.keywords?params.keywords:'';
    const filter = params.filter?JSON.parse(params.filter):{};
    let date;
    const $and = {
        isdel: 0,
        on_job: 1,
    };
    if(filter.branch) {
        $and.branch = {
            '$in': filter.branch.split(',').filter(items => items)
        }
    }
    if(filter.group) {
        $and.group = {
            '$in': filter.group.split(',').filter(items => items)
        }
    }
    const startDate = filter.startDate ? filter.startDate : moment().startOf('month').format("YYYY-MM-DD")+" 00:00:00";
    const endDate = filter.endDate ? filter.endDate : moment().endOf('month').format("YYYY-MM-DD")+" 23:59:59";
    // if(filter.date=='当月'){
    //     // 当月
    //     date = DATETIME();
    // }else{
    //     // 上月
    //     date = moment().subtract(1, 'month').format('YYYY-MM') + '-01';
    // }
    Staff.findAndCountAll({
        where: {
            '$and': $and,
            '$or': {
                user_name: {
                    '$like': '%'+keywords+'%'
                },
                user_id: {
                    '$like': '%'+keywords+'%'
                }
            },
        }
    }).then(result => {
        const count = result.count;
        const _p = [],resArr = [];
        result.rows.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const { user_id, user_name } = items.dataValues;
                that.targetItemOnlineAssessment({
                    user_id,
                    // date,
                    startDate,
                    endDate,
                },resObj => {
                    resObj.user_id = user_id;
                    resObj.user_name = user_name;
                    resArr.push(resObj);
                    resolve();
                });
            });
        });
        Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: {
                    total: count,
                    id_arr: [],
                    data: resArr
                }
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  指定条件的在线使用情况统计
 */
this.targetItemOnlineAssessment = (params,cb) => {
    const { user_id, startDate, endDate, date } = params;
    const resObj = {
        notRead: 0,     //未读
        notReply: 0,    //未答复
        received: 0,    //收到推送
        atMe: 0,        //收到@
        serverDuty: 0,  //服务工作日
        appNotSign: 0,  //APP未签到
        joinAffair: 0,  //参与事务
        directotAffair: 0,  //负责事务
        notUpdate: 0,   //未更新
        notUpdateArr: [],
        overTime: 0,    //逾期
        overTimeArr: [],
        warnProgress: 0,    //进度警告
        warnProgressArr: []
    };
    const _p = [];
    // 未读, 未答复, APP未签到, 服务工作日
    _p[0] = new Promise((resolve,reject) => {
        StaffSign.findAll({
            where: {
                user_id,
                date: {
                    '$gte': startDate,
                    '$lte': endDate,
                },
                // date: sequelize.literal('date_format(date,"%Y-%m")=date_format("'+date+'","%Y-%m")')
            }
        }).then(result => {
            CompanyCalendar.findAll({
                where: {
                    date: {
                        '$gte': startDate,
                        '$lte': endDate,
                    },
                    // date: sequelize.literal('date_format(date,"%Y-%m")=date_format("'+date+'","%Y-%m")')
                }
            }).then(companyCalendarArr => {
                const companyCalendarHash = {};
                companyCalendarArr.forEach((items,index) => {
                    companyCalendarHash[items.dataValues.date] = items.dataValues.isworkingday;
                    if(items.dataValues.isworkingday) resObj.serverDuty++;
                });
                result.forEach((items, index) => {
                    // resObj.notRead += items.dataValues.notRead;
                    // resObj.notReply += items.dataValues.notReply;
                    if(companyCalendarHash[items.dataValues.date]){
                        if(CONFIG.hasMobileStaffArr.indexOf(user_id)!=-1){
                            if(!items.dataValues.signByApp) resObj.appNotSign++;
                        }else{
                            resObj.serverDuty = 0;
                        }
                    }
                });
                BaseEvent.count({
                    where: {
                        type: '1501',
                        person: user_id,
                        time: {
                            '$gte': startDate,
                            '$lte': endDate,
                        },
                        // time: sequelize.literal('date_format(time,"%Y-%m")=date_format("'+date+'","%Y-%m")'),
                    }
                }).then(result => {
                    resObj.notRead = result;
                    BaseEvent.count({
                        where: {
                            type: '1502',
                            person: user_id,
                            time: {
                                '$gte': startDate,
                                '$lte': endDate,
                            },
                            // time: sequelize.literal('date_format(time,"%Y-%m")=date_format("'+date+'","%Y-%m")'),
                        }
                    }).then(result => {
                        resObj.notReply = result;
                        resolve();
                    }).catch(e => LOG(e));
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });

    // 收到推送，收到@
    _p[1] = new Promise((resolve,reject) => {
        NotiPost.findAll({
            attributes: ['mailId'],
            where: {
                isdel: 0,
                post_time: {
                    '$gte': startDate,
                    '$lte': endDate,
                },
                // post_time: sequelize.literal('date_format(post_time,"%Y-%m")=date_format("'+date+'","%Y-%m")')
            }
        }).then(result => {
            const noti_post_mailId_arr = result.map((items,index) => items.dataValues.mailId);
            NotiPostSub.findAll({
                where: {
                    isdel: 0,
                    receiver: user_id,
                    noti_post_mailId: {
                        '$in': noti_post_mailId_arr
                    }
                }
            }).then(result => {
                result.forEach((items,index) => {
                    resObj.received++;
                    if(items.dataValues.atMe) resObj.atMe++;
                });
                resolve();
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });

    // (非例行事务)参与事务, 负责事务，逾期，进度警告
    _p[2] = new Promise((resolve,reject) => {
        Affair.findAll({
            include: [ProjectAffair,SmallAffair],
            where: {
                isdel: 0,
                state: {
                    '$in': ['草拟','进行中']
                }
            }
        }).then(result => {
            result.forEach((items,index) => {
                const teamArr = items.dataValues.team.split(',');
                try{
                    if(items.dataValues.ProjectAffairs[0] || items.dataValues.SmallAffairs[0]){
                        if(teamArr.indexOf(user_id)!=-1) resObj.joinAffair++;
                        if(teamArr[0]==user_id) {
                            resObj.directotAffair++;
                            // 判断该事务是否为暂缓
                            if (items.dataValues.priority !== '暂缓') {
                                let _deadline;
                                try{
                                    _deadline = items.dataValues.ProjectAffairs[0].dataValues.deadline;
                                }catch(e){
                                    _deadline = items.dataValues.SmallAffairs[0].dataValues.deadline;
                                }
                                let _d = Date.now() - Date.parse(_deadline);
                                if(_d>0){
                                    resObj.overTime += parseInt(_d/(1000*60*60*24));
                                    resObj.overTimeArr.push(items.dataValues.name);
                                }
                            }
                        }
                    }
                }catch(e){

                }
                try{
                    if(items.dataValues.ProjectAffairs[0]&&teamArr[0]==user_id) {
                        const { insert_time } = items.dataValues;
                        const { deadline, completionDegree } = items.dataValues.ProjectAffairs[0].dataValues;
                        const allLen = Date.parse(deadline) - Date.parse(insert_time);
                        const nowLen = Date.now() - Date.parse(insert_time);
                        let rate;
                        try{
                            rate = parseInt(nowLen/allLen*100);
                        }catch(e){
                            rate = 0;
                        }
                        if(rate>Number(completionDegree)) {
                            // 判断该事务是否为暂缓
                            if (items.dataValues.priority !== '暂缓') {
                                resObj.warnProgress++;
                                resObj.warnProgressArr.push(items.dataValues.name);
                            }
                        }
                    }
                }catch(e){

                }
            });
            resObj.overTimeArr = [...new Set(resObj.overTimeArr)];
            resObj.warnProgressArr = [...new Set(resObj.warnProgressArr)];
            resolve();
        }).catch(e => LOG(e));
    });

    // 未更新
    _p[3] = new Promise((resolve,reject) => {
        BaseEvent.count({
            where: {
                type: '1503',
                time: {
                    '$gte': startDate,
                    '$lte': endDate,
                },
                // time: sequelize.literal('date_format(time,"%Y-%m")=date_format("'+date+'","%Y-%m")'),
                person: user_id,
            }
        }).then(result => {
            resObj.notUpdate = result;
            resObj.notUpdateArr = [];
            resolve();
        }).catch(e => LOG(e));
        // StaffSign.findAll({
        //     where: {
        //         user_id,
        //         date: sequelize.literal('date_format(date,"%Y-%m")=date_format("'+date+'","%Y-%m")')
        //     }
        // }).then(result => {
        //     result.forEach((items,index) => {
        //         resObj.notUpdate += Number(items.dataValues.notUpdate);
        //         let inArr;
        //         try{
        //             inArr = items.dataValues.not_update_arr.split(',');
        //         }catch(e){
        //             inArr = [];
        //         }
        //         inArr.forEach((items,index) => {
        //             resObj.notUpdateArr.push(items);
        //         });
        //     });
        //     resObj.notUpdateArr = [...new Set(resObj.notUpdateArr)];
        //     resObj.notUpdateArr = resObj.notUpdateArr.reverse();
        //     resolve();
        // }).catch(e => LOG(e));
    });

    Promise.all(_p).then(() => cb(resObj)).catch(e => LOG(e));
}

/****************************** 自动化程序 ****************************** */

/**
 *  自动添加签到条目(如果有了则跳过)
 *  可用于新增员工时的触发
 */
this.addSignItem = () => {
    const date = DATETIME();
	CompanyCalendar.findAll({
		where: {
			date: date
		}
	}).then(result => {
		let status;
		if(result[0].isworkingday){
			status = 0;
		}else{
			status = 3;
		}
		Staff.findAll({
			where: {
				isdel: 0,
				on_job: 1
			}
		}).then(result => {
			let _p = [];
			result.forEach((items,index) => {
				_p[index] = new Promise((resolve,reject) => {
                    let user_id = items.dataValues.user_id;
                    let form_data = {
                        user_id: user_id,
                        date: date,
                        status: status
                    };
                    StaffSign.findAll({
                        where: {
                            user_id: user_id,
                            date: date
                        }
                    }).then(result => {
                        if(result[0]==null){
                            StaffSign.create(form_data).then(result => resolve()).catch(e => LOG(e));
                        }else{
                            resolve();
                        }
                    }).catch(e => LOG(e));
				});
			});
			Promise.all(_p).then(result => {
				console.log('考勤插入完成');
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

this.updateSignStatus = () => {
    const date = DATETIME();
    const nowTime = Date.now();
    const checkPeriod = (params,cb) => {
        const { isworkingday } = params;
        let todayFifteenClock = Date.parse(date+' 17:00:00');

        const toNormalWork = () => {
            StaffSign.findAll({
                where: {
                    date: date
                }
            }).then(staffSignArr => {
                const _p = [];
                staffSignArr.forEach((items,index) => {
                    let { user_id,status,id } = items.dataValues;
                    _p[index] = new Promise((resolve,reject) => {
                        if(status==3){
                            StaffSign.update({
                                status: 0
                            },{
                                where: {
                                    id: id
                                }
                            }).then(result => {
                                resolve();
                            }).catch(e => LOG(e));
                        }else if(status==4){
                            StaffOverWork.findAll({
                                where: {
                                    staff_sign_id: id,
                                    isdel: 0
                                }
                            }).then(result => {
                                const { on_time } = result[0].dataValues;
                                const in_id = result[0].dataValues.id;
                                StaffOverWork.update({
                                    isdel: 1
                                },{
                                    where: {
                                        id: in_id
                                    }
                                }).then(() => {
                                    StaffSignLog.create({
                                        on_time: on_time,
                                        staff_sign_id: id
                                    }).then(() => {
                                        StaffSign.update({
                                            status: 1
                                        },{
                                            where: {
                                                id: id
                                            }
                                        }).then(result => {
                                            resolve();
                                        }).catch(e => LOG(e));
                                    }).catch(e => LOG(e));
                                }).catch(e => LOG(e));
                            }).catch(e => LOG(e));
                        }
                    });
                });
                Promise.all(_p).then(() => {}).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }

        const toOverWork = () => {
            StaffSign.findAll({
                where: {
                    date: date
                }
            }).then(staffSignArr => {
                const _p = [];
                staffSignArr.forEach((items,index) => {
                    let { user_id,status,id } = items.dataValues;
                    _p[index] = new Promise((resolve,reject) => {
                        if(status==0){
                            StaffSign.update({
                                status: 3
                            },{
                                where: {
                                    date: date,
                                    user_id: user_id
                                }
                            }).then(() => resolve()).catch(e => LOG(e));
                        }else if(status==1){
                            StaffSignLog.findAll({
                                where: {
                                    staff_sign_id: id,
                                    isdel: 0
                                }
                            }).then(result => {
                                const { on_time } = result[0].dataValues;
                                const in_id = result[0].dataValues.id;
                                StaffSignLog.update({
                                    isdel: 1
                                },{
                                    where: {
                                        id: in_id
                                    }
                                }).then(() => {
                                    StaffOverWork.create({
                                        on_time: on_time,
                                        staff_sign_id: id
                                    }).then(() => {
                                        StaffSign.update({
                                            status: 4
                                        },{
                                            where: {
                                                id: id
                                            }
                                        }).then(result => {
                                            resolve();
                                        }).catch(e => LOG(e));
                                    }).catch(e => LOG(e));
                                }).catch(e => LOG(e));
                            }).catch(e => LOG(e));
                        }else if(status==2){
                            StaffSignLog.findAll({
                                where: {
                                    staff_sign_id: id,
                                    isdel: 0
                                }
                            }).then(result => {
                                const { on_time } = result[0].dataValues;
                                const in_id = result[0].dataValues.id;
                                StaffSignLog.update({
                                    isdel: 1
                                },{
                                    where: {
                                        id: in_id
                                    }
                                }).then(() => {
                                    StaffOverWork.create({
                                        on_time: on_time,
                                        staff_sign_id: id
                                    }).then(() => {
                                        StaffSign.update({
                                            status: 4
                                        },{
                                            where: {
                                                id: id
                                            }
                                        }).then(result => {
                                            StaffOutLog.update({
                                                isdel: 1
                                            },{
                                                where: {
                                                    staff_sign_id: id
                                                }
                                            }).then(() => {
                                                resolve();
                                            }).catch(e => LOG(e));
                                        }).catch(e => LOG(e));
                                    }).catch(e => LOG(e));
                                }).catch(e => LOG(e));
                            }).catch(e => LOG(e));
                        }
                    });
                });
                Promise.all(_p).then(() => {}).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }
        if(nowTime<todayFifteenClock){
            if(isworkingday){   // 3 -> 0,4 -> 1
                toNormalWork();
            }else{              // 0 -> 3,1 -> 4,2 -> 4
                toOverWork();
            }
        }
    }
	CompanyCalendar.findAll({
		where: {
			date: date
		}
	}).then(result => {
        const isworkingday = Number(result[0].isworkingday);
        checkPeriod({
            isworkingday: isworkingday
        });
    }).catch(e => LOG(e));
}

/**
 *  17点自动下班打卡
 *  （非工作日结束白天的加班）
 */
this.autoLeave = () => {
    const date = DATETIME();
    const endTime = TIME();
    //获取当天签到信息情况
    const getTodaySignInfo = (cb) => {
        StaffSign.findAll({
            include: [StaffOutLog,StaffSignLog],
            where: {
                date: date
            }
        }).then(result => {
            cb(result);
        }).catch(e => LOG(e));
    }

    //外出的人自动结束回岗时间
    const autoEndBackTime = (result,cb) => {
        //结束工作时间
        const endWorkTime = (itObj,cb) => {
            if(itObj.StaffSignLogs[0]==null){
                //新增
                StaffSignLog.create({
                    staff_sign_id: itObj.id,
                    on_time: endTime,
                    off_time: endTime
                }).then(result => {
                    cb();
                }).catch(e => LOG(e));
            }else{
                //更新
                if(itObj.StaffSignLogs[itObj.StaffSignLogs.length-1].dataValues.off_time){
                    cb();
                }else{
                    let lastSignId = itObj.StaffSignLogs[itObj.StaffSignLogs.length-1].dataValues.id;
                    StaffSignLog.update({
                        off_time: endTime
                    },{
                        where: {
                            id: lastSignId,
                            isdel: 0
                        }
                    }).then(result => {
                        cb();
                    }).catch(e => LOG(e));
                }
            }
        }
        //main()
        const _p = [];
        result.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const itObj = items.dataValues;
                const outArr = itObj.StaffOutLogs;
                if(itObj.status==2){
                    const outId = outArr[outArr.length-1].dataValues.id;
                    StaffOutLog.update({
                        back_time: endTime
                    },{
                        where: {
                            id: outId
                        }
                    }).then(result => endWorkTime(itObj,() => resolve())).catch(e => LOG(e));
                }else{
                    endWorkTime(itObj,() => resolve());
                }
            });
        });
        Promise.all(_p).then(result => {
            cb();
        }).catch(e => LOG(e));
    }

    //计算当天工作时间(单位：h)，并更新（status,hours）
    const getTotalTodayWorkTime = (cb) => {
        getTodaySignInfo(result => {
            const in_p = [];
            result.forEach((items,index) => {
                in_p[index] = new Promise((resolve,reject) => {
                    let totalTime = 0;
                    const itObj = items.dataValues;
                    const signEventArr = itObj.StaffSignLogs;
                    signEventArr.forEach((items,index) => {
                        if(items.dataValues.isdel==0){
                            let sign_on_time = Date.parse(items.dataValues.on_time);
                            let todayNineClock = Date.parse(DATETIME()+' 09:00:00');
                            if(sign_on_time<todayNineClock){
                                sign_on_time = todayNineClock;
                            }
                            let resStamp = Date.parse(items.dataValues.off_time) - sign_on_time;
                            if (resStamp > 0) {
                                totalTime += parseInt(Number(resStamp));
                            }
                        }
                    });
                    totalTime = totalTime/1000/60/60;
                    totalTime = parseInt(totalTime * 100) / 100;
                    StaffSign.update({
                        on_hours: totalTime,
                        status: 3
                    },{
                        where: {
                            id: itObj.id
                        }
                    }).then(result => resolve()).catch(e => LOG(e));
                });
            });
            Promise.all(in_p).then(result => {
                cb();
            }).catch(e => LOG(e));
        });
    }

    //main()
    getTodaySignInfo(result => {
        autoEndBackTime(result,() => {
            getTotalTodayWorkTime(() => {
                console.log('自动结算结束');
            });
        })
    });

    //非工作日自动结束白天的加班
    this.autoEndOverWork([date+' 01:00:00',date+' 17:00:00']);
}

/**
 *  自动结束加班
 *  @param { t } 白天加班区间，不带参为默认晚上加班结束区间
 */
this.autoEndOverWork = (t) => {
    const date = DATETIME();
    const endTime = TIME();
    let betweenTime = t?t:[date+' 17:00:01',date+' 22:00:00'];

    //返回状态3
    const backStatus = (cb) => {
        StaffSign.update({
            status: 3
        },{
            where: {
                date: date
            }
        }).then(result => {
            cb();
        }).catch(e => LOG(e));
    }

    //自动结束加班
    const endOverWork = (cb) => {
        StaffOverWork.update({
            off_time: endTime
        },{
            where: {
                on_time: {
                    '$between': betweenTime
                },
                off_time: {
                    '$eq': null
                }
            }
        }).then(result => {
            cb();
        }).catch(e => LOG(e));
    }

    //main
    const _p = [];
    _p[0] = new Promise((resolve,reject) => {
        backStatus(() => resolve());
    });
    _p[1] = new Promise((resolve,reject) => {
        endOverWork(() => resolve());
    });
    Promise.all(_p).then(result => console.log('加班结算完成')).catch(e => LOG(e));
}

/**
 *  遍历立项事务
 *  计算间隔超出
 */
this.calculUpdateTickScore = (params,cb) => {
    this.checkIsWorkDay({}, result => {
        if (result.data) {
            this.dealerNotReplyMsg();
            this.dealerAffairNotUpdate();
        }
    });
    // Affair.findAll({
    //     include: [ProjectAffair,SmallAffair],
    //     where: {
    //         isdel: 0
    //     }
    // }).then(result => {
    //     const _p = [];
    //     result.forEach((items,index) => {
    //         _p[index] = new Promise((resolve,reject) => {
    //             const { uuid, priority, insert_time, team, name } = items.dataValues;
    //             if(items.dataValues.ProjectAffairs.length==0&&items.dataValues.SmallAffairs.length==0){
    //                 resolve();
    //             }else{
    //                 let completionDegree;
    //                 try{
    //                     completionDegree = items.dataValues.ProjectAffairs[0].dataValues.completionDegree;
    //                 }catch(e){
    //                     completionDegree = items.dataValues.SmallAffairs[0].dataValues.completionDegree;
    //                 }
    //                 if(completionDegree<90){
    //                     const teamArr = team.split(',');
    //                     const in_p = [];
    //                     teamArr.forEach((items,index) => {
    //                         in_p[index] = new Promise((resolve,reject) => {
    //                             const userId = items;
    //                             ProgressUpdateRecord.findOne({
    //                                 where: {
    //                                     userId,
    //                                     progressId: uuid
    //                                 },
    //                                 order: [['id','DESC']]
    //                             }).then(result => {
    //                                 let lastTime;
    //                                 if(result){
    //                                     lastTime = result.dataValues.updateTime;
    //                                 }else{
    //                                     lastTime = TIME(Date.parse(insert_time)-60*60*1000*24);
    //                                 }
    //                                 checkOverUpdate({
    //                                     name,
    //                                     user_id: userId,
    //                                     lastTime,
    //                                     priority
    //                                 },() => { resolve() });
    //                             }).catch(e => LOG(e));
    //                         });
    //                     });
    //                     Promise.all(in_p).then(() => resolve()).catch(e => LOG(e));
    //                 }else{
    //                     resolve();
    //                 }
    //             }
    //         });
    //     });
    //     Promise.all(_p).then(() => cb()).catch(e => LOG(e));
    // }).catch(e => LOG(e));

    // // 判断是否超出一定时间未更新进度了
    // function checkOverUpdate(params, cb) {
    //     let { lastTime, priority, user_id, name } = params;
    //     const lastTimeStamp = Date.parse(DATETIME(lastTime));
    //     const nowTimeStamp = Date.parse(DATETIME());
    //     const day = (nowTimeStamp - lastTimeStamp)/(60*60*1000*24);
    //     if(priority=='紧急'){
    //         if(day>0){
    //             // 当天无更新，需要记分
    //             notUpdateAdd(user_id, DATETIME(), name, () => cb());
    //         }else{
    //             // 当天有更新，或者当天发布的事务
    //             cb();
    //         }
    //     }else if(priority=='重要'){
    //         if(day>1){
    //             // 近两天无更新，需要记分
    //             notUpdateAdd(user_id, DATETIME(), name, () => cb());
    //         }else{
    //             // 近两天有更新，或者近两天发布的事务
    //             cb();
    //         }
    //     }else if(priority=='普通'){
    //         if(day>2){
    //             // 近三天无更新，需要记分
    //             notUpdateAdd(user_id, DATETIME(), name, () => cb());
    //         }else{
    //             // 近三天有更新，或者近三天发布的事务
    //             cb();
    //         }
    //     }
    // }

    // // 计分
    // const score = 1;
    // function notUpdateAdd(user_id, date, name, cb) {
    //     return sequelize.transaction().then(function (transaction) {
    //         return sequelize.query('SELECT * FROM staff_sign WHERE user_id = "'+user_id+'" AND date = "'+date+'" FOR UPDATE',{transaction})
    //         .then(result => {
    //             try{
    //                 let not_update = Number(result[0][0].not_update);
    //                 let not_update_arr = result[0][0].not_update_arr;
    //                 try{
    //                     not_update_arr = not_update_arr.split(',');
    //                 }catch(e){
    //                     not_update_arr = [];
    //                 }
    //                 not_update_arr.push(name);
    //                 not_update_arr = not_update_arr.join();
    //                 not_update += score;
    //                 return StaffSign.update({
    //                     notUpdate: not_update,
    //                     not_update_arr
    //                 },{
    //                     where: {
    //                         user_id: user_id,
    //                         date: date
    //                     },
    //                     transaction: transaction
    //                 });
    //             }catch(e){
    //                 throw e;
    //             }
    //         })
    //         .then(() => {
    //             cb();
    //             return transaction.commit();
    //         }).catch(err => {
    //             LOG(err);
    //             cb();
    //             return transaction.rollback();
    //         });
    //     });
    // }
}