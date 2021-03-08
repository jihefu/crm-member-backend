'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ContractsBody', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        contract_no: {
            type: DataTypes.STRING
        },
        goods_type: {
            type: DataTypes.STRING
        },
        goods_name: {
            type: DataTypes.STRING
        },
        goods_spec: {
            type: DataTypes.STRING
        },
        goods_num: {
            type: DataTypes.INTEGER
        },
        goods_price: {
            type: DataTypes.FLOAT
        },
        goods_ded_rate: {
            type: DataTypes.DECIMAL(11,2)
        },
        rem: {
            type: DataTypes.TEXT
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'contracts_body',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
