'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('TreeIdToAffairId', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        affairId: {
            type: DataTypes.STRING,
        },
        treeId: {
            type: DataTypes.STRING,
        },
        
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'tree_id_to_affair_id',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
