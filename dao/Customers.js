'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Customers', {
        company: {
            type: DataTypes.STRING
        },
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey : true,
            unique : true
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
        finance: {
            type: DataTypes.STRING
        },
        purchase: {
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
        tech_support: {
            type: DataTypes.STRING
        },
        datefrom: {
            type: DataTypes.STRING
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
        products: {
            type: DataTypes.STRING
        },
        intention_products: {
            type: DataTypes.STRING
        },
        adopt_products: {
            field: 'adopt_product',
            type: DataTypes.STRING
        },
        use_per: {
            type: DataTypes.STRING
        },
        star: {
            type: DataTypes.STRING
        },
        credit_line: {
            type: DataTypes.STRING,
            defaultValue: 0
        },
        credit_period: {
            type: DataTypes.STRING,
            defaultValue: 0
        },
        credit_record: {
            type: DataTypes.STRING
        },
        credit_qualified: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        last_sale: {
            type: DataTypes.STRING,
            defaultValue: 0
        },
        latest_year_sale: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        total_sale: {
            type: DataTypes.STRING,
            defaultValue: 0
        },
        total_dyna_sale: {
            type: DataTypes.INTEGER,
            defaultValue: 0
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
        operKey: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        hasRegPower: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        funCodeAuth: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        partner: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
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
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'customers',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
