'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BaseMsg', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        // mid: {
        //     field: 'm_id',
        //     type: DataTypes.STRING,
        //     comment: '消息单号'
        // },
        contact_name: {
            type: DataTypes.STRING,
            comment: '联系人'
        },
        contact_phone: {
            type: DataTypes.STRING,
            comment: '联系电话'
        },
        contact_unit: {
            type: DataTypes.STRING,
            comment: '联系单位'
        },
        contact_type: {
            type: DataTypes.STRING,
            comment: '类型'
        },
        staff: {
            type: DataTypes.STRING,
            comment: '员工'
        },
        staff_phone: {
            type: DataTypes.STRING,
            comment: '员工电话'
        },
        tags: {
            type: DataTypes.STRING,
            comment: '标签'
        },
        demand: {
            type: DataTypes.STRING,
            comment: '客户需求'
        },
        content: {
            type: DataTypes.STRING,
            comment: '我的答复'
        },
        incoming_time: {
            type: DataTypes.DATE,
            comment: '呼入时间'
        },
        hasToDo: {
            type: DataTypes.INTEGER,
            comment: '是否还是待办事项',
            defaultValue: 0
        },
        toDoContent: {
            type: DataTypes.STRING,
            comment: '待办事项'
        },
        hasRelativeResource: {
            type: DataTypes.STRING,
            comment: '相关资源',
            defaultValue: '0'
        },
        check_person: {
            type: DataTypes.STRING,
            comment: '审核人'
        },
        feedback_flag: {
            type: DataTypes.INTEGER,
            comment: '反馈标志',
            defaultValue: 0
        },
        feedback_time: {
            type: DataTypes.DATE,
            comment: '反馈时间'
        },
        other_visible: {
            type: DataTypes.INTEGER,
            comment: '对方可见',
            defaultValue: 1
        },
        isdel: {
            type: DataTypes.INTEGER,
            comment: '是否删除',
            defaultValue: 0
        },
        complete: {
            type: DataTypes.INTEGER,
            comment: '是否完成',
            defaultValue: 0
        },
        state: {
            type: DataTypes.INTEGER,
            comment: '状态',
            defaultValue: '待提交'
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'contact_message',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
