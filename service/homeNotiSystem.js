const common = require('./common');
const request = require('request');
const base = require('./base');
const sequelize = require('../dao').sequelize;
const moment = require('moment');
const Staff = require('../dao').Staff;
const Affair = require('../dao').Affair;
const NotiClient = require('../dao').NotiClient;
const NotiClientSub = require('../dao').NotiClientSub;
const NotiPost = require('../dao').NotiPost;
const NotiPostSub = require('../dao').NotiPostSub;
const ProgressUpdateRecord = require('../dao').ProgressUpdateRecord;
const Linq = require('linq');
const serviceAffairs = require('./homeRoutineAffairs');
const MsgBox = require('../dao').MsgBox;
const DocLib = require('../dao').DocLib;
const Customers = require('../dao').Customers;
const redisClient = require('./redis');
const serviceHomeMember = require('./homeMember');
const serviceHomeCustomers = require('./homeCustomers');
const serviceNotiPost = require('./NotiPost');
const service = require('./service');
const homeAttendanceService = require('./homeAttendance');
const BaseEvent = require('../dao').BaseEvent;
const CompanyCalendar = require('../dao').CompanyCalendar;

class Trans {
    constructor(data){
        this.data = data;
    }

    transToView(cb){
        const staffMap = new base.StaffMap().getStaffMap();
        this.data = this.data.filter(items => items);
        this.data.forEach((items,index) => {
            //sender转换
            try{
                items.dataValues.senderName = staffMap[items.dataValues.sender].user_name;
            }catch(e){
                try{
                    items.dataValues.senderName = items.dataValues.sender;
                }catch(e){
                    
                }
            }
            //atSomeone转换
            let atSomeoneArr,atSomeoneName = [];
            try{
                atSomeoneArr = items.dataValues.atSomeone.split(',');
            }catch(e){
                atSomeoneArr = [];
            }
            atSomeoneArr.forEach((it,ind) => {
                try{
                    atSomeoneName.push(staffMap[it].user_name);
                }catch(e){
                    atSomeoneName.push(it);
                }
            });
            items.dataValues.atSomeoneName = atSomeoneName.join();
            //subscriber转换
            let subscriberArr,subscriberName = [];
            try{
                subscriberArr = items.dataValues.subscriber.split(',');
            }catch(e){
                subscriberArr = [];
            }
            subscriberArr.forEach((it,ind) => {
                try{
                    subscriberName.push(staffMap[it].user_name);
                }catch(e){
                    subscriberName.push(it);
                }
            });
            items.dataValues.subscriberName = subscriberName.join();
            //回执receiver转换
            items.dataValues.NotiClientSubs.forEach((it,ind) => {
                try{
                    it.dataValues.receiverName = staffMap[it.dataValues.receiver].user_name;
                }catch(e){
                    it.dataValues.receiverName = it.dataValues.receiver;
                }
            });
        });
        const _p = [];
        this.data.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const it = items;
                if(it.dataValues.senderName.indexOf('oxIzx')!=-1){
                    serviceHomeMember.getInfoByOpenId({
                        open_id: it.dataValues.senderName
                    },result => {
                        if(result){
                            let senderName = result.dataValues.name;
                            //会员认证信息
                            let { state,checked,company,isUser } = result.dataValues;
                            if (isUser) {
                                checked = '个人会员';
                            } else {
                                if(state=='待认证'){
                                    checked = '，待认证';
                                }else if(state=='未通过'){
                                    checked = '，未通过';
                                }else{
                                    checked = '';
                                }
                            }
                            serviceHomeCustomers.getTargetItem({
                                targetKey: result.dataValues.company
                            },result => {
                                if(result.data&&result.data.dataValues&&result.data.dataValues.company){
                                    senderName = senderName+'（'+result.data.dataValues.cn_abb+checked+'）';
                                }else{
                                    senderName = senderName+'（'+company+checked+'）';
                                }
                                it.dataValues.senderName = senderName;
                                resolve();
                            });
                        }else{
                            //临时会员
                            new redisClient.classWxUserInfo().getInfo(it.dataValues.senderName,result => {
                                try{
                                    it.dataValues.senderName = result.nickname+'（非会员）';
                                }catch(e){
                                    it.dataValues.senderName = '匿名（非会员）';
                                }
                                resolve();
                            });
                        }
                    });
                }else{
                    resolve();
                }
            });
        });
        Promise.all(_p).then(() => {
            cb(this.data);
        }).catch(e => LOG(e));
        // return this.data;
    }

    transTomodel(){

    }
}

class SyncMail {
    constructor(sender){
        this.sender = sender;
    }

