'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('VirWarranty', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        sn: {
            type: DataTypes.STRING
        },
        contract_no: {
            type: DataTypes.STRING
        },
        purchase_time: {
            type: DataTypes.DATE
        },
        valid_date: {
            type: DataTypes.DATE
        },
        addr: {
            type: DataTypes.STRING
        },
        valid_range: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        insert_date: {
            type: DataTypes.DATE
        },
        bind_unionid: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'vir_warranty',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
