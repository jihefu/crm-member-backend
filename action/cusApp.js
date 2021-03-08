var url = require('url');
var path = require('path');
var serviceCusApp = require('../service/cusApp');
const base = require('../service/base');

/**
 *	登陆
 */
this.login = (req,res,next) => {
    let params = url.parse(req.url,true).query;
    serviceCusApp.login(params,result => {
        res.send(result);
    });
}

/**
 * 验证userId,openId头信息
 */
this.checkSessionExist = (req,res,next) => {
    const openId = req.headers['openid'];
    const userId = req.headers['userid'];
	if(!openId||!userId){
		res.status(401);
		res.send({
			code: 401,
			msg: '身份过期',
			data: []
		});
		return;
	}
	next();
}

/**
 * 指定openId，指定时间的签到状态
 */
this.getStatus = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    const openId = params.openId ? params.openId : req.headers['openid'];
    serviceCusApp.getStatus({
        openId
    },result => {
        res.send(result);
    });
}

/**
 * 签到
 */
this.signIn = (req,res,next) => {
    serviceCusApp.signIn({
        openId: req.headers['openid'],
        userId: req.headers['userid']
    },result => {
        res.send(result);
    });
}

/**
 * 补签到gps
 */
this.addSignInLocation = (req,res,next) => {
    const params = req.body;
    serviceCusApp.addSignInLocation(params,result => {
        res.send(result);
    });
}

/**
 * 签退
 */
this.signOut = (req,res,next) => {
    serviceCusApp.signOut({
        openId: req.headers['openid'],
        userId: req.headers['userId']
    },result => {
        res.send(result);
    });
}

/**
 * 补签退gps
 */
this.addSignOutLocation = (req,res,next) => {
    const params = req.body;
    serviceCusApp.addSignOutLocation(params,result => {
        res.send(result);
    });
}

/**
 * 指定userId下的所有员工签到状况
 */
this.getSignInfoByUserId = (req,res,next) => {
    serviceCusApp.getSignInfoByUserId({
        userId: req.headers['userid']
    },result => {
        res.send(result);
    });
}

/**
 * 聊天列表
 */
this.chatList = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceCusApp.chatList({
        sender: req.headers['openid'],
        receiver: params.receiver,
        page: params.page,
        pageSize: params.pageSize,
        keywords: params.keywords
    },result => {
        res.send(result);
    });
}

/**
 * 未读消息
 */
this.chatListNotRead = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceCusApp.chatListNotRead(params,result => {
        res.send(result);
    });
}

/**
 * 发送消息
 */
this.sendMsg = (req,res,next) => {
    const params = req.body;
    const sender = req.headers['openid'];
    const userId = req.headers['userid'];
    params.sender = sender;
    params.userId = userId;
    serviceCusApp.sendMsg(params,result => {
        res.send(result);
    });
}

/**
 * 撤回消息
 */
this.recallMsg = (req,res,next) => {
    const params = req.body;
    const sender = req.headers['openid'];
    params.sender = sender;
    serviceCusApp.recallMsg(params,result => {
        res.send(result);
    });
}

/**
 * 已阅
 */
this.doRead = (req,res,next) => {
    const params = req.body;
    const openId = req.headers['openid'];
    params.openId = openId;
    serviceCusApp.doRead(params,result => {
        res.send(result);
    });
}

/**
 * 上传图片
 */
this.uploadImg = (req,res,next) => {
    const openId = req.headers['openid'];
    let mulUploadImg = new base.MulUploadImg('/public/img/cusApp/'+openId);
	mulUploadImg.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
        });
        mulUploadImg.resize();
	});
}

/**
 * 上传文件
 */
this.uploadFile = (req,res,next) => {
    const openId = req.headers['openid'];
    let fileUpload = new base.FileUpload('/downloads/cusApp/'+openId);
	fileUpload.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
        });
	});
}

/**
 * 请求位置信息
 */
this.requestLocation = (req,res,next) => {
    const sender = req.headers['openid'];
    const userId = req.headers['userid'];
    serviceCusApp.requestLocation({
        sender,
        userId
    },result => {
        res.send(result);
    });
}

/**
 * 返回位置信息
 */
this.responseLocation = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceCusApp.responseLocation(params,result => {
        res.send(result);
    });
}

/**
 * 不请求新的位置信息，只返回数据库已有的数据
 */
this.refreshMemberInfo = (req,res,next) => {
    const sender = req.headers['openid'];
    const userId = req.headers['userid'];
    serviceCusApp.refreshMemberInfo({
        sender,
        userId
    },result => {
        res.send(result);
    });
}