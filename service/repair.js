var common = require('./common');
var sequelize = require('../dao').sequelize;
var Member = require('../dao').Member;
var Customers = require('../dao').Customers;
var Repairs = require('../dao').Repairs;
const Products = require('../dao').Products;
const serviceHomeRepair = require('../service/homeRepairs');
const sendMQ = require('./rabbitmq').sendMQ;
const BaseEvent = require('../dao').BaseEvent;

/**
 * 	获得名字和公司信息（认证中间件）
 */
this.getNameAndAbb = async function(params,cb){
	var open_id = params.open_id;
	var name,company;
	const memberEntity = await Member.findOne({ where: { open_id }});
	name = memberEntity.dataValues.name;
	company = memberEntity.dataValues.company;
	const customerentity = await Customers.findOne({ where: { isdel: 0, company }});
	if (customerentity) {
		cb({
			code: 200,
			msg: '',
			data: {
				name,
				cn_abb: customerentity.dataValues.cn_abb,
				abb:customerentity.dataValues.abb,
			}
		});
	} else {
		cb({
			code: 200,
			msg: '',
			data: {
				name,
				cn_abb: company,
			}
		});
	}
}

/**
 * 根据user_id获取cn_abb集合
 */
this.getRepaidIdByUserId = async user_id => {
	let repairId = [];
	const memberEntity = await Member.findOne({ where: { user_id } });
	const { phone } = memberEntity.dataValues;
	const productList = await Products.findAll({ where: { dealer: user_id, isdel: 0 } });
	const snArr = productList.map(items => items.dataValues.serialNo);
	const repairList = await Repairs.findAll({ where: { isdel: 0 }});
	repairList.forEach(items => {
		const { serial_no, id, contact_type } = items.dataValues;
		if (contact_type == phone) {
			repairId.push(id);
		} else {
			snArr.forEach(sn => {
				if (serial_no.indexOf(sn) !== -1) {
					repairId.push(id);
				}
			});
		}
	});
	repairId = [ ...new Set(repairId) ];
	return repairId;
}

/**
 * 	获得维修列表
 */
