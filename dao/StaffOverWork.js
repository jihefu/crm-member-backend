'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('StaffOverWork', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        on_time: {
            type: DataTypes.DATE,
            comment: '签到时间'
        },
        off_time: {
            type: DataTypes.DATE,
            comment: '离岗时间'
        },
        on_gps: {
            type: DataTypes.STRING,
            comment: '签到位置'
        },
        off_gps: {
            type: DataTypes.STRING,
            comment: '离岗位置'
        },
        director: {
            type: DataTypes.STRING,
            comment: '指派人'
        },
        reason: {
            type: DataTypes.STRING,
            comment: '加班理由'
        },
        content: {
            type: DataTypes.STRING,
            comment: '加班内容'
        },
        album: {
            type: DataTypes.STRING,
            comment: '照片'
        },
        check: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '审核通过'
        },
        rate: {
            type: DataTypes.DECIMAL(1),
            defaultValue: 1,
            comment: '通过系数'
        },
        rem: {
            type: DataTypes.STRING,
            comment: '通过系数打分备注'
        },
        check_person: {
            type: DataTypes.STRING,
            comment: '审核人'
        },
        check_time: {
            type: DataTypes.DATE,
            comment: '审核时间'
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
        tableName: 'staff_over_work',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
