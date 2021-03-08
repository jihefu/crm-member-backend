'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('YearCouponIsCreated', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        year: {
            type: DataTypes.STRING
        },
        user_id: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'year_coupon_is_created',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
