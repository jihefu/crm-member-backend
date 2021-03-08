var schedule = require("node-schedule");
var fs = require("fs");
var bluebird = require("bluebird");
const base = require('./base');

global.CONFIG = JSON.parse(fs.readFileSync('./config.json').toString());

global.LOG = function (info) {
	console.log(info);
}

global.DATETIME = function (t) {
	if (t) {
		var date = new Date(t);
	} else {
		var date = new Date();
	}
	var yy = date.getFullYear();
	var MM = date.getMonth() + 1;
	var dd = date.getDate();
	if (MM < 10) MM = '0' + MM;
	if (dd < 10) dd = '0' + dd;
	var time = yy + '-' + MM + '-' + dd;
	return time;
}

global.TIME = function (t) {
	if (t) {
		var date = new Date(t);
	} else {
		var date = new Date();
	}
	var yy = date.getFullYear();
	var MM = date.getMonth() + 1;
	var dd = date.getDate();
	if (date.getHours() < 10) {
		var HH = '0' + date.getHours();
	} else {
		var HH = date.getHours();
	}
	if (date.getMinutes() < 10) {
		var mm = '0' + date.getMinutes();
	} else {
		var mm = date.getMinutes();
	}
	if (date.getSeconds() < 10) {
		var ss = '0' + date.getSeconds();
	} else {
		var ss = date.getSeconds();
	}
	if (MM < 10) MM = '0' + MM;
	if (dd < 10) dd = '0' + dd;
	var time = yy + '-' + MM + '-' + dd + ' ' + HH + ':' + mm + ':' + ss;
	return time;
}

global.ROUTE = function (url) {
	return 'http://' + CONFIG.web_host + ':' + CONFIG.web_port + '/' + url;
}

new base.StaffMap().setStaffMap();

const request = require('request');
const oldFileCustomers = require('./customers');
var Customers = require('../dao').Customers;
var ContractsHead = require('../dao').ContractsHead;
var ContractsBody = require('../dao').ContractsBody;
var Users = require('../dao').Users;
var CompanyCalendar = require('../dao').CompanyCalendar;
var Member = require('../dao').Member;
const VerContacts = require('../dao').VerContacts;
const Contacts = require('../dao').Contacts;
var Wallet = require('../dao').Wallet;
const sequelize = require('../dao').sequelize;
const MemberScore = require('../dao').MemberScore;
const BaseEvent = require('../dao').BaseEvent;
const TypeDInfo = require('../dao').TypeDInfo;
const BaseMsg = require('../dao').BaseMsg;
const MeetMsg = require('../dao').MeetMsg;
const OtherMsg = require('../dao').OtherMsg;
const BusinessTrip = require('../dao').BusinessTrip;
const OnlineContactsInfo = require('../dao').OnlineContactsInfo;
const NotiClient = require('../dao').NotiClient;
const NotiClientSub = require('../dao').NotiClientSub;
const Affair = require('../dao').Affair;
const Goods = require('../dao').Goods;
const MemberTrainLog = require('../dao').MemberTrainLog;

var member = require('./member');
var creditTrend = require('./creditTrend');
var common = require('./common');
var serviceSign = require('./homeAttendance');
const serviceHomeCustomers = require('./homeCustomers');
var redisClient = require('./redis');
const notiClient = require('./homeNotiSystem');
const serviceHomeContract = require('./homeContracts');
var serviceWallet = require('./HomeWallet');
const sendMQ = require('./rabbitmq').sendMQ;
const cacheCustomerInfo = require('../cache/cacheCustomerInfo');
const serviceHyApp = require('./hybrid_app');
const serviceHomePricingList = require('./homePricingList');
const open = require('./open');
const deal = require('./deal');
const memberScoreDealer = require('./memberScoreDealer');
const serviceHomeContacts = require('./homeContacts');

/**定时任务 */
startOverTimeTask();
updateTypeDInfo();
wxUvPutIn();

/** 10:00:00 */
/**信用提醒（催款）&& 生日短信提醒 */
creditReminder();

/** 10:01:00 */
/**试产品超期提醒 */
goodsReminder();

/** 17:00:00 */
autoLeave();

/** 17:00:30 */
checkProgressUpdate();

/** 22:00:00 */
autoEndOverWork();

/** 23:00:00 */
/*插入信用相关数据*/
insertCretitTrendData();

/** 00:00:00 */
/**检查保证金和抵价券是否过期*/
checkNumberingOverTime();

/** 00:10 */
addSignItem();

/** 00:15 */
checkD5ToD4();

/** 00:20 */
checkDToC();

/** 00:25 */
updateOnlineContactsNum();

/** 00:30 */
dynaCtrlInfo();

/** 00:35 */
refreshMemberNickName();

/** 01:00:00 */
/**新年任务 */
newYearWork();

/** 01:10:00 */
/**会员静态分数更新 */
refreshMemberStaticScore();

/** 02:00:00 */
/*更新客户信用*/
updateCustomersCredit();

/** 04:00:00 */
/*更新累计销售额*/
updateTotalSale();

/** 04:10:00 */
/*更新近一年销售额*/
updateLatestYearSale();

/** 04:20:00 */
goodsReduceCoe();

/** 04:25:00 */
/**redis缓存处理 */
redisCacheDealer();

/** 04:30:00 */
/**同步钱包总金额 */
syncWalletTotalAmount();

/** 04:40:00 */
/**检查联系簿的联系人是否被取消认证了 */
checkVerContacts();


/**
 *  考勤自动打卡下班
 *  每天的17点0分执行
 */
function autoLeave() {
	var rule = new schedule.RecurrenceRule();
	// 每天的17点执行
	rule.hour = 17;
	rule.minute = 0;
	rule.second = 0;
	schedule.scheduleJob(rule, function () {
		serviceSign.autoLeave();
	});
}

/**
 *  进度更新检查
 * 	每天的17点0分30秒执行
 */
function checkProgressUpdate() {
	var rule = new schedule.RecurrenceRule();
	// 每天的17点30秒执行
	rule.hour = 17;
	rule.minute = 0;
	rule.second = 30;
	schedule.scheduleJob(rule, function () {
		serviceSign.calculUpdateTickScore({}, () => { });
	});
}

/**
 *  自动结束加班
 *  每天的22点0分执行
 */
function autoEndOverWork() {
	var rule = new schedule.RecurrenceRule();
	// 每天的22点执行
	rule.hour = 22;
	rule.minute = 0;
	rule.second = 0;
	schedule.scheduleJob(rule, function () {
		serviceSign.autoEndOverWork();
	});
}

/**
 * 	月底插入具备信用的公司的信用相关数据
 *  每天的23点0分执行
 */
function insertCretitTrendData() {
	var rule = new schedule.RecurrenceRule();
	// 每天的晚上23点执行
	rule.hour = 23;
	rule.minute = 0;
	rule.second = 0;
	schedule.scheduleJob(rule, function () {
		dealer();
	});

	function dealer() {
		if (checkDo() == 1) {
			LOG('插入月底信用数据');
			creditTrend.insertCretitTrendData();
			setTimeout(() => {
				memberScoreDealer.calculCooperAndActivity();
			}, 10000);
		}

		/*判断是否是当月最后一天*/
		function checkDo() {
			let nowTimeStamp = Date.parse(new Date());
			let nowMonth = new Date().getMonth();
			let nextTimeStamp = nowTimeStamp + 60 * 60 * 1000 * 24;
			let nextMonth = new Date(nextTimeStamp).getMonth();
			if (nowMonth == nextMonth) {
				return 0;
			} else {
				return 1;
			}
		}
	}
}

/**
 *  检查保证金和抵价券是否过期
 *  每天的凌晨0点0分执行
 */
function checkNumberingOverTime() {
	const rule = new schedule.RecurrenceRule();

	//每天的凌晨0点0分执行
	rule.hour = 0;
	rule.minute = 0;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		dealer();
	});

	async function dealer() {
		await deal.Coup.timeout();
		await deal.Depo.timeout();
	}
}

/**
 *  考勤添加条目
 *  每天的0点10分执行
 */
function addSignItem() {
	var rule = new schedule.RecurrenceRule();
	// 每天的早上0点10分执行
	rule.hour = 0;
	rule.minute = 10;
	rule.second = 0;
	schedule.scheduleJob(rule, function () {
		serviceSign.addSignItem();
	});
}

/**
 * 检查D5是否需要转到D4
 * 每天的0点15分执行
 */
async function checkD5ToD4() {

	var rule = new schedule.RecurrenceRule();
	// 每天的早上0点15分执行
	rule.hour = 0;
	rule.minute = 15;
	rule.second = 0;
	schedule.scheduleJob(rule, function () {
		dealer();
	});

	async function dealer() {
		const customerResult = await Customers.findAll({
			include: {
				model: TypeDInfo,
				association: Customers.hasOne(TypeDInfo, { foreignKey: 'customer_id', sourceKey: 'user_id' }),
				where: {
					intent_degree: 5,
				},
			},
			where: {
				isdel: 0,
				level: 'D',
			},
		});
		const _p = [];
		customerResult.forEach((items, index) => {
			_p[index] = new Promise(async resolve => {
				const { to_five_time, id, hot_degree } = items.dataValues.TypeDInfo.dataValues;
				if (Date.now() - Date.parse(to_five_time) > 60 * 60 * 1000 * 24 * 30) {
					// 需要降为D4
					const newHotDegree = hot_degree - 10;
					await TypeDInfo.update({
						intent_degree: 4,
						hot_degree: newHotDegree,
					}, { where: { id } });
				}
				resolve();
			});
		});
		await Promise.all(_p);
		console.log('检查完成...');
	}
}

/**
 * 检查D类是否跳C
 * 每天的0点20分执行
 */
async function checkDToC() {

	var rule = new schedule.RecurrenceRule();
	// 每天的早上0点20分执行
	rule.hour = 0;
	rule.minute = 20;
	rule.second = 0;
	schedule.scheduleJob(rule, function () {
		dealer();
	});

	async function dealer() {
		const customerDResult = await Customers.findAll({
			where: {
				isdel: 0,
				level: 'D',
			},
		});
		const contractResult = await ContractsHead.findAll({
			attributes: ['cus_abb'],
			where: {
				isdel: 0,
				contract_state: '有效',
			},
		});
		const cusAbbMapper = {};
		contractResult.forEach(items => {
			if (!cusAbbMapper[items.dataValues.cus_abb]) cusAbbMapper[items.dataValues.cus_abb] = 1;
		});
		const _p = [];
		customerDResult.forEach((items, index) => {
			_p[index] = new Promise(async resolve => {
				const { user_id, abb } = items.dataValues;
				if (cusAbbMapper[abb]) {
					// 需要把这个D类转为C
					await Customers.update({
						level: 'C',
					}, { where: { user_id } });
				}
				resolve();
			});
		});
		await Promise.all(_p);
		console.log('检查完成');
	}
}

/**
 * 代龙销售量统计
 * 每天的0点30分执行
 */
