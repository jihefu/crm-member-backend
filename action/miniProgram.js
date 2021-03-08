const url = require('url');
const path = require('path');
const serviceMiniProgram = require('../service/miniProgram');
const base = require('../service/base');

/**
 * 根据code获取openId
 */
this.getOpenIdByCode = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceMiniProgram.getOpenIdByCode(params,result => {
        res.send(result);
    });
}

/**
 * 检查头信息合法
 */
this.checkHeader = (req,res,next) => {
    // req.headers['openid'] = 123321;
    const openId = req.headers['openid'];
    if(openId){
        serviceMiniProgram.checkUserByOpenId({
            openId
        },result => {
            if(result.code==200){
                next();
            }else{
                res.status(401);
                res.send({
                    code: 401,
                    msg: '非法用户',
                    data: []
                });
            }
        });
    }else{
        res.status(401);
		res.send({
			code: 401,
			msg: '身份过期',
			data: []
		});
    }
}

/**
 * 根据openId判断访问者身份
 */
this.checkUserByOpenId = (req,res,next) => {
    const openId = req.headers['openid'];
    serviceMiniProgram.checkUserByOpenId({
        openId
    },result => {
        res.send(result);
    });
}

/**
 * 根据姓名判断访问者身份
 */
this.checkUserByName = (req,res,next) => {
    const params = req.body;
    params.openId = req.headers['openid'];
    serviceMiniProgram.checkUserByName(params,result => {
        res.send(result);
    });
}

/**
 * 提交申诉
 */
this.applyAppeal = (req,res,next) => {
    const params = req.body;
    serviceMiniProgram.applyAppeal(params,result => {
        res.send(result);
    });
}

/**
 * 获取同学列表
 */
this.getUserList = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    params.openId = req.headers['openid'];
    serviceMiniProgram.getUserList(params,result => {
        res.send(result);
    });
}

/**
 * 根据userId获取个人基本信息
 */
this.getUserInfoByUserId = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    const { userId } = params;
    serviceMiniProgram.getUserInfoByUserId({
        userId
    },result => {
        res.send(result);
    });
}

/**
 * 根据openId获取个人基本信息
 */
this.getUserInfoByOpenId = (req,res,next) => {
    let openId = req.headers['openid'];
    serviceMiniProgram.getUserInfoByOpenId({
        openId
    },result => {
        res.send(result);
    });
}

/**
 * 根据openId更新个人基本信息
 */
this.updateUserInfoByOpenId = (req,res,next) => {
    const params = req.body;
    params.openId = req.headers['openid'];
    serviceMiniProgram.updateUserInfoByOpenId(params,result => {
        res.send(result);
    });
}

/**
 * 查看共有多少人报名，当前排在第几位
 */
this.signPersonNum = (req,res,next) => {
    const openId = req.headers['openid'];
    serviceMiniProgram.signPersonNum({
        openId
    },result => {
        res.send(result);
    });
}

/**
 * 获取组委会成员
 */
this.getOrganizerList = (req,res,next) => {
    serviceMiniProgram.getOrganizerList({
        openId: req.headers['openid']
    },result => {
        res.send(result);
    });
}

/**
 * 是否是组委会成员
 */
this.checkIsOrganizer = (req,res,next) => {
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        res.send(result);
    });
}

/**
 * 添加组委会成员
 */
