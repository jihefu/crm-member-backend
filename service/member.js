var express = require('express');
var url = require('url');
var path = require('path');
var request = require('request');
var fs = require('fs');
var dealImages = require('images');
var base = require('./base');
var common = require('./common');
var formidable = require('formidable');
var mod_member = require('../model/mod_member');
var sequelize = require('../dao').sequelize;
var Member = require('../dao').Member;
var Staff = require('../dao').Staff;
var Customers = require('../dao').Customers;
var Users = require('../dao').Users;
var Products = require('../dao').Products;
var RegEvent = require('../dao').RegEvent;
var AppNameLib = require('../dao').AppNameLib;
var ItemScore = require('../dao').ItemScore;
var MemberScore = require('../dao').MemberScore;
var MemberSignScore = require('../dao').MemberSignScore;
var MemberMsg = require('../dao').MemberMsg; 
var SignActivity = require('../dao').SignActivity; 
var SignScore = require('../dao').SignScore; 
var CreditRecords = require('../dao').CreditRecords; 
var ContractsHead = require('../dao').ContractsHead; 
var Payment = require('../dao').Payment;
var AnnualPayment = require('../dao').AnnualPayment;
const serviceAffairs = require('./homeRoutineAffairs');
const sendMQ = require('./rabbitmq').sendMQ;
const BaseEvent = require('../dao').BaseEvent;
const VerUnit = require('../dao').VerUnit;
const aliSms = require('../action/aliSms');
const serviceHomeCustomers = require('./homeCustomers');
const serviceHomeWallet = require('./homeWallet');
const serviceHomeMember = require('./homeMember');
const VirWarranty = require('../dao').VirWarranty;
const goodsForYBScore = require('./goodsForYBScore');
const GoodsForYBScore = require('../dao').GoodsForYBScore;
const FreeExchangeGift = require('../dao').FreeExchangeGift;
const redisUtil = require('./redis');
const moment = require('moment');

/**
 * 11111111111111111111
 */
