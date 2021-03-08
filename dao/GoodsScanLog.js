'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('goodsScanLog', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        userId: {
            type: DataTypes.STRING
        },
        scanTime: {
            type: DataTypes.DATE
        },
        numbering: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'goods_scan_log',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
