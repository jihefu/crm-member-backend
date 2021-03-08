'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ProductOrder', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        serialNo: {
            type: DataTypes.STRING,
            comment: '序列号'
        },
        contract_id: {
            type: DataTypes.INTEGER,
        },
        isReplaced: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: false,
        freezeTableName: true,
        tableName: 'product_order',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