    postMail(formData,notSendToBox){
        const { noti_client_affair_group_uuid, isMeetingMsg } = formData.dataValues;
        const normalPost = () => {
            delete formData.dataValues.senderName;
            delete formData.dataValues.atSomeoneName;
            delete formData.dataValues.subscriberName;
            delete formData.dataValues.completed;
            formData.dataValues.NotiClientSubs.forEach((items,index) => {
                delete items.dataValues.receiverName;
                delete items.dataValues.id;
                formData.dataValues.NotiClientSubs[index]['dataValues']['noti_post_mailId'] = formData.dataValues.mailId;
            });
            let regName;
            if(notSendToBox){
                regName = 'justReadForAttention';
            }else{
                regName = 'affairMail';
            }
            request.post(ROUTE('notiPost/add?regName='+regName),(err,response,body) => {
                console.log(body);
            }).form({
                data: JSON.stringify(formData)
            });
        }

        const justRead = () => {
            serviceAffairs.getTargetAffair({
                affairId: noti_client_affair_group_uuid
            },result => {
                let { attentionStaff,team,secret } = result.data.dataValues;
                if(secret==1) return;
                let attentionStaffArr,teamArr;
                try{
                    attentionStaffArr = attentionStaff.split(',');
                }catch(e){
                    attentionStaffArr = [];
                }
                attentionStaffArr = attentionStaffArr.filter(items => items);
                teamArr = team.split(',');
                if(attentionStaffArr.length!=0){
                    let needAddArr = [];
                    attentionStaffArr.forEach((items,index) => {
                        if(teamArr.indexOf(items)==-1){
                            needAddArr.push(items);
                        }
                    });
                    //去除关注者自己发送消息再次给自己推送
                    if(needAddArr.indexOf(this.sender)!=-1){
                        needAddArr.splice(needAddArr.indexOf(this.sender),1);
                    }
                    //去除关注者是团队外的但是又被@了
                    let atSomeoneArr;
                    try{
                        atSomeoneArr = formData.dataValues.atSomeone.split(',');
                    }catch(e){
                        atSomeoneArr = [];
                    }
                    const endNeedAddArr = [];
                    Linq.from(needAddArr).except(atSomeoneArr).forEach(function (i) {
                        endNeedAddArr.push(i);
                    });
                    if(endNeedAddArr.length!=0){
                        formData.dataValues.mailId = Date.now();
                        formData.dataValues.votes = '已阅';
                        formData.dataValues.atSomeone = '';
                        formData.dataValues.subscriber = endNeedAddArr.join();
                        formData.dataValues.NotiClientSubs = endNeedAddArr.map(items => {
                            return {
                                noti_post_mailId: formData.dataValues.mailId,
                                receiver: items
                            };
                        });
                        request.post(ROUTE('notiPost/add?regName=justReadForAttention'),(err,response,body) => {
                            console.log(body);
                        }).form({
                            data: JSON.stringify(formData.dataValues)
                        });
                    }
                }
            });
        }

        normalPost();

        if (!isMeetingMsg) {
            justRead();
        }
    }

    patchToNotiPost(formData){
        delete formData.dataValues.senderName;
        delete formData.dataValues.atSomeoneName;
        delete formData.dataValues.subscriberName;
        delete formData.dataValues.completed;
        formData.dataValues.NotiClientSubs.forEach((items,index) => {
            delete items.dataValues.receiverName;
            formData.dataValues.NotiClientSubs[index]['dataValues']['noti_post_mailId'] = formData.dataValues.mailId;
        });
        request.put(ROUTE('notiPost/update?regName=affairMail'),(err,response,body) => {
            console.log(body);
        }).form({
            data: JSON.stringify(formData)
        });
    }

    recall(mailId){
        request.put(ROUTE('notiPost/recall/'+mailId),(err,response,body) => {
            console.log(body);
        });
    }
}

class PostHasCompleted {
    constructor(form_data){
        this.form_data = form_data;
    }

    formatContent(){
        let { NotiClientSubs,votes } = this.form_data;
        const voteArr = [],replyArr = [];
        let len;
        try{
            len = votes.split(',').length;
        }catch(e){
            len = 0;
        }
        let voteStr = '';
        NotiClientSubs.forEach((items,index) => {
            if(items.dataValues.atMe){
                replyArr.push({
                    receiver: items.dataValues.receiver,
                    content: items.dataValues.atReply
                });
            }else{
                voteArr.push({
                    receiver: items.dataValues.receiver,
                    content: items.dataValues.vote
                });
            }
        });
        if(len==0||len==1){
            return '';
        }else{
            const obj = {};
            const staffMap = new base.StaffMap().getStaffMap();
            voteArr.forEach((items,index) => {
                if(!obj[items.content]){
                    obj[items.content] = [];
                }
                try{
                    obj[items.content].push(staffMap[items.receiver].user_name);
                }catch(e){}
            });
            for(let key in obj){
                voteStr += '<p style="margin-bottom: 0px">'+key+'：'+obj[key].join()+'</p>'
            }
            return voteStr;
        }
    }

    send(){
        let form_data = this.form_data;
        let voteStr = this.formatContent();
        const _mailId = Date.now();
        request.post(ROUTE('notiPost/add?regName=justReadForAttention'),(err,response,body) => {
            console.log(body);
        }).form({
            data: JSON.stringify({
                mailId: _mailId,
                class: 'system',
                priority: form_data.priority,
                frontUrl: form_data.frontUrl,
                sender: 'system',
                post_time: TIME(),
                title: form_data.title,
                content: voteStr+'<p>回复已完成（'+form_data.content+'）</p>',
                votes: '已阅',
                subscriber: form_data.sender,
                locationId: form_data.locationId,
                noti_client_affair_group_uuid: form_data.noti_client_affair_group_uuid,
                NotiClientSubs: [
                    {
                        receiver: form_data.sender,
                        noti_post_mailId: _mailId
                    }
                ]
            })
        });
    }
}

