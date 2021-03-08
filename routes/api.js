const actionApi = require('../action/api');
module.exports = app => {
	// app.get('/vir/regInfo/:sn([0-9]+)', (req, res, next) => {
    //     actionApi.regInfo(req, res, next);
    // });

    // 判断该访客是否有资格抽奖
    // @param {unionid: <unionid>, activity: <activity>, total: <activity>}
    app.get('/api/checkMemberScoreInfo/:unionid', (req, res, next) => {
        actionApi.checkMemberScoreInfo(req, res, next);
    });

    // 获取一定规则的会员
    // @param {activity: <activity>, total: <activity>}
    app.get('/api/getMemberByScoreRule', (req, res, next) => {
        actionApi.getMemberByScoreRule(req, res, next);
    });

    // 根据unionid获取会员基本信息和分数
    // @param {unionid: <unionid>}
    app.get('/api/getMemberInfo/:unionid', (req, res, next) => {
        actionApi.getMemberInfo(req, res, next);
    });
};
