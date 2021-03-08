'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SmsLog', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        templateCode: { type: DataTypes.STRING },
        phoneNumbers: { type: DataTypes.STRING(3000) },
        templateParam: { type: DataTypes.STRING },
        time: { type: DataTypes.DATE },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'sms_log',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}