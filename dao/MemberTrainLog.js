'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('MemberTrainLog', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        open_id: {
            type: DataTypes.STRING,
        },
        score: {
            type: DataTypes.INTEGER,
        },
        join_time: {
            type: DataTypes.DATEONLY,
        },
        award_time: {
            type: DataTypes.DATEONLY,
        },
        award_person: {
            type: DataTypes.STRING,
        },
        title: {
            type: DataTypes.STRING,
        },
        content: {
            type: DataTypes.STRING,
        },
        album: {
            type: DataTypes.STRING,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'memebr_train_log',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
