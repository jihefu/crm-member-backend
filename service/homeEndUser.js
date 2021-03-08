const EndUser = require('../dao').EndUser;
const Staff = require('../dao').Staff;
const sequelize = require('../dao').sequelize;
const common = require('./common');
const base = require('./base');
const VerUnit = require('../dao').VerUnit;
const serviceVerUnit = require('./homeVerUnit');

exports.getList = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const keywords = params.keywords ? params.keywords : '';
    const result = await EndUser.findAndCountAll({
        where: {
            isdel: 0,
            $or: {
                user_name: {
                    $like: '%'+keywords+'%',
                },
            },
        },
        include: {
            model: VerUnit,
            association: EndUser.hasOne(VerUnit, {foreignKey:'user_id',sourceKey: 'user_id'}),
        },
        order: [[ 'user_id', 'DESC' ]],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    const staffMapper = new base.StaffMap().getStaffMap();
    for (let index = 0; index < result.rows.length; index++) {
        const items = result.rows[index];
        result.rows[index].dataValues.insert_person = staffMapper[items.dataValues.insert_person].user_name;
        result.rows[index].dataValues.update_person = staffMapper[items.dataValues.update_person].user_name;
        // result.rows[index].dataValues.main_contacts = await serviceVerUnit.getMainContacts({company: items.dataValues.user_name});
        result.rows[index].dataValues.certified = items.dataValues.VerUnit.dataValues.certified;
    }
    const resDate = {
        id_arr: [],
        data: result.rows,
        total: result.count,
    };
    result.id_arr = [];
    return {
        code: 200,
        msg: '查询成功',
        data: resDate,
    };
}

exports.getTarget = async params => {
    const { user_id } = params;
    const result = await EndUser.findOne({
        where: {
            isdel: 0,
            user_id,
        },
        include: {
            model: VerUnit,
            association: EndUser.hasOne(VerUnit, {foreignKey:'user_id',sourceKey: 'user_id'}),
        },
    });
    const staffMapper = new base.StaffMap().getStaffMap();
    result.dataValues.insert_person = staffMapper[result.dataValues.insert_person].user_name;
    result.dataValues.update_person = staffMapper[result.dataValues.update_person].user_name;
    // result.dataValues.main_contacts = await serviceVerUnit.getMainContacts({company: result.dataValues.user_name});
    result.dataValues.certified = result.dataValues.VerUnit.dataValues.certified;
    return {
        code: 200,
        msg: '查询成功',
        data: result,
    };
}

exports.update = async params => {
    const { certifiedPerson, admin_id, user_id, user_name } = params;
    // 检查本表公司名唯一
    if (await checkCompanyHasExist(user_name, user_id)) return {code: -1, msg: '该单位已存在'};
    // const staffRes = await Staff.findOne({ where: { isdel: 0, user_name: certifiedPerson } });
    // if (staffRes) params.certifiedPerson = staffRes.dataValues.user_id;
    delete params.insert_person;
    delete params.insert_time;
    params.update_person = admin_id;
    params.update_time = TIME();
    await EndUser.update(params, {
        where: { user_id },
    });
    return {
        code: 200,
        msg: '更新成功',
        data: [],
    };
}

exports.create = async params => {
    const { user_name, admin_id, town, province } = params;
    // 检查本表公司名唯一
    if (await checkCompanyHasExist(user_name)) return {code: -1, msg: '该单位已存在'};
    // 检查在别的系统是否已存在该公司名，有的话直接使用他的user_id，否则自己创建user_id
    // const user_id = await common.checkOtherSysExistCompany(user_name);
    const resUnit = await serviceVerUnit.create({ company: user_name, admin_id, town, province, sub_type: '用' });
    const { user_id } = resUnit.data;
    params.user_id = user_id;
    params.update_person = admin_id;
    params.insert_person = admin_id;
    params.update_time = TIME();
    params.insert_time = TIME();
    try {
        await EndUser.create(params);
    } catch (e) {
        await EndUser.destroy({
            force: true,
            where: { user_id },
        });
        await EndUser.create(params);
    }
    return {
        code: 200,
        msg: '新增成功',
        data: [],
    };
}

exports.destroy = async params => {
    const { user_id, admin_id } = params;
    await EndUser.update({
        update_time: TIME(),
        update_person: admin_id,
        isdel: 1,
    }, {
        where: {
            user_id,
        },
    });
    await serviceVerUnit.updateSubType({
        user_id,
        admin_id,
        sub_type: '用',
    });
    return {
        code: 200,
        msg: '删除成功',
        data: [],
    };
}

async function checkCompanyHasExist(user_name, user_id) {
    const where = { user_name, isdel: 0 };
    if (user_id) where.user_id = { $ne: user_id };
    const result = await EndUser.findOne({ where });
    if (result) return true;
    return false;
}