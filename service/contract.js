var express = require('express');
var url = require('url');
var path = require('path');
var request = require('request');
var fs = require('fs');
var base = require('./base');
var common = require('./common');
var sequelize = require('../dao').sequelize;
var Customers = require('../dao').Customers;
var Users = require('../dao').Users;
var ContractsHead = require('../dao').ContractsHead;
var ContractsBody = require('../dao').ContractsBody;
var Staff = require('../dao').Staff;
var VirWarranty = require('../dao').VirWarranty;
const PackingList = require('../dao').PackingList;
const Products = require('../dao').Products;
const bluebird = require('bluebird');
const homeContracts = require('./homeContracts');
const sendMQ = require('./rabbitmq').sendMQ;
const serviceRepair = require('./repair');
const AssembleDiskPacking = require('../dao').AssembleDiskPacking;
const serviceCloudDisk = require('./cloudDisk');
const Linq = require('linq');
const serviceHomeProducts = require('./homeProducts');
const SoftProject = require('../dao').SoftProject;
const ProductOrder = require('../dao').ProductOrder;

/*******************************移动端**************************************/
/**
 * 	合同列表
 * 	200228
 */
this.getList = async function(params,cb){
	var page = params.page?params.page:1;
	var keywords = params.keywords?params.keywords:'';
	var num = params.num?params.num:10;
	var abb = params.abb;
	var code = params.code;
	var where = {};
	if (code==10001) {
		if(/[\u4e00-\u9fa5]+/.test(keywords)){
			const s_arr = [];
			const customerEntity = await Customers.findAll({
				where: {
					isdel: 0,
					company: {
						'$like': '%'+keywords+'%'
					}
				}
			});
			customerEntity.forEach(items => {
				s_arr.push(items.dataValues.abb);
			});
			where = {
				isdel: 0,
				cus_abb: {
					'$in': s_arr
				}
			}
		} else {
			where = {
				'$and': {
					isdel: 0
				},
				'$or': {
					contract_no: {
						'$like': '%'+keywords+'%'
					},
					cus_abb: {
						'$like': '%'+keywords+'%'
					}
				}
			};
		}
	} else {
		where = {
			isdel: 0,
			contract_no: {
				'$like': '%'+keywords+'%'
			},
			cus_abb: abb
		};
	}
	const contractsEntity = await ContractsHead.findAll({
		attributes: ['contract_no','sign_time','delivery_state','payable','paid','complete','cus_abb'],
		where: where,
		order: [['sign_time','DESC']],
		limit: num,
		offset: (page-1)*num
	});
	const resArr = contractsEntity.map(items => items.dataValues);
	getContractsBody(resArr);

	function getContractsBody(res_arr){
		var p_arr = [];
		res_arr.forEach(function(items,index){
			p_arr[index] = new Promise(function(resolve,reject){
				ContractsBody.findAll({
					attributes: ['goods_name','goods_num'],
					where: {
						contract_no: items.contract_no
					}
				}).then(function(result){
					var r_arr = [];
					result.forEach(function(it,ind){
						r_arr.push(it.dataValues);
					});
					res_arr[index]['body'] = r_arr;
					common.transToCnAbb({
						abb: items.cus_abb
					},function(result){
						res_arr[index].cus_abb = result.cn_abb;
						resolve();
					});
				}).catch(function(e){
					reject(e);
				});
			});
		});
		Promise.all(p_arr).then(function(){
			cb({
				code: 200,
				msg: '',
				data: res_arr
			});
		}).catch(function(e){
			LOG(e);
		});
	}
}

this.searchContractBySn = async sn => {
	const result = await ContractsHead.findOne({
		where: {
			isdel: 0,
			snGroup: { $like: '%'+sn+'%' },
		},
	});
	return {
		code: 200,
		msg: '',
		data: result,
	};
}

/**
 * 是否为管理部的
 */
this.checkAllowDelivery = async admin_id => {
	const staffList = await Staff.findAll({ where: { branch: '管理部', isdel: 0, on_job: 1 } });
	const userIdArr = staffList.map(items => Number(items.dataValues.user_id));
	if (userIdArr.includes(Number(admin_id))) {
		return 1;
	}
	return 0;
}

/**
 * 	合同头
 */
this.head = async params => {
	var abb = params.abb;
	var code = params.code;
	var contract_no = params.contract_no;
	const needOtherInfo = params.contract_no;
	const result = await this.headLabel(contract_no, code, abb, needOtherInfo);
	const labelArr = [];
	for (const key in result.label) {
		labelArr.push({
			name: result.label[key].name,
			val: result.label[key].val,
			key: result.label[key].name,
		});
	}
	return {
		data: result.data,
		label: labelArr,
	};
}

/**
 * 前端显示
 */
