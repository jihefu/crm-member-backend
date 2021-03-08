'use strict';

const mpSequelize = require('./_db').mpSequelize();
const Users = mpSequelize.import('./Users.js');
const MeetingInfo = mpSequelize.import('./MeetingInfo.js');
const MeetingSchedule = mpSequelize.import('./MeetingSchedule.js');
const Origanizer = mpSequelize.import('./Origanizer.js');
const MeetingNews = mpSequelize.import('./MeetingNews.js');
const SignInfo = mpSequelize.import('./SignInfo.js');
const Appeal = mpSequelize.import('./Appeal.js');
const Message = mpSequelize.import('./Message.js');
const MessageSub = mpSequelize.import('./MessageSub.js');
const Album = mpSequelize.import('./Album.js')
const Discuss = mpSequelize.import('./Discuss.js')

Message.hasMany(MessageSub);
MessageSub.belongsTo(Message);

Album.hasMany(Discuss);
Discuss.belongsTo(Album)

// 同步模型到数据库中
mpSequelize.sync({force: false});

exports.mpSequelize = mpSequelize;
exports.Users = Users;
exports.MeetingInfo = MeetingInfo;
exports.MeetingSchedule = MeetingSchedule;
exports.Origanizer = Origanizer;
exports.MeetingNews = MeetingNews;
exports.SignInfo = SignInfo;
exports.Appeal = Appeal;
exports.Message = Message;
exports.MessageSub = MessageSub;
exports.Album = Album
exports.Discuss = Discuss