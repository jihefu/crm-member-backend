const common = require('./common');
// const Staff = require('../dao').Staff;
const sequelize = require('../dao').sequelize;
const BaseMsg = require('../dao').BaseMsg;
const CallMsg = require('../dao').CallMsg;
const hybridApp = require('./hybrid_app');

const serviceHomeSatff = require('./homeStaff');
const serviceHomeMember = require('./homeMember');
const base = require('./base');

/**
 *  联系单列表
 */
this.list = (params,cb) => {
    const admin_id = params.admin_id;
    params = params.params;
    let num = params.num?parseInt(params.num):30;
	let page = params.page?parseInt(params.page):1;
    let keywords = params.keywords?params.keywords:'';
    let order = params.order?params.order:'id';
    let filter = typeof(params.filter)=='object'?params.filter:JSON.parse(params.filter);
    let staffFilter = filter.staff.split(',').filter(items => items);
    let stateFilter = filter.state.split(',').filter(items => items);
    let timeFilter = filter.incoming_time;
    let markOrder;
    let andCondition = {
		isdel: 0
    };
    if(timeFilter=='近一个月') {
        andCondition.incoming_time = {
            '$gt': DATETIME(Date.now()-60*60*1000*24*30)
        };
    }else if(timeFilter=='近三个月'){
        andCondition.incoming_time = {
            '$gt': DATETIME(Date.now()-60*60*1000*24*30*3)
        };
    }
    serviceHomeSatff.staffAll({},result => {
        const staffMapper = {};
        result.data.forEach((items,index) => {
            staffMapper[items.user_name] = items.user_id;
        });
        staffFilter.forEach((items,index) => {
            staffFilter[index] = staffMapper[items];
        });
        if(staffFilter.length!=0) andCondition.staff = {'$in': staffFilter};
        if(stateFilter.length!=0) andCondition.state = {'$in': stateFilter};

        common.infoMark({
            type: 'contact_message'
        },resObj => {
            let { str,id_arr } = resObj;
            str = str.replace(/contact_message./ig,'');
            if(str){
                markOrder =	[[sequelize.literal('if('+str+',0,1)')],['incoming_time','DESC']];
            }else{
                markOrder =	[['incoming_time','DESC']];
            }
            BaseMsg.findAndCountAll({
                where: {
                    '$or': {
                        contact_name: {
                            '$like': '%'+keywords+'%'
                        },
                        contact_phone: {
                            '$like': '%'+keywords+'%'
                        },
                        contact_unit: {
                            '$like': '%'+keywords+'%'
                        },
                        tags: {
                            '$like': '%'+keywords+'%'
                        }
                    },
                    '$and': andCondition
                },
                order: markOrder,
                offset: (page-1)*num,
                limit: num
            }).then(result => {
                const staffMap = new base.StaffMap().getStaffMap();
                result.rows.forEach((items,index) => {
                    try{
                        result.rows[index].dataValues.staff = staffMap[result.rows[index].dataValues.staff].user_name;
                    }catch(e){
    
                    }
                });
                for (let i = 0; i < id_arr.length; i++) {
                    for (let j = 0; j < result.rows.length; j++) {
                        if(id_arr[i]==result.rows[j].id){
                            break;
                        }else if(id_arr[i]!=result.rows[j].id&&j==result.rows.length-1){
                            id_arr.splice(i,1);
                            i--;
                        }
                    }
                }
                cb({
                    code: 200,
                    msg: '',
                    data: {
                        total: result.count,
                        data: result.rows,
                        id_arr: id_arr
                    }
                });
            }).catch(e => LOG(e));
        });
    });
    return;

    const sqlFun = (obj) => {
        const { user_id,attr,order,limit,filter } = obj;
        let complete;
        if(completeArr.length==0||completeArr.length==2){
            complete = '(0,1)';
        }else if(completeArr[0]=='已完成'){
            complete = '(1)';
        }else{
            complete = '(0)';
        }
        let sqlStr = 'SELECT '+attr+' FROM call_message LEFT JOIN contact_message ON contact_message.id = call_message.base_msg_id '+
                     'WHERE contact_message.isdel = 0 AND contact_message.staff in ('+user_id+') AND contact_message.complete IN '+complete+' AND (contact_message.contact_name LIKE "%'+keywords+'%" '+ 
                     'OR contact_message.contact_unit LIKE "%'+keywords+'%" OR contact_message.tags LIKE "%'+keywords+'%" '+
                     'OR call_message.contact_phone LIKE "%'+keywords+'%")'+order+limit;
        return sqlStr;
    }

    const orderFun = (str) => {
        let m_str = 'ORDER BY ';
        if(order=='id'){
            order = ' contact_message.id DESC';
        }
        if(str){
            order = ' if('+str+',0,1), ' + order;
        }
        return m_str + order;
    }

    const limitFun = () => {
        return ' LIMIT '+(page-1)*num+','+num;
    }

    const getUserId = (cb) => {
        if(!self){
            serviceHomeSatff.orderParamsList({isdel: 0},result => {
                let str = '';
                result.data.forEach(items => {
                    str += items.dataValues.user_id + ',';
                });
                str = str.slice(0,str.length-1);
                cb(str);
            });
        }else{
            cb(admin_id);
        }
    }

    const getRes = (sqlOrder,cb) => {
        getUserId(user_id => {
            let _p = [];
            _p[0] = new Promise((resolve,reject) => {
                sequelize.query(sqlFun({
                    attr: '*',
                    user_id: user_id,
                    order: sqlOrder,
                    limit: limitFun(),
                    filter: filter
                }),{model: BaseMsg}).then(function(result){
                    var res_arr = [];
                    result.forEach(function(items,index){
                        res_arr.push(items.dataValues);
                    });
                    resolve(res_arr);
                }).catch(function(e){
                    LOG(e);
                });
            });
            _p[1] = new Promise((resolve,reject) => {
                sequelize.query(sqlFun({
                    attr: 'count(*) AS count',
                    user_id: user_id,
                    order: '',
                    limit: '',
                    filter: filter
                }),{model: BaseMsg}).then(function(result){
                    resolve(result[0].dataValues.count);
                }).catch(function(e){
                    LOG(e);
                });
            });
            Promise.all(_p).then(result => {
                cb({
                    data: result[0],
                    total: result[1]
                });
            }).catch(e => LOG(e));
        });
    }

    const trans = (resObj,cb) => {
        let { data } = resObj;
        const _p = [],in_p = [];
        data.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                in_p[0] = new Promise((resolve,reject) => {
                    let i = index;
                    common.idTransToName({
                        user_id: items.staff
                    },user_name => {
                        data[i].staff = user_name;
                        resolve();
                    });
                });
                Promise.all(in_p).then(() => resolve()).catch(e => LOG(e));
            });
        });
        Promise.all(_p).then(() => cb()).catch(e => LOG(e));
    }

    common.infoMark({
        type: 'contact_message'
    },resObj => {
        const { str,id_arr } = resObj;
        const sqlOrder = orderFun(str);

        getRes(sqlOrder,resObj => {
            const res_arr = resObj.data;
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
            resObj.id_arr = id_arr;
            trans(resObj,() => {
                const _p = [];
                resObj.data.forEach((items,index) => {
                    _p[index] = new Promise((resolve,reject) => {
                        const { contact_name,contact_unit } = items;
                        const i = index;
                        //判断是会员还是认证联系人
                        serviceHomeMember.checkContactType({
                            company: contact_unit,
                            name: contact_name
                        },type => {
                            resObj.data[i].contact_type = type;
                            resolve();
                        });
                    });
                });
                Promise.all(_p).then(() => {
                    cb({
                        code: 200,
                        msg: '',
                        data: resObj
                    });
                }).catch(e => LOG(e));
            });
        });
    });
}

