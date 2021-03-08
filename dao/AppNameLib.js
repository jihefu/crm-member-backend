'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('AppNameLib', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        appName: {
            type: DataTypes.STRING
        },
        score: {
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'app_name_lib',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
