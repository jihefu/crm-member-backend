'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('MeetingNews', {
        id: {
            type:DataTypes.INTEGER(11),
            autoIncrement:true,
            primaryKey : true,
            unique : true
        },
        title: {
            type: DataTypes.STRING
        },
        content: {
            type: DataTypes.STRING(1000)
        },
        sender: {
            type: DataTypes.STRING
        },
        senderName: {
            type: DataTypes.STRING
        },
        sendTime: {
            type: DataTypes.DATE
        },
        img: {
            type: DataTypes.STRING
        },
        isTop: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'meeting_news',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
