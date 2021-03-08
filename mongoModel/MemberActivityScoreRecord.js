const mongoose = require('./_db').mongoose;
const Schema = require('./_db').Schema;

const MemberActivityScoreRecord = mongoose.model('MemberActivityScoreRecord', new Schema({
    memberId: Schema.Types.String, // openId
    content: Schema.Types.Mixed,
},{
    timestamps: true
}));

module.exports = MemberActivityScoreRecord;