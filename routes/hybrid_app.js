const policyHome = require('../policies/home');
var actionHybridApp = require('../action/hybrid_app');
const multer  = require('multer');
const fs = require('fs');
const actionVehicleRegist = require('../action/homeVehicleRegist');

module.exports = function(app){
	/**
	 * 	登陆
	 */
	app.get('/hybrid/user/login',function(req,res,next){
		res.header("Access-Control-Allow-Origin", "*");
		actionHybridApp.userLogin(req,res,next);
	});
	app.post('/hybrid/service_evalution',function(req,res,next){
		res.header("Access-Control-Allow-Origin", "*");
		actionHybridApp.serviceEvalution(req,res,next);
	});
	app.get('/hybrid/check_service_evalution',function(req,res,next){
		res.header("Access-Control-Allow-Origin", "*");
		actionHybridApp.checkServiceEvalution(req,res,next);
	});

	app.options('/hybrid/*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Expose-Headers', 'token,version,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Headers", 'token,version,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		res.send('200');
	});
	app.use('/hybrid/*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Expose-Headers', 'token,version,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Headers", 'token,version,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		policyHome.checkSessionExist(req,res,next);
	});

	app.use('/hybrid/*', function(req, res, next) {
		actionHybridApp.checkVersion(req,res,next);
	});

	/**
	 * 	登出
	 */
	app.delete('/hybrid/user/logout',function(req,res,next){
		actionHybridApp.logout(req,res,next);
	});

	/**
	 *  试探性呼入
	 */
	app.get('/hybrid/call_in_tip',function(req,res,next){
		actionHybridApp.callInTip(req,res,next);
	});

	/**
	 * 	呼入
	 */
	app.get('/hybrid/call_in',function(req,res,next){
		actionHybridApp.callIn(req,res,next);
	});
	app.post('/hybrid/addCallRecord',function(req,res,next){
		actionHybridApp.addCallRecord(req,res,next);
	});

	/**
	 * 	连接测试
	 */
	app.get('/hybrid/test_connect',function(req,res,next){
		actionHybridApp.testConnect(req,res,next);
	});

	/**
	 * 	电话联系单列表
	 */
	app.get('/hybrid/order/list',function(req,res,next){
		actionHybridApp.orderList(req,res,next);
	});

	/**
	 * 	指定联系单详情
	 */
	app.get('/hybrid/order/info',function(req,res,next){
		actionHybridApp.orderInfo(req,res,next);
	});

	/**
	 * 	更新指定联系单内容
	 */
	app.put('/hybrid/order/update',function(req,res,next){
		actionHybridApp.orderUpdate(req,res,next);
	});

	/**
	 *  获取标签
	 */
	app.get('/hybrid/getTagHash',function(req,res,next){
		actionHybridApp.getTagHash(req,res,next);
	});

	/**
	 * 	关闭指定联系单
	 */
	app.put('/hybrid/order/closeOrder',function(req,res,next){
		actionHybridApp.closeOrder(req,res,next);
	});

	/**
	 * 	删除指定联系单
	 */
	app.delete('/hybrid/order/delete',function(req,res,next){
		actionHybridApp.orderDelete(req,res,next);
	});

	/**
	 * 	获取标签
	 */
	app.get('/hybrid/order/getTags',function(req,res,next){
		actionHybridApp.getTags(req,res,next);
	});


	app.get('/hybrid/meetOrder',function(req,res,next){
		actionHybridApp.getMeetOrderList(req,res,next);
	});
	app.get('/hybrid/meetOrder/:id',function(req,res,next){
		actionHybridApp.targetMeetOrder(req,res,next);
	});
	app.post('/hybrid/meetOrder',function(req,res,next){
		actionHybridApp.createMeetOrder(req,res,next);
	});
	app.delete('/hybrid/meetOrder/:id',function(req,res,next){
		actionHybridApp.delMeetOrder(req,res,next);
	});
	app.put('/hybrid/meetOrder/:id',function(req,res,next){
		actionHybridApp.updateMeetOrder(req,res,next);
	});
	app.put('/hybrid/meetOrder/updateAlbum/:id',function(req,res,next){
		actionHybridApp.updateMeetOrderAlbum(req,res,next);
	});
	// 图库多图片上传
	const uploadAlbum = multer({
		storage: multer.diskStorage({
			destination: (req, file, cb) => {
				cb(null, DIRNAME+'/public/img/gallery')
			},
			filename: (req, file, cb) => {
				var arr = file.originalname.split('.');
				var ext = arr.pop();
				file.originalname = arr.join('.') + '-' + Date.now() + '.' + ext;
				cb(null, file.originalname);
			}
		})
	});
	app.post('/hybrid/uploadImg', uploadAlbum.array('files'), (req, res, next) => {
		actionHybridApp.uploadImg(req,res,next);
	});
	app.post('/hybrid/uploadImgBase64', (req, res, next) => {
		actionHybridApp.uploadImgBase64(req,res,next);
	});
	app.get('/hybrid/searchCompany', (req, res, next) => {
		actionHybridApp.searchCompany(req,res,next);
	});
	app.get('/hybrid/searchNoBySn', (req, res, next) => {
		actionHybridApp.searchNoBySn(req,res,next);
	});
	app.get('/hybrid/otherOrder',function(req,res,next){
		actionHybridApp.getOtherOrderList(req,res,next);
	});
	app.get('/hybrid/otherOrder/:id',function(req,res,next){
		actionHybridApp.targetOtherOrder(req,res,next);
	});
	app.post('/hybrid/otherOrder',function(req,res,next){
		actionHybridApp.createOtherOrder(req,res,next);
	});
	app.delete('/hybrid/otherOrder/:id',function(req,res,next){
		actionHybridApp.delOtherOrder(req,res,next);
	});
	app.put('/hybrid/otherOrder/:id',function(req,res,next){
		actionHybridApp.updateOtherOrder(req,res,next);
	});
	app.put('/hybrid/otherOrder/updateAlbum/:id',function(req,res,next){
		actionHybridApp.updateOtherOrderAlbum(req,res,next);
	});

	app.post('/hybrid/contacts/add',function(req,res,next){
		actionHybridApp.addContacts(req,res,next);
	});
	app.get('/hybrid/getVerContacts',function(req,res,next){
		actionHybridApp.getVerContacts(req,res,next);
	});
	app.get('/hybrid/searchContractNo',function(req,res,next){
		actionHybridApp.searchContractNo(req,res,next);
	});

	app.put('/hybrid/checkTomember/:id',function(req,res,next){
		actionHybridApp.checkTomember(req,res,next);
	});
	app.put('/hybrid/checkToDirector/:id',function(req,res,next){
		actionHybridApp.checkToDirector(req,res,next);
	});
	app.put('/hybrid/recallFromDirector/:id',function(req,res,next){
		actionHybridApp.recallFromDirector(req,res,next);
	});
	app.put('/hybrid/recallFromMember/:id',function(req,res,next){
		actionHybridApp.recallFromMember(req,res,next);
	});
	app.put('/hybrid/reStart/:id',function(req,res,next){
		actionHybridApp.reStart(req,res,next);
	});
	app.put('/hybrid/agreeMeetOrder/:id',function(req,res,next){
		actionHybridApp.agreeMeetOrder(req,res,next);
	});
	app.put('/hybrid/disAgreeMeetOrder/:id',function(req,res,next){
		actionHybridApp.disAgreeMeetOrder(req,res,next);
	});
	app.post('/hybrid/createContractNo',function(req,res,next){
		actionHybridApp.createContractNo(req,res,next);
	});
	app.get('/hybrid/searchLatestContractNo',function(req,res,next){
		actionHybridApp.searchLatestContractNo(req,res,next);
	});

	app.get('/hybrid/vehicleRegist/getList',function(req,res,next){
		actionVehicleRegist.getList(req,res,next);
	});
	app.get('/hybrid/vehicleRegist/getRecordById/:id',function(req,res,next){
		actionVehicleRegist.getRecordById(req,res,next);
	});
	app.get('/hybrid/vehicleRegist/getPrevMile',function(req,res,next){
		actionVehicleRegist.getPrevMile(req,res,next);
	});
	app.post('/hybrid/vehicleRegist/create',function(req,res,next){
		actionVehicleRegist.create(req,res,next);
	});
	app.delete('/hybrid/vehicleRegist/del/:id',function(req,res,next){
		actionVehicleRegist.del(req,res,next);
	});
	app.put('/hybrid/vehicleRegist/update',function(req,res,next){
		actionVehicleRegist.update(req,res,next);
	});
	app.put('/hybrid/vehicleRegist/updateAlbum/:id',function(req,res,next){
		actionVehicleRegist.updateAlbum(req,res,next);
	});
}