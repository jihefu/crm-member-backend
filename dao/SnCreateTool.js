'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SnCreateTool', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        startSn: {
            type: DataTypes.INTEGER,
        },
        endSn: {
            type: DataTypes.INTEGER,
        },
        createPerson: {
            type: DataTypes.STRING,
        },
        createTime: {
            type: DataTypes.DATE,
        },
        msg_id: {
            type: DataTypes.STRING,
        },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'sn_create_tool',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}