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

function slideDel(){
	var startX,moveX;
	$('.content li').on('touchstart',function(e){
		startX = e.originalEvent.changedTouches[0].clientX;
		startY = e.originalEvent.changedTouches[0].clientY;
	});
	$('.content li').on('touchmove',function(e){
		moveX = e.originalEvent.changedTouches[0].clientX;
		moveY = e.originalEvent.changedTouches[0].clientY;
		if(startX-moveX>70&&moveY-startY>-1){
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
			var str = '<div class="del" style="width: 88px;height:'+height+'px;" onclick="del(this)">'+
							'<p>删除</p>'+
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
function getList(){
	$.ajax({
		url:mRoute('admin_ajax/employees/getList'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'page':page
		},
		success:function(res){
			if(res&&res.code==200){
				$('body').attr('data-scroll',0);
				$('.weui-loadmore').remove();
				if(res.data==''){
					$('body').attr('data-scroll',1);
					wxToast('没有更多了');
					return;
				}else{
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
function add(){
	var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
		            '<div class="weui-mask"></div>'+
		            '<div class="weui-dialog">'+
		                '<div class="weui-dialog__hd"><strong class="weui-dialog__title">新建员工</strong></div>'+
		                '<div class="weui-dialog__bd">'+
		                	'<p>'+
		                		'<span>姓名:</span><input name="name" type=text placeholder="姓名">'+
		                	'</p>'+
		                	'<p class="abb">'+
		                		'<span>工号:</span><input name="user_id" type=text placeholder="工号">'+
		                	'</p>'+
		                '</div>'+
		                '<div class="weui-dialog__ft">'+
		                    '<a href="javascript:void(0);" onclick="create();" class="weui-dialog__btn weui-dialog__btn_default">确定</a>'+
		                    '<a href="javascript:void(0);" onclick="cancel();" class="weui-dialog__btn weui-dialog__btn_primary">取消</a>'+
		                '</div>'+
		            '</div>'+
		        '</div>';
	$('body').append(str);
}
function del(obj){
	var user_id = $(obj).parent().attr('data-id');
	var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
		            '<div class="weui-mask"></div>'+
		            '<div class="weui-dialog">'+
		                '<div class="weui-dialog__hd" style="border-bottom:none;"><strong class="weui-dialog__title">提示</strong></div>'+
		                '<div class="weui-dialog__bd" style="margin-top:0px;height:auto;font-size: 16px;">确定删除此员工？</div>'+
		                '<div class="weui-dialog__ft">'+
		                   '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="delSub(\''+user_id+'\')";>确定</a>'+
		                    '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="cancel()";>取消</a>'+
		                '</div>'+
		            '</div>'+
		        '</div>';
	$('body').append(str);
}
function cl(){
	$('.form input').val('');
}
function cancel(){
	$('#iosDialog1').remove();
}
function create(){
	var name = $('input[name="name"]').val();
	var _user_id = $('input[name="user_id"]').val();
	var user_id = _user_id.toUpperCase();
	if(name==''||user_id==''){
		wxToast('请输入完整信息！');
		return;
	}
	if(/^\d{1,4}$/ig.test(user_id)==false){
		wxToast('英文缩写格式不正确！');
		return;
	}
	$.ajax({
		url:mRoute('admin_ajax/employees/createCpy'),
		type:'post',
		timeout:30000,
		data:{
			'name':name,
			'user_id':user_id
		},
		success:function(res){
			res = JSON.parse(res);
			if(res&&res.code==-1){
				wxToast(res.msg);
			}else if(res&&res.code==200){
				window.location.href = mRoute('admin/mainEmployee/'+user_id);
			}else if(res&&res.code==-100){
				reload(res.msg);
			}
		}
	});
}
function delSub(user_id){
	cancel();
	wxLoadToast('正在删除');
	$.ajax({
		url:mRoute('admin_ajax/employees/del'),
		type:'delete',
		dataType:'json',
		timeout:30000,
		data:{
			'user_id':user_id
		},
		success:function(res){
			if(res&&res.code==-100){
				reload(res.msg);
				return;
			}
			if(res&&res.status=='succeed'){
				$('#loadingToast').remove();
				wxToast('删除成功！');
				$('.content li[data-id='+user_id+']').remove();
			}
		}
	});
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
			url:mRoute('admin_ajax/employees/index_list'),
			type:'get',
			timeout:30000,
			success:function(res){
				$('body').attr('data-scroll',0);
				$('body').attr('data-type','default');
				$('#loadingToast').remove();
				res = JSON.parse(res);
				if(res&&res.code==200){
					page = 2;
					$('.content ul').html(getContent(res)+'<li class="weui-cell weui-cell_access li-mark"></li>');
					cancelListen();
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
		url:mRoute('admin_ajax/employees/search'),
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
		url:mRoute('admin_ajax/employees/sort'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'page':page,
			'keyword':keyword
		},
		success:function(res){
			if(res&&res.code==-100){
				reload(res.msg);
				return;
			}
			$('#loadingToast').remove();
			$('.weui-loadmore').remove();
			$('body').attr('data-scroll',0);
			if(page==2){
				$('.content ul').html('');
				page++;
			}
			if(res.data[0]==null) $('body').attr('data-scroll',1);
			$('.li-mark').remove();
			$('.content ul').append(getContent(res)+'<li class="weui-cell weui-cell_access li-mark"></li>');
			cancelListen();
		}
	});
}
function check(obj){
	if(t_count==1){
		cancelDel();
		return;
	}
	var user_id = $(obj).attr('data-id');
	window.location.href = mRoute('admin/mainEmployee/'+user_id);
}
function getContent(res){
	var data = res.data;
	var str = '';
	for (var i = 0; i < data.length; i++) {
		if(data[i].album==''){
			var _str = '<div class="default_member">'+
							'<img src="../img/default_member2.jpg" alt="'+data[i].user_name+'">'+
						'</div>';
		}else{
			var _str = '<img class="assign_member" src="../img/'+data[i].album+'" alt="'+data[i].user_name+'">'
		}
		str += '<li class="weui-cell weui-cell_access" style="padding-left:0px;" data-id="'+data[i].user_id+'" onclick="check(this)">'+
				'<div class="weui-cell__hd">'+_str+
				'</div>'+
				'<div class="weui-cell__bd">'+
					'<p>工号：'+data[i].user_id+'</p>'+
					'<p>姓名：'+data[i].user_name+'</p>'+
					'<p>手机：'+data[i].phone+'</p>'+
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