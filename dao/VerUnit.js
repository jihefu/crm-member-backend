'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('VerUnit', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey : true,
            unique : true
        },
        company: {
            type: DataTypes.STRING
        },
        sub_type: {
            type: DataTypes.STRING
        },
        legal_person: {
            type: DataTypes.STRING
        },
        tax_id: {
            type: DataTypes.STRING
        },
        reg_addr: {
            type: DataTypes.STRING
        },
        reg_tel: {
            type: DataTypes.STRING
        },
        zip_code: {
            type: DataTypes.STRING
        },
        certified: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        certifiedReason: {
            type: DataTypes.STRING
        },
        certifiedPerson: {
            type: DataTypes.STRING
        },
        province: {
            type: DataTypes.STRING
        },
        town: {
            type: DataTypes.STRING
        },
        update_time: {
            type: DataTypes.DATE
        },
        update_person: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'ver_unit',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
