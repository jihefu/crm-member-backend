'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('NotiRegistry', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        regName: {
            type: DataTypes.STRING
        },
        patchUrl: {
            type: DataTypes.STRING
        },
        postUrl: {
            type: DataTypes.STRING
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'noti_registry',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}