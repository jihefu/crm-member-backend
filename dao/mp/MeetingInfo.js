'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('MeetingInfo', {
        id: {
            type:DataTypes.INTEGER(11),
            autoIncrement:true,
            primaryKey : true,
            unique : true
        },
        title: {
            type: DataTypes.STRING
        },
        location: {
            type: DataTypes.STRING
        },
        lat: {
            type: DataTypes.STRING
        },
        lon: {
            type: DataTypes.STRING
        },
        startDate: {
            type: DataTypes.DATE
        },
        endDate: {
            type: DataTypes.DATE
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'meeting_info',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
