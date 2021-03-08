const mongoose = require('./_db').mongoose;
const Schema = require('./_db').Schema;

const SubEventContent = mongoose.model('SubEventContent', new Schema({
    // 物品入库，物品借用
    borrowType: Schema.Types.String,
    borrowLocation: Schema.Types.String,
    // 物品出库，物品扫描log
    goodsNumbering: Schema.Types.String,
    // 物品借用
    // borrowStartTime: Schema.Types.Date,
    // borrowEndTime: Schema.Types.Date,
    borrowExpectTime: Schema.Types.Date,
    // 物品照片
    goodsAlbum: Schema.Types.String,
    goodsAlbumBirth: Schema.Types.Date,
    rem: Schema.Types.String,

    /**
     * 软件版本管理
     */
    // 发布新版本
    softVersionNo: Schema.Types.String,
    softChildVersionName: Schema.Types.String,
    softPackage: Schema.Types.String,
    softPackageSize: Schema.Types.Number,
    softIsRelease: { type: Schema.Types.Boolean, default: false, },
    softTestStatus: Schema.Types.String,
    softCreateDescription: Schema.Types.String,
    softShareUserId: [String],
    softReplaceId: Schema.Types.Mixed,
    // 发言
    softContent: Schema.Types.String,
    softProjectId: Schema.Types.String,
    // 测评
    softTestAnnex: Schema.Types.String,
    softChangeTestStatus: Schema.Types.Array,   // 0: 原值，1: 现值
    softChangeIsRelease: Schema.Types.Array,    // 0: 原值，1: 现值

    // 事务消息
    notiMailId: Schema.Types.String,
    notiTitle: Schema.Types.String,
    notiPostTime: Schema.Types.String,
    notiContent: Schema.Types.String,
    notiSender: Schema.Types.String,
    notiSenderName: Schema.Types.String,

    // 短信群发log
    smsId: Schema.Types.String,
    smsReceiverId: Schema.Types.String,
    smsParams: Schema.Types.Mixed,
    smsTotalReceiverArr: Schema.Types.Mixed,

    // 会员活动log
    memberActivityType: Schema.Types.String,
    memberActivityTitle: Schema.Types.String,
    memberActivityDate: Schema.Types.Date,
    memberActivityContent: Schema.Types.String,
    memberActivityResult: Schema.Types.String,
    // 培训
    memberTrainScore: Schema.Types.Number,
    memberTrainAlbum: Schema.Types.String,

    // 交易中心
    dealNo: Schema.Types.String,                 // 编号
    dealType: Schema.Types.String,             // 编号类型
    dealTransferor: Schema.Types.String,         // 出让方
    dealTransferorPerson: Schema.Types.String,   // 出让人
    dealTransferee: Schema.Types.String,         // 受让方
    dealTransfereePerson: Schema.Types.String,   // 受让人
    dealCredentials: Schema.Types.String,      // 凭据
    dealCreateType: Schema.Types.String,       // 创建类型
    dealCreatePerson: Schema.Types.String,     // 创建人
},{
    timestamps: true
}));

module.exports = SubEventContent;