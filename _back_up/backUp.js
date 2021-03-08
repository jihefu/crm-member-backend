const mysqlBackUp = require('./mysqlBack').exec;
const mongoBackUp = require('./mongoBack').exec;
const schedule = require('node-schedule');

const rule = new schedule.RecurrenceRule();
rule.hour = [0, 6, 12, 18];
schedule.scheduleJob(rule, function () {
    mysqlBackUp();
    mongoBackUp();
});