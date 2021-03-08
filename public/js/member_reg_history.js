var page = function(){
	var page = 1;
	return function(){
		page++;
		return page;
	}
}
var p = page();
$(document).ready(function(){
	var height = window.innerHeight;
	window.onscroll = function(){
		var b = $('body').height();
		var s = $('body').scrollTop();
		var scroll = $('body').attr('data-scroll');
		if(b-height-s<20&&scroll==0){
			$('body').attr('data-scroll',1);
			wxloadmore('body');
			getList();
		}
	}
});
function render(render_data){
	var str = '';
	for (var i = 0; i < render_data.length; i++) {
		str += '<div class="weui-panel" style="margin: 10px 0px 0 10px;">'+
			        '<div class="weui-panel__bd">'+
			            '<div class="weui-media-box weui-media-box_text">'+
			                '<h4 class="weui-media-box__title">'+render_data[i].regDate+'</h4>'+
			                '<p class="weui-media-box__desc">'+
			                    '<p class="weui-media-box__desc">序列号：'+render_data[i].sn+'</p>'+
			                    '<p class="weui-media-box__desc">产品型号：'+render_data[i].product+'</p>'+
			                    '<p class="weui-media-box__desc">注册有效期：'+render_data[i].validDate+'</p>'+
			                    '<p class="weui-media-box__desc">注册码：'+render_data[i].regCode+'</p>'+
			                    '<p class="weui-media-box__desc">授权操作码：'+render_data[i].authOperKey+'</p>'+
			                '</p>'+
			            '</div>'+
			        '</div>'+
			    '</div>';
	};
	$('body').append(str);
}
function getList(){
	var page = p();
	$.ajax({
		url:route('member_ajax/getRegList'),
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
				addList(res.data);
			}else if(res&&res.code==-100){
				reload(res.msg);
			}
		}
	});
}
function addList(data){
	if(data==''){
		$('body').attr('data-scroll',1);
		wxToast('没有更多了');
		return;
	}
	render(data);
}