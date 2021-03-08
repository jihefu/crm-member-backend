'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ExchangeRecord', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        no: {
            type: DataTypes.STRING,
        },
        goodsId: {
            type: DataTypes.INTEGER,
        },
        needScore: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        goodsName: {
            type: DataTypes.STRING,
        },
        unionid: {
            type: DataTypes.STRING,
        },
        consumeTime: {
            type: DataTypes.DATE,
        },
        type: {
            type: DataTypes.STRING,
        },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'exchange_record',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
