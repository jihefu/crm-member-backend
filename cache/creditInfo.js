const redisClient = require('./_db').redisClient;
const Staff = require('../dao').Staff;
const ctrlPayments = require('../controllers/payments');

exports.getCache = (req, res, next) => {
    const params = JSON.parse(req.body.models);
	const page = params.page ? parseInt(params.page) : 1;
	const num = params.pageSize ? parseInt(params.pageSize) : 30;
	const keywords = params.keywords ? params.keywords : '';
	const filter = params.filter ? params.filter: {
		group: '',
		level: '',
		credit_qualified: '',
    };
    
    redisClient.get('credit', (err, result) => {
        // return next();
        if (err || !result) return next();
        result = JSON.parse(result);
        new Promise(resolve => {
            if (keywords != '') result = result.filter(items => items.company.indexOf(keywords) !== -1);
            if (filter.level != '') result = result.filter(items => filter.level.split(',').indexOf(items.level) !== -1);
            if (filter.credit_qualified != '') result = result.filter(items => filter.credit_qualified.split(',').indexOf(String(items.credit_qualified)) !== -1);
            if (filter.group != '') {
                Staff.findAll({where: {isdel: 0,}}).then(staffArr => {
                    const hzArr = [ '杭州组' ], jnArr = [ '济南组' ];
                    staffArr.forEach(items => {
                        if (items.group == '杭州组') {
                            hzArr.push(items.user_name);
                        } else {
                            jnArr.push(items.user_name);
                        }
                    });
                    if (filter.group.indexOf('济南组') !== -1) {
                        result = result.filter(items => jnArr.indexOf(items.manager) !== -1);
                    }
                    if (filter.group.indexOf('杭州组') !== -1) {
                        result = result.filter(items => hzArr.indexOf(items.manager) !== -1);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        }).then(async () => {
            const total = result.length;
            result = await ctrlPayments.filterMarkItem(result);
            res.send({
                code: 200,
                data: result.splice((page-1) * num,num),
                total,
            });
        });
    });
}

exports.setCache = data => {
    data = JSON.stringify(data);
    redisClient.set('credit', data, (err, result) => {});
}

exports.clearCache = () => {
    redisClient.del('credit');
}