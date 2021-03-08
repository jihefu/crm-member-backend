// 请使用supervisor命令启动该文件
const child_process = require('child_process');
let childInstance;

function forkChildProcess() {
    child_process.exec('nvm use 8.12 64', (e, stdout) => {
        console.log(stdout);
        setTimeout(() => {
            childInstance = child_process.fork('./service/timer');
            childInstance.on('exit', () => {
                forkChildProcess();
            });
        }, 2000);
    });
}

forkChildProcess();