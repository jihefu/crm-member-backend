'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OnlineContactsInfo', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        user_id: {
            type: DataTypes.STRING,
        },
        company: {
            type: DataTypes.STRING,
        },
        total: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        latest_num: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        latest_time: {
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
        tableName: 'online_contacts_info',
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
};
