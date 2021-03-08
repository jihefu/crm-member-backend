'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('MsgBox', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        mailId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        affairId: {
            type: DataTypes.STRING
        },
        frontUrl: {
            type: DataTypes.STRING
        },
        sender: {
            type: DataTypes.STRING
        },
        post_time: {
            type: DataTypes.DATE
        },
        title: {
            type: DataTypes.STRING
        },
        content: {
            type: DataTypes.STRING
        },
        action: {
            type: DataTypes.STRING
        },
        locationId: {
            type: DataTypes.STRING
        },
        originMsg: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'msg_box',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}