async function dynaCtrlInfo() {
	var rule = new schedule.RecurrenceRule();
	// 每天的早上0点30分执行
	rule.hour = 0;
	rule.minute = 30;
	rule.second = 0;
	schedule.scheduleJob(rule, function () {
		dealer();
	});

	async function dealer() {
		const result = await ContractsBody.findAll({ where: { goods_name: { $like: '%代龙%' } } });
		const contractMapper = {};
		result.forEach(items => {
			const { contract_no, goods_num, goods_price } = items.dataValues;
			if (!contractMapper[contract_no]) contractMapper[contract_no] = {
				num: 0,
				price: 0,
			};
			contractMapper[contract_no].num += Number(goods_num);
			contractMapper[contract_no].price += (Number(goods_num) * Number(goods_price));
		});
		const headResult = await ContractsHead.findAll({ where: { isdel: 0, contract_state: '有效' } });
		const headMapper = {};
		headResult.forEach(items => {
			headMapper[items.dataValues.contract_no] = {
				abb: items.dataValues.cus_abb,
				sign_time: items.dataValues.sign_time,
			};
		});
		const resMap = {};
		for (const contract_no in contractMapper) {
			if (!headMapper[contract_no]) continue;
			const { abb, sign_time } = headMapper[contract_no];
			if (abb) {
				if (!resMap[abb]) resMap[abb] = {
					num: 0,
					price: 0,
				};
				resMap[abb].num += contractMapper[contract_no].num;
				resMap[abb].price += contractMapper[contract_no].price;
				// 年
				const yyyy = new Date(sign_time).getFullYear();
				if (!resMap[abb][yyyy]) resMap[abb][yyyy] = {
					num: 0,
					price: 0,
				};
				resMap[abb][yyyy].num += contractMapper[contract_no].num;
				resMap[abb][yyyy].price += contractMapper[contract_no].price;
			}
		}
		const resArr = [];
		const customerEntity = await Customers.findAll({ where: { isdel: 0 } });
		for (let abb in resMap) {
			for (let i = 0; i < customerEntity.length; i++) {
				if (customerEntity[i].dataValues.abb == abb) {
					resArr.push({
						company: customerEntity[i].dataValues.company,
						num: resMap[abb].num,
						price: resMap[abb].price,
					});
					break;
				}
			}
		}
		const _p = [];
		resArr.forEach((items, index) => {
			_p[index] = new Promise(async resolve => {
				await Customers.update({
					total_dyna_sale: items.num,
				}, { where: { company: items.company } });
				resolve();
			});
		});
		await Promise.all(_p);
		console.log('代龙销售量统计完成');
	}
}

/**
 * 刷新会员nickname
 * 每天的0点35分执行
 */
async function refreshMemberNickName() {
	const service = require('./service');
	const rule = new schedule.RecurrenceRule();
	// 每天的早上0点35分执行
	rule.hour = 0;
	rule.minute = 35;
	rule.second = 0;
	schedule.scheduleJob(rule, async function () {
		await service.refreshMemberNickName();
		await member.refreshActiveDegree({});
		console.log('昵称刷新完成');
	});
}

/**
 * 新年任务
 * 每天的凌晨1点执行
 */
function newYearWork() {
	const rule = new schedule.RecurrenceRule();

	//每天的凌晨1点分执行
	rule.hour = 1;
	rule.minute = 0;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		const MM = new Date().getMonth();
		const DD = new Date().getDate();
		if (MM == 0 && DD == 1) {
			getLastSale();
			// updateMemberNewYearActivityScore();
		}
	});

	// getLastSale();
	/**
	 * 	计算上年销售额
	 */
	function getLastSale() {
		Customers.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			let res_arr = [];
			result.forEach((items, index) => {
				res_arr.push(items.dataValues.abb);
			});
			let _p = [];
			const sign_time_between = [new Date().getFullYear() -1 + '-01-01', new Date().getFullYear() -1 + '-12-31'];
			res_arr.forEach((items, index) => {
				let sum = 0, abb = items;
				_p[index] = new Promise((resolve, reject) => {
					ContractsHead.findAll({
						where: {
							isdel: 0,
							contract_state: '有效',
							cus_abb: abb,
							sign_time: {
								'$between': sign_time_between,
							}
						}
					}).then(result => {
						result.forEach((items, index) => {
							sum += Number(items.dataValues.payable);
						});
						Customers.update({
							last_sale: sum
						}, {
							where: {
								abb: abb
							}
						}).then(() => resolve()).catch(e => LOG(e));
					}).catch(e => LOG(e));
				});
			});
			Promise.all(_p).then(() => console.log('complete')).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}

	/**
	 * 年度会员分数递减
	 */
	function updateMemberNewYearActivityScore() {
		const MemberActivityScoreRecord = require('../mongoModel/MemberActivityScoreRecord');
		MemberActivityScoreRecord.find({}, (err, result) => {
			const _p = [];
			result.forEach((items, index) => {
				_p[index] = new Promise((resolve, reject) => {
					const { _id, memberId, content } = items;
					content.lastFourYear = content.lastThreeYear;
					content.lastThreeYear = content.lastTwoYear;
					content.lastTwoYear = content.lastOneYear;
					content.lastOneYear = content.presentYear;
					content.presentYear = { total: 0 };
					MemberActivityScoreRecord.updateOne({
						_id,
					}, {
						content
					}, () => {
						const scoreRate = {
							presentYear: 1,
							lastOneYear: 0.8,
							lastTwoYear: 0.6,
							lastThreeYear: 0.4,
							lastFourYear: 0.2,
						};
						let allActivityScore = 0;
						for (const key in content) {
							let score = Number(content[key]['total']);
							score = scoreRate[key] * score;
							allActivityScore += parseInt(score);
						}
						Member.findOne({ where: { open_id: memberId } }).then(result => {
							const { name, phone } = result.dataValues;
							MemberScore.findOne({
								where: {
									name: name,
									phone: phone,
								},
							}).then(result => {
								const { basic, business, certificate, id } = result.dataValues;
								let total = parseInt(basic) + parseInt(business) + parseInt(certificate) + parseInt(allActivityScore);
								MemberScore.update({
									activity: allActivityScore,
									total,
								}, {
									where: {
										id,
									},
								}).then(() => {
									resolve();
								}).catch(e => LOG(e));
							}).catch(e => LOG(e));
						}).catch(e => console.log(e));
					});
				});
			});
			Promise.all(_p).then(() => console.log('年度更新成功')).catch(e => console.log(e));
		});
	}
}

/**
 * 刷新会员静态分数
 * 每天的凌晨1点10分执行
 */
function refreshMemberStaticScore() {
	const rule = new schedule.RecurrenceRule();

	rule.hour = 1;
	rule.minute = 10;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		// dealer();
	});

	async function dealer() {
		const BaseCalculScore = require('./base').CalculScore;
		const memberList = await Member.findAll();
		await bluebird.map(memberList, async items => {
			await new Promise(resolve => {
				const calculScore = new BaseCalculScore(items.dataValues);
				calculScore.getItemScore(() => {
					calculScore.getPartScore(() => {
						calculScore.updateMemberScore(() => {
							resolve();
						});
					});
				});
			});
		}, { concurrency: 5 });
		console.log('静态分数刷新完成');
	}
}

/**
 * 	更新客户的信用评价(影响注册时需等待5秒钟进入)
 *  每天的凌晨2点执行
 */
function updateCustomersCredit() {
	var rule = new schedule.RecurrenceRule();
	//每天的凌晨2点执行
	// 多个执行点为[]
	rule.hour = 2;
	rule.minute = 0;
	rule.second = 0;
	schedule.scheduleJob(rule, function () {
		dealer();
	});

	function dealer() {
		Customers.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			let res_arr = [];
			result.forEach((items, index) => {
				res_arr.push(items.dataValues.company);
			});
			let _p = [];
			res_arr.forEach(function (items, index) {
				let company = items;
				_p[index] = new Promise((resolve, reject) => {
					member.getOverList(company, async (result) => {
						let credit_qualified = 1;
						if (result[0] == null) {
							// 表示没有预期，再计算是否超额度
							await new Promise(resolve => {
								member.getCreditBasicData({ company }, result => {
									if (result.over_price < 0) {
										credit_qualified = 0;
									} else {
										credit_qualified = 1;
									}
									resolve();
								});
							});
						} else {
							//设为0
							credit_qualified = 0;
						}
						Customers.update({
							credit_qualified: credit_qualified
						}, {
							where: {
								company: company
							}
						}).then(() => resolve()).catch(e => LOG(e));
					});
				});
			});
			Promise.all(_p).then(() => console.log('complete')).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}
}

/**
 * 	计算累计销售额
 *  每天的凌晨4点执行
 */
function updateTotalSale() {
	var rule = new schedule.RecurrenceRule();

	//每天的凌晨4点执行
	rule.hour = 4;
	rule.minute = 0;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		getTotalSale();
	});

	function getTotalSale() {
		Customers.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			let res_arr = [];
			result.forEach((items, index) => {
				if (items.dataValues.abb) res_arr.push(items.dataValues.abb);
			});
			Users.findAll({
				where: {
					isdel: 0
				}
			}).then(result => {
				result.forEach((items, index) => {
					res_arr.push(items.dataValues.abb);
				});
				let _p = [];
				res_arr.forEach((items, index) => {
					_p[index] = new Promise((resolve, reject) => {
						let sum = 0, abb = items;
						ContractsHead.findAll({
							where: {
								isdel: 0,
								cus_abb: abb,
								contract_state: '有效',
								// delivery_time: {
								// 	'$ne': null
								// }
							}
						}).then(result => {
							result.forEach((items, index) => {
								sum += parseInt(items.dataValues.payable);
							});
							Customers.findAll({
								where: {
									isdel: 0,
									abb: abb
								}
							}).then(result => {
								let Model;
								if (result[0] == null) {
									//更新用户表total_sale
									Model = Users;
								} else {
									//更新客户表total_sale
									Model = Customers;
								}
								Model.update({
									total_sale: sum
								}, {
									where: {
										abb: abb
									}
								}).then(() => resolve()).catch(e => LOG(e));
							}).catch(e => LOG(e));
						}).catch(e => LOG(e));
					});
				});
				Promise.all(_p).then(() => console.log('complete')).catch(e => LOG(e));
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}
}

/**
 *  计算近一年销售额
 *  每天的凌晨4点10分执行
 */
function updateLatestYearSale() {
	const rule = new schedule.RecurrenceRule();

	//每天的凌晨4点10分执行
	rule.hour = 4;
	rule.minute = 10;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		getLatestYearSale();
	});

	function getLatestYearSale() {
		Customers.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			const _p = [];
			const newDate = DATETIME();
			const latestDate = DATETIME(Date.parse(newDate) - 60 * 60 * 1000 * 24 * 365);
			result.forEach((items, index) => {
				_p[index] = new Promise((resolve, reject) => {
					const { abb } = items.dataValues;
					let sum = 0;
					ContractsHead.findAll({
						where: {
							isdel: 0,
							cus_abb: abb,
							contract_state: '有效',
							sign_time: {
								'$between': [latestDate, newDate]
							}
						}
					}).then(result => {
						result.forEach((items, index) => {
							sum += parseInt(items.dataValues.payable);
						});
						Customers.update({
							latest_year_sale: sum
						}, {
							where: {
								abb: abb
							}
						}).then(() => resolve()).catch(e => LOG(e));
					}).catch(e => LOG(e));
				});
			});
			Promise.all(_p).then(() => {
				console.log('近一年销售额计算完成');
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}
}

/**
 *  比重系数衰减
 *  每天的凌晨4点20分执行
 */
function goodsReduceCoe() {
	const rule = new schedule.RecurrenceRule();

	//每天的凌晨4点20分执行
	rule.hour = 4;
	rule.minute = 20;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		serviceHomeContract.reduceCoe({}, result => console.log(result));
	});
}

/**
 * redis缓存处理
 * 每天的凌晨4点25分执行
 */
function redisCacheDealer() {
	const rule = new schedule.RecurrenceRule();

	//每天的凌晨4点25分执行
	rule.hour = 4;
	rule.minute = 25;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		dealer();
		// customerCache();
	});

	function dealer() {
		require('../cache/creditInfo').clearCache();
		request.post(ROUTE('admin/getOver'), (err, response, body) => { }).form({
			models: JSON.stringify({
				page: 1,
				pageSize: 1000,
				keywords: '',
			})
		});
	}

	// 客户信息缓存
	function customerCache() {
		serviceHomeCustomers.cacheList({}, result => {
			cacheCustomerInfo.setCache(result);
		});
	}
}

/**
 * 	同步钱包总金额
 */