this.headLabel = async (contract_no, code, abb, needOtherInfo) => {
	const labelObj = {
		contract_no: {
			name: '合同编号',
		},
		cus_abb: {
			name: '购方',
		},
		purchase: {
			name: '购方采购',
		},
		contract_state: {
			name: '合同状态',
		},
		sale_person: {
			name: '销售员',
		},
		sign_time: {
			name: '签订日期',
		},
		total_amount: {
			name: '总金额',
		},
		favo: {
			name: '优惠金额',
		},
		payable: {
			name: '应付金额',
		},
		paid: {
			name: '已付金额',
		},
		install: {
			name: '需要安装',
		},
		isDirectSale: {
			name: '是否直销',
		},
		delivery_state: {
			name: '流程状态',
		},
		delivery_time: {
			name: '发货时间',
		},
		take_person: {
			name: '收货确认人',
		},
		take_time: {
			name: '收货确认时间',
		},
		isFreeze: {
			name: '是否冻结',
		},
		freeze_reason: {
			name: '冻结原因',
		},
		freeze_start_time: {
			name: '冻结开始时间',
		},
		freeze_time: {
			name: '冻结截止日期',
		},
		close_reason: {
			name: '关闭原因',
		},
		close_time: {
			name: '关闭日期',
		},
		other: {
			name: '其他约定',
		},
	};
	let where = {};
	if (code==10001) {
		where = { isdel: 0, contract_no };
	} else {
		where = { isdel: 0, contract_no, cus_abb: abb };
	}
	const contractEntity = await ContractsHead.findOne({ where });
	if (!contractEntity) {
		return { code: -1, msg: '不存在该合同' };
	}
	if (needOtherInfo) {
		const { id, contract_no } = contractEntity.dataValues;
		// 货品
		const goodsList = await ContractsBody.findAll({ where: { contract_no } });
		contractEntity.dataValues.goodsList = goodsList;
		// 装箱单
		const packingList = await PackingList.findAll({ where: { contractId: id, isdel: 0 } });
		const staffMapper = new base.StaffMap().getStaffMap();
		packingList.forEach((items, index) => {
			packingList[index].dataValues.insertPersonName = staffMapper[items.dataValues.insertPerson].user_name;
			packingList[index].dataValues.updatePersonName = staffMapper[items.dataValues.updatePerson].user_name;
		});
		contractEntity.dataValues.packingList = packingList;
	}

	await toLabel();

	return {
		data: contractEntity,
		label: labelObj,
	};

	async function toLabel() {
		for (const key in labelObj) {
			labelObj[key].val = contractEntity[key] == undefined ? '' : contractEntity[key];
		}
		const customerEntity = await Customers.findOne({ where: { abb: contractEntity.cus_abb, isdel: 0 } });
		const { company } = customerEntity.dataValues;
		labelObj.cus_abb.val = company;
		const staffMapper = new base.StaffMap().getStaffMap();
		labelObj.sale_person.val = staffMapper[contractEntity.sale_person].user_name;
		labelObj.favo.val = Number(contractEntity.total_amount) - Number(contractEntity.payable);
		labelObj.install.val = contractEntity.install == 0 ? '否' : '是';
		labelObj.isDirectSale.val = contractEntity.isDirectSale == 0 ? '否' : '是';
		labelObj.isFreeze.val = contractEntity.isFreeze == 0 ? '否' : '是';
		if (contractEntity.isFreeze == 0) {
			delete labelObj.freeze_reason;
			delete labelObj.freeze_start_time;
			delete labelObj.freeze_time;
		}
		if (contractEntity.contract_state != '关闭') {
			delete labelObj.close_reason;
			delete labelObj.close_time;
		}
	}
}

/**
 * 	确认收货
 */
this.takeGoods = function(params,cb){
	var name = params.name;
	var contract_no = params.contract_no;
	const { open_id, code } = params;
	var time = TIME();
	ContractsHead.update({
		delivery_state: '已收货',
		take_person: name,
		take_time: time
	},{
		where: {
			isdel: 0,
			contract_no: contract_no
		}
	}).then(function(result){
		cb({
			code: 200,
			msg: '已确认收货',
			data: [{
				time: time,
				name: name,
				state: '已收货'
			}]
		});
		sendReceiveGoodsMsg(contract_no, time);
		if (!code.includes(10001)) {
			serviceRepair.sendTakeGoodsMq({ open_id, name, no: contract_no });
		}
	}).catch(function(e){
		LOG(e);
	});
}

exports.contractInfo = async contractId => {
	const result = await ContractsHead.findOne({ where: { id: contractId } });
	return { code: 200, msg: '', data: result };
}

exports.checkIsStaff = async open_id => {
	const result = await Staff.findOne({ where: { open_id } });
	if (result) {
		return 1;
	}
	return 0;
}

exports.createEmptyPacking = async params => {
	const { isStaff, open_id, contractId } = params;
	if (!isStaff) {
		return true;
	}
	const result = await Staff.findOne({ where: { open_id } });
	const { user_id } = result.dataValues;
	const packingEntity = await PackingList.findOne({ where: { isdel: 0, contractId } });
	if (!packingEntity) {
		await PackingList.create({ isSend: 0, contractId, insertPerson: user_id, insertTime: TIME(), updatePerson: user_id, updateTime: TIME() });
	}
	return true;
}

async function sendNewContractMsg(contract_no) {
	const contractEntity = await ContractsHead.findOne({
		where: { contract_no, isdel: 0 },
	});
	const { payable, delivery_state, cus_abb } = contractEntity.dataValues;
	const customerEntity = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
	const { company } = customerEntity.dataValues;
	const first = '您的合同已安排生产';
	sendMQ.sendQueueMsg('new_contract', JSON.stringify({
		first,
		contract_no,
		payable,
		company,
		delivery_state,
		remark: '',
	}), result => {
		console.log(result);
	});
}

