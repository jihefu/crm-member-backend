'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SignActivity', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        name: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        time: {
            type: DataTypes.TIME
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'sign_activity',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