function syncWalletTotalAmount() {

	const rule = new schedule.RecurrenceRule();

	//每天的凌晨4点30分执行
	rule.hour = 4;
	rule.minute = 30;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		dealer();
	});

	function dealer() {
		deal.calculTotalAmount();
	}
}

/**
 * 信用短信提醒
 * 生日短信提醒
 */
function creditReminder() {
	const rule = new schedule.RecurrenceRule();

	rule.hour = 10;
	rule.minute = 0;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		if (CONFIG.debug) return;
		dealer();
		birthNoti();
	});

	function dealer() {
		request.post(ROUTE('admin/getOver'), (err, response, body) => {
			const data = typeof body == 'object' ? body.data : JSON.parse(body).data;
			const resArr = data.filter(items => items.over_time < 30 && items.credit_line != 0);
			const _p = [];
			const addResArr = [];
			const smsArr = [];
			resArr.forEach((items, index) => {
				_p[index] = new Promise((resolve, reject) => {
					const it = items;
					const { company, abb, over_price, over_time } = items;
					ContractsHead.findOne({
						where: {
							cus_abb: abb,
							isFreeze: 0,
							isdel: 0,
							contract_state: '有效',
							delivery_time: {
								'$ne': 'NULL'
							},
							payable: {
								'$ne': sequelize.col('paid')
							}
						},
						order: [['delivery_time']]
					}).then(result => {
						if (!result) return resolve();
						const { contract_no, payable, paid } = result.dataValues;
						it.contract_no = contract_no;
						it.payable = payable;
						it.paid = paid;
						addResArr.push(it);
						resolve();
					}).catch(e => resolve());
				});
			});
			Promise.all(_p).then(() => {
				const _p = [];
				addResArr.forEach((items, index) => {
					_p[index] = new Promise((resolve, reject) => {
						const it = items;
						const { company, abb, over_price, over_time, contract_no } = it;
						let type;
						if (over_time < 0) {
							type = '1403';
						} else if (over_time < 10) {
							type = '1402';
						} else {
							type = '1401';
						}
						BaseEvent.findOne({
							where: {
								type,
								isdel: 0,
								rem: contract_no,
							}
						}).then(result => {
							if (result) {
								resolve();
							} else {
								// 新增记录，发送短信
								common.createEvent({
									headParams: {
										person: 'system',
										time: TIME(),
										type,
										ownerId: company,
										rem: contract_no,
									},
									bodyParams: {},
								}, () => { });
								smsArr.push(it);
								resolve();
							}
						});
					});
				});
				Promise.all(_p).then(() => {
					console.log('信用遍历完成');
					smsArr.forEach((items, index) => {
						const { over_price, over_time } = items;
						Member.findAll({
							where: {
								company: items.company,
								checked: 1,
								job: {
									'$like': '%财务%',
								}
							}
						}).then(result => {
							result.forEach((_it, _ind) => {
								sendMQ.sendQueueMsg('creditReminder', JSON.stringify({
									name: _it.name,
									phone: _it.phone,
									date: DATETIME(),
									over_price,
									over_time,
								}), result => {
									console.log(result);
								});
							});
						}).catch(e => console.log(e));
					});
				}).catch(e => console.log(e));
			}).catch(e => console.log(e));
		}).form({
			models: JSON.stringify({
				page: 1,
				pageSize: 1000,
				keywords: '',
			})
		});
	}

	function birthNoti() {
		const date = DATETIME();
		Member.findAll({
			where: {
				isdel: 0,
				birth: sequelize.literal('date_format(Member.birth,"%m-%d")=date_format("' + date + '", "%m-%d")'),
			},
		}).then(result => {
			const _p = [];
			result.forEach((items, index) => {
				_p[index] = new Promise((resolve, reject) => {
					const { birth, name, phone, gender, open_id } = items.dataValues;
					if (new Date(birth).getFullYear() > 2010) return resolve();
					let sex;
					sex = gender == '女' ? '女士' : '先生';
					sendMQ.sendQueueMsg('birthNoti', JSON.stringify({
						name: name + sex,
						phone: phone,
						open_id,
					}), result => {
						console.log(result);
					});
					resolve();
				});
			});
			Promise.all(_p).then(() => {
				console.log('会员生日遍历完毕');
			}).catch(e => console.log(e));
		}).catch(e => console.log(e));
	}
}

/**
 * 试产品责任人提醒
 */
function goodsReminder() {
	const rule = new schedule.RecurrenceRule();

	rule.hour = 10;
	rule.minute = 01;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		dealer();
	});

	async function dealer() {
		const goodsArr = await Goods.findAll({ where: { goodsType: '试产品', isdel: 0, mainId: null } });
		const needTipArr = [];
		const _p = [];
		goodsArr.forEach((items, index) => {
			_p[index] = new Promise(async resolve => {
				const { id } = items.dataValues;
				const baseEventEntity = await BaseEvent.findOne({ where: { type: 1002, ownerId: id }, order: [['id', 'DESC']] });
				if (baseEventEntity) {
					const { time } = baseEventEntity.dataValues;
					const timeDirr = Date.now() - Date.parse(time);
					if (timeDirr > 60 * 60 * 24 * 1000 * 30) {
						// 检查有没有记录过
						const logEntity = await BaseEvent.findOne({ where: { type: 1801, ownerId: id }, order: [['id', 'DESC']] });
						if (logEntity) {
							const logTime = logEntity.dataValues.time;
							if (Date.now() - Date.parse(logTime) > 60 * 60 * 24 * 1000 * 30) {
								needTipArr.push(id);
							}
						} else {
							needTipArr.push(id);
						}
					}
				}
				resolve();
			});
		});
		await Promise.all(_p);
		needTipArr.forEach(async items => {
			const id = items;
			// 记录事件
			common.createEvent({
				headParams: {
					person: 'system',
					time: TIME(),
					type: 1801,
					ownerId: id,
				},
				bodyParams: {},
			}, () => { });
			// 发送站内消息
			const mailId = Date.now();
			const staffMap = new base.StaffMap().getStaffMap();
			const goodsEntity = await Goods.findOne({ where: { id } });
			const { manager, goodsName, numbering } = goodsEntity.dataValues;
			const managerUserName = staffMap[manager].user_name;
			request.post(ROUTE('notiPost/add?regName=justRead'), (err, response, body) => {
				console.log(body);
			}).form({
				data: JSON.stringify({
					mailId: mailId,
					class: 'goods',
					priority: '普通',
					frontUrl: '/goods',
					sender: 'system',
					post_time: TIME(),
					title: '分类物品管理',
					content: managerUserName + '借用试产品' + goodsName + '（' + numbering + '）时间过长，请及时处理！',
					votes: '已阅',
					subscriber: manager,
					NotiClientSubs: [
						{
							receiver: manager,
							noti_post_mailId: mailId
						}
					]
				})
			});
		});
	}
}

/**
 * 检查联系簿的联系人是否被取消认证了
 */
function checkVerContacts() {
	const rule = new schedule.RecurrenceRule();

	//每天的凌晨4点40分执行
	rule.hour = 4;
	rule.minute = 40;
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		dealer();
	});

	async function dealer() {
		const memberData = await Member.findAll({ where: { isdel: 0, checked: 1 } });
		const contactsData = await Contacts.findAll({ where: { isdel: 0, verified: 1 } });
		const hashMapper = {};
		memberData.forEach(items => {
			if (!hashMapper[items.phone]) {
				hashMapper[items.phone] = {
					name: items.name,
					company: items.company,
					job: items.job,
				};
			}
		});
		contactsData.forEach(items => {
			if (!hashMapper[items.phone1]) {
				hashMapper[items.phone1] = {
					name: items.name,
					company: items.company,
					job: '非会员',
				};
			}
		});
		const verContactsData = await VerContacts.findAll({ where: { isdel: 0, job: { $ne: '座机' } } });
		verContactsData.forEach(items => {
			const { phone, id } = items.dataValues;
			if (!hashMapper[phone]) {
				serviceHyApp.delVerContacts({ id });
			}
		});
		// 防止新增的认证联系人没同步到这里
		for (const key in hashMapper) {
			const phone = key;
			const name = hashMapper[key].name;
			const company = hashMapper[key].company;
			const job = hashMapper[key].job;
			let isExist = false;
			for (let i = 0; i < verContactsData.length; i++) {
				const items = verContactsData[i].dataValues;
				if (items.phone == phone) {
					isExist = true;
					break;
				}
			}
			if (!isExist) {
				serviceHyApp.addVerContacts({
					name,
					phone,
					company,
					job,
				});
			}
		}
	}
}

/**
 *  开启超时任务
 *  每分钟检查事务消息的超时
 *  2020.03.20新增定时发送事务消息功能
 */
function startOverTimeTask() {
	const taskQueue = new redisClient.classTaskQueue();
	// taskQueue.reset();

	const dealer = () => {
		taskQueue.getIndex(index => {
			console.log(index);
			taskQueue.getQueue(queue => {
				const orderTask = queue[index];
				//处理超时任务
				notiClient.msgOverTimeTask({
					mailIdArr: orderTask
				}, () => { });
				taskQueue.setQueueAndIndex(index, queue);
			});
		});
		new notiClient.DelayMsg().dealer();
	}

	const checkSeckillEnd = () => {
		const serviceSeckill = require('./seckill');
		serviceSeckill.checkSeckillEnd();
	}

	new Promise((resolve, reject) => {
		//检查队列
		taskQueue.getQueue(queue => {
			if (!queue) {
				taskQueue.createQueue(() => {
					resolve();
				});
			} else {
				resolve();
			}
		});
	}).then(() => {
		var rule = new schedule.RecurrenceRule();
		rule.second = 0;
		dealer();
		schedule.scheduleJob(rule, function () {
			//获取index
			//获取指定index的超时任务
			//清空指定index的任务
			//index++
			//存下index
			//存下队列
			dealer();
			// checkSeckillEnd();
		});
	}).catch(e => LOG(e));
}

/**
 * D类客户信息更新
 */
