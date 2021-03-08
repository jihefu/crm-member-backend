'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ContractsHead', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        contract_no: {
            type: DataTypes.STRING
        },
        cus_abb: {
            field: 'cus_abb',
            type: DataTypes.STRING
        },
        grade: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        contract_state: {
            type: DataTypes.STRING
        },
        close_reason: {
            type: DataTypes.STRING
        },
        close_time: {
            type: DataTypes.DATE
        },
        sale_person: {
            type: DataTypes.STRING
        },
        purchase: {
            type: DataTypes.STRING
        },
        sign_time: {
            type: DataTypes.DATE
        },
        total_amount: {
            type: DataTypes.DECIMAL
        },
        payable: {
            type: DataTypes.DECIMAL
        },
        paid: {
            type: DataTypes.DECIMAL
        },
        install: {
            type: DataTypes.INTEGER
        },
        snNum: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        snGroup: {
            type: DataTypes.STRING,
        },
        snLackNum: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        otherSnNum: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        otherSnGroup: {
            type: DataTypes.STRING,
        },
        otherSnLackNum: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        hardType: { type: DataTypes.STRING },
        softType: { type: DataTypes.STRING },
        other: {
            type: DataTypes.TEXT
        },
        delivery_state: {
            type: DataTypes.STRING
        },
        delivery_time: {
            type: DataTypes.DATE
        },
        take_person: {
            type: DataTypes.STRING
        },
        take_time: {
            type: DataTypes.DATE
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
            type: DataTypes.TIME
        },
        isdel: {
            type: DataTypes.INTEGER
        },
        album: {
            type: DataTypes.TEXT
        },
        complete: {
            type: DataTypes.INTEGER
        },
        isFreeze: {
            type: DataTypes.INTEGER
        },
        freeze_reason: {
            type: DataTypes.STRING
        },
        freeze_time: {
            type: DataTypes.DATE
        },
        freeze_start_time: {
            type: DataTypes.DATE
        },
        madeInApp: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isDirectSale: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        msg_id: {
            type: DataTypes.STRING,
        },
        snGroupRem: {
            type: DataTypes.STRING,
        },
        otherSnGroupRem: {
            type: DataTypes.STRING,
        },
        _v: {
            type: DataTypes.INTEGER,
            defaultValue: 0, 
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'contracts_head',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
