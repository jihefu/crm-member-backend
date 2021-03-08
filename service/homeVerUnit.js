const VerUnit = require('../dao').VerUnit;
const Staff = require('../dao').Staff;
const Contacts = require('../dao').Contacts;
const Member = require('../dao').Member;
const sequelize = require('../dao').sequelize;
const Customers = require('../dao').Customers;
const BaseMsg = require('../dao').BaseMsg;
const common = require('./common');
const base = require('./base');
const VerUnitTel = require('../dao').VerUnitTel;
const VerContacts = require('../dao').VerContacts;
const MeetMsg = require('../dao').MeetMsg;
const OtherMsg = require('../dao').OtherMsg;
const OnlineContactsInfo = require('../dao').OnlineContactsInfo;
const homeBusinessTrip = require('./homeBusinessTrip');

exports.getList = async params => {
    const page = params.page ? Number(params.page) : 1;
    const pageSize = params.num ? Number(params.num) : 30;
    const keywords = params.keywords ? params.keywords : '';
    const filter = params.filter ? JSON.parse(params.filter) : {};
    const order = params.order ? params.order : 'id';
    const where = {
        isdel: 0,
        $or: { 
            company: { $like: '%'+keywords+'%' },
            province: { $like: '%'+keywords+'%' },
            town: { $like: '%'+keywords+'%' }
        },
    };
    const { certified } = filter;
    const certifiedArr = [];
    if (certified.indexOf('待认证') !== -1) certifiedArr.push(0);
    if (certified.indexOf('已认证') !== -1) certifiedArr.push(1);
    if (certified.indexOf('未通过') !== -1) certifiedArr.push(2);
    if (certifiedArr.length !== 0 ) where.certified = {$in: certifiedArr};
    const findOption = {
        where,
        order: [[ 'user_id', 'DESC' ]],
    };
    if (order === 'id') {
        findOption.limit = pageSize;
        findOption.offset = (page - 1) * pageSize;
    }
    let result = await VerUnit.findAndCountAll(findOption);
    // 注入联系单参数
    await sortByOrders(result);
    const staffMapper = new base.StaffMap().getStaffMap();
    const verUnitTel = await VerUnitTel.findAll({ where: { isdel: 0 } });
    const verUnitTelMapper = {};
    verUnitTel.forEach(items => {
        if (!verUnitTelMapper[items.dataValues.ver_unit_id]) verUnitTelMapper[items.dataValues.ver_unit_id] = [];
        verUnitTelMapper[items.dataValues.ver_unit_id].push({
            name: items.dataValues.name,
            tel: items.dataValues.tel,
        });
    });
    for (let index = 0; index < result.rows.length; index++) {
        const items = result.rows[index];
        result.rows[index].dataValues.update_person = staffMapper[items.dataValues.update_person].user_name;
        result.rows[index].dataValues.mainContacts = await this.getMainContacts({ company: items.dataValues.company });
        result.rows[index].dataValues.telArr = verUnitTelMapper[items.dataValues.user_id] ? verUnitTelMapper[items.dataValues.user_id] : [];
        try {
            result.rows[index].dataValues.certifiedPerson = staffMapper[items.dataValues.certifiedPerson].user_name;
        } catch (e) {
            
        }
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

    async function sortByOrders(result) {
        const contactOrderArr = [];
        const _p = [];
        _p[0] = new Promise(async resolve => {
            const result = await BaseMsg.findAll({ attributes: [ 'contact_unit', 'incoming_time' ], where: { isdel: 0 } });
            result.forEach(items => contactOrderArr.push(items));
            resolve();
        });
        _p[1] = new Promise(async resolve => {
            const result = await MeetMsg.findAll({ attributes: [ [ 'company', 'contact_unit' ], [ 'contact_time', 'incoming_time' ] ], where: { isdel: 0, isEffect: 1 } });
            result.forEach(items => contactOrderArr.push(items));
            resolve();
        });
        _p[2] = new Promise(async resolve => {
            const result = await OtherMsg.findAll({ attributes: [ [ 'company', 'contact_unit' ], [ 'contact_time', 'incoming_time' ] ], where: { isdel: 0 } });
            result.forEach(items => contactOrderArr.push(items));
            resolve();
        });
        await Promise.all(_p);
        let isDefaultOrder = true;
        if (order !== 'id') isDefaultOrder = false;
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].dataValues.totalContactsOrderNum = 0;
            result.rows[i].dataValues.latestThreeMonthContactsOrderNum = 0;
        }
        const hashOrderMapper = {};
        // 处理
        contactOrderArr.forEach(items => {
            if (!hashOrderMapper[items.dataValues.contact_unit]) {
                hashOrderMapper[items.dataValues.contact_unit] = {
                    count: 0,
                    threeMonthCount: 0,
                };
            }
            hashOrderMapper[items.dataValues.contact_unit].count++;
            // 判断是否是近三个月的联系单
            const { incoming_time } = items.dataValues;
            if (incoming_time && (Date.parse(TIME()) - Date.parse(incoming_time) < 60 * 60 * 1000 * 24 * 30 * 3)) {
                hashOrderMapper[items.dataValues.contact_unit].threeMonthCount++;
            }
        });
        // 加上线上联系单的数据
        const onlineResult = await OnlineContactsInfo.findAll();
        let orderArr = [];
        for (const key in hashOrderMapper) {
            onlineResult.forEach(items => {
                if (items.dataValues.company == key) {
                    hashOrderMapper[key].count += items.dataValues.total;
                    hashOrderMapper[key].threeMonthCount += items.dataValues.latest_num;
                }
            });
            orderArr.push({
                company: key,
                count: hashOrderMapper[key].count,
                threeMonthCount: hashOrderMapper[key].threeMonthCount,
            });
        }
        if (order === 'total') {
            orderArr = orderArr.sort((a, b) => a.count - b.count);
        } else if (order === 'threeMonth') {
            orderArr = orderArr.sort((a, b) => a.threeMonthCount - b.threeMonthCount);
        }
        for (let i = 0; i < orderArr.length; i++) {
            for (let j = 0; j < result.rows.length; j++) {
                if (orderArr[i].company === result.rows[j].dataValues.company) {
                    result.rows[j].dataValues.totalContactsOrderNum = orderArr[i].count;
                    result.rows[j].dataValues.latestThreeMonthContactsOrderNum = orderArr[i].threeMonthCount;
                    if (!isDefaultOrder) {
                        const temp = result.rows[j];
                        result.rows.splice(j, 1);
                        result.rows.unshift(temp);
                    }
                    break;
                }
            }
        }
        if (!isDefaultOrder) {
            const startIndex = ( page -1 ) * pageSize;
            const endIndex = startIndex + pageSize;
            result.rows = result.rows.slice(startIndex, endIndex);
        }
    }
}

