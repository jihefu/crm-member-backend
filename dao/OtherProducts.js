'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OtherProducts', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        serialNo: {
            type: DataTypes.STRING,
        },
        model: {
            type: DataTypes.STRING,
            defaultValue: '',
        },
        standrd: {
            type: DataTypes.STRING,
            defaultValue: '',
        },
        manufacturer: {
            type: DataTypes.STRING,
            defaultValue: '',
        },
        valuation: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        album: {
            type: DataTypes.STRING,
            defaultValue: '',
        },
        insert_person: {
            type: DataTypes.STRING,
            defaultValue: '',
        },
        insert_time: {
            type: DataTypes.DATE,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'other_products',
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
};
