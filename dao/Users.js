'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Users', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        company: {
            type: DataTypes.STRING
        },
        user_id: {
            type: DataTypes.STRING
        },
        abb: {
            type: DataTypes.STRING
        },
        cn_abb: {
            type: DataTypes.STRING
        },
        legal_person: {
            type: DataTypes.STRING
        },
        reg_person: {
            type: DataTypes.STRING
        },
        province: {
            type: DataTypes.STRING
        },
        town: {
            type: DataTypes.STRING
        },
        reg_company: {
            type: DataTypes.STRING
        },
        reg_addr: {
            type: DataTypes.STRING
        },
        reg_tel: {
            type: DataTypes.STRING
        },
        bank_name: {
            type: DataTypes.STRING
        },
        bank_account: {
            type: DataTypes.STRING
        },
        tax_id: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING
        },
        level: {
            type: DataTypes.STRING
        },
        manager: {
            type: DataTypes.STRING
        },
        datefrom: {
            type: DataTypes.DATE
        },
        website: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        pwd: {
            type: DataTypes.STRING
        },
        total_sale: {
            type: DataTypes.STRING
        },
        bussiness_addr: {
            type: DataTypes.STRING
        },
        zip_code: {
            type: DataTypes.STRING
        },
        album: {
            type: DataTypes.STRING
        },
        rem: {
            type: DataTypes.STRING
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.DATEONLY
        },
        update_time: {
            type: DataTypes.TIME
        },
        update_person: {
            type: DataTypes.STRING
        },
        info_score: {
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
        tableName: 'users',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
