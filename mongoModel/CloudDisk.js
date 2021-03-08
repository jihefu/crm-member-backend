const mongoose = require('./_db').mongoose;
const Schema = require('./_db').Schema;

const CloudDisk = mongoose.model('CloudDisk', new Schema({
    userId: Schema.Types.Number,                            // user_id
    isCustomer: Schema.Types.Boolean,                       // 是否客户
    docLibId: Schema.Types.Number,                          // 文档id
    docSize: Schema.Types.Number,                           // 文档大小
    galleryId: Schema.Types.Number,                         // 图库id
    gallerySize: Schema.Types.Number,                       // 图库大小
    softId: Schema.Types.Number,                            // 软件id
    softSize: Schema.Types.Number,                          // 软件大小
    installDiskId: Schema.Types.String,                     // 安装盘id
    installDiskSize: Schema.Types.Number,                   // 安装盘大小
    remark: Schema.Types.String,                            // 附言
    isStar: { type: Schema.Types.Boolean, default: false }, // 是否星标
    downloadCount: Schema.Types.Number,                     // 下载次数
    createdPerson: Schema.Types.String,                     // 分享人
    isdel: { type: Schema.Types.Boolean, default: false },  // 是否删除
},{
    timestamps: true
}));

module.exports = CloudDisk;