'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CustomerMsg', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        userId: {
            type: DataTypes.STRING
        },
        sender: {
            type: DataTypes.STRING
        },
        postTime: {
            type: DataTypes.DATE
        },
        content: {
            type: DataTypes.STRING(1000)
        },
        album: {
            type: DataTypes.STRING
        },
        albumName: {
            type: DataTypes.STRING
        },
        file: {
            type: DataTypes.STRING
        },
        fileName: {
            type: DataTypes.STRING
        },
        voice: {
            type: DataTypes.STRING
        },
        receiver: {
            type: DataTypes.STRING
        },
        isRead: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'customer_msg',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
