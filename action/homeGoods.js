const url = require('url');
const path = require('path');
const serviceHomeGoods = require('../service/homeGoods');
const base = require('../service/base');

this.targetItem = (req,res,next) => {
    let { numbering } = req.params;
    numbering = numbering.toUpperCase();
    const { admin_id } = req.session;
    serviceHomeGoods.targetItem({
        numbering,
        admin_id,
    },result => {
        if(result.code==200){
            let recordId,location,type,borrowExpectTime;
            try{
                recordId = result.data.data.dataValues.events[0].dataValues.id;
                location = result.data.data.dataValues.events[0].dataValues.content.borrowLocation;
                type = result.data.data.dataValues.events[0].dataValues.content.borrowType;
                borrowExpectTime = result.data.data.dataValues.events[0].dataValues.content.borrowExpectTime;
            }catch(e){
                
            }
            result.data.data.dataValues.location = location;
            result.data.data.dataValues.type = type;
            result.data.data.dataValues.borrowExpectTime = borrowExpectTime ? DATETIME(borrowExpectTime) : null;
            // delete result.data.data.dataValues.goodsBorrowRecords;
            const staffArr = [];
            if (result.data.isNew) {
                const staffMapper = new base.StaffMap().getStaffMap();
                for (const user_id in staffMapper) {
                    if (staffMapper[user_id].on_job == 1 && user_id != admin_id) {
                        staffArr.push({ user_id, user_name: staffMapper[user_id].user_name });
                    }
                }
            }
            res.render('./pages/goods', {
                result: result.data.data,
                goodsName: result.data.data.goodsName,
                showCode: result.data.showCode,
                _user: result.data.data.user,
                recordId,
                isNew: result.data.isNew,
                staffArr,
            });
        }else{
            res.render('./pages/tip',{
                tip: result.msg
            });
        }
    });
}

/**
 *  物品列表
 */
this.list = (req,res,next) => {
    let params = url.parse(req.url,true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeGoods.list(params,result => {
        res.send(result);
    });
}

/**
 * 新增时直接触发借用
 */
exports.directBorrow = async (req, res, next) => {
    const { admin_id } = req.session;
    const params = req.body;
    params.admin_id = admin_id;
    const result = await serviceHomeGoods.directBorrow(params);
    res.send(result);
}

/**
 *  指定id物品
 */
this.getTargetItem = (req,res,next) => {
    let targetKey = req.params.targetKey;
    serviceHomeGoods.getTargetItem({
        targetKey: targetKey
    },result => {
        res.send(result);
    });
}

/**
 * 获取指定类型的物品个数和总价
 */
this.getGoodsNumAndAmount = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeGoods.getGoodsNumAndAmount(params,result => {
        res.send(result);
    });
}

/**
 * 借用记录
 */
this.borrowHistory = (req,res,next) => {
    const { numbering } = req.params;
    serviceHomeGoods.borrowHistory({
        numbering: numbering
    },result => {
        const resArr = result.data.map(items => items.dataValues);
        res.render('./pages/goodsBorrowHistory', {
            data: resArr
        });
    });
}

/**
 *  更新
 */
