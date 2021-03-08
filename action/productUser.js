const serviceProductUser = require('../service/productUser');
const serviceContract = require('../service/contract');

this.checkReg = async (req, res, next) => {
    const { code, unionid } = req.session;
    if (code.indexOf(10000) !== -1) {
        const originalUrl = req.originalUrl;
        res.redirect('/vip/retailReg#' + originalUrl);
        return false;
    } else if (code.indexOf(10001) !== -1) {
        res.render('./pages/tip', { tip: '朗杰员工禁止此操作' });
        return false;
    }
    return true;
}

// 说明书信息
exports.showInfo = async (req, res, next) => {
    const params = req.params;
    const { sn } = params;
    const { unionid } = req.session;
    const result = await serviceProductUser.showInfo({
        sn,
        unionid,
    });
    if (result.code === 200) {
        const { sn, machineNo, validTime, model, purchase_time, valid_date, contract_no, addr, bind_unionid, name, phone } = result.data;
        let modelName;
        if (model.indexOf('V') !== -1) {
            var str = '';
            for (let i = 0; i < model.length; i++) {
                if (/\d/.test(model[i])) {
                    str += model[i];
                }
            }
            modelName = '威程' + str;
        } else {
            modelName = model;
        }
        res.render('./pages/productInfo', {
            sn,
            machineNo,
            validTime: validTime == 0 ? '永久注册' : validTime,
            model: modelName,
            contract_no,
            name,
            phone,
            addr,
            purchase_time,
            valid_date,
            bind_unionid,
        });
    } else {
        res.render('./pages/tip', {
            tip: '未找到该产品',
        });
    }
}

// 填写电子保修卡页面
exports.fillWarranty = async (req, res, next) => {
    const { sn } = req.params;
    const { unionid } = req.session;
    if (!await this.checkReg(req, res, next)) return;
    const result = await serviceProductUser.fillWarranty({
        sn,
        unionid,
    });
    if (result.code === -1) {
        res.render('./pages/tip', {
            tip: result.msg,
        });
        return;
    }
    const { name, phone, addr, purchase_time, contract_no } = result.data;
    res.render('./pages/productInfoFill', {
        sn,
        name,
        phone,
        addr,
        purchase_time,
        contract_no,
    });
}

// 绑定卡
exports.bindToVir = async (req, res, next) => {
    const { sn } = req.params;
    const { unionid } = req.session;
    const { addr } = req.body;
    const result = await serviceProductUser.bindToVir({
        sn,
        unionid,
        addr,
    });
    res.send(result);
}

// 申诉页面
exports.appealPage = async (req, res, next) => {
    const { sn } = req.params;
    if (!await this.checkReg(req, res, next)) return;
    res.render('./pages/userAppeal', {
        sn,
    });
}

// 申诉
exports.snAppeal = async (req, res, next) => {
    const { unionid } = req.session;
    const { sn } = req.params;
    const { content } = req.body;
    if (!unionid) {
        res.send({ code: -1, msg: '非法用户' });
        return;
    }
    const result = await serviceProductUser.snAppeal({
        sn,
        content,
        unionid,
    });
    res.send(result);
}