// 延迟消息
const that = this;
this.DelayMsg = class DelayMsg {
    constructor() {
        this.m_queue = new redisClient.classAffairMsgQueue()
    }

    push(timestamp, data) {
        this.m_queue.push(timestamp, data);
    }

    remove(data) {
        this.m_queue.remove(data);
    }

    async dealer() {
        const resArr = await this.m_queue.getColection();
        for (let i = 0; i < resArr.length; i++) {
            const currentItem = JSON.parse(resArr[i]);
            const dataPhoto = JSON.stringify(currentItem);
            // 当前时间与延迟时间相等（精确到fen）
            const diff = moment().format('YYYY-MM-DD HH:mm') === moment(currentItem.delayTime).format('YYYY-MM-DD HH:mm');
            if (diff) {
                const { admin_id, notSendToBox } = currentItem;
                delete currentItem.admin_id;
                delete currentItem.notSendToBox;
                // 判断是否为会议消息的总结消息，并判断会议消息是否被删了
                const { isMeetingSum, non_str, noti_client_affair_group_uuid } = currentItem;
                let isdel = false;
                const result = await NotiClient.findOne({ where: { noti_client_affair_group_uuid, non_str, isdel: 0 }});
                if (!result) {
                    isdel = true;
                }
                if ((isMeetingSum == 1 && isdel === false) || isMeetingSum == undefined) {
                    delete currentItem.isMeetingSum;
                    that.notiClientAdd({
                        admin_id,
                        notSendToBox,
                        form_data: currentItem,
                    }, result => console.log(result));
                }
                this.remove(dataPhoto);
            }
        }
    }
}

/*****************************************************************************************/

/**
 *  客户端新增邮件
 *  （post到邮局中心）
 */
