const base = require('./base');
const serviceHomeLogin = require('./homeLogin');
const Customers = require('../dao').Customers;
const Staff = require('../dao').Staff;
let callInIo;
const SOCKET = {};

/**
 *  客户端登陆
 */
this.login = async (socket,io,params,cb) => {
    callInIo = io;
    const { token } = params;
    const tokenRes = await serviceHomeLogin.openCheckToken({
        token,
    });
    try {
        const user_id = tokenRes.data.userId;
        SOCKET[user_id] = socket;
        cb(user_id);
    } catch (e) {
        
    }
}

/**
 *  来电提醒
 */
this.callIn = (params) => {
    const { user_id,user_name,phone,time } = params;
    return;
    try{
        SOCKET[user_id].emit('CallIn',params);
    }catch(e){

    }
    try{
        SOCKET['1702'].emit('CallIn',params);
    }catch(e){

    }
}

/**
 *  维修流程变动
 */
this.changeRepairState = async params => {
    const presentListener = params.update_person;
    let listener = ['401','1006','1401','1101','1305'];
    // 加入业务员
    const { cust_name } = params.dataValues;
    const customerEntity = await Customers.findOne({ where: { cn_abb: cust_name, isdel: 0 } });
    if (customerEntity) {
        const { manager } = customerEntity.dataValues;
        const staffEntity = await Staff.findOne({ where: { user_name: manager, isdel: 0, on_job: 1 } });
        if (staffEntity) {
            listener.push(String(staffEntity.dataValues.user_id));
        }
    }
    listener = [... new Set(listener)];
    listener.forEach((items,index) => {
        if(items!=presentListener){
            try{
                SOCKET[items].emit('RepairChange',params);
            }catch(e){
                
            }
        }
    });
    try{
        SOCKET['1702'].emit('RepairChange',params);
    }catch(e){
        
    }
}