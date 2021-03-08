'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('WalletLogs', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        action: {
            type: DataTypes.STRING,
            comment: '动作'
        },
        detail: {
            type: DataTypes.STRING,
            comment: '详细动作'
        },
        amount: {
            type: DataTypes.DECIMAL(11,2),
            comment: '金额',
            defaultValue: 0.00
        },
        numbering: {
            type: DataTypes.STRING,
            comment: '编号'
        },
        type: {
            type: DataTypes.STRING,
            comment: '类型'
        },
        time: {
            type: DataTypes.DATE,
            comment: '操作时间'
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'wallet_logs',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
