'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('EndUser', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey : true,
            unique : true
        },
        user_name: {
            type: DataTypes.STRING
        },
        album: {
            type: DataTypes.STRING
        },
        industry: {
            type: DataTypes.STRING
        },
        use_product: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        sn: { type: DataTypes.STRING(3000) },
        rem: {
            type: DataTypes.STRING
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.DATE
        },
        update_time: {
            type: DataTypes.DATE
        },
        update_person: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        certified: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'end_user',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
