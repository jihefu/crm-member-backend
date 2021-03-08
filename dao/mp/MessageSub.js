'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('MessageSub', {
        id: {
            type:DataTypes.INTEGER(11),
            autoIncrement:true,
            primaryKey : true,
            unique : true
        },
        receiver: {
            type: DataTypes.STRING
        },
        receiverOpenId: {
            type: DataTypes.STRING
        },
        receiverUserId: {
            type: DataTypes.STRING
        },
        replyTime: {
            type: DataTypes.DATE
        },
        replyContent: {
            type: DataTypes.STRING(1000)
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'message_sub',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
