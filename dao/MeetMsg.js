'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('MeetMsg', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        company: {
            type: DataTypes.STRING,
        },
        contact_name: {
            type: DataTypes.STRING,
        },
        contact_phone: {
            type: DataTypes.STRING,
        },
        purpose: {
            type: DataTypes.STRING,
        },
        addr: {
            type: DataTypes.STRING,
        },
        demand: {
            type: DataTypes.STRING,
        },
        content: {
            type: DataTypes.STRING,
        },
        album: {
            type: DataTypes.STRING(1000),
        },
        last_album_time: {
            type: DataTypes.DATE,
        },
        create_person: {
            type: DataTypes.STRING,
        },
        create_time: {
            type: DataTypes.DATE,
        },
        contact_time: {
            type: DataTypes.DATEONLY,
        },
        director: { type: DataTypes.STRING },
        sale_tag: { type: DataTypes.STRING },
        solution_tag: { type: DataTypes.STRING },
        sn: { type: DataTypes.STRING },
        is_contract_server: { type: DataTypes.INTEGER, defaultValue: 0 },
        contract_no: { type: DataTypes.STRING },
        start_time: { type: DataTypes.TIME },
        end_time: { type: DataTypes.TIME },
        original_work_time: { type: DataTypes.DECIMAL },
        director_work_time: { type: DataTypes.DECIMAL },
        check_work_time: { type: DataTypes.DECIMAL },
        check_rem: { type: DataTypes.STRING },
        check_person: { type: DataTypes.STRING },
        check_time: { type: DataTypes.DATE },
        state: { type: DataTypes.INTEGER, defaultValue: 0 },
        isEffect: { type: DataTypes.INTEGER, defaultValue: 0 },
        service_quality: { type: DataTypes.INTEGER, defaultValue: 0 },
        service_attitude: { type: DataTypes.INTEGER, defaultValue: 0 },
        service_opinion: { type: DataTypes.STRING },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'meet_message',
        charset: 'utf8',
        collate: 'utf8_general_ci',
    });
};