async function updateTypeDInfo() {
	var rule = new schedule.RecurrenceRule();
	rule.minute = [11, 41];
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		console.log(1111111);
		serviceHomeContacts.checkAndUpdateIsMember();
		dealer();
	});

	async function dealer() {
		const typeDInfoArr = await TypeDInfo.findAll();
		const baseMsgArr = await BaseMsg.findAll({ where: { state: { $ne: '关闭' } } });
		const meetMsgArr = await MeetMsg.findAll({ where: { state: 12, isEffect: 1 } });
		const otherMsgArr = await OtherMsg.findAll({ where: { isdel: 0 } });
		const _p = [];
		const staffMapper = new base.StaffMap().getStaffMap();
		typeDInfoArr.forEach((items, index) => {
			const it = items;
			_p[index] = new Promise(async (resolve, reject) => {
				const customerEntity = await Customers.findOne({ where: { user_id: it.dataValues.customer_id } });
				const { company, manager } = customerEntity.dataValues;
				const formData = {
					callNum: 0,
					meetNum: 0,
					otherNum: 0,
					latestNum: 0,
					latest_contact_time_stamp: 0,
					hot_degree: 0,
					other_staff: [],
				};
				baseMsgArr.forEach(items => {
					if (items.dataValues.contact_unit == company) {
						if (Date.parse(items.dataValues.incoming_time) > formData.latest_contact_time_stamp) {
							formData.latest_contact_time_stamp = Date.parse(items.dataValues.incoming_time);
						}
						formData.callNum++;
						if (formData.other_staff.indexOf(items.dataValues.staff) === -1) formData.other_staff.push(items.dataValues.staff);
						if (Date.now() - Date.parse(items.dataValues.incoming_time) < (60 * 60 * 1000 * 24 * 30 * 3)) {
							formData.latestNum++;
						}
					}
				});
				meetMsgArr.forEach(items => {
					if (items.dataValues.company == company) {
						if (Date.parse(items.dataValues.contact_time) > formData.latest_contact_time_stamp) {
							formData.latest_contact_time_stamp = Date.parse(items.dataValues.contact_time);
						}
						if (formData.other_staff.indexOf(items.dataValues.create_person) === -1) formData.other_staff.push(items.dataValues.create_person);
						formData.meetNum++;
						if (Date.now() - Date.parse(items.dataValues.contact_time) < (60 * 60 * 1000 * 24 * 30 * 3)) {
							formData.latestNum++;
						}
					}
				});
				otherMsgArr.forEach(items => {
					if (items.dataValues.company == company) {
						if (Date.parse(items.dataValues.contact_time) > formData.latest_contact_time_stamp) {
							formData.latest_contact_time_stamp = Date.parse(items.dataValues.contact_time);
						}
						if (formData.other_staff.indexOf(items.dataValues.create_person) === -1) formData.other_staff.push(items.dataValues.create_person);
						formData.meetNum++;
						if (Date.now() - Date.parse(items.dataValues.contact_time) < (60 * 60 * 1000 * 24 * 30 * 3)) {
							formData.latestNum++;
						}
					}
				});
				formData.hot_degree = 10 * Number(it.dataValues.intent_degree) + formData.meetNum * 5 + formData.callNum * 1 + formData.otherNum * 1;
				if (formData.latest_contact_time_stamp !== 0) {
					formData.latest_contact_time = TIME(formData.latest_contact_time_stamp);
				} else {
					formData.latest_contact_time = null;
				}
				formData.other_staff = formData.other_staff.filter(items => items)
				const otherStaffNameArr = [];
				formData.other_staff.forEach(items => {
					let staff;
					try {
						staff = staffMapper[items].user_name;
					} catch (e) {

					}
					if (staff != manager) otherStaffNameArr.push(staff);
				});

				await TypeDInfo.update({
					total_contact_num: formData.callNum + formData.meetNum + formData.otherNum,
					latest_contact_num: formData.latestNum,
					latest_contact_time: formData.latest_contact_time,
					hot_degree: formData.hot_degree,
					other_staff: otherStaffNameArr.join(),
				}, {
					where: { id: it.dataValues.id },
				});
				resolve();
			});
		});
		await Promise.all(_p);
		console.log('更新完成');
	}
}

/**
 * pv持久化
 */
async function wxUvPutIn() {
	var rule = new schedule.RecurrenceRule();
	rule.second = 0;

	schedule.scheduleJob(rule, function () {
		dealer();
	});

	async function dealer() {
		const result = await redisClient.WxUvCalcul.GetTodayUser();
		const len = result.length;
		open.recordPVAndUV({ type: 'wx', num: len });
	}
}

/**
 * 线上联系单
 */
async function updateOnlineContactsNum() {

	var rule = new schedule.RecurrenceRule();
	// 每天的早上0点25分执行
	rule.hour = 0;
	rule.minute = 25;
	rule.second = 0;
	schedule.scheduleJob(rule, function () {
		dealer();
	});

	async function dealer() {
		const memberResult = await Member.findAll();
		const memberMapper = {};
		memberResult.forEach(items => {
			memberMapper[items.dataValues.open_id] = items.dataValues;
		});
		const companyMapper = {};
		const _p = [];
		_p[0] = new Promise(async resolve => {
			const openIdMapper = {};
			const result = await NotiClient.findAll({
				where: {
					isdel: 0,
					sender: { $like: '%ox%' },
					frontUrl: { $ne: '/specialLine' },
					isFromCall: 0,
				},
			});
			result.forEach(items => {
				const { sender, post_time, noti_client_affair_group_uuid } = items.dataValues;
				if (!openIdMapper[sender]) openIdMapper[sender] = {
					count: 0,
					latest: 0,
					time: '2010-01-01 00:00:00',
				};
				openIdMapper[sender].count++;
				if (Date.parse(post_time) - Date.parse(openIdMapper[sender].time) > 0) openIdMapper[sender].time = post_time;
				if (Date.now() - Date.parse(post_time) < 60 * 60 * 1000 * 24 * 30 * 3) openIdMapper[sender].latest++;
			});
			for (const open_id in openIdMapper) {
				if (memberMapper[open_id]) {
					const { company } = memberMapper[open_id];
					if (!companyMapper[company]) {
						companyMapper[company] = {
							count: 0,
							latest: 0,
							time: '2010-01-01 00:00:00',
						};
					}
					companyMapper[company].count += openIdMapper[open_id].count;
					companyMapper[company].latest += openIdMapper[open_id].latest;
					companyMapper[company].time = Date.parse(openIdMapper[open_id].time) > Date.parse(companyMapper[company].time) ? openIdMapper[open_id].time : companyMapper[company].time;
				}
			}
			resolve();
		});
		_p[1] = new Promise(async resolve => {
			const uuidMapper = {};
			const result = await NotiClient.findAll({
				where: {
					isdel: 0,
					frontUrl: '/specialLine',
					isFromCall: 0,
				},
			});
			result.forEach(items => {
				const { noti_client_affair_group_uuid, post_time } = items.dataValues;
				if (!uuidMapper[noti_client_affair_group_uuid]) uuidMapper[noti_client_affair_group_uuid] = {
					count: 0,
					latest: 0,
					time: '2010-01-01 00:00:00',
				};
				uuidMapper[noti_client_affair_group_uuid].count++;
				if (Date.parse(post_time) - Date.parse(uuidMapper[noti_client_affair_group_uuid].time) > 0) uuidMapper[noti_client_affair_group_uuid].noti_client_affair_group_uuid = post_time;
				if (Date.now() - Date.parse(post_time) < 60 * 60 * 1000 * 24 * 30 * 3) uuidMapper[noti_client_affair_group_uuid].latest++;
			});
			const uuidArr = [];
			for (const uuid in uuidMapper) {
				uuidArr.push(uuid);
			}
			const affairResult = await Affair.findAll({
				where: {
					uuid: { $in: uuidArr },
				},
			});
			const customerIdToResult = {};
			for (const uuid in uuidMapper) {
				let costomerId;
				affairResult.forEach(items => {
					if (items.dataValues.uuid == uuid) {
						customerIdToResult[items.dataValues.customerId] = uuidMapper[uuid];
					}
				});
			}
			const companyToResult = {};
			const in_p = [];
			let count = -1;
			for (const user_id in customerIdToResult) {
				count++;
				in_p[count] = new Promise(async resolve => {
					const customerEntity = await Customers.findOne({
						where: {
							user_id,
						},
					});
					if (customerEntity) {
						const { company } = customerEntity.dataValues;
						companyToResult[company] = customerIdToResult[user_id];
					}
					resolve();
				});
			}
			await Promise.all(in_p);
			for (const company in companyToResult) {
				if (!companyMapper[company]) {
					companyMapper[company] = {
						count: 0,
						latest: 0,
						time: '2010-01-01 00:00:00',
					};
				}
				companyMapper[company].count += companyToResult[company].count;
				companyMapper[company].latest += companyToResult[company].latest;
				companyMapper[company].time = Date.parse(companyToResult[company].time) > Date.parse(companyMapper[company].time) ? companyToResult[company].time : companyMapper[company].time;
			}
			resolve();
		});
		await Promise.all(_p);
		const formData = [], end_p = [];
		for (const company in companyMapper) {
			formData.push({
				company,
				total: companyMapper[company].count,
				latest_num: companyMapper[company].latest,
				latest_time: companyMapper[company].time,
			});
		}
		formData.forEach((items, index) => {
			end_p[index] = new Promise(async resolve => {
				const result = await OnlineContactsInfo.findOne({ where: { company: items.company } });
				if (result) {
					await OnlineContactsInfo.update(items, { where: { company: items.company } });
				} else {
					await OnlineContactsInfo.create(items);
				}
				resolve();
			});
		});
		await Promise.all(end_p);
		console.log('更新线上联系完成');
	}
}

// getDays(2020);
/**
 *  插入下一年的历程
 */
function getDays(nowYear) {
	// let nowYear = new Date().getFullYear()+1;
	let startDate = nowYear + '-01-01';
	let stamp = 60 * 60 * 1000 * 24;

	CompanyCalendar.findAll({
		where: {
			date: startDate
		}
	}).then(result => {
		if (result.length == 0) {
			const resArr = [];
			while (new Date(startDate).getFullYear() == nowYear) {
				resArr.push(startDate);
				startDate = DATETIME(new Date(Date.parse(startDate) + stamp));
			}
			const _p = [];
			resArr.forEach((items, index) => {
				_p[index] = new Promise((resolve, reject) => {
					CompanyCalendar.create({
						date: items
					}).then(() => resolve()).catch(e => LOG(e));
				});
			});
			Promise.all(_p).then(() => console.log('工作日历插入完毕')).catch(e => LOG(e));
		} else {
			console.log('工作日历已存在');
		}
	}).catch(e => LOG(e));
}

// syncCustomer();
async function syncCustomer() {
	const customerArr = await Customers.findAll();
	const _p = [];
	customerArr.forEach((items, index) => {
		const { user_id } = items.dataValues;
		_p[index] = new Promise(async (resolve) => {
			await TypeDInfo.create({
				customer_id: user_id,
			});
			resolve();
		});
	});
	await Promise.all(_p);
	console.log('同步结束');
}

// updateIntentDegree();
async function updateIntentDegree() {
	const result = await TypeDInfo.findAll();
	const _p = [];
	result.forEach((items, index) => {
		_p[index] = new Promise(async resolve => {
			const { id, intent_degree, total_contact_num } = items.dataValues;
			if (intent_degree == 0 && total_contact_num != 0) {
				await TypeDInfo.update({
					intent_degree: 1,
				}, { where: { id } });
			}
			resolve();
		});
	});
	await Promise.all(_p);
	console.log('okokokok');
}

// updateBussinessTripState();
async function updateBussinessTripState() {
	const _p = [];
	const formData = [
		{
			state: '尚未审核',
			newState: '填报中',
		},
		{
			state: '取消',
			newState: '报销中',
		},
	];
	formData.forEach((items, index) => {
		_p[index] = new Promise(async (resolve, reject) => {
			await BusinessTrip.update({
				state: items.newState,
			}, {
				where: {
					state: items.state,
				},
			});
			resolve();
		});
	});
	await Promise.all(_p);
	console.log('状态更新完成');
}

// TypeDTo3();
async function TypeDTo3() {
	const result = await MeetMsg.findAll({
		isdel: 0,
	});
	const companyMapper = {};
	result.forEach((items, index) => {
		if (!companyMapper[items.dataValues.company]) companyMapper[items.dataValues.company] = 1;
	});
	const user_id_arr = [];
	const customerResult = await Customers.findAll({
		where: {
			isdel: 0,
			level: 'D',
		},
	});
	customerResult.forEach(items => {
		if (companyMapper[items.dataValues.company] || items.dataValues.intention_products) {
			user_id_arr.push(items.dataValues.user_id);
		}
	});
	const _p = [];
	user_id_arr.forEach((items, index) => {
		_p[index] = new Promise(async resolve => {
			const typeDResult = await TypeDInfo.findOne({
				where: {
					customer_id: items,
				},
			});
			const { id, intent_degree, hot_degree } = typeDResult.dataValues;
			const new_hot_degree = hot_degree + (3 - intent_degree) * 10;
			await TypeDInfo.update({
				intent_degree: 3,
				hot_degree: new_hot_degree,
			}, {
				where: { id },
			});
			resolve();
		});
	});
	await Promise.all(_p);
	console.log('意向度转换完成');
}

// D3ToD0();
async function D3ToD0() {
	const result = await new Promise(async resolve => {
		oldFileCustomers.typeDList({
			page: 1,
			num: 100,
			filter: {
				intent_degree: 'D3',
			},
			order: 'intent_degree',
			keywords: '',
		}, result => {
			resolve(result.data.data);
		});
	});
	const needToZeroArr = [];
	result.forEach(items => {
		if (items.dataValues.TypeDInfo.dataValues.total_contact_num === 0) {
			needToZeroArr.push(items.dataValues.TypeDInfo.dataValues.id);
		}
	});
	await TypeDInfo.update({
		intent_degree: 0,
		hot_degree: 0,
	}, {
		where: {
			id: { $in: needToZeroArr }
		},
	});
	console.log('置零成功');
}

