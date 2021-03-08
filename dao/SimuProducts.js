'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SimuProducts', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        serialNo: {
            type: DataTypes.STRING,
        },
        solution: {
            type: DataTypes.STRING,
        },
        machineModel: {
            type: DataTypes.STRING,
        },
        versionRem: {
            type: DataTypes.STRING,
        },
        spaUrl: {
            type: DataTypes.STRING,
        },
        album: {
            type: DataTypes.STRING,
        },
        isOpen: {
            type: DataTypes.INTEGER,
            defaultValue: 1, 
        },
        insert_person: {
            type: DataTypes.STRING,
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
        tableName: 'simu_products',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
