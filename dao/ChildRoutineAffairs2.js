'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ChildRoutineAffairs', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        receiver: {
            type: DataTypes.STRING,
        },
        receiverName: {
            type: DataTypes.STRING,
        },
        hasDone: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        cbContent: {
            type: DataTypes.STRING
        },
        cbTime: {
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
        tableName: 'child_routine_affairs',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}