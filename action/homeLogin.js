const url = require('url');
const path = require('path');
const request = require('request');
const serviceHomeLogin = require('../service/homeLogin');
const Member = require('../dao').Member;
const Staff = require('../dao').Staff;

/**
 *	登陆
 */
this.login = (req,res,next) => {
	let params = req.body;
	// let params = url.parse(req.url,true).query;
	serviceHomeLogin.login(params,(result) => {
		if(result.code==200){
			res.header('token', result.data[0].token);
		}
		res.status(result.code);
		res.send(result);
	});
}

this.wxLoginCheck = (req, res, next) => {
	const { code } = req.body;
	const { wxLoginAppid, wxLoginSecret } = CONFIG;
	getOpenIdByCode(code);
	function getOpenIdByCode(code){
	    var cdurl = "https://api.weixin.qq.com/sns/oauth2/access_token?appid="+wxLoginAppid+"&secret="+wxLoginSecret+"&code="+code+"&grant_type=authorization_code";
	    request.get(cdurl,function(err,response,body){
			var bodys = JSON.parse(body);
			if (bodys.errcode) {
				res.send({
					code: -100,
					msg: '登陆失败',
					data: bodys,
				});
			} else {
				const { unionid } = bodys;
				Member.findOne({
					where: {
						unionid,
					}
				}).then(result => {
					if (!result) return res.send({
						code: -1,
						msg: '非法用户',
						data: result,
					});
					const { open_id, isdel, checked } = result.dataValues;
					if (isdel == 1 || checked == 0) {
						return res.send({
							code: -1,
							msg: '非法用户',
							data: result,
						});
					}
					Staff.findOne({
						where: {
							open_id,
							on_job: 1,
							isdel: 0
						}
					}).then(result => {
						if (!result) return res.send({
							code: -1,
							msg: '非法用户',
							data: result,
						});
						const { user_name, pwd } = result.dataValues;
						serviceHomeLogin.login2({
							userName: user_name,
							passWord: pwd,
						}, result => {
							res.send(result);
						});
					}).catch(e => LOG(e));
				}).catch(e => LOG(e));
			}
	    });
	}
}