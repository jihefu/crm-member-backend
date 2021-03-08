//移动端动态加载
function ScrollPage(opt){
	this.keywords = opt.keywords?opt.keywords:'';

	this.mark = 0;
	this.page = 1;
	this.url = opt.url;
	this.ele = opt.ele?opt.ele:'ul';
	this.text = opt.text?opt.text:'正在搜索';
	this.non_tip = opt.non_tip?opt.non_tip:'没有更多了';
	this.data = {
		page: this.page,
		keywords: this.keywords
	};
}
ScrollPage.prototype.getData = function(data,cb){
	if(this.mark==0){
		this.mark = 1;
	}else{
		return false;
	}
	if(this.page==1){
		$(this.ele).html('');
		private_wxLoadToast(this.text);
	}else{
		private_wxloadmore(this.ele);
	}
	var that = this;
	$.ajax({
		url:route(this.url),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:data,
		success:function(res){
			$('.weui-loadmore,#loadingToast').remove();
			that.mark = 0;
			that.page++;
			cb(res);
		}
	});
}
ScrollPage.prototype.setList = function(temp,res){
	$('.li-mark').remove();
	temp += '<li class="weui-cell weui-cell_access li-mark"></li>';
	$(this.ele).append(temp);
}
function private_wxloadmore(ele){
	if($('.weui-loadmore').length!=0) return;
	var str = '<div class="weui-loadmore">'+
		        '<i class="weui-loading"></i>'+
		        '<span class="weui-loadmore__tips">正在加载</span>'+
		    '</div>';
	$(ele).append(str);
}
function private_wxLoadToast(text){
	if($('#loadingToast').length!=0) return;
	var str = '<div id="loadingToast">'+
			        '<div class="weui-mask_transparent"></div>'+
			        '<div class="weui-toast">'+
			            '<i class="weui-loading weui-icon_toast"></i>'+
			            '<p class="weui-toast__content">'+text+'</p>'+
			        '</div>'+
			    '</div>';
	$('body').append(str);
}
function private_wxToast(text){
	if($('#toast').length!=0) return;
	var str = '<div id="toast">'+
		        '<div class="weui-mask_transparent"></div>'+
		        '<div class="weui-toast">'+
		            '<i class="weui-icon-success-no-circle weui-icon_toast"></i>'+
		            '<p class="weui-toast__content">'+text+'</p>'+
		        '</div>'+
		    '</div>';
	$('body').append(str);
	setTimeout(function(){
		$('#toast').remove();
	},2000);
}

//pc端分页
function Page(opt){
	this.page = opt.page;
	this.url = opt.url;
	this.keywords = opt.keywords?opt.keywords:'';
}
Page.prototype.next = function(data,cb){
	var page = this.page;
	page++;
	data.page = page;
	this.page = page;
	var that = this;
	toast('正在搜索','info',1);
	$.ajax({
		url:route(this.url),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			page: this.page,
			keywords: this.keywords
		},
		success:function(res){
			$('.my-toast').remove();
			if(res.data[0]==null) that.page--;
			cb(res);
		}
	});
}
Page.prototype.prev = function(data,cb){
	var page = this.page;
	page--;
	if(page==0){
		toast('已是第一页');
		return;
	}
	data.page = page;
	this.page = page;
	toast('正在搜索','info',1);
	$.ajax({
		url:route(this.url),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			page: this.page,
			keywords: this.keywords
		},
		success:function(res){
			$('.my-toast').remove();
			cb(res);
		}
	});
}
Page.prototype.setList = function(res,cb){
	if(res.data[0]==null){
		toast('没有更多了');
		return;
	}
	var str = '';
	for (var i = 0; i < res.data.length; i++) {
		str += '<li onclick="checkCpy(this);" data-no="'+res.data[i][0].contract_no+'">'+
					'<p>'+
						'<span>'+res.data[i][0].contract_no+'</span>'+
						'<span>'+res.data[i][0].goods_name+'×'+res.data[i][0].goods_num+'</span>'+
					'</p>'+
				'</li>';
	};
	$('.bar-bottom ul').html(str);
	cb();
}


