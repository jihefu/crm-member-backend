'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('StaffAbsenceReason', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        description: {
            type: DataTypes.STRING,
            comment: '请假描述',
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'staff_absence_reason',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
