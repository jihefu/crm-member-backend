'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('VerContacts', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        name: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        company: {
            type: DataTypes.STRING
        },
        job: {
            type: DataTypes.STRING
        },
        staff_name: {
            type: DataTypes.STRING
        },
        latest_call_time: {
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
        tableName: 'ver_contacts',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