this.getList = async function(params,cb){
	var page = params.page?params.page:1;
	var keywords = params.keywords?params.keywords:'';
	var num = params.num?params.num:10;
	var filter = params.filter;
	var cn_abb = params.cn_abb;
	var code = params.code;
	const repairId = params.repairId;
	var where = {};
	if (code.includes(10001)) {
		where = {
			'$and': {
				isdel: 0
			},
			'$or': {
				repair_contractno: {
					'$like': '%'+keywords+'%'
				},
				cust_name: {
					'$like': '%'+keywords+'%'
				},
				contact: {
					'$like': '%'+keywords+'%'
				},
				serial_no: { $like: '%'+keywords+'%' },
			}
		};
	} else if (code.includes(10002)) {
		where = {
			$and: { id: { $in: repairId } },
			$or: {
				serial_no: { $like: '%'+keywords+'%' },
			}
		};
	} else {
		where = {
			'$and': {
				isdel: 0,
				cust_name: cn_abb
			},
			'$or': {
				serial_no: { $like: '%'+keywords+'%' },
			}
		};
	}
	if(filter!='全部'&&filter!=undefined){
		where['$and']['deliver_state'] = filter;
	}
	Repairs.findAll({
		attributes: ['repair_contractno', 'cust_name', 'album','goods','problems', 'serial_no', 'deliver_state'],
		where: where,
		order: [['id','DESC']],
		limit: num,
		offset: (page-1)*num
	}).then(function(result){
		var res_arr = [],album_arr = [];
		result.forEach(function(items,index){
			res_arr.push(items.dataValues);
			for(var i in items.dataValues){
				if(i=='album'){
					try{
						var single_album = items.dataValues[i].split(',')[0];
						if (!single_album) {
							single_album = '';
						} else {
							var splitArr = single_album.split('/repair/');
							single_album = '/repair/small_104_' + splitArr[1];
						}
					}catch(e){
						var single_album = '';
					}
					album_arr.push(single_album);
				}
			}
		});
		cb({
			code: 200,
			msg: '',
			data: {
				res_arr: res_arr,
				album_arr: album_arr
			}
		});
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	获得维修单信息
 */
this.getInfo = async (params, cb) => {
	const { repair_contractno, cn_abb, code, repairId } = params;
	let where;
	if (code.includes(10001)) {
		where = { repair_contractno, isdel: 0 };
	} else if (code.includes(10002)) {
		where = { repair_contractno, id: { $in: repairId }, isdel: 0 };
	} else {
		where = { repair_contractno, isdel: 0, cust_name: cn_abb };
	}
	let result = await Repairs.findOne({ where });
	if (!result) {
		const r = { code: -1, msg: '不存在该维修单', data: {}};
		if (cb) {
			cb(r);
		}
		return r;
	}
	result = serviceHomeRepair.trans([result])[0];
	const res_arr = [];
	const res_obj = {
		album: {
			name: '照片',
		},
		repair_contractno: {
            name: '维修单号',
		},
		cust_name: {
            name: '送修单位',
		},
		receive_time: {
            name: '接收时间',
		},
		receive_no: {
            name: '收件单号',
		},
		goods: {
            name: '产品',
		},
		standrd: {
            name: '规格',
		},
		serial_no: {
            name: '序列号',
		},
		number: {
            name: '数量',
		},
		problems: {
            name: '问题',
		},
		treatement: {
            name: '处理方法',
		},
		conclusion: {
            name: '送修检验结论',
		},
		pri_check_person: {
            name: '送修检验人',
		},
		own_cost: {
            name: '自产',
		},
		outer_cost: {
            name: '外购',
		},
		related_contract: {
			name: '维修合同',
		},
		repair_person: {
            name: '维修人',
		},
		again_conclusion: {
            name: '维修检验结论',
		},
		again_check_person: {
            name: '维修检验人',
		},
		guarantee_repair: {
            name: '保修',
		},
		deliver_state: {
            name: '维修状态',
		},
		contact: {
            name: '联系人',
		},
		contact_type: {
            name: '联系方式',
		},
		express: {
            name: '快递单号',
		},
		deliver_time: {
            name: '发件时间',
		},
		take_person: {
            name: '收件确认人',
		},
		take_time: {
            name: '收件确认时间',
		},
		rem: {
            name: '备注',
		},
		insert_person: {
            name: '录入人',
		},
		insert_time: {
            name: '录入时间',
		},
		update_person: {
            name: '更新人',
		},
		update_time: {
            name: '更新时间',
        },
	};
	if (!code.includes(10001)) {
		delete res_obj.pri_check_person;
		delete res_obj.own_cost;
		delete res_obj.outer_cost;
		delete res_obj.repair_person;
		delete res_obj.again_check_person;
		delete res_obj.insert_person;
		delete res_obj.insert_time;
		delete res_obj.update_person;
		delete res_obj.update_time;
	}
	for (const key in res_obj) {
		res_arr.push({
			column_name: key,
			column_comment: res_obj[key].name,
			val: result.dataValues[key],
		});
	}
	const r = {
		code: 200,
		msg: '',
		data: {
			res_arr,
			status:result.dataValues.deliver_state,
			data: result.dataValues,
		},
	};
	if (cb) {
		cb(r);
	}
	return r;
}

/**
 * 根据维修单号获取
 */
this.stateDetail = async ({ no }) => {
	const result = await Repairs.findOne({
		where: { repair_contractno: no, isdel: 0 },
	});
	if (!result) {
		return { code: -1, msg: '不存在' };
	}
	return { code: 200, msg: '', data: serviceHomeRepair.trans([result], true)[0] };
}

//判断是否完成
function checkComplete(no,cb){
	Repairs.findAll({
		where: {
			repair_contractno: no,
			isdel: 0
		}
	}).then(function(result){
		var deliver_state = result[0].deliver_state;
		if(deliver_state=='已收件'){
			Repairs.update({
				complete: 1
			},{
				where: {
					isdel: 0,
					repair_contractno: no
				}
			}).then(function(result){
				cb();
			}).catch(function(e){
				LOG(e);
			});
		}else{
			Repairs.update({
				complete: 0
			},{
				where: {
					isdel: 0,
					repair_contractno: no
				}
			}).then(function(result){
				cb();
			}).catch(function(e){
				LOG(e);
			});
		}
	}).catch(function(e){
		LOG(e);
	});
}

/**
 * 	确认收货
 */
this.takeGoods = async function(params,cb){
	var name = params.name;
	var no = params.no;
	const { open_id } = params;
	var time = DATETIME();
	const repairEntity = await Repairs.findOne({ where: { isdel: 0, repair_contractno: no } });
	const { id } = repairEntity.dataValues;
	await Repairs.update({
		take_person: name,
		take_time: time
	}, { where: { id } });
	const result = await serviceHomeRepair.toHasReceive({ id });
	cb(result);

	sendTakeGoodsMq({ open_id, name, no });
}

const sendTakeGoodsMq = async params => {
	const { open_id, name, no } = params;
	// 判断是否已经确认收货过了
	const isExist = await BaseEvent.findOne({ where: { isdel: 0, type: '1306', rem: no } });
	if (isExist) {
		return;
	}
	common.createEvent({
		headParams: {
			ownerId: open_id,
			type: '1306',
			time: TIME(),
			person: name,
			rem: no,
		},
		bodyParams: {},
	}, () => {});
	sendMQ.sendQueueMsg('memberActivity', JSON.stringify({
		_class: 'takeGoods',
		open_id,
	}), result => {
		console.log(result);
	});
}
exports.sendTakeGoodsMq = sendTakeGoodsMq;

/**
 * 	提交
 */
this.sub = function(params,cb){
	var data = params.data;
	var no = data.repair_contractno;
	var admin_id = params.admin_id;
	data.update_person = admin_id;
	data.update_time = TIME();
	if(data.complete=='是'){
		data.complete = 1;
	}else{
		data.complete = 0;
	}

	var date_arr = ['take_time'],date_stamp = ['receive_time','deliver_time'];
	for(var key in data){
		date_arr.forEach((items,index) => {
			if(key==items){
				if(data[key]==''||data[key]=='null'||data[key]==0||data[key]=='0000-00-00') data[key] = null;
			}
		});
		date_stamp.forEach((items,index) => {
			if(key==items){
				if(data[key]==''||data[key]=='null'||data[key]=='0000-00-00') data[key] = 0;
			}
		});
	}

	if(data.receive_time!=undefined&&data.receive_time!=0){
		try{
			data.receive_time = Date.parse(data.receive_time).toString().slice(0,10);
		}catch(e){}
	}
	if(data.deliver_time=='') data.deliver_time = 0;
	if(data.receive_time=='') data.receive_time = 0;
	if(data.deliver_time!=undefined&&data.deliver_time!=0){
		try{
			data.deliver_time = Date.parse(data.deliver_time).toString().slice(0,10);
		}catch(e){}
	}
	if(data.take_time=='') data.take_time = null;


	Repairs.update(data,{
		where: {
			isdel: 0,
			repair_contractno: no
		}
	}).then(function(result){
		checkComplete(no,function(){
			cb();
		});
	}).catch(function(e){
		LOG(e);
	});
}

exports.updateAlbum = async params => {
	const { repair_contractno, album, admin_id } = params;
	const result = await Repairs.findOne({
		where: {
			repair_contractno,
			isdel: 0,
		},
	});
	const oldAlbumStr = result.dataValues.album;
	const { id } = result.dataValues;
	let newAlbumStr;
	if (oldAlbumStr == '') {
		newAlbumStr = album;
	} else {
		newAlbumStr = oldAlbumStr + ',' + album;
	}
	await Repairs.update({
		album: newAlbumStr,
		update_person: admin_id,
		update_time: TIME(),
	}, {
		where: {
			id,
		},
	});
	return {
		code: 200,
		msg: '更新成功',
		data: [],
	};
}