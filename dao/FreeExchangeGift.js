'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('FreeExchangeGift', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        unionid: {
            type: DataTypes.STRING,
        },
        goodsIds: {
            type: DataTypes.STRING,
        },
        exchangeGoodsId: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isExchange: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        exchangeTime: {
            type: DataTypes.DATE,
        },
        createTime: {
            type: DataTypes.DATE,
        },
        createPerson: {
            type: DataTypes.STRING,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'free_exchange_gift',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
