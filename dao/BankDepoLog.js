'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BankDepoLog',
        {
            id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
            action: {
                type: DataTypes.STRING, // 消费，过期，重新生效，合同关闭删除失效或定价单撤销审核
            },
            no: {
                type: DataTypes.STRING, // 合同号
            },
            use_amount: {
                type: DataTypes.INTEGER(11),
                defaultValue: 0,
            },
            create_time: {
                type: DataTypes.DATE,
            },
        },
        {
            timestamps: false,
            underscored: true,
            freezeTableName: true,
            tableName: 'bank_depo_log',
            charset: 'utf8',
            collate: 'utf8_general_ci',
        }
    );
}
