var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var crypto = require('crypto');
var customer = require('../controllers/customer');
var contact = require('../controllers/contacts');
var employee = require('../controllers/employees');
var vir = require('../controllers/vir8');
var mod_admin = require('../model/mod_admin');
var users = require('../controllers/users');
var member = require('../controllers/pc_member');
var contract = require('../controllers/admin_contract');
var repair = require('../controllers/admin_repair');
var knowledge = require('../controllers/admin_knowledge');
module.exports = function(app){
	// app.use('/admin', function(req, res, next) {
	// 	distRoute(req,res,next);
	// });
	app.options('/admin/*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Expose-Headers', 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Headers", 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.send('200');
	});
	app.use('/admin/*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Expose-Headers', 'token,Content-Type,X-Requested-With');
        res.header("Access-Control-Allow-Headers", 'token,Content-Type,X-Requested-With');
		res.header("Access-Control-Allow-Methods", 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		next();
	});
	require('./intercourse')(app);
	require('./payments')(app);
	app.get('/admin', function(req, res, next) {
		res.redirect('/home');
		// isPc(req,res,next);
	});
	app.get('/admin/customers', function(req, res, next) {
		var ctrl = req.path.split('/admin/')[1];
		auth(req,res,ctrl,next);
	});
	app.get('/admin/contacts', function(req, res, next) {
		var ctrl = req.path.split('/admin/')[1];
		auth(req,res,ctrl,next);
	});
	app.get('/admin/employees',function(req, res, next) {
		var ctrl = req.path.split('/admin/')[1];
		auth(req,res,ctrl,next);
	});
	app.get('/admin/vir8',function(req, res, next) {
		var ctrl = req.path.split('/admin/')[1];
		auth(req,res,ctrl,next);
	});
	app.get('/admin/users',function(req, res, next) {
		var ctrl = req.path.split('/admin/')[1];
		auth(req,res,ctrl,next);
	});
	app.get('/admin/members',function(req, res, next) {
		var ctrl = req.path.split('/admin/')[1];
		auth(req,res,ctrl,next);
	});
	app.get('/admin/test', function(req, res, next) {
		res.sendfile(DIRNAME+'/public/html/test.html');
	});

	app.get('/admin/customer/*', function(req, res, next) {
		var ctrl = req.path.split('/admin/customer/')[1];
		customer[ctrl](req,res,next);
	});
	app.post('/admin/customer/*', function(req, res, next) {
		var ctrl = req.path.split('/admin/customer/')[1];
		customer[ctrl](req,res,next);
	});
	app.delete('/admin/customer/*', function(req, res, next) {
		var ctrl = req.path.split('/admin/customer/')[1];
		customer[ctrl](req,res,next);
	});

	app.get('/admin/contact/*', function(req, res, next) {
		var ctrl = req.path.split('/admin/contact/')[1];
		contact[ctrl](req,res,next);
	});
	app.post('/admin/contact/*', function(req, res, next) {
		var ctrl = req.path.split('/admin/contact/')[1];
		contact[ctrl](req,res,next);
	});
	app.delete('/admin/contact/*', function(req, res, next) {
		var ctrl = req.path.split('/admin/contact/')[1];
		contact[ctrl](req,res,next);
	});

	app.get('/admin/employee/*', function(req, res, next) {
		var ctrl = req.path.split('/admin/employee/')[1];
		employee[ctrl](req,res,next);
	});
	app.post('/admin/employee/*', function(req, res, next) {
		var ctrl = req.path.split('/admin/employee/')[1];
		employee[ctrl](req,res,next);
	});
	app.delete('/admin/employee/*', function(req, res, next) {
		var ctrl = req.path.split('/admin/employee/')[1];
		employee[ctrl](req,res,next);
	});
	app.get('/admin/employees/employeeId', function(req, res, next) {
		employee.employeeId(req,res,next);
	});
	app.get('/admin/employees/getAllList', function(req, res, next) {
		employee.getAllList(req,res,next);
	});
	app.get('/admin/vir8/info', function(req, res, next) {
		vir.getInfo(req,res,next);
	});
	app.get('/admin/vir8/search', function(req, res, next) {
		vir.search(req,res,next);
	});
	app.get('/admin/vir8/sort', function(req, res, next) {
		vir.sort(req,res,next);
	});
	app.get('/admin/vir8/getPage', function(req, res, next) {
		vir.getPage(req,res,next);
	});
	app.post('/admin/vir8/add', function(req, res, next) {
		vir.add(req,res,next);
	});
	app.post('/admin/vir8/update', function(req, res, next) {
		vir.update(req,res,next);
	});
	app.delete('/admin/vir8/del', function(req, res, next) {
		vir.del(req,res,next);
	});
	app.post('/admin/vir8/putInfo', function(req, res, next) {
		vir.putInfo(req,res,next);
	});
	app.get('/admin/vir8/searchInput', function(req, res, next) {
		vir.searchInput(req,res,next);
	});

	app.get('/admin/users/info', function(req, res, next) {
		users.getInfo(req,res,next);
	});
	app.get('/admin/users/search', function(req, res, next) {
		users.search(req,res,next);
	});
	app.get('/admin/users/sort', function(req, res, next) {
		users.sort(req,res,next);
	});
	app.get('/admin/users/getPage', function(req, res, next) {
		users.getPage(req,res,next);
	});
	app.post('/admin/users/update', function(req, res, next) {
		users.update(req,res,next);
	});
	app.post('/admin/users/add', function(req, res, next) {
		users.add(req,res,next);
	});
	app.delete('/admin/users/del', function(req, res, next) {
		users.del(req,res,next);
	});
	app.get('/admin/users/getImg', function(req, res, next) {
		users.getImg(req,res,next);
	});
	app.post('/admin/users/uploadImg', function(req, res, next) {
		users.uploadImg(req,res,next);
	});
	app.post('/admin/users/cover', function(req, res, next) {
		users.cover(req,res,next);
	});
	app.post('/admin/users/delImg', function(req, res, next) {
		users.delImg(req,res,next);
	});

	app.get('/admin/member/getPage', function(req, res, next) {
		member.getPage(req,res,next);
	});
	app.get('/admin/member/sort', function(req, res, next) {
		member.sort(req,res,next);
	});
	app.get('/admin/member/search', function(req, res, next) {
		member.search(req,res,next);
	});
	app.get('/admin/member/info', function(req, res, next) {
		member.info(req,res,next);
	});
	app.post('/admin/member/sub_check', function(req, res, next) {
		member.subCheck(req,res,next);
	});

	app.get('/admin/contracts',function(req,res,next){
		var ctrl = req.path.split('/admin/')[1];
		auth(req,res,ctrl,next);
	});
	// app.get('/admin/contract/goodsList',function(req,res,next){
	// 	contract.goodsList(req,res,next);
	// });
	// app.get('/admin/contract/search',function(req,res,next){
	// 	contract.search(req,res,next);
	// });
	// app.get('/admin/contract/no',function(req,res,next){
	// 	contract.info(req,res,next);
	// });
	// app.get('/admin/contract/page_default',function(req,res,next){
	// 	contract.pageDef(req,res,next);
	// });
	// app.get('/admin/contract/sort',function(req,res,next){
	// 	contract.sort(req,res,next);
	// });
	// app.delete('/admin/contract/del',function(req,res,next){
	// 	contract.del(req,res,next);
	// });
	// app.get('/admin/contract/transId',function(req,res,next){
	// 	contract.transId(req,res,next);
	// });
	// app.post('/admin/contract/update',function(req,res,next){
	// 	contract.update(req,res,next);
	// });
	// app.get('/admin/contract/searchInput',function(req,res,next){
	// 	contract.searchInput(req,res,next);
	// });
	app.get('/admin/contract/getImg',function(req,res,next){
		contract.getImg(req,res,next);
	});
	app.post('/admin/contract/uploadImg',function(req,res,next){
		contract.uploadImg(req,res,next);
	});
	app.post('/admin/contract/cover',function(req,res,next){
		contract.cover(req,res,next);
	});
	app.post('/admin/contract/delImg',function(req,res,next){
		contract.delImg(req,res,next);
	});
	// app.get('/admin/contract/searchMore',function(req,res,next){
	// 	contract.searchMore(req,res,next);
	// });
	// app.get('/admin/contract/filter',function(req,res,next){
	// 	contract.filter(req,res,next);
	// });


	app.get('/admin/repairs',function(req,res,next){
		var ctrl = req.path.split('/admin/')[1];
		auth(req,res,ctrl,next);
	});
	app.get('/admin/repair/no',function(req,res,next){
		repair.info(req,res,next);
	});
	app.get('/admin/repair/page_default',function(req,res,next){
		repair.pageDef(req,res,next);
	});
	app.get('/admin/repair/search',function(req,res,next){
		repair.search(req,res,next);
	});
	app.get('/admin/repair/sort',function(req,res,next){
		repair.sort(req,res,next);
	});
	app.get('/admin/repair/insertData',function(req,res,next){
		repair.insertData(req,res,next);
	});
	app.get('/admin/repair/updateData',function(req,res,next){
		repair.updateData(req,res,next);
	});
	app.get('/admin/repair/updateOneData',function(req,res,next){
		repair.updateOneData(req,res,next);
	});
	app.post('/admin/repair/del',function(req,res,next){
		repair.del(req,res,next);
	});
	app.post('/admin/repair/sub',function(req,res,next){
		repair.sub(req,res,next);
	});
	app.post('/admin/repair/nextStatus',function(req,res,next){
		repair.nextStatus(req,res,next);
	});
	app.get('/admin/repair/getImg',function(req,res,next){
		repair.getImg(req,res,next);
	});
	app.post('/admin/repair/uploadImg',function(req,res,next){
		repair.uploadImg(req,res,next);
	});
	app.post('/admin/repair/cover',function(req,res,next){
		repair.cover(req,res,next);
	});
	app.post('/admin/repair/delImg',function(req,res,next){
		repair.delImg(req,res,next);
	});
	app.post('/admin/repair/add',function(req,res,next){
		repair.add(req,res,next);
	});
	app.get('/admin/repair/searchInput',function(req,res,next){
		repair.searchInput(req,res,next);
	});
	app.get('/admin/repair/searchHistory',function(req,res,next){
		repair.searchHistory(req,res,next);
	});

	app.get('/admin/knowledge',function(req,res,next){
		var ctrl = req.path.split('/admin/')[1];
		auth(req,res,ctrl,next);
	});
	app.get('/admin/knowledge/no',function(req,res,next){
		knowledge.info(req,res,next);
	});
	app.get('/admin/knowledge/page_default',function(req,res,next){
		knowledge.pageDef(req,res,next);
	});
	app.get('/admin/knowledge/search',function(req,res,next){
		knowledge.search(req,res,next);
	});
	app.get('/admin/knowledge/sort',function(req,res,next){
		knowledge.sort(req,res,next);
	});
	app.post('/admin/knowledge/add',function(req,res,next){
		knowledge.add(req,res,next);
	});
	app.post('/admin/knowledge/del',function(req,res,next){
		knowledge.del(req,res,next);
	});
	app.get('/admin/knowledge/getTags',function(req,res,next){
		knowledge.getTags(req,res,next);
	});
	app.get('/admin/knowledge/getDoc',function(req,res,next){
		knowledge.getDoc(req,res,next);
	});
	app.get('/admin/knowledge/getRes',function(req,res,next){
		knowledge.getRes(req,res,next);
	});
	app.post('/admin/knowledge/sub',function(req,res,next){
		knowledge.sub(req,res,next);
	});
	app.get('/admin/knowledge/getImg',function(req,res,next){
		knowledge.getImg(req,res,next);
	});
	app.post('/admin/knowledge/uploadImg',function(req,res,next){
		knowledge.uploadImg(req,res,next);
	});
	app.post('/admin/knowledge/delImg',function(req,res,next){
		knowledge.delImg(req,res,next);
	});
	app.post('/admin/knowledge/cover',function(req,res,next){
		knowledge.cover(req,res,next);
	});
	app.post('/admin/knowledge/uploadFile',function(req,res,next){
		knowledge.uploadFile(req,res,next);
	});
	app.post('/admin/knowledge/uploadFileRes',function(req,res,next){
		knowledge.uploadFileRes(req,res,next);
	});
	app.post('/admin/knowledge/continueUpload',function(req,res,next){
		knowledge.continueUpload(req,res,next);
	});
	app.get('/admin/knowledge/doc_search',function(req,res,next){
		knowledge.docSearch(req,res,next);
	});
	app.post('/admin/knowledge/delTag',function(req,res,next){
		knowledge.delTag(req,res,next);
	});

	function distRoute(req,res,next){
		var deviceAgent = req.headers['user-agent'].toLowerCase();  
	    var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
		if(agentID){
			var url = req.url;
			res.redirect('m/admin'+url);
		}else{
			next();
		}
	}

	function isPc(req,res,next){
		var deviceAgent = req.headers['user-agent'].toLowerCase();  
	    var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
		if(agentID){
			res.redirect('m/admin');
		}else{
			auth(req,res,'admin',next);
		}
	}

	function auth(req,res,ctrl,next){
		var user = basicAuth(req);
		if (!user) {
			res.statusCode = 401;
			res.setHeader('WWW-Authenticate', 'Basic realm="langjie"');
			res.send('请输入工号和密码登陆');
		}
		var _name = user.name,pass = user.pass;
		if((/\d/.test(_name)==true)||(/[\u4e00-\u9fa5]/.test(_name)==true)){
			var name = _name;
		}else{
			var name = _name.toLowerCase();
		}
		var md5 = crypto.createHash('md5');
		var password = md5.update(pass).digest('hex');
		mod_admin.auth(name,function(rows){
			if(rows.msg=='err'){
				res.statusCode = 401;
				res.setHeader('WWW-Authenticate', 'Basic realm="langjie"');
				res.send('工号不存在');
			}else{
				if(password==rows[0].pwd){
					if(ctrl=='vir8'){
						vir.renderPage(req,res,next);
					}else if(ctrl=='users'){
						users.renderPage(req,res,next);
					}else if(ctrl=='members'){
						member.renderPage(req,res,next);
					}else if(ctrl=='contracts'){
						contract.list(req,res,next);
					}else if(ctrl=='repairs'){
						repair.list(req,res,next);
					}else if(ctrl=='knowledge'){
						knowledge.list(req,res,next);
					}else{
						res.sendfile(DIRNAME+'/public/html/'+ctrl+'.html');
					}
				}else{
					res.statusCode = 401;
					res.setHeader('WWW-Authenticate', 'Basic realm="langjie"');
					res.send('密码不正确');
				}
			}
		});
	}
}