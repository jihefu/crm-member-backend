'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BankDepo',
        {
            id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
            contract_no: { type: DataTypes.STRING },
            amount: { type: DataTypes.INTEGER(11), defaultValue: 0 },
            original_amount: { type: DataTypes.INTEGER(11), defaultValue: 0 },
            isPower: { field: 'is_power', type: DataTypes.INTEGER(11), defaultValue: 1 },
            endTime: { type: DataTypes.DATEONLY },
            create_time: { type: DataTypes.DATE },
            create_person: { type: DataTypes.STRING },
            own_id: { type: DataTypes.INTEGER(11), defaultValue: 0 },
            isdel: { type: DataTypes.INTEGER(11), defaultValue: 0 },
        },
        {
            timestamps: false,
            underscored: true,
            freezeTableName: true,
            tableName: 'bank_depo',
            charset: 'utf8',
            collate: 'utf8_general_ci'
        }
    );
}
