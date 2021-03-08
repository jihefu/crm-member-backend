var myOpenId;
var no = window.location.href.split('?')[0].split('/wxTweets/')[1];
$(function(){
    getMyOpenId(function(){
        listenInit();
    });
    sendHasReadToServer();
});
function listenInit(){
	var page = window.location.href;
    var timestamp = Date.now();
	$.ajax({
        url: route('common/proxyScan'),
        type: 'get',
        data: {
            page: page,
            timestamp: timestamp
        },
        dataType:"json",
        success: function(res) {
			var config = {};
			config.appId = res.data.appId;
        	config.signature = res.data.signature;
        	config.nonceStr = res.data.nonceStr;
        	config.timestamp = timestamp;
        	config.jsApiList = ['onMenuShareAppMessage', 'onMenuShareTimeline'];
        	wx.config(config);
        	wx.ready(function(){
                var title = $('title').html();
        		wx.onMenuShareAppMessage({
                    title: title, // 分享标题
                    link: route('wxTweets/'+no),
					// link: route('html/wxTweet'+no+'.html'), // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
					imgUrl: 'https://wx.langjie.com/favicon.ico', // 分享图标
					type: '', // 分享类型,music、video或link，不填默认为link
					dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
					success: function (res) {
						sendResToServer();
					}
				});

				wx.onMenuShareTimeline({
                    title: title, // 分享标题
                    link: route('wxTweets/'+no),
				    // link: route('html/wxTweet'+no+'.html'), // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
				    imgUrl: 'https://wx.langjie.com/favicon.ico', // 分享图标
				    success: function () {
                        sendResToServer();
					}
				});
        	});
        }
    });
}

function getMyOpenId(cb) {
	$.ajax({
		url: route('wxTweets/getMyOpenId'),
		type: 'get',
		dataType: 'json',
		timeout: 30000,
		success:function(res){
            myOpenId = res.data;
            cb();
        }
	});
}

function sendResToServer() {
    $.ajax({
		url: route('wxTweets/hasShare'),
		type: 'get',
		dataType: 'json',
        timeout: 30000,
        data: {
            no: no
        },
		success:function(res){
            
        }
	});
}

function sendHasReadToServer() {
    $.ajax({
		url: route('wxTweets/hasRead'),
		type: 'get',
		dataType: 'json',
        timeout: 30000,
        data: {
            no: no
        },
		success:function(res){
            // console.log(res);
        }
	});
}