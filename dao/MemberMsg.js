'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('MemberMsg', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        openid: { type: DataTypes.STRING },
        name: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        sender: {
            type: DataTypes.STRING
        },
        post_time: {
            type: DataTypes.TIME
        },
        type: {
            type: DataTypes.STRING
        },
        title: {
            type: DataTypes.STRING
        },
        message: {
            type: DataTypes.TEXT
        },
        album: {
            type: DataTypes.STRING
        },
        url: {
            type: DataTypes.STRING
        },
        model: {
            type: DataTypes.STRING
        },
        is_read: {
            type: DataTypes.INTEGER
        },
        read_time: {
            type: DataTypes.TIME
        },
        mark: {
            type: DataTypes.INTEGER
        },
        isdel: {
            type: DataTypes.INTEGER
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'vip_message',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
