var iceServer = {
	'iceServers': [
		{
			// 'urls': 'stun:10.27.105.60:46789'
			'url': 'stun:stun.l.google.com:19302'
		},
		{
			'url': 'turn:116.62.14.243:3478',
			'username': 'u1',
			'credential': 'p1'
		}
		// {
		// 	'url': 'turn:47.107.252.60:3478',
		// 	'username': 'u1',
		// 	'credential': 'p1'
		// }
		// {
		// 	'url': 'turn:47.98.123.10',
		// 	'username': 'tianyu',
		// 	'credential': '123456'
		// }
	]
};
var serverIp = 'www.langjie.com';
var serverPort = '8081';

var socket;
var localStream;
var pc = [];
var count = 0;
var connectPool = [];
var PeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
var URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
var getUserMedia = (window.top.navigator.getUserMedia || window.top.navigator.webkitGetUserMedia || window.top.navigator.mozGetUserMedia || window.top.navigator.msGetUserMedia);

function GetRequest(name) { 
	var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
	var r = window.location.search.substr(1).match(reg);
	if(window.top!=window.self){
		r = window.parent.location.search.substr(1).match(reg);
	}
	if (r != null) {
		return r[2];
	}
	return null;
}

$(function(){
	if(GetRequest('isScreen')==1){
		localScreenInit(function(streamId, userName){
			socketConnect(streamId, userName);
		});
	}else{
		localInit(function(streamId, userName){
			socketConnect(streamId, userName);
		});
	}
});

function sendMessage(message, group) {
	socket.emit('message', message, group);
}

function createPeerInstance(userName) {
	try {
		pc[count] = new PeerConnection(iceServer);
		pc[count].onicecandidate = handleIceCandidate;
		pc[count].onaddstream = handleRemoteStreamAdded;
		pc[count].onremovestream = handleRemoteStreamRemoved;
	} catch (e) {
		alert('Cannot create RTCPeerConnection object.');
		return;
	}
	pc[count].addStream(localStream);
}

// 连接websocket
function socketConnect(streamId, userName) {
	var userName = decodeURIComponent(GetRequest('userName'));
	var type = decodeURIComponent(GetRequest('type'));
	// socket = io.connect(serverIp + ':' + serverPort);
	// socket = io.connect('http://192.168.50.230:8090/webrtc');
	socket = io.connect('https://os.langjie.com/webrtc');
	socket.emit('login', {
		userName: userName,
		type: type
	}, function(bool){
		if(bool==1){
			regStreamId(streamId, userName);

			createPeerInstance();

			socket.on('message', function(message, group) {
				if (message.type === 'offer') {
					count++;
					createPeerInstance();
					pc[count].setRemoteDescription(new RTCSessionDescription(message));
					pc[count].createAnswer().then(function(sessionDescription){
						pc[count].setLocalDescription(sessionDescription);
						sendMessage(sessionDescription, {
							receiver: group.sender,
							sender: group.receiver
						});
					}, function(event){
						console.log('=========');
					});
				} else if (message.type === 'answer') {
					pc[count].setRemoteDescription(new RTCSessionDescription(message));
				} else if (message.type === 'candidate') {
					pc[count].addIceCandidate(new RTCIceCandidate({
						sdpMLineIndex: message.label,
						candidate: message.candidate
					}));
				}
			});

			socket.on('removePicture', function(userName){
				$('.videoItem').each(function(){
					if($(this).find('text').text() == userName){
						$(this).remove();
						$('body').append('<div class="alert alert-danger" style="position: fixed;top: 20px;width: 100%;text-align: center;" role="alert">'+userName+'已离开</div>');
						setTimeout(function(){
							$('.alert').remove();
						},2000);
					}
				});
			});

			call();
		}else{
			// $('#oper').remove();
			// setTimeout(function(){
				alert('登陆冲突');
			// },1000);
		}
	});
}

