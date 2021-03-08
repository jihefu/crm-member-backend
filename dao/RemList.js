'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('RemList', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        type: {
            type: DataTypes.STRING
        },
        typeId: {
            type: DataTypes.INTEGER
        },
        typeKey: {
            type: DataTypes.STRING
        },
        content: {
            type: DataTypes.STRING
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.DATE
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'rem_list',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
