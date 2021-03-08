'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('MemberScore', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        openid: { type: DataTypes.STRING },
        name: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        basic: {
            type: DataTypes.INTEGER
        },
        business: {
            type: DataTypes.INTEGER
        },
        certificate: {
            type: DataTypes.INTEGER
        },
        cooper: {
            type: DataTypes.INTEGER
        },
        activity: {
            type: DataTypes.INTEGER
        },
        total: {
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'vip_score',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