function InputSearch(obj,url){
	this.obj = obj;
	this.url = url;
}
InputSearch.prototype.init = function(cb){
	var obj = this.obj;
	var that = this;
	this.m_key = $(obj).attr('name');
	this.m_val = $(obj).val();
	var width = $('td').width()?$('td').width():$('.weui-cell__bd').width();
	var str = '<div class="weui-actionsheet__menu" style="width:'+width+'px;max-height:240px;overflow:auto;position:absolute;margin-top:6px;border: 1px solid #C5C5C5;">'+
	                '<div class="weui-actionsheet__cell" style="text-align:center">'+
	                	'<i class="weui-loading weui-icon_toast" style="text-align:center;margin:0px;"></i>'+
	                '</div>'+
		    	'</div>';
	$(obj).parent().css('position','realtive');
	$(obj).parent().append(str);
	$(obj).on('keyup',function(){
		var m_key = '';
		var m_val = $(obj).val();
		m_val = m_val.replace(/\s|\'/g,'');
		cb(m_val);
	});
	$(obj).blur(function(){
		var v = $(obj).val();
		setTimeout(function(){
			if((that.m_val!=v)&&($(obj).attr('data-input-mark')!=1)){
				$(obj).val(that.m_val);
			}
			$(obj).removeAttr('data-input-mark');
			$('.weui-actionsheet__menu').remove();
			$(obj).off();
			$(document).off();
		},100);
	});
	$(document).on('click','.priv_cli',function(){
		var val = $(this).html();
		$(this).parent().prev().val(val);
		$(this).parent().prev().attr('data-input-mark',1);
	});
	cb();
}
InputSearch.prototype.render = function(m_val){
	var that = this;
	$.ajax({
		url:route(that.url),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"key":that.m_key,
			"val":m_val?m_val:that.m_val
		},
		success:function(res){
			if(res&&res.data!=''){
				var str = '';
				for (var i = 0; i < res.data.length; i++) {
					str += '<div class="weui-actionsheet__cell priv_cli" style="text-align:center">'+res.data[i].cn_abb+'</div>';
				};
				$('.weui-actionsheet__menu').html(str);
			}else{
				$('.weui-actionsheet__menu').html('<div class="weui-actionsheet__cell" style="text-align:center">搜索目标不存在</div>');
			}
		}
	});
}
function PcInputSearch(obj,url){
	this.obj = obj;
	this.url = url;
}

PcInputSearch.prototype.init = function(cb){
	if($('.selectList').length>0) return;
	var that = this;
	$('.selectList').html('');
	var key = $(this.obj).attr('name');
	this.m_key = key;
	var _val = $(this.obj).val();
	this.m_val = _val;
	var val = _val.replace(/\s|\'/g,'');
	var width = $(this.obj).width();
	str = '<ul class="selectList" style="width:'+width+'px;text-align:center;">正在搜索</ul>';
	$(this.obj).parent().append(str);
	$(this.obj).blur(function(){
		if(!that.blur){
			$(that.obj).val(that.m_val);
		}
		$(that.obj).off();
		setTimeout(function(){
			$('.selectList').remove();
		},200);
	});
	$(this.obj).on('keyup',function(){
		var _val = $(that.obj).val();
		var val = _val.replace(/\s|\'/g,'');
		cb(val);
	});
	cb(val);
}
PcInputSearch.prototype.render = function(m_val){
	var that = this;
	$.ajax({
		url:route(that.url),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"key":that.m_key,
			"val":m_val?m_val:that.m_val
		},
		success:function(res){
			if(res&&res.data!=''){
				var str = '';
				res.data.forEach(function(item){
					str +='<li>'+item.cn_abb+'</li>';
				});
				var width = $(that.obj).width();
				$(that.obj).parent().css('position','relative');
				$(that.obj).parent().find('ul').html(str);

				$('.selectList li').mouseover(function(){
					$(this).css('background','#999');
				});
				$('.selectList li').mouseout(function(){
					$(this).css('background','#fff');
				});
				$('.selectList li').click(function(){
					var val = $(this).html();
					$(that.obj).val(val);
					that.val = m_val;
					setTimeout(function(){
						$('.selectList').remove();
					},200);
				});
			}else{
				$('.selectList').html('不存在');
			}
		}
	});
}

function SelectList(obj){
	this.obj = obj;
}
SelectList.prototype.init = function(){
	if($('.selectList').length>0) return;
	var that = this;
	var val = $(this.obj).val();
	this.val = val;
	var width = $(this.obj).width();
	var arr = $(this.obj).attr('data-arr').split(',');
	var str = '';
	for (var i = 0; i < arr.length; i++) {
		str += '<li>'+arr[i]+'</li>';
	};
	str = '<ul class="selectList" style="width:'+width+'px;text-align:center;">'+str+'</ul>';
	$(this.obj).parent().append(str);
	$(this.obj).parent().css('position','relative');
	$('.selectList li').mouseover(function(){
		$(this).css('background','#999');
	});
	$('.selectList li').mouseout(function(){
		$(this).css('background','#fff');
	});
	$(this.obj).blur(function(){
		$(that.obj).val(that.val);
		setTimeout(function(){
			$('.selectList').remove();
		},200);
		$(that.obj).off();
	});
	$('.selectList li').click(function(){
		var val = $(this).html();
		that.val = val;
		$(that.obj).val(val);
		setTimeout(function(){
			$('.selectList').remove();
		},200);
	});
}