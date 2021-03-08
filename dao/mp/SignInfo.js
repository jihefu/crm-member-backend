'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('SignInfo', {
        id:{
            type:DataTypes.INTEGER(11), 
            autoIncrement:true, 
            primaryKey : true, 
            unique : true
        },
        userId: {
            type: DataTypes.STRING
        },
        userName: {
            type: DataTypes.STRING
        },
        openId: {
            type: DataTypes.STRING
        },
        isSign: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        payState: {
            type: DataTypes.STRING,
            defaultValue: '未缴费'
        },
        payRem: {
            type: DataTypes.STRING,
        },
        isArrival: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        hotelRoom: {
            type: DataTypes.STRING
        },
        needSingleRoom: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        adultNum: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        kidsNum: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        transportation: {
            type: DataTypes.STRING,
            defaultValue: '火车'
        },
        transportationNo: {
            type: DataTypes.STRING
        },
        destination: {
            type: DataTypes.STRING
        },
        expectedArrivalTime: {
            type: DataTypes.DATE
        },
        needPickUp: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        pickUpPhone: {
            type: DataTypes.STRING
        },
        isJoinParty: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isCheck:{
            type:DataTypes.INTEGER,
            defaultValue:0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'sign_info',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