function handleIceCandidate(event) {
	if (event.candidate) {
		sendMessage({
			type: 'candidate',
			label: event.candidate.sdpMLineIndex,
			id: event.candidate.sdpMid,
			candidate: event.candidate.candidate
		});
	} else {
		console.log('-----------');
	}
}

// 接受远程流，渲染出来
function handleRemoteStreamAdded(event) {
	socket.emit('getStreamId', {}, function(streamIdMapper) {
		var username;
		try{
			username = streamIdMapper[event.stream.id].userName;
		}catch(e){
			username = '远程视频';
		}
		var str = '<div class="videoItem"><video id="remoteVideo'+count+'" controls="controls" autoplay></video><text>'+username+'</text></div>';
		$('#remoteVideoBlock').append(str);
		var remoteVideo = document.querySelector('#remoteVideo'+count);
		try {
			remoteVideo.src = window.URL.createObjectURL(event.stream);
		} catch (e) {
			remoteVideo.srcObject = event.stream;
		}
	});
}

// 远程流断开
function handleRemoteStreamRemoved(event) {
	console.log('+++++++++++++');
}

// 拨号
function call() {
	var receiver = decodeURIComponent(GetRequest('receiver'));
	if(!receiver || receiver == 'null') return;
	// var receiver = $('#remoteNameText').val();
	var sender = decodeURIComponent(GetRequest('userName'));
	// $('#callButton').attr('disabled','disabled');
	// $('#remoteNameText').attr('disabled','disabled');
	pc[count].createOffer(function(sessionDescription){
		pc[count].setLocalDescription(sessionDescription);
		sendMessage(sessionDescription, {
			receiver: receiver,
			sender: sender
		});
	}, function(event){
		console.log('=========');
	});
}

function localInit(cb) {
	var type = decodeURIComponent(GetRequest('type'));
	var userName = decodeURIComponent(GetRequest('userName'));
	if(type=='host') $('#oper').remove();
	$('#_self').html(userName);
	getUserMedia({
		audio: true,
		video: true
	}, function (stream) {
		// getScreenConstraints({
		// 	audio: true
		// }, function (error, constraints_) {
		// 	if (error) return onError(error);
		// 	getUserMedia(constraints_, function (stream) {
				localStream = stream;
				var localVideo = document.querySelector('#localVideo');
				try {
					localVideo.src = window.URL.createObjectURL(stream);
				} catch (e) {
					localVideo.srcObject = stream;
				}
				var streamId = localStream.id;
				cb(streamId, userName);
		// 	},function(err){
		// 		console.log(err);
		// 	});
		// },function(err){
		// 	console.log(err);
		// });
	}, function (err) {
		console.log(err);
	});
}

function localScreenInit(cb) {
	var type = decodeURIComponent(GetRequest('type'));
	var userName = decodeURIComponent(GetRequest('userName'));
	if(type=='host') $('#oper').remove();
	$('#_self').html(userName);
	getUserMedia({
		audio: true,
		video: true
	}, function (stream) {
		getScreenConstraints({
			audio: false
		}, function (error, constraints_) {
			if (error) return onError(error);
			getUserMedia(constraints_, function (stream) {
				getUserMedia({
					audio: true
				}, function(audioStream){
					stream.addTrack(audioStream.getAudioTracks()[0]);
					localStream = stream;
					var localVideo = document.querySelector('#localVideo');
					try {
						localVideo.src = window.URL.createObjectURL(stream);
					} catch (e) {
						localVideo.srcObject = stream;
					}
					var streamId = localStream.id;
					cb(streamId, userName);
				},function(err){
					console.log(err);
				});
			},function(err){
				console.log(err);
			});
		},function(err){
			console.log(err);
		});
	}, function (err) {
		console.log(err);
	});
}

function regStreamId(streamId, userName) {
	socket.emit('regStreamId', {
		streamId: streamId,
		userName: userName
	});
}