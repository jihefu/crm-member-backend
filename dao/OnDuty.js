'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('OnDuty', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        date: {
            type: DataTypes.DATEONLY
        },
        user_id: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '1代表安卫，2代表客服'
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
        tableName: 'on_duty',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}