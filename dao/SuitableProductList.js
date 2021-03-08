'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('SuitableProductList', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        customerId: {
            type: DataTypes.INTEGER,
        },
        name: {
            type: DataTypes.STRING,
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
        tableName: 'suitable_product_list',
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
};
