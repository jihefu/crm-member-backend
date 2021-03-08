const request = require('request');
const crypto = require('crypto');
const base = require('./base');
const NotiPost = require('../dao').NotiPost;
const NotiPostSub = require('../dao').NotiPostSub;
const serviceHomeMember = require('./homeMember');
const serviceHomeCustomers = require('./homeCustomers');
const redisClient = require('./redis');
const homeContacts = require('./homeContacts');
const serviceHomeLogin = require('../service/homeLogin');
const serviceHomeGoods = require('./homeGoods');

// const PostMailModel = require('../mongoModel/PostMailModel');

// PostMailModel.create({
//     title: "aaa"
// },(err,result) => {
//     console.log(result);
// });

// PostMailModel.find((err,result) => {
//     console.log(result);
// });

// PostMailModel.update({
//     title: "aaa"
// },{
//     mailId: "fff111"
// },(err,result) => {
//     console.log(result);
// });


class SyncMail {
    constructor(token){
        this.token = token;
    }

    patchToClientPost(formData){
        request.put({
            url: ROUTE('home/notiClient/fromNotiPostUpdate'),
            headers: {
                token: this.token
            }
        },(err,response,body) => {
            console.log(body);
        }).form({
            data: JSON.stringify(formData)
        });
    }
}


/**
 * 	事务邮件新增
 */
this.notiMailAdd = (params,cb) => {
    const { form_data,regName } = params;
    const sub_form_data_arr = form_data.NotiClientSubs;
    delete form_data.NotiClientSubs;
    
    NotiPost.create(form_data).then(result => {
        const _p = [];
        sub_form_data_arr.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                NotiPostSub.create(items).then(result => {
                    resolve();
                }).catch(e => LOG(e));
            });
        });
        Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '新增成功',
                data: []
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  撤回
 */
