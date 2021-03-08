const serviceSocketCall = require('../service/socketCall');

module.exports = function(socket,io){
    socket.on('Login', function (params, fn) {
        serviceSocketCall.login(socket,io,params,result => {
            fn(result);
        });
    });
}