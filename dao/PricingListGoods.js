'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('PricingListGoods', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        goods_type: {
            type: DataTypes.STRING
        },
        goods_name: {
            type: DataTypes.STRING
        },
        goods_num: {
            type: DataTypes.INTEGER(11),
            defaultValue: 1
        },
        extra_add: {
            type: DataTypes.INTEGER(1),
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'pricing_list_goods',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
