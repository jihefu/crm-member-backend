'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SmsTemp', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        smsId: {
            type: DataTypes.STRING,
        },
        smsVar: {
            type: DataTypes.STRING,
        },
        smsName: {
            type: DataTypes.STRING,
        },
        smsText: {
            type: DataTypes.STRING,
        },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'sms_temp',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}