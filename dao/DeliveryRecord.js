'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('DeliveryRecord', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        contract_no: {
            type: DataTypes.STRING
        },
        cus_cn_abb: {
            type: DataTypes.STRING
        },
        contacts: {
            type: DataTypes.STRING
        },
        contacts_tel: {
            type: DataTypes.STRING
        },
        express_no: {
            type: DataTypes.STRING
        },
        express_type: {
            type: DataTypes.STRING
        },
        delivery_time: {
            type: DataTypes.DATEONLY
        },
        goods: {
            type: DataTypes.STRING
        },
        delivery_state: {
            type: DataTypes.STRING
        },
        received_time: {
            type: DataTypes.DATEONLY
        },
        received_person: {
            type: DataTypes.STRING
        },
        rem: {
            type: DataTypes.STRING
        },
        all_shipments: {
            type: DataTypes.INTEGER,
            defaultValue: 0
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
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'delivery_record',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}




