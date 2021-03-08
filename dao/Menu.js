'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Menu', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        title: {
            type: DataTypes.STRING
        },
        menuId: {
            type: DataTypes.INTEGER
        },
        source: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'menu',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}