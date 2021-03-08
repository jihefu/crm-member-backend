'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Users', {
        userId:{
            field: 'User_id',
            type:DataTypes.INTEGER(11), 
            autoIncrement:true, 
            primaryKey : true, 
            unique : true
        },
        userName: {
            field: 'User_name',
            type: DataTypes.STRING
        },
        sid: {
            field: 'Sid',
            type: DataTypes.STRING
        },
        pwd: {
            field: 'Pwd',
            type: DataTypes.STRING
        },
        class: {
            field: 'Class',
            type: DataTypes.STRING
        },
        room: {
            field: 'Room',
            type: DataTypes.STRING
        },
        pro: {
            field: 'Pro',
            type: DataTypes.STRING
        },
        phoneCn: {
            field: 'Phone_cn',
            type: DataTypes.STRING
        },
        phoneFore: {
            field: 'Phone_fore',
            type: DataTypes.STRING
        },
        email: {
            field: 'Email',
            type: DataTypes.STRING
        },
        company: {
            field: 'Company',
            type: DataTypes.STRING
        },
        country: {
            field: 'Country',
            type: DataTypes.STRING
        },
        addr: {
            field: 'Addr',
            type: DataTypes.STRING
        },
        lastLogin: {
            field: 'Last_Login',
            type: DataTypes.DATE
        },
        openId: {
            field: 'Open_id',
            type: DataTypes.STRING
        },
        portrait: {
            field: 'Portrait',
            type: DataTypes.STRING
        },
        socialMedia: {
            field: 'Social_media',
            type: DataTypes.STRING
        },
        socialMediaAccount: {
            field: 'Social_media_account',
            type: DataTypes.STRING
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'user',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
