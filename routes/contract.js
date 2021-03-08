var express = require('express');
var url = require('url');
var path = require('path');
var service = require('../action/service');
var contract = require('../action/contract');
var repair = require('../action/repair');
var auth = require('../action/auth');
const actionContracts = require('../action/homeContracts');

module.exports = function(app){
	app.use('/contract',function(req,res,next){
		check(req,res,next);
	});
	app.get('/contract/index',function(req,res,next){
		contract.getlist(req,res,next);
	});
	app.get('/contract/head/*',function(req,res,next){
		contract.head(req,res,next);
	});
	app.get('/contract/body/*',function(req,res,next){
		contract.body(req,res,next);
	});
	app.get('/contract/slider/*',function(req,res,next){
		contract.slider(req,res,next);
	});

	app.get('/contract/queryExpress/:contract',function(req,res,next){
		contract.queryExpress(req,res,next);
	});
	app.get('/contract/queryPackingExpress/:no',function(req,res,next){
		contract.queryPackingExpress(req,res,next);
	});

	app.get('/contract_ajax/takeGoods',function(req,res,next){
		contract.takeGoods(req,res,next);
	});

	app.put('/contract_ajax/turnToAllowDelivery/:contract_no',function(req,res,next){
		contract.turnToAllowDelivery(req,res,next);
	});

	app.get('/contract/info/:contractId',function(req,res,next){
		contract.contractInfo(req,res,next);
	});
	app.get('/contract/packingPage/:contractId',function(req,res,next){
		contract.packingPage(req,res,next);
	});
	app.get('/contract/packingEditPage/:id',function(req,res,next){
		contract.packingEditPage(req,res,next);
	});
	app.get('/contract/getPackingList',function(req,res,next){
		contract.getPackingList(req,res,next);
	});
	app.get('/contract/showPacking',function(req,res,next){
		contract.showPacking(req,res,next);
	});
	app.post('/contract/addPacking',function(req,res,next){
		contract.addPacking(req,res,next);
	});
	app.put('/contract/updatePacking',function(req,res,next){
		contract.updatePacking(req,res,next);
	});
	app.post('/contract/addSingleSn',function(req,res,next){
		contract.addSingleSn(req,res,next);
	});
	app.post('/contract/addSingleOtherSn',function(req,res,next){
		contract.addSingleOtherSn(req,res,next);
	});
	app.delete('/contract/delPacking',function(req,res,next){
		contract.delPacking(req,res,next);
	});
	app.put('/contract/updateExpressNoInPacking',function(req,res,next){
		contract.updateExpressNoInPacking(req,res,next);
	});
	app.put('/contract/updateExpressTypeAndNo',function(req,res,next){
		contract.updateExpressTypeAndNo(req,res,next);
	});

	app.post('/contract/uploadImg',function(req,res,next){
		actionContracts.upload(req,res,next);
	});
	app.put('/contract/updateAlbum',function(req,res,next){
		contract.updateAlbum(req,res,next);
	});

	/*************************pc端*************************/

	app.get('/admin/contract/no',function(req,res,next){
		contract.info(req,res,next);
	});

	app.get('/admin/contract/cus',function(req,res,next){
		contract.cus(req,res,next);
	});
	app.get('/admin/contract/salesMan',function(req,res,next){
		contract.salesMan(req,res,next);
	});
	app.get('/admin/contract/no_body',function(req,res,next){
		contract.noBody(req,res,next);
	});
	app.get('/admin/contract/getListPc',function(req,res,next){
		contract.getListPc(req,res,next);
	});
	app.get('/admin/contract/filter',function(req,res,next){
		contract.filter(req,res,next);
	});
	app.put('/admin/contract/update',function(req,res,next){
		contract.update(req,res,next);
	});
	app.delete('/admin/contract/del',function(req,res,next){
		contract.del(req,res,next);
	});
	app.put('/admin/contract/batchFreeze',function(req,res,next){
		contract.batchFreeze(req,res,next);
	});
	app.get('/admin/contract/getInfoByDateAndCpy',function(req,res,next){
		contract.getContractsInfoByDateAndCpy(req,res,next);
	});
	app.get('/admin/contract/getClosedData',function(req,res,next){
		contract.getClosedData(req,res,next);
	});

	app.options('/contracts/*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Expose-Headers', 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Headers", 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.send('200');
	});
	app.use('/contracts/*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Expose-Headers', 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Headers", 'token,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		next();
	});
	app.get('/contracts/getSum', function(req, res, next) {
		actionContracts.getSum(req,res,next);
	});
	app.get('/contracts/newCustomerDeferred', function(req, res, next) {
		actionContracts.newCustomerDeferred(req,res,next);
	});

	app.post('/contracts/createAssembleDisk', function(req, res, next) {
		contract.createAssembleDisk(req,res,next);
	});

}

function check(req,res,next){
	service.checkOpenId(req,res,next,function(){
		service.checkPerson(req,res,next,function(result){
			if(result.code.indexOf(10001)!=-1){
				//员工
				dealer(req,res,next,result);
			}else if(result.code.indexOf(10004)!=-1||result.code.indexOf(10005)!=-1||result.code.indexOf(10007)!=-1||result.code.indexOf(10008)!=-1){
				dealer(req,res,next,result);
			}else{
				res.render('./pages/tip', {
					tip: '<p>很抱歉，该操作需要符合采购或财务职位。</p><p>可在“我的会员”中修改职位信息</p><p>如有疑问，请联系朗杰客服。</p>'
				});
			}
		});
	});
	function dealer(req,res,next,result){
		repair.getNameAndAbb({
			open_id: req.session.open_id
		},function(_result){
			req.session.name = _result.data.name;
			req.session.abb_for_contract = result.code.indexOf(10001)!=-1?'langjiestaff':_result.data.abb;
			next();
		});
	}
}