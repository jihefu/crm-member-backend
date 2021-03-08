const url = require('url');
const path = require('path');
const serviceHomeMenu = require('../service/homeMenu');
const serviceOpen = require('../service/open');

/**
 *	前端菜单列表
 */
this.list = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	params.admin_id = req.session.admin_id;
	serviceHomeMenu.list(params,(result) => {
		res.status(result.code);
		res.send(result);
	});
}

/**
 *	所有资源列表
 */
this.sourceList = (req,res,next) => {
	serviceHomeMenu.sourceList({},(result) => {
		res.send(result);
	});
}

/**
 *	更新资源配置文件
 */
this.updateSourceCfg = (req,res,next) => {
	let params = req.body;
	serviceHomeMenu.updateSourceCfg(params,(result) => {
		res.send(result);
	});
}

/**
 *  添加资源配置文件
 */
this.addSourceCfg = (req,res,next) => {
	let params = req.body;
	serviceHomeMenu.addSourceCfg(params,(result) => {
		res.send(result);
	});
}

/**
 * 	删除资源配置文件
 */
this.delSourceCfg = (req,res,next) => {
	let params = req.body;
	serviceHomeMenu.delSourceCfg(params,(result) => {
		res.send(result);
	});
}

/**
 * 	更新菜单位置
 */
this.updateMenuPosition = (req,res,next) => {
	let params = req.body;
	serviceHomeMenu.updateMenuPosition(params,(result) => {
		res.send(result);
	});
}

/**
 * 	更新菜单
 */
this.updateMenu = (req,res,next) => {
	let params = req.body;
	serviceHomeMenu.updateMenu(params,(result) => {
		res.send(result);
	});
}

/**
 * 	新增菜单
 */
this.addMenu = (req,res,next) => {
	let params = req.body;
	serviceHomeMenu.addMenu(params,(result) => {
		res.send(result);
	});
}

/**
 * 	删除菜单
 */
this.delMenu = (req,res,next) => {
	let params = req.body;
	serviceHomeMenu.delMenu(params,(result) => {
		res.send(result);
	});
}

/**
 *  新增标记
 */
this.addMark = (req,res,next) => {
	let params = req.body;
	let admin_id = req.session.admin_id;
	serviceHomeMenu.addMark({
		form_data: params,
		admin_id: admin_id
	},(result) => {
		res.send(result);
	});
}

exports.addMarkBatch = async (req, res, next) => {
	const params = req.body;
	params.admin_id = req.session.admin_id;
	const result = await serviceHomeMenu.addMarkBatch(params);
	res.send(result);
}

/**
 *  删除标记
 */
this.cancelMark = (req,res,next) => {
	let params = req.body;
	let admin_id = req.session.admin_id;
	serviceHomeMenu.cancelMark({
		form_data: params,
		admin_id: admin_id
	},(result) => {
		res.send(result);
	});
}

exports.cancelMarkBatch = async (req, res, next) => {
	const params = req.body;
	params.admin_id = req.session.admin_id;
	const result = await serviceHomeMenu.cancelMarkBatch(params);
	res.send(result);
}

/**
 *  获取指定的附注列表
 */
this.remList = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeMenu.remList(params,result => {
		res.send(result);
	});
}

/**
 *  增加附注
 */
this.remAdd = (req,res,next) => {
	let params = req.body;
	params.admin_id = req.session.admin_id;
	serviceHomeMenu.remAdd(params,result => {
		res.send(result);
	});
}

exports.getVirCardInfo = async (req, res, next) => {
	const { sn } = req.params;
	const result = await serviceOpen.getVirCardInfo({
		sn,
        user_code_arr: [10001],
	});
	res.send(result);
}

/**
 * 朗杰首页搜索引擎
 */
this.searchEngine = (req,res,next) => {
	const params = url.parse(req.url,true).query;
	params.admin_id = req.session.admin_id;
	serviceHomeMenu.searchEngine(params,result => {
		res.send(result);
	});
}

/**
 * 下载
 */
this.downloadImg = (req, res, next) => {
	const params = url.parse(req.url,true).query;
	const { filePath } = params;
	res.download(DIRNAME+'/public'+filePath);
}

/**
 * 下载文件
 */
this.downloadFile = (req, res, next) => {
	const params = url.parse(req.url,true).query;
	const { filePath } = params;
	res.download(DIRNAME+'/downloads'+filePath);
}

// /**
//  *	所有菜单列表
//  */
// this.allList = (req,res,next) => {
// 	let params = url.parse(req.url,true).query;
// 	serviceHomeMenu.allList(params,(result) => {
// 		res.status(result.code);
// 		res.send(result);
// 	});
// }

// /**
//  *	指定roleId获取资源Id集合
//  */
// this.orderRoleId = (req,res,next) => {
// 	let params = url.parse(req.url,true).query;
// 	serviceHomeMenu.orderRoleId(params,(result) => {
// 		res.status(result.code);
// 		res.send(result);
// 	});
// }

// /**
//  *	分配资源更新
//  */
// this.updateSource = (req,res,next) => {
// 	let params = req.body;
// 	serviceHomeMenu.updateSource(params,(result) => {
// 		res.send(result);
// 	});
// }

// /**
//  *	所有角色列表
//  */
// this.roleList = (req,res,next) => {
// 	let params = url.parse(req.url,true).query;
// 	serviceHomeMenu.roleList(params,(result) => {
// 		res.send(result);
// 	});
// }

// /**
//  *	删除角色
//  */
// this.deleteRole = (req,res,next) => {
// 	let params = req.body;
// 	serviceHomeMenu.deleteRole(params,(result) => {
// 		res.send(result);
// 	});
// }

// /**
//  *	新增角色
//  */
// this.addRole = (req,res,next) => {
// 	let params = req.body;
// 	serviceHomeMenu.addRole(params,(result) => {
// 		res.send(result);
// 	});
// }