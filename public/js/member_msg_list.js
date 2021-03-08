var page = function(){
	var page = 1;
	return function(){
		page++;
		return page;
	}
}
var p = page();
$(document).ready(function(){
	render(render_data);
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
		// var temp = render_data[i].model;
		var temp = 'singleMsg';
		str += renderTemp(temp,render_data[i]);
	};
	$('body').append(str);
}
function getList(){
	var page = p();
	var openid = window.location.href.split('member/msgList/')[1];
	openid = openid.split('?')[0];
	$.ajax({
		url:route('member_ajax/getDynamicMsg'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'page': page,
			open_id: openid
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



var template = {
	singleMsg: function(params){	
		if(params.validDate==0){
			var _date = '已永久注册';
		}else{
			var _date = '有效期至'+params.validDate;
		}	
		var str = '<div class="weui-panel">'+
		            '<div class="weui-panel__bd">'+
		                '<div class="weui-media-box weui-media-box_text">'+
		                    '<h4 class="weui-media-box__title">注册提醒</h4>'+
		                    '<p class="weui-media-box__desc">'+params.regDate+'</p>'+
		                    '<p class="weui-media-box__desc" style="line-height:1.6">'+
		                    params.name+'，注册产品'+params.product+'，'+_date+'。注册码：'+params.regCode+'，授权操作码：'+params.authOperKey+'。（序列号：'+params.sn+'，机器号：'+params.mid+'。）'+
		                    '</p>'+
		                '</div>'+
		            '</div>'+
		        '</div>';
		return str;
	},
	text: function(params){
		var str = '<div class="weui-panel">'+
		            '<div class="weui-panel__bd">'+
		                '<div class="weui-media-box weui-media-box_text">'+
		                    '<p class="weui-media-box__desc">'+JSON.stringify(params)+'</p>'+
		                '</div>'+
		            '</div>'+
		        '</div>';
		return str;
	}
}

var renderTemp = function(temp,params){
	try{
		return template[temp](params);
	}catch(e){
		return template['text'](params);
	}
}