var page = 1, hasMore = true, loading = false;
var scrollHeight;

$(function () {
	getList();
	pullRefresh();
});

function pullRefresh() {
	var pr = new auiPullToRefresh({
		container: document.querySelector('.aui-refresh-content'),
		triggerDistance: 50
	}, function (ret) {
		if (ret.status == "success") {
			setTimeout(function () {
				getList();
				pr.cancelLoading(); //刷新成功后调用此方法隐藏
			}, 500);
		}
	});
}

function getList() {
	if (!hasMore || loading) {
		return;
	}
	loading = true;
	$.ajax({
		url: route('member_ajax/getList'),
		type: 'get',
		dataType: 'json',
		timeout: 30000,
		data: {
			page: page
		},
		success: function (res) {
			loading = false;
			page++;
			if (res && res.code == 200) {
				if (res.data.length === 0) {
					hasMore = false;
				} else {
					res.data = res.data.reverse();
					render(res.data);
				}
			}
		}
	});
}

function render(data) {
	var str = '';
	for (var i = 0; i < data.length; i++) {
		var params = {
			post_time: data[i].post_time,
			title: data[i].title,
			content: data[i].message,
			album: data[i].album,
		};
		if (data[i].sender == selfOpenId) {
			str += msgTemp(true, params, album);
		} else {
			str += msgTemp(false, params, '../img/朗杰弓三角.png');
		}
	}
	$('.aui-chat').prepend(str);
	setTimeout(function () {
		$('.aui-chat-item:last').css({
			'margin-bottom': '4rem'
		});
		if (page == 2) {
			window.scrollTo(0, 30000);
			scrollHeight = document.getElementsByTagName('body')[0].scrollHeight;
		} else {
			var _scrollHeight = document.getElementsByTagName('body')[0].scrollHeight - scrollHeight;
			document.getElementsByTagName('body')[0].scrollTop = _scrollHeight;
			window.scrollTo(0, _scrollHeight);
			scrollHeight = document.getElementsByTagName('body')[0].scrollHeight;
		}
	}, 10);

	function msgTemp(isRight, params, album) {
		var time = params.post_time;
		var content = params.content;
		var content_album = '';
		var direct;
		if (isRight) {
			direct = 'aui-chat-right';
		} else {
			direct = 'aui-chat-left';
		}
		if (params.album) {
			var _arr = [];
			try {
				_arr = params.album.split(',');
			} catch(e) {
	
			}
			for (var i = 0; i < _arr.length; i++) {
				content_album += '<a href="../img/notiClient/'+_arr[i]+'"><img style="min-height: 100px" src="../img/notiClient/'+_arr[i]+'" /></a>';
			}
		}
		var str = '<div class="aui-chat-item ' + direct + '">' +
			'<div class="aui-chat-media">' +
			'<img src="' + album + '" />' +
			'</div>' +
			'<div class="aui-chat-inner">' +
			'<div class="aui-chat-name">' +
			'<span>' + time + '</span>' +
			'</div>' +
			'<div class="aui-chat-content">' +
			'<div class="aui-chat-arrow"></div>' +
			'<span>' + content + '</span>' + content_album +
			'</div>' +
			'</div>' +
			'</div>'
		return str;
	}
}

function send() {
	var v = $('.msgContent textarea').val();
	if (v == '') return;
	wxLoadToast('发送中');
	$.ajax({
		url: route('member/sendToMemberMessage'),
		type: 'post',
		dataType: 'json',
		timeout: 30000,
		data: {
			content: v,
		},
		success: function (res) {
			$('#loadingToast').remove();
			page = 1;
			loading = false;
			hasMore = true;
			$('.aui-chat').html('');
			getList();
			$('.msgContent textarea').val('');
			pullRefresh();
		}
	});
}