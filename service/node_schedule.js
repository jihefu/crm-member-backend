var schedule = require("node-schedule"); 
var fs = require("fs"); 
var BaseMsg = require('../dao').BaseMsg;
var CallMsg = require('../dao').CallMsg;
var ContractsHead = require('../dao').ContractsHead;
var ContractsBody = require('../dao').ContractsBody;
var ContractsOffer = require('../dao').ContractsOffer;
var PricingList = require('../dao').PricingList;
var Customers = require('../dao').Customers;
var Users = require('../dao').Users;
var member = require('./member');
var hybridApp = require('./hybrid_app');
var creditTrend = require('./creditTrend');
var common = require('./common');
const request = require('request');
var AttendanceDate = require('../dao').AttendanceDate;
var Staff = require('../dao').Staff;
var StaffSign = require('../dao').StaffSign;
var serviceSign = require('./homeAttendance');
const serviceHomeCustomers = require('./homeCustomers');
const base = require('./base');
const service = require('./service');
var Member = require('../dao').Member;
var xlsx = require('node-xlsx');
var Linq = require('linq');
var redisClient = require('./redis');
var CompanyCalendar = require('../dao').CompanyCalendar;
const notiClient = require('./homeNotiSystem');
var ProductsLibrary = require('../dao').ProductsLibrary;
const serviceHomeContract = require('./homeContracts');
var Wallet = require('../dao').Wallet;
var WalletCoup = require('../dao').WalletCoup;
var WalletDepo = require('../dao').WalletDepo;
var serviceWallet = require('./HomeWallet');
const sequelize = require('../dao').sequelize;
const HomePricingList = require('./homePricingList');
const ctrlGreeting = require('../controllers/greeting');
const Goods = require('../dao').Goods;
const GoodsBorrowRecords = require('../dao').GoodsBorrowRecords;
const SoftVersion = require('../dao').SoftVersion;
const SignActivity = require('../dao').SignActivity;
const MemberScore = require('../dao').MemberScore;
const MemberMsg = require('../dao').MemberMsg;
const ctrlPayments = require('../controllers/payments');
const BaseEvent = require('../dao').BaseEvent;
const sendMQ = require('./rabbitmq').sendMQ;
const cacheCustomerInfo = require('../cache/cacheCustomerInfo');
const Affair = require('../dao').Affair;
const ProjectAffair = require('../dao').ProjectAffair;
const SmallAffair = require('../dao').SmallAffair;
const VerContacts = require('../dao').VerContacts;
const Contacts = require('../dao').Contacts;
const serviceHyApp = require('./hybrid_app');


new base.StaffMap().setStaffMap();

addSignItem();

autoLeave();

checkProgressUpdate();

autoEndOverWork();

goodsReduceCoe();

// greetingSMS();

/*更新累计销售额*/
updateTotalSale();

/*更新近一年销售额*/
updateLatestYearSale();

/*更新客户信用*/
updateCustomersCredit();

/*插入信用相关数据*/
insertCretitTrendData();

/**检查保证金和抵价券是否过期*/
checkNumberingOverTime();

/**同步钱包总金额 */
syncWalletTotalAmount();

/**新年任务 */
newYearWork();

/**会员静态分数更新 */
refreshMemberStaticScore();

/**信用提醒（催款）&& 生日短信提醒 */
creditReminder();

