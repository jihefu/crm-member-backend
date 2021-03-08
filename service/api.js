const Products = require('../dao').Products;
const RegEvent = require('../dao').RegEvent;
// const testService = require('./rpcMemberService');

/**
 * 生成异常对象
 * 工厂模式
 */
const createError = (obj) => {
    const error =  new Error(obj.msg);
    error.code = obj.code;
    return error;
}

/**
 * 异常返回处理
 * @param {object} e 
 */
const responseError = (e) => {
    if(!e.code) e.code = -1;
    if(!e.data) e.data = [];
    if(e.code==-1) LOG(e);
    return {
        code: e.code,
        msg: e.message,
        data: e.data
    };
}

/**
 * 异常map
 */
const errorMapper = {
    notExist: {
        code: -21001,
        msg: '该卡不存在',
    },
};

/**
 * 查询威程卡注册信息
 */
// exports.regInfo = async (params, cb) => {
//     const result = await testService.getMemberInfo({ unionid: 'oathZ1BPzdeHw2a54gl59NVq5b6c' });
//     console.log(result);
//     cb(result);
    // const { sn } = params;
    // Products.findOne({
    //     where: {
    //         isdel: 0,
    //         serialNo: sn,
    //     },
    // }).then(result => {
    //     if (!result) throw createError(errorMapper.notExist);
    //     return RegEvent.findAll({
    //         where: {
    //             sn,
    //         },
    //         order: [[ 'id', 'DESC' ]],
    //     }).then(result => {
    //         const resArr = result.map(items => {
    //             return {
    //                 sn: items.dataValues.sn,
    //                 mid: items.dataValues.mid,
    //                 regCode: items.dataValues.regCode,
    //                 authOperKey: items.dataValues.authOperKey,
    //                 validDate: items.dataValues.validDate,
    //                 regDate: items.dataValues.regDate,
    //             };
    //         });
    //         cb({
    //             code: 200,
    //             msg: '查询成功',
    //             data: resArr,
    //         });
    //     }).catch(e => { throw e });
    // }).catch(e => cb(responseError(e)));
// }