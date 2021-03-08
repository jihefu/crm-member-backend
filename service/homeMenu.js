const fs = require('fs');
const base = require('./base');
const Staff = require('../dao').Staff;
const Menu = require('../dao').Menu;
const PositionLevel = require('../dao').PositionLevel;
const InfoMark = require('../dao').InfoMark;
const RemList = require('../dao').RemList;
const Affair = require('../dao').Affair;
const NotiClient = require('../dao').NotiClient;
const NotiClientSub = require('../dao').NotiClientSub;
const sequelize = require('../dao').sequelize;
const ContractsHead = require('../dao').ContractsHead;
const Customers = require('../dao').Customers;
const PricingList = require('../dao').PricingList;
const Repairs = require('../dao').Repairs;
const Member = require('../dao').Member;
const Contacts = require('../dao').Contacts;

/**
 *	前端菜单列表
 */
this.list = (params,cb) => {
	let { admin_id } = params;
	let res_arr = [];
	Staff.findOne({
		where: {
			user_id: admin_id,
			isdel: 0,
			on_job: 1
		}
	}).then(result => {
		let userInfo = result.dataValues;
		Menu.findAll().then(result => {
			result.forEach((items,index) => {
				res_arr.push({
					title: items.dataValues.title,
					menuId: items.dataValues.menuId,
					source: items.dataValues.source,
					url: []
				});
			});
			const resourseConfig = JSON.parse(fs.readFileSync('./resourseConfig.json').toString());
			const { level,user_id,branch } = userInfo;
			//权限函数 1
			const levelGtFun = (score) => {
				if(user_id==1702||user_id==1802) return true;
				if(level>=score){
					return true;
				}else{
					return false;
				}
			}
		
			//权限函数 2
			const branchEqFun = (branchArr) => {
				if(user_id==1702||user_id==1802) return true;
				if(branchArr.indexOf(branch)==-1){
					return false;
				}else{
					return true;
				}
			}

			res_arr.forEach((items,index) => {
				for(let key in resourseConfig){
					if(items.source==key){
						const fun = resourseConfig[key]['authFun'];
						let urlArr = eval(fun)(userInfo);
						for (let i = 0; i < urlArr.length; i++) {
							for (let j = 0; j < resourseConfig[key].sourceArr.length; j++) {
								if(urlArr[i]==resourseConfig[key].sourceArr[j].id){
									res_arr[index].url.push(resourseConfig[key].sourceArr[j].url);
								}
							}
						}
					}
				}
			});
			cb({
				code: 200,
				msg: '',
				data: res_arr
			});
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

/**
 *	所有资源列表
 */
this.sourceList = (params,cb) => {
	const resourseConfig = JSON.parse(fs.readFileSync('./resourseConfig.json').toString());
	let menuArr = [];
	Menu.findAll({
		order: [['menuId']]
	}).then(result => {
		result.forEach((items,index) => {
			menuArr.push(items.dataValues);
		});
		cb({
			code: 200,
			msg: '',
			data: {
				menuArr: menuArr,
				sourceArr: resourseConfig
			}
		});
	}).catch(e => LOG(e));
}

/**
 *	更新资源配置文件
 */
this.updateSourceCfg = (params,cb) => {
	let form_data = JSON.parse(params.form_data);
	let key = params.key;
	let resourseConfig = JSON.parse(fs.readFileSync('./resourseConfig.json').toString());
	let awaitUpdateData = {};
	for(let i in resourseConfig){
		if(i==key) awaitUpdateData = resourseConfig[i];
	}
	if(form_data.id){
		let urlArr = resourseConfig[key].sourceArr;
		urlArr.forEach((items,index) => {
			if(items.id==form_data.id){
				urlArr[index] = form_data;
				resourseConfig[key].sourceArr = urlArr;
			}
		});
	}else{
		resourseConfig[key].authFun = form_data.authFun;
	}
	resourseConfig = JSON.stringify(resourseConfig);
	fs.writeFile('./resourseConfig.json',resourseConfig,(err,result) => {
		if(err){
			cb({
				code: -1,
				msg: '更新失败',
				data: []
			});
		}else{
			cb({
				code: 200,
				msg: '更新成功',
				data: []
			});
		}
	});
}

/**
 *	添加资源配置文件
 */
this.addSourceCfg = (params,cb) => {
	let form_data = JSON.parse(params.form_data);
	let key = params.key;
	let resourseConfig = JSON.parse(fs.readFileSync('./resourseConfig.json').toString());
	let awaitUpdateData = {};
	if(key==0){
		let sourceKey = form_data.source;
		if(resourseConfig[sourceKey]){
			cb({
				code: -1,
				msg: '资源名重复',
				data: []
			});
			return;
		}else{
			resourseConfig[sourceKey] = {
				sourceArr: [
					{
						"id": 0,
						"url": '/noAuth',
						"rem": '无权限访问'
					}
				],
				authFun: form_data.authFun
			};
		}
	}else{
		for(let i in resourseConfig){
			if(i==key) awaitUpdateData = resourseConfig[i];
		}
		let sourceArr = awaitUpdateData.sourceArr;
		sourceArr.push(form_data);
		resourseConfig[key].sourceArr = sourceArr;
	}
	resourseConfig = JSON.stringify(resourseConfig);
	fs.writeFile('./resourseConfig.json',resourseConfig,(err,result) => {
		if(err){
			cb({
				code: -1,
				msg: '新增失败',
				data: []
			});
		}else{
			cb({
				code: 200,
				msg: '新增成功',
				data: []
			});
		}
	});
}

/**
 *	删除资源配置文件
 */
this.delSourceCfg = (params,cb) => {
	let { parentKey,childKey } = params;
	let resourseConfig = JSON.parse(fs.readFileSync('./resourseConfig.json').toString());
	let awaitUpdateData = {};
	if(childKey){
		let sourceArr = resourseConfig[parentKey].sourceArr;
		sourceArr.forEach((items,index) => {
			if(items.url==childKey){
				sourceArr.splice(index,1);
			}
		});
		resourseConfig[parentKey].sourceArr = sourceArr;
	}else{
		delete resourseConfig[parentKey];
	}
	resourseConfig = JSON.stringify(resourseConfig);
	fs.writeFile('./resourseConfig.json',resourseConfig,(err,result) => {
		if(err){
			cb({
				code: -1,
				msg: '删除失败',
				data: []
			});
		}else{
			cb({
				code: 200,
				msg: '删除成功',
				data: []
			});
		}
	});
}

/**
 * 	更新菜单位置
 */
this.updateMenuPosition = (params,cb) => {
	let form_data = JSON.parse(params.form_data);
	let _arr = [],_p = [];
	for(let key in form_data){
		_arr.push({
			oldId: key,
			newId: form_data[key]
		});
	}
	_arr.forEach((items,index) => {
		_p[index] = new Promise((resolve,reject) => {
			Menu.update({
				menuId: items.newId
			},{
				where: {
					id: items.oldId
				}
			}).then(result => {
				resolve();
			}).catch(e => reject(e));
		});
	});
	Promise.all(_p).then(result => {
		cb({
			code: 200,
			msg: '更新成功',
			data: []
		});
	}).catch(e => {
		LOG(e);
		cb({
			code: -1,
			msg: '更新失败',
			data: []
		});
	});
}

/**
 * 	更新菜单
 */
this.updateMenu = (params,cb) => {
	let form_data = JSON.parse(params.form_data);
	let id = params.id;
	Menu.update(form_data,{
		where: {
			id: id
		}
	}).then(result => {
		cb({
			code: 200,
			msg: '更新成功',
			data: []
		});
	}).catch(e => {
		LOG(e);
		cb({
			code: -1,
			msg: '更新失败',
			data: []
		});
	});
}

/**
 * 	新增菜单
 */
this.addMenu = (params,cb) => {
	let form_data = JSON.parse(params.form_data);
	let key = params.key;
	//检查资源冲突
	if(form_data.source){
		Menu.findAll({
			where: {
				source: form_data.source
			}
		}).then(result => {
			if(result[0]==null){
				if(key==0){
					//新增一级菜单
					addFirstMenu();
				}else{
					//新增二级菜单
					addSecondMenu();
				}
			}else{
				cb({
					code: -1,
					msg: '资源名冲突',
					data: []
				});
			}
		}).catch(e => LOG(e));
	}else{
		if(key==0){
			//新增一级菜单
			addFirstMenu();
		}else{
			//新增二级菜单
			addSecondMenu();
		}
	}

	function addFirstMenu(){
		Menu.findOne({
			order:[['menuId','DESC']],
			limie: 1,
			offset: 0
		}).then(result => {
			let menuId = result.dataValues.menuId.toString();
			let num = parseInt(menuId.slice(0,1));
			num = (num + 1) * 100;
			form_data.menuId = num;
			Menu.create(form_data).then(() => {
				cb({
					code: 200,
					msg: '新增成功',
					data: []
				});
			}).catch(e => {
				LOG(e);
				cb({
					code: -1,
					msg: '新增失败',
					data: []
				});
			});
		}).catch(e => LOG(e));
	}

	function addSecondMenu(){
		Menu.findAll().then(result => {
			let res_arr = [];
			result.forEach((items,index) => {
				res_arr.push(parseInt(items.dataValues.menuId));
			});
			let _arr = res_arr.sort(s);
			key = parseInt(key);
			let keyIndex = _arr.indexOf((key+100));
			let num;
			if(keyIndex==-1){
				num = _arr[_arr.length-1] + 1;
			}else{
				num = _arr[keyIndex-1] + 1;
			}
			form_data.menuId = num;
			Menu.create(form_data).then(() => {
				cb({
					code: 200,
					msg: '新增成功',
					data: []
				});
			}).catch(e => {
				LOG(e);
				cb({
					code: -1,
					msg: '新增失败',
					data: []
				});
			});
		}).catch(e => LOG(e));
	}

	function s(a,b){
		return a - b;
	}
}

/**
 * 	删除菜单
 */
this.delMenu = (params,cb) => {
	let key = params.key;
	Menu.destroy({
		force: true,
		where: {
			menuId: key
		}
	}).then(() => {
		cb({
			code: 200,
			msg: '删除成功',
			data: []
		});
	}).catch(e => {
		LOG(err);
		cb({
			code: -1,
			msg: '删除失败',
			data: []
		});
	});
}


/**
 *  新增标记
 */
this.addMark = (params,cb) => {
	let form_data = params.form_data;
	form_data.addPerson = params.admin_id;
	form_data.updatePerson = params.admin_id;
	InfoMark.findOne({
		where: {
			tableId: form_data.tableId,
			type: form_data.type,
			isdel: 0
		}
	}).then(result => {
		if(result==null){
			InfoMark.create(form_data).then(result => {
				cb({
					code: 200,
					msg: '标记成功',
					data: []
				});
			}).catch(e => {
				LOG(e);
				cb({
					code: -1,
					msg: '标记失败',
					data: []
				});
			});
		}else{
			cb({
				code: -1,
				msg: '请勿重复操作',
				data: []
			});
		}
	}).catch(e => LOG(e));
}

exports.addMarkBatch = async params => {
	const { admin_id, type, tableIdArr } = params;
	const count = await InfoMark.count({
		where: {
			tableId: { $in: tableIdArr },
			type,
			isdel: 0,
		}
	})
	if (count !== 0) {
		return { code: -1, msg: '无法批量操作，请刷新后重试' };
	}
	const formDataArr = tableIdArr.map(items => ({
		type,
		tableId: items,
		addPerson: admin_id,
		updatePerson: admin_id,
	}));
	await InfoMark.bulkCreate(formDataArr);
	return { code: 200, msg: '批量标记成功' };
}

/**
 *  取消标记
 */
this.cancelMark = (params,cb) => {
	let form_data = params.form_data;
	let updatePerson = params.admin_id;
	InfoMark.update({
		isdel: 1,
		updatePerson: updatePerson
	},{
		where: {
			tableId: form_data.tableId,
			type: form_data.type
		}
	}).then(result => {
		cb({
			code: 200,
			msg: '取消标记成功',
			data: []
		});
	}).catch(e => {
		LOG(e);
		cb({
			code: -1,
			msg: '取消标记失败',
			data: []
		});
	});
}

exports.cancelMarkBatch = async params => {
	const { admin_id, type, tableIdArr } = params;
	const count = await InfoMark.count({
		where: {
			tableId: { $in: tableIdArr },
			type,
			isdel: 0,
		}
	})
	if (count !== tableIdArr.length) {
		return { code: -1, msg: '无法批量操作，请刷新后重试' };
	}
	await InfoMark.update({ isdel: 1, updatePerson: admin_id }, { where: { tableId: { $in: tableIdArr } } });
	return { code: 200, msg: '批量取消标记成功' };
}

/**
 *  指定附注列表
 */
this.remList = (params,cb) => {
	const { type,typeKey } = params;
	RemList.findAll({
		where: {
			type: type,
			typeKey: typeKey
		}
	}).then(result => {
		const staffMap = new base.StaffMap().getStaffMap();
		result.forEach((items,index) => {
			items.dataValues.insert_person = staffMap[items.dataValues.insert_person].user_name;
		});
		cb({
			code: 200,
			msg: '',
			data: result
		});
	}).catch(e => LOG(e));
}

/**
 *  增加附注
 */
this.remAdd = (params,cb) => {
	RemList.findAll({
		where: {
			type: params.type,
			typeKey: params.typeKey
		}
	}).then(result => {
		let typeId;
		if(result[0]==null){
			typeId = 1;
		}else{
			typeId = result.length+1;
		}
		RemList.create({
			type: params.type,
			typeId: typeId,
			content: params.content,
			insert_person: params.admin_id,
			insert_time: TIME(),
			typeKey: params.typeKey
		}).then(result => {
			const staffMap = new base.StaffMap().getStaffMap();
			result.dataValues.insert_person = staffMap[result.dataValues.insert_person].user_name;
			cb({
				code: 200,
				msg: '',
				data: result
			});
		}).catch(e => LOG(e));
	}).catch(e => LOG(e));
}

/**
 * 朗杰首页搜索引擎
 */
this.searchEngine = (params,cb) => {
	let { admin_id, keywords, target, page, num, affairSender, affairReceiver } = params;
	page = page ? Number(page) : 1;
	num = num ? Number(num) : 15;
	let resourseArr;
	this.list({
		admin_id
	},r => {
		resourseArr = r.data;
		new Promise((resolve,reject) => {
			if(target=='contracts'){
				searchContracts(resolve,reject);
			}else if(target=='pricingList'){
				searchPricingList(resolve,reject);
			}else if(target=='repairs'){
				searchRepairs(resolve,reject);
			}else if(target=='customers'){
				searchCustomers(resolve,reject);
			}else if(target=='member'){
				searchMember(resolve,reject);
			}else if(target=='contacts'){
				searchContacts(resolve,reject);
			}else{
				searchAffairs(resolve,reject);
			}
		}).then(result => {
			// 搜索结果处理
			const { count, rows } = result;
			cb(result);
		}).catch(e => cb({
			code: -1,
			msg: e.message,
			data: []
		}));
	});

	function getFrontUrl(result,type) {
		const frontUrl = resourseArr.filter(items => items.source==type)[0].url[0];
		const resArr = result.rows.map(items => {
			items.dataValues.frontUrl = frontUrl;
			return items;
		});
		return result;
	}

	// 事务搜索
	function searchAffairs(resolve,reject) {
		const whereAnd = [
			sequelize.where(sequelize.col('NotiClient.isdel'), { '$eq': 0})
		];
		if(affairSender&&affairSender!=0){
			whereAnd.push(sequelize.where(sequelize.col('NotiClient.sender'), { '$eq': affairSender}));
		}
		if(affairReceiver&&affairReceiver!=0){
			whereAnd.push(sequelize.where(sequelize.col('NotiClientSubs.receiver'), { '$eq': affairReceiver}));
			whereAnd.push(sequelize.where(sequelize.col('NotiClientSubs.atMe'), { '$eq': 1}));
		}
		NotiClient.findAndCountAll({
			include: {
				model: NotiClientSub
			},
			where: {
				'$or': [
					sequelize.where(sequelize.col('NotiClient.content'), { '$like': '%'+keywords+'%'}),
					sequelize.where(sequelize.col('NotiClient.album'), { '$like': '%'+keywords+'%'}),
					sequelize.where(sequelize.col('NotiClient.file'), { '$like': '%'+keywords+'%'}),
					sequelize.where(sequelize.col('NotiClientSubs.atReply'), { '$like': '%'+keywords+'%'})
				],
				'$and': whereAnd,
			},
			// subQuery: false,
			// limit: num,
			// offset: ( page - 1 ) * num,
			order: [[sequelize.col('NotiClient.post_time'),'DESC']],
			distinct: true
		}).then(result => {
			result.rows = result.rows.splice(( page - 1 ) * num, num);
			resolve(result);
		}).catch(e => {
			reject(e);
		});
	}

	// 合同搜索
	function searchContracts(resolve,reject) {
		const _p1 = new Promise((resolve,reject) => {
			return Customers.findAll({
				where: {
					isdel: 0,
					'$or': {
						company: {
							'$like': '%'+keywords+'%'
						},
						cn_abb: {
							'$like': '%'+keywords+'%'
						},
						abb: {
							'$like': '%'+keywords+'%'
						}
					}
				}
			}).then(result => {
				const cus_abb_arr = result.map(items => items.dataValues.abb);
				resolve(cus_abb_arr);
			}).catch(e => reject(e));
		});

		const _p2 = new Promise((resolve,reject) => {
			return Staff.findAll({
				where: {
					isdel: 0,
					'$or': {
						user_id: {
							'$like': '%'+keywords+'%'
						},
						user_name: {
							'$like': '%'+keywords+'%'
						},
					}
				}
			}).then(result => {
				const sale_person_arr = result.map(items => items.dataValues.user_id);
				resolve(sale_person_arr);
			}).catch(e => reject(e));
		});

		Promise.all([_p1,_p2]).then(result => {
			const cus_abb_arr = result[0];
			const sale_person_arr = result[1];
			return ContractsHead.findAndCountAll({
				where: {
					isdel: 0,
					'$or': {
						contract_no: {
							'$like': '%'+keywords+'%'
						},
						cus_abb: {
							'$in': cus_abb_arr
						},
						sale_person: {
							'$in': sale_person_arr
						}
					}
				},
				limit: num,
				offset: ( page - 1 ) * num,
				order: [['id','DESC']],
			}).then(result => {
				const customerMapper = {};
				return Customers.findAll({
					where: {
						isdel: 0
					}
				}).then(cus => {
					cus.forEach((items,index) => {
						customerMapper[items.dataValues.abb] = items.dataValues.company;
					});
					const staffMap = new base.StaffMap().getStaffMap();
					result.rows.forEach((items,index) => {
						try{
							result.rows[index].dataValues.company = customerMapper[items.dataValues.cus_abb];
						}catch(e){
							result.rows[index].dataValues.company = items.dataValues.cus_abb;
						}
						try{
							result.rows[index].dataValues.sale_person_name = staffMap[items.dataValues.sale_person].user_name;
						}catch(e){
							result.rows[index].dataValues.sale_person_name = items.dataValues.sale_person;
						}
					});
					resolve(getFrontUrl(result,'contract'));
				}).catch(e => { throw e });
			}).catch(e => reject(e));
		}).catch(e => reject(e));
	}

	// 定价单搜索
	function searchPricingList(resolve,reject) {
		return PricingList.findAndCountAll({
			where: {
				isdel: 0,
				'$or': {
					contract_no: {
						'$like': '%'+keywords+'%'
					},
					company: {
						'$like': '%'+keywords+'%'
					},
				}
			},
			limit: num,
			offset: ( page - 1 ) * num,
			order: [['id','DESC']],
		}).then(result => {
			resolve(getFrontUrl(result,'pricingList'));
		}).catch(e => reject(e));
	}

	// 维修单搜索
	function searchRepairs(resolve,reject){
		return Repairs.findAndCountAll({
			where: {
				isdel: 0,
				'$or': {
					repair_contractno: {
						'$like': '%'+keywords+'%'
					},
					cust_name: {
						'$like': '%'+keywords+'%'
					},
				}
			},
			limit: num,
			offset: ( page - 1 ) * num,
			order: [['id','DESC']],
		}).then(result => {
			resolve(getFrontUrl(result,'repair'));
		}).catch(e => reject(e));
	}

	// 客户搜索
	function searchCustomers(resolve,reject) {
		return Customers.findAndCountAll({
			where: {
				isdel: 0,
				'$or': {
					company: {
						'$like': '%'+keywords+'%'
					},
					abb: {
						'$like': '%'+keywords+'%'
					},
					cn_abb: {
						'$like': '%'+keywords+'%'
					},
					user_id: {
						'$like': '%'+keywords+'%'
					}
				}
			},
			limit: num,
			offset: ( page - 1 ) * num,
			order: [['id']],
		}).then(result => {
			resolve(getFrontUrl(result,'customers'));
		}).catch(e => reject(e));
	}

	// 会员搜索
	function searchMember(resolve,reject) {
		Member.findAndCountAll({
			where: {
				'$or': {
					company: {
						'$like': '%'+keywords+'%'
					},
					name: {
						'$like': '%'+keywords+'%'
					},
					phone: {
						'$like': '%'+keywords+'%'
					}
				}
			},
			limit: num,
			offset: ( page - 1 ) * num,
			order: [['id']],
		}).then(result => {
			resolve(getFrontUrl(result,'member'));
		}).catch(e => reject(e));
	}

	// 联系人搜索
	function searchContacts(resolve,reject) {
		Contacts.findAndCountAll({
			where: {
				'$or': {
					company: {
						'$like': '%'+keywords+'%'
					},
					name: {
						'$like': '%'+keywords+'%'
					},
					phone1: {
						'$like': '%'+keywords+'%'
					}
				}
			},
			limit: num,
			offset: ( page - 1 ) * num,
			order: [['id']],
		}).then(result => {
			resolve(getFrontUrl(result,'contacts'));
		}).catch(e => reject(e));
	}
}