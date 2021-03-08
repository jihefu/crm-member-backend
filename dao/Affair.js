'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('NotiClientAffairGroup', {
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING,
            comment: '事务名称'
        },
        priority: {
            type: DataTypes.STRING,
            defaultValue: '普通',
            comment: '优先级，紧急/重要/普通/暂缓'
        },
        state: {
            type: DataTypes.STRING,
            defaultValue: '进行中',
            comment: '状态，草拟/进行中/已完成/关闭'
        },
        team: {
            type: DataTypes.STRING,
            comment: '工作团队，第一个为队长负责人'
        },
        attentionStaff: {
            type: DataTypes.STRING,
            comment: '关注的员工'
        },
        outerContact: {
            type: DataTypes.STRING,
            comment: '外部联系人'
        },
        readAuth: {
            type: DataTypes.STRING,
            comment: '阅读授权，是否开放给外部联系人看到'
        },
        secret: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '是否保密，即只有团队可读'
        },
        customerId: {
            type: DataTypes.STRING
        },
        viewOrder: {
            type: DataTypes.INTEGER
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.DATE
        },
        update_person: {
            type: DataTypes.STRING
        },
        update_time: {
            type: DataTypes.DATE
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'affair',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}