const redisClient = require('./_db').redisClient;
const Staff = require('../dao').Staff;

exports.getCache = (params, cb) => {
    redisClient.get('cacheCustomerInfo', (err, result) => {
        if (err || !result) return cb(null);
        cb(JSON.parse(result));
    });
}

exports.setCache = data => {
    data = JSON.stringify(data);
    redisClient.set('cacheCustomerInfo', data, (err, result) => {});
}

exports.clearCache = () => {
    redisClient.del('cacheCustomerInfo');
}