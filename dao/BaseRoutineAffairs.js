'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BaseRoutineAffairs', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        sender: {
            type: DataTypes.STRING,
        },
        post_time: {
            type: DataTypes.DATE,
        },
        title: {
            type: DataTypes.STRING,
        },
        content: {
            type: DataTypes.STRING,
        },
        readOnly: {
            type: DataTypes.INTEGER
        },
        options: {
            type: DataTypes.STRING
        },
        atSomeone: {
            type: DataTypes.STRING
        },
        doInCenter: {
            type: DataTypes.STRING,
            defaultValue: 0
        },
        completed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        subscriber: {
            type: DataTypes.STRING
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
        tableName: 'base_routine_affairs',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}