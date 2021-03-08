'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Payment', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        company: {
            type: DataTypes.STRING
        },
        abb: {
            type: DataTypes.STRING
        },
        method: {
            type: DataTypes.STRING
        },
        img: {
            type: DataTypes.STRING
        },
        arrival: {
            type: DataTypes.DATE
        },
        amount: {
            type: DataTypes.DECIMAL
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.TIME
        },
        update_person: {
            type: DataTypes.STRING
        },
        update_time: {
            type: DataTypes.TIME
        },
        isdel: {
            type: DataTypes.INTEGER
        },
        isAssign: {
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'payment',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
