'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CustomerSign', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        openId: {
            type: DataTypes.STRING
        },
        userId: {
            type: DataTypes.STRING
        },
        signTime: {
            type: DataTypes.DATE
        },
        signLocation: {
            type: DataTypes.STRING
        },
        leaveTime: {
            type: DataTypes.DATE
        },
        leaveLocation: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'customer_sign',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
