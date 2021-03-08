'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('RepairMsg', {
        id: { type: DataTypes.INTEGER(11), autoIncrement: true, primaryKey: true, unique: true },
        sn: { type: DataTypes.STRING },
        admin_id: { type: DataTypes.STRING },
        open_id: { type: DataTypes.STRING },
        name: { type: DataTypes.STRING },
        send_time: { type: DataTypes.DATE },
        content: { type: DataTypes.STRING },
        repair_no: { type: DataTypes.STRING },
        repair_state: { type: DataTypes.STRING },
    },
    {
        underscored: true,
        timestamps: false,
        paranoid: true,
        tableName: 'repair_msg',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}




