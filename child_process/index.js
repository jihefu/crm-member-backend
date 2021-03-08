const child_process = require('child_process');

module.exports = async function(filePath, params) {
    const child = child_process.fork(filePath);
    child.send(params);
    const result = await new Promise(resolve => {
        child.on('message', function(result) {
            resolve(result);
        });
    });
    child.kill();
    return result;
}