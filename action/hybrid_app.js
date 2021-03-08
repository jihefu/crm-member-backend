var dealImages = require('images');
var url = require('url');
var fs = require('fs');
var hybridApp = require('../service/hybrid_app');
var serviceContacts = require('../service/homeContacts');
const serviceHomeContracts = require('../service/homeContracts');

this.checkVersion = (req,res,next) => {
	let version = req.headers['version'];
	if(!version||Number(version.replace(/\./ig,''))<=110){
		res.status(403).send({
			msg: '请升级最新版本！'
		});
	}else{
		next();
	}
}

/**
 * 	登陆
 */
this.userLogin = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var username = params.username;
	var password = params.password;
	var phone = params.phone;
	if(username==''||password==''||phone==''){
		SEND(res,-10001,'不能为空',[]);
	}else{
		hybridApp.userLogin({
			username: username,
			password: password,
			phone: phone
		},function(result){
			SEND(res,result.code,result.msg,[result.data]);
		});
	}
}

/**
 * 	登出
 */
this.logout = function(req,res,next){
	let params = req.body;
	hybridApp.logout(params,(result) => {
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 * 	试探性呼入
 */
this.callInTip = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var call_phone = params.call_phone;
	hybridApp.callInTip(params,function(result){
		SEND(res,200,'',result);
	});
}

/**
 * 	呼入
 */
this.callIn = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var call_phone = params.call_phone;
	hybridApp.callIn(params,function(result){
		SEND(res,200,'',result);
	});
}

this.addCallRecord = async (req, res, next) => {
	const params = req.body;
	const result = await hybridApp.addCallRecord(params);
	res.send(result);
}

/**
 * 	测试链接
 */
this.testConnect = function(req,res,next){
	var params = url.parse(req.url,true).query;
	hybridApp.testConnect(params,function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

/**
 * 	电话联系单列表
 */
this.orderList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	hybridApp.orderList(params,function(result){
		SEND(res,200,'',result);
	});
}

/**
 * 	指定联系单详情
 */
this.orderInfo = function(req,res,next){
	var params = url.parse(req.url,true).query;
	hybridApp.orderInfo(params,function(result){
		SEND(res,200,'',result);
	});
}

/**
 * 	更新指定联系单内容
 */
this.orderUpdate = function(req,res,next){
	var body = typeof(req.body.format_data)=='object'?req.body.format_data:JSON.parse(req.body.format_data);
	hybridApp.orderUpdate({
		body: body
	},function(result){
		SEND(res,200,'',result);
	});
}

/**
 *  关闭联系单
 */
this.closeOrder = (req,res,next) => {
	var params = req.body;
	hybridApp.closeOrder(params,function(result){
		SEND(res,200,'',result);
	});
}

/**
 *  标签
 */
this.getTagHash = (req,res,next) => {
	hybridApp.getTagHash({},function(result){
		res.send(result);
	});
}

/**
 * 	删除指定联系单
 */
this.orderDelete = function(req,res,next){
	var id = req.body.id;
	hybridApp.orderDelete({
		id: id
	},function(result){
		SEND(res,200,'删除成功',result);
	});
}

/**
 * 	获取标签
 */
this.getTags = function(req,res,next){
	hybridApp.getTags(function(result){
		SEND(res,200,'',result);
	});
}

/**
 * 获取见面单列表
 */
this.getMeetOrderList = async (req, res, next) => {
	const params = url.parse(req.url, true).query;
	params.self_user_id = req.session.admin_id;
	const result = await hybridApp.getMeetOrderList(params);
	res.send(result);
}

/**
 * 指定见面联系单
 */
this.targetMeetOrder = async (req, res, next) => {
	const { id } = req.params;
	const result = await hybridApp.targetMeetOrder({ id });
	res.send(result);
}

/**
 * 创建见面联系单
 */
this.createMeetOrder = async (req, res, next) => {
	const self_user_id = req.session.admin_id;
	const params = req.body;
	params.self_user_id = self_user_id;
	const result = await hybridApp.createMeetOrder(params);
	res.send(result);
}

/**
 * 删除见面联系单
 */
this.delMeetOrder = async (req, res, next) => {
	const { id } = req.params;
	const result = await hybridApp.delMeetOrder({ id });
	res.send(result);
}

/**
 * 更新见面联系单
 */
this.updateMeetOrder = async (req, res, next) => {
	const { id } = req.params;
	const params = req.body;
	params.id = id;
	const result = await hybridApp.updateMeetOrder(params);
	res.send(result);
}

/**
 * 更新见面联系单照片
 */
this.updateMeetOrderAlbum = async (req, res, next) => {
	const { id } = req.params;
	const params = req.body;
	params.id = id;
	const result = await hybridApp.updateMeetOrderAlbum(params);
	res.send(result);
}

this.uploadImg = async (req, res, next) => {
	const fileArr = req.files;
	const resArr = fileArr.map(items => items.originalname);
	res.send({
		code: 200,
		msg: '上传成功',
		data: fileArr,
	});
	resArr.forEach(items => {
		const filePath = DIRNAME + '/public/img/gallery/' + items;
		let newPath = DIRNAME + '/public/img/gallery/list_' + items;
		if (items.indexOf('.svg') !== -1) {
			fs.copyFile(filePath, newPath, (err) => {
				console.log(err);
			});
		} else {
			dealImages(filePath).resize(100).save(newPath,{});
			downQuality(filePath);
		}
	});

	function downQuality(path) {
		fs.stat(path, (err, result) => {
			if (err) return;
			let { size } = result;
			if (size/1024/1024 > 1) {
				dealImages(path).save(path,{
					quality : size/1024/1024*10
				});
				downQuality(path);
			}
		});
	}
}

this.uploadImgBase64 = async (req, res, next) => {
	const { file } = req.body;
	const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
	const dataBuffer = new Buffer(base64Data, 'base64');
	const imageName = 'image-' + Date.now()+'.jpg';
	const path = DIRNAME+'/public/img/gallery/'+imageName;
	fs.writeFile(path, dataBuffer, function (err) {
		if (err) return;
		res.send({
			code: 200, 
			msg: '图片上传成功',
			data: [{ filename: imageName }],
		});
		const filePath = path;
		let newPath = DIRNAME + '/public/img/gallery/list_' + imageName;
		dealImages(filePath).resize(100).save(newPath,{});
		downQuality(filePath);
	});

	function downQuality(path) {
		fs.stat(path, (err, result) => {
			if (err) return;
			let { size } = result;
			if (size/1024/1024 > 1) {
				dealImages(path).save(path,{
					quality : size/1024/1024*10
				});
				downQuality(path);
			}
		});
	}
}

/**
 * 搜索认证公司
 */
this.searchCompany = async (req, res, next) => {
	const params = url.parse(req.url, true).query;
	const result = await hybridApp.searchCompany(params);
	res.send(result);
}

this.searchNoBySn = async (req, res, next) => {
	const params = url.parse(req.url, true).query;
	const result = await hybridApp.searchNoBySn(params);
	res.send(result);
}

/**
 * 获取其它单列表
 */
this.getOtherOrderList = async (req, res, next) => {
	const params = url.parse(req.url, true).query;
	params.self_user_id = req.session.admin_id;
	const result = await hybridApp.getOtherOrderList(params);
	res.send(result);
}

/**
 * 指定其它联系单
 */
this.targetOtherOrder = async (req, res, next) => {
	const { id } = req.params;
	const result = await hybridApp.targetOtherOrder({ id });
	res.send(result);
}

/**
 * 创建其它联系单
 */
this.createOtherOrder = async (req, res, next) => {
	// const { self_user_id } = url.parse(req.url, true).query;
	const self_user_id = req.session.admin_id;
	const params = req.body;
	params.self_user_id = self_user_id;
	const result = await hybridApp.createOtherOrder(params);
	res.send(result);
}

/**
 * 删除其它联系单
 */
this.delOtherOrder = async (req, res, next) => {
	const { id } = req.params;
	const result = await hybridApp.delOtherOrder({ id });
	res.send(result);
}

/**
 * 更新其它联系单
 */
this.updateOtherOrder = async (req, res, next) => {
	const { id } = req.params;
	const params = req.body;
	params.id = id;
	const result = await hybridApp.updateOtherOrder(params);
	res.send(result);
}

/**
 * 更新其它联系单照片
 */
this.updateOtherOrderAlbum = async (req, res, next) => {
	const { id } = req.params;
	const params = req.body;
	params.id = id;
	const result = await hybridApp.updateOtherOrderAlbum(params);
	res.send(result);
}

this.addContacts = async (req, res, next) => {
	const params = req.body;
	const admin_id = req.session.admin_id;
	serviceContacts.add({
		form_data: JSON.stringify({
			name: params.name,
			phone1: params.phone,
			company: params.company,
			sex: params.sex ? params.sex : '男',
		}),
		admin_id,
	}, result => {
		res.send(result);
	});
}

this.getVerContacts = async (req, res, next) => {
	const result = await hybridApp.getVerContacts();
	res.send(result);
}

this.searchContractNo = async (req, res, next) => {
	const params = url.parse(req.url, true).query;
	const result = await hybridApp.searchContractNo(params);
	res.send(result);
}

this.checkTomember = async (req, res, next) => {
	const { id } = req.params;
	const params = req.body;
	params.id = id;
	const result = await hybridApp.checkTomember(params);
	res.send(result);
}

this.checkToDirector = async (req, res, next) => {
	const { id } = req.params;
	const params = req.body;
	params.id = id;
	const result = await hybridApp.checkToDirector(params);
	res.send(result);
}

// 从指派人端撤回审核
this.recallFromDirector = async (req, res, next) => {
	const { id } = req.params;
	const result = await hybridApp.recallFromDirector({ id });
	res.send(result);
}

// 从会员端撤回审核
this.recallFromMember = async (req, res, next) => {
	const { id } = req.params;
	const result = await hybridApp.recallFromMember({ id });
	res.send(result);
}

this.reStart = async (req, res, next) => {
	const { id } = req.params;
	const result = await hybridApp.reStart({ id });
	res.send(result);
}

// 同意见面联系单
this.agreeMeetOrder = async (req, res, next) => {
	const { id } = req.params;
	const result = await hybridApp.agreeMeetOrder({ id });
	res.send(result);
}

// 不同意见面联系单
this.disAgreeMeetOrder = async (req, res, next) => {
	const { id } = req.params;
	const result = await hybridApp.disAgreeMeetOrder({ id });
	res.send(result);
}

// 服务评价
this.serviceEvalution = async (req, res, next) => {
	const params = req.body;
	const result = await hybridApp.serviceEvalution(params);
	res.send(result);
}

// 判断是否评价过了
this.checkServiceEvalution = async (req, res, next) => {
	const params = url.parse(req.url, true).query;
	const result = await hybridApp.checkServiceEvalution(params);
	res.send(result);
}

// 新建合同号
this.createContractNo = async (req, res, next) => {
	const params = req.body;
	params.admin_id = req.session.admin_id;
	const result = await serviceHomeContracts.addFromApp(params);
	res.send(result);
}

exports.searchLatestContractNo = async (req, res, next) => {
	const params = url.parse(req.url, true).query;
	const result = await hybridApp.searchLatestContractNo(params);
	res.send(result);
}