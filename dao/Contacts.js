'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Contacts', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        abb: {
            type: DataTypes.STRING
        },
        verified: {
            type: DataTypes.STRING
        },
        verifiedPerson: {
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING
        },
        sex: {
            type: DataTypes.STRING
        },
        phone1: {
            type: DataTypes.STRING
        },
        phone2: {
            type: DataTypes.STRING
        },
        company: {
            type: DataTypes.STRING
        },
        tel: {
            type: DataTypes.STRING
        },
        qq: {
            type: DataTypes.STRING
        },
        wx_id: {
            type: DataTypes.STRING
        },
        wx_open_id: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        identify: {
            type: DataTypes.STRING
        },
        witness: {
            type: DataTypes.STRING
        },
        witnessRelation: {
            type: DataTypes.STRING
        },
        relation: {
            type: DataTypes.STRING
        },
        job: {
            type: DataTypes.STRING
        },
        addr: {
            type: DataTypes.STRING
        },
        rem: {
            type: DataTypes.STRING
        },
        insert_person: {
            type: DataTypes.STRING
        },
        insert_time: {
            type: DataTypes.STRING
        },
        album: {
            type: DataTypes.STRING
        },
        info_score: {
            type: DataTypes.STRING
        },
        update_person: {
            type: DataTypes.STRING
        },
        update_time: {
            type: DataTypes.STRING
        },
        typeCode: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        is_member: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isdel: {
            type: DataTypes.INTEGER
        }
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'contacts',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}




