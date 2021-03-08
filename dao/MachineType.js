'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('MachineType', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        name: {
            type: DataTypes.STRING,
        },
        index: {
            type: DataTypes.INTEGER,
        },
        sup_id: {
            type: DataTypes.INTEGER,
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
        tableName: 'machine_type',
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
};