/**redis缓存处理 */
redisCacheDealer();

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
	schedule.scheduleJob(rule, function(){
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
	schedule.scheduleJob(rule, function() {
		serviceSign.calculUpdateTickScore({},() => {});
	});
}

/**
 *  自动结束加班
 *  每天的22点0分执行
 */
function autoEndOverWork(){
	var rule = new schedule.RecurrenceRule();
	// 每天的22点执行
	rule.hour = 22;
	rule.minute = 0;
	rule.second = 0;
	schedule.scheduleJob(rule, function(){
		serviceSign.autoEndOverWork();
	});
}

/**
 * 	月底插入具备信用的公司的信用相关数据
 *  每天的23点0分执行
 */
function insertCretitTrendData(){
	var rule = new schedule.RecurrenceRule();
	// 每天的晚上23点执行
	rule.hour = 23;
	rule.minute = 0;
	rule.second = 0;
	schedule.scheduleJob(rule, function(){
	  	dealer();
	});

	function dealer(){
		if(checkDo()==1){
			LOG('插入月底信用数据');
			creditTrend.insertCretitTrendData();
		}

		/*判断是否是当月最后一天*/
		function checkDo(){
			let nowTimeStamp = Date.parse(new Date());
			let nowMonth = new Date().getMonth();
			let nextTimeStamp = nowTimeStamp + 60*60*1000*24;
			let nextMonth = new Date(nextTimeStamp).getMonth();
			if(nowMonth==nextMonth){
				return 0;
			}else{
				return 1;
			}
		}
	}
}

/**
 *  检查保证金和抵价券是否过期
 *  每天的凌晨0点0分执行
 */
function checkNumberingOverTime(){
	const rule = new schedule.RecurrenceRule();

	//每天的凌晨0点0分执行
	rule.hour = 0;
	rule.minute = 0;
	rule.second = 0;

	schedule.scheduleJob(rule, function(){
		dealer();
	});

	function dealer(){
		const _p = [];
		_p[0] = new Promise((resolve,reject) => {
			WalletCoup.findAll({
				where: {
					endTime: DATETIME(),
					isdel: 0,
					isPower: 1
				}
			}).then(result => {
				const in_p = [];
				result.forEach((items,index) => {
					in_p[index] = new Promise((resolve,reject) => {
						serviceWallet.overTimeCoup({
							coupon_no: items.dataValues.coupon_no
						},() => resolve());
					});
				});
				Promise.all(in_p).then(result => resolve()).catch(e => LOG(e));
			}).catch(e => LOG(e));
		});
		_p[1] = new Promise((resolve,reject) => {
			WalletDepo.findAll({
				where: {
					endTime: DATETIME(),
					isdel: 0,
					isPower: 1
				}
			}).then(result => {
				const in_p = [];
				result.forEach((items,index) => {
					in_p[index] = new Promise((resolve,reject) => {
						serviceWallet.overTimeDepo({
							contract_no: items.dataValues.contract_no
						},() => resolve());
					});
				});
				Promise.all(in_p).then(result => resolve()).catch(e => LOG(e));
			}).catch(e => LOG(e));
		});
		Promise.all(_p).then(result => {
			console.log('扫描完毕');
		}).catch(e => LOG(e));
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
	schedule.scheduleJob(rule, function(){
		serviceSign.addSignItem();
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

	schedule.scheduleJob(rule, function(){
		const MM = new Date().getMonth();
		const DD = new Date().getDate();
		if (MM == 0 && DD == 1) {
			getLastSale();
			updateMemberNewYearActivityScore();
		}
	});
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

	schedule.scheduleJob(rule, function(){
		dealer();
	});

	function dealer() {
		const BaseCalculScore = require('./base').CalculScore;
		Member.findAll().then(result => {
			const _p = [];
			result.forEach((items, index) => {
				_p[index] = new Promise((resolve, reject) => {
					const calculScore = new BaseCalculScore(items.dataValues);
					calculScore.getItemScore(() => {
						calculScore.getPartScore(() => {
							calculScore.updateMemberScore(() => {
								resolve();
							});
						});
					});
				});
			});
			Promise.all(_p).then(() => console.log('静态分数刷新完成')).catch(e => console.log(e));
		}).catch(e => LOG(e));
	}
}

/**
 * 	更新客户的信用评价(影响注册时需等待5秒钟进入)
 *  每天的凌晨2点执行
 */
function updateCustomersCredit(){
	var rule = new schedule.RecurrenceRule();
	//每天的凌晨2点执行
	// 多个执行点为[]
	rule.hour = 2;
	rule.minute = 0;
	rule.second = 0;
	schedule.scheduleJob(rule, function(){
	  	dealer();
	});

	function dealer(){
		Customers.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			let res_arr = [];
			result.forEach((items,index) => {
				res_arr.push(items.dataValues.company);
			});
			let _p = [];
			res_arr.forEach(function(items,index){
				let company = items;
				_p[index] = new Promise((resolve,reject) => {
					member.getOverList(company,(result) => {
						let credit_qualified = 1;
						if(result[0]==null){
							//设为1
							credit_qualified = 1;
						}else{
							//设为0
							credit_qualified = 0;
						}
						Customers.update({
							credit_qualified: credit_qualified
						},{
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
function updateTotalSale(){
	var rule = new schedule.RecurrenceRule();

	//每天的凌晨4点执行
	rule.hour = 4;
	rule.minute = 0;
	rule.second = 0;

	schedule.scheduleJob(rule, function(){
	  	getTotalSale();
	});

	function getTotalSale(){
		Customers.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			let res_arr = [];
			result.forEach((items,index) => {
				if(items.dataValues.abb) res_arr.push(items.dataValues.abb);
			});
			Users.findAll({
				where: {
					isdel: 0
				}
			}).then(result => {
				result.forEach((items,index) => {
					res_arr.push(items.dataValues.abb);
				});
				let _p = [];
				res_arr.forEach((items,index) => {
					_p[index] = new Promise((resolve,reject) => {
						let sum = 0,abb = items;
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
							result.forEach((items,index) => {
								sum += parseInt(items.dataValues.payable);
							});
							Customers.findAll({
								where: {
									isdel: 0,
									abb: abb
								}
							}).then(result => {
								let Model;
								if(result[0]==null){
									//更新用户表total_sale
									Model = Users;
								}else{
									//更新客户表total_sale
									Model = Customers;
								}
								Model.update({
									total_sale: sum
								},{
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
function updateLatestYearSale(){
	const rule = new schedule.RecurrenceRule();

	//每天的凌晨4点10分执行
	rule.hour = 4;
	rule.minute = 10;
	rule.second = 0;

	schedule.scheduleJob(rule, function(){
	  	getLatestYearSale();
	});

	function getLatestYearSale(){
		Customers.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			const _p = [];
			const newDate = DATETIME();
			const latestDate = DATETIME(Date.parse(newDate) - 60*60*1000*24*365);
			result.forEach((items,index) => {
				_p[index] = new Promise((resolve,reject) => {
					const { abb } = items.dataValues;
					let sum = 0;
					ContractsHead.findAll({
						where: {
							isdel: 0,
							cus_abb: abb,
							contract_state: '有效',
							sign_time: {
								'$between': [latestDate,newDate]
							}
						}
					}).then(result => {
						result.forEach((items,index) => {
							sum += parseInt(items.dataValues.payable);
						});
						Customers.update({
							latest_year_sale: sum
						},{
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

	schedule.scheduleJob(rule, function(){
		serviceHomeContract.reduceCoe({},result => console.log(result));
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

	schedule.scheduleJob(rule, function() {
		dealer();
		// customerCache();
	});

	function dealer() {
		require('../cache/creditInfo').clearCache();
		request.post(ROUTE('admin/getOver'), (err, response, body) => {}).form({
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
function syncWalletTotalAmount(){

	const rule = new schedule.RecurrenceRule();

	//每天的凌晨4点30分执行
	rule.hour = 4;
	rule.minute = 30;
	rule.second = 0;

	schedule.scheduleJob(rule, function(){
		dealer();
	});

	function dealer(){
		Wallet.findAll({
			include: [WalletCoup,WalletDepo]
		}).then(result => {
			const _p = [];
			result.forEach((items,index) => {
				_p[index] = new Promise((resolve,reject) => {
					const it = items;
					let total_amount = 0;
					it.dataValues.WalletCoups.forEach((items,index) => {
						if(items.dataValues.isPower&&items.dataValues.isdel==0) total_amount += Number(items.dataValues.amount);
					});
					it.dataValues.WalletDepos.forEach((items,index) => {
						if(items.dataValues.isPower&&items.dataValues.isdel==0) total_amount += Number(items.dataValues.amount);
					});
					Wallet.update({
						total_amount
					},{
						where: {
							id: it.dataValues.id
						}
					}).then(() => resolve()).catch(e => LOG(e));
				});
			});
			Promise.all(_p).then(() => console.log('完成')).catch(e => LOG(e));
		}).catch(e => LOG(e));
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

	schedule.scheduleJob(rule, function() {
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
			resArr.forEach((items,index) => {
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
								}, () => {});
								smsArr.push(it);
								resolve();
							}
						});
					});
				});
				Promise.all(_p).then(() => {
					console.log('信用遍历完成');
					smsArr.forEach((items,index) => {
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
				birth: sequelize.literal('date_format(Member.birth,"%m-%d")=date_format("'+date+'", "%m-%d")'),
			},
		}).then(result => {
			const _p = [];
			result.forEach((items, index) => {
				_p[index] = new Promise((resolve, reject) => {
					const { birth, name, phone, gender } = items.dataValues;
					if (new Date(birth).getFullYear() > 2010) return resolve();
					let sex;
					sex = gender == '女' ? '女士' : '先生';
					sendMQ.sendQueueMsg('birthNoti', JSON.stringify({
						name: name + sex,
						phone: phone,
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

function checkVerContacts() {
	const rule = new schedule.RecurrenceRule();

	//每天的凌晨4点40分执行
	rule.hour = 4;
	rule.minute = 40;
	rule.second = 0;

	schedule.scheduleJob(rule, function(){
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
 * 	计算上年销售额
 *  (未做定时任务，一年一次，人工执行)
 */
function getLastSale(){
	Customers.findAll({
		where: {
			isdel: 0
		}
	}).then(result => {
		let res_arr = [];
		result.forEach((items,index) => {
			res_arr.push(items.dataValues.abb);
		});
		let _p = [];
		res_arr.forEach((items,index) => {
			let sum = 0,abb = items;
			_p[index] = new Promise((resolve,reject) => {
				ContractsHead.findAll({
					where: {
						isdel: 0,
						contract_state: '有效',
						cus_abb: abb,
						sign_time: {
							'$between': ['2017-12-31', '2019-01-01']
						}
					}
				}).then(result => {
					result.forEach((items,index) => {
						sum += Number(items.dataValues.payable);
					});
					Customers.update({
						last_sale: sum
					},{
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
					Member.findOne({where: {open_id: memberId}}).then(result => {
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

/**
 * 拜年短信
 */
function greetingSMS() {
	const rule = new schedule.RecurrenceRule();

	// 2019-01-01 08:00:00执行
	rule.month = 0;
	rule.date = 1;
	rule.hour = 8;
	rule.minute = 0;
	rule.second = 0;

	schedule.scheduleJob(rule, function(){
		ctrlGreeting.groupSend('也请您能时时关注我们的最新动态，届时不断会有惊喜等着您');
	});
}

/**
 *  转移数据到客户表
 */
function removeToCustomers(){
	//获取所有用户表数据
	const getAll = (cb) => {
		Users.findAll({
			where: {
				isdel: 0
			},
			order: [['user_id']]
		}).then(resArr => {
			const result = resArr.map(items => items.dataValues);
			cb(result);
		}).catch(e => LOG(e));
	}

	//获取客户表最后一条数据
	const getUserId = (cb) => {
		Customers.findOne({
			order: [['user_id','DESC']]
		}).then(user_id => {
			user_id = user_id.dataValues.user_id;
			cb(user_id);
		}).catch(e => LOG(e));
	}

	//计算新的user_id
	const calculUserId = (user_id) => {
		user_id = new String(user_id);   //结尾不能1,2,3,4
		var d = user_id.slice(0,user_id.length-1);
		var n = user_id.slice(user_id.length-1,user_id.length);
		if(n==0||n==1||n==2||n==3){
			user_id = parseInt(d+5);
		}else{
			user_id = parseInt(user_id)+1;
		}
		if(user_id==1000) user_id = user_id * 10;
		return user_id;
	}

	//验证公司是否存在
	const check = (item,cb) => {
		const { company } = item;
		Customers.findAll({
			where: {
				isdel: 0,
				company: company
			}
		}).then(result => {
			if(result.length==0){
				cb(true);
			}else{
				cb(false);
			}
		}).catch(e => LOG(e));
	}

	getAll(resArr => {

		const aaa = (cb) => {
			const dealer = () => {
				let item = resArr.shift();
				getUserId(user_id => {
					item.user_id = calculUserId(user_id);
					check(item,bool => {
						if(bool){
							Customers.create(item).then(result => {
								if(resArr.length!=0){
									dealer();
								}else{
									cb();
								}
							}).catch(e => LOG(e));
						}else{
							if(resArr.length!=0){
								dealer();
							}else{
								cb();
							}
						}
					});
				});
			}

			dealer();
		}
		
		aaa(() => console.log(112233));
		
	});
}

/**
 *  计算客户表的信息完整度
 */
function calculCustomerInfoScore(){
	Customers.findAll().then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				serviceHomeCustomers.calcauInfo({
					user_id: items.dataValues.user_id
				});
				resolve();
			});
		});
		Promise.all(_p).then(() => {
			console.log(222);
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

/**
 *  批量更新unionid
 */
function updateUnionId(){
	Member.findAll({
		where: {
			open_id: {
				'$ne': null
			}
		}
	}).then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				const { id,open_id } = items.dataValues;
				service.getWxUserInfo({
					open_id: open_id
				},(bodys) => {
					bodys = bodys.data;
					if(bodys.unionid){
						Member.update({
							unionid: bodys.unionid
						},{
							where: {
								id: id
							}
						}).then(() => resolve()).catch(e => LOG(e));
					}else{
						resolve();
					}
				});
			});
		});
		Promise.all(_p).then(result => {
			console.log('okokok');
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

/**
 *  同步member和customers的职位
 * 	有bug，弃用
 */
function jobToCustomers(job){
	Member.findAll({
		where: {
			checked: 1,
			job: job
		}
	}).then(result => {
		const resArr = [];
		result.forEach((items,index) => {
			resArr.push({
				name: items.dataValues.name,
				company: items.dataValues.company
			});
		});
		const _p = [];
		resArr.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				let name = items.name;
				let cpy = items.company;
				Customers.findAll({
					where: {
						isdel: 0,
						company: items.company
					}
				}).then(result => {
					if(result[0]==null){
						resolve();
					}else{
						let orderItem,orderItemArr;
						if(job=='财务'){
							orderItem = result[0].dataValues.finance;
						}else{
							orderItem = result[0].dataValues.purchase;
						}
						try{
							orderItemArr = orderItem.split(',').filter(items => items);
						}catch(e){
							orderItemArr = [];
						}
						orderItemArr.push(name);
						let newOrderItem = orderItemArr.join();
						let updateItem;
						if(job=='财务'){
							updateItem = {
								finance: newOrderItem
							};
						}else{
							updateItem = {
								purchase: newOrderItem
							};
						}
						Customers.update(updateItem,{
							where: {
								company: cpy
							}
						}).then(() => {
							resolve();
						}).catch(e => LOG(e));
					}
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => {
			console.log('okok');
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// parseCustomersExcel();
// calculCustomerInfoScore();

function parseCustomersExcel(){
	const path = DIRNAME+'/downloads/20180718试验机 制造业-批发业 企业数据服务—天眼查(W20071892321531875489979).xlsx';
	var x_arr = xlsx.parse(path);
	var x_data = x_arr[0].data;
	var act_data = x_data.slice(1,x_data.length-1);
	const resArr = [];
	act_data.forEach((items,index) => {
		if(items[0]!=null){
			resArr.push(items);
		}
	});

	//获取客户表最后一条数据
	const getUserId = (cb) => {
		Customers.findOne({
			order: [['user_id','DESC']]
		}).then(user_id => {
			user_id = user_id.dataValues.user_id;
			cb(user_id);
		}).catch(e => LOG(e));
	}

	//计算新的user_id
	const calculUserId = (user_id) => {
		user_id = new String(user_id);   //结尾不能1,2,3,4
		var d = user_id.slice(0,user_id.length-1);
		var n = user_id.slice(user_id.length-1,user_id.length);
		if(n==0||n==1||n==2||n==3){
			user_id = parseInt(d+5);
		}else{
			user_id = parseInt(user_id)+1;
		}
		if(user_id==1000) user_id = user_id * 10;
		return user_id;
	}

	const dealer = () => {
		const end = () => {
			//end
			if(resArr.length==0){
				console.log(111);
			}else{
				dealer();
			}
		}
		let item = resArr.shift();
		const company = item[0];
		const legal_person = item[1];
		const town = item[4];
		const tax_id = item[5];
		const reg_tel = item[6];
		const reg_addr = item[7];
		const manager = item[8];
		const form_data = {
			company: company,
			legal_person: legal_person,
			town: town,
			tax_id: tax_id,
			reg_tel: reg_tel,
			reg_addr: reg_addr,
			manager: manager,
			level: 'D',
			insert_person: 1103,
			insert_time: TIME(),
			update_person: 1103,
			update_time: TIME()
		};
		Customers.findAll({
			where: {
				isdel: 0,
				company: company
			}
		}).then(result => {
			if(result[0]==null){
				getUserId(user_id => {
					form_data.user_id = calculUserId(user_id);
					Customers.create(form_data).then(result => {
						end();
					}).catch(e => LOG(e));
				});
			}else{
				end();
			}
		}).catch(e => LOG(e));
	}

	dealer();
}

/**
 *  插入下一年的历程
 */
function getDays() {
	let nowYear = new Date().getFullYear()+1;
	let startDate = nowYear+'-01-01';
	let stamp = 60*60*1000*24;

	CompanyCalendar.findAll({
		where: {
			date: startDate
		}
	}).then(result => {
		if(result.length==0){
			const resArr = [];
			while(new Date(startDate).getFullYear()==nowYear){
				resArr.push(startDate);
				startDate = DATETIME(new Date(Date.parse(startDate)+stamp));
			}
			const _p = [];
			resArr.forEach((items,index) => {
				_p[index] = new Promise((resolve,reject) => {
					CompanyCalendar.create({
						date: items
					}).then(() => resolve()).catch(e => LOG(e));
				});
			});
			Promise.all(_p).then(() => console.log('工作日历插入完毕')).catch(e => LOG(e));
		}else{
			console.log('工作日历已存在');
		}
	}).catch(e => LOG(e));
}

startOverTimeTask();
/**
 *  开启超时任务
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
				},() => {});
				taskQueue.setQueueAndIndex(index,queue);
			});
		});
	}

	new Promise((resolve,reject) => {
		//检查队列
		taskQueue.getQueue(queue => {
			if(!queue){
				taskQueue.createQueue(() => {
					resolve();
				});
			}else{
				resolve();
			}
		});
	}).then(() => {
		var rule = new schedule.RecurrenceRule();
		rule.second = 0;
		dealer();
		schedule.scheduleJob(rule, function(){
			//获取index
			//获取指定index的超时任务
			//清空指定index的任务
			//index++
			//存下index
			//存下队列
			dealer();
		});
	}).catch(e => LOG(e));
}

// check();
function check(){
	Member.findAll({
		where: {
			checked: 1
		}
	}).then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				let it = items;
				Customers.findOne({
					where: {
						company: items.dataValues.company,
						isdel: 0
					}
				}).then(result => {
					if(!result){
						console.log(it.name+'<<>>'+it.company);
					}
					resolve();
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => console.log(123)).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// calcContractsOffer();
function calcContractsOffer() {
	ContractsHead.findAll({
		where: {
			isdel: 0
		}
	}).then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				const { total_amount, payable, id } = items.dataValues;
				const other_offers = Number(total_amount) - Number(payable);
				ContractsOffer.create({
					contracts_head_id: id,
					other_offers: other_offers
				}).then(() => resolve()).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => console.log('导入完毕')).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// getProductsCost();
function getProductsCost(){
	const path = DIRNAME+'/downloads/生产成本表2.xlsx';
	var x_arr = xlsx.parse(path);
	var x_data = x_arr[0].data;
	x_data.shift();
	const _p = [];
	x_data.forEach((items,index) => {
		_p[index] = new Promise((resolve,reject) => {
			if(items[0]!='服务'){
				ProductsLibrary.create({
					product_type: items[0],
					product_group: items[1],
					product_name: items[2],
					product_price: items[3],
					product_rem: items[4]
				}).then(() => resolve()).catch(e => LOG(e));
			}else{
				resolve();
			}
		});
	});
	Promise.all(_p).then(() => console.log('导入完成')).catch(e => LOG(e));
}

// createWallet();
function createWallet(){
	Customers.findAll({
		where: {
			isdel: 0
		}
	}).then(result => {
		let userIdArr = result.map(items => items.dataValues.user_id);
		userIdArr = [...new Set(userIdArr)];
		const _p = [];
		userIdArr.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				Wallet.create({
					user_id: items
				}).then(() => resolve()).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => console.log('钱包初始化完成')).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// insertCouponByCompany();
function insertCouponByCompany(){
	const path = DIRNAME+'/downloads/抵价券2018展会end.xlsx';
	var x_arr = xlsx.parse(path);
	var x_data = x_arr[0].data;
	x_data.shift();
	Customers.findAll({
		where: {
			isdel: 0
		}
	}).then(result => {
		const hashMaper = {};
		result.forEach((items,index) => {
			hashMaper[items.dataValues.company] = items.dataValues.user_id;
		});
		const allData = [];
		let startNo = 14773;
		x_data.forEach((items,index) => {
			const company = items[0];
			const num = items[1] * 10;
			let user_id = hashMaper[company];
			for (let i = 0; i < num; i++) {
				startNo++;
				allData.push({
					user_id: user_id,
					amount: 100,
					coupon_no: '00'+startNo,
					endTime: '2019-10-31'
				});
			}
		});
		let count = 0,len = allData.length;
		dealer();
		function dealer(){
			serviceWallet.addCoup(allData[count],() => {
				count++;
				if(count<len){
					dealer();
				}else{
					console.log('asddsa');
				}
			});
		}
	}).catch(e => LOG(e));
}

// perfectPricingList();
function perfectPricingList(){
	ContractsHead.findAll({
		where: {
			isdel: 0,
			contract_state: '有效',
			sign_time: {
				'$gt': '2017-12-31'
			}
		}
	}).then(result => {
		const contracts_head = result.map(items => {
			return {
				contract_no: items.dataValues.contract_no,
				payable: items.dataValues.payable,
				cus_abb: items.dataValues.cus_abb,
				sign_time: items.dataValues.sign_time,
				total_amount: items.dataValues.total_amount
			};
		});
		const _p = [];
		contracts_head.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				const i = index;
				const it = items;
				ContractsBody.findAll({
					where: {
						contract_no: items.contract_no
					}
				}).then(result => {
					const contracts_body = result.map(items => {
						return {
							contract_no: items.dataValues.contract_no,
							goods_type: '产品',
							goods_name: items.dataValues.goods_name,
							goods_num: items.dataValues.goods_num
						};
					});
					contracts_head[i].contracts_body = contracts_body;
					resolve();
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => {
			PricingList.findAll({
				where: {
					isdel: 0
				}
			}).then(result => {
				const hashMapper = {};
				result.forEach((items,index) => {
					hashMapper[items.dataValues.contract_no] = 1;
				});
				const len = contracts_head.length;
				let count = 0;
				const dealer = () => {
					if(count==len){
						console.log('结束');
					}else{
						if(hashMapper[contracts_head[count].contract_no]){
							count++;
							dealer();
						}else{
							HomePricingList.add({
								contracts_head: contracts_head[count],
								contracts_body: contracts_head[count].contracts_body,
								admin_id: '1702'
							},() => {
								count++;
								dealer();
							});
						}
					}
				}
				dealer();
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// addSignTime();
function addSignTime(){
	PricingList.findAll().then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				const it = items;
				let { id, contract_no } = it;
				ContractsHead.findOne({
					where: {
						isdel: 0,
						contract_no
					}
				}).then(result => {
					if(!result){
						resolve();
						return;
					}else{
						const { sign_time } = result.dataValues;
						PricingList.update({
							sign_time
						},{
							where: {
								id
							}
						}).then(() => resolve()).catch(e => LOG(e));
					}
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => console.log('111222')).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// getLastSale();
// initLastYearDeposit();
function initLastYearDeposit(){
	Customers.findAll({
		where: {
			isdel: 0
		}
	}).then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				const it = items.dataValues;
				const { user_id, abb, last_sale } = it;
				const amount = Number(last_sale) * 0.03;
				Wallet.findOne({
					where: {
						user_id
					}
				}).then(result => {
					const { id } = result.dataValues;
					WalletDepo.findOne({
						where: {
							contract_no: '2017-'+abb+'-deposit'
						}
					}).then(result => {
						if(result){
							WalletDepo.update({
								amount,
								original_price: amount,
							},{
								where: {
									contract_no: '2017-'+abb+'-deposit'
								}
							}).then(() => resolve()).catch(e => LOG(e));
						}else{
							WalletDepo.create({
								contract_no: '2017-'+abb+'-deposit',
								amount,
								original_price: amount,
								isPower: 1,
								endTime: '2019-12-31',
								wallet_id: id
							}).then(() => resolve()).catch(e => LOG(e));
						}
					}).catch(e => LOG(e));
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => {
			console.log('kkkk');
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// callMsgToOneTable();
function callMsgToOneTable(){
	CallMsg.findAll().then(resArr => {
		const _p = [];
		resArr.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				BaseMsg.update({
					contact_phone: items.dataValues.contact_phone,
					staff_phone: items.dataValues.staff_phone,
					incoming_time: items.dataValues.incoming_time
				},{
					where: {
						id: items.dataValues.base_msg_id
					}
				}).then(() => resolve()).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => {
			console.log('okokok');
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// getMapPhoto();
function getMapPhoto() {
	const dealImages = require('images');
	var dir = DIRNAME+'/public/img/member';
	fs.readdir(dir,(err,result) => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				if(items.indexOf('map_')==-1){
					dealImages(dir+'/'+items).resize(80).save(dir+'/map_'+items,{});
					resolve();
				}else{
					resolve();
				}
			});
		});
		Promise.all(_p).then(() => console.log(123321));
	});
}

// exportWalletExcel();
function exportWalletExcel() {
	Wallet.findAll({
		include: WalletCoup
	}).then(result => {
		const hashMap = {};
		result.forEach((items,index) => {
			hashMap[items.dataValues.user_id] = {};
			let amount = 0;
			items.dataValues.WalletCoups.forEach((it,ind) => {
				amount += Number(it.dataValues.amount);
			});
			hashMap[items.dataValues.user_id].amount = amount;
		});
		return Customers.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			const cusMapper = {};
			result.forEach((items,index) => {
				cusMapper[items.dataValues.user_id] = items.dataValues.company;
			});
			const data = [];
			for(let key in hashMap) {
				data.push([cusMapper[key], hashMap[key]['amount']]);
				hashMap[key]['company'] = cusMapper[key];
			}
			var buffer = xlsx.build([
				{
					name: 'sheet1',
					data,
				}
			]);
			fs.writeFileSync('20190211抵价券.xlsx',buffer,{'flag':'w'});
			console.log(123321);
		}).catch(e => { throw e });
	}).catch(e => console.log(e));
}

// setTimeout(function(){
// 	initGoods();
// },5000);
function initGoods() {
	const path = DIRNAME+'/downloads/物品明细表-2019.02.113.xlsx';
	var x_arr = xlsx.parse(path);
	var x_data = x_arr[0].data;
	x_data.splice(0,2);
	const _p = [];
	const staffMap = new base.StaffMap().getStaffMap();
	x_data.forEach((items,index) => {
		_p[index] = new Promise((resolve,reject) => {
			const goodsType = items[0];
			const numbering = items[1];
			const goodsName = items[2];
			const model = items[3];
			const serialNo = items[4];
			const isBorrow = items[5] == '否' ? 0 : 1;
			const fromMethod = items[6];
			const purchaseTime = items[7] ? DATETIME(new Date(1900, 0, items[7] - 1)) : null;
			const originalValue = items[8];
			const management = items[10];
			const location = items[9];
			let manager = items[11];
			for(let key in staffMap){
				if(staffMap[key].user_name==manager){
					manager = key;
				}
			}
			Goods.create({
				goodsType,
				numbering,
				goodsName,
				model,
				serialNo,
				isBorrow,
				fromMethod,
				purchaseTime,
				originalValue,
				management,
				location,
				insertPerson: 1702,
				updatePerson: 1702,
				insertTime: TIME(),
				updateTime: TIME(),
				borrowStatus: '无借用',
				manager
			}).then(result => {
				const { id } = result.dataValues;
				GoodsBorrowRecords.create({
					borrower: manager,
					borrowStartTime: purchaseTime,
					type: '借用',
					location,
					good_id: id
				}).then(() => resolve()).catch(e => LOG(e));
			}).catch(e => LOG(e));
		});
	});
	Promise.all(_p).then(() => {
		console.log('009988');
	}).catch(e => LOG(e));
}

// initVersionPackageSize();
function initVersionPackageSize() {
	SoftVersion.findAll().then(result => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				const { id, package } = items.dataValues;
				fs.stat(DIRNAME+'/downloads/notiClient/'+package,(err,result) => {
					if(err){
						console.log(err);
						resolve();
					}else{
						const packageSize = result.size;
						SoftVersion.update({
							packageSize
						},{
							where: {
								id
							}
						}).then(() => resolve()).catch(e => LOG(e));
					}
				});
			});
		});
		Promise.all(_p).then(() => {
			console.log(123321);
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// myStream();
function myStream() {
	const { Readable } = require('stream');

	class MyEvent extends Readable {
		constructor(props) {
			super(props);
			this.index = 0;
		}

		_read() {
			if(this.index<5){
				this.index++;
				this.push('当前'+this.index);
			}else{
				this.push(null);
			}
		}
	}

	const myEvent = new MyEvent();

	myEvent.on('data', data => {
		console.log(data.toString());
	});

	myEvent.on('end', data => {
		console.log('end');
	});
}

// myEvent();
function myEvent() {
	const { EventEmitter } = require('events');

	class SubEvent extends EventEmitter {
		constructor(props) {
			super(props);
		}
	}

	const subEvent = new SubEvent();

	subEvent.on('aaa', data => {
		console.log(data);
	});

	subEvent.emit('aaa','str');
}

// addOrderDepo();
function addOrderDepo() {
	PricingList.findAll({
		where: {
			isdel: 0,
			state: '已通过',
			company: '天水红山试验机有限公司'
		}
	}).then(result => {
		const _p = [];
		result.forEach((items, index) => {
			_p[index] = new Promise((resolve,reject) => {
				const { contract_no, deposit, sign_time } = items;
				WalletDepo.create({
					contract_no,
					amount: deposit,
					original_price: deposit,
					isPower: 1,
					wallet_id: 16,
					endTime: DATETIME(Date.parse(sign_time) + 1000 * 60 * 60 * 24 * 365)
				}).then(() => resolve()).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => {
			console.log('asddsa');
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

// dataToMongo();
function dataToMongo() {
	const Goods = require('../dao').Goods;
	const GoodsBorrowRecords = require('../dao').GoodsBorrowRecords;
	const BaseEvent = require('../dao').BaseEvent;
	const SubEventContent = require('../mongoModel/SubEventContent');

	Goods.findAll({
		include: [GoodsBorrowRecords]
	}).then(result => {
		let count = 0;
		dealer();

		function dealer() {
			const items = result[count];
			if (!items) return console.log('over');
			let inCount = 0;
			return new Promise((resolve, reject) => {
				inDealer(resolve, reject);
			}).then(() => {
				count++;
				dealer();
			});

			function inDealer(resolve, reject) {
				const it = items.goodsBorrowRecords[inCount];
				if (!it) return resolve();
				const isdel = items.isdel;
				const headParams = {
					type: '1002',
					ownerId: it.good_id,
					time: it.borrowStartTime,
					person: it.borrower,
					rem: it.rem,
					contentId: null,
				};
				const bodyParams = {
					borrowType: it.type,
					borrowLocation: it.location,
					borrowExpectTime: it.borrowExpectTime,
				}; 
				if (isdel == 1 && inCount==items.goodsBorrowRecords.length - 1) {
					headParams.type = '1004';
					headParams.rem = items.delRem;
					headParams.person = it.taker;
				}
				SubEventContent.create(bodyParams, (err, result) => {
					headParams.contentId = result._id.toString();
					BaseEvent.create(headParams).then(result => {
						inCount++;
						inDealer(resolve, reject);
					}).catch(e => console.log(e));
				});
			}
		}
	}).catch(e => console.log(e));
}

// albumDataToMongo();
function albumDataToMongo() {
	const Goods = require('../dao').Goods;
	const BaseEvent = require('../dao').BaseEvent;
	const SubEventContent = require('../mongoModel/SubEventContent');
	Goods.findAll().then(result => {
		const albumArr = [];
		result.forEach((items, index) => {
			if (items.album) {
				let itAlbumArr;
				try {
					itAlbumArr = items.album.split(',').filter(items => items);
					albumArr.push({
						album: itAlbumArr[0],
						id: items.id,
						person: items.updatePerson,
					});
				} catch (e) {
					
				}
			}
		});
		const _p = [];
		albumArr.forEach((items, index) => {
			_p[index] = new Promise((resolve, reject) => {
				const it = items;
				fs.stat(DIRNAME+'/public/img/goods/'+items.album,(err,result) => {
					if(err) return reject(err);
					const birthtime = result.birthtime;
					common.createEvent({
						headParams: {
							person: it.person,
							time: birthtime,
							type: '1003',
							ownerId: it.id,
						},
						bodyParams: { goodsAlbum: it.album, goodsAlbumBirth: birthtime },
					}, result => {
						if (result.code === 200) {
							Goods.update({
								albumUpdateTime: birthtime,
							}, { where: { id: it.id } }).then(() => resolve()).catch(e => console.log(e));
						} else {
							console.log(result);
							reject();
						}
					});
				});
			});
		});
		Promise.all(_p).then(() => console.log('ggggg')).catch(e => console.log(e));
	}).catch(e => console.log(e));
}

// memberSignToMongo();
function memberSignToMongo() {
	SignActivity.findAll().then(result => {
		const _p = [];
		result.forEach((items, index) => {
			_p[index] = new Promise((resolve, reject) => {
				Member.findOne({
					where: {
						name: items.dataValues.name,
						phone: items.dataValues.phone,
					}
				}).then(r => {
					common.createEvent({
						headParams: {
							ownerId: r.dataValues.open_id,
							type: '1301',
							time: items.dataValues.time,
							person: items.dataValues.name,
						},
						bodyParams: {},
					}, result => {
						resolve();
					});
				}).catch(e => console.log(e));
			});
		});
		Promise.all(_p).then(() => {
			console.log('签到数据迁移成功');
		}).catch(e => console.log(e));
	}).catch(e => console.log(e));
}

// assignSignScore();
function assignSignScore() {
	const BaseEvent = require('../dao').BaseEvent;
	const MemberActivityScoreRecord = require('../mongoModel/MemberActivityScoreRecord');
	Member.findAll().then(result => {
		const _p = [];
		result.forEach((items, index) => {
			const { open_id, name, phone } = items.dataValues;
			_p[index] = new Promise((resolve, reject) => {
				BaseEvent.findAll({
					where: {
						isdel: 0,
						type: '1301',
						ownerId: open_id,
					}
				}).then(r => {
					let presentYearSign = 0, lastOneYearSign = 0, lastTwoYearSign = 0, lastThreeYearSign = 0, lastFourYearSign = 0;
					r.forEach((it, ind) => {
						const { time } = it.dataValues;
						const yyyy = new Date(time).getFullYear();
						if (yyyy == '2019') {
							presentYearSign++;
						} else if (yyyy == '2018') {
							lastOneYearSign++;
						} else if (yyyy == '2017') {
							lastTwoYearSign++;
						} else if (yyyy == '2016') {
							lastThreeYearSign++;
						} else if (yyyy == '2015') {
							lastFourYearSign++;
						}
					});
					new Promise((resolve, reject) => {
						MemberActivityScoreRecord.findOne({
							memberId: open_id,
						}).then(result => {
							if (!result) {
								MemberActivityScoreRecord.create({
									memberId: open_id,
									content: {
										presentYear: {total: 0},
										lastOneYear: {total: 0},
										lastTwoYear: {total: 0},
										lastThreeYear: {total: 0},
										lastFourYear: {total: 0},
									},
								}, (err, result) => {
									resolve(result);
								});
							} else {
								resolve(result);
							}
						}).catch(e => console.log(e));
					}).then(mongoRes => {
						const { content, _id } = mongoRes;
						content.presentYear.sign = presentYearSign;
						content.presentYear.total = presentYearSign;
						content.lastOneYear.sign = lastOneYearSign;
						content.lastOneYear.total = lastOneYearSign;
						content.lastTwoYear.sign = lastTwoYearSign;
						content.lastTwoYear.total = lastTwoYearSign;
						content.lastThreeYear.sign = lastThreeYearSign;
						content.lastThreeYear.total = lastThreeYearSign;
						content.lastFourYear.sign = lastFourYearSign;
						content.lastFourYear.total = lastFourYearSign;
						MemberActivityScoreRecord.updateOne({
							_id,
						}, {
							content,
						}, (err, _r) => {
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
						});
					}).catch(e => console.log(e));
				}).catch(e => console.log(e));
			});
		});
		Promise.all(_p).then(() => {
			console.log('历年签到分分配完成');
		}).catch(e => console.log(e));
	}).catch(e => console.log(e));
}

// historyPayment();
function historyPayment() {
	const Payment = require('../dao').Payment;
	const MemberActivityScoreRecord = require('../mongoModel/MemberActivityScoreRecord');
	function amountTransToScore(amount, year, job) {
		let score = 0;
		if (amount<100000) {
			score = amount / 1000;
		} else if (amount>=100000 && amount< 300000) {
			score = 100 + (amount - 100000) / 2000;
			// score = 100 + (amount - 100000) * 0.8 / 1000;
		} else if (amount>=300000 && amount< 1000000) {
			score = 200 + (amount - 300000) / 7000;
			// score = 100 + 200 * 0.8 + (amount - 300000) * 0.5 / 1000;
		} else if (amount>=100000) {
			score = 300 + (amount - 1000000) / 10000;
			// score = 100 + 200 * 0.8 + 700 * 0.5 + (amount - 1000000) * 0.2 / 1000;
		}

		if (year == 2019) {
			score = score * 1;
		} else if (year == 2018) {
			score = score * 0.8;
		} else if (year == 2017) {
			score = score * 0.6;
		} else if (year == 2016) {
			score = score * 0.4;
		} else if (year == 2015) {
			score = score * 0.2;
		}

		if (job.indexOf('法人') != -1 || job.indexOf('合伙人') != -1) {
			score = score * 1;
		} else if (job.indexOf('注册人') != -1) {
			score = score * 0.75;
		} else if (job.indexOf('财务') != -1 || job.indexOf('开发') != -1 || job.indexOf('采购') !== -1) {
			score = score * 0.5;
		} else {
			score = score * 0.3;
		}
		return parseInt(score);
	}

	const scoreRate = {
		presentYear: 1,
		lastOneYear: 0.8,
		lastTwoYear: 0.6,
		lastThreeYear: 0.4,
		lastFourYear: 0.2,
	};

	Member.findAll({
		where: {
			checked: 1,
		}
	}).then(result => {
		const _p = [];
		result.forEach((items, index) => {
			const { company, name, phone, open_id, job } = items.dataValues;
			_p[index] = new Promise((resolve, reject) => {
				// Payment.findAll({
				// 	where: { isdel: 0, company, },
				// })
				sequelize.query('SELECT * FROM payment WHERE isdel = 0 AND company = "'+company+'" AND date_format(arrival,"%Y")=date_format(now(),"%Y")')
				.then(result => {
					result = result[0];
					let presentYearTotalAmount = 0, lastOneYearTotalAmount = 0, lastTwoYearTotalAmount = 0, lastThreeYearTotalAmount = 0, lastFourYearTotalAmount = 0;
					let presentYearPay = 0, lastOneYearPay = 0, lastTwoYearPay = 0, lastThreeYearPay = 0, lastFourYearPay = 0;
					for (let i = 0; i < result.length; i++) {
						const yyyy = new Date(result[i].arrival).getFullYear();
						if (yyyy == '2019') {
							presentYearTotalAmount += Number(result[i].amount);
						} else if (yyyy == '2018') {
							lastOneYearTotalAmount += Number(result[i].amount);
						} else if (yyyy == '2017') {
							lastTwoYearTotalAmount += Number(result[i].amount);
						} else if (yyyy == '2016') {
							lastThreeYearTotalAmount += Number(result[i].amount);
						} else if (yyyy == '2015') {
							lastFourYearTotalAmount += Number(result[i].amount);
						}
					}
					presentYearPay = amountTransToScore(presentYearTotalAmount, 2019, job);
					lastOneYearPay = amountTransToScore(lastOneYearTotalAmount, 2018, job);
					lastTwoYearPay = amountTransToScore(lastTwoYearTotalAmount, 2017, job);
					lastThreeYearPay = amountTransToScore(lastThreeYearTotalAmount, 2016, job);
					lastFourYearPay = amountTransToScore(lastFourYearTotalAmount, 2015, job);
					MemberActivityScoreRecord.findOne({
						memberId: open_id,
					}, (err, mongoRes) => {
						const { _id, memberId, content } = mongoRes;
						content.presentYear.payment = presentYearPay;
						content.lastOneYear.payment = lastOneYearPay;
						content.lastTwoYear.payment = lastTwoYearPay;
						content.lastThreeYear.payment = lastThreeYearPay;
						content.lastFourYear.payment = lastFourYearPay;
						let allActivityScore = 0;
						for (const key in content) {
							let total = 0;
							for (const i in content[key]) {
								if (i == 'total') continue;
								total += Number(content[key][i]);
							}
							content[key]['total'] = total;
							let _score = scoreRate[key] * total;
							allActivityScore += parseInt(_score);
						}
						MemberActivityScoreRecord.updateOne({
							_id,
						}, {
							content
						}, () => {
							MemberScore.findOne({
								where: {
									name,
									phone,
								}
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
							}).catch(e => console.log(e));
						});
					});

				}).catch(e => console.log(e));
			});
		});
		Promise.all(_p).then(() => console.log('历史到账分数计算完成')).catch(e => console.log(e));
	}).catch(e => console.log(e));
}

// historySoftVersion();
function historySoftVersion() {
	const SoftVersion = require('../dao').SoftVersion;
	SoftVersion.findAll({
		where: {isdel: 0}
	}).then(result => {
		const _p = [];
		result.forEach((items, index) => {
			_p[index] = new Promise((resolve, reject) => {
				common.createEvent({
                    headParams: {
                        person: items.dataValues.createPerson,
                        time: items.dataValues.createTime,
                        type: '1202',
                        ownerId: items.dataValues.soft_project_id,
                        rem: items.dataValues.versionNo,
                    },
                    bodyParams: {
                        softVersionNo: items.dataValues.versionNo,
                        softPackage: items.dataValues.package,
                        softPackageSize: items.dataValues.packageSize,
                        softCreateDescription: items.dataValues.createDescription,
						softTestStatus: items.dataValues.testStatus,
                    },
                }, result => {
                    resolve();
                });
			});
		});
		Promise.all(_p).then(() => console.log('版本包移植完成')).catch(e => { throw e });
	}).catch(e => console.log(e));
}

// historySoftEval();
function historySoftEval() {
	const SoftProject = require('../dao').SoftProject;
	const SoftVersion = require('../dao').SoftVersion;
	const SoftEvaluation = require('../dao').SoftEvaluation;
	SoftEvaluation.findAll({
		where: { isdel: 0 }
	}).then(result => {
		const _p = [];
		result.forEach((it, index) => {
			_p[index] = new Promise((resolve, reject) => {
				let soft_project_id;
				const items = it;
				const { soft_version_id } = items.dataValues;
				SoftVersion.findOne({
					where: { id: soft_version_id }
				}).then(r => {
					soft_project_id = r.dataValues.soft_project_id;
					common.createEvent({
						headParams: {
							person: items.dataValues.testPerson,
							time: items.dataValues.testTime,
							type: '1203',
							ownerId: soft_project_id,
						},
						bodyParams: {
							softContent: items.dataValues.testOpinion,
							softTestAnnex: items.dataValues.testAnnex,
						},
					}, result => {
						resolve();
					});
				}).catch(e => console.log(e));
			});
		});
		Promise.all(_p).then(() => {
			console.log('测评转移完成');
		}).catch(e => { throw e });
	}).catch(e => console.log(e));
}

// addVersionInfoAboutEval();
function addVersionInfoAboutEval() {
	const SoftProject = require('../dao').SoftProject;
	const SoftVersion = require('../dao').SoftVersion;
	const SoftEvaluation = require('../dao').SoftEvaluation;
	const BaseEvent = require('../dao').BaseEvent;
	const SubEventContent = require('../mongoModel/SubEventContent');
	BaseEvent.findAll({
		where: {
			type: '1203',
			isdel: 0,
		}
	}).then(result => {
		const _p = [];
		result.forEach((items, index) => {
			_p[index] = new Promise((resolve, reject) => {
				const { contentId, ownerId, time, person, id } = items.dataValues;
				SoftEvaluation.findOne({
					where: {
						testPerson: person,
						testTime: time,
					}
				}).then(result => {
					if (!result) return resolve();
					const { soft_version_id } = result.dataValues;
					SoftVersion.findOne({
						where: {
							id: soft_version_id
						}
					}).then(result => {
						const { versionNo } = result.dataValues;
						BaseEvent.update({
							rem: versionNo
						}, {
							where: {
								id,
							}
						}).then(() => {
							BaseEvent.findOne({
								where: {
									rem: versionNo,
									type: '1202',
									isdel: 0,
								}
							}).then(result => {
								const endId = result.dataValues.id;
								SubEventContent.updateOne({
									_id: contentId
								}, {
									softProjectId: id
								}, () => {
									resolve();
								});
							}).catch(e => console.log(e));
						}).catch(e => { throw e });
					}).catch(e => { throw e });
				}).catch(e => console.log(e));
			});
		});
		Promise.all(_p).then(() => console.log('附加完毕')).catch(e => console.log(e));
	}).catch(e => console.log(e));
}

// setTimeout(() => {
// 	changeRepairImgSize();
// }, 10000);
function changeRepairImgSize() {
	const dealImages = require('images');
	var dir = DIRNAME+'/public/img/repair';
	fs.readdir(dir,(err,result) => {
		const _p = [];
		result.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				if (items.indexOf('small') === -1) {
					dealImages(dir+'/'+items).resize(104).save(dir+'/small_104_'+items,{});
					resolve();
				} else {
					resolve();
				}
			});
		});
		Promise.all(_p).then(() => console.log(123321));
	});
}

// initLogType1504();
function initLogType1504() {
	// 默认所有事务在2019年6月21日发过言
	Affair.findAll({
		include: [ProjectAffair,SmallAffair],
		where: {
			isdel: 0,
			state: '进行中',
		},
	}).then(result => {
		const resArr = [];
		result.forEach((items, index) => {
			if (items.dataValues.ProjectAffairs.length!=0 || items.dataValues.SmallAffairs.length!=0) {
				resArr.push(items);
			}
		});
		const _p = [];
		resArr.forEach((items, index) => {
			_p[index] = new Promise((resolve, reject) => {
				const { team, uuid } = items.dataValues;
				const teamArr = team.split(',');
				const in_p = [];
				teamArr.forEach((user_id, index) => {
					in_p[index] = new Promise((resolve, reject) => {
						common.createEvent({
							headParams: {
                                person: user_id,
                                time: TIME(),
                                type: 1504,
                                ownerId: uuid,
                            },
                            bodyParams: {},
						}, () => resolve());
					});
				});
				Promise.all(in_p).then(() => resolve()).catch(e => reject(e));
			});
		});
		return Promise.all(_p).then(() => {
			console.log('初始化完成');
		}).catch(e => { throw e });
	}).catch(e => LOG(e));
}

// moveDataToVerUnit();
async function moveDataToVerUnit() {
	const VerUnit = require('../dao').VerUnit;
	const cusArr = await Customers.findAll({ where: {isdel: 0} });
	const _p = [];
	cusArr.forEach(async (items, index) => {
		_p[index] = await VerUnit.create({
			user_id: items.dataValues.user_id,
			company: items.dataValues.company,
			legal_person: items.dataValues.legal_person,
			tax_id: items.dataValues.tax_id,
			reg_addr: items.dataValues.reg_addr,
			reg_tel: items.dataValues.reg_tel,
			zip_code: items.dataValues.zip_code,
			certified: items.dataValues.certified,
			certifiedPerson: items.dataValues.certifiedPerson,
			certifiedReason: items.dataValues.certifiedReason,
			province: items.dataValues.province,
			town: items.dataValues.town,
			update_person: items.dataValues.certifiedPerson ? items.dataValues.certifiedPerson : items.dataValues.update_person,
			update_time: items.dataValues.update_time,
		});
	});
	await Promise.all(_p);
	console.log('asddsaasdsa');
}

// sendPeerSms();
async function sendPeerSms() {
	const memberArr = await Member.findAll({
		where: {
			checked: 1,
		}
	});
	const _p = [];
	memberArr.forEach((items, index) => {
		_p[index] = new Promise((resolve, reject) => {
			const phone = items.dataValues.phone;
			const gender = items.dataValues.gender == '男' ? '先生' : '女士';
			const name = items.dataValues.name + gender;
			const params =  JSON.stringify([ name, '2019年7月19日-2019年8月10日']);
			const mobiles = JSON.stringify([ phone ]);
			console.log(params + '<<>>' + mobiles);
			send(params, mobiles);
			resolve();
		});
	});
	Promise.all(_p).then(() => console.log('send end'));

	function send(params, mobiles) {
		// params =  JSON.stringify([ '章利钢先生', '2019年7月19日-2019年8月10日']);
		// mobiles = JSON.stringify(['18768485699']);
		// 发送短信
		new base.SMSOverride().sendMsg({
			templateid: CONFIG.SMSTemp.peerNoti,
			mobiles,
			params,
		}, result => {
			console.log(result);
		});
	}
}

// peerNotiAgain();
async function peerNotiAgain() {
	const path = DIRNAME+'/downloads/短信失败详情_TEXT_SMS_3358143_2019-07-19.xlsx';
	var x_arr = xlsx.parse(path);
	var x_data = x_arr[0].data;
	x_data.shift();
	const phoneArr = [];
	x_data.forEach((items, index) => {
		let phone = items[0];
		phone = phone.slice(4, 15);
		phoneArr.push(phone);
	});
	const totalArr = [[], [], []];
	phoneArr.forEach((items, index) => {
		if (index < 100) {
			totalArr[0].push(items);
		} else if (index > 99 && index < 200) {
			totalArr[1].push(items);
		} else {
			totalArr[2].push(items);
		}
	});
	totalArr.forEach((items, index) => {
		new base.SMSOverride().sendMsg({
			templateid: CONFIG.SMSTemp.peerNotiAgain,
			mobiles: JSON.stringify(items),
			params: JSON.stringify([]),
		}, result => {
			console.log(result);
		});
	});
}

// getCpyByPeerActivity();
async function getCpyByPeerActivity() {
	const path = DIRNAME+'/downloads/peer.xlsx';
	var x_arr = xlsx.parse(path);
	var x_data = x_arr[0].data;
	const hashMapper = {};
	x_data.forEach((items, index) => {
		if (items[3]) {
			if (!hashMapper[items[3]]) {
				hashMapper[items[3]] = 1;
			} else {
				hashMapper[items[3]]++;
			}
		}
	});
	let data = [];
	for (const key in hashMapper) {
		data.push([key, hashMapper[key]]);
	}
	data = data.sort(s);
	var buffer = xlsx.build([
		{
			name: 'sheet1',
			data,
		}
	]);
	fs.writeFileSync(DIRNAME+'/downloads/凉爽一夏活动参与公司.xlsx',buffer,{'flag':'w'});

	function s(a, b) {
		return b[1] - a[1];
	}
}

// getMemberAddrByPeerActivity();
async function getMemberAddrByPeerActivity() {
	const path = DIRNAME+'/downloads/peer.xlsx';
	var x_arr = xlsx.parse(path);
	var x_data = x_arr[0].data;
	const addrArr = [];
	x_data.forEach((items, index) => {
		if (items[6]) {
			addrArr.push({
				unionid: items[4],
				addr: items[6],
			});
		}
	});
	const _p = [];
	addrArr.forEach(async (items, index) => {
		await Member.update({
			addr: items.addr,
		}, {
			where: {
				unionid: items.unionid,
			},
		});
	});
	Promise.all(_p).then(() => {
		console.log('会员地址更新完成');
	});
}

// 会员参与凉爽一夏活动log
// memberJoinPeerLog();
async function memberJoinPeerLog() {
	const path = DIRNAME+'/downloads/凉爽一夏中奖情况.xlsx';
	var x_arr = xlsx.parse(path);
	var x_data = x_arr[0].data;
	const arr = [];
	const peerMap = {
		'0': '1703',
		'1': '1701',
		'2': '1702',
	};
	x_data.forEach(items => {
		const unionid = items[4];
		const num = items[6];
		if (num !== undefined) {
			arr.push({
				person: unionid,
				type: peerMap[num],
				company: items[3],
				name: items[1],
			});
		}
	});
	const _p = [];
	arr.forEach((items, index) => {
		_p[index] = new Promise((resolve, reject) => {
			common.createEvent({
				headParams: {
					person: items.person,
					time: TIME(),
					type: items.type,
					ownerId: items.person,
					rem: items.company,
				},
				bodyParams: {
					name: items.name,
					company: items.company,
				},
			}, () => resolve());
		});
	});
	Promise.all(_p).then(() => console.log(111));
}

// addVerContacts();
async function addVerContacts() {
	const memberData = await Member.findAll({ where: { isdel: 0, checked: 1 } });
	const contactsData = await Contacts.findAll({ where: { isdel: 0, verified: 1 } });
	const hashMapper = {};
	memberData.forEach(items => {
		if (!hashMapper[items.phone]) {
			hashMapper[items.phone] = {
				name: items.name,
				company: items.company,
			};
		}
	});
	contactsData.forEach(items => {
		if (!hashMapper[items.phone1]) {
			hashMapper[items.phone1] = {
				name: items.name,
				company: items.company,
			};
		}
	});
	for(const phone in hashMapper) {
		VerContacts.create({
			name: hashMapper[phone].name,
			phone,
			company: hashMapper[phone].company,
		});
	}
}

// updateVerContactsJob();
async function updateVerContactsJob() {
	const result = await VerContacts.findAll();
	const memberData = await Member.findAll();
	const memberHashMapper = {};
	memberData.forEach(items => {
		memberHashMapper[items.dataValues.phone] = items.dataValues.job;
	});
	result.forEach(items => {
		VerContacts.update({
			job: memberHashMapper[items.dataValues.phone],
		}, {
			where: { phone: items.dataValues.phone },
		});
	});
}

// updateOpenId();
async function updateOpenId() {
	const memberArr = await Member.findAll();
	const _p = [];
	memberArr.forEach((items, index) => {
		_p[index] = new Promise(async (resolve, reject) => {
			const { name, phone, open_id } = items.dataValues;
			await MemberScore.update({
				openid: open_id,
			}, {
				where: {
					name,
					phone,
				}
			});
			await MemberMsg.update({
				openid: open_id,
			}, {
				where: {
					name,
					phone,
				}
			});
			resolve();
		});
	});
	await Promise.all(_p);
	console.log('123321312312');
}