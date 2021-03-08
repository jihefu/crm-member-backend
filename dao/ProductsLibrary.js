'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ProductsLibrary', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        product_type: {
            type: DataTypes.STRING
        },
        product_group: {
            type: DataTypes.STRING
        },
        product_name: {
            type: DataTypes.STRING
        },
        product_price: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        work_hours: {
            type: DataTypes.DECIMAL(11, 2),
            defaultValue: 0
        },
        product_rem: {
            type: DataTypes.STRING
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.DATE
        },
        update_person: {
            type: DataTypes.STRING
        },
        update_time: {
            type: DataTypes.DATE
        },
        count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        is_group: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: false,
        freezeTableName: true,
        tableName: 'products_library',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
