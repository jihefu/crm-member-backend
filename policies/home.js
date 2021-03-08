const url = require('url');
const path = require('path');
const base = require('../service/base');
const serviceHomeLogin = require('../service/homeLogin');
const Staff = require('../dao').Staff;
const RoleMenu = require('../dao').RoleMenu;
const Menu = require('../dao').Menu;

this.checkSessionExist = async (req,res,next) => {
	let token = req.headers['token'];
	const urlParams = url.parse(req.url, true).query;
	if (urlParams.token) {
		token = urlParams.token;
	}
	if(token==undefined){
		res.status(401);
		res.send({
			code: 401,
			msg: '身份过期',
			data: []
		});
		return;
	}
	const r = await serviceHomeLogin.openCheckToken({ token });
	if(r.code==200){
		const { userId } = r.data;
		req.session.admin_id = userId;
		next();
	}else{
		res.status(401);
		res.send({
			code: 401,
			msg: r.msg,
			data: []
		});
	}
}

/*判断是否有访问该路由的权限*/
this.checkUrl = (req,userId,cb) => {
	let params;
	if(req.method=='GET'){
		params = url.parse(req.url,true).query;
	}else{
		params = req.body;
	}
	let pageUrl = params.pageUrl;
	if(pageUrl){
		check((status) => {
			if(status==200){
				cb({
					code: 200
				});
			}else{
				cb({
					code: -1
				});
			}
		});
	}else{
		cb({
			code: 200
		});
	}

	function check(cb){
		Staff.findOne({
			where: {
				user_id: userId,
				isdel: 0
			}
		}).then(result => {
			let roleId = result.dataValues.roleId;
			RoleMenu.findAll({
				where: {
					roleId: roleId
				}
			}).then(result => {
				let res_arr = [];
				result.forEach((items,index) => {
					res_arr.push(items.dataValues.menuId);
				});
				Menu.findAll({
					where: {
						url: pageUrl
					}
				}).then(result => {
					let url_res_arr = [];
					result.forEach((items,index) => {
						url_res_arr.push(items.dataValues.id);
					});
					for (var i = 0; i < res_arr.length; i++) {
						for (var j = 0; j < url_res_arr.length; j++) {
							if(res_arr[i]==url_res_arr[j]){
								cb(200);
								break;
							}else if(i==res_arr.length-1&&j==url_res_arr.length-1&&res_arr[i]!=url_res_arr[j]){
								cb(-1);
							}
						}
					}
				}).catch(e => LOG(e));
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}
}