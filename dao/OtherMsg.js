'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OtherMsg', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        company: {
            type: DataTypes.STRING,
        },
        contact_name: {
            type: DataTypes.STRING,
        },
        contact_phone: {
            type: DataTypes.STRING,
        },
        type: {
            type: DataTypes.STRING,
        },
        content: {
            type: DataTypes.STRING,
        },
        album: {
            type: DataTypes.STRING(1000),
        },
        create_person: {
            type: DataTypes.STRING,
        },
        contact_time: {
            type: DataTypes.DATEONLY,
        },
        create_time: {
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
        tableName: 'other_message',
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
};
