'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('PublicRelationShip', {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey : true,
            unique : true
        },
        company: {
            type: DataTypes.STRING
        },
        album: {
            type: DataTypes.STRING
        },
        website: { type: DataTypes.STRING },
        relation: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING },
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
        certifiedPerson: {
            type: DataTypes.STRING
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'public_relationship',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
