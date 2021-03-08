'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('PricingListGoodsAmount', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        name: {
            type: DataTypes.STRING
        },
        num: {
            type: DataTypes.INTEGER(11),
            defaultValue: 1
        },
        price: {
            type: DataTypes.INTEGER(11,2),
            defaultValue: 0.00
        },
        amount: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0.00
        },
        work_hours: {
            type: DataTypes.DECIMAL(11, 2),
            defaultValue: 0
        },
        total_work_hours: {
            type: DataTypes.DECIMAL(11, 2),
            defaultValue: 0
        },
        person_num: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0.00
        },
        day: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0.00
        },
        mile: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0.00
        },
        rem: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'pricing_list_goods_amount',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
