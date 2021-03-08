'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('PackingList', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        num: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        sn: {
            type: DataTypes.STRING(3000),
        },
        otherNum: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        otherSn: {
            type: DataTypes.STRING(3000),
        },
        expressNo: {
            type: DataTypes.STRING,
        },
        sendTime: {
            type: DataTypes.DATE,
        },
        sendType: {
            type: DataTypes.STRING,
        },
        isSend: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        contractId: {
            type: DataTypes.INTEGER,
        },
        insertPerson: {
            type: DataTypes.STRING,
        },
        insertTime: {
            type: DataTypes.DATE,
        },
        updatePerson: {
            type: DataTypes.STRING,
        },
        updateTime: {
            type: DataTypes.DATE,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'packing_list',
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
};
