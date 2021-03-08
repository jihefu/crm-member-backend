'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BankMemberScore',
        {
            id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
            score: { type: DataTypes.INTEGER(11), defaultValue: 0 },
            create_person: { type: DataTypes.STRING },
            create_time: { type: DataTypes.DATE },
            rem: { type: DataTypes.STRING },
            event_code: { type: DataTypes.INTEGER(11), defaultValue: 0 },
            own_id: { type: DataTypes.INTEGER(11), defaultValue: 0 },
        },
        {
            timestamps: false,
            underscored: true,
            freezeTableName: true,
            tableName: 'bank_member_score',
            charset: 'utf8',
            collate: 'utf8_general_ci'
        }
    );
}
