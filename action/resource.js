var url = require('url');
var serviceResource = require('../service/resource');

this.getTargetItem = (req, res, next) => {
    const params = req.params;
    serviceResource.getTargetItem(params, result => {
        res.send(result);
    });
}