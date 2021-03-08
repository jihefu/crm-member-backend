'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Products', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        serialNo: {
            field: 'serialNo',
            type: DataTypes.STRING,
            comment: '序列号'
        },
        model: {
            type: DataTypes.STRING,
            comment: '型号'
        },
        validTime: {
            type: DataTypes.STRING,
        },
        latestRegNo: {
            type: DataTypes.STRING,
        },
        regAuth: {
            type: DataTypes.STRING,
        },
        regAppName: {
            type: DataTypes.STRING,
        },
        appVersion: {
            type: DataTypes.STRING,
        },
        appValidTime: {
            type: DataTypes.STRING,
        },
        appRegCode: {
            type: DataTypes.STRING,
        },
        appRegAuth: {
            type: DataTypes.STRING,
        },
        fwVer: {
            type: DataTypes.STRING,
        },
        regVer: {
            type: DataTypes.STRING,
        },
        dealer: {
            type: DataTypes.STRING,
        },
        salesman: {
            type: DataTypes.STRING,
        },
        endUser: {
            type: DataTypes.STRING,
        },
        oemUser: {
            type: DataTypes.INTEGER,
        },
        authType: {
            type: DataTypes.STRING,
        },
        VBGN: {
            type: DataTypes.STRING,
        },
        VEND: {
            type: DataTypes.STRING,
        },
        machineNo: {
            type: DataTypes.STRING,
        },
        maker: {
            type: DataTypes.STRING,
        },
        tester: {
            type: DataTypes.STRING,
        },
        chnlNum: {
            type: DataTypes.STRING,
        },
        caliCoeff: {
            type: DataTypes.STRING,
        },
        ad2Mode: {
            type: DataTypes.STRING,
        },
        pulseMode: {
            type: DataTypes.STRING,
        },
        vibFreq: {
            type: DataTypes.STRING,
        },
        vibAmp: {
            type: DataTypes.STRING,
        },
        SPWM_AC_AMP: {
            type: DataTypes.STRING,
        },
        SSI_MODE: {
            type: DataTypes.STRING,
        },
        HOURS: {
            type: DataTypes.STRING,
        },
        EMP_NO: {
            type: DataTypes.STRING,
        },
        HOURS: {
            type: DataTypes.STRING,
        },
        EMP_NO: {
            type: DataTypes.STRING,
        },
        remark: {
            type: DataTypes.STRING,
        },
        dealer_endUser: {
            type: DataTypes.STRING,
        },
        dealer_remark: {
            type: DataTypes.STRING,
        },
        inputDate: {
            type: DataTypes.STRING,
        },
        inputPerson: {
            type: DataTypes.STRING,
        },
        update_time: {
            type: DataTypes.STRING,
        },
        update_person: {
            type: DataTypes.STRING,
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValues: 0
        },
        isTest: {
            type: DataTypes.INTEGER,
            defaultValues: 0
        },
        isPass: {
            type: DataTypes.INTEGER,
            defaultValues: 0
        },
        notPassRem: {
            type: DataTypes.STRING,
        },
        testTime: {
            type: DataTypes.DATE,
        },
        state: {
            type: DataTypes.STRING,
        },
        type: {
            type: DataTypes.STRING,
        },
        tongdao: {
            type: DataTypes.STRING,
        },
        modelCode: {
            type: DataTypes.STRING,
        },
        batch: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.STRING,
        },
        storage: {
            type: DataTypes.STRING,
        },
        scrappedRem: {
            type: DataTypes.STRING,
        },
        max_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        user_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        GP0: {
            type: DataTypes.STRING,
        },
        GP1: {
            type: DataTypes.STRING,
        },
        GP2: {
            type: DataTypes.STRING,
        },
        GP3: {
            type: DataTypes.STRING,
        },
        GP4: {
            type: DataTypes.STRING,
        },
        GP5: {
            type: DataTypes.STRING,
        },
    },
    {
        timestamps: false,
        underscored: false,
        freezeTableName: true,
        tableName: 'table_card',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
