'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ProductsSelectLog', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        product_name: {
            type: DataTypes.STRING
        },
        product_coe: {
            type: DataTypes.DECIMAL(11,3)
        }
    },
    {
        timestamps: false,
        underscored: false,
        freezeTableName: true,
        tableName: 'products_select_log',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
