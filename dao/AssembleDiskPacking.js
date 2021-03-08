'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('AssembleDiskPacking', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        user_id: {
            type: DataTypes.STRING
        },
        contract_id: {
            type: DataTypes.INTEGER
        },
        sn: {
            type: DataTypes.INTEGER
        },
        install_disk_id: {
            type: DataTypes.STRING
        },
        create_person: {
            type: DataTypes.STRING
        },
        create_time: {
            type: DataTypes.DATE
        },
        update_person: {
            type: DataTypes.STRING
        },
        update_time: {
            type: DataTypes.DATE
        },
        isdel: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'assemble_disk_packing',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
