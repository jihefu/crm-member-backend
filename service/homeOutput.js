const Staff = require('../dao').Staff;
const DeliveryRecord = require('../dao').DeliveryRecord;
const ContractsHead = require('../dao').ContractsHead;
const Repairs = require('../dao').Repairs;
const common = require('./common');
const base = require('./base');
const serviceHomeContracts = require('./homeContracts');
const sequelize = require('../dao').sequelize;
const sendMQ = require('./rabbitmq').sendMQ;
const bluebird = require('bluebird');

/**
 *	发货数据列表
 */
this.list = (params,cb) => {
	let num = params.num?parseInt(params.num):10;
	let page = params.page?parseInt(params.page):1;
	let keywords = params.keywords?params.keywords:'';
	let order = params.order?params.order:'id';
	if(order=='id'){
		order = ['id', 'DESC'];
	}else if(order=='update_time'){
		order = ['update_time','DESC'];
	}
	let markOrder;
	common.infoMark({
		type: 'DeliveryRecord'
	},resObj => {
		const { str,id_arr } = resObj;
		if(str){
			markOrder =	[[sequelize.literal('if('+str+',0,1)')],order];
		}else{
			markOrder =	[order];
		}
		DeliveryRecord.findAndCountAll({
			where: {
				isdel: 0,
				'$or': {
					contract_no: {
						'$like': '%'+keywords+'%'
					},
					cus_cn_abb: {
						'$like': '%'+keywords+'%'
					},
					contacts_tel: {
						'$like': '%'+keywords+'%'
					},
					contacts: {
						'$like': '%'+keywords+'%'
					},
					express_no: {
						'$like': '%'+keywords+'%'
					}
				}
			},
			limit: num,
			offset: (page -1) * num,
			order: markOrder
		}).then(result => {
			let res_arr = [],_p = [];
			result.rows.forEach((items,index) => {
				res_arr.push(items.dataValues);
				_p[index] = new Promise((resolve,reject) => {
					let it = items;
					let i = index;
					let in_p = [];
					in_p[0] = new Promise((resolve,reject) => {
						common.idTransToName({
							user_id: it.dataValues.insert_person
						},user_name => {
							res_arr[i].insert_person = user_name;
							resolve();
						});
					});
					in_p[1] = new Promise((resolve,reject) => {
						common.idTransToName({
							user_id: it.dataValues.update_person
						},user_name => {
							res_arr[i].update_person = user_name;
							resolve();
						});
					});
					Promise.all(in_p).then(() => resolve()).catch(e => LOG(e));
				});
			});
			Promise.all(_p).then(() => {
				for (let i = 0; i < id_arr.length; i++) {
					for (let j = 0; j < res_arr.length; j++) {
						if(id_arr[i]==res_arr[j].id){
							break;
						}else if(id_arr[i]!=res_arr[j].id&&j==res_arr.length-1){
							id_arr.splice(i,1);
							i--;
						}
					}
				}
				cb({
					code: 200,
					msg: '',
					data: {
						data: res_arr,
						id_arr: id_arr,
						total: result.count
					}
				});
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	});
}

/**
 *  获取指定发货记录
 */
this.getTargetItem = (params,cb) => {
	const { targetKey } = params;
	DeliveryRecord.findOne({
		where: {
			id: targetKey
		}
	}).then(result => {
		const staffMap = new base.StaffMap().getStaffMap();
		try{
			result.dataValues.insert_person = staffMap[result.dataValues.insert_person].user_name;
			result.dataValues.update_person = staffMap[result.dataValues.update_person].user_name;
		}catch(e){

		}
		cb({
			code: 200,
			msg: '',
			data: result
		});
	}).catch(e => LOG(e));
}

/**
 *	更新指定发货记录
 */
this.update = (params,cb) => {
	let { form_data,admin_id } = params;
	let that = this;
	form_data = JSON.parse(form_data);
	form_data.update_person = admin_id;
	form_data.update_time = TIME();
	common.staffNameTransToUserId({
		user_name: form_data.insert_person
	},user_id => {
		form_data.insert_person = user_id;
		DeliveryRecord.update(form_data,{
			where: {
				id: form_data.id
			}
		}).then(result => {
			cb({
				code: 200,
				msg: '',
				data: []
			});
			if(!form_data.all_shipments) return;
			that.updateDeliveryState(params,() => {});
		}).catch(e => LOG(e));
	});
}

/**
 *	新增发货记录
 */
this.add = (params,cb) => {
	let { form_data,admin_id } = params;
	let that = this;
	form_data = JSON.parse(form_data);
	form_data.update_person = admin_id;
	form_data.update_time = TIME();
	form_data.insert_person = admin_id;
	form_data.insert_time = TIME();
	DeliveryRecord.create(form_data).then(result => {
		cb({
			code: 200,
			msg: '新增成功',
			data: [],
		});
		// 发消息通知已发件
		sendMsgHasDelivery();
		if(!form_data.all_shipments) return;
		that.updateDeliveryState(params, () => {});
	}).catch(e => LOG(e));

	function sendMsgHasDelivery() {
		const name = form_data.contacts;
		const phone = form_data.contacts_tel;
		const goods = form_data.goods;
		const no = form_data.express_no;
		const type = form_data.express_type;
		sendMQ.sendQueueMsg('delivery', JSON.stringify({
			name,
			phone,
			goods,
			no,
			type,
		}), result => {
			console.log(result);
		});
	}
}

/**
 *	发货状态关联到合同系统和维修系统
 */
this.updateDeliveryState = async (params,cb) => {
	let { form_data,admin_id } = params;
	form_data = JSON.parse(form_data);
	let { contract_no, express_no, delivery_time, received_time, received_person } = form_data;
	let noArr;
	try {
		noArr = contract_no.split(',').filter(items => items);
	} catch (e) {
		noArr = [];
	}
	await bluebird.map(noArr, async items => {
		const no = items;
		const where = {
			repair_contractno: no,
		};
		const repairEntity = await Repairs.findOne({ where: { repair_contractno: no, isdel: 0 } });
		const { stage4 } = repairEntity.dataValues;
		const updateData = {
			express: express_no,
			deliver_time: Date.parse(delivery_time)/1000,
			deliver_state: '已发件',
			complete: 0,
			update_person: admin_id,
			update_time: TIME(),
		};
		if (!stage4) {
			updateData.stage4 = TIME();
		}
		if(received_time){
			updateData.take_time = received_time;
			updateData.take_person = received_person;
			updateData.deliver_state = '已收件';
			updateData.complete = 1;
		}
		await Repairs.update(updateData, { where });
	}, { concurrency: 10 });
	cb();
}

/**
 *	搜索公司
 */
this.searchCpy = (params,cb) => {
	let keywords = params.keywords;
	common.getCompanyInfoByCompanyName({
		company: keywords
	},(result) => {
		let res_arr = [];
		result.forEach((items,index) => {
			res_arr.push({
				text: items.company,
				value: items.company,
				data: {
					company: items.company,
					user_id: items.user_id,
				},
			});
		});
		cb({
			code: 200,
			msg: '',
			data: res_arr
		});
	});
}

/**
 *	搜索单号
 */
this.searchNo = async (params, cb) => {
	const { keywords, notDelivery } = params;
	const where = {
		isdel: 0,
		repair_contractno: { $like: '%'+keywords+'%' },
	};
	if (notDelivery) {
		where.deliver_time = 0;
	}
	const result = await Repairs.findAll({
		attributes: ['repair_contractno'],
		where,
	});
	let noArr = result.map(items => items.dataValues.repair_contractno);
	noArr = [...new Set(noArr)];
	const res_arr = noArr.map(items => {
		return {
			text: items,
			value: items,
		};
	});
	cb({
		code: 200,
		msg: '',
		data: res_arr,
	});
}

/**
 * 根据合同号获取指定item
 */
this.getItemByContractNo = (params, cb) => {
	const { contractNo } = params;
	DeliveryRecord.findOne({
		where: {
			contract_no: contractNo,
			isdel: 0,
		}
	}).then(result => {
		cb({
			code: 200,
			msg: '',
			data: result,
		});
	}).catch(e => LOG(e));
}