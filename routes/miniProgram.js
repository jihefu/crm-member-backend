const actionMiniProgram = require('../action/miniProgram');

module.exports = function(app){
	app.options('/mp/*', function(req,res,next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Expose-Headers', 'openId,Content-Type');
		res.header("Access-Control-Allow-Headers", 'openId,Content-Type');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,DELETE,OPTIONS');
		res.send('200');
    });
    // 获取openId
	app.get('/mp/getOpenId', function(req,res,next) {
        actionMiniProgram.getOpenIdByCode(req,res,next);
    });
    
    // 根据openId判断访问者身份
	app.get('/mp/checkUserByOpenId', function(req,res,next) {
        actionMiniProgram.checkUserByOpenId(req,res,next);
    });
    
    // 根据姓名判断访问者身份
	app.post('/mp/checkUserByName', function(req,res,next) {
        actionMiniProgram.checkUserByName(req,res,next);
    });

    // 提交申诉
	app.post('/mp/applyAppeal', function(req,res,next) {
        actionMiniProgram.applyAppeal(req,res,next);
    });
	app.use('/mp', function(req,res,next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Expose-Headers', 'openId,Content-Type');
		res.header("Access-Control-Allow-Headers", 'openId,Content-Type');
        res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,DELETE,OPTIONS');
        actionMiniProgram.checkHeader(req,res,next);
    });

    // 获取同学列表
	app.get('/mp/getUserList', function(req,res,next) {
        actionMiniProgram.getUserList(req,res,next);
    });

    // 根据userId获取个人基本信息
	app.get('/mp/getUserInfoByUserId', function(req,res,next) {
        actionMiniProgram.getUserInfoByUserId(req,res,next);
    });
    
    // 根据openId获取个人基本信息
	app.get('/mp/getUserInfoByOpenId', function(req,res,next) {
        actionMiniProgram.getUserInfoByOpenId(req,res,next);
    });
    
    // 根据openId更新个人基本信息
	app.put('/mp/updateUserInfoByOpenId', function(req,res,next) {
        actionMiniProgram.updateUserInfoByOpenId(req,res,next);
    });

    // 查看共有多少人报名，当前排在第几位
	app.get('/mp/signPersonNum', function(req,res,next) {
        actionMiniProgram.signPersonNum(req,res,next);
    });

    // 获取组委会成员
	app.get('/mp/getOrganizerList', function(req,res,next) {
        actionMiniProgram.getOrganizerList(req,res,next);
    });

    // 是否是组委会成员
	app.get('/mp/checkIsOrganizer', function(req,res,next) {
        actionMiniProgram.checkIsOrganizer(req,res,next);
    });

    // 添加组委会成员
	app.post('/mp/addOrganizer', function(req,res,next) {
        actionMiniProgram.addOrganizer(req,res,next);
    });

    // 移除组委会成员
	app.delete('/mp/removeOrganizer', function(req,res,next) {
        actionMiniProgram.removeOrganizer(req,res,next);
    });

    // 更新组委会分工信息
	app.put('/mp/updateOrganizerJob', function(req,res,next) {
        actionMiniProgram.updateOrganizerJob(req,res,next);
    });
    
    // 会议基本信息
	app.get('/mp/getMeetingInfo', function(req,res,next) {
        actionMiniProgram.getMeetingInfo(req,res,next);
    });

    // 修改会议基本信息
	app.put('/mp/updateMeetingInfo', function(req,res,next) {
        actionMiniProgram.updateMeetingInfo(req,res,next);
    });
    
    // 会议日程安排
	app.get('/mp/meetingScheduleList', function(req,res,next) {
        actionMiniProgram.meetingScheduleList(req,res,next);
    });
    
    // 新增日程安排
	app.post('/mp/addMeetingSchedule', function(req,res,next) {
        actionMiniProgram.addMeetingSchedule(req,res,next);
    });
    
    // 修改日程安排
	app.put('/mp/updateMeetingSchedule', function(req,res,next) {
        actionMiniProgram.updateMeetingSchedule(req,res,next);
    });
    
    // 删除日程安排
	app.delete('/mp/delMeetingSchedule', function(req,res,next) {
        actionMiniProgram.delMeetingSchedule(req,res,next);
    });

    // 获取会议新闻
	app.get('/mp/meetingNewsList', function(req,res,next) {
        actionMiniProgram.meetingNewsList(req,res,next);
	});
    
    // 发布会议新闻
	app.post('/mp/addMeetingNews', function(req,res,next) {
        actionMiniProgram.addMeetingNews(req,res,next);
    });

    // 上传会议新闻的图片
	app.post('/mp/uploadImgForMeetingNews', function(req,res,next) {
        actionMiniProgram.uploadImgForMeetingNews(req,res,next);
    });

    // 更新新闻标题或内容
	app.put('/mp/editMeetingNews', function(req,res,next) {
        actionMiniProgram.editMeetingNews(req,res,next);
    });
    
    // 删除会议新闻
	app.delete('/mp/delMeetingNews', function(req,res,next) {
        actionMiniProgram.delMeetingNews(req,res,next);
    });

    // 置顶会议新闻
	app.put('/mp/topMeetingNews', function(req,res,next) {
        actionMiniProgram.topMeetingNews(req,res,next);
    });

    /************************* 参会部分 **************************/

    // 根据userId获取报名信息
	app.get('/mp/getSignInfoByUserId', function(req,res,next) {
        actionMiniProgram.getSignInfoByUserId(req,res,next);
    });

    // 根据openId获取报名信息
	app.get('/mp/getSignInfoByOpenId', function(req,res,next) {
        actionMiniProgram.getSignInfoByOpenId(req,res,next);
    });

    // 报名参加会议
	app.post('/mp/meetingSignIn', function(req,res,next) {
        actionMiniProgram.meetingSignIn(req,res,next);
    });

    // 取消参加会议
	app.put('/mp/meetingSignOut', function(req,res,next) {
        actionMiniProgram.meetingSignOut(req,res,next);
    });

    // 未缴费 -> 汇款已递交
    app.put('/mp/paySub', function(req,res,next) {
        actionMiniProgram.paySub(req,res,next);
    });

    // 汇款已递交 -> 确认缴费
    app.put('/mp/payEffective', function(req,res,next) {
        actionMiniProgram.payEffective(req,res,next);
    });

    // 汇款已递交 -> 未缴费
    app.put('/mp/payInvalid', function(req,res,next) {
        actionMiniProgram.payInvalid(req,res,next);
    });

    // 未缴费 -> 确认缴费
    app.put('/mp/originzerPayEffective', function(req,res,next) {
        actionMiniProgram.originzerPayEffective(req,res,next);
    });

    // 更新参会信息（开放式）
    app.put('/mp/updateSignInfo', function(req,res,next) {
        actionMiniProgram.updateSignInfo(req,res,next);
    });

    // 组委会录入房间号和接站联系电话
    app.put('/mp/updateSignInfoByOrganizer', function(req,res,next) {
        actionMiniProgram.updateSignInfoByOrganizer(req,res,next);
    });

    // 查看@我的消息
    app.get('/mp/getAtSelfMessage', function(req,res,next) {
        actionMiniProgram.getAtSelfMessage(req,res,next);
    });

    // 查看我发布的消息
    app.get('/mp/getMyMsg', function(req,res,next) {
        actionMiniProgram.getMyMsg(req,res,next);
    });

    // 回复消息
    app.put('/mp/replyMsg', function(req,res,next) {
        actionMiniProgram.replyMsg(req,res,next);
    });

    // 添加回复消息
    app.post('/mp/addReplyMsg', function(req,res,next) {
        actionMiniProgram.addReplyMsg(req,res,next);
    });

    // 发布消息
    app.post('/mp/addMsg', function(req,res,next) {
        actionMiniProgram.addMsg(req,res,next);
    });

    // 获取所有签到信息
    app.get('/mp/getSignInfoList', function(req,res,next) {
        actionMiniProgram.getSignInfoList(req,res,next);
    });

    //当天签到
    app.put('/mp/meetingCheck',function(req,res,next){
        actionMiniProgram.meetingCheck(req,res,next)
    })

    //根据openid获取个人签到信息
    app.get('/mp/getCheckInfoByOpenId',function(req,res,next){
        actionMiniProgram.getCheckInfoByOpenId(req,res,next)
    })

    //获取签到列表
    app.get('/mp/getCheckList',function(req,res,next){
        actionMiniProgram.getCheckList(req,res,next)
    })
    
    //相册
    app.get('/mp/getAllImagesInfo',function(req,res,next){
        actionMiniProgram.getAllImagesInfo(req,res,next)
    })

    //新建图片信息
    app.post('/mp/addImagesInfo',function(req,res,next){
        actionMiniProgram.addImagesInfo(req,res,next)
    })

    // 获取我上传的图片
    app.get('/mp/getMineImagesInfo',function(req,res,next){
        actionMiniProgram.getMineImagesInfo(req,res,next)
    })
    //更新图片信息
    app.put('/mp/updateImagesInfo',function(req,res,next){
        actionMiniProgram.updateImagesInfo(req,res,next)
    })

    //删除图片
    app.delete('/mp/deleteImagesInfo',function(req,res,next){
        actionMiniProgram.deleteImagesInfo(req,res,next)
    })

    //获取图片评论信息
    app.get('/mp/getImagesDiscussInfo',function(req,res,next){
        actionMiniProgram.getImagesDiscussInfo(req,res,next)
    })

    //点赞
    app.post('/mp/giveLikeToImages',function(req,res,next){
        actionMiniProgram.giveLikeToImages(req,res,next)
    })

    //弹幕（评论）
    app.post('/mp/discussToImages',function(req,res,next){
        actionMiniProgram.discussToImages(req,res,next)
    })

    //获取点赞数量最多的图片信息
    app.get('/mp/getMostLikeImages',function(req,res,next){
        actionMiniProgram.getMostLikeImages(req,res,next)
    })

    //点赞评论通知中心
    app.get('/mp/getDiscussAndLikeNotice',function(req,res,next){
        actionMiniProgram.getDiscussAndLikeNotice(req,res,next)
    })
}