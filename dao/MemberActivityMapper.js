'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('MemberActivityMapper', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        activityId: { type: DataTypes.STRING },
        activityName: { type: DataTypes.STRING },
        type: { type: DataTypes.STRING },
        miniProgramActivityId: { type: DataTypes.STRING },
        album: { type: DataTypes.STRING },
        hostDate: { type: DataTypes.DATEONLY },
        hostDays: { type: DataTypes.INTEGER, defaultValue: 1 },
        headPerson: { type: DataTypes.STRING },
        team: { type: DataTypes.STRING },
        score: { type: DataTypes.INTEGER, defaultValue: 0 },
        create_person: { type: DataTypes.STRING },
        create_time: { type: DataTypes.DATE },
        check_state: { type: DataTypes.INTEGER, defaultValue: 0 },
        add_person: { type: DataTypes.STRING },
        open_id_arr: { type: DataTypes.TEXT },
        check_person: { type: DataTypes.STRING },
        isdel: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'member_activity_mapper',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
