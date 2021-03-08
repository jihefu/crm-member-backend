'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('MeetingSchedule', {
        id: {
            type:DataTypes.INTEGER(11),
            autoIncrement:true,
            primaryKey : true,
            unique : true
        },
        setTime: {
            type: DataTypes.DATE
        },
        endTime: {
            type: DataTypes.DATE
        },
        title: {
            type: DataTypes.STRING
        },
        content: {
            type: DataTypes.STRING(1000)
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'meeting_schedule',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
