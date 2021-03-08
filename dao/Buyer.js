'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Buyer', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey : true,
            unique : true
        },
        company: {
            type: DataTypes.STRING
        },
        bank_name: {
            type: DataTypes.STRING
        },
        bank_account: {
            type: DataTypes.STRING
        },
        website: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        products: {
            type: DataTypes.STRING
        },
        start_buy_time: {
            type: DataTypes.DATEONLY,
        },
        total_amount: {
            type: DataTypes.INTEGER,
        },
        present_amount: {
            type: DataTypes.INTEGER,
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
            type: DataTypes.DATE
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
        certified: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'supplier',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
