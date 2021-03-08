const actionOpen = require('../action/open');
const actionVir = require('../action/homeVir');
const actionCloudDisk = require('../action/cloudDisk');
const actionService = require('../action/service');

function getAllowOrigin(req) {
	const origin = req.headers.origin;
	return origin;
}

module.exports = app => {
	app.options('/open/*', function(req, res, next) {
		res.header("Access-Control-Allow-Credentials", true);
		res.header("Access-Control-Allow-Origin", getAllowOrigin(req));
		res.header('Access-Control-Expose-Headers', 'lj_token,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Headers", 'lj_token,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		res.send('200');
	});
	app.use('/open/*', function(req, res, next) {
		res.header("Access-Control-Allow-Credentials", true);
		res.header("Access-Control-Allow-Origin", getAllowOrigin(req));
		res.header('Access-Control-Expose-Headers', 'lj_token,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Headers", 'lj_token,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		next();
	});
	app.use('/open/knowledge/*', function(req, res, next) {
		next();
	});
	app.use('/open/service/*', function(req, res, next) {
		actionOpen.checkToken(req, res, next);
	});
	app.get('/open/getTicket', function(req, res, next) {
		actionOpen.getTicket(req,res,next);
	});
	app.get('/open/burnDisk/download/:id', (req, res, next) => {
		actionCloudDisk.downloadSoftDisk(req, res, next);
	});
	// 验证票据（微信）
	app.post('/open/wxPlat/receiveTicket', function(req, res, next) {
		actionOpen.wxPlatReceiveTicket(req, res, next);
	});
	app.post('/open/wxPlat/:appid([0-9]+)', function(req, res, next) {
		res.send('success');
	});
	// 前端获取微信返回的票据
	app.get('/open/wx/getTicket', function(req, res, next) {
		actionOpen.wxGetTicket(req, res, next);
	});

	app.get('/open/member/getEffectUnionid/:unionid', function(req, res, next) {
		actionOpen.getEffectUnionid(req,res,next);
	});

	app.post('/open/login/scanCode', function(req, res, next) {
		actionOpen.scanCode(req,res,next);
	});

	app.post('/open/login/checkVerCode', (req, res, next) => {
		actionOpen.checkVerCode(req, res, next);
	});

	app.post('/open/refreshSideMenuAuth', (req, res, next) => {
		actionOpen.refreshSideMenuAuth(req, res, next);
	});

	// 超级权限
	app.get('/open/service/getSuperAuth', (req, res, next) => {
		actionOpen.getSuperAuth(req, res, next);
	});

	app.get('/open/service/getSuperAuthMember', (req, res, next) => {
		actionOpen.getSuperAuthMember(req, res, next);
	});

	app.post('/open/service/postSuperAuthMember', (req, res, next) => {
		actionOpen.postSuperAuthMember(req, res, next);
	});

	// 指定知识库json文档
	app.get('/open/knowledge/:id([0-9]+)', (req, res, next) => {
		actionOpen.getKnowlegeJson(req, res, next);
	});

	// 推荐阅读
	app.get('/open/knowledge/recommendReading', (req, res, next) => {
		actionOpen.recommendReading(req, res, next);
	});

	// 近期活动
	app.get('/open/knowledge/recentActivity', (req, res, next) => {
		actionOpen.recentActivity(req, res, next);
	});

	// 首页推送文章
	app.get('/open/knowledge/indexArticle', (req, res, next) => {
		actionOpen.indexArticle(req, res, next);
	});

	// 维修详细页
	app.get('/open/pageRepair/:no', (req, res, next) => {
		actionOpen.repairPage(req, res, next);
	});

	// 指定软件列表
	app.get('/open/soft/:projectId', (req, res, next) => {
		actionOpen.getSoftList(req, res, next);
	});
	// 下载指定软件
	app.get('/open/soft/:projectId/:version', (req, res, next) => {
		actionOpen.downloadSoftVersion(req, res, next);
	});
	app.get('/open/soft/:projectId/:version/:childVersionName', (req, res, next) => {
		actionOpen.downloadSoftVersion(req, res, next);
	});

	/*******************************************************************************************/

	// 获取所有客户
	app.get('/open/action/getAllCusList', (req, res, next) => {
		actionVir.getAllCusList(req, res, next);
	});

	// 按试验机机型分类
	app.get('/open/action/factoryModel', (req, res, next) => {
		actionVir.sortByFactory(req, res, next);
	});

	// 按适用方案分类
	app.get('/open/action/solutionType', (req, res, next) => {
		actionVir.sortBySolution(req, res, next);
	});

	app.get('/open/simuCtrl/list', (req, res, next) => {
		actionOpen.simuCtrlList(req, res, next);
	});

	/************************************************ 客户服务 *************************************************/
	app.get('/open/service/getRepair', (req, res, next) => {
		actionOpen.getRepair(req, res, next);
	});
	app.get('/open/service/getRepair/:repair_contractno', (req, res, next) => {
		actionOpen.getRepairInfo(req, res, next);
	});
	app.put('/open/service/repair/takeConfirm/:no', (req, res, next) => {
		actionOpen.repairTakeConfirm(req, res, next);
	});


	app.get('/open/service/getVirCard', (req, res, next) => {
		actionOpen.getVirCard(req, res, next);
	});
	app.get('/open/service/getVirCard/:sn', (req, res, next) => {
		actionOpen.getVirCardInfo(req, res, next);
	});
	app.get('/open/service/getContract', (req, res, next) => {
		actionOpen.getContract(req, res, next);
	});
	app.get('/open/service/getContract/:contract_no', (req, res, next) => {
		actionOpen.getContractInfo(req, res, next);
	});
	app.get('/open/service/queryExpress/:no', (req, res, next) => {
		actionOpen.queryExpress(req, res, next);
	});
	app.put('/open/service/contract/takeConfirm/:no', (req, res, next) => {
		actionOpen.contractTakeConfirm(req, res, next);
	});
	app.post('/open/service/cloudDisk/download/:sn([0-9]+)', (req, res, next) => {
		actionCloudDisk.buildSoftBySn(req, res, next);
	});
	app.post('/open/service/cloudDisk/download/:fileId', (req, res, next) => {
		actionCloudDisk.downloadFile(req, res, next);
	});
	app.post('/open/service/cloudDisk/download/:fileId/:picId', (req, res, next) => {
		actionCloudDisk.downloadFile(req, res, next);
	});
	app.post('/open/service/burnDisk/buildDependency/:_id', function(req,res,next) {
		actionCloudDisk.buildDependency(req, res, next);
	});
	app.get('/open/service/cloudDisk/getList', (req, res, next) => {
		actionOpen.getCloudDiskListByUid(req, res, next);
	});
	app.get('/open/service/cloudDisk/getPublicList', (req, res, next) => {
		actionOpen.getCloudDiskPublicList(req, res, next);
	});
	app.get('/open/service/cloudDisk/info', (req, res, next) => {
		actionOpen.getCloudDiskInfo(req, res, next);
	});
	app.get('/open/service/burnDisk/checkSnAccess', function(req,res,next) {
		actionService.checkSnAccess(req, res, next);
	});
	app.put('/open/service/cloudDisk/star', (req, res, next) => {
		actionCloudDisk.star(req, res, next);
	});
}