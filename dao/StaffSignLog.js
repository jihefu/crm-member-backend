'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('StaffSignLog', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        on_time: {
            type: DataTypes.DATE,
            comment: '签到时间'
        },
        off_time: {
            type: DataTypes.DATE,
            comment: '离岗时间'
        },
        gps: {
            type: DataTypes.STRING,
            comment: '签到地点'
        },
        isdel: {
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'staff_sign_log',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
