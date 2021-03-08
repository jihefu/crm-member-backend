'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('KnowledgeTree', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        name: {
            type: DataTypes.STRING
        },
        mainId: {
            field: 'supId',
            type: DataTypes.STRING
        },
        index: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        affairId: {
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
        tableName: 'knowledge_tree',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
