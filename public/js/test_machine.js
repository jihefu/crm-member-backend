$(document).ready(function(){
	var t;
	$('.btn').click(function(){
        if($(this).hasClass('icon-stop')){
            $('.icon-stop').removeClass('icon-stop');
            $(this).addClass('icon-start');
            // clearInterval(t);
            // clearTimeout(timer);
        }else{
            $('.icon-start').removeClass('icon-start');
            $(this).addClass('icon-stop');
            // t = setInterval(function(){
            // 	chart.append(
            // 		[
            // 			0,1,3,5,6,8,10,19,10,20,30
            // 		]
            // 	);
            // },100);
        }
    });
    socket();
});

function socket(){
	//移动端连接socket，并发送Login信息
	var socket = io('http://www.langjie.com:8090'); 
	socket.on('connect', function () {
		var target = document.getElementById('wrap').getAttribute('data-id');
		socket.emit('Login', {
			"class": "wti",
			"target": target,
			"user": "master",
			"password": "qwerty"
		}, function (data) {
			wxToast(data); 
		});
	});

	//移动端排队
	socket.on('Waiting', function (data) {
		wxToast(data);
	});

	//移动端接收数据流
	socket.on('TestPipe', function (data) {
		console.log(JSON.stringify(data));
	});

	// setTimeout(function(){
	// 	socket.emit('TestCmd', {
	// 		"jsonrpc":"2.0", 
	// 		"method": "subtract", 
	// 		"params":{
	// 			"subtrahend": 23, 
	// 			"minuend": 42
	// 		}, 
	// 		"id": 3
	// 	}, function (data) {
	// 		console.log(data); 
	// 	});
	// },1000);
}