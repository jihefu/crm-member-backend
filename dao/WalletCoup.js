'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('WalletCoup', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        coupon_no: {
            type: DataTypes.STRING,
            comment: '抵价券编号'
        },
        amount: {
            type: DataTypes.DECIMAL(11,2),
            comment: '金额',
            defaultValue: 0.00
        },
        original_price: {
            type: DataTypes.DECIMAL(11,2),
            comment: '原价',
            defaultValue: 0.00
        },
        isPower: {
            type: DataTypes.INTEGER,
            comment: '是否起效',
            defaultValue: 1
        },
        endTime: {
            type: DataTypes.DATEONLY,
            comment: '失效日期'
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
        tableName: 'wallet_coup',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
