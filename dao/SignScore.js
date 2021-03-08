'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SignScore', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        name: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        accu_score: {
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'sign_score',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
