const actionResource = require('../action/resource');

module.exports = app => {
    app.get('/resource/:treeNode*/:targetFile/:targetKey', function(req,res,next) {
		actionResource.getTargetItem(req,res,next);
	});
}