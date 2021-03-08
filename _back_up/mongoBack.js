const fs = require('fs');
const bluebird = require('bluebird');
const schedule = require('node-schedule');
const child_process = require('child_process');

const mongoHost = '116.62.14.243';
const mongoPort = '27017';
const mongoUser = 'zlg';
const mongoPass = '437612langjie';
const ROOTDIR = 'D:/_MONGO_BACK_UP';

const database = [
    {
        databaseName: 'langjiesys',
        collection: ['filenames', 'files', 'fileshootings', 'memberactivityscorerecords', 'subeventcontents'],
    },
    {
        databaseName: 'source',
        collection: ['VtcCfgTemp', 'VtcCfgTempSelf', 'atsContent', 'atsInfo', 'iniContent', 'iniInfo', 'iniowners', 'njiContent', 
        'njiInfo', 'njiowners', 'reginfos', 'resourcemanagers', 'tarInfo', 'tarInstance', 'virCfgContent'],
    },
];

async function exec() {
    console.time('mongoBackup');
    const sqlStrArr = [];
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

    for (let i = 0; i < database.length; i++) {
        const { databaseName, collection } = database[i];
        const path = ROOTDIR + '/' + dateFile + '/' + h + '/' + databaseName;
        const isDbExist = fs.existsSync(path);
        if (!isDbExist) {
            fs.mkdirSync(path);
        }
        for (let j = 0; j < collection.length; j++) {
            const collectionName = collection[j];
            const sqlStr = `mongoexport -h ${mongoHost}:${mongoPort} -u ${mongoUser} -p ${mongoPass} -d ${databaseName} -c ${collectionName} -o ${path}/${collectionName}.dat`;
            sqlStrArr.push(sqlStr);
        }
    }

    await bluebird.map(sqlStrArr, async sqlStr => {
        await new Promise(resolve => {
            child_process.exec(sqlStr, (e, stdout) => {
                resolve();
            });
        });
    }, { concurrency: 1 });
    console.timeEnd('mongoBackup');
    console.log('mongo备份完成');
}

async function recover(path, database) {
    const fileArr = await new Promise(resolve => {
        fs.readdir(path + '/' + database, (err, result) => {
            resolve(result);
        });
    });
    const sqlStrArr = [];
    for (let i = 0; i < fileArr.length; i++) {
        const collectionName = fileArr[i].split('.')[0];
        sqlStrArr.push(`mongoimport -h ${mongoHost}:${mongoPort} -u ${mongoUser} -p ${mongoPass} -d ${database} -c ${collectionName} --drop ${path + '/' + database + '/' + collectionName + '.dat'}`);
    }
    await bluebird.map(sqlStrArr, async sqlStr => {
        await new Promise(resolve => {
            child_process.exec(sqlStr, (e, stdout) => {
                resolve();
            });
        });
    }, { concurrency: 1 });
    console.log('mongo恢复完成');
}

exports.exec = exec;