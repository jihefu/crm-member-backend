'use strict';
var fs = require('fs');
var Sequelize = require('sequelize');

exports.mpSequelize = function () {
	var config = JSON.parse(fs.readFileSync('./config.json').toString());
	return new Sequelize(
		'lj_mp', 
		config.mysql_user, 
		config.mysql_password, 
		{
			dialect: 'mysql',
			host: config.mysql_host,
			port:3306, 
			pool: {
				max: 10,
				min: 0,
				idle: 10000
			},
			logging:false,
			// logging:console.log,
			timezone: '+08:00' //东八时区
		}
	);
}