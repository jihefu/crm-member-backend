global.socketMapper = {};
const streamIdMapper = {};

module.exports = function (socket, io) {

    // 登陆注册
    socket.on('login', function (params, fn) {
        const { userName, type } = params;
        if (global.socketMapper[userName]) {
            fn(0);
        } else {
            global.socketMapper[userName] = {
                socket,
                type
            };
            fn(1);
        }
    });

    // 发送消息给指定客户端
    socket.on('message', function (message, group) {
        if (group) {
            const userName = group.receiver;
            try {
                const socketId = global.socketMapper[userName].socket;
                socketId.emit('message', message, group);
            } catch (e) {
                console.log(e);
            }
        } else {
            socket.broadcast.emit('message', message);
        }
    });

    // 注册流id
    socket.on('regStreamId', function (params) {
        var streamId = params.streamId;
        var userName = params.userName;
        streamIdMapper[streamId] = {
            socketId: socket.id,
            userName: userName
        };
    });

    // 获取流id注册表
    socket.on('getStreamId', function (params, fn) {
        fn(streamIdMapper);
    });

    // 获取会议创建者列表
    socket.on('getHostMapper', function (params, fn) {
        const resArr = [];
        for(let key in global.socketMapper){
            if(global.socketMapper[key].type == 'host'){
                resArr.push(key);
            }
        }
        fn(resArr);
    });

    // 断开连接
    socket.on('disconnect', function () {
        const id = socket.id;
        let userName;
        for (let key in global.socketMapper) {
            if (global.socketMapper[key].socket.id == id) {
                userName = key;
                delete global.socketMapper[key];
                for (let i in streamIdMapper) {
                    if (streamIdMapper[i].socketId == id) {
                        delete streamIdMapper[i];
                    }
                }
                // 通知全体，有人掉线，移除掉线人的画面
                socket.broadcast.emit('removePicture', userName);
            }
        }
    });
}