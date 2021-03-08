var Customers = require('../dao').Customers;
var ContractsHead = require('../dao').ContractsHead;

setInterval(() => {}, 10000);

process.on('message', function(params){
    let page = params.page;
	let num = params.pageSize;
	let keywords = params.keywords;
	let qualified = params.qualified?params.qualified:1;
	let year = params.year?params.year:2;
	let qualifiedArr;
	if(qualified==0){
		qualifiedArr = [0];
	}else if(qualified==1){
		qualifiedArr = [1];
	}else{
		qualifiedArr = [0,1];
	}
	//获取符合条件的客户
	const transToAbb = (cb) => {
		Customers.findAll({
			where: {
				isdel: 0,
				credit_qualified: qualifiedArr,
				'$or': {
					company: {
						'$like': '%'+keywords+'%'
					},
					abb: {
						'$like': '%'+keywords+'%'
					},
					cn_abb: {
						'$like': '%'+keywords+'%'
					}
				}
			}
		}).then(result => {
			cb(result);
		}).catch(e => LOG(e));
	}

	//获取指定客户的合同
	const getContractsInfo = (abb,cb) => {
		ContractsHead.findAll({
			where: {
				isdel: 0,
				cus_abb: abb,
				contract_state: '有效',
				delivery_time: {
					'$ne': null
				}
			},
			order: [['sign_time']]
		}).then(result => {
			cb(result);
		}).catch(e => LOG(e));
	}

	//a)	一年新：客户首签日期>=2018-1-1，（合同签订日期-首签）<1年。
	//b)	二年新：客户首签日期>=2017-1-1，（合同签订日期-首签）<2年。
	const checkYears = (firstSignStamp) => {
		if(year==1||year==2){
			const orderYearStamp = Date.parse(2018 - Number(year-1) + '-01-01');
			if(firstSignStamp>=orderYearStamp){
				return true;
			}else{
				return false;
			}
		}
	}

	const _p = [];
	const endResArr = [];

	transToAbb(cpyAbb => {
		cpyAbb.forEach((items,index) => {
			_p[index] = new Promise((resolve,reject) => {
				const obj = {};
				obj.abb = items.dataValues.abb;
				obj.company = items.dataValues.company;
				obj.level = items.dataValues.level;
				obj.manager = items.dataValues.manager;
				obj.total_sale = items.dataValues.total_sale;
				obj.contractArr = [];
				getContractsInfo(items.dataValues.abb,result => {
					if(result[0]==null){
						//没有签订过合同的客户
						resolve();
					}else{
						const firstSignStamp = Date.parse(result[0].dataValues.sign_time);
						if(checkYears(firstSignStamp)){
							let _n = 60*60*1000*24*365*Number(year);
							result.forEach((items,index) => {
								if(Date.parse(items.dataValues.sign_time) - firstSignStamp < _n){
									obj.contractArr.push(items.dataValues.contract_no);
								}
							});
							endResArr.push(obj);
							resolve();
						}else{
							//不是指定年数新的客户
							resolve();
						}
					}
				});
			});
		});

		Promise.all(_p).then(result => {
			process.send({
				code: 200,
				msg: '',
				data: {
					data: endResArr,
					total: endResArr.length
				}
			});
		}).catch(e => LOG(e));
	});
});