exports.getTarget = async params => {
    const { user_id } = params;
    const result = await VerUnit.findOne({ where: {
        isdel: 0,
        user_id,
    }});
    const staffMapper = new base.StaffMap().getStaffMap();
    result.dataValues.update_person = staffMapper[result.dataValues.update_person].user_name;
    result.dataValues.telArr = await VerUnitTel.findAll({
        where: { isdel: 0, ver_unit_id: user_id },
    });
    try {
        result.dataValues.certifiedPerson = staffMapper[result.dataValues.certifiedPerson].user_name;
    } catch (e) {
        
    }
    return {
        code: 200,
        msg: '查询成功',
        data: result,
    };
}

exports.create = async params => {
    const { company, admin_id, town, province, legal_person, sub_type } = params;
    const resExist = await VerUnit.findOne({ where: { company, isdel: 0 } });
    if (resExist) {
        // 更新子类型标签
        const origin_sub_type = resExist.dataValues.sub_type;
        let typeArr = [];
        try {
            typeArr = origin_sub_type.split(',').filter(items => items);
        } catch (error) {
            typeArr = [];
        }
        typeArr.push(sub_type);
        typeArr = [ ...new Set(typeArr) ];
        await VerUnit.update({
            sub_type: typeArr.join(),
            update_person: admin_id,
            update_time: TIME(),
        }, {
            where: { company, isdel: 0 }
        });
        return {code: -1, msg: '该单位已存在', data: resExist.dataValues};
    }
    let user_id;
    if (params.user_id) {
        user_id = params.user_id;
    } else {
        user_id = await createCompanyId();
    }
    await VerUnit.create({
        company,
        legal_person,
        user_id,
        update_person: admin_id,
        update_time: TIME(),
        province,
        town,
        sub_type,
    });
    return {code: 200, msg: '创建成功', data: {
        user_id,
    }};
}

exports.update = async params => {
    const { certifiedPerson, admin_id, user_id, company, telArr } = params;
    // 检查本表公司名唯一
    const resExist = await VerUnit.findOne({ where: { company, isdel: 0, user_id: { $ne: user_id } } });
    if (resExist) return {code: -1, msg: '该单位已存在'};
    const staffRes = await Staff.findOne({ where: { isdel: 0, user_name: certifiedPerson } });
    if (staffRes) params.certifiedPerson = staffRes.dataValues.user_id;
    params.update_person = admin_id;
    params.update_time = TIME();
    await VerUnit.update(params, {
        where: { user_id },
    });
    // 同步客户表数据
    Customers.update({
        company: params.company,
        legal_person: params.legal_person,
        tax_id: params.tax_id,
        reg_addr: params.reg_addr,
        reg_tel: params.reg_tel,
        zip_code: params.zip_code,
        certified: params.certified,
        certifiedPerson: params.certifiedPerson,
        // certifiedReason: params.certifiedReason,
        province: params.province,
        town: params.town,
    }, { where: { user_id }});
    // 同步单位常用认证电话
    SyncVerUnitTel({
        user_id,
        telArr,
        company,
    });
    return {
        code: 200,
        msg: '更新成功',
        data: [],
    };
}

