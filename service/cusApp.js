const sequelize = require('../dao').sequelize;
const Member = require('../dao').Member;
const Customers = require('../dao').Customers;
const CustomerSign = require('../dao').CustomerSign;
const CustomerMsg = require('../dao').CustomerMsg;
const wsServer = require('../bin/wsServer');
const redisClient = require('./redis');
var JPush = require("../node_modules/jpush-sdk/lib/JPush/JPush.js");
var client = JPush.buildClient('2beab894368a95ae347ff378', '3af61eef45d4e5a06cf8e294');

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
    noMember: {
        code: -10001,
        msg: '请先加入朗杰会员'
    },
    noPass: {
        code: -10002,
        msg: '请等待审核通过'
    },
    noCompany: {
        code: -10003,
        msg: '不存在公司'
    },
    alreadySign: {
        code: -10004,
        msg: '已签过，请勿重复操作'
    },
    alreadySignOut: {
        code: -10005,
        msg: '已签退，请勿重复操作'
    },
    signFirst: {
        code: -10006,
        msg: '请先签到'
    },
    lackParams: {
        code: -10007,
        msg: '缺少参数'
    },
    noMsg: {
        code: -10008,
        msg: '不存在该消息'
    },
    noPowerRecall: {
        code: -10009,
        msg: '无权限撤回'
    },
    recallOutTime: {
        code: -10010,
        msg: '超过规定撤回时间'
    }
};

/**
 * 登陆
 */
this.login = (params,cb) => {
    const { phone } = params;
    Member.findOne({
        where: {
            phone
        }
    }).then(result => {
        if(!result) throw createError(errorMapper.noMember);
        const { name, phone, company, job, checked, open_id, portrait } = result.dataValues;
        let isBoss = 0;
        if((job.indexOf('法人')!=-1||job.indexOf('合伙人')!=-1)&&checked) isBoss = 1;
        if(!checked) throw createError(errorMapper.noPass);
        return Customers.findOne({
            where: {
                company
            }
        }).then(result => {
            if(!result) throw createError(errorMapper.noCompany);
            const { user_id } = result.dataValues;
            const resData = {
                openId: open_id,
                userId: user_id,
                userName: name,
                phone,
                isBoss,
                portrait
            };
            cb({
                code: 200,
                msg: '登陆成功',
                data: resData
            });
        }).catch(e => {
            throw e;
        });
    }).catch(e => {
        cb(responseError(e));
    });
}

/**
 * 指定openId，指定时间的签到状态
 */
