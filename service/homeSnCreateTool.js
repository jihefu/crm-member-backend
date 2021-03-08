const sequelize = require('../dao').sequelize;
const Staff = require('../dao').Staff;
const SnCreateTool = require('../dao').SnCreateTool;
const base = require('./base');

/**
 * 获取申请记录列表
 */
exports.index = async params => {
    let { page, num, keywords } = params;
    page = page ? parseInt(page) : 1;
    num = num ? parseInt(num) : 30;
    keywords = keywords ? keywords : '';
    const result = await SnCreateTool.findAndCountAll({
        limit: num,
        offset: (page - 1) * num,
        order: [[ 'id', 'DESC' ]],
    });
    const staffMapper = new base.StaffMap().getStaffMap();
    result.rows.forEach((items, index) => {
        result.rows[index].dataValues.createPerson = staffMapper[items.dataValues.createPerson].user_name;
    });
    return {
        code: 200,
        msg: '',
        data: {
            data: result.rows,
            total: result.count,
            id_arr: [],
        },
    };
}

/**
 * 申请序列号
 */
this.create = async params => {
    const { num, admin_id, msg_id } = params;
    console.log(msg_id);
    try {
        const result = await sequelize.transaction(async t => {
            const lastItemEntity = await sequelize.query('SELECT * FROM sn_create_tool ORDER BY id DESC LIMIT 0, 1 FOR UPDATE', { transaction: t });
            const item = lastItemEntity[0][0];
            const { endSn, createTime } = item;
            const nowMonth = new Date(TIME()).getMonth();
            const lastMonth = new Date(createTime).getMonth();
            let newStartSn, newEndSn;
            if (nowMonth !== lastMonth) {
                newStartSn = ( Math.floor(endSn / 10000) + 1 ) * 10000;
            } else {
                newStartSn = endSn + 1;
            }
            newEndSn = newStartSn + num - 1;
            const createEntity = await SnCreateTool.create({
                startSn: newStartSn,
                endSn: newEndSn,
                createPerson: admin_id,
                createTime: TIME(),
                msg_id,
            }, { transaction: t });
            return createEntity;
        });
        return {
            code: 200,
            msg: '申请成功',
            data: result,
        };
    } catch (e) {
        return {
            code: -1,
            msg: e.message,
            data: [],
        };
    }
}