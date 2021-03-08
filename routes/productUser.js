const actionProductUser = require('../action/productUser');
const actionService = require('../action/service');

function getOpenId(req, res, next) {
	actionService.checkOpenId(req, res, next, result => {
		if (result.code == 200 || result.code == 100) {
			actionService.checkPerson(req, res, next, result => {
				next();
			});
		} else {
			res.render('./pages/tip', {
				tip: '未知错误，请稍后重试'
			});
		}
	});
}

module.exports = app => {
	app.use('/retail/*', (req, res, next) => {
		getOpenId(req, res, next);
	});
	app.get('/retail/vir/:sn([0-9]+)', (req, res, next) => {
		actionProductUser.showInfo(req, res, next);
	});
	app.get('/retail/vir/fill/:sn([0-9]+)', (req, res, next) => {
		actionProductUser.fillWarranty(req, res, next);
	});
	app.get('/retail/vir/appeal/:sn([0-9]+)', (req, res, next) => {
		actionProductUser.appealPage(req, res, next);
	});
	app.post('/retail/vir/bind/:sn([0-9]+)', (req, res, next) => {
		actionProductUser.bindToVir(req, res, next);
	});
	app.post('/retail/vir/appeal/:sn([0-9]+)', (req, res, next) => {
		actionProductUser.snAppeal(req, res, next);
	});
}