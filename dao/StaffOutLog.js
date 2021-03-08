'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('StaffOutLog', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        director: {
            type: DataTypes.STRING,
            comment: '外出指派人'
        },
        reason: {
            type: DataTypes.STRING,
            comment: '外出事由'
        },
        out_time: {
            type: DataTypes.DATE,
            comment: '外出时间'
        },
        back_time: {
            type: DataTypes.DATE,
            comment: '返岗时间'
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'staff_out_log',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
