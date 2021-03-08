const request = require('request');
const sequelize = require('../dao/mp').mpSequelize;
const Users = require('../dao/mp').Users;
const MeetingInfo = require('../dao/mp').MeetingInfo;
const MeetingSchedule = require('../dao/mp').MeetingSchedule;
const Origanizer = require('../dao/mp').Origanizer;
const MeetingNews = require('../dao/mp').MeetingNews;
const SignInfo = require('../dao/mp').SignInfo;
const Appeal = require('../dao/mp').Appeal;
const Message = require('../dao/mp').Message;
const MessageSub = require('../dao/mp').MessageSub;
const Album = require('../dao/mp').Album;
const Discuss = require('../dao/mp').Discuss

const APPID = 'wx1bff49ece2b88778', SECRET = '6a2f68b101217a3ce73de6939cb70df7';
const superAuthArr = [999,'999',998,'998',997,'997',996,'996',995,'995',1000,'1000'];

// 筛选
const filterList = (openId, arr, cb) => {
    Users.findOne({
        where: {
            openId
        }
    }).then(result => {
        const { userId } = result.dataValues;
        let isSuperAuth = false;
        if(superAuthArr.indexOf(userId)!=-1) isSuperAuth = true;
        const resArr = [];
        if(isSuperAuth){
            arr.forEach((items,index) => {
                resArr.push(items);
            });
        }else{
            if(arr[0]&&arr[0].MessageSubs&&Array.isArray(arr[0].MessageSubs)){
                arr.forEach((items, index) => {
                    if(superAuthArr.indexOf(items.senderUserId)==-1){
                        let orderItem = items;
                        const subArr = [];
                        items.MessageSubs.forEach((it, ind) => {
                            if(superAuthArr.indexOf(it.receiverUserId)==-1){
                                subArr.push(it);
                            }
                        });
                        orderItem.dataValues.MessageSubs = subArr;
                        resArr.push(orderItem);
                    }
                });
            }else{
                arr.forEach((items,index) => {
                    if(superAuthArr.indexOf(items.userId)==-1){
                        resArr.push(items);
                    }
                });
            }
        }
        cb(resArr);
    }).catch(e => cb(responseError(e)));
}

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
        code: -12001,
        msg: '缺少参数'
    },
    noOpenId: {
        code: -12002,
        msg: '不存在该id'
    },
    noUser: {
        code: -12003,
        msg: '不存在该姓名'
    },
    hasUsed: {
        code: -12004,
        msg: '该姓名已被占用'
    },
    notOrganizer: {
        code: -12005,
        msg: '不是组委会成员'
    },
    organizerExist: {
        code: -12006,
        msg: '已是组委会成员'
    },
    dateError: {
        code: -12007,
        msg: '开幕时间必须小于闭幕时间'
    },
    scheduleExist: {
        code: -12008,
        msg: '该时间点已存在'
    },
    hasSigned: {
        code: -12009,
        msg: '已报名'
    },
    hasPayed: {
        code: -12010,
        msg: '汇款已递交，请勿重复操作'
    },
    errorDealer: {
        code: -12011,
        msg: '错误操作'
    },
    signFirst: {
        code: -12012,
        msg: '请先报名'
    },
    payHasEffective: {
        code: -12013,
        msg: '汇款已确认，请勿重复操作'
    },
    payHasInvalid: {
        code: -12014,
        msg: '汇款已否认，请勿重复操作'
    },
    receiverMustExist: {
        code: -12015,
        msg: '收件人必须存在'
    },
    checkErrorFirstSignIn: {
        code: -12016,
        msg: '签到失败，您没有提前报名'
    },
    hasGiveLike: {
        code:-12017,
        msg:'点赞失败，请勿重复点赞'
    },
    hasChecked: {
        code:-12018,
        msg:'已签到，无需再次签到'
    }
};

const ATTRIBUTES =  ['userId', 'userName', 'phoneCn','sid','class','pro','country','company','socialMedia','socialMediaAccount','openId','portrait'];

/**
 * 根据code获取openId
 */
