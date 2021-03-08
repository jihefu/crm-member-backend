'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('StaffSign', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        user_id: {
            type: DataTypes.STRING,
            comment: '工号'
        },
        date: {
            type: DataTypes.DATEONLY,
            comment: '日期'
        },
        on_hours: {
            type: DataTypes.DECIMAL(5,2),
            defaultValue: 0,
            comment: '当天工作时间'
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '是否在岗'
        },
        notRead: {
            field: 'not_read',
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        notReply: {
            field: 'not_reply',
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        signByApp: {
            field: 'sign_by_app',
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        notUpdate: {
            field: 'not_update',
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        not_update_arr: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'staff_sign',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
