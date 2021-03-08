'use strict'

module.exports = function(sequelize,DataTypes){
    return sequelize.define('Discuss',{
        id: {
            type:DataTypes.INTEGER(11),
            autoIncrement:true,
            primaryKey : true,
            unique : true
        },
        discussOpenid:{
            type:DataTypes.STRING
        },
        portrait:{
            type:DataTypes.STRING
        },
        isLike:{
            type:DataTypes.INTEGER(11)
        },
        content:{
            type:DataTypes.STRING
        },
        discussTime:{
            type:DataTypes.DATE
        },
        likeTime:{
            type:DataTypes.DATE
        }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'discuss',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    })
}