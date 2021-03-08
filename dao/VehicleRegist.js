'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('VehicleRegist', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        car_no: {
            type: DataTypes.STRING
        },
        user_id: {
            type: DataTypes.STRING
        },
        take_time: {
            type: DataTypes.DATE
        },
        take_mile: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        back_time: {
            type: DataTypes.DATE
        },
        back_mile: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        reason: {
            type: DataTypes.STRING
        },
        use_mile: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        create_time: {
            type: DataTypes.DATE
        },
        update_time: {
            type: DataTypes.DATE
        },
        album: {
            type: DataTypes.STRING
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
        tableName: 'vehicle_regist',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
