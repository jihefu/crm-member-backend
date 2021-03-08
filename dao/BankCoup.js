'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BankCoup',
        {
            id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
            coupon_no: { type: DataTypes.STRING },
            amount: { type: DataTypes.INTEGER(11), defaultValue: 100 },
            isPower: { field: 'is_power', type: DataTypes.INTEGER(11), defaultValue: 1 },
            endTime: { type: DataTypes.DATEONLY },
            is_assign: { type: DataTypes.INTEGER(11), defaultValue: 0 },
            create_time: { type: DataTypes.DATE },
            create_person: { type: DataTypes.STRING },
            own_id: { type: DataTypes.INTEGER(11), defaultValue: 0 },
        },
        {
            timestamps: false,
            underscored: true,
            freezeTableName: true,
            tableName: 'bank_coup',
            charset: 'utf8',
            collate: 'utf8_general_ci'
        }
    );
}
