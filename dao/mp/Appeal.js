'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Appeal', {
        id: {
            type:DataTypes.INTEGER(11),
            autoIncrement:true,
            primaryKey : true,
            unique : true
        },
        userName: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        content: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'appeal',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
