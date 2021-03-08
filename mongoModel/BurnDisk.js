const mongoose = require('./_db').mongoose;
const Schema = require('./_db').Schema;

const BurnDisk = mongoose.model('BurnDisk', new Schema({
    projectPrimaryId: Schema.Types.Number,                  // 安装包id
    diskName: Schema.Types.String,                          // 盘名
    dependencies: Schema.Types.Mixed,                       // 依赖
    userIds: [Number],                                      // 适用客户id
    remark: Schema.Types.String,                            // 备注
    createdPerson: Schema.Types.String,                     // 创建人
    updatedPerson: Schema.Types.String,                     // 更新人
    isdel: { type: Schema.Types.Boolean, default: false },  // 是否删除
}, {
    timestamps: true
}));

module.exports = BurnDisk;