'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ContractsOffer', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        coupon_value: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0
        },
        coupon_no: {
            type: DataTypes.STRING
        },
        service_deposit_value: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0
        },
        service_deposit_no: {
            type: DataTypes.STRING
        },
        other_offers: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0
        },
        other_id: {
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
        tableName: 'contracts_offer',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
