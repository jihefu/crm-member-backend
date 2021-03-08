'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('NotiClientSub', {
        id: { 
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4 
        },
        receiver: {
            type: DataTypes.STRING,
        },
        replied: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        replyTime: {
            type: DataTypes.DATE
        },
        vote: {
            type: DataTypes.STRING
        },
        atMe: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        atReply: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
        
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'noti_client_sub',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}