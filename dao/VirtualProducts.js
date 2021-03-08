'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('VirtualProducts', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        serialNo: {
            type: DataTypes.STRING,
            comment: '序列号'
        },
        model: {
            type: DataTypes.STRING,
            comment: '型号'
        },
        contractNo: {
            type: DataTypes.STRING,
            comment: '合同号'
        },
        insertTime: {
            type: DataTypes.DATE,
            comment: '创建时间'
        },
    },
    {
        timestamps: false,
        underscored: false,
        freezeTableName: true,
        tableName: 'virtual_products',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
