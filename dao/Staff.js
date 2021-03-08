'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Staff', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        user_name: {
            type: DataTypes.STRING
        },
        English_name: {
            type: DataTypes.STRING
        },
        English_abb: {
            type: DataTypes.STRING
        },
        user_id: {
            type: DataTypes.STRING
        },
        leader: {
            type: DataTypes.STRING
        },
        seat: {
            type: DataTypes.STRING
        },
        on_job: {
            type: DataTypes.STRING
        },
        in_job_time: {
            type: DataTypes.STRING
        },
        sex: {
            type: DataTypes.STRING
        },
        group: {
            type: DataTypes.STRING
        },
        branch: {
            type: DataTypes.STRING
        },
        position: {
            type: DataTypes.STRING
        },
        duty: {
            type: DataTypes.STRING
        },
        level: {
            type: DataTypes.INTEGER
        },
        laborContractFirstSigningTime: {
            type: DataTypes.DATE
        },
        nation: {
            type: DataTypes.STRING
        },
        birth: {
            type: DataTypes.STRING
        },
        work_phone: {
            type: DataTypes.STRING
        },
        native: {
            type: DataTypes.STRING
        },
        native_adr: {
            type: DataTypes.STRING
        },
        identify: {
            type: DataTypes.STRING
        },
        edu: {
            type: DataTypes.STRING
        },
        school: {
            type: DataTypes.STRING
        },
        pro: {
            type: DataTypes.STRING
        },
        marriage: {
            type: DataTypes.STRING
        },
        wife_child: {
            type: DataTypes.STRING
        },
        employ_way: {
            type: DataTypes.STRING
        },
        qq: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        em_contacter: {
            type: DataTypes.STRING
        },
        em_phone: {
            type: DataTypes.STRING
        },
        leave_job_time: {
            type: DataTypes.STRING
        },
        leave_reason: {
            type: DataTypes.STRING
        },
        work_addr: {
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
        pwd: {
            type: DataTypes.STRING
        },
        open_id: {
            type: DataTypes.STRING
        },
        info_score: {
            type: DataTypes.STRING
        },
        album: {
            type: DataTypes.STRING
        },
        update_person: {
            type: DataTypes.STRING
        },
        update_time: {
            type: DataTypes.STRING
        },
        isdel: {
            type: DataTypes.STRING
        },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'employee',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}




