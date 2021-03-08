var express = require('express');
var url = require('url');

var wrap_wti_obj = [
	{
		tag:'tag',
		group:[
			{
				uid:'uid',
				socket:'socket'
			}
		]
	}
];
var wrap_rtc_obj = [
	{
		uid:'uid',
		id:'id'
	}
];
module.exports = function(socket){
	//登陆
	socket.on('Login', function (params, fn) {
		var type = params.class;
		var uid = socket.id;
		if(type=='wti'){
			var target = params.target; 
			socket.join(target);
			//构建特定的数据结构，变量名为 wrap_wti_obj;
			for (var i = 0; i < wrap_wti_obj.length; i++) {
				var items = wrap_wti_obj[i];
				if(items.tag==target){
					var obj = {};
					obj.uid = uid;
					obj.socket = socket;
					items.group.push(obj);
					break;
				}else if(items.tag!=target&&(items==wrap_wti_obj[wrap_wti_obj.length-1])){
					var obj = {};
					obj.tag = target;
					obj.group = [
						{
							uid:uid,
							socket:socket
						}
					];
					wrap_wti_obj.push(obj);
					break;
				}
			};
			//指定tag的socket实例数组
			var socket_group = [];
			wrap_wti_obj.forEach(function(items,index){
				if(items.tag==target){
					socket_group = items.group;
				}
			});
			socket_group.forEach(function(items,index){
				if(uid==items.uid&&index==0){
					fn('请操作控制器');
				}else if(uid==items.uid){
					fn('还需等待'+index+'人');
				}
			});
		}else{
			//rtc登陆
			var id = params.tcInfo.id;
			socket.join(id);
			socket.tid = id;
			var obj = {};
			obj.uid = uid;
			obj.id = id;
			wrap_rtc_obj.push(obj);
		}
    });

    //登出
    socket.on('Logout', function (params, fn) {
		var uid = socket.id;
		var ind;
		//wti登出
		wrap_wti_obj.forEach(function(items,index){
			items.group.forEach(function(_items,_index){
				if(_items.uid==uid) {
					items.group.splice(_index,1);
					ind = index;
					broadcast(items.group);
				}
			});
		});
		//wti登出后，广播
		function broadcast(group){
			group.forEach(function(items,index){
				if(index==0){
					items.socket.emit('Waiting','请操作控制器');
				}else{
					items.socket.emit('Waiting','还需等待'+index+'人');
				}
			});
		}
		//rtc登出
		wrap_rtc_obj.forEach(function(items,index){
			if(items.uid==uid) {
				wrap_rtc_obj.splice(index,1);
			}
		});
    });

    //断开，与登出性质相同
    socket.on('disconnect', function (params) {
		var uid = socket.id;
		var ind;
		//wti登出
		wrap_wti_obj.forEach(function(items,index){
			items.group.forEach(function(_items,_index){
				if(_items.uid==uid) {
					items.group.splice(_index,1);
					ind = index;
					broadcast(items.group);
				}
			});
		});
		//wti登出后，广播
		function broadcast(group){
			group.forEach(function(items,index){
				if(index==0){
					items.socket.emit('Waiting','请操作控制器');
				}else{
					items.socket.emit('Waiting','还需等待'+index+'人');
				}
			});
		}
		//rtc登出
		wrap_rtc_obj.forEach(function(items,index){
			if(items.uid==uid) {
				wrap_rtc_obj.splice(index,1);
			}
		});
    });

	socket.on('TestCmd', function (params, fn) {
        fn(params);
    });
    socket.on('TestReply', function (params) {
        
    });
    socket.on('TestNotify', function (params) {
        
    });

    //传送数据流
    socket.on('TestPipe', function (params) {
    	var target = socket.tid;
		socket.in(target).emit('TestPipe',params);
    });
}