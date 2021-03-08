'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ProductsSpecLog', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        product_spec: {
            type: DataTypes.STRING
        },
        product_spec_coe: {
            type: DataTypes.DECIMAL(11,3)
        },
        product_spec_price: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0.00
        }
    },
    {
        timestamps: false,
        underscored: false,
        freezeTableName: true,
        tableName: 'products_spec_log',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
