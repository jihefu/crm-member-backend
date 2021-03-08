// 请使用supervisor命令启动该文件
// const child_process = require('child_process');
// const cluster = require('cluster');
// let childInstance;

// function forkChildProcess() {
//     child_process.exec('nvm use 8.12 64', (e, stdout) => {
//         console.log(stdout);
//         setTimeout(() => {
//             childInstance = child_process.fork('./bin/www');
//             childInstance.on('exit', () => {
//                 forkChildProcess();
//             });
//         }, 2000);
//     });
// }

// forkChildProcess();

const cluster = require('cluster');
const child_process = require('child_process');
const http = require('http');

if (cluster.isMaster) {
    console.log(`主进程 ${process.pid} 正在运行`);
    // fork工作进程
    forkWorkProcess();
    createReloadServer();
    cluster.on('exit', work => {
        console.log(`工作进程 ${work.process.pid} 已退出`);
    });
} else {
	// express框架的启动文件
    require('./bin/www');
    console.log(`工作进程 ${process.pid} 已启动`);
}

// 创建1个工作进程
function forkWorkProcess() {
    child_process.exec('nvm use 8.12 64', (e, stdout) => {
        console.log(stdout);
        setTimeout(() => {
            cluster.fork();
        }, 2000);
    });
}

// 创建监听重启命令的http服务器
function createReloadServer() {
    http.createServer((req, res) => {
        if (req.url === '/reload') {
            if (cluster.isMaster) {
                const arr = Object.keys(cluster.workers);
                if (arr.length !== 0) {
                    forkWorkProcess();
                    setTimeout(() => {
                        const arr = Object.keys(cluster.workers);
                        process.kill(cluster.workers[arr[0]].process.pid);
                    }, 20000);
                }
            }
            res.end('reloading');
        } else {
            res.end('unknow command');
        }
    }).listen(8789);
}

// 查看log
setInterval(() => {
    if (cluster.isMaster) {
        const workerArr = Object.keys(cluster.workers);
        // 工作进程意外退出时，fork新的工作进程
        if (workerArr.length === 0) {
            forkWorkProcess();
        }
        console.log(new Date());
        console.log(workerArr);
        console.log(`主进程pid：${process.pid}`);
    } else {
        console.log(`工作进程pid：${process.pid}`);
    }
}, 10000);