async function sendDeliveryMsg(contract_no, packId, totalSend) {
	const packingEntity = await PackingList.findOne({ where: { id: packId } });
	const { expressNo, sendTime, sendType } = packingEntity.dataValues;
	let deliveryCompany = sendType;
	if (sendType === '快递') {
		if (expressNo.indexOf('SF') !== -1) {
			deliveryCompany = '顺丰';
		} else if (expressNo.indexOf('DPK') !== -1) {
			deliveryCompany = '德邦';
		} else {
			deliveryCompany = '未知';
		}
	}
	let first;
	if (totalSend) {
		first = '您的合同已全部发货，请及时签收';
	} else {
		first = '您的合同已部分发货，请及时签收';
	}
	sendMQ.sendQueueMsg('delivery_pack', JSON.stringify({
		first,
		contract_no,
		sendTime,
		deliveryCompany,
		expressNo,
		info: '',
		remark: '',
		totalSend,
	}), result => {
		console.log(result);
	});
}

async function sendReceiveGoodsMsg(contract_no, time) {
	sendMQ.sendQueueMsg('contract_take', JSON.stringify({
		first: '您的合同已经确认收货',
		contract_no,
		time,
		remark: '',
	}), result => {
		console.log(result);
	});
}

/**
 * 转成待发货
 * 即允许发货
 */
this.turnToAllowDelivery = async params => {
	const { admin_id, contract_no } = params;
	await ContractsHead.update({ delivery_state: '待发货', update_time: TIME(), update_person: admin_id }, { where: { contract_no, isdel: 0 } });
	sendNewContractMsg(contract_no);
	return { code: 200, msg: '更新成功' };
}

/**
 * 装箱单列表
 */
exports.getPackingList = async params => {
	const { contractId } = params;
	const result = await PackingList.findAll({ where: { contractId, isdel: 0 }, order: [[ 'id', 'DESC' ]] });
	const staffMapper = new base.StaffMap().getStaffMap();
	result.forEach((items, index) => {
		try {
			result[index].dataValues.insertPersonName = staffMapper[items.dataValues.insertPerson].user_name;
			result[index].dataValues.updatePersonName = staffMapper[items.dataValues.updatePerson].user_name;
		} catch (e) {
			
		}
	});
	return { code: 200, msg: '', data: result };
}

/**
 * 新增装箱单
 * 不做任何检查
 */
exports.addPacking = async params => {
	const { contractId, admin_id } = params;
	await PackingList.create({
		num: 0,
		otherNum: 0,
		contractId,
		insertPerson: admin_id,
		insertTime: TIME(),
		updatePerson: admin_id,
		updateTime: TIME(),
	});
	return { code: 200, msg: '新增成功' };
}

/**
 * 单个装箱单信息
 */
exports.showPacking = async params => {
	const { id } = params;
	const packingEntity = await PackingList.findOne({ where: { id } });
	return { code: 200, msg: '', data: packingEntity };
}

/**
 * 更新装箱单的序列号
 * （页面进行了删除操作）
 */
exports.updatePacking = async params => {
	const { id, snArr, otherSnArr, admin_id } = params;
	// 找出原来的序列号
	const originPackEntity = await PackingList.findOne({ where: { id } });
	let originSnArr;
	try {
		originSnArr = originPackEntity.dataValues.sn.split(',').filter(items => items);
	} catch (e) {
		originSnArr = [];
	}
	const needRemoveArr = [];
	originSnArr.forEach(items => {
		if (snArr.indexOf(items) === -1) {
			needRemoveArr.push(items);
		}
	});
	await PackingList.update({ sn: snArr.join(), num: snArr.length, otherSn: otherSnArr.join(), otherNum: otherSnArr.length, updatePerson: admin_id, updateTime: TIME() }, { where: { id } });
	return { code: 200, msg: '更新成功' };
}

/**
 * 新增一个序列号
 */
exports.addSingleSn = async params => {
	const { id, sn, admin_id } = params;
	const { contractId, sn: sqlSn } = await PackingList.findOne({ where: { id } });
	const { snNum } = await ContractsHead.findOne({ where: { id: contractId } });
	const { isPass } = await Products.findOne({ where: { serialNo: sn, isdel: 0 } });
	// 是否在生产单内
	const orderEntity = await ProductOrder.findOne({ where: { isdel: 0, serialNo: sn } });
	if (!orderEntity) {
		return { code: -1, msg: '生产单不存在' };
	}
	// 是否检测
	if (!isPass) {
		return { code: -1, msg: sn + '未检测' };
	}
	// 数量是否已满
	const packArr = await PackingList.findAll({ where: { contractId, isdel: 0 } });
	let totalNum = 0;
	packArr.forEach(items => totalNum += Number(items.dataValues.num));
	if (totalNum === Number(snNum) || totalNum > Number(snNum)) {
		return { code: -1, msg: '序列号数量与规定的不符' };
	}
	// 是否已在该装箱内
	if (await checkSnExistInPack('sn', contractId, sn)) {
		return { code: -1, msg: sn + '已存在装箱单' };
	}
	let sqlSnArr;
	try {
		sqlSnArr = sqlSn.split(',').filter(items => items);
	} catch (e) {
		sqlSnArr = [];
	}
	sqlSnArr.push(sn);
	sqlSnArr = sqlSnArr.filter(items => items);
	await PackingList.update({ sn: sqlSnArr.join(), num: sqlSnArr.length, updatePerson: admin_id, updateTime: TIME() }, { where: { id } });
	await ContractsHead.update({ delivery_state: '发货中' }, { where: { id: contractId }});
	return { code: 200, msg: '更新成功' };
}

