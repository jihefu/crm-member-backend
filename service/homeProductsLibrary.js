const common = require('./common');
const base = require('./base');
const sequelize = require('../dao').sequelize;
const ProductsLibrary = require('../dao').ProductsLibrary;
const ContractsHead = require('../dao').ContractsHead;
const PricingList = require('../dao').PricingList;

/**
 *  成本列表
 */
this.list = (params,cb) => {
	let num = params.num?parseInt(params.num):30;
	let page = params.page?parseInt(params.page):1;
    let keywords = params.keywords?params.keywords:'';
	let order = params.order?params.order:'id';
	let { product_type } = JSON.parse(params.filter);
	const productTypeArr = product_type.split(',').filter(items => items);
	let product_type_arr = ['产品','附加配件'];
	if(productTypeArr.length!=0) product_type_arr = productTypeArr;
	ProductsLibrary.findAndCountAll({
		where: {
			isdel: 0,
			product_type: {
				'$in': product_type_arr
			},
			product_name: {
				'$like': '%'+keywords+'%'
			}
		},
		order: [[order,'DESC']]
	}).then(result => {
		const staffMap = new base.StaffMap().getStaffMap();
        result.rows.forEach((items,index) => {
            items.dataValues.insert_person = staffMap[items.dataValues.insert_person].user_name;
            items.dataValues.update_person = staffMap[items.dataValues.update_person].user_name;
        });
        cb({
            code: 200,
            msg: '',
            data: {
                data: result.rows,
                id_arr: [],
                total: result.count
            }
        });
	}).catch(e => LOG(e));
}

/**
 *  指定物品成本
 */
this.getTargetItem = (params,cb) => {
	const { targetKey } = params;
	ProductsLibrary.findOne({
		where: {
			id: targetKey
		}
	}).then(result => {
		const staffMap = new base.StaffMap().getStaffMap();
		result.dataValues.insert_person = staffMap[result.dataValues.insert_person].user_name;
		result.dataValues.update_person = staffMap[result.dataValues.update_person].user_name;
		cb({
			code: 200,
			msg: '',
			data: result
		});
	}).catch(e => LOG(e));
}

/**
 *  添加成本
 */
this.add = (params,cb) => {
	const { form_data, admin_id } = params;
	ProductsLibrary.findOne({
		where: {
			product_name: form_data.product_name,
			product_rem: form_data.product_rem,
			product_price: form_data.product_price,
			product_type: form_data.product_type,
			product_group: form_data.product_group,
			isdel: 0
		}
	}).then(result => {
		if(result){
			cb({
				code: -1,
				msg: '该物品已存在',
				data: []
			});
		}else{
			form_data.insert_person = admin_id;
			form_data.update_person = admin_id;
			form_data.insert_time = TIME();
			form_data.update_time = TIME();
			ProductsLibrary.create(form_data).then(() => {
				cb({
					code: 200,
					msg: '新增成功',
					data: []
				});
			}).catch(e => LOG(e));
		}
	}).catch(e => LOG(e));
}

/**
 *  更新成本
 */
this.update = (params,cb) => {
	const { form_data, admin_id } = params;
	ProductsLibrary.findOne({
		where: {
			product_name: form_data.product_name,
			product_rem: form_data.product_rem,
			product_price: form_data.product_price,
			product_type: form_data.product_type,
			product_group: form_data.product_group,
			id: {
				'$ne': form_data.id
			},
			isdel: 0
		}
	}).then(result => {
		if(result){
			cb({
				code: -1,
				msg: '该物品已存在',
				data: []
			});
		}else{
			form_data.update_person = admin_id;
			form_data.update_time = TIME();
			ProductsLibrary.update(form_data,{
				where: {
					id: form_data.id
				}
			}).then(() => {
				cb({
					code: 200,
					msg: '更新成功',
					data: []
				});
			}).catch(e => LOG(e));
		}
	}).catch(e => LOG(e));
}

/**
 *  删除成本
 */
this.del = (params,cb) => {
	const { id, admin_id } = params;
	ProductsLibrary.update({
		isdel: 1,
		update_person: admin_id,
		update_time: TIME()
	},{
		where: {
			id: id
		}
	}).then(result => {
		cb({
			code: 200,
			msg: '删除成功',
			data: []
		});
	}).catch(e => LOG(e));
}

/**
 *  产品库远程搜索
 */