// addMemberActivityRecord();
async function addMemberActivityRecord() {
	const logResult = await MemberTrainLog.findAll({
		where: {
			isdel: 0,
		},
	});
	const _p = [];
	logResult.forEach((items, index) => {
		_p[index] = new Promise(async resolve => {
			const { open_id, join_time, award_person, title, content, score, album } = items.dataValues;
			common.createEvent({
				headParams: {
					ownerId: open_id,
					type: '1901',
					time: join_time,
					person: award_person,
				},
				bodyParams: {
					memberActivityType: '培训',
					memberActivityTitle: title,
					memberActivityDate: join_time,
					memberActivityContent: content,
					memberTrainScore: score,
					memberTrainAlbum: album,
				},
			}, result => resolve());
		});
	});
	await Promise.all(_p);
	console.log('添加完成');
}

// nextYearSign();
async function nextYearSign() {
	const holiday = {
		"01-01": {
			"holiday": true,
			"name": "元旦",
			"wage": 3,
			"date": "2020-01-01"
		},
		"01-19": {
			"holiday": false,
			"name": "春节前调休",
			"after": false,
			"wage": 1,
			"target": "春节",
			"date": "2020-01-19"
		},
		"01-24": {
			"holiday": true,
			"name": "除夕",
			"wage": 2,
			"date": "2020-01-24"
		},
		"01-25": {
			"holiday": true,
			"name": "初一",
			"wage": 3,
			"date": "2020-01-25"
		},
		"01-26": {
			"holiday": true,
			"name": "初二",
			"wage": 3,
			"date": "2020-01-26"
		},
		"01-27": {
			"holiday": true,
			"name": "初三",
			"wage": 3,
			"date": "2020-01-27"
		},
		"01-28": {
			"holiday": true,
			"name": "初四",
			"wage": 2,
			"date": "2020-01-28"
		},
		"01-29": {
			"holiday": true,
			"name": "初五",
			"wage": 2,
			"date": "2020-01-29"
		},
		"01-30": {
			"holiday": true,
			"name": "初六",
			"wage": 2,
			"date": "2020-01-30"
		},
		"02-01": {
			"holiday": false,
			"name": "春节后补休",
			"after": true,
			"wage": 1,
			"target": "春节",
			"date": "2020-02-01"
		},
		"04-04": {
			"holiday": true,
			"name": "清明节",
			"wage": 3,
			"date": "2020-04-04"
		},
		"04-05": {
			"holiday": true,
			"name": "清明节",
			"wage": 2,
			"date": "2020-04-05"
		},
		"04-06": {
			"holiday": true,
			"name": "清明节",
			"wage": 2,
			"date": "2020-04-06"
		},
		"04-26": {
			"holiday": false,
			"name": "劳动节前调休",
			"after": false,
			"wage": 1,
			"target": "劳动节",
			"date": "2020-04-26"
		},
		"05-01": {
			"holiday": true,
			"name": "劳动节",
			"wage": 3,
			"date": "2020-05-01"
		},
		"05-02": {
			"holiday": true,
			"name": "劳动节",
			"wage": 2,
			"date": "2020-05-02"
		},
		"05-03": {
			"holiday": true,
			"name": "劳动节",
			"wage": 2,
			"date": "2020-05-03"
		},
		"05-04": {
			"holiday": true,
			"name": "劳动节",
			"wage": 2,
			"date": "2020-05-04"
		},
		"05-05": {
			"holiday": true,
			"name": "劳动节",
			"wage": 2,
			"date": "2020-05-05"
		},
		"05-09": {
			"holiday": false,
			"name": "劳动节后调休",
			"after": true,
			"wage": 1,
			"target": "劳动节",
			"date": "2020-05-09"
		},
		"06-25": {
			"holiday": true,
			"name": "端午节",
			"wage": 3,
			"date": "2020-06-25"
		},
		"06-26": {
			"holiday": true,
			"name": "端午节",
			"wage": 2,
			"date": "2020-06-26"
		},
		"06-27": {
			"holiday": true,
			"name": "端午节",
			"wage": 2,
			"date": "2020-06-27"
		},
		"06-28": {
			"holiday": false,
			"after": true,
			"name": "端午节后调休",
			"wage": 1,
			"target": "端午节",
			"date": "2020-06-28"
		},
		"09-27": {
			"holiday": false,
			"after": false,
			"name": "国庆节前调休",
			"wage": 1,
			"target": "国庆节",
			"date": "2020-09-27"
		},
		"10-01": {
			"holiday": true,
			"name": "中秋节",
			"wage": 3,
			"date": "2020-10-01"
		},
		"10-02": {
			"holiday": true,
			"name": "国庆节",
			"wage": 3,
			"date": "2020-10-02"
		},
		"10-03": {
			"holiday": true,
			"name": "国庆节",
			"wage": 3,
			"date": "2020-10-03"
		},
		"10-04": {
			"holiday": true,
			"name": "国庆节",
			"wage": 2,
			"date": "2020-10-04"
		},
		"10-05": {
			"holiday": true,
			"name": "国庆节",
			"wage": 2,
			"date": "2020-10-05"
		},
		"10-06": {
			"holiday": true,
			"name": "国庆节",
			"wage": 2,
			"date": "2020-10-06"
		},
		"10-07": {
			"holiday": true,
			"name": "国庆节",
			"wage": 2,
			"date": "2020-10-07"
		},
		"10-08": {
			"holiday": true,
			"name": "国庆节",
			"wage": 2,
			"date": "2020-10-08"
		},
		"10-10": {
			"holiday": false,
			"name": "国庆节后调休",
			"after": true,
			"wage": 1,
			"target": "国庆节",
			"date": "2020-10-10"
		}
	}
	let workingDayArr = [];
	const result = await CompanyCalendar.findAll({
		attributes: ['date'],
		where: {
			date: {
				$between: ['2020-01-01', '2020-12-31'],
			},
		},
	});
	result.forEach(items => {
		const week = new Date(items.dataValues.date).getDay();
		if (week !== 6 && week !== 0) {
			workingDayArr.push(items.dataValues.date);
		}
		for (const key in holiday) {
			if (holiday[key].holiday) {
				// 放假
				const index = workingDayArr.indexOf(holiday[key].date);
				if (index !== -1) {
					workingDayArr.splice(index, 1);
				}
			} else {
				// 工作
				workingDayArr.push(holiday[key].date);
			}
		}
	});
	workingDayArr = [...new Set(workingDayArr)];
	workingDayArr = workingDayArr.sort((a, b) => Date.parse(a) - Date.parse(b));
	await CompanyCalendar.update({
		isworkingday: 1,
	}, {
		where: {
			date: {
				$in: workingDayArr,
			},
		},
	});
	console.log('更新完成');
}

