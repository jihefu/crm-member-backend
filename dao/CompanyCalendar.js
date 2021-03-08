'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CompanyCalendar', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        date: {
            type: DataTypes.DATEONLY
        },
        isworkingday: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'company_calendar',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}