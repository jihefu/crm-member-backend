'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('AttendanceDate', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        date: {
            type: DataTypes.DATEONLY
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'attendance_date',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
