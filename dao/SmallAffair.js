'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SmallAffair', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        cause: {
            type: DataTypes.STRING,
            comment: '事由，包含背景和目的'
        },
        deadline: {
            type: DataTypes.DATEONLY,
            comment: '最后期限'
        },
        summary: {
            type: DataTypes.STRING,
            comment: '总结，队长填写，指派人点击“同意”后完成度100%'
        },
        completionDegree: {
            type: DataTypes.INTEGER,
            defaultValue: 10,
            comment: '完成度百分比进度10%~90%，递增10%，队长手工改'
        },
        relatedAffairs: {
            type: DataTypes.STRING,
            comment: '关联事务，创建时至少一个，编辑时可以增加，本事务的NotiMessage的短信文本抄送到关联事务去'
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'small_affair',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}