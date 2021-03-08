var scrollPage;
var startX,moveX,startY,moveY,t_count = 0;
$(document).ready(function(){ 
	$('body').click(function(){
		t_count=0;
	});
	scrollPage = new ScrollPage({
		url: 'm/admin_ajax/cus'
	});
	scrollPage.page = 2;
	window.onscroll = function(){
		var h_window = window.innerHeight;
		var h_body = $('body').height();
		var h_scroll = $('body').scrollTop();
		if(h_body-h_window-h_scroll<20){
			render({
				page: scrollPage.page,
				keywords: scrollPage.keywords
			});
		}
	}
	inputDel();
});
$(document).on('touchstart',function(e){
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
		var height = $('.content li').height()+30;
		var str = '<div class="del" style="width: 88px;height:'+height+'px;" onclick="del(this)">'+
						'<p style="margin-top: 2.6rem;padding-left:0.3125rem;">删除</p>'+
					'</div>';
		$(this).append(str);
	}
});
function cancelDel(){
	$('.slide').animate({
		'margin-left':0
	},300);
	$('.slide').find('.weui-cell__ft').show();
	$('.del').remove();
	$('.slide').removeClass('slide');
	t_count = 0;
}
function del(obj){
	for (let i = 0; i < DIRECTOR.length; i++) {
		if(DIRECTOR[i]==_user_id){
			var id = $(obj).parent().attr('data-id');
			var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
				            '<div class="weui-mask"></div>'+
				            '<div class="weui-dialog">'+
				                '<div class="weui-dialog__hd" style="border-bottom:none;"><strong class="weui-dialog__title">提示</strong></div>'+
				                '<div class="weui-dialog__bd" style="margin-top:0px;height:auto;font-size: 16px;">确定删除？</div>'+
				                '<div class="weui-dialog__ft">'+
				                   '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="delSub(\''+id+'\')";>确定</a>'+
				                    '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="cancel()";>取消</a>'+
				                '</div>'+
				            '</div>'+
				        '</div>';
			$('body').append(str);
			break;
		}else if(i==DIRECTOR.length-1&&DIRECTOR[i]!=_user_id){
			wxToast('权限不足');
		}
	}
}
function delSub(id){
	cancel();
	wxLoadToast('正在删除');
	$.ajax({
		url:mRoute('admin_ajax/intercourse/del'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			'id':id
		},
		success:function(res){
			if(res&&res.code==-100){
				reload(res.msg);
				return;
			}else{
				$('#loadingToast').remove();
				wxToast('删除成功');
				$('.content li[data-id='+id+']').remove();
			}
		}
	});
}


function inputDel(){
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
}
function cl(){
	$('.form input').val('');
}
function add(){
	var temp_str = '';
	inter_action_temp_arr.forEach(function(items,index){
		temp_str += '<div class="weui-cell weui-cell_switch">'+
		                '<input class="weui-switch" name="action_type" type="radio" value="'+items.key+'">'+
		                '<p style="margin-left: 0.7rem">'+items.name+'</p>'+
			        '</div>';
	});
	var str = '<div class="js_dialog" id="wxDialog">'+
	            '<div class="weui-mask"></div>'+
	            '<div class="weui-dialog">'+
	                '<div class="weui-dialog__bd">'+temp_str+'</div>'+
	                '<div class="weui-dialog__ft">'+
	                    '<a href="javascript:;" onclick="comfirm()" class="weui-dialog__btn weui-dialog__btn_primary">确定</a>'+
	                    '<a href="javascript:;" onclick="cancel()" class="weui-dialog__btn weui-dialog__btn_default">取消</a>'+
	                '</div>'+
	            '</div>'+
	        '</div>';
	$('body').append(str);
	$('input[name=action_type]').eq(0).prop('checked',true);
}
function comfirm(){
	var template = $('.weui-dialog input[type=radio]:checked').val();
	if(!template){
		return;
	}
	cancel();
	wxLoadToast('正在提交');
	$.ajax({
		url:route('m/admin_ajax/intercourse/add'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			template: template
		},
		success:function(res){
			$('#loadingToast').remove();
			wxToast(res.msg);
			if(res.code==200){
				window.location.href = route('m/admin/inter_action/'+res.data);
			}
		}
	});
}
function cancel(){
	$('#wxDialog,#iosDialog1').remove();
}
function search(){
	var keywords = $('.form input').val();
	keywords = keywords.toUpperCase();
	function SearchPage(){}
	SearchPage.prototype = new ScrollPage({
		url: 'm/admin_ajax/intercourse/search',
		keywords: keywords
	});
	scrollPage = new SearchPage();
	render({
		page: scrollPage.page,
		keywords: scrollPage.keywords
	});
	if(keywords==''){
		scrollPage = new ScrollPage({
			url: 'm/admin_ajax/cus',
			keywords: ''
		});
		scrollPage.page = 2;
	}
}
function render(data){
	scrollPage.getData(data,function(res){
		if(res.code==-100){
			reload(res.msg);
			return;
		}
		var _data = res.data;
		if(_data.result[0]==null){
			var msg = res.msg?res.msg:'没有更多了';
			wxToast(msg);
			scrollPage.mark = 1;
			return;
		}else{
			var m_str = '';
			for (var i = 0; i < _data.result.length; i++) {
				if(_data.album_arr[i]==''){
					var img_str = '<img class="assign_member" src="../img/controller_system.png">';
				}else{
					var img_str = '<img class="assign_member" src="../img'+_data.album_arr[i]+'">';
				}
				m_str += '<li class="weui-cell weui-cell_access" style="padding-left:0px;" onclick="check(this)" data-id="'+_data.result[i].id+'">'+
			                '<div class="weui-cell__hd">'+
								'<div class="default_member">'+img_str+'</div>'+
							'</div>'+
			                '<div class="weui-cell__bd">'+
			                    '<p class="content-cpy">客户名称：'+_data.result[i].cus_abb+'</p>'+
								'<p class="content-cpy">业务经理：'+_data.result[i].cus_manager+'</p>'+
								'<p class="content-cpy">开始时间：'+_data.result[i].start_time+'</p>'+
			                '</div>'+
			                '<div class="weui-cell__ft">'+
			                '</div>'+
			            '</li>';
			};
		}
		scrollPage.setList(m_str,res);
	});
}
function check(obj){
	if(t_count==1){
		cancelDel();
		return;
	}
	var no = $(obj).attr('data-id');
	window.location.href = mRoute('admin/inter_action/'+no);
}