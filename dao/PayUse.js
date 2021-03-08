'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('PayUse', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        pay_id: {
            type: DataTypes.INTEGER
        },
        type: {
            type: DataTypes.STRING
        },
        contract_no: {
            type: DataTypes.STRING
        },
        amount: {
            type: DataTypes.DECIMAL
        },
        rem: {
            type: DataTypes.STRING
        },
        ishistory: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'pay_use',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
