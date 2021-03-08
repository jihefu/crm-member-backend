'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('NotiClientAffairGroup', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        title: {
            type: DataTypes.STRING
        },
        group_person: {
            type: DataTypes.STRING
        },
        director: {
            type: DataTypes.STRING
        },
        locationHref: {
            type: DataTypes.STRING
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.DATE
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
        tableName: 'noti_client_affair_group',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}