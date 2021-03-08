'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Tags', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        tag: {
            type: DataTypes.STRING,
            comment: '标签'
        },
        type: {
            type: DataTypes.STRING,
            comment: '类型'
        },
        basic_freq: {
            type: DataTypes.INTEGER,
            comment: '基础分'
        },
        acc_freq: {
            type: DataTypes.INTEGER,
            comment: '增量分'
        },
        isdel: {
            type: DataTypes.INTEGER,
            comment: '是否删除',
            defaultValue: 0
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'cus_tags_lib',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
