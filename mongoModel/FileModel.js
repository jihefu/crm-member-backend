const mongoose = require('./_db').mongoose;
const Schema = require('./_db').Schema;

const FileModel = mongoose.model('File', new Schema({
    content: Schema.Types.Mixed,
},{
    timestamps: true
}));

module.exports = FileModel;