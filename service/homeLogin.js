const crypto = require('crypto');
const Staff = require('../dao').Staff;
const Member = require('../dao').Member;
const base = require('./base');
const request = require('request');

this.openCreateToken = async params => {
	return await new Promise(resolve => {
		request.post(CONFIG.cloudApiAddr + '/login/openCreateToken', {
			form: params,
		}, (err, res, body) => {
			if (body) {
				resolve(JSON.parse(body));
			}
		});
	});
}

this.openCheckToken = async params => {
	return await new Promise(resolve => {
		request.post(CONFIG.cloudApiAddr + '/login/openCheckToken', {
			form: params,
		}, (err, res, body) => {
			if (body) {
				resolve(JSON.parse(body));
			}
		});
	});
}

const expiresion = 60 * 60 * 24 * 30 * 6 * 1000;
this.login = (params,cb) => {
	let { userName,passWord } = params;
	// console.log(params);
	Staff.findOne({
		where: {
			isdel: 0,
			on_job: 1,
			'$or': {
				user_id: userName,
				user_name: userName,
				English_name: userName,
				English_abb: userName
			}
		}
	}).then(async result => {
		if(!result){
			cb({
				code: 401,
				msg: '账号不存在',
				data: []
			});
		}else{
			const data = result.dataValues;
			let md5 = crypto.createHash('md5');
			passWord = md5.update(passWord).digest('hex');
			if(passWord==data.pwd){
				//生成token
				const tokenRes = await this.openCreateToken({
					expiresion,
					payload: {
						userId: data.user_id,
						passWord: data.pwd,
					},
				});
				cb({
					code: 200,
					msg: '登陆成功',
					data: [{
						user_id: data.user_id,
						user_name: data.user_name,
						unionid: await getUnionId(data.user_id),
						token: tokenRes.data.token,
					}]
				});
			}else{
				cb({
					code: 401,
					msg: '密码不正确',
					data: []
				});
			}
		}
	}).catch(e => LOG(e));
}

this.login2 = (params,cb) => {
	let { userName,passWord } = params;
	// console.log(params);
	Staff.findOne({
		where: {
			isdel: 0,
			on_job: 1,
			'$or': {
				user_id: userName,
				user_name: userName,
				English_name: userName,
				English_abb: userName
			}
		}
	}).then(async result => {
		if(!result){
			cb({
				code: 401,
				msg: '账号不存在',
				data: []
			});
		}else{
			const data = result.dataValues;
			// let md5 = crypto.createHash('md5');
			// passWord = md5.update(passWord).digest('hex');
			if(passWord==data.pwd){
				const tokenRes = await this.openCreateToken({
					expiresion,
					payload: {
						userId: data.user_id,
						passWord: data.pwd,
					},
				});
				cb({
					code: 200,
					msg: '登陆成功',
					data: [{
						user_id: data.user_id,
						user_name: data.user_name,
						unionid: await getUnionId(data.user_id),
						token: tokenRes.data.token,
					}]
				});
			}else{
				cb({
					code: 401,
					msg: '密码不正确',
					data: []
				});
			}
		}
	}).catch(e => LOG(e));
}

async function getUnionId(user_id) {
	const staffEntity = await Staff.findOne({ where: { user_id, isdel: 0 } });
	const { open_id } = staffEntity.dataValues;
	const memberEntity = await Member.findOne({ where: { open_id } });
	const { unionid } = memberEntity.dataValues;
	return unionid;
}