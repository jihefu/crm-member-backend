const actionSoftProject = require('../action/homeSoftProject');

module.exports = app => {
	app.get('/support/:projectId', (req, res, next) => {
		// actionSoftProject.getReleaseVersionList(req, res, next);
    });

    app.get('/support/:projectId/:version', (req, res, next) => {
		// actionSoftProject.getReleaseVersion(req, res, next);
    });
}