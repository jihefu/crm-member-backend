'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SmsReceiver', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        smsReceiverId: {
            type: DataTypes.STRING,
        },
        smsReceiverText: {
            type: DataTypes.STRING,
        },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'sms_receiver',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}