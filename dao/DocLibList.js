'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('DocLibList', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        treeId: {
            type: DataTypes.STRING,
        },
        name: {
            type: DataTypes.STRING,
        },
        suffixName: {
            type: DataTypes.STRING,
        },
        originalName: {
            type: DataTypes.STRING,
        },
        bookMark: {
            type: DataTypes.STRING,
        },
        isImportant: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        insertPerson: {
            type: DataTypes.STRING,
        },
        insertTime: {
            type: DataTypes.DATE,
        },
        updatePerson: {
            type: DataTypes.STRING,
        },
        updateTime: {
            type: DataTypes.DATE,
        },
        isHide: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isRelease: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        masterId: {
            type: DataTypes.INTEGER,
        },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'doc_lib_list',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
