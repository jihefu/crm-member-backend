'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Member', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        user_id: {
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING
        },
        nick_name: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
        gender: {
            type: DataTypes.STRING
        },
        birth: {
            type: DataTypes.DATE
        },
        qq: {
            type: DataTypes.STRING
        },
        portrait: {
            type: DataTypes.STRING
        },
        addr: {
            type: DataTypes.STRING
        },
        college: {
            type: DataTypes.STRING
        },
        major: {
            type: DataTypes.STRING
        },
        company: {
            type: DataTypes.STRING
        },
        job: {
            type: DataTypes.STRING
        },
        witness: {
            type: DataTypes.STRING
        },
        witnessRelation: {
            type: DataTypes.STRING
        },
        evaluate: {
            type: DataTypes.DECIMAL
        },
        familiar_degree: {
            type: DataTypes.DECIMAL
        },
        tech_match: {
            type: DataTypes.DECIMAL
        },
        check_name: {
            type: DataTypes.INTEGER
        },
        check_phone: {
            type: DataTypes.INTEGER
        },
        check_birth: {
            type: DataTypes.INTEGER
        },
        check_qq: {
            type: DataTypes.INTEGER
        },
        check_portrait: {
            type: DataTypes.INTEGER
        },
        check_addr: {
            type: DataTypes.INTEGER
        },
        check_college: {
            type: DataTypes.INTEGER
        },
        check_major: {
            type: DataTypes.INTEGER
        },
        check_company: {
            type: DataTypes.INTEGER
        },
        check_job: {
            type: DataTypes.INTEGER
        },
        state: {
            type: DataTypes.STRING
        },
        checked: {
            type: DataTypes.INTEGER
        },
        open_id: {
            field: 'openid',
            type: DataTypes.STRING
        },
        unionid: {
            type: DataTypes.STRING
        },
        active_degree: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        last_login_time: {
            type: DataTypes.TIME
        },
        submit_time: {
            type: DataTypes.TIME
        },
        check_time: {
            type: DataTypes.TIME
        },
        check_person: {
            type: DataTypes.STRING
        },
        update_person: {
            type: DataTypes.STRING
        },
        isEnterpriseWx: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isSub: {
            type: DataTypes.INTEGER
        },
        isStaff: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        typeCode: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isEffect: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        bind_id: {
            type: DataTypes.STRING
        },
        isUser: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        mult_company: {
            type: DataTypes.STRING,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'vip_basic',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