this.memberInfo = function(params,cb){
	var open_id = params.open_id;
	Member.findAll({
		attributes: {exclude: ['mult_company']},
		where: {
			open_id: open_id
		}
	}).then(function(result){
		var res_obj = result[0].dataValues;
		MemberMsg.findAndCountAll({
			where: {
				openid: open_id,
				is_read: 0
			},
			offset: 0,
			limit: 5,
			order: [['id', 'DESC']],
		}).then(function(result){
			res_obj.count = result.count;
			res_obj.msgRows = result.rows;
			MemberScore.findAll({
				attributes: ['basic', 'business', 'certificate', 'activity', 'total'],
				where: {
					openid: open_id,
				}
			}).then(function(result){
				for(var i in result[0].dataValues){
					res_obj[i] = result[0].dataValues[i];
				}
				cb(res_obj);
			}).catch(function(e){
				LOG(e);
			});
		}).catch(function(e){
			LOG(e);
		});
	}).catch(function(e){
		LOG(e);
	});
}
//vip_basic表111111111111
function getMemberInfo(params,cb){
	Member.findAll({
		where: {
			open_id: params.open_id,
			// name: params.name,
			// phone: params.phone
		}
	}).then(function(result){
		cb(result[0].dataValues);
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	会员首页111111111111
 */
this.mainInfo = function(params,cb){
	var open_id = params.open_id;
	var that = this;
	Member.findAll({
		where: {
			open_id: open_id,
			company: '杭州朗杰测控技术开发有限公司',
			check_company: 1,
			checked: 1,
		}
	}).then(function(result){
		if(result[0]==null){
			customerMember(params);
			return;
		}else{
			var name = result[0].dataValues.name;
		}
		Staff.findAll({
			where: {
				user_name: name
			}
		}).then(function(result){
			if(result[0]==null){
				cb({
					code: -1,
					msg: '员工信息未录入',
					data: []
				});
				return;
			}else{
				Staff.update({
					open_id: open_id
				},{
					where: {
						user_name: name
					}
				}).then(function(result){
					cb({
						code: 100,
						msg: '员工',
						data: []
					});
				}).catch(function(e){
					LOG(e);
				});
			}
		}).catch(function(e){
			LOG(e);
		});
	}).catch(function(e){
		LOG(e);
	});
	function customerMember(params){
		that.memberInfo(params, async function(result){
			var legal_person = false;
			var hasPower = false;
			const { company, unionid } = result;
			const jobArr = result.job.split(',');
			let coupsCount = 0, deposCount = 0;
			let over_time = 0;
			if((jobArr.indexOf('法人')!=-1||jobArr.indexOf('合伙人')!=-1)&&result.check_job==1){
				legal_person = true;
				hasPower = true;
			}
			if((jobArr.indexOf('采购')!=-1||jobArr.indexOf('财务')!=-1)&&result.check_job==1){
				hasPower = true;
			}
			const staffCount = await Member.count({
				where: {
					company: result.company,
					open_id: {
						'$ne': open_id
					},
					job: {
						'$ne': '法人'
					},
					isEffect: 1,
				}
			});
			const scoreEntity = await that.score(open_id);
			const trainLog = await serviceHomeMember.getTrainLog({
				open_id,
			});
			const customerEntity = await Customers.findOne({
				where: {
					company,
					isdel: 0,
				},
			});
			let star = 0;
			if (customerEntity) star = customerEntity.dataValues.star;
			const userCardLen = await VirWarranty.count({
				where: {
					isdel: 0,
					bind_unionid: unionid,
				},
			});
			cb({
				code: 200,
				msg: '',
				data: {
					result: result,
					legal_person: legal_person,
					hasPower,
					staffCount,
					coupsCount,
					deposCount,
					over_time,
					score: scoreEntity,
					certLen: trainLog.data.length,
					star,
					userCardLen,
				}
			});
		});
	}
}

/**
 * 会员分数
 */
this.score = async open_id => {
	const scoreEntity = await MemberScore.findOne({ where: { openid: open_id }});
	const result = await new Promise(resolve => {
		this.memberRank({ open_id }, result => resolve(result));
	});
	return {
		rank: result.rank,
		prevScore: result.prevScore,
		scoreEntity,
	};
}

this.walletInfo = async params => {
	const { hasPower, company } = params;
	const that = this;
	let creditInfo, coupsCount = 0, deposCount = 0;
	if (hasPower == 1) {
		await new Promise(resolve => {
			serviceHomeCustomers.getTargetItem({
				targetKey: company,
			}, result => {
				const { user_id } = result.data.dataValues;
				serviceHomeWallet.getTargetItem({
					user_id,
				}, result => {
					const { WalletCoups, WalletDepos } = result.data.dataValues;
					WalletCoups.forEach(items => {
						if (items.isPower == 1) {
							coupsCount += Number(items.amount);
						}
					});
					WalletDepos.forEach(items => {
						if (items.isPower == 1) {
							deposCount += Number(items.amount);
						}
					});
					resolve();
				});
			});
		});
		creditInfo = await new Promise(resolve => {
			that.getCreditBasicData({
				company: company,
			}, result => {
				resolve(result);
			});
		});
	}
	return {
		code: 200,
		msg: '',
		data: {
			creditInfo,
			coupsCount,
			deposCount,
		},
	};
}

exports.searchMemberByKeywords = async params => {
	const { keywords } = params;
	const list = await Member.findAll({
		attributes: ['name', 'job', 'check_company', 'check_job', 'open_id'],
		where: {
			$or: {
				name: { $like: '%'+keywords+'%' },
				phone: { $like: '%'+keywords+'%' },
				company: { $like: '%'+keywords+'%' },
			},
			isUser: 1,
		},
	});
	return { code: 200, data: list };
}

/**
 * 会员活动记录
 */
this.activityRecord = async open_id => {
	const result = await serviceHomeMember.getActivityRecord({ open_id });
	return result;
}

/**
 *  获取排名列表
 * 	指定会员所处排名11111111111111111
 */
this.memberRank = async (params,cb) => {
	const { open_id } = params;
	let count, rank, prevScore;
	const memberArr = await Member.findAll({ where: {
		company: '杭州朗杰测控技术开发有限公司',
		checked: 1,
	}});
	const notEffectOpenIdArr = memberArr.map(items => items.dataValues.open_id);
	let scoreArr = await MemberScore.findAll({
		where: {
			openid: { $notIn: notEffectOpenIdArr }
		},
	});
	count = scoreArr.length;
	scoreArr = scoreArr.sort((a, b) => {
		return b.dataValues.total - a.dataValues.total;
	});
	let currentI, currentScore;
	for (let i = 0; i < scoreArr.length; i++) {
		if (scoreArr[i].dataValues.openid == open_id) {
			currentI = i;
			currentScore = scoreArr[i].dataValues.total;
			break;
		}
	}
	rank = currentI + 1;
	prevScore = getPrevScore(currentI);
	cb({
		rankCount: count,
		rank: rank,
		prevScore: prevScore
	});

	function getPrevScore(currentI) {
		if (currentI == 0) return 0;
		--currentI;
		const prevScore = scoreArr[currentI].dataValues.total;
		if (prevScore == currentScore) {
			return getPrevScore(currentI);
		} else {
			return Number(prevScore - currentScore);
		}
	}
	// const scoreEntity = await MemberScore.findOne({
	// 	where: {
	// 		openid: open_id,
	// 	},
	// });
	// const { total } = scoreEntity.dataValues;
	// const { name,phone } = params;
	// MemberScore.findAll({
	// 	order: [['total','DESC']]
	// }).then(result => {
	// 	const p = [];
	// 	let filtedArr = [];
	// 	const deleteArr = [];
	// 	result.forEach((items,index) => {
	// 		p[index] = new Promise((resolve,reject) => {
	// 			const i = index;
	// 			const it = items;
	// 			Member.findOne({
	// 				where: {
	// 					name: items.dataValues.name,
	// 					phone: items.dataValues.phone
	// 				}
	// 			}).then(result => {
	// 				if(result&&result.dataValues&&(result.dataValues.company=='杭州朗杰测控技术开发有限公司')){
	// 					deleteArr.push(it.dataValues.id);
	// 				}
	// 				resolve();
	// 			}).catch(e => LOG(e));
	// 		});
	// 	});
	// 	Promise.all(p).then(() => {
	// 		MemberScore.findAll({
	// 			where: {
	// 				id: {
	// 					'$notIn': deleteArr
	// 				}
	// 			},
	// 			order: [['total','DESC']]
	// 		}).then(result => {
	// 			filtedArr = result;
	// 			const count = filtedArr.length;
	// 			let prevScore = 0;
	// 			let rank = count;
	// 			const getPrevScore = (i,presentI,cb) => {
	// 				if(presentI==0){
	// 					cb(0);
	// 					return;
	// 				}
	// 				const presentEle = filtedArr[presentI].dataValues.total;
	// 				if(filtedArr[i-1].dataValues.total!=presentEle){
	// 					let s = filtedArr[i-1].dataValues.total - presentEle;
	// 					cb(s);
	// 				}else{
	// 					getPrevScore(--i,presentI,cb);
	// 				}
	// 			}
	// 			for (let i = 0; i < filtedArr.length; i++) {
	// 				const element = filtedArr[i];
	// 				if(element.dataValues.phone==phone){
	// 					getPrevScore(i,i,_prevScore => {
	// 						prevScore = _prevScore;
	// 					});
	// 					rank = i+1;
	// 					break;
	// 				}
	// 			}
	// 			cb({
	// 				rankCount: count,
	// 				rank: rank,
	// 				prevScore: prevScore
	// 			});
	// 		}).catch(e => LOG(e));
	// 	}).catch(e => LOG(e));
	// }).catch(e => LOG(e));
}

this.getRangPage = (cb) => {
	const that = this;
	Member.findAll({}).then(result => {
		const p = [];
		const resArr = [];
		result.forEach((items,index) => {
			p[index] = new Promise((resolve,reject) => {
				const it = items;
				if(items.dataValues.company=='杭州朗杰测控技术开发有限公司'||items.dataValues.company=='朗杰测控'||items.dataValues.company=='朗杰中间商'){
					resolve();
				}else{
					MemberScore.findOne({
						where: {
							name: it.dataValues.name,
							phone: it.dataValues.phone
						}
					}).then(result => {
						resArr.push(result);
						resolve();
					}).catch(e => LOG(e));
				}
			});
		});
		Promise.all(p).then(result => {
			const s = (a,b) => {
				return b.total - a.total;
			}
			const res = resArr.sort(s);
			const hashObj = {};
			const endArr = [];
			res.forEach((items,index) => {
				if(!hashObj[items.name]){
					hashObj[items.name] = 1;
					endArr.push(items);
				}
			});
			cb(endArr);
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// 是否添加过介绍人
this.checkAddIntro = async open_id => {
	const exist = await BaseEvent.findOne({ where: { isdel: 0, type: '1308', ownerId: open_id } });
	if (exist) {
		return 1;
	}
	return 0;
}

// 处理绑定
this.dealBind = async params => {
	const { open_id, self_open_id } = params;
	await Member.update({
		bind_id: open_id,
		isEffect: 0,
	}, {
		where: {
			open_id: self_open_id,
		},
	});
	return { code: 200, msg: '绑定成功' };
}

// 处理解除绑定
this.dealUnbind = async params => {
	const { open_id, self_open_id } = params;
	await Member.update({
		bind_id: null,
		isEffect: 1,
	}, {
		where: {
			bind_id: self_open_id,
		},
	});
	return { code: 200, msg: '解绑成功' };
}

/**
 * 	基本信息1111111111111111111
 */
this.basicInfo = function(params,cb){
	getMemberInfo(params,function(result){
		cb(result);
	});
}

/**
 * 	商务信息编辑1111111111111111111
 */
this.businessInfoEdit = function(params,cb){
	var name = params.name;
	var phone = params.phone;
	var open_id = params.open_id;
	getMemberInfo({
		open_id,
		// name: name,
		// phone: phone
	},function(result){
		var position_arr = ['法人','合伙人','注册人','开发','采购','财务','其它'];
		// position_arr.forEach(function(items,index){
		// 	if(items==result.job){
		// 		position_arr.splice(index,1);
		// 	}
		// });
		cb({
			code: 200,
			msg: '',
			data: {
				result: result,
				position_arr: position_arr
			}
		});
	});
}

/**
 * 	签到1111111111111
 */
this.sign = function(params,cb){
	const { open_id } = params;
	sequelize.query('SELECT time FROM base_event WHERE isdel = 0 AND ownerId = "'+open_id+'" AND type = "1301" AND date_format(time,"%Y-%m")=date_format(now(),"%Y-%m")').then(result => {
		const list = result[0];
		const resArr = [];
		list.forEach((items, index) => {
			resArr.push(items.time.getDate() - 1);
		});
		cb({
			code: 200,
			msg: '',
			data: resArr,
		});
	}).catch(e => LOG(e));
	// var name = params.name;
	// var phone = params.phone;
	// sequelize.query('SELECT time FROM sign_activity WHERE name = "'+name+'" AND phone = "'+phone+'" AND date_format(time,"%Y-%m")=date_format(now(),"%Y-%m")',{model: SignActivity}).then(function(result){
	// 	var res_arr = [];
	// 	result.forEach(function(items,index){
	// 		res_arr.push(items.dataValues);
	// 	});
	// 	var m_sign_arr = [];
	// 	res_arr.forEach(function(items,index){
	// 		var d = items.time.getDate()-1;
	// 		m_sign_arr.push(d);
	// 	});
	// 	cb({
	// 		code: 200,
	// 		msg: '',
	// 		data: m_sign_arr
	// 	});
	// });
}


/**
 * 	我的注册历史111111111
 */
this.regHistory = function(params,cb){
	var page = params.page?params.page:1;
	var num = 10;
	getMemberInfo(params,function(result){
		var company = result.company;
		var name = result.name;
		RegEvent.findAll({
			where: {
				name: name,
				company: company
			},
			order: [['id','DESC']],
			limit: num,
			offset: (page-1)*num
		}).then(function(result){
			var res_arr = [];
			result.forEach(function(items,index){
				res_arr.push(items.dataValues);
			});
			cb(res_arr);
		}).catch(function(e){
			LOG(e);
		});
	});
}

/**
 * 历史评级
 */
this.historyStar = async params => {
	const { open_id } = params;
	const memberEntity = await Member.findOne({ where: { open_id }});
	const { company } = memberEntity.dataValues;
	const list = await new Promise(resolve => {
		serviceHomeCustomers.getRatingHistoryList({
			company,
		}, result => resolve(result.data));
	});
	return {
		code: 200,
		msg: '',
		data: list,
	};
}

/**
 * 	我的消息11111111111
 */
this.message = async function(params, cb) {
	const open_id = params.open_id;
	const page = params.page ? params.page : 1;
	const num = 15;
	await MemberMsg.update({
		read_time: TIME(),
		is_read: 1,
	}, {
		where: {
			openid: open_id,
			is_read: 0,
		},
	});
	const result = await MemberMsg.findAll({
		where: {
			$or: {
				openid: open_id,
				sender: open_id,
			},
			isdel: 0
		},
		order: [['post_time', 'DESC']],
		limit: num,
		offset: (page - 1) * num,
	});
	result.forEach(items => {
		items.dataValues.post_time = TIME(items.dataValues.post_time);
	});
	cb(result);
}

/**
 * 会员发送站内私信
 */
exports.sendToMemberMessage = async params => {
	const { open_id, content } = params;
	const memberEntity = await Member.findOne({ where: { open_id } });
	const { name, phone } = memberEntity.dataValues;
	await new Promise(resolve => {
		common.middleMsg({
			name: [name],
			phone: [phone],
			sender: open_id,
			title: '',
			message: content,
			type: 2,
			is_read: 1,
			read_time: TIME(),
		}, () => resolve());
	});
	// 首页通知
	const mailId = Date.now();
	const memberSiteMsgId = CONFIG.memberSiteMsgId;
	const staffList = await serviceAffairs.getStaffFromMemberSiteAffair();
	const NotiClientSubs = staffList.map(receiver => ({
		receiver,
		noti_post_mailId: mailId
	}));
	request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
		console.log(body);
	}).form({
		data: JSON.stringify({
			mailId,
			class: 'respoAffair',
			priority: '普通',
			frontUrl: '/memberAffairs',
			sender: open_id,
			post_time: TIME(),
			title: '会员私信大厅',
			content,
			votes: '已阅',
			noti_client_affair_group_uuid: memberSiteMsgId,
			subscriber: staffList.join(),
			NotiClientSubs,
		})
	});
	return { code: 200, msg: '发送成功' };
}

/**
 * 	提交基本信息111111111
 */
this.subBasicInfo = function(params,cb){
	const open_id = params.open_id;
	var name = params.name;
	var phone = params.phone;
	var newName = params.newName;
	var newPhone = params.newPhone;
	var form_data = params.form_data;
	var change_arr = [];
	var that = this;
	//找出改变的字段
	//创建需要更新的对象
	Member.findAll({
		where: {
			open_id,
		}
	}).then(function(result){
		result = result[0].dataValues;
		for(var i in form_data){
			for(var j in result){
				if(i==j){
					if(form_data[i]!=result[j]){
						change_arr.push(i);
					}
				}
			}
		}
		var update_obj = {},c = 0;
		change_arr.forEach(function(items,index){
			if(items=='gender'||items=='name'||items=='phone'){
				update_obj[items] = form_data[items];
			}else{
				update_obj[items] = form_data[items];
				update_obj['check_'+items] = 0;
				c = 1;
			}
		});
		if(c){
			// update_obj['checked'] = 0;
			update_obj['evaluate'] = 0;
		}
		var check_arr = [];
		for(var i in update_obj){
			check_arr.push(update_obj[i]);
		}
		if(check_arr[0]==null){
			cb({
				code: 200,
				msg: '更新成功',
				data: {}
			});
			return;
		}
		//更新vip_basic表
		Member.update(update_obj,{
			where: {
				open_id,
			}
		}).then(function(result){
			//处理会员分数
			that.dealerMemberScore({
				open_id,
				// name: newName,
				// phone: newPhone
			},function(){
				cb({
					code: 200,
					msg: '更新成功',
					data: {}
				});
				that.msgToAdmin({
					name: newName,
					phone: newPhone,
					open_id,
				},function(){});
			});
		}).catch(function(e){
			LOG(e);
		});
		
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	上传头像111111111111
 */
this.upload = function(params,cb){
	var name = params.name;
	var phone = params.phone;
	var open_id = params.open_id;
	var req = params.req;
	var that = this;
	var form = new formidable.IncomingForm();
	form.encoding = 'utf-8'; 
    form.uploadDir = DIRNAME+'/public/img/member'; //设置上传目录
    form.keepExtensions = true; //保留后缀
    form.type = true;
    form.parse(req, function(err, fields, files) {
    	if (err) {
            LOG(err);
            return;
        }
        var extName = ''; //后缀名
        switch (files.img.type) {
            case 'image/pjpeg':
                extName = 'jpg';
                break;
            case 'image/jpeg':
                extName = 'jpg';
                break;
            case 'image/png':
                extName = 'png';
                break;
            case 'image/x-png':
                extName = 'png';
                break;
        }
        var _path = files.img.path.split('upload_')[0];
        var stamp = Date.parse(new Date());
        var path = _path+stamp+'.'+extName;
		fs.renameSync(files.img.path, path);
		//start 加resize
		var mapName = '/map_'+stamp+'.'+extName;
		let mapPath = form.uploadDir+mapName;
		dealImages(path).resize(80).save(mapPath,{});
		//end
        var sql_path = path.split('member\\')[1];
        Member.update({
        	portrait: sql_path,
        	check_portrait: 0,
        	// checked: 0,
        	evaluate: 0
        },{
        	where: {
        		open_id,
        	}
        }).then(function(){
        	that.msgToAdmin({
        		name: name,
				phone: phone,
				open_id,
        	},function(){});
        	cb({
        		code: 200,
        		msg: '上传成功',
        		data: {}
        	});
        }).catch(function(e){
        	LOG(e);
        });
		// var str = 'portrait="'+sql_path+'",check_portrait=0';
		// mod_member.updateBasicInfo(name,phone,'','',str,function(rows){
		// 	msgToAdmin(req,res,name,phone);
		// });
    });
}

/**
 * 	提交商务信息111111111111111
 */
this.subBnsInfo = function(params,cb){
	var open_id = params.open_id;
	var name = params.name;
	var phone = params.phone;
	var form_data = params.form_data;
	var change_arr = [];
	var that = this;
	//找出改变的字段
	//创建需要更新的对象
	Member.findAll({
		where: {
			open_id,
		}
	}).then(function(result){
		result = result[0].dataValues;
		for(var i in form_data){
			for(var j in result){
				if(i==j){
					if(form_data[i]!=result[j]){
						change_arr.push(i);
					}
				}
			}
		}
		var update_obj = {},c = 0;
		change_arr.forEach(function(items,index){
			update_obj[items] = form_data[items];
			update_obj['check_'+items] = 0;
			c = 1;
		});
		if(c){
			update_obj['checked'] = 0;
			update_obj['evaluate'] = 0;
			update_obj['state'] = '待认证';
			let { mult_company } = result;
			mult_company = JSON.parse(mult_company);
			mult_company.forEach((items, index) => {
				if (items.selected == 1) {
					for (const key in update_obj) {
						if (items.hasOwnProperty(key)) {
							mult_company[index][key] = update_obj[key];
						}
					}
				}
			});
			update_obj['mult_company'] = JSON.stringify(mult_company);
		} else {
			cb({
				code: 200,
				msg: '未修改信息',
				data: {}
			});
			return;
		}
		//更新vip_basic表
		Member.update(update_obj,{
			where: {
				open_id,
			}
		}).then(function(result){
			//处理会员分数
			that.dealerMemberScore({
				open_id,
			},function(){
				cb({
					code: 200,
					msg: '更新成功',
					data: {}
				});
				if(params.legal_person_done) return;
				that.msgToAdmin({
					name: name,
					phone: phone,
					open_id,
				},function(){});
			});
		}).catch(function(e){
			LOG(e);
		});
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	每日签到111111111
 */
this.checkIn = function(params,cb){
	// 查询当天是否有签到记录
    // 新增签到记录
	const { open_id } = params;
	Member.findOne({
		where: {
			open_id,
		}
	}).then(result => {
		const { open_id, name, phone } = result.dataValues;
		params.name = name;
		params.phone = phone;
		return sequelize.query('SELECT * FROM base_event WHERE isdel = 0 AND ownerId = "'+open_id+'" AND type = "1301" AND date_format(time,"%Y-%m-%d")=date_format(now(),"%Y-%m-%d")').then(result => {
			if (result[0][0]) {
				cb({
					code: -1,
					msg: '今日已签到',
					data: [],
				});
			} else {
				common.createEvent({
					headParams: {
						ownerId: open_id,
						type: '1301',
						time: TIME(),
						person: name,
					},
					bodyParams: {},
				}, result => {
					cb({
						code: 200,
						msg: '签到成功',
						data: [],
					});
					params._class = 'sign';
					sendMQ.sendQueueMsg('memberActivity', JSON.stringify(params), result => {
						console.log(result);
					});
				});
			}
		}).catch(e => { throw e });
	}).catch(e => cb({
        code: -1,
        msg: e.message,
        data: [],
    }));
	// var name = params.name;
	// var phone = params.phone;
	// var that = this;
	// SignActivity.findAll({
	// 	where: {
	// 		name: name,
	// 		phone: phone
	// 	},
	// 	order: [['id','DESC']],
	// 	limit: 1,
	// 	offset: 0
	// }).then(function(result){
	// 	try{
	// 		var date = DATETIME(result[0].dataValues.time);
	// 	}catch(e){
	// 		var date = DATETIME('2000-01-01');
	// 	}
	// 	var now_date = DATETIME();
	// 	if(now_date==date){
	// 		cb({
	// 			code: -1,
	// 			msg: '今日已签到',
	// 			data: []
	// 		});
	// 	}else{
	// 		SignActivity.create({
	// 			name: name,
	// 			phone: phone,
	// 			time: TIME()
	// 		}).then(function(result){
	// 			ItemScore.findAll({}).then(function(result){
	// 				var score = result[0].dataValues.sign;
	// 				SignScore.findAll({
	// 					where: {
	// 						name: name,
	// 						phone: phone
	// 					}
	// 				}).then(function(result){
	// 					var accu_score = result[0].dataValues.accu_score;
	// 					accu_score = accu_score + score;
	// 					SignScore.update({
	// 						accu_score: accu_score
	// 					},{
	// 						where: {
	// 							name: name,
	// 							phone: phone
	// 						}
	// 					}).then(function(result){
	// 						MemberScore.update({
	// 							activity: accu_score
	// 						},{
	// 							where: {
	// 								name: name,
	// 								phone: phone
	// 							}
	// 						}).then(function(result){
	// 							that.dealerMemberScore({
	// 								name: name,
	// 								phone: phone
	// 							},function(){
	// 								cb({
	// 									code: 200,
	// 									msg: '签到成功',
	// 									data: []
	// 								});
	// 							});
	// 						}).catch(function(e){
	// 							LOG(e);
	// 						});
	// 					}).catch(function(e){
	// 						LOG(e);
	// 					});
	// 				}).catch(function(e){
	// 					LOG(e);
	// 				});
	// 			}).catch(function(e){
	// 				LOG(e);
	// 			});
	// 		}).catch(function(e){
	// 			LOG(e);
	// 		});
	// 	}
	// }).catch(function(e){
	// 	LOG(e);
	// });
}

/**
 * 	设为星标11111111111
 */
this.setStar = function(params,cb){
	var id = params.id;
	var mark = params.mark;
	MemberMsg.update({
		mark: mark
	},{
		where: {
			id: id
		}
	}).then(function(result){
		cb({
			code: 200,
			msg: '标记成功',
			data: []
		});
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	法人控制台111111111
 */
this.manage = function(params,cb){
	var open_id = params.open_id;
	this.memberInfo(params,function(result){
		const jobArr = result.job.split(',');
		if((jobArr.indexOf('法人')||jobArr.indexOf('合伙人'))&&result.check_job==1){
		// if(result.job=='法人'&&result.check_job==1){
			Member.findAll({
				where: {
					open_id: open_id
				}
			}).then(function(result){
				var company = result[0].dataValues.company;
				Member.findAll({
					where: {
						company: company,
						open_id: {
							'$ne': open_id
						},
						job: {
							'$ne': '法人'
						},
						isEffect: 1,
					}
				}).then(function(result){
					if(result[0]==null){
						cb({
							code: -1,
							msg: '很抱歉，暂时没有贵公司的会员。',
							data: []
						});
					}else{
						var res_arr = [];
						result.forEach(function(items,index){
							res_arr.push(items.dataValues);
						});
						cb({
							code: 200,
							msg: '',
							data: result
						});
					}
				}).catch(function(e){
					LOG(e);
				});
			}).catch(function(e){
				LOG(e);
			});
		}else{
			cb({
				code: -1,
				msg: '很抱歉，暂时没有贵公司的会员。',
				data: []
			});
		}
	});
}

/**
 * 	法人查看公司员工的动态信息
 */
this.dynamic = function(params,cb){
	const { open_id } = params;
	var that = this;
	var p_info = new Promise(function(resolve,reject){
		Member.findAll({
			where: {
				open_id,
			}
		}).then(function(result){
			resolve(result[0].dataValues);
		}).catch(function(e){
			LOG(e);
		});
	});
	var p_msg = new Promise(function(resolve,reject){
		Member.findAll({
			where: {
				open_id,
			}
		}).then(function(result){
			var company = result[0].dataValues.company;
			var name = result[0].dataValues.name;
			that.getDynamicMsg({
				name: name,
				company: company,
				page: 1
			},function(result){
				resolve(result);
			});
		}).catch(function(e){
			LOG(e);
		});
	});
	Promise.all([p_info,p_msg]).then(function(result){
		const checkedJobArr = result[0].job.split(',');
		const company = result[0].company;
		const open_id = result[0].open_id;
		Customers.findOne({
			where: {
				company: company,
				isdel: 0
			}
		}).then(_result => {
			let hasSpecialLine = false,isMember = false;
			new Promise((resolve,reject) => {
				if(_result){
					const { user_id } = _result.dataValues;
					serviceAffairs.getSpecialLineInfoByCustomerId({
						customerId: user_id
					},resInfo => {
						if(resInfo.code==200){
							hasSpecialLine = true;
							try{
								lineMember = resInfo.data.outerContact.split(',');
							}catch(e){

							}
							if(lineMember.indexOf(open_id)!=-1) isMember = true;
							resolve();
						}else{
							resolve();
						}
					});
				}else{
					resolve();
				}
			}).then(() => {
				cb({
					code: 200,
					msg: '',
					data: {
						info: result[0],
						jobArr: ['合伙人','注册人','财务','采购','开发','其它'],
						checkedJobArr: checkedJobArr,
						msg: result[1],
						hasSpecialLine: hasSpecialLine,
						isMember: isMember
					}
				});
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	});
}

/**
 * 	法人查看公司员工的动态消息（分页）
 */
this.getMoreDynamicMsg = function(params,cb){
	const { open_id } = params;
	var page = params.page;
	var that = this;
	Member.findAll({
		where: {
			open_id,
		}
	}).then(function(result){
		var company = result[0].dataValues.company;
		var name = result[0].dataValues.name;
		that.getDynamicMsg({
			name: name,
			company: company,
			page: page
		},function(result){
			cb({
				code: 200,
				msg: '',
				data: result
			});
		});
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	法人查看公司员工的注册动态消息（分页）(方法用)
 */
this.getDynamicMsg = function(params,cb){
	var name = params.name;
	var company = params.company;
	var page = params.page;
	RegEvent.findAll({
		where: {
			name: name,
			company: company
		},
		order: [['id','DESC']],
		limit: 10,
		offset: (page-1) * 10
	}).then(function(result){
		var res_arr = [];
		result.forEach(function(items,index){
			res_arr.push(items.dataValues);
		});
		cb(res_arr);
	}).catch(function(e){
		LOG(e);
	});
}

this.msgListTargetItem = (params,cb) => {
	const { open_id } = params;
	const that = this;
	Member.findAll({
		where: {
			open_id,
		}
	}).then(function(result){
		var company = result[0].dataValues.company;
		var name = result[0].dataValues.name;
		that.getDynamicMsg({
			name: name,
			company: company,
			page: 1
		},function(result){
			cb(result);
		});
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	法人审核员工职位
 */
this.checkJob = function(params,cb){
	const { open_id } = params;
	//处理客户表的对应职位属性
	const dealerJobProp = (data,cb) => {
		const getPropArr = (_arr) => {
			let arr;
			try{
				arr = _arr.split(',');
			}catch(e){
				arr = [];
			}
			return arr;
		}
		const spliceItem = (dirty,name,arr) => {
			if(!dirty){
				arr.forEach((items,index) => {
					if(name==items){
						arr.splice(index,1);
					}
				});
			}
			arr = arr.filter(items => items);
			return arr;
		}
		Customers.findOne({
			where: {
				isdel: 0,
				company: data.company
			}
		}).then(result => {
			let { reg_person,partner,finance,purchase } = result.dataValues;
			const name = data.name;
			let jobArr = data.job.split(',');
			let partnerArr = getPropArr(partner);
			let regPersonArr = getPropArr(reg_person);
			let financeArr = getPropArr(finance);
			let purchaseArr = getPropArr(purchase);
			let partner_c = 0,reg_person_c = 0,finance_c = 0,purchase_c = 0;

			jobArr.forEach((items,index) => {
				if(items=='合伙人'){
					partner_c = 1;
					if(partnerArr.indexOf(name)==-1) {
						partnerArr.push(name);
					}
				}else if(items=='注册人'){
					reg_person_c = 1;
					if(regPersonArr.indexOf(name)==-1) {
						regPersonArr.push(name);
					}
				}else if(items=='财务'){
					finance_c = 1;
					if(financeArr.indexOf(name)==-1) {
						financeArr.push(name);
					}
				}else if(items=='采购'){
					purchase_c = 1;
					if(purchaseArr.indexOf(name)==-1) {
						purchaseArr.push(name);
					}
				}
			});
			partnerArr = spliceItem(partner_c,name,partnerArr);
			regPersonArr = spliceItem(reg_person_c,name,regPersonArr);
			financeArr = spliceItem(finance_c,name,financeArr);
			purchaseArr = spliceItem(purchase_c,name,purchaseArr);

			reg_person = regPersonArr.join();
			partner = partnerArr.join();
			finance = financeArr.join();
			purchase = purchaseArr.join();
			Customers.update({
				reg_person: reg_person,
				partner: partner,
				finance: finance,
				purchase: purchase
			},{
				where: {
					company: data.company
				}
			}).then(result => {
				cb({
					code: 200,
					msg: '',
					data: []
				});
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}
	const checkObj = {
		checked: params.checked,
		check_company: params.check_company,
		check_job: params.check_job,
		job: params.job
	};
	if(checkObj.checked==1){
		checkObj.state = '已认证';
	}else{
		checkObj.state = '未通过';
	}
	Member.update(checkObj,{
		where: {
			open_id,
		}
	}).then(result => {
		Member.findOne({
			where: {
				open_id,
			}
		}).then(result => {
			const { company } = result.dataValues;
			const p = { open_id };
			sendMQ.sendQueueMsg('memberStatic', JSON.stringify(p), result => {
				console.log(result);
			});
			//处理客户表的对应职位属性
			dealerJobProp(result,status => {
				Customers.findOne({
					where: {
						company: company,
						isdel: 0
					}
				}).then(result => {
					const { user_id } = result.dataValues;
					cb({
						code: 200,
						msg: '操作成功',
						data: []
					});
					// 发消息给运营系统
					sendMsgToAdmin();
				}).catch(e => LOG(e));
			});
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));

	async function sendMsgToAdmin() {
		const memberEntity = await Member.findOne({ where: { open_id } });
		const { name } = memberEntity.dataValues;
		common.sendToMemberAffair({
			sender: open_id,
			content: name + '被客户公司管理员修改了商务信息',
		});
	}
}

/**
 * 	信用管理++1111111111111
 */
this.report = function(params,cb){
	// var name = params.name;
	// var phone = params.phone;
	var open_id = params.open_id;
	var company;
	var that = this;
	new Promise(function(reso,rej){
		Member.findAll({
			where: {
				open_id
			}
		}).then(function(result){
			result = result[0].dataValues;
			company = result.company;
			const jobArr = result.job.split(',');
			if(result.check_company&&result.check_job&&(jobArr.indexOf('法人')||jobArr.indexOf('合伙人')||jobArr.indexOf('财务')||jobArr.indexOf('采购'))){
			// if(result.check_company&&result.check_job&&(result.job=='法人'||result.job=='财务'||result.job=='采购')){
				reso();
			}else{
				cb({
					code: -1,
					msg: '<p>很抱歉，该操作需要符合采购或者财务职位。</p><p>可在“我的会员”中修改职位信息</p>',
					data: []
				});
			}
		}).catch(function(e){
			LOG(e);
		});
	}).then(function(){
		that.getCreditBasicData({
			company: company
		},function(result){
			cb({
				code: 200,
				msg: '',
				data: result
			});
		});
	});
}

/**
 * 	合同统计报告++
 */
this.credit = function(params,cb){
	var company = params.company;
	var time = params.time;
	this.getCreditData(company,time,function(result){
		cb({
			code: 200,
			msg: '',
			data: result
		});
	});
}

/**
 * 	信用期内待付款合同++
 */
this.recList = function(params,cb){
	var company = params.company;
	this.getRecList(company,function(result){
		cb({
			code: 200,
			msg: '',
			data: {
				route: ROUTER(),
				result: result,
				title: '信用期内待付款合同'
			}
		});
	});
}

/**
 * 	逾期合同++
 */
this.overList = function(params,cb){
	var company = params.company;
	this.getOverList(company,function(result){
		cb({
			code: 200,
			msg: '',
			data: {
				route: ROUTER(),
				result: result,
				title: '逾期合同'
			}
		});
	});
}

/**
 * 	冻结合同++
 */
this.freezeList = function(params,cb){
	var company = params.company;
	this.getFreezeList(company,function(result){
		cb({
			code: 200,
			msg: '',
			data: {
				route: ROUTER(),
				result: result,
				title: '冻结合同'
			}
		});
	});
}

/**
 * 	合同列表++
 */
this.contractsList = function(params,cb){
	var company = params.company;
	var time = params.time;
	this.getContractsList(company,time,function(result){
		cb({
			code: 200,
			msg: '',
			data: {
				route: ROUTER(),
				result: result,
				title: '生效合同'
			}
		});
	});
}

/**
 * 	已支付货款列表
 */
this.paymentsList = function(params,cb){
	var company = params.company;
	var time = params.time;
	this.getPaymentsList(company,time,function(result){
		result.forEach(function(items,index){
			for(var i in items){
				if(i=='arrival'){
					items[i] = DATETIME(items[i]);
				}
			}
		});
		cb({
			code: 200,
			msg: '',
			data: {
				route: ROUTER(),
				result: result
			}
		});
	});
}

/**
 * 	获取基本信用(open)++
 */
this.getCreditBasicData = function(params,cb){
	var company = params.company;
	common.getInfoByCompanyInfo(company,function(customers){
		var _p = [],_p_ = [];
		var abb = customers.abb;
		var level = customers.level;
		var manager = customers.manager;
		var credit_qualified = customers.credit_qualified;
		//总信用额，信用期,信用余额（不包括冻结，发货时间为空，合同状态不为有效），最早超出信用期合同的时间
		var credit_line = 0,credit_period = 0,overPrice = 0,over_time;
		_p[0] = new Promise(function(resolve,reject){
			CreditRecords.findAll({
				where: {
					company: company,
					isdel: 0
				},
				order: [['credit_time','DESC'],['id','DESC']],
				limit: 1,
				offset: 0
			}).then(function(result){
				try{
					credit_line = result[0].dataValues.credit_line;
				}catch(e){
					credit_line = 0;
				}
				try{
					credit_period = result[0].dataValues.credit_period;
				}catch(e){
					credit_period = 0;
				}
				resolve();
			}).catch(function(e){
				LOG(e);
			});
		});
		_p[1] = new Promise(function(resolve,reject){
			ContractsHead.findAll({
				where: {
					cus_abb: abb,
					isFreeze: 0,
					isdel: 0,
					contract_state: '有效',
					delivery_time: {
						'$ne': 'NULL'
					}
				},
				order: [['delivery_time']]
			}).then(function(result){
				var _count = 0;
				result.forEach(function(items,index){
					var over = items.dataValues.payable - items.dataValues.paid;
					if(over>0&&_count==0){
						_count = 1;
						over_time = items.dataValues.delivery_time;
					}
					overPrice += items.dataValues.payable - items.dataValues.paid;
				});
				resolve();
			}).catch(function(e){
				LOG(e);
			});
		});
		Promise.all(_p).then(function(){
			overPrice = credit_line - overPrice;
			var inside_count = 0,outside_count = 0,freeze_count = 0;
			var freeze_amount = 0,inside_amount = 0,outside_amount = 0;
			_p_[0] = new Promise(function(resolve,reject){
				var f_m = getTransMonth(credit_period);
				sequelize.query('SELECT count(*) AS count FROM contracts_head WHERE isFreeze = 0 AND contract_state = "有效" AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND delivery_time <"'+f_m+'"',{model: ContractsHead}).then(function(result){
					outside_count = result[0].dataValues.count;
					sequelize.query('SELECT * FROM contracts_head WHERE isFreeze = 0 AND contract_state = "有效" AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND delivery_time <"'+f_m+'"',{model: ContractsHead}).then(function(result){
						result.forEach((items,index) => {
							outside_amount += items.dataValues.payable - items.dataValues.paid;
						});
						resolve();
					});
				}).catch(function(e){
					LOG(e);
				});
			});
			_p_[1] = new Promise(function(resolve,reject){
				var f_m = getTransMonth(credit_period);
				sequelize.query('SELECT count(*) AS count FROM contracts_head WHERE isFreeze = 0 AND contract_state = "有效" AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND delivery_time >="'+f_m+'"',{model: ContractsHead}).then(function(result){
					inside_count = result[0].dataValues.count;
					sequelize.query('SELECT * FROM contracts_head WHERE isFreeze = 0 AND contract_state = "有效" AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND delivery_time >="'+f_m+'"',{model: ContractsHead}).then(function(result){
						result.forEach((items,index) => {
							inside_amount += items.dataValues.payable - items.dataValues.paid;
						});
						resolve();
					});
				}).catch(function(e){
					LOG(e);
				});
			});
			_p_[2] = new Promise(function(resolve,reject){
				ContractsHead.findAndCountAll({
					where: {
						isdel: 0,
						cus_abb: abb,
						isFreeze: 1,
						contract_state: '有效'
					}
				}).then(function(result){
					freeze_count = result.count;
					result.rows.forEach((items,index) => {
						freeze_amount += items.dataValues.payable - items.dataValues.paid;
					});
					resolve();
				}).catch(function(e){
					LOG(e);
				});
			});
			over_time = Math.ceil(credit_period * 30 - (Date.parse(new Date()) - Date.parse(new Date(over_time)))/(24*3600*1000));
			if(isNaN(over_time)){
				over_time = credit_period * 30;
			}
			Promise.all(_p_).then(function(resolve,reject){
				cb({
					company: company,
					abb: abb,
					level,
					manager,
					credit_qualified,
					credit_line: credit_line,
					credit_period: credit_period * 30,
					over_price: overPrice,
					over_time: over_time,
					outside_count: outside_count,
					inside_count: inside_count,
					freeze_count: freeze_count,
					freeze_amount: freeze_amount,
					inside_amount: inside_amount,
					outside_amount: outside_amount
				});
			});
		});
	});
}

/**
 * 	合同统计报告(open)++
 */
this.getCreditData = function(company,time,cb){
	var that = this;
	common.getInfoByCompanyInfo(company,function(result){
		var abb = result.abb;
		var fromYear = new Date().getFullYear() - time;
		var toYear = new Date().getFullYear();
		var _p = [];
		//合同数，总金额，优惠金额，支付货款数
		var contract_num = 0,sum = 0,favo = 0,payment_num = 0;
		_p[0] = new Promise(function(resolve,reject){
			sequelize.query('SELECT count(*) AS count FROM contracts_head WHERE isdel = 0 AND contract_state = "有效" AND cus_abb = "'+abb+'" AND date_format(sign_time,"%Y")>= "'+fromYear+'" AND date_format(sign_time,"%Y")<= "'+toYear+'"',{model: ContractsHead}).then(function(result){
				contract_num = result[0].dataValues.count;
				resolve();
			}).catch(function(e){
				LOG(e);
			});
		});
		_p[1] = new Promise(function(resolve,reject){
			sequelize.query('SELECT * FROM contracts_head WHERE isdel = 0 AND contract_state = "有效" AND cus_abb = "'+abb+'" AND date_format(sign_time,"%Y")>= "'+fromYear+'" AND date_format(sign_time,"%Y")<= "'+toYear+'" ORDER BY sign_time DESC',{model: ContractsHead}).then(function(result){
				result.forEach(function(items,index){
					sum += parseInt(items.dataValues.total_amount);
					favo += parseInt(items.dataValues.total_amount) - parseInt(items.dataValues.payable);
				});
				resolve();
			}).catch(function(e){
				LOG(e);
			});
		});
		_p[2] = new Promise(function(resolve,reject){
			if(fromYear>2017){
				sequelize.query('SELECT count(*) AS count FROM payment WHERE isdel = 0 AND company = "'+company+'" AND date_format(arrival,"%Y")>= "'+fromYear+'" AND date_format(arrival,"%Y")<= "'+toYear+'"',{model: Payment}).then(function(result){
					payment_num = result[0].dataValues.count;
					resolve();
				}).catch(function(e){
					LOG(e);
				});
			}else{
				//过渡用（0硬编码）
				that.getPaymentsList(company,0,function(result){
					var amount = 0;
					result.forEach(function(items,index){
						amount += items.amount;
					});
					AnnualPayment.findAll({
						where: {
							company: company
						}
					}).then(function(result){
						if(result[0]==null){
							payment_num = amount;
						}else{
							if(time==1){
								amount += result[0].dataValues.amount_17;
							}else if(time==2){
								amount += result[0].dataValues.amount_17;
								amount += result[0].dataValues.amount_16;
							}
							payment_num = amount;
							resolve();
						}
					}).catch(function(e){
						LOG(e);
					});
				});
			}
		});
		Promise.all(_p).then(function(){
			cb({
				contract_num: contract_num,
				sum: sum,
				favo: favo,
				payment_num: payment_num
			});
		});
	});
	return;
}

/**
 * 	信用期内待付款合同(open)++
 */
this.getRecList = function(company,cb){
	common.getInfoByCompanyInfo(company,function(result){
		var abb = result.abb;
		CreditRecords.findAll({
			where: {
				company: company,
				isdel: 0
			},
			order: [['credit_time','DESC']],
			limit: 1,
			offset: 0
		}).then(function(result){
			try{
				credit_period = result[0].dataValues.credit_period;
			}catch(e){
				credit_period = 0;
			}
			var f_m = getTransMonth(credit_period);
			sequelize.query('SELECT * FROM contracts_head WHERE isFreeze = 0 AND contract_state = "有效" AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND delivery_time >="'+f_m+'"',{model: ContractsHead}).then(function(result){
				var res_arr = [];
				result.forEach(function(items,index){
					res_arr.push(items.dataValues);
				});
				//计算逾期时间
				var _p = [];
				var d_line = Date.parse(f_m);
				res_arr.forEach(function(items,index){
					_p[index] = new Promise(function(resolve,reject){
						var delivery_time = Date.parse(items.delivery_time);
						var over_time = Math.ceil(credit_period * 30 - (Date.parse(new Date()) - Date.parse(new Date(delivery_time)))/(24*3600*1000));
						var obj = {
							data: items,
							over_time: over_time
						};
						res_arr[index] = obj;
						resolve();
					});
				});
				Promise.all(_p).then(function(){
					cb(res_arr);
				});
			}).catch(function(e){
				LOG(e);
			});
		}).catch(function(e){
			LOG(e);
		});
	});
}

/**
 * 	逾期合同(open)++
 */
this.getOverList = function(company,cb){
	common.getInfoByCompanyInfo(company,function(result){
		var abb = result.abb;
		CreditRecords.findAll({
			where: {
				company: company,
				isdel: 0
			},
			order: [['credit_time','DESC']],
			limit: 1,
			offset: 0
		}).then(function(result){
			try{
				credit_period = result[0].dataValues.credit_period;
			}catch(e){
				credit_period = 0;
			}
			var f_m = getTransMonth(credit_period);
			sequelize.query('SELECT * FROM contracts_head WHERE isFreeze = 0 AND contract_state = "有效" AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND delivery_time <"'+f_m+'"',{model: ContractsHead}).then(function(result){
				var res_arr = [];
				result.forEach(function(items,index){
					res_arr.push(items.dataValues);
				});
				//计算逾期时间
				var _p = [];
				var d_line = Date.parse(f_m);
				res_arr.forEach(function(items,index){
					_p[index] = new Promise(function(resolve,reject){
						var delivery_time = Date.parse(items.delivery_time);
						var over_time = Math.ceil(credit_period * 30 - (Date.parse(new Date()) - Date.parse(new Date(delivery_time)))/(24*3600*1000));
						var obj = {
							data: items,
							over_time: over_time
						};
						res_arr[index] = obj;
						resolve();
					});
				});
				Promise.all(_p).then(function(){
					cb(res_arr);
				});
			}).catch(function(e){
				LOG(e);
			});
		}).catch(function(e){
			LOG(e);
		});
	});
}

/**
 * 	冻结合同(open)++
 */
this.getFreezeList = function(company,cb){
	common.getInfoByCompanyInfo(company,function(result){
		var abb = result.abb;
		ContractsHead.findAll({
			where: {
				isdel: 0,
				cus_abb: abb,
				isFreeze: 1,
				contract_state: '有效'
			}
		}).then(function(result){
			var res_arr = [];
			result.forEach(function(items,index){
				res_arr.push(items.dataValues);
			});
			//计算逾期时间
			var _p = [];
			res_arr.forEach(function(items,index){
				_p[index] = new Promise(function(resolve,reject){
					var freeze_time = Date.parse(items.freeze_time);
					var over_time = Math.ceil((freeze_time - Date.parse(new Date()))/(60*60*1000*24));
					if(isNaN(over_time)) over_time = 1000;
					var obj = {
						data: items,
						over_time: over_time
					};
					res_arr[index] = obj;
					resolve();
				});
			});
			Promise.all(_p).then(function(){
				cb(res_arr);
			});
		}).catch(function(e){
			LOG(e);
		});
	});
}

/**
 * 	年度合同列表(open)++
 */
this.getContractsList = function(company,time,cb){
	common.getInfoByCompanyInfo(company,function(result){
		var abb = result.abb;
		var fromYear = new Date().getFullYear() - time;
		var toYear = new Date().getFullYear();
		sequelize.query('SELECT * FROM contracts_head WHERE isdel = 0 AND contract_state = "有效" AND cus_abb = "'+abb+'" AND date_format(sign_time,"%Y")>= "'+fromYear+'" AND date_format(sign_time,"%Y")<= "'+toYear+'" ORDER BY sign_time DESC',{model: ContractsHead}).then(function(result){
			var res_arr = [];
			result.forEach(function(items,index){
				res_arr.push(items.dataValues);
			});
			cb(res_arr);
		}).catch(function(e){
			LOG(e);
		});
	});
}

/**
 * 	已支付货款列表(open)
 */
this.getPaymentsList = function(company,time,cb){
	var fromYear = new Date().getFullYear() - time;
	var toYear = new Date().getFullYear();
	sequelize.query('SELECT * FROM payment WHERE isdel = 0 AND company = "'+company+'" AND date_format(arrival,"%Y")>= "'+fromYear+'" AND date_format(arrival,"%Y")<= "'+toYear+'" ORDER BY arrival DESC',{model: Payment}).then(function(result){
		var res_arr = [];
		result.forEach(function(items,index){
			res_arr.push(items.dataValues);
		});
		cb(res_arr);
	}).catch(function(e){
		LOG(e);
	});
}


/**
 * 	转换月份
 */
function getTransMonth(credit_period){
	var now = Date.parse(DATETIME());
	var dealer_stamp = now - credit_period * 30 * 24 * 60 * 60 * 1000;
	var dealer_date = DATETIME(new Date(dealer_stamp));
	return dealer_date;
}


/**
 * 	计算会员分数
 */
this.dealerMemberScore = function(params,cb){
	const { open_id } = params;
	// var name = params.name;
	// var phone = params.phone;
	Member.findOne({
		where: {
			open_id,
		}
	}).then(result => {
		const p = { open_id: result.dataValues.open_id };
		sendMQ.sendQueueMsg('memberStatic', JSON.stringify(p), result => {
			console.log(result);
		});
		cb();
	}).catch(e => LOG(e));
}

/**
 * 	会员更改信息，发送提醒
 */
this.msgToAdmin = async function(params,cb){
	var name = params.name;
	var phone = params.phone;
	var open_id = params.open_id;
	common.middleMsg({
		openid: open_id,
		name: [name],
		phone: [phone],
		title: '信息已提交！',
		message: '我们会尽快对您的信息进行审核',
		sender: 'system'
	},function(){});
	cb();
	//发送notimsg提醒
	common.sendToMemberAffair({
		sender: open_id,
		content: name + '修改了基本信息，请重新审核！',
	});
	// request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
	// 	console.log(body);
	// }).form({
	// 	data: JSON.stringify({
	// 		mailId: mailId,
	// 		class: 'member',
	// 		priority: '普通',
	// 		frontUrl: '/member',
	// 		sender: 'system',
	// 		post_time: TIME(),
	// 		title: '会员管理',
	// 		content: name + '修改了基本信息，请重新审核！',
	// 		votes: '已阅',
	// 		subscriber: subscriberArr.join(),
	// 		NotiClientSubs: NotiClientSubs
	// 	})
	// });
}

/**
 * 	获取业务员信息
 */
this.salesmanInfo = function(params,cb){
	var open_id = params.open_id;
	Member.findAll({
		where: {
			open_id: open_id
		}
	}).then(result => {
		let company = result[0].dataValues.company;
		Customers.findAll({
			where: {
				company: company
			}
		}).then(result => {
			let manager = result[0].dataValues.manager;
			if(manager!=''){
				Staff.findAll({
					attributes: ['user_name','work_phone','album'],
					where: {
						user_name: manager,
						on_job: 1,
						isdel: 0
					}
				}).then(result => {
					if(result[0]==null){
						cb({
							code: -1,
							msg: '不存在该业务员',
							data: {}
						});
					}else{
						cb({
							code: 200,
							msg: '',
							data: result[0].dataValues
						});
					}
				}).catch(e => LOG(e));
			}
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));

	//*****************************
	// Customers.findAll({
	// 	where: {
	// 		isdel: 0
	// 	},
	// 	order: [['level']]
	// }).then(result => {
	// 	let res_arr = [['公司','等级','业务员']];
	// 	result.forEach(function(items,index){
	// 		res_arr.push([items.dataValues.company,items.dataValues.level,items.dataValues.manager]);
	// 	});
	// 	var data = [{  
	// 		name: 'sheet1',  
	// 		data: res_arr 
	// 	}]  
		  
	// 	var buffer = xlsx.build(data);  
	// 	fs.writeFile('./company.xlsx', buffer, function(err) {  
	// 	  if (err) throw err;  
	// 	  console.log('has finished');  
	// 	}); 
	// }).catch(e=>LOG(e));
}

/**
 * 	会员发送短信给业务员
 */
this.sendSMSContent = function(params,cb){
	var text = params.text;
	var phone = params.phone;
	var open_id = params.open_id;
	Member.findAll({
		where: {
			open_id: open_id
		}
	}).then(result => {
		var _company = result[0].dataValues.company;
		var _name = result[0].dataValues.name;
		var _phone = result[0].dataValues.phone;
		//发送短信
		aliSms.sendAliSms({
			type: 'memberSendToStaff',
			PhoneNumbers: phone,
			TemplateParam: JSON.stringify({
				company: _company,
				name: _name,
				phone: _phone,
				suggest: text,
			}),
		}).then(result => {
			cb(result);
		});
		// let baseSMS = new base.SMS({
		// 	template: 'from_member_send',
		// 	mobiles: JSON.stringify([phone]),
		// 	params: JSON.stringify([_company,_name,_phone,text])
		// });
		// baseSMS.sendMsg(function(error,response,body){
		// 	if(body.code!=200){
		// 		cb({
		// 			code: -1,
		// 			msg: '短信发送失败',
		// 			data: []
		// 		});
		// 	}else{
		// 		cb({
		// 			code: 200,
		// 			msg: '短信发送成功',
		// 			data: []
		// 		});
		// 	}
		// });
	}).catch(e => LOG(e));
}

/**
 *  获取指定公司专线的相关信息
 */
this.getInfoByCustomerId = (params,cb) => {
	const { customerId,open_id } = params;
	serviceAffairs.getSpecialLineInfoByCustomerId({
		customerId: customerId
	},result => {
		if(result.code==200){
			const { outerContact } = result.data;
			let outerContactArr;
			try{
				outerContactArr = outerContact.split(',');
			}catch(e){
				outerContactArr = [];
			}
			Member.findOne({
				where: {
					open_id: open_id
				}
			}).then(result => {
				const { company,job } = result.dataValues;
				let canEdit = false;
				if(job.indexOf('法人')!=-1||job.indexOf('合伙人')!=-1) canEdit = true;
				Member.findAll({
					where: {
						company: company,
						checked: 1
					}
				}).then(result => {
					cb({
						code: 200,
						msg: '',
						data: {
							canEdit: canEdit,
							outerContactArr: outerContactArr,
							allMember: result
						}
					});
				}).catch(e => LOG(e));
			}).catch(e => LOG(e));
		}else{
			cb(result);
		}
	});
}

/**
 *  是否订阅服务号消息
 */
this.checkWxServerMsg = (params,cb) => {
	const { open_id,isSub } = params;
	Member.update({
		isSub: isSub
	},{
		where: {
			open_id: open_id
		}
	}).then(result => {
		if(result[0]){
			cb({
				code: 200,
				msg: '操作成功',
				data: []
			});
		}else{
			cb({
				code: -1,
				msg: '操作失败',
				data: []
			});
		}
	}).catch(e => LOG(e));
}

/**
 * 获取江浙沪会员手机号
 */
this.getNearMember = async () => {
	const memberArr = await Member.findAll({
		where: {
			checked: 1,
			isdel: 0,
		}
	});
	const _p = [];
	const phoneArr = [];
	const addrArr = ['浙江','江苏','上海'];
	memberArr.forEach((items, index) => {
		_p[index] = new Promise(async (resolve, reject) => {
			const it = items;
			const result = await VerUnit.findOne({
				where: {
					company: items.dataValues.company,
				}
			});
			try {
				if (addrArr.indexOf(result.dataValues.province) !== -1) {
					phoneArr.push({
						name: it.dataValues.name,
						phone: it.dataValues.phone,
						company: it.dataValues.company,
					});
				}
			} catch (e) {
				
			}
			resolve();
		});
	});
	await Promise.all(_p);
	return phoneArr;
}

this.userCardList = async params => {
	const { unionid } = params;
	const result = await VirWarranty.findAll({
		attributes: [ 'sn' ],
		where: {
			bind_unionid: unionid,
			isdel: 0,
		},
		order: [[ 'id', 'DESC' ]],
	});
	return {
		code: 200,
		msg: '',
		data: result,
	};
}

/**
 * 根据open_id获取公司列表
 */
exports.getMuilCompanyList = async open_id => {
	const result = await getMuilCompanyList(open_id);
	const { muilCompanyList } = result;
	return {
		code: 200,
		msg: '',
		data: muilCompanyList,
	};
}

/**
 * 添加公司
 */
exports.addMuilCompany = async params => {
	const { company, job, open_id } = params;
	const result = await getMuilCompanyList(open_id);
	let { muilCompanyList, id } = result;
	let isExist = false;
	muilCompanyList.forEach(items => {
		if (items.company == company) {
			isExist = true;
		}
	});
	if (isExist) {
		return { code: -1, msg: '该公司已存在' };
	}
	muilCompanyList.push({
		company,
		job,
		checked: 0,
		selected: 0,
	});
	await Member.update({
		mult_company: JSON.stringify(muilCompanyList),
	}, {
		where: { id }
	});
	return {
		code: 200,
		msg: '添加成功',
	};
}

/**
 * 移除公司
 */
exports.delMuilCompany = async params => {
	const { company, open_id } = params;
	const result = await getMuilCompanyList(open_id);
	let { muilCompanyList, id } = result;
	muilCompanyList = muilCompanyList.filter(items => items.company != company);
	await Member.update({
		mult_company: JSON.stringify(muilCompanyList),
	}, {
		where: { id }
	});
	return {
		code: 200,
		msg: '移除成功',
	};
}

/**
 * 选择指定公司
 */
exports.selectMuilCompany = async params => {
	const that = this;
	const { company, open_id } = params;
	const result = await getMuilCompanyList(open_id);
	let { muilCompanyList, id } = result;
	let d_company, d_job, d_checked = 0;
	muilCompanyList.forEach((items, index) => {
		muilCompanyList[index].selected = 0;
		if (items.company == company) {
			d_company = company;
			d_job = items.job;
			d_checked = items.checked;
			muilCompanyList[index].selected = 1;
		}
	});
	if (!d_company) {
		return {
			code: -1,
			msg: '出现异常',
		};
	}
	if (d_checked == 0) {
		// 未审核过，走常规审核流程
		await Member.update({
			company: d_company,
			job: d_job,
			checked: 0,
			check_company: 0,
			check_job: 0,
			state: '待认证',
			mult_company: JSON.stringify(muilCompanyList),
			isUser: 0,
		}, {
			where: {
				id,
			},
		});
		//处理会员分数
		that.dealerMemberScore({
			open_id,
		}, () => {});
		const memberEntity = await Member.findOne({ where: { open_id } });
		const { name, phone } = memberEntity.dataValues;
		that.msgToAdmin({
			name,
			phone,
			open_id,
		},function(){});
		return { code: 200, msg: '切换成功，等待朗杰审核' };
	} else {
		// 之前审核过，但还需内部逻辑判断一下
		const result = await new Promise(async resolve => {
			const memberEntity = await Member.findOne({ where: { id } });
			memberEntity.dataValues.witness = '沈波';
			memberEntity.dataValues.verifiedPerson = '沈浩';
			memberEntity.dataValues.witnessRelation = '员工';
			memberEntity.dataValues.state = '申请认证';
			memberEntity.dataValues.company = d_company;
			memberEntity.dataValues.job = d_job;
			serviceHomeMember.checkInfo(memberEntity, result => resolve(result));
		});
		if (result.code != 200) {
			return result;
		}
		await Member.update({
			company: d_company,
			job: d_job,
			checked: 1,
			check_company: 1,
			check_job: 1,
			state: '已认证',
			isUser: 0,
			mult_company: JSON.stringify(muilCompanyList),
		}, {
			where: {
				id,
			},
		});
		that.dealerMemberScore({
			open_id,
		}, () => {});
		return { code: 200, msg: '切换成功' };
	}
}

/**
 * 切回自己的个人身份
 */
exports.bankToPersonal = async open_id => {
	const result = await getMuilCompanyList(open_id);
	let { muilCompanyList, id } = result;
	muilCompanyList.forEach((items, index) => {
		muilCompanyList[index].selected = 0;
	});
	await Member.update({
		mult_company: JSON.stringify(muilCompanyList),
		company: '',
		job: '其它',
		isUser: 1,
		checked: 0,
		check_company: 0,
		check_job: 0,
		state: '待认证',
	}, {
		where: {
			id,
		},
	});
	//处理会员分数
	this.dealerMemberScore({
		open_id,
	}, () => {});
	return {
		code: 200,
		msg: '操作成功',
		data: [],
	};
}

async function getMuilCompanyList(open_id) {
	const result = await Member.findOne({ where: { open_id } });
	const { mult_company, id } = result.dataValues;
	let muilCompanyList;
	try {
		muilCompanyList = JSON.parse(mult_company);
		if (muilCompanyList == undefined) {
			muilCompanyList = [];
		}
	} catch (e) {
		muilCompanyList = [];
	}
	return {
		muilCompanyList,
		id,
	};
}

/**
 * 抵价券转手
 */
exports.resaleCoup = async params => {
	const { buyer, no, open_id } = params;
	const memberEntity = await Member.findOne({ where: { open_id } });
	const { user_id: owner } = memberEntity.dataValues;
	const result = await serviceHomeWallet.resaleCoup({
		owner,
		buyer,
		no,
		open_id,
	});
	return result;
}

exports.remoteSearchUserId = async params => {
	const { type, keywords } = params;
	let resArr = [];
	// if (type === '公司') {
		const customerEntityList = await Customers.findAll({attributes: [ 'user_id', 'company' ], where: { isdel: 0, company: { $like: '%'+keywords+'%' } }, limit: 10, offset: 0 });
		customerEntityList.forEach(items => {
			resArr.push({
				text: items.dataValues.company,
				value: items.dataValues.user_id,
			});
		});
	// } else {
		const memberEntityList = await Member.findAll({attributes: [ 'user_id', 'name', 'phone' ], where: { isdel: 0, $or: { name: { $like: '%'+keywords+'%' }, phone: { $like: '%'+keywords+'%' } } }, limit: 10, offset: 0 });
		memberEntityList.forEach(items => {
			const { name, phone } = items.dataValues;
			const text = name + '（尾号'+phone.slice(-4)+'）';
			resArr.push({
				text,
				value: items.dataValues.user_id,
			});
		});
	// }
	if (resArr.length > 10) {
		resArr = resArr.slice(0, 10);
	}
	return resArr;
}

/**
 * 根据openid获取相应的抵价券
 */
exports.getWalletCoupByOpenid = async params => {
	const { open_id } = params;
	const memberEntity = await Member.findOne({ where: { open_id } });
	const { user_id } = memberEntity.dataValues;
	let result = await serviceHomeWallet.getCustomCoup(user_id);
	result.WalletCoups = result.dataValues.WalletCoups.filter(items => items.isPower == 1);
	let total_amount = 0;
	result.WalletCoups.forEach(items => total_amount += Number(items.amount));
	result.total_amount = total_amount;
	return result;
}

/**
 * 我的资源
 */
this.getMyActionSource = async params => {
	const { unionid } = params;
	const _p = [];
	_p[0] = new Promise(async resolve => resolve(await fetchIni()));
	_p[1] = new Promise(async resolve => resolve(await fetchVtc()));
	_p[2] = new Promise(async resolve => resolve(await fetchPrivateTemp()));
	const result = await Promise.all(_p);
	const resObj = {
		vtc: [],
		ini: [],
		temp: [],
	};
	if (result[0].code === 200) {
		resObj.ini = result[0].data;
	}
	if (result[1].code === 200) {
		resObj.vtc = result[1].data;
	}
	if (result[2].code === 200) {
		resObj.temp = result[2].data;
	}
	return {
		code: 200,
		msg: '查询成功',
		data: resObj,
	};

	async function fetchIni() {
		return await new Promise((resolve, reject) => {
			request.get(CONFIG.actionApiAddr+'/maxtest/ini/list/self', {
				headers: { primaryunionid: unionid },
			}, (err, response, body) => {
				if (err) {
					reject(err);
				}
				const data = JSON.parse(body);
				data.data.map((items, index) => {
					for (const sn in items) {
						items[sn].forEach(it => {
							if (it) {
								delete it.config;
							}
						});
					}
				});
				resolve(data);
			});
		});
	}
	async function fetchVtc() {
		return await new Promise((resolve, reject) => {
			request.get(CONFIG.actionApiAddr+'/vtc/nji/list/self', {
				headers: { primaryunionid: unionid },
			}, (err, response, body) => {
				if (err) {
					reject(err);
				}
				const data = JSON.parse(body);
				data.data.map((items, index) => {
					for (const sn in items) {
						items[sn].forEach(it => delete it.config);
					}
				});
				resolve(data);
			});
		});
	}
	async function fetchPrivateTemp() {
		return await new Promise((resolve, reject) => {
			request.get(CONFIG.actionApiAddr+'/vtc/cfgTemp/self', {
				headers: { primaryunionid: unionid },
			}, (err, response, body) => {
				if (err) {
					reject(err);
				}
				resolve(JSON.parse(body));
			});
		});
	}
}

/**
 * 我的卡
 */
exports.myProducts = async params => {
	const { user_id_arr } = params;
	const list = await Products.findAll({ attributes: [ 'model', 'serialNo' ], where: { isdel: 0, dealer: { $in: user_id_arr } } });
	list.forEach((items, index) => {
		const { serialNo: sn, model } = items.dataValues;
		if (/^D/.test(model)) {
			list[index].dataValues.link = ROUTE('service/product/dyna/'+sn);
		} else {
			list[index].dataValues.link = ROUTE('service/product/vir8/'+sn);
		}
	});
	return { code: 200, msg: '', data: list.map(items => items.dataValues) };
}

/**
 * 添加介绍人
 */
exports.addIntroducePerson = async params => {
	const { open_id, phone } = params;
	const memberEntity = await Member.findOne({ where: { phone } });
	if (!memberEntity) {
		return { code: -1, msg: '不存在该手机号' };
	}
	const { open_id: intro_open_id, name: intro_name } = memberEntity;
	if (intro_open_id === open_id) {
		return { code: -1, msg: '介绍人不能为自己' };
	}
	const exist = await BaseEvent.findOne({ where: { isdel: 0, type: '1308', ownerId: open_id } });
	if (exist) {
		return { code: -1, msg: '您已添加过介绍人了' };
	}
	common.createEvent({
		headParams: {
			ownerId: open_id,
			type: '1308',
			time: TIME(),
			person: intro_open_id,
			rem: intro_name,
		},
		bodyParams: {},
	}, () => {});
	sendMQ.sendQueueMsg('memberActivity', JSON.stringify({
		_class: 'introduced',
		open_id: intro_open_id,
	}), result => {
		console.log(result);
	});
	return { code: 200, msg: '添加成功' };
}

/**
 * 兑换元宝分
 */
this.consumeYBScore = async params => {
	const { unionid, goodsId, notNotify } = params;
	// 获取兑换码
	const applyRes = await goodsForYBScore.applyExchange({
		unionid,
		goodsId,
	});
	if (applyRes.code === -1) {
		return applyRes;
	}
	// 使用兑换码
	const { no } = applyRes.data;
	const consumeRes = await goodsForYBScore.consumeExchange({ no, unionid, type: '兑换' });
	if (consumeRes.code === -1) {
		return consumeRes;
	}
	if (!notNotify) {
		// 发消息通知运营系统，及时发货给会员
		const { goodsName } = consumeRes.data;
		const memberEntity = await Member.findOne({ where: { unionid } });
		const { name, phone, open_id } = memberEntity.dataValues;
		common.sendToMemberAffair({
			sender: open_id,
			content: name + '兑换了' + goodsName + '，请及时发货！（' + phone + '）',
		});
	}
	return { code: 200, msg: '兑换成功' };
}

/**
 * 可兑换物品列表
 */
this.exchangeGoodsList = async () => {
	const list = await GoodsForYBScore.findAll({ where: { isOpen: 1 }, order: [['needScore']] });
	return { code: 200, msg: '', data: list };
}

/**
 * 会员提交免费兑换
 */
exports.subFreeExchange = async params => {
	const { goodsId, unionid } = params;
	const lock = await redisUtil.lock('member:freeExchange:' + unionid);
	if (!lock) {
		return { code: -1, msg: '操作过于频繁' };
	}
	const goodsList = await FreeExchangeGift.findAll({ where: { isdel: 0, unionid } });
	if (goodsList.length === 0) {
		return { code: -1, msg: '暂无资格兑换' };
	}
	const hasExchangeArr = goodsList.filter(items => items.dataValues.isExchange == 1);
	if (goodsList.length === hasExchangeArr.length) {
		return { code: -1, msg: '请勿重复兑换' };
	}
	const notExchangeArr = goodsList.filter(items => items.dataValues.isExchange == 0);
	let selectId;
	notExchangeArr.forEach(items => {
		let goodsIdArr;
		try {
			goodsIdArr = items.dataValues.goodsIds.split(',').filter(items => items).map(items => items);
		} catch (e) {
			goodsIdArr = [];
		}
		if (goodsIdArr.includes(goodsId)) {
			selectId = items.dataValues.id;
		}
	});
	if (!selectId) {
		return { code: -1, msg: '该物品无法兑换' };
	}
	const result = await serviceHomeMember.giving({ goodsId, unionid, type: '赠送' });
	if (result.code !== 200) {
		return result;
	}
	await FreeExchangeGift.update({ isExchange: 1, exchangeTime: TIME(), exchangeGoodsId: goodsId }, { where: { id: selectId } });
	return { code: 200, msg: '兑换成功' };
}

/**
 * 指定会员的可兑换礼品列表
 */
exports.listFreeExchange = async params => {
	const { unionid } = params;
	const list = await FreeExchangeGift.findAll({ where: { unionid, isdel: 0, isExchange: 0 } });
	let goodsIdArr = [];
	list.forEach(items => {
		let _arr;
		try {
			_arr = items.dataValues.goodsIds.split(',').filter(items => items);
		} catch (e) {
			_arr = [];
		}
		goodsIdArr = [...goodsIdArr, ..._arr];
	});
	goodsIdArr = [...new Set(goodsIdArr)];
	const goodsList = await GoodsForYBScore.findAll({ where: { id: { $in: goodsIdArr } } });
	return { code: 200, msg: '', data: goodsList };
}

/**
 * 更新最后登陆时间
 */
exports.refreshLastLoginTime = async params => {
	const { unionid } = params;
	await Member.update({ last_login_time: TIME() }, { where: { unionid } });
	return { code: 200, msg: '更新成功' };
}

/**
 * 更新活跃度
 */
exports.refreshActiveDegree = async params => {
	const { unionid } = params;
	// 找出7天内uv
	let userList = [];
	const uvPool = [];
	for (let i = 0; i < 7; i++) {
		const timeStr = moment().subtract(i, 'days').format('YYYYMMDD');
		const userSet = await redisUtil.WxUvCalcul.GetOrderDayUser(timeStr);
		uvPool[i] = userSet;
	}

	if (!unionid) {
		const list = await Member.findAll({ attributes: ['unionid'] });
		userList = list.map(items => items.dataValues.unionid);
	} else {
		userList = [unionid];
	}

	for (let i = 0; i < userList.length; i++) {
		const unionid = userList[i];
		let activeDegree = 0;
		for (let j = 0; j < uvPool.length; j++) {
			if (uvPool[j].includes(unionid)) {
				activeDegree += 1;
			}
		}
		await Member.update({ active_degree: activeDegree }, { where: { unionid } });
	}

	return { code: 200, msg: '更新完成' };
}