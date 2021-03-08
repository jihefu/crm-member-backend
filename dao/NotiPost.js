'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('NotiPost', {
        mailId: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        class: {
            type: DataTypes.STRING
        },
        priority: {
            type: DataTypes.STRING
        },
        frontUrl: {
            type: DataTypes.STRING
        },
        sender: {
            type: DataTypes.STRING,
        },
        post_time: {
            type: DataTypes.DATE,
        },
        title: {
            type: DataTypes.STRING,
        },
        content: {
            type: DataTypes.STRING,
        },
        album: {
            type: DataTypes.STRING,
        },
        albumName: {
            type: DataTypes.STRING,
        },
        file: {
            type: DataTypes.STRING,
        },
        fileName: {
            type: DataTypes.STRING,
        },
        votes: {
            type: DataTypes.STRING
        },
        atSomeone: {
            type: DataTypes.STRING
        },
        subscriber: {
            type: DataTypes.STRING
        },
        aesStr: {
            type: DataTypes.STRING
        },
        proof: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        locationId: {
            type: DataTypes.STRING
        },
        isMeetingMsg: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        meetingTime: {
            type: DataTypes.DATE,
        },
        noti_client_affair_group_uuid: {
            type: DataTypes.STRING
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'noti_post',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}