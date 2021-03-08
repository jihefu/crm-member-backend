'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Origanizer', {
        id: {
            type:DataTypes.INTEGER(11),
            autoIncrement:true,
            primaryKey : true,
            unique : true
        },
        userId: {
            type: DataTypes.INTEGER
        },
        userName: {
            type: DataTypes.STRING
        },
        job: {
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
        tableName: 'origanizer',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
