'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('RegEvent', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        sn: {
            type: DataTypes.INTEGER
        },
        mid: {
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING
        },
        company: {
            type: DataTypes.STRING
        },
        product: {
            type: DataTypes.STRING
        },
        validDate: {
            type: DataTypes.STRING
        },
        regDate: {
            type: DataTypes.STRING
        },
        regCode: {
            type: DataTypes.INTEGER
        },
        authOperKey: {
            type: DataTypes.INTEGER
        },
        isFunReg: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'event',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
