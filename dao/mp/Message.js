'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Message', {
        id: {
            type:DataTypes.INTEGER(11),
            autoIncrement:true,
            primaryKey : true,
            unique : true
        },
        sender: {
            type: DataTypes.STRING
        },
        senderOpenId: {
            type: DataTypes.STRING
        },
        senderUserId: {
            type: DataTypes.STRING
        },
        sendTime: {
            type: DataTypes.DATE
        },
        title: {
            type: DataTypes.STRING
        },
        content: {
            type: DataTypes.STRING(1000)
        },
        messageClass: {
            type:DataTypes.INTEGER(11),
            defaultValue:0
        },
        hasDeal: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'message',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
