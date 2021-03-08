'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('GoodsForYBScore', {
        id:{type:DataTypes.INTEGER(11), autoIncrement:true, primaryKey : true, unique : true},
        goodsName: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        album: {
            type: DataTypes.STRING
        },
        originalScore: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        needScore: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        levelLimit: {
            type: DataTypes.INTEGER,    // 等级分限制
            defaultValue: 0,
        },
        scoreLimit: {
            type: DataTypes.INTEGER,    // 元宝分限制
            defaultValue: 0,
        },
        isVer: {
            type: DataTypes.INTEGER,    // 商务会员限制
            defaultValue: 0,
        },
        isOpen: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        inventory: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: 'goods_for_yb_score',
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}
