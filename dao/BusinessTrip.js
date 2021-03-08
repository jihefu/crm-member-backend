'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BusinessTrip', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        user_id: {
            type: DataTypes.STRING,
        },
        branch: {
            type: DataTypes.STRING,
        },
        create_time: {
            type: DataTypes.DATE,
        },
        company: {
            type: DataTypes.STRING,
        },
        addr: {
            type: DataTypes.STRING,
        },
        type: {
            type: DataTypes.STRING,
            comment: '销售，服务，公务安排，学习，培训，会议，其它',
        },
        reason: {
            type: DataTypes.STRING,
        },
        director: {
            type: DataTypes.STRING,
        },
        go_out_time: {
            type: DataTypes.DATE,
        },
        back_time: {
            type: DataTypes.DATE,
        },
        meet_order_id: {
            type: DataTypes.STRING,
        },
        state: {
            type: DataTypes.STRING,
            comment: '尚未审核，已通过，取消',
        },
        check_person: {
            type: DataTypes.STRING,
        },
        check_rem: {
            type: DataTypes.STRING,
        },
        check_time: {
            type: DataTypes.DATE,
        },
        update_time: {
            type: DataTypes.DATE,
        },
        amount: {
            type: DataTypes.INTEGER,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'business_trip',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