this.notiClientAdd = (params,cb) => {
    const { admin_id,form_data,notSendToBox } = params;
    const that = this;
    /**区别来自客户热线的消息 start */
    if(!form_data.sender){
        form_data.sender = admin_id;
        form_data.post_time = TIME();
    }
    /**end */
    let subscriberArr = form_data.subscriber.split(',');
    //一个人的事务
    subscriberArr = subscriberArr.filter(items => items);
    if(subscriberArr.length==0) form_data.completed = 1;
    
    /** start 转换@user_name -> user_id */
    let atSomeoneArr;
    try{
        atSomeoneArr = form_data.atSomeone.split(',');
    }catch(e){
        atSomeoneArr = [];
    }
    const staffMap = new base.StaffMap().getStaffMap();
    atSomeoneArr.forEach((items,index) => {
        for(let key in staffMap){
            if(items==staffMap[key]['user_name']){
                atSomeoneArr[index] = key;
            }
        }
    });
    form_data.atSomeone = atSomeoneArr.join();

    // 是否延迟
    if (form_data.isDelay) {
        const delayTimeStamp = Date.parse(form_data.delayTime);
        form_data.notSendToBox = notSendToBox;
        form_data.admin_id = admin_id;
        form_data.isDelay = 0;
        new this.DelayMsg().push(delayTimeStamp, form_data);
        cb({
            code: 200,
            msg: '计划在' + form_data.delayTime + '发送',
            data: [],
        });
        return;
    }
    // 是否会议消息
    if (form_data.isMeetingMsg) {
        form_data.subscriber = form_data.atSomeone;
        subscriberArr = atSomeoneArr;
        // 抄送一份给会议结束
        const f_data = JSON.parse(JSON.stringify(form_data));
        f_data.isMeetingMsg = 0;
        f_data.content = '【会议总结】' + f_data.content;
        f_data.notSendToBox = notSendToBox;
        f_data.admin_id = admin_id;
        f_data.isDelay = 0;
        f_data.isMeetingSum = 1;
        f_data.delayTime = moment(Date.parse(f_data.meetingTime) + 60 * 60 * 1000).format('YYYY-MM-DD HH:mm:ss');
        const delayTimeStamp = Date.parse(f_data.meetingTime) + 60 * 60 * 1000;
        new this.DelayMsg().push(delayTimeStamp, f_data);
    }
    /**end */

    //创建邮件主体
    form_data.post_time = TIME();
    NotiClient.create(form_data).then(result => {
        const noti_client_mailId = result.dataValues.mailId;
        //开始添加定位id
        NotiClient.update({
            locationId: noti_client_mailId
        },{
            where: {
                mailId: noti_client_mailId
            }
        }).then(() => {
            const _p = [];
            //创建邮件回执
            subscriberArr.forEach((items,index) => {
                _p[index] = new Promise((resolve,reject) => {
                    let atMe = 0;
                    if(atSomeoneArr.indexOf(items)==-1){
                        atMe = 0;
                    }else{
                        atMe = 1;
                    }
                    NotiClientSub.create({
                        receiver: items,
                        atMe: atMe,
                        noti_client_mailId: noti_client_mailId
                    }).then(() => {
                        resolve();
                    }).catch(e => LOG(e));
                });
            });
            Promise.all(_p).then(result => {
                that.msgTask({
                    mailId: noti_client_mailId
                });
                that.getTargetMail({
                    mailId: noti_client_mailId
                },result => {
                    cb({
                        code: 200,
                        msg: '发送成功',
                        data: result.data
                    });
                    //判断是否是朗杰员工发的
                    if(form_data.sender.indexOf('oxI')==-1){
                        that.sendWxMsg({
                            affairId: result.data.noti_client_affair_group_uuid
                        });
                    }
                    const syncMail = new SyncMail(admin_id);
                    syncMail.postMail(result.data,notSendToBox);
                    // 发送记录到进度
                    that.addUpdateRecord(result.data);
                });
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
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
 *  获取指定邮件
 */
this.getTargetMail = (params,cb) => {
    const { mailId } = params;
    NotiClient.findOne({
        include: [NotiClientSub],
        where: {
            mailId: mailId
        }
    }).then(result => {
        const trans = new Trans([result]);
        trans.transToView(result => {
            cb({
                code: 200,
                msg: '',
                data: result[0]
            });
        });
    }).catch(e => LOG(e));
}

/**
 *  获取邮件列表
 */
this.notiClientList = (params,cb) => {
    let { admin_id,form_data } = params;
    let page = form_data.page?Number(form_data.page):1;
    let num = form_data.num?Number(form_data.num):10000;
    let keywords = form_data.keywords?form_data.keywords:"";
    let filter = form_data.filter?JSON.parse(form_data.filter):{};
    filter = typeof(filter)=='object'?filter:JSON.parse(filter);
    let { noti_client_affair_group_uuid } = form_data;
    let where = {
        // noti_client_affair_group_uuid: noti_client_affair_group_uuid,
        isdel: 0,
        '$or': {
            content: {
                '$like': '%'+keywords+'%'
            }
        }
    };
    if(filter.resourse) where.file = {'$ne': null};
    if(filter.sender) where.sender = filter.sender;

    //获取子关联的事务id，用于消息的merge
    const getSubRelativeAffair = (uuid,cb) => {
        new serviceAffairs.classAbstractAffair({}).getSubRelativeAffair(uuid,result => {
            const resArr = [];
            result.forEach((items,index) => {
                resArr.push(items.uuid);
            });
            cb(resArr);
        });
    }

    getSubRelativeAffair(noti_client_affair_group_uuid,uuidArr => {
        uuidArr.push(noti_client_affair_group_uuid);
        uuidArr = [...new Set(uuidArr)];

        const _p = [],filteruuidArr = [];
        uuidArr.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const it = items;
                serviceAffairs.getTargetAffair({
                    affairId: items
                },result => {
                    let { secret,team } = result.data.dataValues;
                    team = team.split(',');
                    if(secret==0||(secret==1&&team.indexOf(admin_id)!=-1)){
                        filteruuidArr.push(it);
                    }
                    resolve();
                });
            });
        });
        Promise.all(_p).then(() => {
            where.noti_client_affair_group_uuid = {
                '$in': filteruuidArr
            };
            NotiClient.findAll({
                include: {
                    model: NotiClientSub
                },
                where: where,
                limit: num,
                offset: (page -1) * num,
                order: [['post_time','DESC']]
            }).then(result => {
                const trans = new Trans(result);
                trans.transToView(result => {
                    cb({
                        code: 200,
                        msg: '',
                        data: result
                    });
                });
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });
}

/**
 * 拉取指定事务资源
 */
this.getResourse = (params, cb) => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 300;
    const { noti_client_affair_group_uuid, admin_id } = params;
    const form_data = {
        noti_client_affair_group_uuid,
        filter: JSON.stringify({ resourse: 1 }),
    };
    this.notiClientList({
        admin_id,
        form_data,
    }, result => {
        const fileArr = [];
        result.data.forEach((items, index) => {
            let fileInArr = [], fileNameInArr = [];
            try {
                fileInArr = items.file.split(',');
                fileNameInArr = items.fileName.split(',');
            } catch (e) {
                fileInArr = [];
                fileNameInArr = [];
            }
            fileInArr.forEach((it,ind) => {
                const obj = JSON.parse(JSON.stringify(items.dataValues));
                obj.file = fileInArr[ind];
                obj.fileName = fileNameInArr[ind];
                fileArr.push(obj);
            });
        });
        const endArr = fileArr.splice((page - 1) * pageSize, pageSize);
        const _p = [];
        endArr.forEach((items, index) => {
            _p[index] = new Promise((resolve, reject) => {
                const i = index;
                const name = items.file.slice(0, items.file.lastIndexOf('.'));
                DocLib.findOne({
                    where: {
                        originalName: name,
                        isdel: 0,
                    }
                }).then(result => {
                    if (result) {
                        endArr[i].isExport = 1;
                    } else {
                        endArr[i].isExport = 0;
                    }
                    resolve();
                }).catch(e => reject(e));
            });
        });
        Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: endArr,
            });
        }).catch(e => LOG(e));
    });
}

/**
 *  撤回
 */
this.notiClientRecall = (params,cb) => {
    const { mailId } = params;
    NotiClient.update({
        isdel: 1
    },{
        where: {
            mailId: mailId
        }
    }).then(result => {
        NotiClientSub.update({
            isdel: 1
        },{
            where: {
                noti_client_mailId: mailId
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '撤回成功',
                data: []
            });
            const syncMail = new SyncMail();
            syncMail.recall(mailId);
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  邮件主体更新（幂等）
 *  可能用于修改priority字段
 *  （put到邮局中心）暂时没用到
 */
this.notiClientUpdate = (params,cb) => {
    const { form_data,admin_id } = params;
    const that = this;
    const { mailId } = form_data;
    NotiClient.update(form_data,{
        where: {
            mailId: mailId
        }
    }).then(updateRes => {
        that.getTargetMail({
            mailId: mailId
        },result => {
            if(updateRes[0]){
                cb({
                    code: 200,
                    msg: '更新成功',
                    data: result
                });
            }else{
                cb({
                    code: -1,
                    msg: '更新失败',
                    data: result
                });
            }
        });
    }).catch(e => LOG(e));
}

/**
 *  邮件回执更新（幂等）
 *  （put到邮局中心）
 *  判断是否是立项事务已完成90%
 */
this.notiClientSubUpdate = async (params,cb) => {
    let { form_data,admin_id } = params;
    const that = this;
    //检查是否回复完全,如果只有一个votes，自动处理
    const checkReplied = (params,cb) => {
        const { noti_client_mailId,id } = params;
        NotiClient.findOne({
            include: [NotiClientSub],
            where: {
                mailId: noti_client_mailId
            }
        }).then(result => {
            const { votes,NotiClientSubs } = result.dataValues;
            let voteArr;
            try{
                voteArr = votes.split(',');
            }catch(e){
                voteArr = [];
            }
            let form_data = {replied: 0};
            NotiClientSubs.forEach((items,index) => {
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
            NotiClientSub.update(form_data,{
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
            const r = await NotiClient.findOne({ where: { mailId: noti_client_mailId }});
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
    NotiClientSub.update(needUpdate,{
        where: {
            id: id
        }
    }).then(updateRes => {
        checkReplied({
            noti_client_mailId: noti_client_mailId,
            id: id
        },() => {
            that.getTargetMail({
                mailId: noti_client_mailId
            },result => {
                if(updateRes[0]){
                    cb({
                        code: 200,
                        msg: '更新成功',
                        data: result
                    });
                }else{
                    cb({
                        code: -1,
                        msg: '更新失败',
                        data: result
                    });
                }
                if(atReply&&atReply.trim()){
                    that.sendWxMsg({
                        affairId: result.data.dataValues.noti_client_affair_group_uuid
                    });
                }
                that.checkComplete({
                    mailId: noti_client_mailId
                },() => {
                    //往消息盒子投递
                    let content = form_data.vote?form_data.vote:form_data.atReply;
                    // new base.SendToMsgBox({
                    //     mailId: result.data.mailId,
                    //     affairId: result.data.noti_client_affair_group_uuid,
                    //     frontUrl: result.data.frontUrl,
                    //     sender: admin_id,
                    //     post_time: TIME(),
                    //     title: result.data.title,
                    //     content: content,
                    //     action: '回复',
                    //     originMsg: result.data.content
                    // }).send();
                    const syncMail = new SyncMail();
                    syncMail.patchToNotiPost(result.data);
                    that.checkIsnotResponAffair({
                        mailId: form_data.noti_client_mailId,
                        // notiClass: form_data.notiClass
                    });
                });
            });
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
 *  来自notiPost的更新
 *  判断是否是立项事务已完成90%
 */
this.fromNotiPostUpdate = (params,cb) => {
    const { form_data } = params;
    const that = this;
    const sub_form_data_arr = form_data.NotiPostSubs;
    delete form_data.NotiPostSubs;
    const { mailId,noti_client_affair_group_uuid } = form_data;
    //判断atReply是否有变化
    const p = new Promise((resolve,reject) => {
        NotiClientSub.findAll({
            where: {
                noti_client_mailId: mailId
            }
        }).then(result => {
            let atReplyChanged = false;
            result.forEach((items,index) => {
                sub_form_data_arr.forEach((it,ind) => {
                    if(items.dataValues.receiver==it.receiver){
                        if(it.atReply&&it.atReply.trim()&&it.atReply!=items.dataValues.atReply){
                            LOG(it.atReply);
                            atReplyChanged = true;
                        }
                    }
                });
            });
            if(atReplyChanged) {
                that.sendWxMsg({
                    affairId: noti_client_affair_group_uuid
                });
            }
            resolve();
        }).catch(e => LOG(e));
    });
    p.then(() => {
        NotiClient.update(form_data,{
            where: {
                mailId: mailId
            }
        }).then(() => {
            const _p = [];
            sub_form_data_arr.forEach((items,index) => {
                _p[index] = new Promise((resolve,reject) => {
                    const { receiver } = items;
                    delete items.id;
                    NotiClientSub.update(items,{
                        where: {
                            noti_client_mailId: mailId,
                            receiver: receiver,
                            replied: 0
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
                that.checkComplete({
                    mailId: mailId
                },() => {
                    that.checkIsnotResponAffair({
                        mailId: mailId
                    });
                });
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    });
}

/**
 *  判断是否是立项事务已完成90%(function)
 */
this.checkIsnotResponAffair = (params) => {
    const { mailId } = params;
    NotiClient.findOne({
        include: [NotiClientSub],
        where: {
            mailId: mailId
        }
    }).then(result => {
        if(result.dataValues.class=='completeConfirm'){
            if(result.dataValues.completed==1){
                //判断是否同意
                if(result.dataValues.NotiClientSubs[0].dataValues.vote=='同意'){
                    //把项目进度改成100%
                    //项目事务
                    serviceAffairs.projectAffairUpdateByServer({
                        noti_client_affair_group_uuid: result.dataValues.noti_client_affair_group_uuid,
                        completionDegree: 100
                    },result => console.log(result));
                    //小事务
                    serviceAffairs.smallAffairUpdateByServer({
                        noti_client_affair_group_uuid: result.dataValues.noti_client_affair_group_uuid,
                        completionDegree: 100
                    },result => console.log(result));
                    serviceAffairs.affairComplete({
                        uuid: result.dataValues.noti_client_affair_group_uuid,
                    }, () => {});
                }
            }
        }
    }).catch(e => LOG(e));
}

/**
 *  检查是否完成
 */
this.checkComplete = (params,cb) => {
    const { mailId } = params;
    this.getTargetMail(params,result => {
        if(!result.data) return;
        let form_data = result.data.dataValues;
        const notiClientSubArr = form_data.NotiClientSubs;
        let oldCompleted = form_data.completed;
        let completed = 1;
        notiClientSubArr.forEach((items,index) => {
            if(items.dataValues.replied==0){
                completed = 0;
            }
        });
        NotiClient.update({
            completed: completed
        },{
            where: {
                mailId: mailId
            }
        }).then(result => {
            cb(result);
            if(oldCompleted==0&&completed==1){
                new PostHasCompleted(form_data).send();
            }
        }).catch(e => LOG(e));
    });
}

/**
 *  添加回复
 */
this.addReply = (params,cb) => {
    const { admin_id,form_data } = params;
    const that = this;
    form_data.receiver = admin_id;
    form_data.replied = 1;
    form_data.replyTime = TIME();
    form_data.atMe = 1;
    NotiClientSub.create(form_data).then(result => {
        cb({
            code: 200,
            msg: '添加回复成功',
            data: []
        });
        //给该邮件的发送者和被@过的人和追加过的人发一遍通知
        const { noti_client_mailId } = form_data;
        NotiClientSub.findAll({
            where: {
                noti_client_mailId: noti_client_mailId,
                isdel: 0,
                atMe: 1
            }
        }).then(result => {
            let nameList = result.map(items => 
                items.dataValues.receiver
            );
            NotiClient.findOne({
                where: {
                    mailId: noti_client_mailId
                }
            }).then(result => {
                that.sendWxMsg({
                    affairId: result.dataValues.noti_client_affair_group_uuid
                });

                nameList.push(result.dataValues.sender);
                nameList = [...new Set(nameList)];
                nameList.forEach((items,index) => {
                    if(items==admin_id) nameList.splice(index,1);
                });
                if(nameList.length==0) return;
                let mailId = Date.now();
                const NotiClientSubs = nameList.map(items => {
                    return {
                        receiver: items,
                        noti_post_mailId: mailId
                    };
                });
                const data = {
                    mailId: mailId,
                    class: result.dataValues.class,
                    priority: result.dataValues.priority,
                    frontUrl: result.dataValues.frontUrl,
                    sender: admin_id,
                    post_time: TIME(),
                    title:  result.dataValues.title,
                    content: '追加回复：'+form_data.atReply+'（原消息：'+result.dataValues.content+'）',
                    subscriber: nameList.join(),
                    noti_client_affair_group_uuid: result.dataValues.noti_client_affair_group_uuid,
                    votes: '已阅',
                    locationId: result.dataValues.locationId,
                    NotiClientSubs: NotiClientSubs
                };
                request.post(ROUTE('notiPost/add?regName=justReadForAttention'),(err,response,body) => {
                    console.log(body);
                }).form({
                    data: JSON.stringify(data)
                });
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }).catch(e => {
        LOG(e);
        cb({
            code: -1,
            msg: '添加回复失败',
            data: []
        });
    });
}

/**
 *  获取消息盒子内容
 */
this.msgBoxList = (params,cb) => {
    let page = params.page?Number(params.page):1;
    let num = params.num?Number(params.num):50;
    MsgBox.findAll({
        where: {
            action: '发布'
        },
        limit: num,
        offset: (page - 1) * num,
        order: [['post_time','DESC']]
    }).then(result => {
        const staffMap = new base.StaffMap().getStaffMap();
        const _p = [];
        result.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const it = items;
                try{
                    items.dataValues.senderName = staffMap[items.dataValues.sender].user_name;
                    resolve();
                }catch(e){
                    serviceHomeMember.getInfoByOpenId({
                        open_id: items.dataValues.sender
                    },result => {
                        let senderName = result.dataValues.name;
                        let company = result.dataValues.company ? result.dataValues.company : '个人会员';
                        serviceHomeCustomers.getTargetItem({
                            targetKey: result.dataValues.company
                        },result => {
                            if(result.data&&result.data.dataValues&&result.data.dataValues.company){
                                senderName = senderName+'（'+result.data.dataValues.cn_abb+'）';
                            }else{
                                senderName = senderName+'（'+company+'）';
                            }
                            it.dataValues.senderName = senderName;
                            resolve();
                        });
                        // items.dataValues.senderName = result.dataValues.name+'（'+result.dataValues.company+'）';
                        // resolve();
                    });
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
 *  将指定消息的mailId放入环形队列
 *  事务的消息会放入环形队列
 *  联系人认证
 */
this.msgTask = (params) => {
    const { mailId } = params;
    const taskQueue = new redisClient.classTaskQueue();
    taskQueue.getIndex(index => {
        taskQueue.getQueue(queue => {
            if(index==0){
                index = Number(queue.length-1);
            }else{
                index--;
            }
            queue[index].push(mailId);
            taskQueue.setQueue(queue,() => {});
        });
    });
}

/**
 *  收到超时任务
 */
this.msgOverTimeTask = (params,cb) => {
    let { mailIdArr } = params;
    const _p = [];
    try{
        mailIdArr.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const it = items;
                let ModelType,ModelSubType;
                if(!/^\d+$/.test(it)){
                    ModelType = NotiClient;
                    ModelSubType = NotiClientSub;
                }else{
                    ModelType = NotiPost;
                    ModelSubType = NotiPostSub;
                }

                ModelType.findOne({
                    include: [ModelSubType],
                    where: {
                        mailId: it
                    }
                }).then(result => {
                    const { sender,frontUrl,title,content,noti_client_affair_group_uuid,isdel,locationId } = result.dataValues;
                    let ModelSubTypes = result.dataValues.NotiClientSubs?result.dataValues.NotiClientSubs:result.dataValues.NotiPostSubs;
                    if(isdel==0){
                        const staffMap = new base.StaffMap().getStaffMap();
                        let notRepliedArr = [];
                        // ModelSubTypes.forEach((items,index)=> {
                        //     if(items.dataValues.replied==0){
                        //         try{
                        //             notRepliedArr.push(staffMap[items.dataValues.receiver].user_name);
                        //             // 处理未读，未答复
                        //             if(items.dataValues.atMe&&!items.dataValues.atReply){
                        //                 // 未答复++
                        //                 homeAttendanceService.notReplyAdd({
                        //                     user_id: items.dataValues.receiver,
                        //                     date: DATETIME()
                        //                 },() => {});
                        //             }
                        //             if(!items.dataValues.atMe){
                        //                 // 未读++
                        //                 homeAttendanceService.notReadAdd({
                        //                     user_id: items.dataValues.receiver,
                        //                     date: DATETIME()
                        //                 },() => {});
                        //             }
                        //         }catch(e){
    
                        //         }
                        //     }
                        // });
                        let notRepliedStr = notRepliedArr.join();

                        let mailId = Date.now();
                        let form_data = {
                            mailId: mailId,
                            class: 'system',
                            priority: '普通',
                            frontUrl: frontUrl,
                            sender: 'system',
                            post_time: TIME(),
                            title: title,
                            content: '回复未完成（'+notRepliedStr+'）'+content,
                            votes: '已阅',
                            subscriber: sender,
                            noti_client_affair_group_uuid: noti_client_affair_group_uuid,
                            locationId: locationId,
                            NotiClientSubs: [
                                {
                                    receiver: sender,
                                    noti_post_mailId: mailId
                                }
                            ]
                        };
                        if(/^\d+$/.test(it)&&result.dataValues.NotiPostSubs[0].dataValues.replied==0){
                            //超时未处理
                            serviceNotiPost.recallApply({           //撤回请求消息
                                aesStr: result.dataValues.aesStr
                            },() => {});
                            result.dataValues.NotiPostSubs[0].dataValues.vote = '未处理';
                            serviceNotiPost.sendBackMsgToScuscribe(result.dataValues);
                            resolve();
                            return;
                        }
                        // if(result.dataValues.completed==0){
                        //     request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
                        //         console.log(body);
                        //     }).form({
                        //         data: JSON.stringify(form_data)
                        //     });
                        //     resolve();
                        // }else{
                            resolve();
                        // }
                    }else{
                        resolve();
                    }
                }).catch(e => LOG(e));
            });
        });
    }catch(e){

    }
    
    Promise.all(_p).then(() => {}).catch(e => LOG(e));
}

/**
 *  给指定微信用户发服务号消息
 */
this.sendWxMsg = (params) => {

    const send = (items) => {
        console.log(items);
        if(CONFIG.debug) return;
        // return;
        service.sendMsgToWxServer({
            form_data: JSON.stringify({
                "touser": items,
                "msgtype": "text",
                "text": {
                    "content": "收到一条新消息，请及时进入我的客服查看。"
                }
            })
        },result => {
            console.log(result);
            LOG(result.errcode);
            // if(result.errcode!=0) LOG(result);
        });
    }

    const { affairId } = params;
    Affair.findOne({
        where: {
            uuid: affairId,
            customerId: {
                '$ne': null
            }
        }
    }).then(result => {
        if(result){
            const { outerContact } = result.dataValues;
            let outerContactArr;
            try{
                outerContactArr = outerContact.split(',');
            }catch(e){
                outerContactArr = [];
            }
            outerContactArr.forEach((items) => {
                const it = items;
                serviceHomeMember.orderParamsList({
                    open_id: items
                },result => {
                    if(result.data.length!=0&&result.data[0].dataValues.isSub){
                        send(it);
                    }
                });
            });
        }
    }).catch(e => LOG(e));
}

/**
 *  新增更新记录（非例行事务，考核用）
 */
this.addUpdateRecord = (params) => {
    const _class = params.dataValues.class;
    const { noti_client_affair_group_uuid, content, sender } = params.dataValues;
    if(_class=='projectAndSmallAffair'){
        ProgressUpdateRecord.create({
            progressId: noti_client_affair_group_uuid,
            userId: sender,
            updateContent: content,
            updateTime: TIME()
        }).then(() => {}).catch(e => LOG(e));
    }
}

this.fetchDeadLine = (params, cb) => {
    async function checkIsWorkday(date) {
        return await CompanyCalendar.findOne({ where: { date, isworkingday: 1 }});
    }

    async function getValidDate(date) {
        const newDate = DATETIME(Date.parse(date) + 60 * 60 * 1000 * 24);
        const result = await checkIsWorkday(newDate);
        if (!result) return getValidDate(newDate);
        return newDate;
    }

    const { admin_id } = params;
    const affairIdArr = JSON.parse(params.affairIdArr);
    const _p = [];
    affairIdArr.forEach((items, index) => {
        _p[index] = new Promise((resolve, reject) => {
            const i = index;
            const affairId = items;
            getSpeakTime({
                user_id: admin_id,
                affairId,
            }, async date => {
                // 判断这一天是否为工作日
                if (await checkIsWorkday(date)) {
                    affairIdArr[i] = {
                        affairId,
                        date,
                    };
                } else {
                    const newDate = await getValidDate(date);
                    affairIdArr[i] = {
                        affairId,
                        date: newDate,
                    };
                }
                resolve();
            });
        });
    });
    Promise.all(_p).then(() => {
        const _p = [];
        affairIdArr.forEach((items, index) => {
            _p[index] = new Promise((resolve, reject) => {
                const i = index;
                getHasLogTime({
                    affairId: items.affairId,
                    user_id: admin_id,
                }, result => {
                    if (result) {
                        affairIdArr[i].date = Date.parse(affairIdArr[i].date) > Date.parse(result) ? affairIdArr[i].date : result;
                    }
                    resolve();
                });
            });
        });
        return Promise.all(_p).then(() => {
            const _p = [];
            affairIdArr.forEach((items, index) => {
                _p[index] = new Promise((resolve, reject) => {
                    const i = index;
                    // 往后推5个工作日
                    CompanyCalendar.findAll({
                        where: {
                            date: {
                                $gt: items.date,
                            },
                        },
                        order: [['date']],
                        limit: 30,
                        offset: 0,
                    }).then(result => {
                        let count = 0;
                        result.forEach((_it, _ind) => {
                            if (_it.dataValues.isworkingday) count++;
                            if (count === CONFIG.affairMaxUpdateTime && _it.dataValues.isworkingday) {
                                affairIdArr[i].arrivalDate = _it.dataValues.date;
                            }
                        });
                        resolve();
                    }).catch(e => { throw e });
                });
            });
            return Promise.all(_p).then(() => {
                affairIdArr.forEach((items, index) => {
                    if (!items.arrivalDate) {
                        affairIdArr[index].arrivalDate = '暂无';
                    }
                });
                cb({
                    code: 200,
                    msg: '查询成功',
                    data: affairIdArr,
                });
            }).catch(e => { throw e });
        }).catch(e => { throw e});
    }).catch(e => LOG(e));

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

/**
 * 通知业务员指定公司信用余额不足
 */
exports.notiSaleman = async params => {
    const { admin_id, company } = params;
    // 找对应公司的业务员
    const customerEntity = await Customers.findOne({
        where: {
            company,
            isdel: 0,
        },
    });
    if (!customerEntity) {
        return { code: -1, msg: '不存在该公司' };
    }
    const { manager } = customerEntity.dataValues;
    const staffMap = new base.StaffMap().getStaffMap();
    let user_id;
    for (const key in staffMap) {
        if (staffMap[key].user_name === manager) {
            user_id = key;
        }
    }
    if (!user_id) {
        return { code: -1, msg: '不存在该公司的业务员' };
    }
    const mailId = Date.now();
    request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
        console.log(body);
    }).form({
        data: JSON.stringify({
            mailId: mailId,
            class: 'creditView',
            priority: '普通',
            frontUrl: '/creditView',
            sender: admin_id,
            post_time: TIME(),
            title: '信用总览',
            content: company + '信用余额不足',
            votes: '已阅',
            subscriber: user_id,
            NotiClientSubs: [{
                receiver: user_id,
                noti_post_mailId: mailId
            }],
        })
    });
    return {
        code: 200,
        msg: '已发送给' + manager,
    };
}

/**
 * 转移消息到指定事务
 */
exports.transferMsg = async params => {
    const { targetAffairId, currentAffairId } = params;
    await NotiClient.update({ noti_client_affair_group_uuid: targetAffairId }, { where: { noti_client_affair_group_uuid: currentAffairId } });
    await NotiPost.update({ noti_client_affair_group_uuid: targetAffairId }, { where: { noti_client_affair_group_uuid: currentAffairId } });
    await MsgBox.update({ affairId: targetAffairId }, { where: { affairId: currentAffairId } });
    return { code: 200, msg: '转移成功' };
}