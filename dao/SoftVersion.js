'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SoftVersion', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        versionNo: {
            type: DataTypes.STRING
        },
        package: {
            type: DataTypes.STRING
        },
        packageSize: {
            type: DataTypes.DOUBLE,
            defaultValue: 0
        },
        createDescription: {
            type: DataTypes.STRING
        },
        isRelease: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        createTime: {
            type: DataTypes.DATE
        },
        createPerson: {
            type: DataTypes.STRING
        },
        updateTime: {
            type: DataTypes.DATE
        },
        updatePerson: {
            type: DataTypes.STRING
        },
        testStatus: {
            type: DataTypes.STRING,
            defaultValue: '内测'
        },
        updateType: {
            type: DataTypes.STRING,
            defaultValue: '发布'
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
        tableName: 'soft_version',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
