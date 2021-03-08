'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('VerUnitTel', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        name: {
            type: DataTypes.STRING
        },
        tel: {
            type: DataTypes.STRING
        },
        ver_unit_id: {
            type: DataTypes.INTEGER
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'ver_unit_tel',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
