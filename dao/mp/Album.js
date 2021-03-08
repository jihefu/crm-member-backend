'use strict'

module.exports = function(sequelize,DataTypes){
    return sequelize.define('Album',{
        id: {
            type:DataTypes.INTEGER(11),
            autoIncrement:true,
            primaryKey : true,
            unique : true
        },
        imgUrl: {
            type:DataTypes.STRING,
        },
        imgSender: {
            type:DataTypes.STRING,
        },
        imgSendTime: {
            type:DataTypes.DATE
        },
        isdel:{
            type:DataTypes.INTEGER(11)
        },
        title:{
            type:DataTypes.STRING
        },
        closeDanmu: {
            type:DataTypes.INTEGER(11),
            defaultValue:0
        },
        portrait:{
            type:DataTypes.STRING,
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'album',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    })
}