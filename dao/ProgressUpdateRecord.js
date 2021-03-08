'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ProgressUpdateRecord', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        progressId: {
            type: DataTypes.STRING
        },
        userId: {
            type: DataTypes.STRING
        },
        updateContent: {
            type: DataTypes.STRING
        },
        updateTime: {
            type: DataTypes.DATE
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'progress_update_record',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}