// getCpyActivityDegree();
async function getCpyActivityDegree() {
	var xlsx = require('node-xlsx');
	// var x_arr = xlsx.parse('19年济南展会.xlsx');
	// var x_data = x_arr[0].data;
	const insideUnionidArr = [ 'oathZ1F07w7tBCiOFl4X3P1RouJc',
	'oathZ1DgLAgZh976azNe9pDYmQ7k',
	'oathZ1B6GQ2BhHP6twiUrZ5T1iY8',
	'oathZ1NJScoYki2dobPywWMyLzTE',
	'oathZ1PPlDttso2oajg1IgLLUls0',
	'oathZ1PRc-yQFrlOKYNrxnbMrjQI',
	'oathZ1LcH1ndqdbD2oKnwiP3Wu-0',
	'oathZ1OcSfBOvto4tKp_YUMMzpxg',
	'oathZ1IJkdDJWVIm4A-Xt8HAmot8',
	'oathZ1DkLgMdz29mcqJZpwLTO4KU',
	'oathZ1IcVdy6jbeAphyqf5iXhIF4',
	'oathZ1CuzcSS6YtW6F0YpG-D0RMA',
	'oathZ1DPYRxefDNKtlopWSPLJ4Ls',
	'oathZ1D2L4aRMzhmxhNZ0-RIeQ10',
	'oathZ1Km7GcLTM4_LzY8nj5njpL8',
	'oathZ1KIZye_6d7PkWNC-d1Yv050',
	'oathZ1PyAAIzmE84_sf5on_slwdI',
	'oathZ1GyBobtYKyNPXxkWyHc1j3c',
	'oathZ1NTFrjh0JXCQpMLgD5OnUh0',
	'oathZ1OrSBgn47ZolM3HENMR4FZc',
	'oathZ1FuZsSvqJ_OcH7NwVLbZE98',
	'oathZ1NkCVKQq6e8XSY58daLcQy8',
	'oathZ1Hq1B6W3dT1uprVd2l3Qlco',
	'oathZ1MwB7yCIPzFPN3e-3IInAfk',
	'oathZ1IJ4cKWFz40OnqqVgcHvN_U',
	'oathZ1OZFmQwG95WqxvjBKxfSd1M',
	'oathZ1IKP02l1c5IPgzaR5x3GKEE',
	'oathZ1BEAKu1hhhYbloSd_YLLIO4',
	'oathZ1HgkrlvNe3Mk4zchhZTmce4',
	'oathZ1J_oF6D9nt-lLavV2aciRGc',
	'oathZ1GL7DpkWFq_7HDo3ujSstD0',
	'oathZ1AijXFthu-x6_ULz4Hr2n00',
	'oathZ1L995NeuXdBjYAM_Pi1Te9o',
	'oathZ1BMF8btVRZjntvhvzbF5ybA',
	'oathZ1FsMLpTSBqwzSal6IC3vp0A',
	'oathZ1BsVTOAWDUUPVhAJaJcd7vE',
	'oathZ1CnJe0851FqG4n1j-EqSsV8',
	'oathZ1Lkmmj2JjM5bxpE0zQ_F6Cw',
	'oathZ1Mh3soK06VgR6Kfuodx_3RM',
	'oathZ1NtrnMDmqegifhcTfRivwrs',
	'oathZ1F49fgOfG8_r_EV-MPRWd3g',
	'oathZ1MGqGRmS_OHk0F8qVk3_5N4',
	'oathZ1I9mrrFW9N7OH5a0OZ6qSIw',
	'oathZ1NCk62COhUw9bHCby2CMmyE',
	'oathZ1Mkkl5pfkWVfhjetMIwFTAM',
	'oathZ1M5k7bSJ-3ukj8YrPXZhPoE',
	'oathZ1Fq53vbkYhhwnpqes9c4-CA' ];
	const outsideUnionidArr = ["oathZ1AOkXdgFmSPAZjWm6HatLfQ","oathZ1DQ5cXp3LDqEaWOeCS5oM6Q","oathZ1PSFSbg6GMlFsq4GJkROHV0","oathZ1MzehdQbIcwbLjKQSutfGXA","oathZ1DPrcTT0on3YrquPOldIjcU","oathZ1Kk_wtlunQDkXglHDT4z4bQ","oathZ1HMq_NGFqvLA8QQfG5KArQY","oathZ1CzPoZMKdkQu0zsyGiVAE_I","oathZ1JtjnTbqRPTH1H9ls-KNE6U","oathZ1BHcgvDuTMl_GPBqTlUP8cc","oathZ1Cl0zYEExNNiY4w84_hdF9k","oathZ1HSCF9iFlnbc0ntB3umcHJQ","oathZ1AzGEeptVbwNw2oJAy6VSFY","oathZ1DIfRKXNlO9Y_boOf7lTp2E","oathZ1Bz6OVk4HnMeedPHrgE_-uc","oathZ1MxBk_bqODK2jb1RrD0q8KE","oathZ1EMC-voGU7Ul1eHPv2fOr1s","oathZ1Ej3vLtPXHqszyEg-FlIuts","oathZ1A4eWZfn1sVB4vIYQjANAh0","oathZ1KdqF6p5iWevvQNdFOxsIYY","oathZ1IoLXHcRslc01Kljc8ocXaU","oathZ1EyBnb7RH2ChhL-9vb6ZrIQ","oathZ1CmqG-TjNcGpCbppfCDcqyI","oathZ1AiBOVRIk4IYCkPWl6_66U8","oathZ1KsVfb0oBVB-nplYZgdBQ08","oathZ1HH5YB0ZHFirEICOa8mJQMM","oathZ1M7pi2GQkBk_pGIOucIqsk0","oathZ1K96SjROQ-ZETJGAJXQReIo","oathZ1Lo6E2tsq6-fxsRNVlPAQCM","oathZ1PwVHSJTnFtkLOaApVAqO6o","oathZ1I_B3XPkZ14kbWdFEcqLRxo","oathZ1Ml76qOuc6xuqE3n0YrhvjQ","oathZ1DDuiBvuDg3HSq8VOpRTvLI","oathZ1L5AOM5M2sXtWGgKOlXmOnk","oathZ1NfOZ_K8CIYBZmdFo2i7_pw","oathZ1FMCsGkB09l_lkrl2aP-d-s","oathZ1BPzdeHw2a54gl59NVq5b6c","oathZ1Al4UDSaEtuUblBAavMSYtI","oathZ1Fd_rV0HvlM0jaWB2sdy7RY","oathZ1OsEPllJbJN6XwjaWsWBRRI","oathZ1IsEAcyRoL-kF9Ufo514j18","oathZ1Bb0Ydscfs2ZUdD9GVzgXT8","oathZ1GfigGMYvs-XXV8DmiTcbKc","oathZ1KTJjGN6fH1-uSbcCmIseg4","oathZ1DogT_FE0sG1PCPYIze-arg","oathZ1KNtCA2IndmQGeOUUFWtWJ4","oathZ1NtTcXIGsgUGVkxVsjnKOzI","oathZ1KgJ25Ldopy04he41g_pgzo","oathZ1Gwx62mOegwsYZrJK-aBVPY","oathZ1OnFuYko1p8sAZIk7_1SYSg","oathZ1CTi3bp5n0T6pj2q2oFlAr4","oathZ1MWePJCMaivvVRBsRYrpIl4","oathZ1JtHyIcQfiSIfmZhjNHpwtk","oathZ1DkUZ868eerW1s1zlGrJmto","oathZ1ES1WhPX7AT6gte2q5sfuwQ","oathZ1MGHgWzm27ByhSjy-jvxPFE","oathZ1CVIWfWAoeJL_PIzcfe-10I","oathZ1FwhUxRDbxvnSlRKGzclHhM","oathZ1DlUWMDKAlPUmHzb7cjjApE","oathZ1BlmVQ7RhQDaaGSiQET_QL0","oathZ1CovKIJq4InzSsVSBnj9pd0","oathZ1J70siYG1g0HShGnbu_z5go","oathZ1HVnWRwiLEEiMBnmn6ZBuFw","oathZ1HBbpz1qNPWKK7Cde9-XeE8","oathZ1DW1wevKrhYGQaU_ID3AwqI","oathZ1Ge60w5PFaS4iaodA6YRlPs","oathZ1JVcYbcOJG75uYFmF7OzUlI","oathZ1Nbl9sHTxzLeiODrjkuhGAk","oathZ1J2B3ah8PMmpiiIy19faMzw","oathZ1BelSeUDVyb8bplZydXiVGk","oathZ1PLuO5gVVv8HQuiORYHKQ_k","oathZ1KYCwFuVMzFc6SXDF3-XLpc","oathZ1DImh8psFK7EYFC0TKuFhu4","oathZ1C9sZMhTzs2NvIDSaj-LUQw","oathZ1O5xrne65KtOyS9WeDru4hw","oathZ1HOaPhQnS7StLOzPg2eRdSc","oathZ1AZ8b_EGpFgoI5AGkcPPHAA","oathZ1EzU4bHm7XU2rCjpLYzuRac","oathZ1DjA9aUL-3dlSPF2k5wGz2Q","oathZ1FxWKs30DZ6gSNV2EPzOIpw","oathZ1MpZ6nWXWNda7msx96RVuUo","oathZ1D8_pLnoNl2IT35t4Gkuy1I","oathZ1Hv6C6230BbPqaykac33Y-0","oathZ1LY6T78KflJP65BpPtyEfL0","oathZ1NkTWnPkJ6tkw-9pTDfAYYs","oathZ1Ok2Uip25wQ8SXKN0qYcZp4","oathZ1FKR7K0e2wfSQJ2ukAExMW0","oathZ1EJgd6ID8IANiRfj7xU-4Kc","oathZ1G8kQjuFrqbbB6gJJ5pjlvo","oathZ1MbRRm7hVmS6xs0XJzrcZJk","oathZ1FREXXGd7tfzs47buz9XwwE","oathZ1EdzUvvbymlpbiJj7c6Wi08","oathZ1NeLZ8p6lT70PD3FB0uWOIQ","oathZ1FJtlmYdf2EtQbsH628DSXQ","oathZ1NiNTkjynl2NCJJiKXBTYqQ","oathZ1OSuU80PnhvCW1ZLbTpIQI4","oathZ1B_DVxYOllg3TfhFV6GQXvY","oathZ1B9JXjYeNCsCj1a9tiBIU2g","oathZ1HvViBvArVpLdsIKSr2gIK4","oathZ1M_m2x21VQ7J1cKsmpIqCts","oathZ1EfpwOd1fACMmuhjVOBupEs","oathZ1M2tbsNX1SLOtg7hkjZeTSM","oathZ1PllgDM0IQ8nCeR8EuO6kc8","oathZ1KtB99S4WFg8OCQQaRPF-io","oathZ1I24ij-4a1APMA4yqWfWfwc","oathZ1AouP-zcXTW0ZMbgzhhSTNc","oathZ1C9guvv3nFWlpfIAyUQ0fJI","oathZ1PPX2fsxMXmb1Mdi4i9h_7o","oathZ1LhJ3o0EcenqR8gI4xTeLUA","oathZ1Gofg7jsi86kg6oCkvCyF_c","oathZ1GHWJI-TmmsnoaPUvqr8Jc0","oathZ1ObsPh30Q0Wj6-vreHGASQo","oathZ1DHxHIQNZx44n0Fgorz8KR8","oathZ1MNVyIMJ_aK6BLBm5B5toAQ","oathZ1DXHnhzfy9Lzmz6MGIha9FM","oathZ1E8KBihj4pHcX8caUJukhLo","oathZ1EwWJq_UfASVpEgm1FeOjDQ","oathZ1Fc6m2HcinO0NH1Z0ktz6AI","oathZ1MajSIP9WjpSlJ8dhOiYFv0","oathZ1EInW61lxPkHrxwQ40uTdHM","oathZ1KhurI7SkzAU6-d94TwBmVk","oathZ1PokjzF3k01W1lwjDTAB6hY","oathZ1A_w5hATeezcBv3WJD62J4g","oathZ1H2zkTZv5SOeIXcJOaHIw90","oathZ1BBRP9dxyW2tbz-uM8-uFho","oathZ1DGXH3zbko5bnKLgiiLPkFk","oathZ1L0KKH1xNwPTPXB2xnYb3Dk","oathZ1LOrNBnDZtQ3COWHF28Xny8","oathZ1GdeFHWxan3WZrUsq_AU6uw","oathZ1ByhnBdzpeXai9ZnaBXXwhE","oathZ1Dp8eaZ8K38BjoDbqEYznI4","oathZ1CiE5lBQWpnKRcEWgsJJzEA","oathZ1Au6R7s8Wp_JOjRcNLr2m_4","oathZ1LqlpSJ4zICCHUMlvffVP_4","oathZ1FQYgVoFu32LdEjsN3i__IE","oathZ1KSjSrjn2q-MESCt1G7wMI0","oathZ1BatwfdfjwlA5EXEEQSa7vs","oathZ1KO6-nTFlhVAvg8iessR4IU","oathZ1AJc5lxBhA8cClcK916gRns","oathZ1EfOxuK9FU3N5J5BLbOBGFg","oathZ1Df_1QKaSZzcF62UrXWyO8M","oathZ1HDjFaCJDCIVzVuZR_kcqLU","oathZ1EBagsaTQkPUsphD1oFeA7o","oathZ1C80QaIZXlPovt-UfdmVYJY","oathZ1AzjIML15L5DPrh0tJa2J7I","oathZ1NgkuIWh6vD4fWMTRfNysvM","oathZ1PlIE2RmwpwW8Fhz5kxZAvQ","oathZ1LOAREOnGnsV4DotpmD8MlA","oathZ1GJsyIENUYf-rVIP42xg9SU","oathZ1Lbx9T9Ok23WmFoH8Egx9RQ","oathZ1HSxKe3YZJ1whjvXjzqiKL8","oathZ1InqU67uo3J6hx0ehTkcXM0","oathZ1FGeEWh5FLwHc9ExdihA_EU","oathZ1DiW5D5oP52Ib793_8meMAQ","oathZ1Oc2cTaLStz3ln95c18lSh0","oathZ1BYkVkk_3A5gqhm6gxBsjmk","oathZ1EV1BpvZIJbiAoYVPgIC8kk","oathZ1JV68cWgDSk5ytT_34eiXNM","oathZ1KrMDqE_ISYKs9noO1NtNbQ","oathZ1AEds4qU1ArodHGvjaq-QKQ","oathZ1Kdu2WZLnaJTGXXjhEGO21s","oathZ1AR5z6WAo17FlNzmBe9SoiU","oathZ1GzVW0AeNeAJ-slmjEVL8PI","oathZ1JZenmkCLI45Xv2IzyEg8Ss","oathZ1Jl8x3BYVhj2SG5eo06jV98","oathZ1Ajm-0droPQigafPNCXLMwQ","oathZ1Mmb4D8Gc9DCOY-g5jlo2SE","oathZ1NqOXmz85i9DArS1wAA_Q6g","oathZ1G5ZT3amQx5Bcr88GVKTW78","oathZ1A8w6KITPY0Y74Cu9k_L0hY","oathZ1KZCM0Xc9UUvFSfad_gfeUM","oathZ1Oibzn-b4eBP7X318gMA81Q","oathZ1HRLkgfs150uIDdG77UOkzU","oathZ1IOeLnYsx9N59szaXUj5YTU","oathZ1Eo5f-vxfqk6dfJEx7dxrBA","oathZ1F8jI9i8ZXxfjkncTNKeKic","oathZ1KfOJjKXODGqTPEeYgdFjAQ","oathZ1FVJmRctDE7xUNg2SWnUrGY","oathZ1D_7os7vcWD8NZGIIxIk6dQ","oathZ1BYIYi5MvDekC_KlZLYoHXw","oathZ1FnlprMxDGcO9zDCYEwmMPo","oathZ1DRaETLth47K26P0U6V07g4","oathZ1NU7fGE3UC5F7f0pYRzrM5U","oathZ1OD_LwV3GcJsiWymr_O3j6s","oathZ1KHfGBEIN9mD97SBvjYxV0o","oathZ1B-P8bKp9EtnY3G8A9U_rT8","oathZ1Dsz6S7dSygWFga6s56icCk","oathZ1E75VYEJTl5heg4Ibss3E4g","oathZ1AWEpBL27NMxSnJNRpKUET0","oathZ1A4X1_19Xu1zKPDu6a-VbGA","oathZ1NHzhrns-j-Ua9mkWIh6mcM","oathZ1FEDkDnk1mAssl-3OFCeyr0","oathZ1D4ENhh78YQ6ym5-8-w8DtE","oathZ1FfyHmO65PnYQkA-YMg_Nbw","oathZ1DFZcWCv_Z58KCUJ-rIlWUA","oathZ1L0k6Z3cvb70FMwuFxZkYVw","oathZ1MIlayH3gEPznQUpmA7PIjQ","oathZ1MiKC5XAJL6O9gwaXzzE7Ss","oathZ1ExL6cY4gHKRgzM4OllscU8","oathZ1L98-OR-fITuLGzQZhaa65Y","oathZ1BLJWf6vg7gFt0GQqJYAtmQ","oathZ1H03SSyCBvnigXsIMEBxdKk","oathZ1PVXno9a-2kVvxEenu6N2gI","oathZ1LqtLj872SBZig6_Lo7eVxg","oathZ1E56MzmBb9lw9dccwiq3qog","oathZ1PCHuw_m3Bub3ORaQZ_vxWs","oathZ1HW4pE2-hIWUp4xg78LVwEM","oathZ1CCOTlqEgIQAIxmUqy-MCZ4","oathZ1AKDjjtodwbO6RFqMxg0fLM","oathZ1JQtJanFmEOzWCuxTTr65n0","oathZ1Mf-ngsLXR2eOXrXF2ZQeXU","oathZ1JFAoG-i2HRKHDoj9WX_I2Y","oathZ1NAFJ6Dex4cDHObRzSbqQZQ","oathZ1PkvV0nIKndsMJyOGoCEDuk","oathZ1IHW3F9FeAIr1LTUbIuq8qI","oathZ1N-aPmPJsXhnUXIODt-1sWE","oathZ1DH1cQ53b6JowRKYNMUg1tw","oathZ1ApFCII_7m3LxeofNsWgJ_s","oathZ1MmBvYvAc61OOLOnFjBfEGo","oathZ1ONkbj7cJ8r9LQkvi4eqZZs","oathZ1B6Aba05IL4pJp-3kNoer0I","oathZ1OQAYnDeJXrCTCAFs9XajvQ","oathZ1N05z0okkUouFoQAh-C9EBo","oathZ1MMrbJcYzYL79FLt_7eEjG0","oathZ1BJT0_s5No0NcoTkTugsI5Q","oathZ1ITUn1t8-fj9dscXu3faZ30","oathZ1Djb54kwUckVF6McHu_uPsE","oathZ1NLOx7GjzUyCWF4DhrJ38Eg","oathZ1Azz7cnEhGlcDOCqqDPm5Qw","oathZ1IcGTHZPv9S-11rjGOcjPLs","oathZ1GNqmmV8ReXVJP6TKbuvPUk","oathZ1CqEAcmVbtGzRh2PSIhUyOw","oathZ1BCnI-hfOSTbINEHlAGOQSE","oathZ1Lgmbc-RiBP0MbTQkcPk7wo","oathZ1PFOBDZ0Urj2j-0tZjkwCTo","oathZ1MKP1xteo-cvnea6UlAl4js","oathZ1FdF3HC5Bjq57lrMrR1jCOQ","oathZ1ECpQI6Ylv5Ybv0Lt5j1ZqA","oathZ1B3FITJVM-9yMXGJO1Simi4","oathZ1Ar-82J7VQ8P6lJvCcTevQA","oathZ1BH-d9nuE6etL2661E-F_aI"];
	// const unionidArr = x_data.map(items => items[0]);
	const memberArr = await Member.findAll({ checked: 1 });
	let memberTrainLogArr = await MemberTrainLog.findAll({ where: { isdel: 0 } });
	memberTrainLogArr = memberTrainLogArr.map(items => items.dataValues.open_id);
	const companyMap = {};
	memberArr.forEach(items => {
		const { company } = items.dataValues;
		if (!companyMap[company]) {
			companyMap[company] = {
				cert: 0,
				meeting: 0,
				member: 0,
				boss: false,
				online: 0,
			};
		}
	});
	memberArr.forEach(items => {
		const { company, job, unionid, open_id } = items.dataValues;
		companyMap[company].member++;
		if (job && (job.indexOf('法人') !== -1 || job.indexOf('合伙人') !== -1)) {
			companyMap[company].boss = true;
		}
		if (insideUnionidArr.indexOf(unionid) !== -1) {
			companyMap[company].meeting++;
		}
		if (outsideUnionidArr.indexOf(unionid) !== -1) {
			companyMap[company].online++;
		}
		if (memberTrainLogArr.indexOf(open_id) !== -1) {
			companyMap[company].cert++;
		}
	});
	let customerArr = await Customers.findAll({attributes: [ 'company', 'abb', 'credit_line', 'level' ], where: { isdel: 0 }});
	customerArr = customerArr.map(items => items.dataValues);
	const endCompanyMap = {};
	const amountArr = await new Promise(resolve => {
		serviceHomePricingList.getAchievementInfo({
			startTime: '2020-01-01',
			endTime: '2020-12-31',
		}, result => {
			resolve(result.data);
		});
	});
	customerArr.forEach(items => {
		endCompanyMap[items.company] = {
			abb: items.abb,
			cert: 0,
			meeting: 0,
			online: 0,
			member: 0,
			boss: false,
			amount: 0,
			hasSendAmount: 0,
			credit_line: items.credit_line,
			level: items.level,
		};
		if (companyMap[items.company]) {
			endCompanyMap[items.company].cert = companyMap[items.company].cert;
			endCompanyMap[items.company].meeting = companyMap[items.company].meeting;
			endCompanyMap[items.company].online = companyMap[items.company].online;
			endCompanyMap[items.company].member = companyMap[items.company].member;
			endCompanyMap[items.company].boss = companyMap[items.company].boss;
		}
		amountArr.forEach(it => {
			if (items.company == it.company) {
				endCompanyMap[it.company].amount += Number(it.achievement);
				if (it.hasDelivery) {
					endCompanyMap[it.company].hasSendAmount += Number(it.achievement);
				}
			}
		});
	});
	const data = [
		[ '等级', '公司名', '证书数', '济南现场展示会', '线上直播', '认证会员数', '老板是否会员', '19年全部业绩', '19年已发货业绩', '信用额' ],
	];
	for (const company in endCompanyMap) {
		const arr = [];
		arr.push(endCompanyMap[company].level);
		arr.push(company);
		arr.push(endCompanyMap[company].cert);
		arr.push(endCompanyMap[company].meeting);
		arr.push(endCompanyMap[company].online);
		arr.push(endCompanyMap[company].member);
		arr.push(endCompanyMap[company].boss);
		arr.push(endCompanyMap[company].amount);
		arr.push(endCompanyMap[company].hasSendAmount);
		arr.push(endCompanyMap[company].credit_line);
		data.push(arr);
	}
	const buffer = xlsx.build([
		{
			name: 'sheet1',
			data,
		}
	]);
	fs.writeFileSync('客户会员活动统计20210119.xlsx',buffer,{'flag':'w'});
}

