'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Gallery', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        treeId: {
            type: DataTypes.STRING,
        },
        name: {
            type: DataTypes.STRING,
        },
        // album: {
        //     type: DataTypes.STRING(3000),
        // },
        bookMark: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.STRING,
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
        isImportant: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        shareUserId: {
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
        tableName: 'gallery',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
