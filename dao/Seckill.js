'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Seckill', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        goods_id: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        plan_inventory: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        inventory: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        start_time: {
            type: DataTypes.DATE,
        },
        survive_time: {
            type: DataTypes.INTEGER,    // 存活时间，开始后多久结束，单位秒
            defaultValue: 0,
        },
        is_end: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        winner: {
            type: DataTypes.STRING,
        },
        update_person: {
            type: DataTypes.STRING,
        },
        update_time: {
            type: DataTypes.DATE,
        },
        create_person: {
            type: DataTypes.STRING,
        },
        create_time: {
            type: DataTypes.DATE,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'seckill',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