// ProductModelCode();
async function ProductModelCode () {
	const Products = require('../dao').Products;
	const allProducts = await Products.findAll();
	const len = allProducts.length;
	let count = 0;
	dealer(count);

	async function dealer(i) {
		const { model, id } = allProducts[i].dataValues;
		let modelCode;
		if (model === 'Vir800') {
			modelCode = 1800;
		} else if (model === 'Vir801') {
			modelCode = 1801;
		} else if (model === 'Vir802') {
			modelCode = 1802;
		} else if (model === 'Vir881') {
			modelCode = 1881;
		} else if (model === 'Vir884') {
			modelCode = 1884;
		}
		if (modelCode) {
			await Products.update({ modelCode }, { where: { id }});
		}
		count++;
		if (count < len) {
			dealer(count);
		} else {
			console.log('完成');
		}
	}
}

// getExcel();
async function getExcel() {
	var xlsx = require('node-xlsx');
	const PricingList = require('../dao').PricingList;
	const PricingListGoods = require('../dao').PricingListGoods;
	const PricingListGoodsAmount = require('../dao').PricingListGoodsAmount;
	const ProductsLibrary = require('../dao').ProductsLibrary;
	const contractsList = await ContractsHead.findAll({
		where: {
			isdel: 0,
			delivery_time: {
				'$between': ['2019-01-01', '2019-12-31'],
			},
			contract_state: '有效',
		},
	});
	const contractArr = contractsList.map(items => items.dataValues.contract_no);
	const pricingList = await PricingList.findAll({
		attributes: [ 'id' ],
		where: {
			contract_no: { $in: contractArr },
			isdel: 0,
			isPower: 1,
		},
	});
	const pricingIdArr = pricingList.map(items => items.dataValues.id);
	const result = await PricingListGoods.findAll({
		include: [ PricingListGoodsAmount ],
		where: {
			pricing_list_id: { $in: pricingIdArr },
		},
	});
	const goodsMapper = {};
	result.forEach(items => {
		const { goods_num, goods_type } = items.dataValues;
		items.dataValues.PricingListGoodsAmounts.forEach(it => {
			const { name, num } = it.dataValues;
			if (name) {
				if (goodsMapper[name] === undefined) {
					goodsMapper[name] = { num: goods_num * num, type: goods_type };
				} else {
					goodsMapper[name] = { num: goodsMapper[name].num + goods_num * num, type: goods_type };
				}
			}
		});
	});
	let goodsArr = [];
	for (const key in goodsMapper) {
		goodsArr.push({
			type: goodsMapper[key].type,
			name: key,
			num: goodsMapper[key].num,
			hours: 0,
		});
	}
	goodsArr = goodsArr.sort((a, b) => { return b.num - a.num });
	const productAll = await ProductsLibrary.findAll({ where: { isdel: 0 } });
	const productMapper = {};
	productAll.forEach(items => {
		productMapper[items.dataValues.product_name] = items.dataValues.work_hours;
	});
	goodsArr.forEach((items, index) => {
		if (productMapper[items.name]) {
			goodsArr[index].hours = productMapper[items.name];
		}
		goodsArr[index].totalHours = goodsArr[index].hours * goodsArr[index].num;
	});
	const data = [
		[ '类型', '名称', '数量', '工时', '总工时' ]
	];
	goodsArr.forEach(items => {
		data.push([
			items.type,
			items.name,
			items.num,
			items.hours,
			items.totalHours,
		]);
	});
	const buffer = xlsx.build([
		{
			name: 'sheet1',
			data,
		}
	]);
	fs.writeFileSync('19年成本工时统计.xlsx',buffer,{'flag':'w'});
}

// updateMultCompany();
async function updateMultCompany() {
	const result = await Member.findAll();
	const _p = [];
	result.forEach((items, index) => {
		_p[index] = new Promise(async resolve => {
			const { id, company, job, checked } = items.dataValues;
			await Member.update({ mult_company: JSON.stringify([{
				company,
				job,
				checked,
				selected: 1,
			}])}, { where: { id }});
			resolve();
		});
	});
	await Promise.all(_p);
	console.log('wancheng');
}

// checkContractDealerSame();
async function checkContractDealerSame() {
	const Products = require('../dao').Products;
	const contractListEntity = await ContractsHead.findAll({ where: {
		isdel: 0,
		contract_state: '有效'
	}});
	const customerListEntity = await Customers.findAll({ where: { isdel: 0 } });
	const customerMapper = {};
	customerListEntity.forEach(items => {
		customerMapper[items.dataValues.abb] = items.dataValues.user_id;
	});
	let count = 0, len = contractListEntity.length;
	dealer();

	async function dealer() {
		if (count == len || count > len) {
			console.log('ookk');
			return;
		}
		const contractItem = contractListEntity[count];
		const { cus_abb, snGroup } = contractItem.dataValues;
		let snGroupArr = [];
		try {
			snGroupArr = snGroup.split(',').filter(items => items);
		} catch (e) {
			snGroupArr = [];
		}
		if (!customerMapper[cus_abb]) {
			count++;
			dealer();
		} else {
			if (snGroupArr.length === 0) {
				count++;
				dealer();
			} else {
				const snList = await Products.findAll({ where: { isdel: 0, serialNo: { $in: snGroupArr }}});
				let inCount = 0, inLen = snList.length;
				await inDealer();
				count++;
				dealer();

				async function inDealer() {
					if (inCount == inLen || inCount > inLen) {
						return;
					} else {
						const it = snList[inCount];
						const { dealer, id } = it.dataValues;
						if (!dealer) {
							await Products.update({ dealer: customerMapper[cus_abb] }, { where: { id } });
							// console.log(it.dataValues.serialNo);
						}
						inCount++;
					}
					return await inDealer();
				}
			}
		}
	}
}

