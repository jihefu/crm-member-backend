'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('TypeDInfo', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        total_contact_num: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        latest_contact_num: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        latest_contact_time: {
            type: DataTypes.DATE,
        },
        intent_degree: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        hot_degree: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        other_staff: {
            type: DataTypes.STRING,
        },
        to_five_time: {
            type: DataTypes.DATE,
        },
        technical_solution: {
            type: DataTypes.STRING,
        },
        solution_remark: {
            type: DataTypes.STRING,
        },
        customer_id: {
            type: DataTypes.INTEGER,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'type_d_info',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
