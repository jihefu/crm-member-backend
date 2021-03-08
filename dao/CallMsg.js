'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CallMsg', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        contact_phone: {
            type: DataTypes.STRING,
            comment: '联系电话'
        },
        staff_phone: {
            type: DataTypes.STRING,
            comment: '员工电话'
        },
        incoming_time: {
            type: DataTypes.DATE,
            comment: '呼入时间'
        },
        handle_time: {
            type: DataTypes.DATE,
            comment: '接起时间'
        },
        hang_up_time: {
            type: DataTypes.DATE,
            comment: '挂断时间'
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'call_message',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}




