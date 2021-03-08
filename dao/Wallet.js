'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Wallet', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        user_id: {
            type: DataTypes.STRING,
            comment: '客户号'
        },
        total_amount: {
            type: DataTypes.DECIMAL(11,2),
            comment: '金额',
            defaultValue: 0.00
        },
        yb_score: {
            type: DataTypes.INTEGER,
            comment: '元宝分',
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'wallet',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