async function createCompanyId () {
	const t = await sequelize.transaction();
	try {
		const customerItem = await sequelize.query('SELECT user_id FROM ver_unit WHERE user_id < 20000 ORDER BY user_id DESC LIMIT 0,1 FOR UPDATE', { transaction: t });
		const customerId = customerItem[0].length !== 0 ? Number(customerItem[0][0].user_id) : 0;
		let max = customerId;
		// 结尾 0, 6, 8
		do {
			++max;
			if( max == 1000) max = max * 10;
        } while ([0, 6, 8].indexOf( max % 10 ) === -1);
        t.commit();
		return max;
	} catch (e) {
		t.rollback();
		return e;
	}
}

// 同步认证单位电话
async function SyncVerUnitTel(params) {
    let { telArr, user_id, company } = params;
    if (!telArr) return { code: -1 };
    telArr = typeof telArr === 'string' ? JSON.parse(telArr) : telArr;
    const telHashMapper = {}, endArr = [], dealerArr = [];
    const verContactsDelArr = [];
    telArr.forEach(items => telHashMapper[items.tel] = items.name);
    const sqlTelArr = await VerUnitTel.findAll({
        where: {
            isdel: 0,
            ver_unit_id: user_id,
        },
    });
    if (sqlTelArr.length === 0) {
        for(const key in telHashMapper) {
            endArr.push({
                name: telHashMapper[key],
                tel: key,
                ver_unit_id: user_id,
            });
        }
    } else {
        for (let i = 0; i < sqlTelArr.length; i++) {
            const items = sqlTelArr[i].dataValues;
            if (telHashMapper[items.tel]) {
                endArr.push({
                    id: items.id,
                    name: telHashMapper[items.tel],
                });
            } else {
                endArr.push({
                    id: items.id,
                    isdel: 1,
                });
                verContactsDelArr.push(items.tel);
            }
            dealerArr.push(items.tel);
        }
        for(const key in telHashMapper) {
            if (dealerArr.indexOf(key) === -1) {
                endArr.push({
                    name: telHashMapper[key],
                    tel: key,
                    ver_unit_id: user_id,
                });
            }
        }
    }
    const _p = [];
    endArr.forEach((items, index) => {
        _p[index] = new Promise(async (resolve, reject) => {
            if (items.id) {
                await VerUnitTel.update(items, { where: { id: items.id } });
            } else {
                await VerUnitTel.create(items);
                // 新增最近联系人表中的item
                await VerContacts.create({
                    name: items.name,
                    phone: items.tel,
                    company,
                    job: '座机',
                });
            }
            resolve();
        });
    });
    await Promise.all(_p);
    // 删除最近联系人表中的item
    await VerContacts.update({
        isdel: 1,
    }, {
        where: {
            phone: { $in: verContactsDelArr },
        },
    });
    return { code: 200, msg: '同步成功' };
}

this.getMainContacts = async params => {
    const { company } = params;
    const contactsArr = await Contacts.findAll({
        where: {
            isdel: 0,
            company,
            verified: 1,
        }
    });
    const memberArr = await Member.findAll({
        where: {
            isdel: 0,
            checked: 1,
            company,
            isEffect: 1,
        }
    });
    const arr = [], hashMapper = {};
    memberArr.forEach(items => {
        if (!hashMapper[items.dataValues.phone]) {
            hashMapper[items.dataValues.phone] = 1;
            arr.push({
                name: items.dataValues.name,
                phone: items.dataValues.phone,
                job: items.dataValues.job,
                type: 'member',
            });
        }
    });
    contactsArr.forEach(items => {
        if (!hashMapper[items.dataValues.phone1]) {
            hashMapper[items.dataValues.phone] = 1;
            arr.push({
                name: items.dataValues.name,
                phone: items.dataValues.phone1,
                type: 'contacts',
            });
        }
    });
    return arr;
    // const vRes = await VerUnit.findOne({
    //     where: {
    //         company,
    //         isdel: 0,
    //     }
    // });
    // const { legal_person } = vRes.dataValues;
    // for (let i = 0; i < arr.length; i++) {
    //     if (arr[i].name == legal_person) {
    //         break;
    //     } else if (arr[i].name != legal_person && i == arr.length - 1) {
    //         arr.unshift(legal_person);
    //         break;
    //     }
    // }
    // if (arr.length === 0) arr.unshift(legal_person);
}

exports.updateSubType = async params => {
    const { user_id, sub_type, admin_id } = params;
    const result = await VerUnit.findOne({ where: { user_id } });
    const origin_sub_type = result.dataValues.sub_type;
    let typeArr = [];
    try {
        typeArr = origin_sub_type.split(',');
    } catch (error) {
        typeArr = [];
    }
    const index = typeArr.indexOf(sub_type);
    if (index === -1) return { code: 200, msg: '更新子类型成功' };
    typeArr.splice(index, 1);
    await VerUnit.update({
        sub_type: typeArr.join(),
        update_person: admin_id,
        update_time: TIME(),
    }, {
        where: { user_id }
    });
    return { code: 200, msg: '更新子类型成功' };
}