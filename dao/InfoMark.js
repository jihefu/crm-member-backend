'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('InfoMark', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        type: {
            type: DataTypes.STRING
        },
        tableId: {
            field: 'table_id',
            type: DataTypes.INTEGER
        },
        addPerson: {
            field: 'insert_person',
            type: DataTypes.STRING
        },
        updatePerson: {
            field: 'update_person',
            type: DataTypes.STRING
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
        tableName: 'infoMark',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