this.getStatus = (params,cb) => {
    const { openId } = params;
    const date = params.date ? params.date : DATETIME();
    CustomerSign.findOne({
        where: {
            openId,
            signTime: sequelize.literal('date_format(CustomerSign.signTime,"%Y-%m-%d")="'+date+'"')
        },
        order: [['id','DESC']]
    }).then(result => {
        const resObj = {
            data: result
        };
        if(result&&result.signTime){
            if(result.leaveTime){
                resObj.status = 2;
            }else{
                resObj.status = 1;
            }
        }else{
            resObj.status = 0;
        }
        cb({
            code: 200,
            msg: '',
            data: resObj
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 签到
 */
this.signIn = (params,cb) => {
    const { openId, userId } = params;
    const signTime = TIME();
    new Promise((resolve,reject) => {
        this.getStatus({
            openId
        },result => {
            if(result.data.data){
                // 当天签到过
                if(result.data.data.leaveTime){
                    // 并且签退过
                    resolve();
                }else{
                    reject(createError(errorMapper.alreadySign));
                }
            }else{
                // 当天没签到
                resolve();
            }
        });
    }).then(() => {
        return CustomerSign.create({
            openId,
            userId,
            signTime
        }).then(result => {
            cb({
                code: 200,
                msg: '签到成功',
                data: result
            });
        }).catch(e => {
            throw e;
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 补签到gps
 */
this.addSignInLocation = (params,cb) => {
    const { id, signLocation } = params;
    CustomerSign.update({
        signLocation
    },{
        where: {
            id
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '更新成功',
            data: []
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 签退
 */
this.signOut = (params,cb) => {
    const { openId, userId } = params;
    const leaveTime = TIME();
    new Promise((resolve,reject) => {
        this.getStatus({
            openId
        },result => {
            if(result.data.data){
                if(result.data.data.leaveTime){
                    reject(createError(errorMapper.alreadySignOut));
                }else{
                    resolve(result);
                }
            }else{
                reject(createError(errorMapper.signFirst));
            }
        });
    }).then(result => {
        const id = result.data.data.id;
        return CustomerSign.update({
            leaveTime
        },{
            where: {
                id
            }
        }).then(() => {
            cb({
                code: 200,
                msg: '签退成功',
                data: {
                    id
                }
            });
        }).catch(e => {
            throw e;
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 补签退gps
 */
this.addSignOutLocation = (params,cb) => {
    const { id, leaveLocation } = params;
    CustomerSign.update({
        leaveLocation
    },{
        where: {
            id
        }
    }).then(result => {
        cb({
            code: 200,
            msg: '更新成功',
            data: []
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 指定userId下的所有员工签到状况
 */
this.getSignInfoByUserId = (params,cb) => {
    const { userId } = params;
    const date = params.date ? params.date: DATETIME();
    const that = this;
    const resArr = [];
    new Promise((resolve,reject) => {
        return Customers.findOne({
            where: {
                user_id: userId
            }
        }).then(result => {
            if(result){
                const { company } = result.dataValues;
                return Member.findAll({
                    where: {
                        company,
                        checked: 1
                    }
                }).then(result => {
                    const _p = [];
                    result.forEach((items,index) => {
                        const { open_id, name, phone, portrait } = items.dataValues;
                        _p[index] = new Promise((resolve,reject) => {
                            that.getStatus({
                                openId: open_id
                            },result => {
                                const item = {
                                    openId: open_id,
                                    name,
                                    phone,
                                    portrait
                                };
                                if(result.data.data){
                                    item.signInfo = result.data.data;
                                }else{
                                    item.signInfo = {};
                                }
                                CustomerMsg.count({
                                    where: {
                                        sender: open_id,
                                        isRead: 0,
                                        isdel: 0
                                    }
                                }).then(count => {
                                    item.num = count;
                                    resArr.push(item);
                                    resolve();
                                }).catch(e => {
                                    throw e;
                                });
                            });
                        });
                    });
                    Promise.all(_p).then(() => {
                        resolve();
                    });
                }).catch(e => {
                    throw e;
                });
            }else{
                // 不存在该公司
                throw createError(errorMapper.noCompany);
            }
        }).catch(e => {
            throw e;
        });
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: resArr
        });
    }).catch(e => cb(responseError(e)));
}

/******************************************* 聊天 *******************************************/

/**
 * 聊天列表
 */
this.chatList = (params,cb) => {
    let { page, pageSize, keywords, receiver, sender } = params;
    page = page ? Number(page) : 1;
    pageSize = pageSize ? Number(pageSize) : 10;
    keywords = keywords ? keywords : '';
    CustomerMsg.findAll({
        where: {
            '$or': [
                {
                    sender: sender,
                    receiver: receiver
                },
                {
                    sender: receiver,
                    receiver: sender
                },
            ]
        },
        limit: pageSize,
        offset: ( page - 1 ) * pageSize,
        order: [['postTime','DESC']]
    }).then(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 未读消息
 */
this.chatListNotRead = (params,cb) => {
    const { receiver } = params;
    CustomerMsg.findAll({
        where: {
            receiver,
            isRead: 0
        },
        order: [['postTime','DESC']]
    }).then(result => {
        const _p = [];
        result.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const i = index;
                Member.findOne({
                    where: {
                        open_id: items.dataValues.sender
                    }
                }).then(r => {
                    result[i].dataValues.name = r.dataValues.name;
                    result[i].dataValues.phone = r.dataValues.phone;
                    result[i].dataValues.portrait = r.dataValues.portrait;
                    resolve();
                }).catch(e => {
                    throw e;
                });
            });
        });
        Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: result
            });
        }).catch(e => {
            throw e;
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 发送消息
 */
this.sendMsg = (params,cb) => {
    let { userId, sender, content, receiver, album, albumName, file, fileName, voice } = params;
    return new Promise((resolve,reject) => {
        if(!content || !receiver) reject(createError(errorMapper.lackParams));
        album = album ? album : '';
        albumName = albumName ? albumName : '';
        file = file ? file : '';
        fileName = fileName ? fileName : '';
        voice = voice ? voice : '';
        resolve();
    }).then(() => {
        return CustomerMsg.create({
            userId,
            sender,
            postTime: TIME(),
            content,
            album,
            albumName,
            file,
            fileName,
            voice,
            receiver
        }).then(result => {
            cb({
                code: 200,
                msg: '发送成功',
                data: result
            });
            Member.findOne({
                where: {
                    open_id: sender
                }
            }).then(r => {
                result.dataValues.name = r.dataValues.name;
                result.dataValues.phone = r.dataValues.phone;
                result.dataValues.portrait = r.dataValues.portrait;
                // wsServer.sendMsg(result);
                client.push()
                    .setPlatform(JPush.ALL)
                    .setAudience(JPush.tag(userId),JPush.alias(userId))
                    .setMessage('','','',{
                        type: 'sendMsg',
                        params: result
                    })
                    .send(function(err, res) {});
            }).catch(e => {
                throw e;
            });
        }).catch(e => {
            throw e;
        });
    }).catch(e => cb(responseError(e)));
}

/**
 * 撤回消息
 */
this.recallMsg = (params,cb) => {
    const { id, sender } = params;
    CustomerMsg.findOne({
        where: {
            id
        }
    }).then(result => {
        if(result){
            if(result.dataValues.sender == sender){
                const { postTime } = result.dataValues;
                const postTimeStamp = Date.parse(postTime);
                const diff = (Date.now() - postTimeStamp)/1000/60;
                if(diff>2) throw createError(errorMapper.recallOutTime);
                CustomerMsg.update({
                    isdel: 1
                },{
                    where: {
                        id
                    }
                }).then(result => {
                    cb({
                        code: 200,
                        msg: '撤回成功',
                        data: []
                    });
                }).catch(e => {
                    throw e;
                });
            }else{
                throw createError(errorMapper.noPowerRecall);
            }
        }else{
            throw createError(errorMapper.noMsg);
        }
    }).catch(e => cb(responseError(e)));
}

/**
 * 已阅
 */
this.doRead = (params,cb) => {
    const { id, openId } = params;
    CustomerMsg.findOne({
        where: {
            id,
            receiver: openId
        }
    }).then(result => {
        if(result){
            const sender = result.dataValues.sender;
            CustomerMsg.update({
                isRead: 1
            },{
                where: {
                    id
                }
            }).then(() => {
                cb({
                    code: 200,
                    msg: '操作成功',
                    data: []
                });
                wsServer.isRead({
                    id,
                    sender
                });
            }).catch(e => {
                throw e;
            });
        }else{
            throw createError(errorMapper.noMsg);
        }
    }).catch(e => cb(responseError(e)));
}

/**
 * 请求位置信息
 */
this.requestLocation = (params,cb) => {
    const { userId } = params;
    const that = this;
    that.getSignInfoByUserId({
        userId
    },result => {
        const openIdArr = result.data.map(items => items.openId);
        // 清空已有数据
        // redisClient.clearMemberByUserId({
        //     userId,
        //     openIdArr,
        // },resArr => {});
        new Promise((resolve,reject) => {
            client.push()
            .setPlatform(JPush.ALL)
            .setAudience(JPush.tag(userId),JPush.alias(userId))
            .setMessage('','','',{
                type: 'requestLocation'
            })
            .send(function(err, res) {
                if(err){
                    throw err;
                }
                resolve();
            });
        }).then(() => {
            // 开启延时
            setTimeout(function(){
                redisClient.getMemberByUserId({
                    userId,
                    openIdArr,
                },resArr => {
                    result.data.forEach((items,index) => {
                        result.data[index].online = 0;
                        resArr.forEach((it,ind) => {
                            if(items.openId==it.openId){
                                result.data[index].userId = it.userId;
                                result.data[index].lat = it.lat;
                                result.data[index].lon = it.lon;
                                result.data[index].timestamp = it.timestamp;
                                if((Date.now() - items.timestamp)/1000<20) result.data[index].online = 1;
                            }
                        });
                    });
                    cb({
                        code: 200,
                        msg: '更新成功',
                        data: result.data
                    });
                });
            },3000);
        }).catch(e => cb(responseError(e)));
    });
}

/**
 * 返回位置信息
 */
this.responseLocation = (params,cb) => {
    const { lon, lat, openId, userId, name, phone, timestamp } = params;
    redisClient.setMemberByUserId({
        openId,
        userId,
        infoObj: {
            lat,
            lon,
            openId,
            userId,
            name,
            phone,
            timestamp
        }
    },() => {
        cb({
            code: 200,
            msg: '',
            data: {}
        });
    });
}

/**
 * 不请求新的位置信息，只返回数据库已有的数据
 */
this.refreshMemberInfo = (params,cb) => {
    const { userId } = params;
    this.getSignInfoByUserId({
        userId
    },result => {
        const openIdArr = result.data.map(items => items.openId);
        redisClient.getMemberByUserId({
            userId,
            openIdArr,
        },resArr => {
            result.data.forEach((items,index) => {
                result.data[index].online = 0;
                resArr.forEach((it,ind) => {
                    if(items.openId==it.openId){
                        result.data[index].userId = it.userId;
                        result.data[index].lat = it.lat;
                        result.data[index].lon = it.lon;
                        result.data[index].timestamp = it.timestamp;
                        if((Date.now() - items.timestamp)/1000<20) result.data[index].online = 1;
                    }
                });
            });
            cb({
                code: 200,
                msg: '更新成功',
                data: result.data
            });
        });
    });
}