'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('RoutineAffairs', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        type: {
            type: DataTypes.STRING
        },
        title: {
            type: DataTypes.STRING
        },
        group_person: {
            type: DataTypes.STRING
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
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
        tableName: 'routine_affairs',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}