this.addOrganizer = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.addOrganizer(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 移除组委会成员
 */
this.removeOrganizer = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.removeOrganizer(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 更新组委会分工信息
 */
this.updateOrganizerJob = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.updateOrganizerJob(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 会议基本信息
 */
this.getMeetingInfo = (req,res,next) => {
    serviceMiniProgram.getMeetingInfo({},result => {
        res.send(result);
    });
}

/**
 * 修改会议基本信息
 */
this.updateMeetingInfo = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.updateMeetingInfo(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 会议日程安排
 */
this.meetingScheduleList = (req,res,next) => {
    serviceMiniProgram.meetingScheduleList({},result => {
        res.send(result);
    });
}

/**
 * 新增日程安排
 */
this.addMeetingSchedule = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.addMeetingSchedule(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 修改日程安排
 */
this.updateMeetingSchedule = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.updateMeetingSchedule(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 删除日程安排
 */
this.delMeetingSchedule = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.delMeetingSchedule(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 获取会议新闻
 */
this.meetingNewsList = (req,res,next) => {
    serviceMiniProgram.meetingNewsList({},result => {
        res.send(result);
    });
}

/**
 * 发布会议新闻
 */
this.addMeetingNews = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    params.openId = openId;
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.addMeetingNews(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 上传会议新闻的图片
 */
this.uploadImgForMeetingNews = (req,res,next) => {
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            const mulUploadImg = new base.MulUploadImg('/public/img/mp');
            mulUploadImg.upload(req,(name,fields) => {
                res.send({
                    code: 200,
                    msg: '上传成功',
                    data: ['/img/mp/'+name]
                });
                mulUploadImg.resize();
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 编辑会议新闻
 */
this.editMeetingNews = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    params.openId = openId;
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.editMeetingNews(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 删除会议新闻
 */
this.delMeetingNews = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.delMeetingNews(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 置顶会议新闻
 */
this.topMeetingNews = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            serviceMiniProgram.topMeetingNews(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/************************************* 参会部分 *********************************************/

/**
 * 根据userId获取报名信息
 */
this.getSignInfoByUserId = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceMiniProgram.getSignInfoByUserId(params,result => {
        res.send(result);
    });
}

/**
 * 根据openId获取报名信息
 */
this.getSignInfoByOpenId = (req,res,next) => {
    const openId = req.headers['openid'];
    serviceMiniProgram.getSignInfoByOpenId({
        openId
    },result => {
        res.send(result);
    });
}

/**
 * 报名参加会议
 */
this.meetingSignIn = (req,res,next) => {
    const openId = req.headers['openid'];
    serviceMiniProgram.meetingSignIn({
        openId
    },result => {
        res.send(result);
    });
}

/**
 * 取消报名
 */
this.meetingSignOut = (req,res,next) => {
    const openId = req.headers['openid'];
    serviceMiniProgram.meetingSignOut({
        openId
    },result => {
        res.send(result);
    });
}

/**
 * 未缴费 -> 汇款已递交
 */
this.paySub = (req,res,next) => {
    const params = req.body;
    params.openId = req.headers['openid'];
    serviceMiniProgram.paySub(params,result => {
        res.send(result);
    });
}

/**
 * 汇款已递交 -> 确认缴费
 */
this.payEffective = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            params.openId = openId;
            serviceMiniProgram.payEffective(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 汇款已递交 -> 未缴费
 */
this.payInvalid = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            params.openId = openId;
            serviceMiniProgram.payInvalid(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 未缴费 -> 确认缴费
 */
this.originzerPayEffective = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            params.openId = openId;
            serviceMiniProgram.originzerPayEffective(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 更新参会信息（开放式）
 */
this.updateSignInfo = (req,res,next) => {
    const params = req.body;
    params.openId = req.headers['openid'];
    serviceMiniProgram.updateSignInfo(params,result => {
        res.send(result);
    });
}

/**
 * 组委会录入房间号和接站联系电话
 */
this.updateSignInfoByOrganizer = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    serviceMiniProgram.checkIsOrganizer({
        openId
    },result => {
        if(result.code==200){
            params.openId = openId;
            serviceMiniProgram.updateSignInfoByOrganizer(params,result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 查看@我的消息（基本上是组委会用）
 */
this.getAtSelfMessage = (req,res,next) => {
    const openId = req.headers['openid'];
    const params = url.parse(req.url,true).query;
    params.openId = openId;
    serviceMiniProgram.getAtSelfMessage(params,result => {
        res.send(result);
    });
}

/**
 * 查看我发布的消息
 */
this.getMyMsg = (req,res,next) => {
    const openId = req.headers['openid'];
    const params = url.parse(req.url,true).query;
    params.openId = openId;
    serviceMiniProgram.getMyMsg(params,result => {
        res.send(result);
    });
}

/**
 * 回复消息
 */
this.replyMsg = (req,res,next) => {
    const params = req.body;
    params.openId = req.headers['openid'];
    serviceMiniProgram.replyMsg(params,result => {
        res.send(result);
    });
}

/**
 * 添加回复消息
 */
this.addReplyMsg = (req,res,next) => {
    const params = req.body;
    params.openId = req.headers['openid'];
    serviceMiniProgram.addReplyMsg(params,result => {
        res.send(result);
    });
}

/**
 * 发布消息
 */
this.addMsg = (req,res,next) => {
    const params = req.body;
    params.openId = req.headers['openid'];
    serviceMiniProgram.addMsg(params,result => {
        res.send(result);
    });
}

/**
 * 获取签到信息列表
 */
this.getSignInfoList = (req,res,next) => {
    serviceMiniProgram.getSignInfoList({
        openId: req.headers['openid']
    },result => {
        res.send(result);
    });
}
/***************************当天签到*********************** */

/**
 * 当天签到
 */
this.meetingCheck = function(req,res,next){
    serviceMiniProgram.meetingCheck({
        openId:req.headers['openid']
    },result => {
        res.send(result)
    })
}
/**
 * 根据openid获取个人签到信息
 */
this.getCheckInfoByOpenId = function(req,res,next){
    const openId = req.headers['openid']
    serviceMiniProgram.getCheckInfoByOpenId({
        openId:openId
    },result => {
        res.send(result)
    })
}

/**
 * 获取签到列表
 */
this.getCheckList = function(req,res,next){
    const params = url.parse(req.url,true).query
    params.openId = req.headers['openid']
    serviceMiniProgram.getCheckList(params,result => {
        res.send(result)
    })
}

/**
 * 相册
 */
this.getAllImagesInfo = function(req,res,next){
    var params = url.parse(req.url,true).query
    var openId = req.headers['openid']
    serviceMiniProgram.getAllImagesInfo(params,result => {
        res.send(result)
    })
}

/**
 *获取我上传的图片 
 */
this.getMineImagesInfo = function(req,res,next){
    const params = url.parse(req.url,true).query
    params.openId = req.headers['openid']
    serviceMiniProgram.getMineImagesInfo(params,result => {
        res.send(result)
    })
}

/**
 * 新建图片信息
 */
this.addImagesInfo = function(req,res,next){
    const params = req.body
    params.openId = req.headers['openid']
    serviceMiniProgram.addImagesInfo(params,result => {
        res.send(result)
    })
}

/**
 * 更新图片信息
 */
this.updateImagesInfo = function(req,res,next){
    const params = req.body
    params.openId = req.headers['openid']
    serviceMiniProgram.updateImagesInfo(params,result => {
        res.send(result)
    })
}

/**
 * 删除图片
 */
this.deleteImagesInfo = function(req,res,next){
    const params = req.body
    params.openId = req.headers['openid']
    serviceMiniProgram.deleteImagesInfo(params,result => {
        res.send(result)
    })
}

/**
 *照片点赞 
 */
this.giveLikeToImages = function(req,res,next){
    const params = req.body
    params.openId = req.headers['openid']
    serviceMiniProgram.giveLikeToImages(params,result => {
        res.send(result)
    })
}

/**
 * 弹幕（评论）
 */
this.discussToImages = function(req,res,next){
    const params = req.body
    params.openId = req.headers['openid']
    serviceMiniProgram.discussToImages(params,result => {
        res.send(result)
    })
}


/**
 * 获取图片评论信息(点赞数)
 */
this.getImagesDiscussInfo = function(req,res,next){
    const params = url.parse(req.url,true).query
    serviceMiniProgram.getImagesDiscussInfo(params,result =>{
        res.send(result)
    })
}

/**
 * 获取点赞数量最多的图片
 */
this.getMostLikeImages = function(req,res,next){
    const params = {}
    params.openId = req.headers['openid']
    serviceMiniProgram.getMostLikeImages(params,result =>{
        res.send(result)
    })
}

/**
 * 点赞评论通知中心
 */
this.getDiscussAndLikeNotice = function(req,res,next){
    const params = {}
    params.openId = req.headers['openid']
    serviceMiniProgram.getDiscussAndLikeNotice(params,result => {
        res.send(result)
    })
}