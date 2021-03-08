var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');
const openService = require('../service/open');

module.exports = function (app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use('*', function (req, res, next) {
    req.session._garbage = Date();
    req.session.touch();
    next();
  });
  app.get('/', function (req, res, next) {
    openService.recordPVAndUV({ type: 'web' });
    res.sendfile(DIRNAME + '/web/index.html');
  });
  require('./service')(app);
  require('./admin')(app);
  require('./m_admin')(app);
  require('./products')(app);
  require('./inputInfo')(app);
  require('./test_machine')(app);
  require('./member')(app);
  require('./message')(app);
  require('./contract')(app);
  require('./sms')(app);
  require('./repair')(app);
  require('./knowledge')(app);
  require('./common')(app);
  require('./greeting')(app);
  require('./call')(app);
  require('./hybrid_app')(app);
  require('./m_staff')(app);
  require('./file_upload')(app);
  require('./customers')(app);
  require('./creditTrend')(app);
  require('./home')(app);
  require('./notiPost')(app);
  require('./cusApp')(app);
  require('./miniProgram')(app);
  require('./support')(app);
  require('./resource')(app);
  require('./api')(app);
  require('./open')(app);
  require('./productUser')(app);
  require('./seckill')(app);
};