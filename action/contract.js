var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var request = require('request');
var contract = require('../service/contract');
var ctrlContract = require('../controllers/admin_contract');
var ctrlCommon = require('../controllers/common');
const serviceHomeOutput = require('../service/homeOutput');
const service = require('../service/service');
const homeContracts = require('../service/homeContracts');

/*************************************微信端*********************************/

this.getlist = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var num = params.num;
	var keywords = params.keywords;
	var abb = req.session.abb_for_contract;
	var code = req.session.code;
	const { unionid } = req.session;
	contract.getList({
		abb: abb,
		code: code,
		page: page,
		num: num,
		keywords: keywords,
		unionid,
	},function(result){
		if(page==undefined){
			res.render('./pages/contract_list',{
				result: result.data,
				code: code
			});
		}else{
			SEND(res,200,'',result.data);
		}
	});
}
this.head = async function(req,res,next){
	var contract_no = url.parse(req.url,true).pathname.split('head/')[1];
	contract_no = decodeURIComponent(contract_no);
	var abb = req.session.abb_for_contract;
	var code = req.session.code;
	const admin_id = req.session.admin_id;
	const { unionid } = req.session;
	const result = await contract.head({
		contract_no: contract_no,
		abb: abb,
		code: code,
		unionid,
	});
	if (result.code === -1) {
		res.render('./pages/tip', {
			tip: result.msg
		});
	} else {
		if (code.indexOf(10001) === -1) {
			res.render('./pages/contract_cus_content', {
				result,
			});
		} else {
			const allowDelivery = await contract.checkAllowDelivery(admin_id);
			res.render('./pages/contract_staff_content', {
				result,
				allowDelivery,
			});
		}
	}
}
this.takeGoods = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var contract_no = params.no;
	var name = req.session.name;
	const { open_id, code } = req.session;
	contract.takeGoods({
		contract_no: contract_no,
		name: name,
		open_id,
		code,
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

exports.contractInfo = async (req, res, next) => {
	const { contractId } = req.params;
	const result = await contract.contractInfo(contractId);
	res.send(result);
}

this.turnToAllowDelivery = async (req, res, next) => {
	const { admin_id } = req.session;
	const { contract_no } = req.params;
	const result = await contract.turnToAllowDelivery({ admin_id, contract_no });
	res.send(result);
}

exports.packingPage = async (req, res, next) => {
	const { contractId } = req.params;
	const isStaff = await contract.checkIsStaff(req.session.open_id);
	await contract.createEmptyPacking({ isStaff, open_id: req.session.open_id, contractId });
	res.render('./pages/packingPage', {
		contractId,
		isStaff,
	});
}

exports.packingEditPage = async (req, res, next) => {
	const { id } = req.params;
	res.render('./pages/packingEditPage', {
		id,
	});
}

/**
 * 装箱单列表
 */
exports.getPackingList = async (req, res, next) => {
	const { contractId } = url.parse(req.url, true).query;
	const result = await contract.getPackingList({ contractId });
	res.send(result);
}

/**
 * 单个装箱单信息
 */
exports.showPacking = async (req, res, next) => {
	const { id } = url.parse(req.url, true).query;
	const result = await contract.showPacking({ id });
	res.send(result);
}

/**
 * 新增装箱单
 */
exports.addPacking = async (req, res, next) => {
	const { admin_id } = req.session;
	const { num, contractId } = req.body;
	const result = await contract.addPacking({ admin_id, num, contractId });
	res.send(result);
}

/**
 * 更新装箱单的序列号
 */
exports.updatePacking = async (req, res, next) => {
	const { admin_id } = req.session;
	let { snArr, otherSnArr, id } = req.body;
	snArr = typeof snArr === 'string' ? JSON.parse(snArr) : snArr;
	otherSnArr = typeof otherSnArr === 'string' ? JSON.parse(otherSnArr) : otherSnArr;
	const result = await contract.updatePacking({ admin_id, snArr, otherSnArr, id });
	res.send(result);
}

/**
 * 新增一个序列号
 */
exports.addSingleSn = async (req, res, next) => {
	const { admin_id } = req.session;
	let { sn, id } = req.body;
	const result = await contract.addSingleSn({ admin_id, sn, id });
	res.send(result);
}

/**
 * 新增一个其它序列号
 */
exports.addSingleOtherSn = async (req, res, next) => {
	const { admin_id } = req.session;
	let { sn, id } = req.body;
	const result = await contract.addSingleOtherSn({ admin_id, sn, id });
	res.send(result);
}

/**
 * 删除装箱单
 */
exports.delPacking = async (req, res, next) => {
	const { admin_id } = req.session;
	const { id } = req.body;
	const result = await contract.delPacking({ admin_id, id });
	res.send(result);
}

/**
 * 更新快递单号
 */
exports.updateExpressNoInPacking = async (req, res, next) => {
	const { admin_id } = req.session;
	const { expressNo, sendType, id } = req.body;
	const result = await contract.updateExpressNoInPacking({ admin_id, id, expressNo, sendType });
	res.send(result);
}

/**
 * 后续直接修改发货类型和快递单号
 */
exports.updateExpressTypeAndNo = async (req, res, next) => {
	const { admin_id } = req.session;
	const { expressNo, sendType, id } = req.body;
	const result = await contract.updateExpressTypeAndNo({ admin_id, id, expressNo, sendType });
	res.send(result);
}

this.slider = async function(req,res,next){
	var path = req.path;
	var no = path.split('/slider/')[1];
	no = decodeURIComponent(no);
	var abb = req.session.abb_for_contract;
	var code = req.session.code;
	const result = await contract.head({
		contract_no: no,
		abb,
		code,
	});
	let album_arr;
	try {
		album_arr = result.data.album.split(',').filter(items => items);
	} catch (e) {
		album_arr = '';
	}
	res.render('./pages/contract_slider',{
		result: album_arr,
		title: '合同照片'
	});
}
this.body = function(req,res,next){
	var contract_no = url.parse(req.url,true).pathname.split('body/')[1];
	contract_no = decodeURIComponent(contract_no);
	var abb = req.session.abb_for_contract;
	var code = req.session.code;
	const { unionid } = req.session;
	contract.body({
		contract_no: contract_no,
		abb: abb,
		code: code,
		unionid,
	},function(result){
		if(result.code==-1){
			res.render('./pages/tip',{
				tip: '不存在该合同'
			});
		}else{
			res.render('./pages/contract_goods_list',{
				result: result.data
			});
		}
	});
}

this.queryExpress = (req, res, next) => {
	const { contract } = req.params;
	service.queryExpress({
		no: contract
	}, result => {
		if (result.status == 0) {
			const { list, number, type } = result.result;
			res.render('./pages/queryExpressResult', {
				list,
				type: typeMapper(type),
				number,
			});
		} else {
			res.render('./pages/tip', {
				tip: result.msg,
			});
		}
	});
	// const { contract } = req.params;
	// serviceHomeOutput.getItemByContractNo({
	// 	contractNo: contract,
	// },result => {
	// 	if (!result.data) {
	// 		res.render('./pages/tip',{
	// 			tip: '暂无快递信息'
	// 		});
	// 	} else {
	// 		const { express_no } = result.data;
	// 		if (!express_no) {
	// 			res.render('./pages/tip',{
	// 				tip: '暂无快递信息'
	// 			});
	// 		} else {
	// 			service.queryExpress({
	// 				no: express_no
	// 			}, result => {
	// 				if (result.status == 0) {
	// 					const { list, number, type } = result.result;
	// 					res.render('./pages/queryExpressResult', {
	// 						list,
	// 						type: typeMapper(type),
	// 						number,
	// 					});
	// 				} else {
	// 					res.render('./pages/tip', {
	// 						tip: result.msg,
	// 					});
	// 				}
	// 			});
	// 		}
	// 	}
	// });

	function typeMapper(type) {
		const maper = {
			SFEXPRESS: '顺丰',
			DEPPON: '德邦',
			TTKDEX: '天天',
		};
		if (maper[type]) return maper[type];
		return type;
	};
}

this.queryPackingExpress = async (req, res, next) => {
	const { no } = req.params;
	service.queryExpress({
		no,
	}, result => {
		if (result.status == 0) {
			const { list, number, type } = result.result;
			res.render('./pages/queryExpressResult', {
				list,
				type: typeMapper(type),
				number,
			});
		} else {
			res.render('./pages/tip', {
				tip: result.msg,
			});
		}
	});

	function typeMapper(type) {
		const maper = {
			SFEXPRESS: '顺丰',
			DEPPON: '德邦',
			TTKDEX: '天天',
		};
		if (maper[type]) return maper[type];
		return type;
	};
}

this.updateAlbum = async (req, res, next) => {
	const params = req.body;
	params.admin_id = req.session.admin_id;
	const result = await contract.updateAlbum(params);
	res.send(result);
}

/*************************************pc端*********************************/
this.getListPc = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = parseInt(params.page);
	var num = parseInt(params.num);
	var keywords = params.keywords;
	contract.getList({
		code: 10001,
		page: page,
		num: num,
		keywords: keywords
	},function(result){
		SEND(res,200,'',result.data);
	});
}

this.filter = function(req,res,next){
	ctrlContract.filter(req,res,next);
}

this.info = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var no = decodeURIComponent(params.no);
	contract.head({
		contract_no: no,
		code: 10001
	},function(result){
		SEND(res,200,'',result.data);
	});
}