this.searchProductsLibrary = (params,cb) => {
    const { keywords, product_type } = params;
	ProductsLibrary.findAll({
		where: {
            isdel: 0,
			product_type: product_type,
            product_name: {
                '$like': '%'+keywords+'%'
            },
		},
		order: [['count', 'DESC']],
	}).then(result => {
		const resArr = [];
		result.forEach((items,index) => {
			resArr.push({
				text: items.dataValues.product_name,
				value: items.dataValues.product_name,
				data: {
					id: items.dataValues.id,
					product_type: items.dataValues.product_type,
					product_group: items.dataValues.product_group,
                    product_name: items.dataValues.product_name,
					product_price: items.dataValues.product_price,
					product_rem: items.dataValues.product_rem,
					work_hours: items.dataValues.work_hours,
					is_group: items.dataValues.is_group,
				}
			});
		});
		cb({
			code: 200,
			msg: '',
			data: resArr
		});
	});
}

/**
 *  获取物品种类
 */
this.getGoodsType = (params,cb) => {
	ProductsLibrary.findAll().then(result => {
		const resArr = [];
		const hashMap = {};
		result.forEach((items,index) => {
			if(!hashMap[items.dataValues.product_type]){
				hashMap[items.dataValues.product_type] = 1;
				resArr.push(items.dataValues.product_type);
			}
		});
		cb({
			code: 200,
			msg: '',
			data: resArr
		});
	}).catch(e => LOG(e));
}

exports.updateCount = async id => {
	await ProductsLibrary.update({
		count: sequelize.literal('count + 1'),
	}, {
		where: { id },
	});
	return {
		code: 200,
		msg: '更新成功',
	};
}

exports.getWorkHoursChartData = async params => {
	const { startTime, endTime } = params;
	const contractsList = await ContractsHead.findAll({
		where: {
			isdel: 0,
			sign_time: {
				'$between': [startTime, endTime],
			},
			contract_state: '有效',
		},
	});
	const contractMapper = {};
	contractsList.forEach(items => {
		const { delivery_time, sign_time, contract_no } = items.dataValues;
		contractMapper[contract_no] = {
			contract_no,
			sign_time,
			hasDelivery: delivery_time ? 1 : 0,
			work_hours: 0,
		};
	});
	const contractArr = contractsList.map(items => items.dataValues.contract_no);
	const pricingList = await PricingList.findAll({
		attributes: [ 'contract_no', 'total_work_hours' ],
		where: {
			contract_no: { $in: contractArr },
			isdel: 0,
			isPower: 1,
		},
	});
	pricingList.forEach(items => {
		const { contract_no, total_work_hours } = items.dataValues;
		if (contractMapper[contract_no]) {
			contractMapper[contract_no].work_hours = total_work_hours;
		}
	});
	const resArr = [];
	for (const iterator of Object.values(contractMapper)) {
		resArr.push(iterator);
	}
	return {
		code: 200,
		msg: '',
		data: resArr,
	};
}

exports.getDerredData = async () => {
	const yyyy = new Date().getFullYear();
	const resStruct = {
		'0': [],
		'1': [],
		'2': [],
	};
	const workHoursMapper = {
		'0': 0,
		'1': 0,
		'2': 0,
	};
	const totalContractArr = [];
	const contractsList = await ContractsHead.findAll({
		where: {
			isdel: 0,
			sign_time: {
				'$between': [yyyy-3 + '-01-01', new Date()],
			},
			contract_state: '有效',
		},
	});
	contractsList.forEach(items => {
		const { sign_time, delivery_time, contract_no } = items.dataValues;
		if (delivery_time) {
			const signY = new Date(sign_time).getFullYear();
			const deliveryY = new Date(delivery_time).getFullYear();
			if (signY === yyyy-3 && deliveryY-signY === 1) {
				resStruct['2'].push(contract_no);
				totalContractArr.push(contract_no);
			} else if (signY === yyyy-2 && deliveryY-signY === 1) {
				resStruct['1'].push(contract_no);
				totalContractArr.push(contract_no);
			} else if (signY === yyyy-1 && deliveryY-signY === 1) {
				resStruct['0'].push(contract_no);
				totalContractArr.push(contract_no);
			}
		}
	});
	const pricingList = await PricingList.findAll({
		attributes: [ 'contract_no', 'total_work_hours', 'sign_time' ],
		where: {
			contract_no: { $in: totalContractArr },
			isdel: 0,
			isPower: 1,
		},
	});
	pricingList.forEach(items => {
		const { sign_time, total_work_hours } = items.dataValues;
		const signY = new Date(sign_time).getFullYear();
		if (signY === yyyy-3) {
			workHoursMapper['2'] += Number(total_work_hours);
		} else if (signY === yyyy-2) {
			workHoursMapper['1'] += Number(total_work_hours);
		} else if (signY === yyyy-1) {
			workHoursMapper['0'] += Number(total_work_hours);
		}
	});
	return {
		code: 200,
		msg: '',
		data: workHoursMapper,
	};
}