/**
 * 新增一个其它序列号
 */
exports.addSingleOtherSn = async params => {
	const { id, sn, admin_id } = params;
	const { contractId, otherSn: sqlSn } = await PackingList.findOne({ where: { id } });
	const { otherSnNum } = await ContractsHead.findOne({ where: { id: contractId } });
	// 是否在生产单内
	const orderEntity = await ProductOrder.findOne({ where: { isdel: 0, serialNo: sn } });
	if (!orderEntity) {
		return { code: -1, msg: '生产单不存在' };
	}
	// 数量是否已满
	const packArr = await PackingList.findAll({ where: { contractId, isdel: 0 } });
	let totalNum = 0;
	packArr.forEach(items => totalNum += Number(items.dataValues.otherNum));
	if (totalNum === Number(otherSnNum) || totalNum > Number(otherSnNum)) {
		return { code: -1, msg: '序列号数量与规定的不符' };
	}
	// 是否已在该装箱单内
	if (await checkSnExistInPack('otherSn', contractId, sn)) {
		return { code: -1, msg: sn + '已存在装箱单' };
	}
	let sqlSnArr;
	try {
		sqlSnArr = sqlSn.split(',').filter(items => items);
	} catch (e) {
		sqlSnArr = [];
	}
	sqlSnArr.push(sn);
	sqlSnArr = sqlSnArr.filter(items => items);
	await PackingList.update({ otherSn: sqlSnArr.join(), otherNum: sqlSnArr.length, updatePerson: admin_id, updateTime: TIME() }, { where: { id } });
	await ContractsHead.update({ delivery_state: '发货中' }, { where: { id: contractId }});
	return { code: 200, msg: '更新成功' };
}

// sn是否存在装箱单内
async function checkSnExistInPack(type, contractId, sn) {
	const where = { isdel: 0, contractId };
	where[type] = { $like: '%'+sn+'%' };
	const result = await PackingList.findOne({ where });
	if (result) {
		return true;
	}
	return false;
}

/**
 * 删除装箱单
 */
exports.delPacking = async params => {
	const { id, admin_id } = params;
	await PackingList.update({ isdel: 1, updatePerson: admin_id, updateTime: TIME() }, { where: { id } });
	return { code: 200, msg: '删除成功' };
}

/**
 * 更新快递单号或提货方式
 */
exports.updateExpressNoInPacking = async params => {
	const { id, expressNo, sendType, admin_id } = params;
	await PackingList.update({ expressNo, sendType, isSend: 1, sendTime: TIME(), updatePerson: admin_id, updateTime: TIME() }, { where: { id } });
	const packingEntity = await PackingList.findOne({ where: { id } });
	const { contractId } = packingEntity.dataValues;
	const contractEntity = await ContractsHead.findOne({ where: { id: contractId } });
	const { snNum, otherSnNum, contract_no } = contractEntity.dataValues;
	const packArr = await PackingList.findAll({ where: { contractId, isdel: 0 } });
	let totalNum = 0, otherTotalNum = 0;
	packArr.forEach(items => {
		totalNum += Number(items.dataValues.num);
		otherTotalNum += Number(items.dataValues.otherNum);
	});
	let totalSend = false;
	if (totalNum === Number(snNum) && otherTotalNum === Number(otherSnNum)) {
		// 已发货
		await ContractsHead.update({
			delivery_time: TIME(),
			delivery_state: '已发货',
			update_person: admin_id,
			update_time: TIME(),
		}, {
			where: { id: contractId }
		});
		totalSend = true;
	}
	// 发货提醒
	sendDeliveryMsg(contract_no, id, totalSend);
	return { code: 200, msg: '更新成功' };
}

/**
 * 后续直接修改发货类型和快递单号
 */
exports.updateExpressTypeAndNo = async params => {
	const { id, expressNo, sendType, admin_id } = params;
	await PackingList.update({ expressNo, sendType, updatePerson: admin_id, updateTime: TIME() }, { where: { id } });
	return { code: 200, msg: '更新成功' };
}

/**
 * 	合同体
 */
this.body = function(params,cb){
	var abb = params.abb;
	var code = params.code;
	var contract_no = params.contract_no;
	var where = {};
	const { unionid } = params;
	if(code!=10001){
		ContractsHead.findAll({
			where: {
				isdel: 0,
				contract_no: contract_no
			}
		}).then(async function(result){
			if(result[0]==null){
				cb({
					code: -1,
					msg: '不存在该合同',
					data: {}
				});
			}else{
				var cus_abb = result[0].dataValues.cus_abb;
				if(cus_abb==abb){
					getGoodsList();
				}else{
					cb({
						code: -1,
						msg: '不存在该合同',
						data: {}
					});
				}
			}
		}).catch(function(e){
			LOG(e);
		});	
	}else{
		getGoodsList();
	}
	function getGoodsList(){
		ContractsBody.findAll({
			where: {
				contract_no: contract_no
			}
		}).then(function(result){
			var res_arr = [];
			result.forEach(function(items,index){
				res_arr.push(items.dataValues);
			});
			cb({
				code: 200,
				msg: '',
				data: res_arr
			});
		}).catch(function(e){
			LOG(e);
		});
	}
}