this.cus = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var val = params['filter[filters][0][value]'];
	contract.cus({
		val: val
	},function(result){
		res.send(result.data);
	});
}

this.salesMan = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var val = params['filter[filters][0][value]'];
	contract.salesMan({
		val: val
	},function(result){
		res.send(result.data);
	});
}

this.update = function(req,res,next){
	var form_data = JSON.parse(req.body.form_data);
	var bs_name = basicAuth(req).name;
	contract.update({
		form_data: form_data,
		bs_name: bs_name
	},function(result){
		SEND(res,result.code,result.msg,result.data);
	});
}

this.noBody = function(req,res,next){
	var params = url.parse(req.url,true).query;
	contract_no = decodeURIComponent(params.contract_no);
	contract.body({
		contract_no: contract_no,
		code: 10001
	},function(result){
		SEND(res,200,'',result.data);
	});
}

this.del = function(req,res,next){
	var contract_no = req.body.no;
	contract.del({
		contract_no: contract_no
	},function(){
		SEND(res,200,'删除成功',[]);
	});
}

this.batchFreeze = function(req,res,next){
	var freezeArr = JSON.parse(req.body.freezeArr);
	var notFreezeArr = JSON.parse(req.body.notFreezeArr);
	ctrlCommon.getEmployeeIdByToken(req,res,next,function(user_id){
		var bs_name = user_id[0].user_id;
		contract.batchFreeze({
			freezeArr: freezeArr,
			notFreezeArr: notFreezeArr,
			bs_name: bs_name
		},function(result){
			SEND(res,result.code,result.msg,result.data);
		});
	});
}

//总览
this.getContractsView = function(req,res,next){
	var params = JSON.parse(req.body.models);
	contract.getContractsView(params,(result) => {
		res.send(result.data);
	});
}

/**
 * 	获取指定签订时间范围，指定公司（支持全部公司），指定业务员的合同信息
 */
this.getContractsInfoByDateAndCpy = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	contract.getContractsInfoByDateAndCpy(params,result => {
		SEND(res,result.code,result.msg,result.data);
	});
}

this.getClosedData = async (req, res, next) => {
	const { year } = url.parse(req.url,true).query;
	const result = await homeContracts.calculClosedPayable({ year });
	res.send(result);
}

/********************************************* 装盘单 **************************************************/

exports.createAssembleDisk = async (req, res, next) => {
	const params = req.body;
	params.admin_id = req.session.admin_id;
	const result = await contract.createAssembleDisk(params);
	res.send(result);
}