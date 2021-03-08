var serviceMember = require('./member');
var common = require('./common');
var CreditRecords = require('../dao').CreditRecords;
var CreditTrendTecord = require('../dao').CreditTrendTecord;
var Customers = require('../dao').Customers;
var ContractsHead = require('../dao').ContractsHead;
var Payment = require('../dao').Payment;
var CreditRecords = require('../dao').CreditRecords;
var PayUse = require('../dao').PayUse;


/**
 *	定期插入信用相关数据
 */
this.insertCretitTrendData = (params,cb) => {
	/*具备信用额度的公司集合*/
	let cpy_arr = [];

	getCpyArr(() => {
		getData(res_arr => {
			insertTrendRecord(res_arr,() => {
				LOG('插入月底信用数据完成');
			});
		});
	});

	/*获取具备信用额度公司的集合*/
	function getCpyArr(cb){
		CreditRecords.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			let _arr = [];
			result.forEach((items,index) => {
				_arr.push(items.dataValues);
			});
			let hash_obj = {};
			_arr.forEach((items,index) => {
				if(!hash_obj[items.company]){
					hash_obj[items.company] = 1;
					if(items.company) cpy_arr.push(items.company);
				}
			});
			cb(cpy_arr);
		}).catch(e => LOG(e));
	}

	/*获取指定公司的相关信用数据*/
	function getData(cb){
		let _p = [];
		let res_arr = [];
		cpy_arr.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				serviceMember.getCreditBasicData({
					company: items
				},function(result){
					res_arr.push(result);
					resolve();
				});
			});
		});
		Promise.all(_p).then(result => {
			cb(res_arr);
		}).catch(e => LOG(e));
	}

	/*插入数据记录*/
	function insertTrendRecord(res_arr,cb){
		let _p = [];
		res_arr.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				CreditTrendTecord.create({
					company: items.company,
					checkDate: DATETIME(),
					creditLine: items.credit_line,
					creditPeriod: items.credit_period,
					overDraft: items.credit_line - items.over_price + items.freeze_amount,
					insideAmount: items.inside_amount,
					outsideAmount: items.outside_amount,
					freezeAmount: items.freeze_amount
				}).then(result => {
					resolve();
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(() => {
			cb();
		}).catch(e => LOG(e));
	}
}
/**
 *	获取信用相关数据
 */
this.getCreditTrendData = (params,cb) => {
	let company = params.company;
	let startDate = params.startDate;
	let endDate = params.endDate;
	CreditTrendTecord.findAll({
		where: {
			company: company,
			checkDate: {
				'$between': [startDate,endDate]
			}
		}
	}).then(result => {
		const res_arr = [];
		result.forEach((items,index) => {
			res_arr.push(items.dataValues);
		});
		cb({
			code: 200,
			msg: '',
			data: res_arr
		});
	}).catch(e => LOG(e));
}



/**
 *	区间法计算
 */
class IntervalFun{
	constructor(endDate){
		this.endDate = endDate;
		this.cpy_arr = [];
	}
	/*获取具备信用额度公司的集合*/
	getCpyArr(cb){
		CreditRecords.findAll({
			where: {
				isdel: 0
			}
		}).then(result => {
			let _arr = [];
			result.forEach((items,index) => {
				_arr.push(items.dataValues);
			});
			let hash_obj = {};
			_arr.forEach((items,index) => {
				if(!hash_obj[items.company]){
					hash_obj[items.company] = 1;
					if(items.company) this.cpy_arr.push(items.company);
				}
			});
			cb(this.cpy_arr);
		}).catch(e => LOG(e));
	}

	/*获取18年1月后的到账合同和历史上的有效欠款合同，去重*/
	getContractsAll(abb,cb){
		ContractsHead.findAll({
			where: {
				cus_abb: abb,
				isFreeze: 0,
				isdel: 0,
				contract_state: '有效',
				delivery_time: {
					'$ne': 'null'
				}
			}
		}).then(result => {
			let history_arr = [],pay_id_arr = [];
			result.forEach((items,index) => {
				if(items.dataValues.payable!=items.dataValues.paid){
					history_arr.push(items.dataValues.contract_no);
				}
			});
			Payment.findAll({
				where: {
					arrival: {
						'$gt': '2017-12-31'
					},
					abb: abb,
					isdel: 0
				}
			}).then(result => {
				result.forEach((items,index) => {
					pay_id_arr.push(items.dataValues.id);
				});
				PayUse.findAll({
					where: {
						pay_id: {
							'$in': pay_id_arr
						}
					}
				}).then(result => {
					result.forEach((items,index) => {
						history_arr.push(items.dataValues.contract_no);
					});
					let contracts_arr = common.arrayUnique(history_arr);
					//进一步筛选
					let _o_ = [],_contracts_arr = [];
					contracts_arr.forEach((_items,_index) => {
						_o_[_index] = new Promise((resolve,reject) => {
							let contract_no = _items;
							ContractsHead.findAll({
								where: {
									contract_no: contract_no,
									isFreeze: 0,
									isdel: 0,
									contract_state: '有效',
									delivery_time: {
										'$ne': 'null'
									}
								}
							}).then(result => {
								if(result[0]!=null){
									_contracts_arr.push(contract_no);
								}
								resolve();
							}).catch(e => LOG(e));
						});
					});
					Promise.all(_o_).then(() => {
						cb(_contracts_arr);
					}).catch(e => LOG(e));
				}).catch(e => LOG(e));
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}

	/*区间对比*/
	comparDate(abb,contract_no,cb){
		let getContractInfo = (cb) => {
			ContractsHead.findOne({
				where: {
					contract_no: contract_no,
					isdel: 0,
					contract_state: '有效'
				}
			}).then(result => {
				cb(result.dataValues);
			}).catch(e => LOG(e));
		}

		let getCreditInfo = (cb) => {
			CreditRecords.findAll({
				where: {
					abb: abb,
					isdel: 0
				},
				order: [['credit_time','DESC'],['id','DESC']],
				limit: 1,
				offset: 0
			}).then(function(result){
				cb(result[0].dataValues);
			}).catch(e => LOG(e));
		}

		/*指定合同的最后到账时间*/
		let contractArrivalDate = (cb) => {
			PayUse.findOne({
				where: {
					isdel: 0,
					ishistory: {
						'$ne': 1
					},
					contract_no: contract_no
				},
				order: [['id','DESC']],
				offset: 0,
				limit: 1
			}).then(result => {
				try{
					let id = result.dataValues.pay_id;
					Payment.findOne({
						where: {
							id: id
						}
					}).then(result => {
						cb(result.dataValues.arrival);
					}).catch(e => LOG(e));
				}catch(e){
					cb('A');
				}
			}).catch(e => LOG(e));
		}

		/*获取该合同当月以及之前的到账总和*/
		let contractTotalAmount = (cb) => {
			let endDate = this.endDate;
			PayUse.findAll({
				where: {
					isdel: 0,
					ishistory: {
						'$ne': 1
					},
					contract_no: contract_no
				}
			}).then(result => {
				let res_arr = [];
				let __p = [];
				let sum = 0;
				result.forEach((items,index) => {
					res_arr.push(items.dataValues);
				});
				res_arr.forEach((items,index) => {
					__p[index] = new Promise((resolve,reject) => {
						let obj = items;
						Payment.findOne({
							where: {
								id: items.pay_id
							}
						}).then(result => {
							if(Date.parse(result.dataValues.arrival)<=Date.parse(endDate)){
								sum += obj.amount;
							}
							resolve();
						}).catch(e => LOG(e));
					});
				});
				Promise.all(__p).then(result => {
					cb(sum);
				}).catch(e => LOG(e));
			}).catch(e => LOG(e));
		}

		let endDate = this.endDate;

		getContractInfo((info) => {
			let { payable,paid,delivery_time } = info;
			getCreditInfo((cre) => {
				let { credit_period,credit_line } = cre;
				let delivery_stamp = Date.parse(delivery_time);	//发货时间
				let credit_end_stamp = delivery_stamp + credit_period * 30 * 1000*60*60*24;	//信用到期时间
				let arrival_stamp;	//到账时间
				let base_stamp = Date.parse(endDate);	//计算日
				contractArrivalDate((arrival) => {
					if(arrival=='A'){
						arrival_stamp = Date.parse('2048-12-31');
					}else{
						arrival_stamp = Date.parse(arrival);
					}
					//获取该合同当月以及之前的到账总和
					let totalAmount;
					if(arrival=='A'){
						totalAmount = 0;
						ccbb(totalAmount);
					}else{
						contractTotalAmount((sum) => {
							totalAmount = sum;
							ccbb(totalAmount);
						});
					}

					function ccbb(total){
						getContractInfo((info) => {
							let s = 0;
							if(total!=paid) s = paid;
							total = info.payable - total - s;
							if(base_stamp>=delivery_stamp&&base_stamp<=credit_end_stamp){
								cb({
									type: 0,
									amount: total
								});
							}else if(base_stamp>=delivery_stamp&&base_stamp>credit_end_stamp&&base_stamp<arrival_stamp){
								cb({
									type: 1,
									amount: total
								});
							}else if(base_stamp>=delivery_stamp&&base_stamp>credit_end_stamp&&base_stamp>=arrival_stamp){
								cb({
									type: 2,
									amount: total
								});
							}else if(base_stamp<delivery_stamp){
								cb({
									type: 4
								});
							}else{
								console.log(contract_no);
							}
						});
					}
				});
			});
		});
	}

	/*插入数据库*/
	insertData(form_data,cb){
		CreditTrendTecord.create(form_data).then(result => {
			cb();
		}).catch(e => LOG(e));
	}
}

// superInterval('2018-01-31');
// superInterval('2018-02-28');
// superInterval('2018-03-31');

function superInterval(checkDate){
	let interval = new IntervalFun(checkDate);
	interval.getCpyArr((cpy_arr) => {
		let _p = [];
		cpy_arr.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				let company = items;
				Customers.findAll({
					where: {
						isdel: 0,
						company: company
					}
				}).then(result => {
					let { abb,credit_period,credit_line } = result[0].dataValues;
					interval.getContractsAll(abb,(contractsArr) => {
						let in_p = [];
						let insideAmount = 0,outsideAmount = 0;
						contractsArr.forEach((it,ind) => {
							in_p[ind] = new Promise((resolve,reject) => {
								interval.comparDate(abb,it,(type) => {
									if(type.type==0){
										insideAmount += type.amount;
									}else if(type.type==1||type.type==2){
										outsideAmount += type.amount;
									}
									resolve();
								});
							});
						});
						Promise.all(in_p).then(result => {
							//插入
							ContractsHead.findAll({
								where: {
									isdel: 0,
									isFreeze: 1,
									cus_abb: abb
								}
							}).then(result => {
								let freezeAmount = 0;
								result.forEach((items,index) => {
									freezeAmount += items.dataValues.payable - items.dataValues.paid;
								});
								interval.insertData({
									company: company,
									checkDate: checkDate,
									creditLine: credit_line,
									creditPeriod: credit_period,
									insideAmount: insideAmount,
									outsideAmount: outsideAmount,
									freezeAmount: freezeAmount
								},() => {
									resolve();
								});
							}).catch(e => LOG(e));
						}).catch(e => LOG(e));
					});
				}).catch(e => LOG(e));
			});
		});
		Promise.all(_p).then(result => {
			console.log('-回滚结束-');
		}).catch(e => LOG(e));
	});
}