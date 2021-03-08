const VehicleRegist = require('../dao').VehicleRegist;
const base = require('./base');
const moment = require('moment');
const sequelize = require('../dao').sequelize;

/**
 * 获取车辆使用列表
 */
exports.getList = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.num ? Number(params.num) : 10;
    const keywords = params.keywords ? params.keywords : '';
    const filter = params.filter ? JSON.parse(params.filter) : {};
    const { userName, carNo, take_time } = filter;
    const staffMapper = new base.StaffMap().getStaffMap();
    let userNameArr = [], userIdArr = [], carNoArr = [];
    try {
        userNameArr = userName.split(',').filter(items => items);
    } catch (e) {
        userNameArr = [];
    }
    for (let i = 0; i < userNameArr.length; i++) {
        for (const user_id in staffMapper) {
            if (userNameArr[i] === staffMapper[user_id].user_name) {
                userIdArr.push(user_id);
            }
        }
    }
    try {
        carNoArr = carNo.split(',').filter(items => items);
    } catch (e) {
        carNoArr = [];
    }
    const where = { isdel: 0, reason: { $like: '%'+keywords+'%' } };
    if (userIdArr.length !== 0) {
        where.user_id = { $in: userIdArr };
    }
    if (carNoArr.length !== 0) {
        where.car_no = { $in: carNoArr };
    }
    if (take_time) {
        const start_time = moment(take_time[0]).format('YYYY-MM-DD') + ' 00:00:00';
        const end_time = moment(take_time[1]).format('YYYY-MM-DD') + ' 23:59:59';
        where.take_time = { $between: [start_time, end_time] };
    }
    const result = await VehicleRegist.findAndCountAll({
        where,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: [['id', 'DESC']],
    });
    const sumResult = await VehicleRegist.findOne({
        attributes: [[sequelize.fn('SUM', sequelize.col('use_mile')), 'totalMile']],
        where,
    });
    const { totalMile } = sumResult.dataValues;
    result.rows.forEach((items, index) => {
        try {
            result.rows[index].dataValues.user_name = staffMapper[items.dataValues.user_id].user_name;
        } catch (e) {
            result.rows[index].dataValues.user_name = '';   
        }
    });
    return {
        code: 200,
        msg: '',
        data: {
            data: result.rows,
            total: result.count,
            id_arr: [],
            totalMile,
        },
    };
}

/**
 * 根据id获取
 */
exports.getRecordById = async params => {
    const { id } = params;
    const staffMapper = new base.StaffMap().getStaffMap();
    const vehicleRegistEntity = await VehicleRegist.findOne({ where: { id } });
    vehicleRegistEntity.dataValues.user_name = staffMapper[vehicleRegistEntity.dataValues.user_id].user_name;
    return { code: 200, msg: '', data: vehicleRegistEntity };
}

/**
 * 获取上次用车结束的里程
 */
exports.getPrevMile = async params => {
    const { car_no } = params;
    const prevEntity = await VehicleRegist.findOne({ where: { car_no, isdel: 0 }, order: [['id', 'DESC']] });
    let prevMile = 0;
    if (prevEntity) {
        prevMile = prevEntity.dataValues.back_mile;
    }
    return { code: 200, msg: '', data: prevMile };
}

/**
 * 新增
 */
exports.create = async params => {
    const { car_no, take_time, take_mile, admin_id } = params;
    await VehicleRegist.create({
        car_no,
        user_id: admin_id,
        take_time,
        take_mile,
        create_time: TIME(),
        update_time: TIME(),
    });
    return { code: 200, msg: '创建成功' };
}

/**
 * 删除
 */
exports.del = async params => {
    const { id, admin_id } = params;
    const vehicleRegistEntity = await VehicleRegist.findOne({ where: { id } });
    if (vehicleRegistEntity && vehicleRegistEntity.dataValues.user_id == admin_id) {
        await VehicleRegist.update({ isdel: 1, update_time: TIME() }, { where: { id } });
        return { code: 200, msg: '删除成功' };
    }
    return { code: -1, msg: '无法删除' };
}

/**
 * 更新
 */
exports.update = async params => {
    const { take_mile, take_time, back_mile, back_time, reason, id, admin_id } = params;
    const vehicleRegistEntity = await VehicleRegist.findOne({ where: { id } });
    if (vehicleRegistEntity && vehicleRegistEntity.dataValues.user_id == admin_id) {
        // const { take_mile } = vehicleRegistEntity.dataValues;
        const use_mile = Number(back_mile) - Number(take_mile);
        await VehicleRegist.update({
            take_mile,
            take_time,
            back_mile,
            back_time,
            use_mile,
            reason,
            update_time: TIME(),
        }, { where: { id } });
        return { code: 200, msg: '更新成功' };
    }
    return { code: -1, msg: '无法操作' };
}

/**
 * 更新照片
 */
exports.updateAlbum = async params => {
    const { album: newAlbum, id } = params;
    const vehicleRegistEntity = await VehicleRegist.findOne({ where: { id } });
    const { album } = vehicleRegistEntity.dataValues;
    let albumArr;
    try {
        albumArr = album.split(',').filter(items => items);
    } catch (e) {
        albumArr = [];
    }
    if (albumArr.includes(newAlbum)) {
        albumArr = albumArr.filter(items => items != newAlbum);
    } else {
        albumArr.push(newAlbum);
    }
    await VehicleRegist.update({ update_time: TIME(), album: albumArr.join() }, { where: { id } });
    return { code: 200, msg: '更新成功' };
}