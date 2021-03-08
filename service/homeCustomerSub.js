const serviceHomeCustomers = require('./homeCustomers');
const cacheCustomerInfo = require('../cache/cacheCustomerInfo');
const log4js = require('log4js');


process.on('message', data => {
    global.LOG = function(info) {
        log4js.getLogger('log_file').debug(info);
        console.log(info);
    };
    global.CONFIG = data.CONFIG;
    serviceHomeCustomers.refreshCustomerCache(result => {
        process.send({});
        process.exit();
	});
});