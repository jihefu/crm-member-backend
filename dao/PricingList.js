'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('PricingList', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        contract_no: {
            type: DataTypes.STRING
        },
        sign_time: {
            type: DataTypes.DATEONLY
        },
        company: {
            type: DataTypes.STRING
        },
        contract_price: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0.00
        },
        cost_price: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0.00
        },
        deposit: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0.00
        },
        achievement: {
            type: DataTypes.DECIMAL(11,2),
            defaultValue: 0.00
        },
        total_work_hours: {
            type: DataTypes.DECIMAL(11, 2),
            defaultValue: 0
        },
        isPower: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isSub: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        state: {
            type: DataTypes.STRING,
            defaultValue: '待审核'
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.DATE
        },
        update_person: {
            type: DataTypes.STRING
        },
        update_time: {
            type: DataTypes.DATE
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
        tableName: 'pricing_list',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
