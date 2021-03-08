'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('FileManage', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        treeId: {
            type: DataTypes.STRING,
        },
        name: {
            type: DataTypes.STRING,
        },
        author: {
            type: DataTypes.STRING,
        },
        insertPerson: {
            type: DataTypes.STRING,
        },
        updateTime: {
            type: DataTypes.DATE,
        },
        fileId: {
            type: DataTypes.STRING,
        },
        link: {
            type: DataTypes.STRING,
        },
        isTable: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isMerage: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        bookMark: {
            type: DataTypes.STRING,
        },
        isHide: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isImportant: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isRelease: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        powerPerson: {
            type: DataTypes.STRING,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'file_manage',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
