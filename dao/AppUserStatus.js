'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('AppUserStatus', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        user_id: {
            type: DataTypes.STRING
        },
        user_name: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        login_time: {
            type: DataTypes.DATE
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'app_user_status',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
