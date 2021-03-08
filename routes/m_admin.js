var express = require('express');
var url = require('url');
var path = require('path');
var basicAuth = require('basic-auth');
var crypto = require('crypto');
var m_customers = require('../controllers/m_customers');
var m_contacts = require('../controllers/m_contacts');
var m_employees = require('../controllers/m_employees');
var m_member = require('../controllers/admin_member');
var mod_admin = require('../model/mod_admin');
var m_users = require('../controllers/m_users');
var m_inter = require('../controllers/m_intercourse');
var intercourse = require('../controllers/intercourse');

module.exports = function(app){
	app.use('/m/admin', function(req, res, next) {
		check(req,res,next);
	});
	app.use('/m/admin_ajax', function(req, res, next) {
		checkAjax(req,res,next);
	});
	app.get('/m/admin', function(req, res, next) {
		res.render('./pages/m_admin');
	});
	//customers
	app.get('/m/admin/customers', function(req, res, next) {
		m_customers.list(req,res,next);
	});
	app.get('/m/admin/mainCustomer/*', function(req, res, next) {
		m_customers.mainCustomer(req,res,next);
	});
	//ajax部分
	app.get('/m/admin_ajax/customers/getList', function(req, res, next) {
		m_customers.list(req,res,next);
	});
	app.get('/m/admin_ajax/customers/index_list', function(req, res, next) {
		m_customers.index_list(req,res,next);
	});
	app.get('/m/admin_ajax/customers/search', function(req, res, next) {
		m_customers.search(req,res,next);
	});
	app.post('/m/admin_ajax/customers/createCpy', function(req, res, next) {
		m_customers.createCpy(req,res,next);
	});
	app.delete('/m/admin_ajax/customers/del', function(req, res, next) {
		m_customers.del(req,res,next);
	});
	app.get('/m/admin_ajax/customers/sort', function(req, res, next) {
		m_customers.sort(req,res,next);
	});
	app.post('/m/admin_ajax/customers/update', function(req, res, next) {
		m_customers.update(req,res,next);
	});

	
	//contacts
	app.get('/m/admin/contacts', function(req, res, next) {
		m_contacts.list(req,res,next);
	});
	app.get('/m/admin/mainContact/*', function(req, res, next) {
		m_contacts.mainContact(req,res,next);
	});
	//ajax部分
	app.get('/m/admin_ajax/contacts/getList', function(req, res, next) {
		m_contacts.list(req,res,next);
	});
	app.get('/m/admin_ajax/contacts/search', function(req, res, next) {
		m_contacts.search(req,res,next);
	});
	app.get('/m/admin_ajax/contacts/getContacts', function(req, res, next) {
		m_contacts.getContacts(req,res,next);
	});
	app.get('/m/admin_ajax/contacts/index_list', function(req, res, next) {
		m_contacts.index_list(req,res,next);
	});
	app.get('/m/admin_ajax/contacts/sort', function(req, res, next) {
		m_contacts.sort(req,res,next);
	});
	app.post('/m/admin_ajax/contacts/createCpy', function(req, res, next) {
		m_contacts.createCpy(req,res,next);
	});
	app.post('/m/admin_ajax/contacts/update', function(req, res, next) {
		m_contacts.update(req,res,next);
	});
	app.delete('/m/admin_ajax/contacts/del', function(req, res, next) {
		m_contacts.del(req,res,next);
	});

	//employees
	app.get('/m/admin/employees', function(req, res, next) {				
		m_employees.list(req,res,next);
	});
	app.get('/m/admin/mainEmployee/*', function(req, res, next) {				
		m_employees.mainEmployee(req,res,next);
	});
	//ajax部分
	app.get('/m/admin_ajax/employees/getList', function(req, res, next) {		
		m_employees.list(req,res,next);
	});
	app.get('/m/admin_ajax/employees/search', function(req, res, next) {		
		m_employees.search(req,res,next);
	});
	// app.get('/m/admin_ajax/employees/getContacts', function(req, res, next) {
	// 	m_employees.getContacts(req,res,next);
	// });
	app.get('/m/admin_ajax/employees/index_list', function(req, res, next) {	
		m_employees.index_list(req,res,next);
	});
	app.get('/m/admin_ajax/employees/sort', function(req, res, next) {			
		m_employees.sort(req,res,next);
	});
	app.post('/m/admin_ajax/employees/createCpy', function(req, res, next) {	
		m_employees.createCpy(req,res,next);
	});
	app.post('/m/admin_ajax/employees/update', function(req, res, next) {
		m_employees.update(req,res,next);
	});
	app.delete('/m/admin_ajax/employees/del', function(req, res, next) {		
		m_employees.del(req,res,next);
	});

	//users
	app.get('/m/admin/users', function(req, res, next) {
		m_users.list(req,res,next);
	});
	app.get('/m/admin/mainUser/*', function(req, res, next) {				
		m_users.mainUsers(req,res,next);
	});
	//ajax部分
	app.get('/m/admin_ajax/users/getList', function(req, res, next) {		
		m_users.list(req,res,next);
	});
	app.get('/m/admin_ajax/users/index_list', function(req, res, next) {	
		m_users.index_list(req,res,next);
	});
	app.get('/m/admin_ajax/users/search', function(req, res, next) {		
		m_users.search(req,res,next);
	});
	app.get('/m/admin_ajax/users/sort', function(req, res, next) {			
		m_users.sort(req,res,next);
	});
	app.delete('/m/admin_ajax/users/del', function(req, res, next) {		
		m_users.del(req,res,next);
	});
	app.post('/m/admin_ajax/users/createCpy', function(req, res, next) {	
		m_users.createCpy(req,res,next);
	});
	app.post('/m/admin_ajax/users/update', function(req, res, next) {
		m_users.update(req,res,next);
	});


	//member
	app.get('/m/admin/members', function(req, res, next) {
		m_member.reviewList(req,res,next);
	});
	app.get('/m/admin/mainMember', function(req, res, next) {
		m_member.memberReview(req,res,next);
	});
	app.get('/m/admin/member_select', function(req, res, next) {
		m_member.memberSelect(req,res,next);
	});
	app.get('/m/admin/member_send', function(req, res, next) {
		m_member.memberSend(req,res,next);
	});
	//ajax部分
	app.get('/m/admin_ajax/member/getList', function(req, res, next) {
		m_member.reviewList(req,res,next);
	});
	app.get('/m/admin_ajax/member/index_reviewList', function(req,res,next) {
		m_member.index_reviewList(req,res,next);
	});
	app.get('/m/admin_ajax/member/search', function(req,res,next) {
		m_member.search(req,res,next);
	});
	app.post('/m/admin_ajax/member/sub_check', function(req,res,next) {
		m_member.subCheck(req,res,next);
	});
	app.get('/m/admin_ajax/member/sort', function(req,res,next) {
		m_member.sort(req,res,next);
	});
	app.get('/m/admin_ajax/member/search_member', function(req,res,next) {
		m_member.searchMember(req,res,next);
	});

	//cus
	// app.get('/m/admin/cus', function(req, res, next) {
	// 	m_inter.list(req,res,next);
	// });
	app.get('/m/admin/intercourses', function(req, res, next) {
		m_inter.list(req,res,next);
	});
	app.get('/m/admin_ajax/cus', function(req, res, next) {
		m_inter.list(req,res,next);
	});
	app.get('/m/admin/inter_action/*', function(req, res, next) {
		m_inter.action(req,res,next);
	});
	app.post('/m/admin_ajax/intercourse/sub', function(req, res, next) {
		// m_inter.sub(req,res,next);
		intercourse.sub(req,res,next);
	});
	app.post('/m/admin_ajax/intercourse/addTemp', function(req, res, next) {
		// m_inter.addTemp(req,res,next);
		intercourse.addTemp(req,res,next);
	});
	app.post('/m/admin_ajax/intercourse/star', function(req, res, next) {
		// m_inter.star(req,res,next);
		intercourse.star(req,res,next);
	});
	app.post('/m/admin_ajax/intercourse/add', function(req, res, next) {
		// m_inter.add(req,res,next);
		intercourse.add(req,res,next);
	});
	app.get('/m/admin_ajax/intercourse/search', function(req, res, next) {
		m_inter.search(req,res,next);
	});
	app.post('/m/admin_ajax/intercourse/del', function(req, res, next) {
		// m_inter.del(req,res,next);
		intercourse.del(req,res,next);
	});
	app.post('/m/admin_ajax/inter_upload', function(req, res, next) {
		m_inter.uploadImg(req,res,next);
	});


	function check(req,res,next){
		CHECKSESSION(req,res,'admin_id',function(result){
			if(result==200||result==100){
				var open_id = req.session.admin_id;
				if(/^\d+$/.test(open_id)){
					next();
					return;
				}
				mod_admin.authOpenId(open_id,function(rows){
					if(rows[0]==null){
						// res.send(open_id);
						delete req.session.admin_id;
						TIP(res,'未授权');
					}else{
						req.session.admin_id = rows[0].user_id;
						next();
					}
				});
			}else{
				auth(req,res,next);
			}
		});
	}
	function checkAjax(req,res,next){
		if(!req.session.admin_id){
			SEND(res,-100,'身份过期，请重新进入',[]);
			return;
		}else{
			next();
		}
	}

	function auth(req,res,next){
		var user = basicAuth(req);
		if (!user) {
			var deviceAgent = req.headers['user-agent'].toLowerCase();
			if(deviceAgent.match(/MicroMessenger/i)=="micromessenger"){
				var pathName = url.parse(req.url).pathname;
				var appid = 'wx0f012ab2b8db902d';
				var redirect = encodeURIComponent(CONFIG.wxRedirectUrl);
				var params = req.url.split('?')[1];
				params = params?'?'+params:'';
				var _state = ROUTER(req)+'/admin'+pathName+params;
				var state = _state.replace(/&/,'$');
				var str = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+appid+"&redirect_uri="+redirect+"&response_type=code&scope=snsapi_userinfo&state="+state+"#wechat_redirect";
				res.redirect(str);
			}else{
				res.statusCode = 401;
				res.setHeader('WWW-Authenticate', 'Basic realm="langjie"');
				TIP(res,'请使用微信或者浏览器进入');
			}
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
				TIP(res,'工号不存在');
			}else{
				if(password==rows[0].pwd){
					req.session.admin_id = rows[0].user_id;
					next();
				}else{
					res.statusCode = 401;
					res.setHeader('WWW-Authenticate', 'Basic realm="langjie"');
					TIP(res,'密码不正确');
				}
			}
		});
	}

	app.get('/m/home',(req,res,next) => {
		res.sendFile(DIRNAME+'/public/html/frame2.html');
	});

	app.get('/m/home/affair',(req,res,next) => {
		res.sendFile(DIRNAME+'/public/html/mAffair.html');
	});
}


