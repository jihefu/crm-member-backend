'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('GallerySub', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        album: {
            type: DataTypes.STRING,
        },
        size: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        shootingTime: {
            type: DataTypes.DATE,
        },
        description: {
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
        tableName: 'gallery_sub',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