/**
 *  更新联系单
 */
this.update = (params,cb) => {
    let { form_data,admin_id } = params;
    form_data = typeof(form_data)=='object'?form_data:JSON.parse(form_data);
    const body = {};
    for(let key in form_data){
        body[key] = {};
        body[key]['model'] = form_data[key];
    }
    hybridApp.orderUpdate({
        body,
        admin_id: admin_id
    },result => {
        cb({
            code: 200,
            msg: '提交成功',
            data: []
        });
    });
}

/**
 *  获取在线信息
 */
this.getUserStatusInfo = (params,cb) => {
    hybridApp.getUserStatusInfo(params,result => cb(result));
}

/**
 *  BaseMsg开放搜索条件
 */
this.baseMsgOrderParamsList = (params,cb) => {
    BaseMsg.findAll({
        where: params
    }).then((result) => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    }).catch(e => LOG(e));
}

/**
 *  BaseMsg开放更新条件
 */
this.baseMsgOrderParamsUpdate = (params,cb) => {
    const { form_data,where } = params;
    BaseMsg.update(form_data,where).then((result) => {
        cb({
            code: 200,
            msg: '更新成功',
            data: []
        });
    }).catch(e => LOG(e));
}

/**
 *  获取标签
 */
this.getTags = (cb) => {
    hybridApp.getTags(result => {
        cb({
            code: 200,
            msg: '',
            data: result
        });
    });
}

