'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('goodsBorrowRecords', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        borrower: {
            type: DataTypes.STRING,
            comment: "责任人"
        },
        borrowStartTime: {
            type: DataTypes.DATEONLY,
            comment: "借用起始时间"
        },
        borrowEndTime: {
            type: DataTypes.DATEONLY,
            comment: "借用归还时间"
        },
        type: {
            type: DataTypes.STRING,
            comment: "责任类型"
        },
        location: {
            type: DataTypes.STRING,
            comment: "存放点"
        },
        taker: {
            type: DataTypes.STRING,
            comment: "转手人"
        },
        borrowExpectTime: {
            type: DataTypes.DATEONLY,
            comment: "归还截止日期"
        },
        rem: {
            type: DataTypes.STRING,
            comment: "备注"
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'goods_borrow_records',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
