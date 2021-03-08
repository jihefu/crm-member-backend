'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BaseEvent', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        type: {
            type: DataTypes.STRING,
        },
        ownerId: {
            type: DataTypes.STRING,
        },
        time: {
            type: DataTypes.DATE,
        },
        person: {
            type: DataTypes.STRING,
        },
        location: {
            type: DataTypes.STRING,
        },
        rem: {
            type: DataTypes.STRING,
        },
        contentId: {
            type: DataTypes.STRING,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'base_event',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
