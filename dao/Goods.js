'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Goods', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        numbering: {
            type: DataTypes.STRING,
            comment: "编号"
        },
        goodsName: {
            type: DataTypes.STRING,
            comment: "名称"
        },
        goodsType: {
            type: DataTypes.STRING,
            comment: "分类"
        },
        model: {
            type: DataTypes.STRING,
            comment: "规格型号"
        },
        serialNo: {
            type: DataTypes.STRING,
            comment: "序列号"
        },
        fromMethod: {
            type: DataTypes.STRING,
            comment: "来源"
        },
        proof: {
            type: DataTypes.STRING,
            comment: "入库单据"
        },
        purchaseTime: {
            type: DataTypes.DATEONLY,
            comment: "使用时间"
        },
        originalValue: {
            type: DataTypes.DECIMAL(10,2),
            defaultValue: 0,
            comment: "原值"
        },
        presentValue: {
            type: DataTypes.DECIMAL(10,2),
            defaultValue: 0,
            comment: "现值"
        },
        isBorrow: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: "允许借用"
        },
        management: {
            type: DataTypes.STRING,
            comment: "管理部门"
        },
        manager: {
            type: DataTypes.STRING,
            comment: "管理人"
        },
        user: {
            type: DataTypes.STRING,
            comment: "使用人"
        },
        location: {
            type: DataTypes.STRING,
            comment: "存放地点"
        },
        album: {
            type: DataTypes.STRING,
            comment: "照片",
            allowNull: false,
            defaultValue: ''
        },
        insertPerson: {
            type: DataTypes.STRING,
            comment: "入库人"
        },
        insertTime: {
            type: DataTypes.DATEONLY,
            comment: "入库时间"
        },
        borrowStatus: {
            type: DataTypes.STRING,
            comment: "借用状态"
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: "已出库"
        },
        delRem: {
            type: DataTypes.STRING,
            comment: "出库去处"
        },
        updatePerson: {
            type: DataTypes.STRING,
            comment: "更新人"
        },
        updateTime: {
            type: DataTypes.DATE,
            comment: "更新时间"
        },
        albumUpdateTime: {
            type: DataTypes.DATE,
            comment: "照片更新时间"
        },
        mainId: {
            type:DataTypes.INTEGER(11),
            comment: "主体id"
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'goods',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
