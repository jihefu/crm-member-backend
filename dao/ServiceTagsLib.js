'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ItemScore', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        name: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING
        },
        base_score: {
            type: DataTypes.INTEGER
        },
        incremental_score: {
            type: DataTypes.INTEGER
        },
        isdel: {
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'service_tags_lib',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
