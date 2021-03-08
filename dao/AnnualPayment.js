'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('AnnualPayment', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        company: {
            type: DataTypes.STRING
        },
        amount_16: {
            type: DataTypes.INTEGER
        },
        amount_17: {
            type: DataTypes.INTEGER
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'annual_payment',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
