const mysql = require('mysql');
const fs = require('fs');
const bluebird = require('bluebird');
const schedule = require("node-schedule");

const DATEBASE = 'lj_node';
const ROOTDIR = 'D:/_MYSQL_BACK_UP/' + DATEBASE;

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '437612langjie',
    database: 'lj_node',
});

//执行创建连接
connection.connect();

async function exec() {
    console.time('mysqlBackup');
    const y = new Date().getFullYear();
    const m = new Date().getMonth() + 1;
    const d = new Date().getDate();
    const h = new Date().getHours();
    const dateFile = y + '-' + m + '-' + d;

    const isDateExist = fs.existsSync(ROOTDIR + '/' + dateFile);
    if (!isDateExist) {
        fs.mkdirSync(ROOTDIR + '/' + dateFile);
    }
    const isHoursExist = fs.existsSync(ROOTDIR + '/' + dateFile + '/' + h);
    if (!isHoursExist) {
        fs.mkdirSync(ROOTDIR + '/' + dateFile + '/' + h);
    }

    let tableArr = await new Promise(resolve => {
        connection.query('SHOW TABLES FROM ' + DATEBASE, (err, result) => {
            resolve(result);
        });
    });
    tableArr = tableArr.map(items => items.Tables_in_lj_node);
    await bluebird.map(tableArr, async tableName => {
        const sqlStr = 'SELECT * FROM ' + tableName + ' INTO OUTFILE "' + ROOTDIR + '/' + dateFile + '/' + h + '/' + tableName + '.txt"';
        await new Promise(resolve => {
            connection.query(sqlStr, (err, result) => {
                resolve();
            });
        });
    }, { concurrency: 5 });
    console.timeEnd('mysqlBackup');
    console.log('备份完成');
}

// recover('D:/_MYSQL_BACK_UP/lj_node/2020-10-1/13');
async function recover(path) {
    const fileArr = await new Promise(resolve => {
        fs.readdir(path, (err, result) => {
            resolve(result);
        });
    });
    const tableArr = fileArr.map(items => {
        return items.split('.')[0];
    });
    await bluebird.map(tableArr, async tableName => {
        const sqlStr = 'LOAD DATA INFILE "' + path + '/' + tableName + '.txt" into table ' + tableName;
        await new Promise(resolve => {
            connection.query(sqlStr, (err, result) => {
                resolve();
            });
        });
    }, { concurrency: 5 });
    console.log('恢复完成');
}

exports.exec = exec;