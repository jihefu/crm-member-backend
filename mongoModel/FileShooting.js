const mongoose = require('./_db').mongoose;
const Schema = require('./_db').Schema;

const FileShooting = mongoose.model('FileShooting', new Schema({
    fileHeadId: Schema.Types.Number,
    newHeadInfo: Schema.Types.Mixed,
    newContent: Schema.Types.Mixed,
    // originalHeadInfo: Schema.Types.Mixed,
    // originalContent: Schema.Types.Mixed,
    shootingTime: Schema.Types.Date,
    shootingPerson: Schema.Types.String,
    rem: Schema.Types.String,
},{
    timestamps: true
}));

module.exports = FileShooting;