const url = require('url');
const path = require('path');
const serviceHomeWallet = require('../service/homeWallet');
const actionHomeFileSys = require('../action/homeFileSys');

/**
 *	钱包列表
 */
this.list = (req,res,next) => {
	let params = url.parse(req.url,true).query;
	serviceHomeWallet.list(params,result => {
		res.send(result);
	});
}

/**
 *  获取指定user_id的钱包
 */
this.getTargetItem = (req,res,next) => {
    const { user_id } = req.params;
	serviceHomeWallet.getTargetItem({
        user_id: user_id
    },result => {
		res.send(result);
	});
}

/**
 *  新增抵价券
 */
this.addCoup = (req,res,next) => {
	const form_data = req.body;
	serviceHomeWallet.addCoup(form_data,result => {
		res.send(result);
	});
}

/**
 *  删除抵价券
 */
this.delCoup = (req,res,next) => {
	const form_data = req.body;
	serviceHomeWallet.delCoup(form_data,result => {
		res.send(result);
	});
}

/**
 *  远程搜索抵价券
 */
this.remoteSearchCouponNo = (req,res,next) => {
	const form_data = url.parse(req.url,true).query;
	serviceHomeWallet.remoteSearchCouponNo(form_data,result => {
		res.send(result);
	});
}

// 指定抵价券的流水
exports.getTargetCoupLog = async (req, res, next) => {
	const { coupon_no } = req.params;
	const result = await serviceHomeWallet.getTargetCoupLog(coupon_no);
	res.send(result);
}

// 指定保证金的流水
exports.getTargetDepoLog = async (req, res, next) => {
	const { contract_no } = req.params;
	const result = await serviceHomeWallet.getTargetDepoLog(contract_no);
	res.send(result);
}

/**
 * 计算年度抵价券总金额
 */
this.calculYearCoup = (req,res,next) => {
	const form_data = url.parse(req.url,true).query;
	serviceHomeWallet.calculYearCoup(form_data,result => {
		res.send(result);
	});
}

/**
 * 生成年度抵价券
 */
this.createYearCoup = (req,res,next) => {
	const form_data = req.body;
	serviceHomeWallet.createYearCoup(form_data,result => {
		res.send(result);
	});
}

/**
 * 批量新增抵价券
 * 弃用20200811
 */
this.createCouponByExcel = async (req, res, next) => {
	const { admin_id } = req.session;
	actionHomeFileSys.parseExcel(req, res, next, async result => {
		if (result.code === 200) {
			serviceHomeWallet.createCouponByExcel(result.data, { admin_id }, result => {
				res.send(result);
			});
		} else {
			res.send(result);
		}
	});
}

this.assignCouponByUserId = async (req, res, next) => {
	const { admin_id } = req.session;
	const { couponNoArr, userId, endTime } = req.body;
	const result = await serviceHomeWallet.assignCouponByUserId({ couponNoArr, userId, admin_id, endTime });
	res.send(result);
}

this.printCoup = async (req, res, next) => {
	const { admin_id } = req.session;
	const params = req.body;
	params.admin_id = admin_id;
	const result = await serviceHomeWallet.printCoup(params);
	res.send(result);
}

this.bankCoupList = async (req, res, next) => {
	const params = url.parse(req.url, true).query;
	const result = await serviceHomeWallet.bankCoupList(params);
	res.send(result);
}