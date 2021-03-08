var page = 2,t_count=0;
$(document).ready(function(){
	var height = window.innerHeight;
	window.onscroll = function(){
		var b = $('body').height();
		var s = $('body').scrollTop();
		var scroll = $('body').attr('data-scroll');
		if(b-height-s<20&&scroll==0){
			$('body').attr('data-scroll',1);
			var type = $('body').attr('data-type');
			wxloadmore('ul');
			pageType(type);
			page++;
		}
	}
	slideDel();
	$('body').click(function(){
		t_count=0;
	});

	var w = $('.form input').width();
	$('.icon-form-del').css('left',w-10);
	$('.form input').focus(function(){
		$('.icon-form-del').show();
	});
	$('.form input').blur(function(){
		setTimeout(function(){
			$('.icon-form-del').hide();
		},100);
	});
});
function getList(){
	$.ajax({
		url:mRoute('admin_ajax/member/getList'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'page':page
		},
		success:function(res){
			$('.weui-loadmore').remove();
			if(res&&res.code==200){
				if(res.data==''){
					$('body').attr('data-scroll',1);
					wxToast('没有更多了');
				}else{
					$('body').attr('data-scroll',0);
					$('.li-mark').remove();
					$('.content ul').append(getContent(res)+'<li class="weui-cell weui-cell_access li-mark"></li>');
					cancelListen();
				}
			}else if(res&&res.code==-100){
				reload(res.msg);
			}
		}
	});
}
function cl(){
	$('.form input').val('');
}
function search(){
	var keyword = $('.form input').val();
	if(keyword=='0'){
		wxToast('输入不合法');
		return;
	}
	wxLoadToast('正在搜索');
	page = 2;
	if(keyword==''){
		$.ajax({
			url:mRoute('admin_ajax/member/index_reviewList'),
			type:'get',
			timeout:30000,
			success:function(res){
				$('body').attr('data-scroll',0);
				$('body').attr('data-type','default');
				$('#loadingToast').remove();
				res = JSON.parse(res);
				if(res&&res.code==200){
					if(res.data==''){
						$('body').attr('data-scroll',1);
						wxToast('没有更多了');
					}else{
						page = 2;
						$('.content ul').html(getContent(res)+'<li class="weui-cell weui-cell_access li-mark"></li>');
						cancelListen();
					}
				}else if(res&&res.code==-100){
					reload(res.msg);
				}
			}
		});
	}else{
		searchKeywords();
	}
}

function searchKeywords(){
	var keyword = $('.form input').val();
	if(keyword=='0'){
		wxToast('输入不合法');
		return;
	}
	$('body').attr('data-type','search');
	$.ajax({
		url:mRoute('admin_ajax/member/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'page':page,
			'keyword':keyword
		},
		success:function(res){
			$('#loadingToast').remove();
			$('.weui-loadmore').remove();
			$('body').attr('data-scroll',0);
			if(res&&res.code==-1){
				wxToast(res.msg);
			}else if(res&&res.code==-100){
				reload(res.msg);
			}else{
				if(page==2){
					$('.content ul').html('');
					page++;
				}
				if(res.data[0]==null) $('body').attr('data-scroll',1);
				$('.li-mark').remove();
				$('.content ul').append(getContent(res)+'<li class="weui-cell weui-cell_access li-mark"></li>');
				cancelListen();
			}
		}
	});
}
function check(obj){
	if(t_count==1){
		cancelDel();
		return;
	}
	var name = $(obj).attr('data-name');
	var phone = $(obj).attr('data-phone');
	window.location.href = mRoute('admin/mainMember?name='+name+'&phone='+phone);
}
function sort(){
	$('body').attr('data-scroll',0);
	page = 2;
	$('body').attr('data-type','sort');
	wxLoadToast('正在搜索');
	pageSort();
}
function pageSort(){
	var keyword = $('#select').val();
	$.ajax({
		url:mRoute('admin_ajax/member/sort'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'page':page,
			'keyword':keyword
		},
		success:function(res){
			$('#loadingToast').remove();
			$('.weui-loadmore').remove();
			$('body').attr('data-scroll',0);
			if(res&&res.code==-100){
				reload(res.msg);
				return;
			}
			if(page==2){
				$('.content ul').html('');
				page++;
			}
			if(res.data[0]==null) {
				wxToast('没有更多了');
				$('body').attr('data-scroll',1);
			}
			$('.li-mark').remove();
			$('.content ul').append(getContent(res)+'<li class="weui-cell weui-cell_access li-mark"></li>');
			cancelListen();
		}
	});
}
var t_count = 0;
function slideDel(){
	var startX,moveX;
	$('.content li').on('touchstart',function(e){
		startX = e.originalEvent.changedTouches[0].clientX;
		startY = e.originalEvent.changedTouches[0].clientY;
	});
	$('.content li').on('touchmove',function(e){
		moveX = e.originalEvent.changedTouches[0].clientX;
		moveY = e.originalEvent.changedTouches[0].clientY;
		if(startX-moveX>70&&moveY-startY>-10){
			if(t_count==1) return;
			t_count = 1;
			$(this).addClass('slide');
			$(this).animate({
				'margin-left':-100
			},300);
			$(this).find('.weui-cell__ft').css({
				'display':'none'
			});
			var height = $('.content li').height()+20;
			var str = '<div class="del" style="width: 88px;height:'+height+'px;" onclick="memberSend(this)">'+
							'<p>消息</p>'+
						'</div>';
			$(this).append(str);
		}
	});
}
function cancelDel(){
	$('.slide').animate({
		'margin-left':0
	},300);
	$('.slide').find('.weui-cell__ft').show();
	$('.del').remove();
	$('.slide').removeClass('slide');
	t_count = 0;
}
function cancelListen(){
	$('.content li').off();
	slideDel();
}
function memberSend(obj){
	var user_arr = [];
	var user_obj = {};
	user_obj.name = $(obj).parent().attr('data-name');
	user_obj.phone = $(obj).parent().attr('data-phone');
	user_arr.push(user_obj);
	var user_key = JSON.stringify(user_arr);
	sessionStorage.setItem("user_key",user_key);
	window.location.href = mRoute('admin/member_send');
}
function getContent(res){
	var data = res.data;
	var str = '';
	for (var i = 0; i < data.length; i++) {
		var phone = data[i].phone;
		if(data[i].portrait==''||data[i].portrait=='null'||data[i].portrait==null){
			var _str = '<div class="default_member">'+
							'<img src="../img/default_member2.jpg" alt="'+data[i].name+'">'+
						'</div>';
		}else{
			var _str = '<img class="assign_member" src="../img/member/'+data[i].portrait+'" alt="'+data[i].name+'">'
		}
		str += '<li class="weui-cell weui-cell_access" style="padding-left:0px;" data-name="'+data[i].name+'" data-phone="'+data[i].phone+'" onclick="check(this)">'+
				'<div class="weui-cell__hd">'+_str+
				'</div>'+
				'<div class="weui-cell__bd">'+
					'<p>姓名：'+data[i].name+'</p>'+
					'<p>手机：'+phone+'</p>'+
					'<p class="content-cpy">公司：'+data[i].company+'</p>'+
				'</div>'+
				'<div class="weui-cell__ft"></div>'+
			'</li>';
	};
	return str;
}

function pageType(type){
	switch(type){
		case 'default':
			getList();
			break;
		case 'search':
			searchKeywords();
			break;
		case 'sort':
			pageSort();
			break;
	}
}