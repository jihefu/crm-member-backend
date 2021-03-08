const url = require('url');
const actionSeckill = require('../action/seckill');

module.exports = app => {
	app.use('/seckill', function (req, res, next) {
		checkUnionId(req, res, next);
	});
	app.get('/seckill/checkStatus', (req, res, next) => {
		actionSeckill.checkStatus(req, res, next);
	});
	app.get('/seckill/checkSuccess', (req, res, next) => {
		actionSeckill.checkSuccess(req, res, next);
	});
	app.post('/seckill/userRequestSeckill', (req, res, next) => {
		actionSeckill.userRequestSeckill(req, res, next);
	});

	function checkUnionId(req, res, next) {
		const { unionid } = req.session;
		if (unionid) {
			next();
		} else {
			res.send({ code: -1, msg: '请重新登陆' });
		}

		// const { unionid } = url.parse(req.url, true).query;
		// req.session.unionid = unionid;
		// next();
	}
}