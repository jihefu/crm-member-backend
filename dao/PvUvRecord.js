'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('PvUvRecord', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        date: {
            type: DataTypes.DATEONLY
        },
        web_pv: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        wx_uv: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'pv_uv_record',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
