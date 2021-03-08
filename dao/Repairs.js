'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Repairs', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        repair_contractno: {
            type: DataTypes.STRING,
        },
        cust_name: {
            type: DataTypes.STRING,
        },
        contact: {
            type: DataTypes.STRING,
        },
        contact_type: {
            type: DataTypes.STRING,
        },
        goods: {
            type: DataTypes.STRING,
        },
        standrd: {
            type: DataTypes.STRING,
        },
        receive_time: {
            type: DataTypes.STRING,
        },
        receive_no: {
            type: DataTypes.STRING,
        },
        number: {
            type: DataTypes.INTEGER,
        },
        rem: {
            type: DataTypes.STRING,
        },
        related_contract_salary: {
            type: DataTypes.INTEGER,
        },
        related_contract_owncost: {
            type: DataTypes.INTEGER,
        },
        problems: {
            type: DataTypes.STRING,
        },
        guarantee_repair: {
            type: DataTypes.STRING,
        },
        related_contract: {
            type: DataTypes.STRING,
        },
        conclusion: {
            type: DataTypes.STRING,
        },
        pri_check_person: {
            type: DataTypes.STRING,
        },
        again_conclusion: {
            type: DataTypes.STRING,
        },
        again_check_person: {
            type: DataTypes.STRING,
        },
        treatement: {
            type: DataTypes.STRING,
        },
        repair_conclusion: {
            type: DataTypes.STRING,
        },
        serial_no: {
            type: DataTypes.STRING,
        },
        own_cost: {
            type: DataTypes.STRING,
        },
        outer_cost: {
            type: DataTypes.STRING,
        },
        fee_basis: {
            type: DataTypes.STRING,
        },
        fee_checker: {
            type: DataTypes.STRING,
        },
        express: {
            type: DataTypes.STRING,
        },
        deliver_time: {
            type: DataTypes.STRING,
        },
        deliver_state: {
            type: DataTypes.STRING,
        },
        take_person: {
            type: DataTypes.STRING,
        },
        take_time: {
            type: DataTypes.DATE,
        },
        complete: {
            type: DataTypes.INTEGER,
            defaultValues: 0
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.DATEONLY
        },
        update_person: {
            type: DataTypes.STRING,
        },
        update_time: {
            type: DataTypes.DATE,
        },
        album: {
            type: DataTypes.STRING,
        },
        sql_stamp: {
            type: DataTypes.TIME,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValues: 0
        },
        stage0: {
            type: DataTypes.DATE,
        },
        stage1: {
            type: DataTypes.DATE,
        },
        stage2: {
            type: DataTypes.DATE,
        },
        stage3: {
            type: DataTypes.DATE,
        },
        stage4: {
            type: DataTypes.DATE,
        },
        stage5: {
            type: DataTypes.DATE,
        },
        repair_person: {
            type: DataTypes.STRING,
        },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'repairs',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}




