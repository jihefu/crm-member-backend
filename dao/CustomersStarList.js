'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CustomersStarList', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        company: {
            type: DataTypes.STRING
        },
        star: {
            type: DataTypes.INTEGER
        },
        ratingYear: {
            type: DataTypes.STRING
        },
        insertTime: {
            type: DataTypes.DATE
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'customer_star_list',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