/**
 * 新增合同照片
 */
this.updateAlbum = async params => {
	const { contract_no, album, admin_id } = params;
	const contractEntity = await ContractsHead.findOne({
		where: {
			isdel: 0,
			contract_no,
		},
	});
	const { id } = contractEntity.dataValues;
	const oldAlbum = contractEntity.dataValues.album;
	let newAlbumStr;
	if (oldAlbum == '' || !oldAlbum) {
		newAlbumStr = album;
	} else {
		newAlbumStr = oldAlbum + ',' + album;
	}
	await ContractsHead.update({
		album: newAlbumStr,
		update_person: admin_id,
		update_time: TIME(),
	}, {
		where: { id },
	});
	return {
		code: 200,
		msg: '更新成功',
		data: [],
	};
}


/*******************************pc端**************************************/

/**
 * 	搜索购方
 */
this.cus = function(params,cb){
	var val = params.val,_p = [];
	_p[0] = new Promise((resolve,reject) => {
		Customers.findAll({
			where: {
				'$or': {
					company: {
						'$like': '%'+val+'%'
					},
					abb: {
						'$like': '%'+val+'%'
					},
					cn_abb: {
						'$like': '%'+val+'%'
					}
				},
				isdel: 0
			}
		}).then(result => {
			var res_arr = [];
			result.forEach((items,index) => {
				res_arr.push(items.dataValues.cn_abb);
			});
			resolve(res_arr);
		}).catch(e => LOG(e));
	});

	_p[1] = new Promise((resolve,reject) => {
		Users.findAll({
			where: {
				'$or': {
					company: {
						'$like': '%'+val+'%'
					},
					abb: {
						'$like': '%'+val+'%'
					},
					cn_abb: {
						'$like': '%'+val+'%'
					}
				},
				isdel: 0
			}
		}).then(result => {
			var res_arr = [];
			result.forEach((items,index) => {
				res_arr.push(items.dataValues.cn_abb);
			});
			resolve(res_arr);
		}).catch(e => LOG(e));
	});

	Promise.all(_p).then((result => {
		result[0] = result[0].concat(result[1]);
		for (var i = 0; i < result[0].length; i++) {
			if(result[0][i]==null){
				result[0].splice(i,1);
				i--;
			}
		}
		cb({
			code: 200,
			msg: '',
			data: result[0]
		});
	})).catch(e => LOG(e));
}

/**
 * 	搜索业务员
 */
this.salesMan = function(params,cb){
	var val = params.val;
	Staff.findAll({
		where: {
			'$or': {
				user_name: {
					'$like': '%'+val+'%'
				},
				user_id: {
					'$like': '%'+val+'%'
				},
				English_abb: {
					'$like': '%'+val+'%'
				}
			},
			isdel: 0,
			on_job: 1
		}
	}).then(result => {
		var res_arr = [];
		result.forEach((items,index) => {
			res_arr.push(items.dataValues.user_name);
		});
		cb({
			code: 200,
			msg: '',
			data: res_arr
		});
	}).catch(e => LOG(e));
}

/**
 * 	更新
 */
