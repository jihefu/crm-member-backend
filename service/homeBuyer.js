const Buyer = require('../dao').Buyer;
const VerUnit = require('../dao').VerUnit;
const Staff = require('../dao').Staff;
const sequelize = require('../dao').sequelize;
const common = require('./common');
const base = require('./base');
const serviceVerUnit = require('./homeVerUnit');

exports.getList = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.pageSize ? Number(params.pageSize) : 30;
    const keywords = params.keywords ? params.keywords : '';
    const result = await Buyer.findAndCountAll({
        where: {
            isdel: 0,
            company: { $like: '%'+keywords+'%' }
        },
        include: {
            model: VerUnit,
            association: Buyer.hasOne(VerUnit, {foreignKey:'user_id',sourceKey: 'user_id'}),
        },
        order: [[ 'user_id', 'DESC' ]],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    const staffMapper = new base.StaffMap().getStaffMap();
    // result.rows.forEach((items, index) => {
    for (let index = 0; index < result.rows.length; index++) {
        const items = result.rows[index];
        result.rows[index].dataValues.insert_person = staffMapper[items.dataValues.insert_person].user_name;
        result.rows[index].dataValues.update_person = staffMapper[items.dataValues.update_person].user_name;
        // result.rows[index].dataValues.main_contacts = await serviceVerUnit.getMainContacts({company: items.dataValues.company});
        // result.rows[index].dataValues.legal_person = items.dataValues.VerUnit.dataValues.legal_person;
        // result.rows[index].dataValues.tax_id = items.dataValues.VerUnit.dataValues.tax_id;
        // result.rows[index].dataValues.reg_addr = items.dataValues.VerUnit.dataValues.reg_addr;
        // result.rows[index].dataValues.reg_tel = items.dataValues.VerUnit.dataValues.reg_tel;
        // result.rows[index].dataValues.zip_code = items.dataValues.VerUnit.dataValues.zip_code;
        // result.rows[index].dataValues.province = items.dataValues.VerUnit.dataValues.province;
        // result.rows[index].dataValues.town = items.dataValues.VerUnit.dataValues.town;
        result.rows[index].dataValues.certified = items.dataValues.VerUnit.dataValues.certified;
    }
    // });
    const resDate = {
        id_arr: [],
        data: result.rows,
        total: result.count,
    };
    return {
        code: 200,
        msg: '查询成功',
        data: resDate,
    };
}

exports.getTarget = async params => {
    const { user_id } = params;
    const result = await Buyer.findOne({ 
        where: {
            isdel: 0,
            user_id,
        },
        include: {
            model: VerUnit,
            association: Buyer.hasOne(VerUnit, {foreignKey:'user_id',sourceKey: 'user_id'}),
        },
    });
    const staffMapper = new base.StaffMap().getStaffMap();
    result.dataValues.insert_person = staffMapper[result.dataValues.insert_person].user_name;
    result.dataValues.update_person = staffMapper[result.dataValues.update_person].user_name;
    // result.dataValues.main_contacts = await serviceVerUnit.getMainContacts({company: result.dataValues.company});
    // result.dataValues.legal_person = result.dataValues.VerUnit.dataValues.legal_person;
    // result.dataValues.tax_id = result.dataValues.VerUnit.dataValues.tax_id;
    // result.dataValues.reg_addr = result.dataValues.VerUnit.dataValues.reg_addr;
    // result.dataValues.reg_tel = result.dataValues.VerUnit.dataValues.reg_tel;
    // result.dataValues.zip_code = result.dataValues.VerUnit.dataValues.zip_code;
    // result.dataValues.province = result.dataValues.VerUnit.dataValues.province;
    // result.dataValues.town = result.dataValues.VerUnit.dataValues.town;
    result.dataValues.certified = result.dataValues.VerUnit.dataValues.certified;
    return {
        code: 200,
        msg: '查询成功',
        data: result,
    };
}

exports.update = async params => {
    const { certifiedPerson, admin_id, user_id, company } = params;
    // 检查本表公司名唯一
    if (await checkCompanyHasExist(company, user_id)) return {code: -1, msg: '该单位已存在'};
    // const staffRes = await Staff.findOne({ where: { isdel: 0, user_name: certifiedPerson } });
    // if (staffRes) params.certifiedPerson = staffRes.dataValues.user_id;
    delete params.insert_person;
    delete params.insert_time;
    params.update_person = admin_id;
    params.update_time = TIME();
    await Buyer.update(params, {
        where: { user_id },
    });
    return {
        code: 200,
        msg: '更新成功',
        data: [],
    };
}

exports.create = async params => {
    const { company, admin_id, town, province, legal_person } = params;
    // 检查本表公司名唯一
    if (await checkCompanyHasExist(company)) return {code: -1, msg: '该单位已存在'};
    // 检查在别的系统是否已存在该公司名，有的话直接使用他的user_id，否则自己创建user_id
    const resUnit = await serviceVerUnit.create({ company, admin_id, town, province, legal_person, sub_type: '供' });
    const { user_id } = resUnit.data;
    params.user_id = user_id;
    params.update_person = admin_id;
    params.insert_person = admin_id;
    params.update_time = TIME();
    params.insert_time = TIME();
    try {
        await Buyer.create(params);
    } catch (e) {
        await Buyer.destroy({
            force: true,
            where: { user_id },
        });
        await PublicRelationShip.create(params);
    }
    return {
        code: 200,
        msg: '新增成功',
        data: [],
    };
}

exports.destroy = async params => {
    const { user_id, admin_id } = params;
    await Buyer.update({
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
        sub_type: '供',
    });
    return {
        code: 200,
        msg: '删除成功',
        data: [],
    };
}

async function checkCompanyHasExist(company, user_id) {
    const where = { company, isdel: 0 };
    if (user_id) where.user_id = { $ne: user_id };
    const result = await Buyer.findOne({ where });
    if (result) return true;
    return false;
}