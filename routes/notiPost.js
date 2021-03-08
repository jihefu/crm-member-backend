const actNotiPost = require('../action/notiPost');

module.exports = function (app) {
	//对外暴露的路由
	app.post('/notiPost/add', function (req, res, next) {
		actNotiPost.notiPostAdd(req, res, next);
	});
	app.put('/notiPost/update', function (req, res, next) {
		actNotiPost.notiPostUpdate(req, res, next);
	});
	app.put('/notiPost/fromCenterUpdate', function (req, res, next) {
		actNotiPost.fromCenterUpdate(req, res, next);
	});
	app.get('/notiPost/fromCenterList', function (req, res, next) {
		actNotiPost.fromCenterList(req, res, next);
	});
	app.put('/notiPost/fromCenterUpdateReply', function (req, res, next) {
		actNotiPost.fromCenterUpdateReply(req, res, next);
	});
	app.put('/notiPost/recall/:mailId', function (req, res, next) {
		actNotiPost.recall(req, res, next);
	});
	app.put('/notiPost/recallApply', function (req, res, next) {
		actNotiPost.recallApply(req, res, next);
	});
	//内部路由
	// app.post('/notiPost/notiMail/add', function (req, res, next) {
	// 	actNotiPost.notiMailAdd(req, res, next);
	// });
}