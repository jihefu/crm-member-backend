'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BankCoupLog',
        {
            id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
            action: {
                type: DataTypes.STRING, // 消费，过期，恢复
            },
            no: {
                type: DataTypes.STRING, // 合同号
            },
            create_time: {
                type: DataTypes.DATE,
            },
        },
        {
            timestamps: false,
            underscored: true,
            freezeTableName: true,
            tableName: 'bank_coup_log',
            charset: 'utf8',
            collate: 'utf8_general_ci',
        }
    );
}