this.getOpenIdByCode = (params, cb) => {
    const { code } = params;
    new Promise((resolve,reject) => {
        if(!code) reject(errorMapper.lackParams);
        const url = 'https://api.weixin.qq.com/sns/jscode2session?appid='+APPID+'&secret='+SECRET+'&js_code='+code+'&grant_type=authorization_code';
        request.get(url, (err,response,body) => {
            body = typeof(body) == 'object' ? body : JSON.parse(body);
            if(body.openid){
                resolve({
                    code: 200,
                    msg: '获取成功',
                    data: body.openid
                });
            }else{
                resolve({
                    code: -1,
                    msg: body.errmsg,
                    data: []
                });
            }
        });
    }).then(result => {
        cb(result);
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据openId判断访问者身份
 */
this.checkUserByOpenId = (params, cb) => {
    const { openId } = params;
    Users.findOne({
        where: {
            openId
        }
    }).then(result => {
        if(result){
            // 已经是合法成员了
            cb({
                code: 200,
                msg: '',
                data: result
            });
        }else{
            throw createError(errorMapper.noOpenId);
        }
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据姓名判断访问者身份
 */
this.checkUserByName = (params, cb) => {
    const { openId, userName, portrait } = params;
    new Promise((resolve,reject) => {
        if(!userName || !portrait) reject(errorMapper.lackParams);
        return Users.findOne({
            where: {
                userName
            }
        }).then(result => {
            if(result){
                if(result.dataValues.openId){
                    if(result.dataValues.openId == openId){
                        resolve(result);
                    }else{
                        reject(createError(errorMapper.hasUsed));
                    }
                }else{
                    // 新增会员信息，把openId和头像地址存入表中
                    const { userId } = result.dataValues;
                    return Users.update({
                        openId,
                        portrait
                    },{
                        where: {
                            userId
                        }
                    }).then(() => {
                        return Users.findOne({
                            where: {
                                userId
                            }
                        }).then(result => resolve(result)).catch(e => reject(e));
                    }).catch(e => reject(e));
                }
            }else{
                reject(createError(errorMapper.noUser));
            }
        }).catch(e => {
            reject(e);
        });
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 提交申诉
 */
this.applyAppeal = (params, cb) => {
    const { userName, phone, content } = params;
    const that = this;
    new Promise((resolve,reject) => {
        if(!userName || !phone || !content) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        Appeal.create({
            userName,
            phone,
            content
        }).then(result => {
            cb({
                code: 200,
                msg: '提交成功',
                data: result
            });
            that.sendSignChangeInfo({
                content: userName+'提交申诉请求，联系方式：'+phone+'。申诉内容：'+content
            },() => {});
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 获取同学列表
 */
this.getUserList = (params, cb) => {
    let page = params.page ? Number(params.page) : 1;
    let pageSize = params.pageSize ? Number(params.pageSize) : 20;
    let keywords = params.keywords ? params.keywords : '';
    let filter = params.filter ? params.filter : {};
    const { openId } = params;
    filter = typeof filter == 'object' ? filter : JSON.parse(filter);
    let { classroom } = filter;
    const offset = (page-1) * pageSize;
    let sqlstr = 'SELECT User_name As userName, User_id As userId, Phone_cn AS phoneCn, Portrait AS portrait FROM user WHERE User_name LIKE "%'+keywords+'%" ORDER BY CONVERT(User_name USING gbk) asc LIMIT '+offset+','+pageSize;
    if(classroom&&classroom!=4) sqlstr = 'SELECT User_name As userName, User_id As userId, Phone_cn AS phoneCn, Portrait AS portrait FROM user WHERE User_name LIKE "%'+keywords+'%" AND class = "'+classroom+'" ORDER BY CONVERT(User_name USING gbk) asc LIMIT '+offset+','+pageSize;
    if(classroom&&classroom==4) sqlstr = 'SELECT User_name As userName, User_id As userId, Phone_cn AS phoneCn, Portrait AS portrait FROM user WHERE User_name LIKE "%'+keywords+'%" AND (class NOT IN (1,2,3) OR class IS NULL) ORDER BY CONVERT(User_name USING gbk) asc LIMIT '+offset+','+pageSize;
    sequelize.query(sqlstr,{model: Users}).then(result => {
        const _p = [];
        result.forEach((items,index) => {
            const { userId } = items.dataValues;
            const i = index;
            _p[index] = new Promise((resolve,reject) => {
                return SignInfo.findOne({
                    where: {
                        userId
                    }
                }).then(r => {
                    result[i].dataValues.isSign = 0;
                    result[i].dataValues.payState = '未缴费';
                    if(r&&r.dataValues.isSign==1) result[i].dataValues.isSign = 1;
                    if(r) result[i].dataValues.payState = r.dataValues.payState;
                    resolve();
                }).catch(e => reject(e));
            });
        });
        return Promise.all(_p).then(() => {
            filterList(openId, result, arr => {
                cb({
                    code: 200,
                    msg: '',
                    data: arr
                });
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据userId获取个人基本信息
 */
this.getUserInfoByUserId = (params, cb) => {
    const { userId } = params;
    new Promise((resolve,reject) => {
        if(!userId) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return Users.findOne({
            attributes: ATTRIBUTES,
            where: {
                userId
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据openId获取个人基本信息
 */
this.getUserInfoByOpenId = (params, cb) => {
    const { openId } = params;
    Users.findOne({
        attributes: ATTRIBUTES,
        where: {
            openId
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
 * 根据openId更新个人基本信息
 */
this.updateUserInfoByOpenId = (params, cb) => {
    const { openId } = params;
    Users.update(params,{
        where: {
            openId
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
 * 查看共有多少人报名，当前排在第几位
 */
this.signPersonNum = (params, cb) => {
    const { openId } = params;
    Users.findOne({
        where: {
            openId
        }
    }).then(result => {
        const { userId } = result.dataValues;
        let isSuperAuth = false;
        if(superAuthArr.indexOf(userId)!=-1) isSuperAuth = true;
        SignInfo.findAll({
            where: {
                isSign: 1
            }
        }).then(result => {
            let site = 0;
            let count = 0;
            let endSite = 0;
            result.forEach((items, index) => {
                if(isSuperAuth || (isSuperAuth==false&&superAuthArr.indexOf(items.dataValues.userId)==-1)){
                    count++;
                    site++;
                    if(items.dataValues.openId == openId){
                        endSite = site;
                    }
                }
            });
            cb({
                code: 200,
                msg: '',
                data: {
                    count,
                    site: endSite
                }
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 获取组委会成员
 */
this.getOrganizerList = (params, cb) => {
    const { openId } = params;
    Origanizer.findAll({
        where: {
            isdel: 0
        }
    }).then(result => {
        const _p = [];
        result.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const i = index;
                return Users.findOne({
                    where: {
                        userId: items.dataValues.userId
                    }
                }).then(r => {
                    result[i].dataValues.portrait = r.dataValues.portrait;
                    resolve();
                }).catch(e => reject(e));
            });
        });
        return Promise.all(_p).then(() => {
            filterList(openId, result, arr => {
                cb({
                    code: 200,
                    msg: '',
                    data: arr
                });
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 是否是组委会成员
 */
this.checkIsOrganizer = (params, cb) => {
    const { openId } = params;
    Users.findOne({
        where: {
            openId
        }
    }).then(result => {
        const { userId } = result.dataValues;
        return Origanizer.findOne({
            where: {
                isdel: 0,
                userId
            }
        }).then(result => {
            if(result){
                cb({
                    code: 200,
                    msg: '组委会成员',
                    data: []
                });
            }else{
                throw createError(errorMapper.notOrganizer);
            }
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 添加组委会成员
 */
this.addOrganizer = (params, cb) => {
    let { organizerArr } = params;
    organizerArr = typeof(organizerArr) == 'object' ? organizerArr : JSON.parse(organizerArr);
    const _p = [];
    organizerArr.forEach((items,index) => {
        _p[index] = new Promise((resolve,reject) => {
            const { userId, userName, job } = items;
            if(!userId) reject(errorMapper.lackParams);
            return Origanizer.findOne({
                where: {
                    userId,
                    isdel: 0
                }
            }).then(result => {
                if(result){
                    // 已经存在
                    // reject(errorMapper.organizerExist);
                    resolve();
                }else{
                    return Users.findOne({
                        where: {
                            userId
                        }
                    }).then(r => {
                        if(r){
                            return Origanizer.create({
                                userId,
                                userName: r.dataValues.userName,
                                job
                            }).then(result => {
                                resolve();
                            }).catch(e => { throw e });
                        }else{
                            reject(errorMapper.noUser);
                        }
                    }).catch(e => reject(e));
                }
            }).catch(e => { throw e });
        });
    });
    return Promise.all(_p).then(() => {
        cb({
            code: 200,
            msg: '新增成功',
            data: []
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 移除组委会成员
 */
this.removeOrganizer = (params, cb) => {
    const { userId } = params;
    new Promise((resolve,reject) => {
        if(!userId) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return Origanizer.update({
            isdel: 1
        },{
            where: {
                userId
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '移除成功',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 更新组委会分工信息
 */
this.updateOrganizerJob = (params,cb) => {
    const { userId, job } = params;
    new Promise((resolve,reject) => {
        if(!userId || !job) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return Origanizer.update({
            job
        },{
            where: {
                userId
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '更新成功',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 会议基本信息
 */
this.getMeetingInfo = (params, cb) => {
    MeetingInfo.findOne().then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 修改会议基本信息
 */
this.updateMeetingInfo = (params, cb) => {
    const { id, startDate, endDate } = params;
    new Promise((resolve,reject) => {
        if(!id) reject(errorMapper.lackParams);
        if(startDate&&endDate){
            if(Date.parse(startDate)>Date.parse(endDate)) reject(errorMapper.dateError);
        }
        resolve();
    }).then(() => {
        return MeetingInfo.update(params,{
            where: {
                id
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '更新成功',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 会议日程安排
 */
this.meetingScheduleList = (params, cb) => {
    MeetingSchedule.findAll({
        where: {
            isdel: 0
        },
        order: [['setTime']]
    }).then(result => {
        const hashMapper = {};
        result.forEach((items,index) => {
            if(!hashMapper[DATETIME(items.dataValues.setTime)]){
                hashMapper[DATETIME(items.dataValues.setTime)] = [];
            }
            hashMapper[DATETIME(items.dataValues.setTime)].push(items.dataValues);
        });
        const resArr = [];
        for(let key in hashMapper){
            resArr.push(hashMapper[key]);
        }
        cb({
            code: 200,
            msg: '',
            data: resArr
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 新增日程安排
 */
this.addMeetingSchedule = (params, cb) => {
    const { setTime, title, content, endTime } = params;
    new Promise((resolve,reject) => {
        if(!setTime || !content || !endTime) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return MeetingSchedule.findOne({
            where: {
                setTime,
                isdel: 0
            }
        }).then(result => {
            if(result){
                throw createError(errorMapper.scheduleExist);
            }else{
                return MeetingSchedule.create({
                    setTime,
                    endTime,
                    title,
                    content
                }).then(result => {
                    cb({
                        code: 200,
                        msg: '新增成功',
                        data: result
                    });
                }).catch(e => {throw e});
            }
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 修改日程安排
 */
this.updateMeetingSchedule = (params, cb) => {
    const { setTime, endTime, title, content, id } = params;
    new Promise((resolve,reject) => {
        if(!id) reject(errorMapper.lackParams);
        if(!setTime&&!title&&!content&&!endTime) reject(errorMapper.lackParams);
        if(setTime){
            return MeetingSchedule.findOne({
                where: {
                    setTime,
                    isdel: 0
                }
            }).then(result => {
                if(result){
                    reject(errorMapper.scheduleExist);
                }else{
                    resolve();
                }
            }).catch(e => reject(e));
        }else{
            resolve();
        }
    }).then(() => {
        return MeetingSchedule.update(params,{
            where: {
                id
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '更新成功',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 删除日程安排
 */
this.delMeetingSchedule = (params, cb) => {
    const { id } = params;
    new Promise((resolve,reject) => {
        if(!id) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return MeetingSchedule.update({
            isdel: 1
        },{
            where: {
                id
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '更新成功',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 获取会议新闻
 */
this.meetingNewsList = (params, cb) => {
    MeetingNews.findAll({
        where: {
            isdel: 0
        },
        order: [['isTop','DESC'],['id','DESC']]
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 发布会议新闻
 */
this.addMeetingNews = (params, cb) => {
    const { title, content, img, isTop, openId } = params;
    new Promise((resolve,reject) => {
        if(!title || !content || !img) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return Users.findOne({
            where: {
                openId
            }
        }).then(result => {
            params.sender = result.dataValues.userId;
            params.senderName = result.dataValues.userName;
            params.sendTime = TIME();
            return MeetingNews.create(params).then(result => {
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
 * 编辑会议新闻
 */
this.editMeetingNews = (params, cb) => {
    const { title, content, id } = params;
    const formData = {};
    new Promise((resolve,reject) => {
        if(!title&&!content){
            reject(errorMapper.lackParams);
        }
        resolve();
    }).then(() => {
        if(title) formData.title = title;
        if(content) formData.content = content;
        return MeetingNews.update(formData,{
            where: {
                id
            }
        }).then(() => {
            cb({
                code: 200,
                msg: '更新成功',
                data: []
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 删除会议新闻
 */
this.delMeetingNews = (params, cb) => {
    const { id } = params;
    new Promise((resolve,reject) => {
        if(!id) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return MeetingNews.update({
            isdel: 1
        },{
            where: {
                id
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '删除成功',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 置顶会议新闻
 */
this.topMeetingNews = (params, cb) => {
    const { id, isTop } = params;
    new Promise((resolve,reject) => {
        if(!id || isTop==undefined) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return MeetingNews.update({
            isTop
        },{
            where: {
                id
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '操作成功',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/************************************* 参会部分 *********************************************/

/**
 * 根据userId获取报名信息
 */
this.getSignInfoByUserId = (params, cb) => {
    const { userId } = params;
    new Promise((resolve,reject) => {
        if(!userId) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return SignInfo.findOne({
            where: {
                userId
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 根据openId获取报名信息
 */
this.getSignInfoByOpenId = (params, cb) => {
    const { openId } = params;
    new Promise((resolve,reject) => {
        if(!openId) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return SignInfo.findOne({
            where: {
                openId
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 报名参加会议
 */
this.meetingSignIn = (params, cb) => {
    const { openId } = params;
    const that = this;
    Users.findOne({
        where: {
            openId
        }
    }).then(result => {
        const { userId, userName } = result.dataValues;
        return SignInfo.findOne({
            where: {
                openId
            }
        }).then(result => {
            if(result){
                if(result.dataValues.isSign){
                    // 已报名
                    throw createError(errorMapper.hasSigned);
                }else{
                    // 更新成报名状态
                    return SignInfo.update({
                        isSign: 1
                    },{
                        where: {
                            openId
                        }
                    }).then(result => {
                        cb({
                            code: 200,
                            msg: '报名成功',
                            data: result
                        });
                        that.sendSignChangeInfo({
                            content: userName+'已报名',
                            openId
                        },() => {});
                    }).catch(e => {throw e});
                }
            }else{
                // 新增
                return SignInfo.create({
                    userId,
                    openId,
                    userName,
                    isSign: 1
                }).then(result => {
                    cb({
                        code: 200,
                        msg: '报名成功',
                        data: result
                    });
                    that.sendSignChangeInfo({
                        content: userName+'已报名',
                        openId
                    },() => {});
                }).catch(e => {throw e});
            }
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 取消报名
 */
this.meetingSignOut = (params, cb) => {
    const { openId } = params;
    const that = this;
    SignInfo.update({
        isSign: 0
    },{
        where: {
            openId
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '操作成功',
            data: result
        });
        SignInfo.findOne({
            where: {
                openId
            }
        }).then(result => {
            const { userName } = result.dataValues;
            that.sendSignChangeInfo({
                content: userName+'取消报名',
                openId
            },() => {});
        }).catch(e => LOG(e));
    }).catch(e => cb(responseError(e)));
}

/**
 * 未缴费 -> 汇款已递交
 */
this.paySub = (params, cb) => {
    const { payRem, openId } = params;
    const that = this;
    const payState = '汇款已递交';
    new Promise((resolve,reject) => {
        if(!payRem) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return SignInfo.findOne({
            where: {
                openId
            }
        }).then(result => {
            if(result){
                if(result.dataValues.payState == payState){
                    // 汇款已递交，请勿重复操作
                    throw createError(errorMapper.hasPayed);
                }else if(result.dataValues.payState == '未缴费'){
                    // 正常流程
                    return SignInfo.update({
                        payState: '汇款已递交',
                        payRem
                    },{
                        where: {
                            openId
                        }
                    }).then(r => {
                        cb({
                            code: 200,
                            msg: '操作成功',
                            data: r
                        });
                        that.sendSignChangeInfo({
                            content: result.dataValues.userName+'递交缴费申请',
                            openId
                        },() => {});
                    }).catch(e => {throw e});
                }else{
                    // 错误操作
                    throw createError(errorMapper.errorDealer);
                }
            }else{
                // 请先报名
                throw createError(errorMapper.signFirst);
            }
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 汇款已递交 -> 确认缴费
 */
this.payEffective = (params, cb) => {
    const { userId, openId, messageSubId } = params;
    const that = this;
    const payState = '汇款已递交';
    new Promise((resolve,reject) => {
        if(!userId) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return SignInfo.findOne({
            where: {
                userId
            }
        }).then(result => {
            if(result){
                if(result.dataValues.payState==payState){
                    return SignInfo.update({
                        payState: '确认缴费'
                    },{
                        where: {
                            userId
                        }
                    }).then(result => {
                        cb({
                            code: 200,
                            msg: '操作成功',
                            data: result
                        });
                        that.replyMsg({
                            openId,
                            replyContent: '已阅',
                            id: messageSubId
                        },() => {});
                    }).catch(e => { throw e });
                } else if(result.dataValues.payState=='确认缴费') {
                    throw createError(errorMapper.payHasEffective);
                }else{
                    throw createError(errorMapper.errorDealer);
                }
            }else{
                throw createError(errorMapper.signFirst);
            }
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 汇款已递交 -> 未缴费
 */
this.payInvalid = (params, cb) => {
    const { userId, openId, messageSubId } = params;
    const that = this;
    const payState = '汇款已递交';
    new Promise((resolve,reject) => {
        if(!userId) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return SignInfo.findOne({
            where: {
                userId
            }
        }).then(result => {
            if(result){
                if(result.dataValues.payState==payState){
                    return SignInfo.update({
                        payState: '未缴费'
                    },{
                        where: {
                            userId
                        }
                    }).then(result => {
                        cb({
                            code: 200,
                            msg: '操作成功',
                            data: result
                        });
                        that.replyMsg({
                            openId,
                            replyContent: '已阅',
                            id: messageSubId
                        },() => {});
                    }).catch(e => { throw e });
                } else if(result.dataValues.payState=='未缴费') {
                    throw createError(errorMapper.payHasInvalid);
                }else{
                    throw createError(errorMapper.errorDealer);
                }
            }else{
                throw createError(errorMapper.signFirst);
            }
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 未缴费 -> 确认缴费
 */
this.originzerPayEffective = (params, cb) => {
    const { userId } = params;
    new Promise((resolve,reject) => {
        if(!userId) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return SignInfo.update({
            payState: '确认缴费'
        },{
            where: {
                userId
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '操作成功',
                data: result
            });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 更新参会信息（开放式）
 */
this.updateSignInfo = (params, cb) => {
    const that = this;
    const deleteArr = ['id', 'userId', 'userName', 'isSign', 'payState', 'payRem', 'pickUpPhone', 'hotelRoom'];
    deleteArr.forEach((items,index) => {
        delete params[items];
    });
    SignInfo.update(params,{
        where: {
            openId: params.openId
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '操作成功',
            data: result
        });
        Users.findOne({
            where: {
                openId: params.openId
            }
        }).then(result => {
            that.sendSignChangeInfo({
                content: result.dataValues.userName+'修改了参会信息',
                openId: params.openId
            },() => {});
        }).catch(e => LOG(e));
    }).catch(e => cb(responseError(e)));
}

/**
 * 组委会录入房间号和接站联系电话
 */
this.updateSignInfoByOrganizer = (params, cb) => {
    const { userId, hotelRoom, pickUpPhone, messageSubId, openId } = params;
    const that = this;
    new Promise((resolve,reject) => {
        if(!userId) reject(errorMapper.lackParams);
        if(!hotelRoom && !pickUpPhone) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        const formData = {};
        if(hotelRoom) formData.hotelRoom = hotelRoom;
        if(pickUpPhone) formData.pickUpPhone = pickUpPhone;
        return SignInfo.update(formData,{
            where: {
                userId
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '操作成功',
                data: result
            });
            that.replyMsg({
                openId,
                replyContent: '已阅',
                id: messageSubId
            },() => {});
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 查看@我的消息（基本上是组委会用）
 */
this.getAtSelfMessage = (params, cb) => {
    let { userId, page, pageSize, replyState, openId, hasDeal } = params;
    page = page ? Number(page) : 1;
    pageSize = pageSize ? Number(pageSize) : 20;
    hasDeal = hasDeal ? Number(hasDeal) : 0;
    const where = {
        receiverUserId: userId
    };
    if(replyState==1) where.replyTime = {
        '$ne': null
    };
    if(replyState==0) where.replyTime = {
        '$eq': null
    };
    Message.findAll({
        attributes: ['id'],
        include: {
            model: MessageSub,
            attributes: ['id', 'receiver', 'replyTime', 'replyContent', 'message_id'],
            where,
        },
        order: [['sendTime','DESC']],
    }).then(result => {
        const idArr = result.map(items => items.dataValues.id);
        return Message.findAll({
            include: MessageSub,
            where: {
                id: {
                    '$in': idArr
                },
                hasDeal
            },
            limit: pageSize,
            offset: ( page - 1 ) * pageSize,
            order: [['sendTime','DESC'],[{model: MessageSub},'replyTime','DESC']]
        }).then(result => {
            filterList(openId, result, arr => {
                cb({
                    code: 200,
                    msg: '',
                    data: arr
                });
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 查看我发布的消息
 */
this.getMyMsg = (params, cb) => {
    let { openId, page, pageSize } = params;
    page = page ? Number(page) : 1;
    pageSize = pageSize ? Number(pageSize) : 20;
    Message.findAll({
        include: MessageSub,
        where: {
            senderOpenId: openId
        },
        limit: pageSize,
        offset: ( page - 1 ) * pageSize,
        order: [['sendTime','DESC'],[{model: MessageSub},'replyTime','DESC']]
    }).then(result => {
        filterList(openId, result, arr => {
            cb({
                code: 200,
                msg: '',
                data: arr
            });
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 回复消息
 */
this.replyMsg = (params, cb) => {
    const { openId, replyContent, id } = params;
    new Promise((resolve,reject) => {
        if(!replyContent || !id) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return sequelize.transaction(t => {
            return MessageSub.update({
                replyContent,
                replyTime: TIME()
            },{
                where: {
                    id,
                    receiverOpenId: openId
                },
                transaction: t
            }).then(() => {
                return MessageSub.findOne({
                    where: {
                        id
                    },
                    transaction: t
                }).then(result => {
                    const { message_id } = result.dataValues;
                    return Message.update({
                        hasDeal: 1
                    },{
                        where: {
                            id: message_id
                        },
                        transaction: t
                    });
                });
            });
        }).then(result => {
            cb({
                code: 200,
                msg: '回复成功',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => cb(responseError(e)));
}

/**
 * 添加回复消息
 */
this.addReplyMsg = (params, cb) => {
    const { openId, replyContent, message_id } = params;
    new Promise((resolve,reject) => {
        if(!replyContent || !message_id) reject(errorMapper.lackParams);
        resolve();
    }).then(() => {
        return Users.findOne({
            where: {
                openId
            }
        }).then(result => {
            const { userName, userId } = result.dataValues;
            return MessageSub.create({
                receiver: userName,
                receiverOpenId: openId,
                receiverUserId: userId,
                replyTime: TIME(),
                replyContent,
                message_id
            }).then(result => {
                cb({
                    code: 200,
                    msg: '添加回复成功',
                    data: []
                });
            }).catch(e => { throw e });
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 发布消息
 */
this.addMsg = (params, cb) => {
    const { openId, title, content, receiverStr } = params;
    let reveiverArr;
    new Promise((resolve,reject) => {
        if(!content || !receiverStr) reject(errorMapper.lackParams);
        try{
            reveiverArr = receiverStr.split(',').filter(items => items);
        }catch(e){
            reject(e);
        }
        if(reveiverArr.length==0) reject(createError(errorMapper.receiverMustExist));
        resolve();
    }).then(() => {
        const _p = [];
        const receiverObjArr = [];
        reveiverArr.forEach((items,index) => {
            const i = index;
            _p[index] = new Promise((resolve,reject) => {
                return Users.findOne({
                    where: {
                        userId: items
                    }
                }).then(result => {
                    if(result){
                        receiverObjArr.push({
                            userName: result.dataValues.userName,
                            openId: result.dataValues.openId,
                            userId: result.dataValues.userId
                        });
                    }
                    resolve();
                }).catch(e => reject(e));
            });
        });
        return Promise.all(_p).then(() => {
            if(receiverObjArr.length==0) throw createError(errorMapper.receiverMustExist);
            return Users.findOne({
                where: {
                    openId
                }
            }).then(result => {
                let userName, userId;
                if(result){
                    userName = result.dataValues.userName;
                    userId = result.dataValues.userId;
                }else{
                    userName = openId;
                    userId = openId;
                }
                return sequelize.transaction(t => {
                    return Message.create({
                        sender: userName,
                        senderOpenId: openId,
                        senderUserId: userId,
                        sendTime: TIME(),
                        title,
                        content
                    },{
                        transaction: t
                    }).then(r => {
                        const _p = [];
                        receiverObjArr.forEach((items,index) => {
                            _p[index] = new Promise((resolve,reject) => {
                                MessageSub.create({
                                    receiver: items.userName,
                                    receiverOpenId: items.openId,
                                    receiverUserId: items.userId,
                                    message_id: r.dataValues.id
                                },{
                                    transaction: t
                                }).then(() => resolve()).catch(e => reject(e));
                            });
                        });
                        return Promise.all(_p);
                    });
                }).then(result => {
                    cb({
                        code: 200,
                        msg: '发布成功',
                        data: []
                    });
                }).catch(e => {throw e});
            }).catch(e => {throw e});
        }).catch(e => { throw e });
    }).catch(e => cb(responseError(e)));
}

/**
 * 系统向组委会发送参会信息变动消息
 */
this.sendSignChangeInfo = (params, cb) => {
    const that = this;
    let { content,openId } = params;
    openId = openId ? openId : 'system';
    Origanizer.findAll({
        where: {
            isdel: 0
        }
    }).then(result => {
        const receiverArr = result.map(items => items.userId);
        const receiverStr = receiverArr.join();
        that.addMsg({
            openId,
            title: '系统通知',
            content,
            receiverStr
        },result => cb(result));
    }).catch(e => cb(responseError(e)));
    // this.getOrganizerList({
    //     openId
    // },result => {
    //     const receiverArr = result.data.map(items => items.userId);
    //     const receiverStr = receiverArr.join();
    //     that.addMsg({
    //         openId,
    //         title: '系统通知',
    //         content,
    //         receiverStr
    //     },result => cb(result));
    // });
}

/**
 * 获取签到信息列表
 */
this.getSignInfoList = (params, cb) => {
    const { openId } = params;
    SignInfo.findAll({
        where: {
            isSign: 1
        },
        include: {
            association: SignInfo.hasMany(Users, { sourceKey: 'userId', foreignKey: 'userId' })
        }
    }).then(result => {
        filterList(openId, result, arr => {
            cb({
                code: 200,
                msg: '',
                data: arr
            });
        });
    }).catch(e => cb(responseError(e)));
}

/******************************当天签到******************************* */

/**
 * 点赞通知（开放）
 */
this.giveLikeMessage = function(params,callback){
    const { accordName, passiveName } = params
    Message.create({
        sender:'系统通知',
        content:accordName+'点赞了'+passiveName+'的照片',
        sendTime:TIME(),
        messageClass:1
    }).then(result =>{
        callback({
            code:200,
            msg:'',
            data:result
        })
    }).catch(e => {throw e})
}

/**
 * 评论通知
 */
this.discussMessage = function(params,callback){
    const { accordName, passiveName } = params
    Message.create({
        sender:'系统给通知',
        content:accordName+'评论了'+passiveName+'的照片',
        sendTime:TIME(),
        messageClass:1
    }).then(result => {
        callback(result)
    }).catch(e => {throw e})
}

/**
 * 当天签到
 */

this.meetingCheck = function(params,callback){
    const { openId } = params;
    new Promise((resolve,reject) => {
        SignInfo.findOne({
            where:{
                openId,
                isSign:1
            }
        }).then(result =>{
            if(result){
                resolve()
            }else{
                reject(createError(errorMapper.checkErrorFirstSignIn))
            }
        }).catch(e => {throw e})
    }).then(() =>{
        return SignInfo.findOne({
            where:{
                openId:openId,
                isCheck:1
            }
        }).then(result =>{
            if(result){
                throw createError(errorMapper.hasChecked)
            }else{
                SignInfo.update({
                    isCheck:1
                },{
                    where:{
                        openId
                    }
                }).then(result =>{
                    callback({
                        code:200,
                        msg:'签到成功',
                        data:result
                    })
                }).then(e => {throw e})
            }
        }).catch(e => {throw e})
    }).catch(e => callback(responseError(e)))
}

/**
 *根据openid获取个人签到信息 
 */
this.getCheckInfoByOpenId = function(params,callback){
    const { openId } = params
    SignInfo.findOne({
        where:{
            openId,
        }
    }).then(result => {
        callback({
            code:200,
            msg:'',
            data:result
        })
    }).catch(e => {throw e}) 
}

/**
 * 获取签到列表
 */
this.getCheckList = function(params,callback){
    let { openId, page, pageSize } = params
    page = page ? Number(page) : 1;
    pageSize = pageSize ? Number(pageSize) : 20;
    SignInfo.findAll({
        where:{
            isCheck:1
        },
        include: {
            association: SignInfo.hasMany(Users, { sourceKey: 'userId', foreignKey: 'userId' })
        },
        offset:(page - 1)*pageSize,
        limit:pageSize,
    }).then(result => {
        filterList(openId,result, arr =>{
            callback({
                code:200,
                msg:'',
                data:arr
            })
        })
    })
}




/**
 * 相册
 */
this.getAllImagesInfo = function(params,callback){
    let { page, pageSize } = params
    page = page ? Number(page) : 1;
    pageSize = pageSize ? Number(pageSize) : 20;
    Album.findAll({
        where:{
            isdel:0
        },
        limit: pageSize,
        offset: ( page - 1 ) * pageSize,
        order: [['imgSendTime','DESC']]
    }).then((result) => {
        callback({
            code:200,
            msg:'',
            data:result
        })
    }).catch(e =>{throw e})
}

/**
 *获取我上传的图片 
 */
this.getMineImagesInfo = function(params,callback){
    let { openId, page, pageSize} = params
    page = page ? Number(page) : 1
    pageSize = pageSize ? Number(pageSize) : 10
    Album.findAll({
        include:[{
            model:Discuss,
            // where:{
            //     isLike:1
            // }
        }],
        where:{
           imgSender:openId,
           isdel:0 
        }
    }).then(result => {
        callback({
            code:200,
            msg:'',
            data:result
        })
    }).catch(e => {throw e})
}

/**
 * 新建图片信息
 */
this.addImagesInfo = function(params,callback){
    const { title, openId, imgUrl } = params
    new Promise((resolve,reject) => {
        if(!imgUrl){
            reject(errorMapper.lackParams)
        }else{
            Users.findOne({
                where:{
                    openId
                }
            }).then(result => {
                if(result){
                    resolve(result)
                }else{
                    reject()
                }
            })
        }
    }).then((value) =>{
        const portrait = value.dataValues.portrait
        return Album.create({
            imgUrl,
            imgSender:openId,
            imgSendTime:TIME(),
            title,
            portrait,
        }).then(result =>{
            callback({
                code:200,
                msg:'新增成功',
                data:result
            })
        }).catch(e => {throw e})
    }).catch(e => callback(responseError(e)))
}

/**
 * 更新图片信息
 */
this.updateImagesInfo = function(params,callback){
    const { id, title } = params
    new Promise((resolve,reject) =>{
        if(!id){
            reject(errorMapper.lackParams)
        }else{
            resolve()
        }
    }).then(() =>{
        return Album.update({
            title
        },{
            where:{
                id
            }
        }).then(result =>{
            callback({
                code:200,
                msg:'',
                data:result
            })
        }).catch(e => {throw e})
    }).catch(e => callback(responseError(e)))
}

/**
 * 删除照片
 */
this.deleteImagesInfo = function(params,callback){
    const { id, openId } = params
    new Promise((resolve,reject) => {
        if(!id){
            reject(errorMapper.lackParams)
        }else{
            resolve()
        }
    }).then(()  => {
        return Album.update({
            isdel: 1
        },{
            where: {
                id
            }
        }).then(result => {
            callback({
                code: 200,
                msg: '删除成功',
                data: result
            });
        }).catch(e => {throw e});
    }).catch(e => callback(responseError(e)))
}


/**
 * 点赞照片
 */
this.giveLikeToImages = function(params,callback){
    const { album_id, portrait, isLike, openId,senderOpenId } = params
    new Promise((resolve,reject) => {
        if(!album_id || !isLike || !openId || !senderOpenId){
            reject(errorMapper.lackParams)
        }else{
            Users.findOne({
                where:{
                    openId
                }
            }).then(result => {
                if(result){
                    resolve(result)
                }else{
                    reject()
                }
            })
        }
    }).then((value) => {
       // console.log(value)// 点赞人信息
        var discussName = value.dataValues.userName//品论人
        var portrait = value.dataValues.portrait
        return Discuss.findOne({
            where:{
                discussOpenid:openId,
                isLike:1,
                album_id
            }
        }).then(result => {
            if(result){
                throw createError(errorMapper.hasGiveLike)
            }else{
                Discuss.create({
                    album_id,
                    portrait,
                    isLike,
                    discussOpenid:openId,
                    likeTime:TIME()
                }).then(result =>{
                    callback({
                        code:200,
                        msg:'点赞成功',
                        data:result
                    })
                    Users.findOne({
                        where:{
                            openId:senderOpenId
                        }
                    }).then(result => {
                        var imgSenderName = result.dataValues.userName
                        let param = {
                            accordName:discussName,
                            passiveName:imgSenderName
                        }
                        this.giveLikeMessage(param,() =>{});
                    }).catch(e => {throw e})
                }).catch(e => {throw e})      
            }
        }).catch(e => { throw e})
    }).catch(e => callback(responseError(e)))
}

/**
 * 弹幕（评论）
 */
this.discussToImages = function(params,callback){
    const { openId, portrait, content, album_id, senderOpenId } = params
    new Promise((resolve,reject) =>{
        if(!openId || !content || !album_id || !senderOpenId){
            reject(errorMapper.lackParams)
        }else{
            Users.findOne({
                where:{
                    openId:openId
                }
            }).then(result =>{
                if(result){
                    resolve(result)
                }else{
                    reject()
                }
            })
        }
    }).then((result) => {
        var discussName = result.dataValues.userName
        var portrait = result.dataValues.portrait
        return Discuss.create({
            discussOpenid:openId,
            portrait,
            content,
            album_id
        }).then(result =>{
            callback({
                code:200,
                msg:'评论成功',
                data:result
            })
            Users.findOne({
                where:{
                    openId:senderOpenId
                }
            }).then(result =>{
                var senderName = result.dataValues.userName
                let params = {
                    accordName:discussName,
                    passiveName:senderName
                };
                this.discussMessage(params,()=>{})
            })
        }).catch(e => {throw e})
    }).catch(e => callback(responseError(e)))
}

/**
 * 获取图片评论信息（点赞，弹幕）
 */
this.getImagesDiscussInfo = function(params,callback){
    let { page, pageSize } = params
    page = page ? Number(page) : 1
    pageSize = pageSize ? Number(pageSize) : 20
    Album.findAll({
        include:[{
            model:Discuss,
        }],
        where:{
            isdel:0
        },
        limit:pageSize,
        offset:(page - 1) * pageSize
    }).then(result => {
        callback({
            code:200,
            msg:'',
            data:result
        })
    }).catch(e => {throw e})
}

/**
 * 点赞评论通知中心
 */
this.getDiscussAndLikeNotice = function(params,callback){
    const { openId } = params
    Message.findAll({
        where:{
            hasDeal:0,
            messageClass:1
        },
        order: [['sendTime','DESC']],
        limit:6
    }).then(result => {
        callback({
            code:200,
            msg:"",
            data:result
        })
    })
}


/**
 * 获取点赞数量最多前6张的图片
 */
this.getMostLikeImages = function(params,callback){
    const { openId } = params
    Album.findAll({
        include:[{
            model:Discuss,
            where:{
                isLike:1
            },
            order: [['likeTime','DESC']],
        }],
        where:{
            isdel:0
        },
        order:[['imgSendTime','DESC']],
       // limit:6
    }).then(result => {
    var parameter = this.timeDecayAlgorithm(result).slice(0,6)
    //console.log(parameter.length)
        callback({
            code:200,
            msg:'',
            data:parameter
        })
    })
}







/**
 * 时间衰减算法
 */
var timeRangeMap = new Map([
    [2,10],
    [4,5],
    [8,2],
    [16,1],
    [32,0]
])
this.timeDecayAlgorithm = function(parameter){
    for(let i = 0; i < parameter.length; i++){
        Object.defineProperty(parameter[i],'newestLikeTime',{
            writable:true,
            enumerable:true,
            value:''
        })
        Object.defineProperty(parameter[i],'likeTotal',{
            writable:true,
            enumerable:true,
            value:0
        })
        if(parameter[i].dataValues.Discusses.length > 0){
            var length = parameter[i].dataValues.Discusses.length
            parameter[i].dataValues.newestLikeTime = parameter[i].dataValues.Discusses[length-1].dataValues.likeTime
        }else{
            parameter[i].dataValues.newestLikeTime = null
        }
        var likeTotal = 0
        for(let j = 0; j < parameter[i].dataValues.Discusses.length; j++){
            if(parameter[i].dataValues.Discusses[j].isLike){
                likeTotal++
                parameter[i].dataValues.likeTotal = likeTotal
            }
        }
        var passHours = (Math.floor((new Date() - new Date(parameter[i].dataValues.newestLikeTime))/1000/60/60))
       // console.log(parameter[i].dataValues.id+'的过期时间'+passHours)
       console.log(passHours)
        if(0 < passHours && passHours <= 2){
           parameter[i].dataValues.likeTotal = this.Formula(2,parameter[i].dataValues.likeTotal)
        }else if(2 < passHours  && passHours <= 4){
            parameter[i].dataValues.likeTotal = this.Formula(4,parameter[i].dataValues.likeTotal)
        }else if(4 < passHours && passHours <= 8){
            parameter[i].dataValues.likeTotal = this.Formula(8,parameter[i].dataValues.likeTotal)
        }else if(8 < passHours && passHours <=16){
            parameter[i].dataValues.likeTotal = this.Formula(16,parameter[i].dataValues.likeTotal)
        }else{
            parameter[i].dataValues.likeTotal = this.Formula(32,parameter[i].dataValues.likeTotal)
        }
    }
  return this.bubblingSort(parameter)
//    return parameter
}


//冒泡排序

this.bubblingSort = function(arr){
    var len = arr.length
    for(let i = 0; i < len-1; i++){
        for(let j = 0; j < len - i - 1; j++){
            var temp
            if(arr[j].dataValues.likeTotal < arr[j+1].dataValues.likeTotal){
                temp = arr[j+1];
                arr[j+1] = arr[j];
                arr[j] = temp
            }
        }
    }
    return arr
}
this.Formula = function(timeValue,likeTotal){
    //总量 = （当前时间 - 最新点赞时间）对应的map的value + 点赞数*2
    var total = timeRangeMap.get(timeValue) + (likeTotal * 2)
    return total
}