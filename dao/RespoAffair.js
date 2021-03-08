'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('RespoAffair', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        department: {
            type: DataTypes.STRING,
            comment: '所属部门，随team第一个人所在部门'
        },
        resposibility: {
            type: DataTypes.STRING,
            comment: '职责描述'
        },
        labels: {
            type: DataTypes.STRING,
            comment: '关键词标签'
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'respo_affair',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}