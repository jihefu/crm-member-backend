'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SoftProject', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        projectId: {
            type: DataTypes.STRING
        },
        projectTitle: {
            type: DataTypes.STRING
        },
        usage: {
            type: DataTypes.STRING
        },
        firstCls: {
            type: DataTypes.STRING
        },
        secondCls: {
            type: DataTypes.STRING
        },
        developTeam: {
            type: DataTypes.STRING
        },
        createTime: {
            type: DataTypes.DATE
        },
        createPerson: {
            type: DataTypes.STRING
        },
        dependOtherProject: {
            type: DataTypes.STRING
        },
        tags: {
            type: DataTypes.STRING
        },
        IDE: {
            type: DataTypes.STRING
        },
        lang: {
            type: DataTypes.STRING
        },
        runType: {
            type: DataTypes.STRING
        },
        album: {
            type: DataTypes.STRING
        },
        isStar: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        relatedAffair: {
            type: DataTypes.STRING
        },
        document: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'soft_project',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
