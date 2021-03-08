'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ProjectAffairProgress', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        member: {
            type: DataTypes.STRING,
            comment: '成员'
        },
        division: {
            type: DataTypes.STRING,
            comment: '分工目标，队长填写'
        },
        news: {
            type: DataTypes.STRING,
            comment: '最新进展，自己填写'
        },
        degree: {
            type: DataTypes.INTEGER,
            comment: '完成度0-100，自己评估填写',
            defaultValue: 10
        },
        contribution: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'project_affair_progress',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}