this.update = (req,res,next) => {
    let form_data = req.body.form_data;
    let admin_id = req.session.admin_id;
    serviceHomeGoods.update({
        formData: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  出库
 */
this.del = (req,res,next) => {
    const { id, delRem } = req.body;
    const { admin_id } = req.session;
    serviceHomeGoods.del({
        id: id,
        delRem,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 * 不同意出库
 */
this.cancelDealDel = (req,res,next) => {
    const { id } = req.body;
    const { admin_id } = req.session;
    serviceHomeGoods.cancelDealDel({
        id: id,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  图片上传
 */
this.upload = (req,res,next) => {
	let mulUploadImg = new base.MulUploadImg('/public/img/goods');
	mulUploadImg.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
        });
        mulUploadImg.resize();
        mulUploadImg.smallSize();
	});
}

/**
 * 更新照片字段
 */
this.updateAlbum = (req,res,next) => {
    const form_data = req.body;
    form_data.admin_id = req.session.admin_id;
    serviceHomeGoods.updateAlbum(form_data,result => {
        res.send(result);
    });
}

/**
 *  申请借用
 */
this.applyBorrow = (req,res,next) => {
    const form_data = req.body;
    form_data.admin_id = req.session.admin_id;
    serviceHomeGoods.applyBorrow(form_data,result => {
        res.send(result);
    });
}

/**
 *  批准借用
 */
this.agreeBorrow = (req,res,next) => {
    const form_data = req.body;
    form_data.admin_id = req.session.admin_id;
    serviceHomeGoods.agreeBorrow(form_data,result => {
        res.send(result);
    });
}

/**
 *  不批准借用
 */
this.notAggreBorrow = (req,res,next) => {
    const form_data = req.body;
    form_data.admin_id = req.session.admin_id;
    serviceHomeGoods.notAggreBorrow(form_data,result => {
        res.send(result);
    });
}

/**
 *  申请归还
 */
this.applyBack = (req,res,next) => {
    const form_data = req.body;
    form_data.admin_id = req.session.admin_id;
    serviceHomeGoods.applyBack(form_data,result => {
        res.send(result);
    });
}

/**
 *  同意归还
 */
this.aggreBack = (req,res,next) => {
    const form_data = req.body;
    form_data.admin_id = req.session.admin_id;
    serviceHomeGoods.aggreBack(form_data,result => {
        res.send(result);
    });
}

/**
 *  模糊搜索员工
 */
this.searchStaff = (req,res,next) => {
    let params = url.parse(req.url,true).query;
    serviceHomeGoods.searchStaff({
        params: params
    },result => {
        res.send(result);
    });
}

/**
 * 照片编辑界面
 */
this.photoEdit = (req,res,next) => {
    const { numbering } = url.parse(req.url,true).query;
    serviceHomeGoods.photoEdit({
        numbering
    },result => {
        if(result.code==200){
            let albumArr;
            try{
                albumArr = result.data.album.split(',').filter(items => items);
            }catch(e){
                albumArr = [];
            }
            res.render('./pages/goodsPhotoEdit',{
                albumArr,
                id: result.data.id,
                numbering: result.data.numbering,
            });
        }else{
            res.render('./pages/tip',{
                tip: result.msg
            });
        }
    });
}

/**
 * 申请出库
 */
this.applyDel = (req,res,next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeGoods.applyDel(params,result => {
        res.send(result);
    });
}

/**
 * 编辑存放点，责任类型，借用截止期页面
 */
this.editBorrow = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeGoods.editBorrow(params,result => {
        res.render('./pages/goodsBorrowEdit',{
            data: result.data,
            numbering: params.numbering
        });
    });
}

/**
 * 提交编辑存放点，责任类型，借用截止期
 */
this.updateEditBorrow = (req,res,next) => {
    const params = req.body;
    serviceHomeGoods.updateEditBorrow(params,result => {
        res.send(result);
    });
}

/**
 *  获取图片拍摄时间
 */
this.getPhotoInfo = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeGoods.getPhotoInfo(params,result => {
        res.render('./pages/goodsPhotoInfo',{
            data: result.data
        });
    });
}

/**
 * 添加主体id
 */
this.addMainId = (req,res,next) => {
    const params = req.body;
    serviceHomeGoods.addMainId(params,result => {
        res.send(result);
    });
}

/**
 * 移除主体id
 */
this.removeMainId = (req,res,next) => {
    const params = req.body;
    serviceHomeGoods.removeMainId(params,result => {
        res.send(result);
    });
}

/**
 * 下载本月未拍照的物品
 */
this.downloadNotUpdateImg = (req, res, next) => {
    serviceHomeGoods.downloadNotUpdateImg({}, result => {
        res.send(result);
    });
}