this.update = function(params,cb){
	var that = this;
	var form_data = params.form_data;
	var contract_no = form_data.contract_no;
	var cus_abb = form_data.cus_abb;
	var sale_person = form_data.sale_person;
	var bs_name = params.bs_name;
	var data_arr = ['sign_time','delivery_time','take_time','freeze_time','close_time'];
	for(var i in form_data){
		data_arr.forEach((items,index) => {
			if(i==items){
				if(form_data[i]==''||form_data[i]==0||form_data[i]=='null'||form_data[i]=='0000-00-00') form_data[i] = null;
			}
		});
	}

	var p1 = new Promise((resolve,reject) => {
		Customers.findAll({
			where: {
				company: cus_abb,
				isdel: 0
			}
		}).then(result => {
			if(result[0]==null){
				Users.findAll({
					where: {
						company: cus_abb,
						isdel: 0
					}
				}).then(result => {
					if(result[0]!=null) form_data['cus_abb'] = result[0].dataValues.abb;
					resolve();
				}).catch(e => LOG(e));
			}else{
				form_data['cus_abb'] = result[0].dataValues.abb;
				resolve();
			}
		}).catch(e => LOG(e));
	});
	var p2 = new Promise((resolve,reject) => {
		Staff.findAll({
			where: {
				user_name: sale_person
			}
		}).then(result => {
			if(result[0]!=null) form_data['sale_person'] = result[0].dataValues.user_id;
			resolve();
		}).catch(e => LOG(e));
	});
	var p3 = new Promise((resolve,reject) => {
		Staff.findAll({
			where: {
				'$or': {
					user_name: bs_name,
					user_id: bs_name,
					English_abb: bs_name,
					English_name: bs_name
				}
			}
		}).then(result => {
			bs_name = result[0].dataValues.user_id;
			resolve();
		}).catch(e => LOG(e));
	});

	Promise.all([p1,p2,p3]).then(() => {
		form_data.update_time = TIME();
		form_data.update_person = bs_name;
		delete form_data.cus_abb;		//简称不操作
		LOG('fc');
		LOG(form_data);
		ContractsHead.update(form_data,{
			where: {
				contract_no: contract_no
			}
		}).then(result => {
			cb({
				code: 200,
				msg: '更新成功',
				data: []
			});
			//检测是否完成
			that.checkComplete({
				contract_no: contract_no
			},() => {});
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

/**
 * 	检测是否完成和解除冻结
 */
this.checkComplete = function(params,cb){
	var contract_no = params.contract_no;
	ContractsHead.findAll({
		where: {
			contract_no: contract_no,
			isdel: 0
		}
	}).then(result => {
		var payable = result[0].dataValues.payable;
		var paid = result[0].dataValues.paid;
		var install = result[0].dataValues.install;
		var delivery_state = result[0].dataValues.delivery_state;
		var isFreeze = result[0].dataValues.isFreeze;
		var complete;
		if(install){
			if(delivery_state=='已验收'&&payable==paid){
				complete = 1;
			}else{
				complete = 0;
			}
		}else{
			if(delivery_state=='已收货'&&payable==paid){
				complete = 1;
			}else{
				complete = 0;
			}
		}
		var update_params = {
			complete: complete
		};
		if(isFreeze){
			if(payable==paid){
				update_params['isFreeze'] = 0;
				// update_params['freeze_time'] = null;
			}
		}
		ContractsHead.update(update_params,{
			where: {
				contract_no: contract_no
			}
		}).then(result => {
			cb();
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

/**
 * 	删除合同
 */
this.del = function(params,cb){
	let contract_no = params.contract_no;
	/*开启事务，自动提交和回滚*/
	sequelize.transaction(t => {
		return ContractsHead.update({
			isdel: 1
		},{
			where: {
				contract_no: contract_no
			},
			transaction: t
		}).then(() => {
			return ContractsBody.destroy({
				force: true,
				where: {
					contract_no: contract_no
				},
				transaction: t
			});
		});
	}).then(() => cb()).catch(e => LOG(e));
}

/**
 * 	批量更新冻结合同
 */
this.batchFreeze = (params,cb) => {
	let freezeArr = params.freezeArr;
	let notFreezeArr = params.notFreezeArr;
	let bs_name = params.bs_name;
	new Promise((resolve,reject) => {
		common.pcAuth({
			bs_name: bs_name
		},(user_id) => {
			resolve(user_id);
		});
	}).then((user_id) => {
		let p1 = new Promise((resolve,reject) => {
			ContractsHead.update({
				isFreeze: 1,
				update_time: TIME(),
				update_person: user_id
			},{
				where: {
					contract_no: {
						'$in': freezeArr
					}
				}
			}).then(() => resolve()).catch(() => reject());
		});
		let p2 = new Promise((resolve,reject) => {
			ContractsHead.update({
				isFreeze: 0,
				update_time: TIME(),
				update_person: user_id
			},{
				where: {
					contract_no: {
						'$in': notFreezeArr
					}
				}
			}).then(() => resolve()).catch(() => reject());
		});
		Promise.all([p1,p2]).then(() => {
			cb({
				code: 200,
				msg: '更新成功',
				data: []
			});
		}).catch(e => LOG(e));
	})
}

/**
 * 	总览
 */
this.getContractsView = function(params,cb){
	var page = params.page;
	var num = params.pageSize;
	var keywords = params.keywords;
	var order_contracts_arr = params.contract_session?JSON.parse(params.contract_session):'';
	var order;
	if(params.dir){
		order = [params.field,params.dir];
	}else{
		order = ['sign_time','DESC'];
	}
	/*正常跳转和带指定合同跳转*/
	new Promise((resolve,reject) => {
		if(/[\u4e00-\u9fa5]+/.test(keywords)){
			//翻译成英文简称
			common.getCompanyInfoByCompanyName({
				company: keywords
			},(arr) => {
				try{
					keywords = arr[0].abb;
					resolve();
				}catch(e){
					reject();
				}
			});
		}else{
			resolve();
		}
	}).then(result => {
		let o = {};
		if(order_contracts_arr==''){
			o = {
				where: {
					'$and': {
						isdel: 0
					},
					'$or': {
						contract_no: {
							'$like': '%'+keywords+'%'
						},
						cus_abb: {
							'$like': '%'+keywords+'%'
						}
					}
				},
				order: [order],
				limit: num,
				offset: (page-1)*num
			}
		}else{
			o = {
				where: {
					contract_no: {
						'$in': order_contracts_arr
					}
				}
			};
		}
		ContractsHead.findAndCountAll(o).then(result => {
			let res_arr = [];
			let total = result.count;
			result.rows.forEach((items,index) => {
				res_arr.push(items.dataValues);
			});
			let _p = [];
			res_arr.forEach((items,index) => {
				_p[index] = new Promise((resolve,reject) => {
					let cus_abb = items.cus_abb;
					let i = index;
					common.transToCnAbb({
						abb: cus_abb
					},(result) => {
						let company;
						if(result.company){
							company = result.company;
						}else{
							company = result;
						}
						res_arr[i].company = company;
						Customers.findAll({
							where: {
								isdel: 0,
								company: company
							}
						}).then(result => {
							try{
								res_arr[i].credit_state = result[0].dataValues.credit_qualified;
							}catch(e){
								res_arr[i].credit_state = '';
							}
							resolve();
						}).catch(e => LOG(e));
					});
				});
			});
			Promise.all(_p).then(() => {
				cb({
					code: 200,
					msg: '',
					data: {
						data: res_arr,
						total: total
					}
				});
			}).catch(e => LOG(e));
		}).catch(e => LOG(e));
	}).catch(() => {
		cb({
			code: -1,
			msg: '找不到该公司',
			data: []
		});
	});
}

/**
 * 	获取指定签订时间范围的合同信息
 *  （把发货时间改成了签订时间，只提供给公司内部的BI图）
 */
this.getContractsInfoByDateAndCpy = (params,cb) => {
	const { startTime,endTime } = params;
	ContractsHead.findAll({
		attributes: ['contract_no','cus_abb','sign_time','delivery_state','delivery_time','payable','paid','sale_person','id', 'grade'],
		where: {
			isdel: 0,
			sign_time: {
				'$between': [startTime,endTime]
			},
			contract_state: "有效"
		}
	}).then(async result => {
		const customerMapper = {};
		const customerList = await Customers.findAll({ where: { isdel: 0 } });
		customerList.forEach(items => {
			customerMapper[items.dataValues.abb] = items.dataValues.credit_qualified;
		});
		let res_arr = [];
		result.map((items) => {
			if(!items.dataValues.delivery_time){
				items.dataValues.hasDelivery = 0;
			}else{
				items.dataValues.hasDelivery = 1;
			}
			if (customerMapper[items.dataValues.cus_abb]) {
				items.dataValues.credit_qualified = 1;
			} else {
				items.dataValues.credit_qualified = 0;
			}
			res_arr.push(items.dataValues);
		});
		cb({
			code: 200,
			msg: 'ok',
			data: res_arr
		});
	}).catch(e => LOG(e));
}

/********************************************* 装盘单 **************************************************/
/*
 *@Description: 同步增加云盘对安装盘的引用
 *@Author: zhangligang
 *@Date: 2020-12-11 10:51:04
*/
async function syncCreateToCloudDisk(install_disk_id_arr, user_id, admin_id) {
	await bluebird.map(install_disk_id_arr, async install_disk_id => {
		const { data } = await serviceCloudDisk.getTargetBurnDisk({ _id: install_disk_id });
		const { remark } = data;
		// 判断云盘中是否已存在installDiskId和userId相符的
		return await serviceCloudDisk.findOrCreateInstallDisk({ installDiskId: install_disk_id, userId: user_id, remark, admin_id });
	}, { concurrency: 1 });
}

/*
 *@Description: 同步删除云盘对安装盘的引用
 *@Author: zhangligang
 *@Date: 2020-12-11 11:27:50
*/
async function syncDeleteToCloudDisk(install_disk_id_arr, user_id) {
	await bluebird.map(install_disk_id_arr, async install_disk_id => {
		await dealer(install_disk_id, user_id);
	}, { concurrency: 1 });

	async function dealer(install_disk_id, user_id) {
		const exist = await AssembleDiskPacking.findOne({ where: {
			isdel: 0,
			user_id,
			install_disk_id,
			sn: { $ne: null },
		}});
		if (!exist) {
			// 需要解除引用
			const result = await serviceCloudDisk.findByCustom({ userId: user_id, installDiskId: install_disk_id, isdel: false});
			if (result) {
				const { _id } = result;
				await serviceCloudDisk.del({ _id });
			}
		}
	}
}

// 创建空的装盘单
// （废弃）
exports.createAssembleDisk = async params => {
	const { install_disk_id, contract_id, admin_id } = params;
	const { cus_abb } = await ContractsHead.findOne({ where: { id: contract_id } });
	const { user_id } = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
	await AssembleDiskPacking.create({
		user_id,
		contract_id,
		install_disk_id,
		create_person: admin_id,
		update_person: admin_id,
		create_time: TIME(),
		update_time: TIME(),
	});
	return { code: 200, msg: '新增成功' };
}

// 把sn填入装盘单
exports.createAssembleDiskBatch = async params => {
	const { dataSource, contract_id, admin_id } = params;
	const { cus_abb } = await ContractsHead.findOne({ where: { id: contract_id } });
	const { user_id } = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
	const records = [];
	let install_disk_id_arr = [];
	const newSnMapper = {};
	for (let i = 0; i < dataSource.length; i++) {
		const { install_disk_id, snArr } = dataSource[i];
		const info = JSON.stringify({ user_id, contract_id, install_disk_id, create_person: admin_id, update_person: admin_id, create_time: TIME(), update_time: TIME() });
		for (let j = 0; j < snArr.length; j++) {
			const sn = snArr[j];
			const newInfo = JSON.parse(info);
			newInfo.sn = sn;
			records.push(newInfo);
			install_disk_id_arr.push(install_disk_id);
			newSnMapper[sn] = install_disk_id;
		}
	}
	install_disk_id_arr = [...new Set(install_disk_id_arr)];
	await AssembleDiskPacking.bulkCreate(records);
	await syncCreateToCloudDisk(install_disk_id_arr, user_id, admin_id);
	// 处理序列号的软件配置
	await dealerProductSoft(newSnMapper, admin_id);
	return { code: 200, msg: '新增成功' };

	async function dealerProductSoft(newSnMapper, admin_id) {
		const needAddArr = [];
		for (const sn in newSnMapper) {
			needAddArr.push(sn);
		}
		await bluebird.map(needAddArr, async sn => {
			const install_disk_id = newSnMapper[sn];
			// 找到工程名
			const appName = await findProjectId(install_disk_id);
			await serviceHomeProducts.addApp({ appName, sn, admin_id });
		}, { concurrency: 3 });

		async function findProjectId(_id) {
			const result = await serviceCloudDisk.getTargetBurnDisk({ _id });
			const { projectPrimaryId } = result.data;
			const softProjectEntity = await SoftProject.findOne({ where: { id: projectPrimaryId } });
			return softProjectEntity.dataValues.projectId;
		}
	}
}

// 改变安装盘
exports.changeDiskBatch = async params => {
	const { snArr, contract_id, targetDiskId, admin_id } = params;
	const { cus_abb } = await ContractsHead.findOne({ where: { id: contract_id } });
	const { user_id } = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
	const assembleDiskPackingList = await AssembleDiskPacking.findAll({ attributes: ['install_disk_id', 'sn'], where: { isdel: 0, sn: { $in: snArr } } });
	
	// 移除软件配置
	await bluebird.map(assembleDiskPackingList, async items => {
		await new Promise(async resolve => {
			const { install_disk_id, sn } = items.dataValues;
			const appName = await findProjectId(install_disk_id);
			await serviceHomeProducts.delApp({ appName, sn, admin_id });
			resolve();
		});
	}, { concurrency: 3 });

	// 更新自身
	await AssembleDiskPacking.update({ install_disk_id: targetDiskId, update_person: admin_id, update_time: TIME() }, { where: { isdel: 0, sn: { $in: snArr }  } });

	// 云盘解除引用
	let needRemoveDiskIdArr = assembleDiskPackingList.map(items => items.dataValues.install_disk_id);
	needRemoveDiskIdArr = [...new Set(needRemoveDiskIdArr)];
	await syncDeleteToCloudDisk(needRemoveDiskIdArr, user_id);

	// 云盘添加引用
	await syncCreateToCloudDisk([targetDiskId], user_id, admin_id);

	// 添加软件配置
	const newAssembleDiskPackingList = await AssembleDiskPacking.findAll({ attributes: ['install_disk_id', 'sn'], where: { isdel: 0, sn: { $in: snArr } } });
	await bluebird.map(newAssembleDiskPackingList, async items => {
		await new Promise(async resolve => {
			const { install_disk_id, sn } = items.dataValues;
			const appName = await findProjectId(install_disk_id);
			await serviceHomeProducts.addApp({ appName, sn, admin_id });
			resolve();
		});
	}, { concurrency: 3 });

	return { code: 200, msg: '操作成功' };

	async function findProjectId(_id) {
		const result = await serviceCloudDisk.getTargetBurnDisk({ _id });
		const { projectPrimaryId } = result.data;
		const softProjectEntity = await SoftProject.findOne({ where: { id: projectPrimaryId } });
		return softProjectEntity.dataValues.projectId;
	}
}

// 获取本合同已装盘的列表
exports.getAssembleDisk = async params => {
	const { contract_id } = params;
	const result = await AssembleDiskPacking.findAll({ where: { contract_id, isdel: 0 } });
	const install_disk_id_mapper = {};
	result.forEach(items => {
		const { install_disk_id } = items.dataValues;
		if (install_disk_id) {
			install_disk_id_mapper[install_disk_id] = '';
		}
	});
	for (const install_disk_id in install_disk_id_mapper) {
		const result = await serviceCloudDisk.getTargetBurnDisk({ _id: install_disk_id });
		install_disk_id_mapper[install_disk_id] = result.data.diskName;
	}
	result.forEach((items, index) => {
		const { install_disk_id } = items.dataValues;
		if (install_disk_id) {
			result[index].dataValues.diskName = install_disk_id_mapper[install_disk_id];
		}
	});
	return { code: 200, msg: '', data: result };
}

// 合同退货时触发
exports.deleteAssembleDiskByContractId = async params => {
	const { contract_id, admin_id } = params;
	const list = await AssembleDiskPacking.findAll({ where: { contract_id, isdel: 0 } });
	let user_id;
	let install_disk_id_arr = list.map(items => {
		user_id = items.dataValues.user_id
		return items.dataValues.install_disk_id;
	});
	install_disk_id_arr = [...new Set(install_disk_id_arr)];
	await AssembleDiskPacking.update({ isdel: 1, update_person: admin_id, update_time: TIME() }, { where: { contract_id } });
	await syncDeleteToCloudDisk(install_disk_id_arr, user_id);
	return { code: 200, msg: '删除成功' };
}

/*
 *@Description: 在装箱单删除，装箱单更新，合同更新三处地方触发（20210120改为生产单删除更新，仅为一处）
 *@MethodAuthor: zhangligang
 *@Date: 2020-12-16 10:16:25
*/
exports.deleteAssembleDiskBySnArr = async params => {
	const { snArr, admin_id } = params;
	const list = await AssembleDiskPacking.findAll({ where: { sn: { $in: snArr }, isdel: 0 } });
	let user_id;
	let install_disk_id_arr = list.map(items => {
		user_id = items.dataValues.user_id;
		return items.dataValues.install_disk_id;
	});
	install_disk_id_arr = [...new Set(install_disk_id_arr)];
	await AssembleDiskPacking.update({ isdel: 1, update_person: admin_id, update_time: TIME() }, { where: { sn: { $in: snArr } } });
	await syncDeleteToCloudDisk(install_disk_id_arr, user_id);
	return { code: 200, msg: '删除成功' };
}