'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ItemScore', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        name: {
            type: DataTypes.FLOAT
        },
        phone: {
            type: DataTypes.FLOAT
        },
        gender: {
            type: DataTypes.FLOAT
        },
        birth: {
            type: DataTypes.FLOAT
        },
        qq: {
            type: DataTypes.FLOAT
        },
        portrait: {
            type: DataTypes.FLOAT
        },
        addr: {
            type: DataTypes.FLOAT
        },
        college: {
            type: DataTypes.FLOAT
        },
        major: {
            type: DataTypes.FLOAT
        },
        evaluate: {
            type: DataTypes.INTEGER
        },
        basic: {
            type: DataTypes.INTEGER
        },
        company: {
            type: DataTypes.INTEGER
        },
        legal_person: {
            type: DataTypes.FLOAT
        },
        reg_person: {
            type: DataTypes.FLOAT
        },
        developer: {
            type: DataTypes.FLOAT
        },
        purchaser: {
            type: DataTypes.FLOAT
        },
        finance: {
            type: DataTypes.FLOAT
        },
        other: {
            type: DataTypes.FLOAT
        },
        sign: {
            type: DataTypes.INTEGER
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'item_score',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