/************************* @override *************************/

/**
 *  联系单列表
 */
// this.list = (params,cb) => {
//     const admin_id = params.admin_id;
//     params = params.params;
//     let num = params.num?parseInt(params.num):30;
// 	let page = params.page?parseInt(params.page):1;
//     let keywords = params.keywords?params.keywords:'';
//     let order = params.order?params.order:'id';
//     order = [order,'DESC'];
//     let where = {
//         isdel: 0,
//         '$or': [
//             sequelize.where(sequelize.col('BaseMsg.contact_name'), { '$like': '%'+keywords+'%'}),
//             sequelize.where(sequelize.col('BaseMsg.contact_unit'), { '$like': '%'+keywords+'%'}),
//             sequelize.where(sequelize.col('BaseMsg.content'), { '$like': '%'+keywords+'%'}),
//             sequelize.where(sequelize.col('BaseMsg.staff'), { '$like': '%'+keywords+'%'}),
//             // sequelize.where(sequelize.col('CallMsgs.contact_phone'), { '$like': '%'+keywords+'%'})
//         ]
//     };
//     let markOrder;
// 	common.infoMark({
// 		type: 'contact_message'
// 	},resObj => {
// 		const { str,id_arr } = resObj;
// 		if(str){
// 			markOrder =	[[sequelize.literal('if('+str+',0,1)')],order];
// 		}else{
// 			markOrder =	[order];
//         }
//         BaseMsg.findAndCountAll({
//             include: [CallMsg],
//             where: where,
//             limit: num,
//             offset: (page-1)*num,
//             order: markOrder
//         }).then(result => {
//             let res_arr = result.rows;
//             let count = result.count;
//             for (let i = 0; i < id_arr.length; i++) {
//                 for (let j = 0; j < res_arr.length; j++) {
//                     if(id_arr[i]==res_arr[j].id){
//                         break;
//                     }else if(id_arr[i]!=res_arr[j].id&&j==res_arr.length-1){
//                         id_arr.splice(i,1);
//                         i--;
//                     }
//                 }
//             }
//             result.id_arr = id_arr;
//             cb({
//                 code: 200,
//                 msg: '',
//                 result: {
//                     total: count,
//                     id_arr: id_arr,
//                     data: res_arr
//                 }
//             });
//         }).catch(e => {
//             LOG(e);
//             cb({
//                 code: -1,
//                 msg: '内部错误',
//                 data: []
//             });
//         });
//     });
// }