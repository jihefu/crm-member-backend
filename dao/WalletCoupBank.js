'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('WalletCoupBank', {
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
        create_time: {
            type: DataTypes.DATE,
        },
        create_person: {
            type: DataTypes.STRING,
        },
        is_assign: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        init_user_id: {
            type: DataTypes.INTEGER,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'wallet_coup_bank',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
