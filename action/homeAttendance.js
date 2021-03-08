const url = require('url');
const path = require('path');
const serviceHomeAttendance = require('../service/homeAttendance');
const base = require('../service/base');
var staff = require('../service/m_staff');

/**
 *  需要签到的日期列表
 */
this.dateList = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeAttendance.dateList(params,result => {
        res.send(result);
    });
}

/**
 *  新增需要签到的日期列表
 */
this.addDateList = (req,res,next) => {
    const params = req.body;
    serviceHomeAttendance.addDateList(params,result => {
        res.send(result);
    });
}

/**
 *  当天需要签到的人数（总）
 *  当前在岗的人数
 */
this.workingNum = (req,res,next) => {
    const form_data = url.parse(req.url,true).query;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.workingNum({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  判断当前访问者当天是否签到
 */
this.checkSign = (req,res,next) => {
    const form_data = url.parse(req.url,true).query;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkSign({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  签到 0 -> 1
 */
this.sign = (req,res,next) => {
    const form_data = url.parse(req.url,true).query;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkStatusSync({
        status: 0,
        date: DATETIME(),
        admin_id: admin_id
    },result => {
        if(result.code==200){
            serviceHomeAttendance.sign({
                form_data: form_data,
                admin_id: admin_id
            },result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 *  补签到的gps信息
 */
this.signGps = (req,res,next) => {
    const gps = req.body.gps;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.signGps({
        gps: gps,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  离岗 1 -> 0
 */
this.leave = (req,res,next) => {
    const form_data = url.parse(req.url,true).query;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkStatusSync({
        status: 1,
        date: DATETIME(),
        admin_id: admin_id
    },result => {
        if(result.code==200){
            serviceHomeAttendance.leave({
                form_data: form_data,
                admin_id: admin_id
            },result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 *  外出 1 -> 2
 */
this.goOut = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkStatusSync({
        status: 1,
        date: DATETIME(),
        admin_id: admin_id
    },result => {
        if(result.code==200){
            serviceHomeAttendance.goOut({
                form_data: form_data,
                admin_id: admin_id
            },result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 *  返岗 2 -> 1
 */
this.outBack = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkStatusSync({
        status: 2,
        date: DATETIME(),
        admin_id: admin_id
    },result => {
        if(result.code==200){
            serviceHomeAttendance.outBack({
                form_data: form_data,
                admin_id: admin_id
            },result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 *  返岗 2 -> 0
 */
this.outLeave = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkStatusSync({
        status: 2,
        date: DATETIME(),
        admin_id: admin_id
    },result => {
        if(result.code==200){
            serviceHomeAttendance.outLeave({
                form_data: form_data,
                admin_id: admin_id
            },result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 *  加班 3 -> 4
 */
this.overWork = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkStatusSync({
        status: 3,
        date: DATETIME(),
        admin_id: admin_id
    },result => {
        if(result.code==200){
            serviceHomeAttendance.overWork({
                form_data: form_data,
                admin_id: admin_id
            },result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 *  补加班的gps信息
 */
this.overWorkGps = (req,res,next) => {
    const on_gps = req.body.on_gps;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.overWorkGps({
        on_gps: on_gps,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  结束加班 4 -> 3
 */
this.endOverWork = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkStatusSync({
        status: 4,
        date: DATETIME(),
        admin_id: admin_id
    },result => {
        if(result.code==200){
            serviceHomeAttendance.endOverWork({
                form_data: form_data,
                admin_id: admin_id
            },result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 * 请假
 */
this.applyAbsence = (req, res, next) => {
    const params = req.body;
    serviceHomeAttendance.applyAbsence(params,result => {
        res.send(result);
    });
}

/**
 *  上传图片
 */
this.upload = (req,res,next) => {
	let mulUploadImg = new base.MulUploadImg('/public/img/overwork');
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
 *  获取指定月份的考勤数据
 */
this.getAllMonthData = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    const admin_id = req.session.admin_id;
    params.admin_id = params.admin_id?params.admin_id:admin_id;
    serviceHomeAttendance.getAllMonthData(params,result => {
        res.send(result);
    });
}

/**
 *  获取所有员工指定月份的考勤数据
 */
this.getAllStaffAllMonthData = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeAttendance.getAllStaffAllMonthData(params,result => {
        res.send(result);
    });
}

/**
 *  撤销签到
 */
this.recall = (req,res,next) => {
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkStatusSync({
        status: 1,
        date: DATETIME(),
        admin_id: admin_id
    },result => {
        if(result.code==200){
            serviceHomeAttendance.recall({
                admin_id: admin_id
            },result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 *  撤销加班
 */
this.recallOverWork = (req,res,next) => {
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkStatusSync({
        status: 4,
        date: DATETIME(),
        admin_id: admin_id
    },result => {
        if(result.code==200){
            serviceHomeAttendance.recallOverWork({
                admin_id: admin_id
            },result => {
                res.send(result);
            });
        }else{
            res.send(result);
        }
    });
}

/**
 *  获取指定月份的加班数据
 */
this.getOverWorkData = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeAttendance.getOverWorkData(params,result => {
        res.send(result);
    });
}

/**
 *  获取指定月份的director为我的加班数据
 */
this.directorGetOverWorkData = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeAttendance.directorGetOverWorkData(params,result => {
        res.send(result);
    });
}

/**
 *  获取目标加班条目
 */
this.targetOverWorkItem = (req,res,next) => {
    const id = req.params.id;
    serviceHomeAttendance.targetOverWorkItem({
        id: id
    },result => {
        res.send(result);
    });
}

/**
 *  更新加班单
 */
this.updateOverWork = (req,res,next) => {
    const params = JSON.parse(req.body.form_data);
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.updateOverWork({
        form_data: params,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 * 评分加班单
 */
this.rateOverWork = async (req, res, next) =>  {
    const params = req.body;
    const result = await serviceHomeAttendance.rateOverWork(params);
    res.send(result);
}

/**
 *  审核加班单
 */
this.checkOverWorkOrder = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeAttendance.checkOverWorkOrder({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  申请安卫值日
 */
this.applyDuty = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeAttendance.applyDuty(params,result => {
        res.send(result);
    });
}

/**
 *  取消申请安卫值日
 */
this.cancelApplyDuty = (req,res,next) => {
    const admin_id = req.session.admin_id
    serviceHomeAttendance.cancelApplyDuty({
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  申请客服值日
 */
this.applyCusDuty = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeAttendance.applyCusDuty(params,result => {
        res.send(result);
    });
}

/**
 *  取消申请客服值日
 */
this.cancelApplyCusDuty = (req,res,next) => {
    const admin_id = req.session.admin_id
    serviceHomeAttendance.cancelApplyCusDuty({
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  申请内勤值日
 */
this.applyInsideDuty = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeAttendance.applyInsideDuty(params,result => {
        res.send(result);
    });
}

/**
 *  取消申请内勤值日
 */
this.cancelInsideDuty = (req,res,next) => {
    const admin_id = req.session.admin_id
    serviceHomeAttendance.cancelInsideDuty({
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  来自App的安卫值日
 */
this.hybridSafeDuty = (req,res,next) => {
    const admin_id = req.session.admin_id;
    staff.safeDuty({
		admin_id: admin_id
	},result => {
		res.send(result);
	});
}

/**
 *  来自App的客服值日
 */
this.hybridCusDuty = (req,res,next) => {
    const admin_id = req.session.admin_id;
    staff.cusDuty({
		admin_id: admin_id
	},result => {
		res.send(result);
	});
}

/**
 *  来自App的内勤值日
 */
this.hybridInsideDuty = (req,res,next) => {
    const admin_id = req.session.admin_id;
    staff.insideDuty({
		admin_id: admin_id
	},result => {
		res.send(result);
	});
}

/**
 *  在线使用情况统计
 */
this.onlineAssessment = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeAttendance.onlineAssessment(params,result => {
        res.send(result);
    });
}

this.getHasMobileStaffArr = (req,res,next) => {
    res.send(CONFIG.hasMobileStaffArr);
}

/**指定类型，时间段，人的事件 */
this.getTargetEvent = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    serviceHomeAttendance.getTargetEvent(params,result => {
        res.send(result);
    });
}