'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CreditTrendTecord', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        company: {
            type: DataTypes.STRING
        },
        checkDate: {
            field: "check_date",
            type: DataTypes.DATE
        },
        creditLine: {
            field: "credit_line",
            type: DataTypes.INTEGER
        },
        creditPeriod: {
            field: "credit_period",
            type: DataTypes.INTEGER
        },
        overDraft: {
            field: "overdraft",
            type: DataTypes.INTEGER
        },
        insideAmount: {
            field: "inside_amount",
            type: DataTypes.INTEGER
        },
        outsideAmount: {
            field: "outside_amount",
            type: DataTypes.INTEGER
        },
        freezeAmount: {
            field: "freeze_amount",
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'credit_trend_record',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}