this.recall = (params,cb) => {
    const { mailId } = params;
    NotiPost.update({
        isdel: 1
    },{
        where: {
            mailId: mailId
        }
    }).then(result => {
        NotiPostSub.update({
            isdel: 1
        },{
            where: {
                noti_post_mailId: mailId
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '撤回成功',
                data: []
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  来自非事务系统的撤回
 */
this.recallApply = (params,cb) => {
    const { aesStr } = params;
    NotiPost.findAll({
        where: {
            aesStr: aesStr
        }
    }).then(result => {
        const mailIdArr = result.map(items => items.dataValues.mailId);
        NotiPost.update({
            isdel: 1
        },{
            where: {
                aesStr: aesStr
            }
        }).then(result => {
            NotiPostSub.update({
                isdel: 1
            },{
                where: {
                    noti_post_mailId: {
                        '$in': mailIdArr
                    }
                }
            }).then(() => cb({
                code: 200,
                msg: '撤销成功',
                data: []
            })).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  事务邮件更新
 */
this.notiMailUpdate = (params,cb) => {
    const { form_data,regName } = params;
    const sub_form_data_arr = form_data.NotiClientSubs;
    delete form_data.NotiClientSubs;
    const { mailId } = form_data;
    NotiPost.update(form_data,{
        where: {
            mailId: mailId
        }
    }).then(() => {
        const _p = [];
        sub_form_data_arr.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const { receiver } = items;
                delete items.id;
                NotiPostSub.update(items,{
                    where: {
                        noti_post_mailId: mailId,
                        receiver: receiver
                    }
                }).then(result => {
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
    }).catch(e => LOG(e));
}

/**
 *  来自通知中心的更新
 */
this.fromCenterUpdate = async (params,cb) => {
    let { form_data,token } = params;
    let admin_id;
    const tokenCheckRes = await serviceHomeLogin.openCheckToken({
        token,
    });
    if(tokenCheckRes.code==200){
        admin_id = tokenCheckRes.data.userId;
    }
    const that = this;
    //检查是否回复完全,如果只有一个votes，自动处理/
    const checkReplied = (params,cb) => {
        const { noti_client_mailId,id } = params;
        NotiPost.findOne({
            include: [NotiPostSub],
            where: {
                mailId: noti_client_mailId
            }
        }).then(result => {
            const { votes,NotiPostSubs } = result.dataValues;
            let voteArr;
            try{
                voteArr = votes.split(',');
            }catch(e){
                voteArr = [];
            }
            let form_data = {replied: 0};
            NotiPostSubs.forEach((items,index) => {
                if(items.dataValues.id==id){
                    //检查replied
                    if(items.dataValues.atMe==1){
                        if(items.dataValues.atReply){
                            if(items.dataValues.vote){
                                form_data.replied = 1;
                            }else{
                                if(voteArr.length==1){
                                    form_data.vote = voteArr[0];
                                    form_data.replied = 1;
                                }else if(voteArr.length==0){
                                    form_data.replied = 1;
                                }
                            }
                        }
                    }else{
                        if(items.dataValues.vote) form_data.replied = 1;
                    }
                }
            });
            NotiPostSub.update(form_data,{
                where: {
                    id: id
                }
            }).then(() => cb()).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }
    // 判断是否为会议消息，拒绝会议前回复
    const checkMeetingMsg = async (noti_client_mailId, atReply) => {
        return true;
        if (atReply) {
            const r = await NotiPost.findOne({ where: { mailId: noti_client_mailId }});
            if (r.dataValues.isMeetingMsg && Date.parse(TIME()) < Date.parse(r.dataValues.meetingTime)) {
                return false;
            }
        }
        return true;
    }
    let { id,noti_client_mailId,vote,atReply } = form_data;
    let needUpdate = { replyTime: TIME() };
    if(vote) needUpdate.vote = vote;
    if(atReply) needUpdate.atReply = atReply;
    const meetingRes = await checkMeetingMsg(noti_client_mailId, atReply);
    if (!meetingRes) {
        cb({
            code: -1,
            msg: '请在会议结束后回复',
            data: []
        });
        return;
    }
    NotiPostSub.update(needUpdate,{
        where: {
            id: id
        }
    }).then(updateRes => {
        checkReplied({
            noti_client_mailId: noti_client_mailId,
            id: id
        },() => {
            if(updateRes[0]){
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
            NotiPost.findOne({
                include: [NotiPostSub],
                where: {
                    mailId: noti_client_mailId
                }
            }).then(result => {
                const syncMail = new SyncMail(token);
                syncMail.patchToClientPost(result);
                if(result.dataValues.aesStr){
                    that.sendBackMsgToScuscribe(result.dataValues,admin_id);
                }
            }).catch(e => LOG(e));
        });
    }).catch(e => {
        LOG(e);
        cb({
            code: -1,
            msg: '字段过长',
            data: []
        });
    });
}

/**
 *  来自通知中心的更新reply
 */
this.fromCenterUpdateReply = (params,cb) => {
    const { id } = params.form_data;
    NotiPostSub.update({
        replied: 1
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
    
}

/**
 *  来自通知中心的get
 */
this.fromCenterList = (params,cb) => {
    const { admin_id } = params;
    NotiPostSub.findAll({
        include: {
            model: NotiPost,
            attributes: {
                exclude: ['album','albumName','file','fileName','proof','isdel']
            }
        },
        where: {
            receiver: admin_id,
            replied: 0,
            isdel: 0
        },
        order: [[{model: NotiPost},'post_time','DESC']]
    }).then(result => {
        //trans
        const staffMap = new base.StaffMap().getStaffMap();
        const _p = [];
        result.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const i = index;
                const it = items;
                try{
                    result[index].dataValues.NotiPost.dataValues.senderName = staffMap[result[index].dataValues.NotiPost.dataValues.sender].user_name;
                    resolve();
                }catch(e){
                    let open_id = result[index].dataValues.NotiPost.dataValues.sender;
                    serviceHomeMember.getInfoByOpenId({
                        open_id: open_id
                    },r => {
                        if(r){
                            let senderName = r.dataValues.name;
                            let company = r.dataValues.company;
                            serviceHomeCustomers.getTargetItem({
                                targetKey: r.dataValues.company
                            },r => {
                                if(r.data&&r.data.dataValues&&r.data.dataValues.company){
                                    senderName = senderName+'（'+r.data.dataValues.cn_abb+'）';
                                }else{
                                    senderName = senderName+'（'+company+'）';
                                }
                                it.dataValues.senderName = senderName;
                                result[i].dataValues.NotiPost.dataValues.senderName = senderName;
                                resolve();
                            });
                        }else{
                            //非会员
                            new redisClient.classWxUserInfo().getInfo(open_id,r => {
                                try{
                                    result[i].dataValues.NotiPost.dataValues.senderName = r.nickname+'（非会员）';
                                }catch(e){
                                    result[i].dataValues.NotiPost.dataValues.senderName = '匿名（非会员）';
                                }
                                resolve();
                            });
                        }
                    });
                    // result[index].dataValues.NotiPost.dataValues.senderName;
                }
            });
        });
        Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: result
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  投递到消息盒子
 */
this.sendToMsgBox = (params,cb) => {
    const { form_data,action } = params;
    let obj = {};
    new Promise((resolve,reject) => {
        if(action=='发布'){
            obj = {
                mailId: form_data.mailId,
                affairId: form_data.noti_client_affair_group_uuid,
                frontUrl: form_data.frontUrl,
                sender: form_data.sender,
                post_time: form_data.post_time,
                title: form_data.title,
                content: form_data.content,
                locationId: form_data.locationId,
                action: action
            };
            resolve();
        }else{
            resolve();
            return;
            NotiPost.findOne({
                where: {
                    mailId: form_data.noti_client_mailId
                }
            }).then(result => {
                let content = form_data.vote?form_data.vote:form_data.atReply;
                NotiPostSub.findOne({
                    where: {
                        id: form_data.id
                    }
                }).then(resultSub => {
                    obj = {
                        mailId: form_data.noti_client_mailId,
                        affairId: result.noti_client_affair_group_uuid,
                        frontUrl: result.frontUrl,
                        sender: resultSub.receiver,
                        post_time: TIME(),
                        title: result.title,
                        content: content,
                        action: action,
                        originMsg: result.content
                    };
                    resolve();
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }
    }).then(() => {
        new base.SendToMsgBox(obj).send();
    }).catch(e => LOG(e));
}

/**
 *  把结果发给对应的订阅者
 */
this.sendBackMsgToScuscribe = (info,admin_id) => {
    if(info.isdel) return;
    const vote = info.NotiPostSubs[0].dataValues.vote;
    const aesStr = info.aesStr;
    const secret = 'langjie';   //密钥
    const decipher = crypto.createDecipher('aes128', secret);
    let dec = decipher.update(aesStr, 'hex', 'utf8');   //编码方式从hex转为utf-8;
    dec += decipher.final('utf8');  //编码方式从utf-8;
    dec = JSON.parse(dec);
    switch(dec.type){
        case 'contacts':
            homeContacts.updateVerified({
                replyRes: vote,
                id: dec.id
            });
            let content = info.content;
            content = content.split('（')[1];
            let mailId = Date.now();
            request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
                console.log(body);
            }).form({
                data: JSON.stringify({
                    mailId: mailId,
                    class: 'contacts',
                    priority: '普通',
                    frontUrl: '/contacts',
                    sender: info.subscriber,
                    post_time: TIME(),
                    title: '联系人管理',
                    content: '认证'+vote+'（'+content,
                    votes: '已阅',
                    subscriber: info.sender,
                    NotiClientSubs: [
                        {
                            receiver: info.sender,
                            noti_post_mailId: mailId
                        }
                    ]
                })
            });
            break;
        case 'member':
            let { content: msgContent } = info;
            const msgCompany = msgContent.split('，')[1];
            const msgJob = msgContent.split('，')[2].replace(/）/ig, '');
            serviceHomeMember.updateVerified({
                replyRes: vote,
                id: dec.id,
                admin_id: admin_id,
                msgCompany,
                msgJob,
            });
            let _content = info.content;
            _content = _content.split('（')[1];
            let _mailId = Date.now();
            request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
                console.log(body);
            }).form({
                data: JSON.stringify({
                    mailId: _mailId,
                    class: 'member',
                    priority: '普通',
                    frontUrl: '/member',
                    sender: info.subscriber,
                    post_time: TIME(),
                    title: '会员管理',
                    content: '认证'+vote+'（'+_content,
                    votes: '已阅',
                    subscriber: info.sender,
                    NotiClientSubs: [
                        {
                            receiver: info.sender,
                            noti_post_mailId: _mailId
                        }
                    ]
                })
            });
            break;
        case 's_goods':
            const { id, admin_id: senderId } = dec;
            if (vote === '同意') {
                serviceHomeGoods.sendDelMsg(id, senderId);
            } else {
                serviceHomeGoods.cancelDealDel({ id, admin_id }, () => {});
            }
            break;
        default:
            break;
    }
}