var scrollPage;
$(document).ready(function(){ 
	scrollPage = new ScrollPage({
		url: 'knowledge_ajax/list'
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

function search(){
	var keywords = $('.form input').val();
	keywords = keywords.toUpperCase();
	function SearchPage(){}
	SearchPage.prototype = new ScrollPage({
		url: 'knowledge_ajax/search',
		keywords: keywords
	});
	scrollPage = new SearchPage();
	render({
		page: scrollPage.page,
		keywords: scrollPage.keywords
	});
	if(keywords==''){
		scrollPage = new ScrollPage({
			url: 'knowledge_ajax/list',
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
		if(_data[0]==null){
			var msg = res.msg?res.msg:'没有更多了';
			wxToast(msg);
			scrollPage.mark = 1;
			return;
		}else{
			var m_str = '';
			for (var i = 0; i < _data.length; i++) {
				var img = _data[i].album.split(',')[0];
				if(img==''){
					var img_str = '<img class="assign_member" src="../img/controller_system.png">';
				}else{
					var img_str = '<img class="assign_member" src="../img/'+img+'">';
				}
				m_str += '<li class="weui-cell weui-cell_access" style="padding-left:0px;" onclick="check(this)" data-id="'+_data[i].id+'">'+
			                '<div class="weui-cell__hd">'+
								'<div class="default_member">'+img_str+'</div>'+
							'</div>'+
			                '<div class="weui-cell__bd">'+
			                    '<p class="content-cpy">问题现象：'+_data[i].question+'</p>'+
								'<p class="content-cpy">问题标签：'+_data[i].question_tags+'</p>'+
								'<p class="content-cpy">产品标签：'+_data[i].products_tags+'</p>'+
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
	var no = $(obj).attr('data-id');
	window.location.href = route('knowledge/info/'+no);
}