// addMemberUserId();
async function addMemberUserId() {
	let user_id = 20000;
	const list = await Member.findAll();
	await bluebird.map(list, async items => {
		user_id++;
		const { id } = items.dataValues;
		const memberId = user_id;
		await Member.update({ user_id: memberId }, { where: { id } });
	}, { concurrency: 10 });
}

// createGoodsExcel();
async function createGoodsExcel() {
	var xlsx = require('node-xlsx');
	const result = await Goods.findAll({ where: { isdel: 0 } });
	const data = [
		[ '编号', '名称', '购买日期', '原值', '现值', '责任人' ],
	];
	const staffMap = new base.StaffMap().getStaffMap();
	result.forEach((items, index) => {
		const arr = [];
		arr.push(items.dataValues.numbering);
		arr.push(items.dataValues.goodsName);
		arr.push(items.dataValues.purchaseTime);
		arr.push(items.dataValues.originalValue);
		arr.push(items.dataValues.presentValue);
		let name;
		try {
			name = staffMap[items.dataValues.manager].user_name;
		} catch (e) {
			name = items.dataValues.manager;
		}
		arr.push(name);
		data.push(arr);
	});
	const buffer = xlsx.build([
		{
			name: 'sheet1',
			data,
		}
	]);
	fs.writeFileSync('物品2020-05-18.xlsx',buffer,{'flag':'w'});
}

// addDynaCard();
async function addDynaCard() {
	var xlsx = require('node-xlsx');
	var moment = require('moment');
	var Products = require('../dao').Products;
	var x_arr = xlsx.parse('20年以前的代龙卡3.xlsx');
	var x_data = x_arr[0].data;
	x_data.shift();
	await bluebird.map(x_data, async items => {
		const serialNo = items[0];
		const model = items[1];
		const modelCode = items[2];
		const dealer = items[3];
		const maker = items[4];
		const inputDate = items[5];
		const inputPerson = items[6];
		const update_time = items[7];
		const update_person = items[8];
		const snEntity = await Products.findOne({ where: { serialNo, isdel: 0 } });
		if (!snEntity) {
			await Products.create({
				serialNo,
				model,
				modelCode,
				dealer,
				maker,
				inputDate,
				inputPerson,
				update_time,
				update_person,
			});
		}
	}, { concurrency: 10 });
	console.log('okok');
}

// memberUserId();
async function memberUserId() {
	const memberList = await Member.findAll();
	await bluebird.map(memberList, async items => {
		let { id, user_id } = items.dataValues;
		user_id = Number(user_id) + 10000;
		await Member.update({ user_id }, { where: { id } });
	}, { concurrency: 10 });
	console.log('okoko');
}

// createMemberWallet();
async function createMemberWallet() {
	const homeWallet = require('./homeWallet');
	const memberEntityList = await Member.findAll();
	const userIdArr = memberEntityList.map(items => items.dataValues.user_id);
	await bluebird.map(userIdArr, async items => {
		await new Promise(resolve => {
			homeWallet.addCount({
				user_id: items,
			}, () => resolve());
		});
	}, { concurrency: 10 });
	console.log('asdsdsaads');
}

// coupTransfer();
async function coupTransfer() {
	const WalletCoup = require('../dao').WalletCoup;
	const BankCoup = require('../dao').BankCoup;
	const WalletDepo = require('../dao').WalletDepo;
	const BankDepo = require('../dao').BankDepo;

	// 抵价券
	const oldCoupList = await WalletCoup.findAll({ where: { isdel: 0, amount: 100 } });
	const newCoupList = [];
	oldCoupList.forEach(items => {
		const { coupon_no, original_price, isPower, endTime, wallet_id } = items.dataValues;
		newCoupList.push({
			coupon_no,
			amount: original_price,
			isPower,
			is_assign: 1,
			endTime,
			create_time: TIME(Date.parse(endTime) - 60 * 60 * 1000 * 24 * 365),
			create_person: '1603',
			own_id: wallet_id,
		});
	});
	await BankCoup.bulkCreate(newCoupList);
	deal.Coup.timeout();

	// 保证金
	// const oldDepoList = await WalletDepo.findAll({ where: { isdel: 0 } });
	// const newDepoList = [];
	// oldDepoList.forEach(items => {
	// 	const { contract_no, amount, original_price, isPower, endTime, wallet_id } = items.dataValues;
	// 	newDepoList.push({
	// 		contract_no,
	// 		amount,
	// 		original_amount: original_price,
	// 		isPower,
	// 		endTime,
	// 		create_time: TIME(Date.parse(endTime) - 60 * 60 * 1000 * 24 * 365 * 2),
	// 		create_person: '1603',
	// 		own_id: wallet_id,
	// 	});
	// });
	// await BankDepo.bulkCreate(newDepoList);
	// deal.Depo.timeout();
}

// addUsedCoupon();
async function addUsedCoupon() {
	const WalletCoup = require('../dao').WalletCoup;
	const BankCoup = require('../dao').BankCoup;

	const oldCoupList = await WalletCoup.findAll({ where: { isdel: 0, amount: 0 } });
	const newCoupList = [];
	const mapper = {};
	const r = await BankCoup.findAll();
	r.forEach(items => {
		mapper[items.dataValues.coupon_no] = 1;
	});
	oldCoupList.forEach(async items => {
		const { coupon_no, endTime, wallet_id } = items.dataValues;
		if (!mapper[coupon_no]) {
			newCoupList.push({
				coupon_no,
				amount: 100,
				isPower: 0,
				is_assign: 1,
				endTime,
				create_time: TIME(Date.parse(endTime) - 60 * 60 * 1000 * 24 * 365),
				create_person: '1603',
				own_id: wallet_id,
			});
		}
	});
	await BankCoup.bulkCreate(newCoupList);
}

// transActivityToScore();
async function transActivityToScore() {
	const Member = require('../dao').Member;
	const MemberActivityScoreRecord = require('../mongoModel/MemberActivityScoreRecord');
	const findByMongoMemberId = async id => {
		return await new Promise(resolve => {
			MemberActivityScoreRecord.findOne({ memberId: id }, (err, mongoRes) => {
				if (err) return reject(e);
				resolve(mongoRes);
			});
		});
	}
	const calculScore = params => {
		const basicArr = [
			{ name: 'sign', max: 3000 },
			{ name: 'payment', max: 10000 },
			{ name: 'read', max: 500 },
			{ name: 'share', max: 1500 },
		];
		let totalScore = 0;
		basicArr.forEach(items => {
			if (params.hasOwnProperty(items.name)) {
				let score = Number(params[items.name]) * 10;
				score = score > items.max ? items.max : score;
				totalScore += score;
			}
		});
		return totalScore;
	}

	const memberList = await Member.findAll();
	await bluebird.map(memberList, async items => {
		const { open_id } = items;
		const result = await findByMongoMemberId(open_id);
		if (result) {
			const { content } = result;
			let totalScore = 0;
			for (const key in content) {
				totalScore += calculScore(content[key]);
			}
			if (totalScore !== 0) {
				// 生成元宝券
				sendMQ.sendQueueMsg('create_score_ticket', JSON.stringify({
					open_id,
					score: totalScore,
					type: '20年9月结算',
				}), result => console.log(result));
			}
		}
	}, { concurrency: 5 });
	memberScoreDealer.calculCooperAndActivity();
}

// addContractGrade();
async function addContractGrade() {
	const moment = require('moment');
	const list = await ContractsHead.findAll({
		where: {
			isdel: 0,
			// contract_state: '有效',
		},
	});
	const signMapper = {};
	for (let i = 0; i < list.length; i++) {
		const { sign_time, cus_abb } = list[i].dataValues;
		if (!signMapper[cus_abb]) {
			signMapper[cus_abb] = sign_time;
		} else {
			if (Date.parse(sign_time) < Date.parse(signMapper[cus_abb])) {
				signMapper[cus_abb] = sign_time;
			}
		}
	}
	await bluebird.map(list, async items => {
		const { cus_abb, sign_time, id } = items.dataValues;
		let grade = 1;
		if (sign_time !== signMapper[cus_abb]) {
			grade = Math.ceil(moment(sign_time).diff(moment(signMapper[cus_abb]), 'years', true));
		}
		await ContractsHead.update({ grade }, { where: { id } });
	}, { concurrency: 5 });
	console.log('grade更新完成');
}

// setCustomerRegPower();
async function setCustomerRegPower() {
	const ucode = require('../lib/ucode.node');
	const customerList = await Customers.findAll({ attributes: ['user_id'] });
	await bluebird.map(customerList, async items => {
		const { user_id } = items.dataValues;
		const code = ucode.myOperKey(Number(user_id), 1234567);
		if (code !== 0) {
			await Customers.update({ hasRegPower: 1 }, { where: { user_id } });
		}
	}, { concurrency: 10 });
	console.log('okokoko');
}

// createProductOrder();
async function createProductOrder() {
	const ProductOrder = require('../dao').ProductOrder;
	const ContractsHead = require('../dao').ContractsHead;

	const contractList = await ContractsHead.findAll({ 
		attributes: ['id', 'snGroup', 'otherSnGroup'], 
		where: { isdel: 0, contract_state: '有效' },
	});
	for (let i = 0; i < contractList.length; i++) {
		const { id, snGroup, otherSnGroup } = contractList[i];
		let snGroupArr, otherSnGroupArr;
		try {
			snGroupArr = snGroup.split(',').filter(items => items);
		} catch (e) {
			snGroupArr = [];
		}
		try {
			otherSnGroupArr = otherSnGroup.split(',').filter(items => items);
		} catch (e) {
			otherSnGroupArr = [];
		}
		const totalSnArr = [...snGroupArr, ...otherSnGroupArr];
		for (let j = 0; j < totalSnArr.length; j++) {
			const serialNo = totalSnArr[j];
			await ProductOrder.create({ serialNo, contract_id: id, isdel: 0, isReplaced: 0 });
		}
	}
	console.log('complete');
}

// addHistorySnToProductOrder();
async function addHistorySnToProductOrder() {
	const ProductOrder = require('../dao').ProductOrder;
	const ContractsHead = require('../dao').ContractsHead;

	const contractList = await ContractsHead.findAll({
		attributes: ['id', 'snGroup', 'otherSnGroup'],
		where: { isdel: 0, contract_state: '有效' },
	});

	await bluebird.map(contractList, async items => {
		const { id, snGroup, otherSnGroup } = items.dataValues;
		let snGroupArr = [], otherSnGroupArr = [];
		try {
			snGroupArr = snGroup.split(',').filter(items => items);
		} catch (e) {
			snGroupArr = [];
		}
		try {
			otherSnGroupArr = otherSnGroup.split(',').filter(items => items);
		} catch (e) {
			otherSnGroupArr = [];
		}
		let totalSnArr = [...snGroupArr, ...otherSnGroupArr];
		totalSnArr = [...new Set(totalSnArr)];
		await bluebird.map(totalSnArr, async sn => {
			const isExist = await ProductOrder.findOne({ where: { serialNo: sn, isdel: 0 } });
			if (!isExist) {
				await ProductOrder.create({ serialNo: sn, contract_id: id });
			}
		});
	}, { concurrency: 1 });
	console.log('导入完成');
}