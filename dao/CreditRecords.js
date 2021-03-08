'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CreditRecords', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        company: {
            type: DataTypes.STRING
        },
        abb: {
            type: DataTypes.STRING
        },
        credit_line: {
            type: DataTypes.INTEGER
        },
        credit_period: {
            type: DataTypes.INTEGER
        },
        credit_time: {
            type: DataTypes.DATE
        },
        img: {
            type: DataTypes.STRING
        },
        reason: {
            type: DataTypes.STRING
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.TIME
        },
        update_person: {
            type: DataTypes.STRING
        },
        update_time: {
            type: DataTypes.TIME
        },
        isdel: {
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'credit_records',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}