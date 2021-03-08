'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SoftEvaluation', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        testPerson: {
            type: DataTypes.STRING
        },
        testTime: {
            type: DataTypes.DATE
        },
        testOpinion: {
            type: DataTypes.STRING
        },
        testAnnex: {
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
        tableName: 'soft_evaluation',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
