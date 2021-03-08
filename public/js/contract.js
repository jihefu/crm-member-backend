var scrollPage;
$(document).ready(function(){ 
	scrollPage = new ScrollPage({
		url: 'contract/index'
	});
	scrollPage.page = 2;
	var isAndroid = /Android|wechatdevtools/ig.test(navigator.userAgent);
	window.onscroll = function(){
		var h_window = window.innerHeight;
		var h_body = $('body').height();
		// var h_scroll = isAndroid ? $('body').scrollTop() : document.documentElement.scrollTop;
		var h_scroll = document.documentElement.scrollTop || $('body').scrollTop();
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
	scrollPage.keywords = keywords;
	scrollPage.page = 1;
	scrollPage.mark = 0;
	render({
		page: scrollPage.page,
		keywords: scrollPage.keywords
	});
}
function render(data){
	scrollPage.getData(data,function(res){
		if(res.code==-100){
			reload(res.msg);
			return;
		}
		var _data = res.data;
		if(_data[0]==null){
			wxToast('没有更多了');
			scrollPage.mark = 1;
			return;
		}else{
			var m_str = '';
			for (var i = 0; i < _data.length; i++) {
				if(!_data[i].sign_time) _data[i].sign_time = '';
				if(!_data[i].delivery_state) _data[i].delivery_state = '';
				var payable = _data[i].payable;
				var paid = _data[i].paid;
				if(payable==paid){
					var pay_status = '付款状态：已付全款';
				}else{
					var pay_status = '付款状态：未付全款';
				}
				if(_data[i].complete){
					var complete = '<span class="iconfont icon-complete"></span>';
				}else{
					var complete = '';
				}
				var goods_str = '';
				for(var j = 0; j<_data[i].body.length; j++){
					goods_str += '<span class="goods">'+_data[i].body[j].goods_name+'×'+_data[i].body[j].goods_num+'</span>';
				}
				var cus_str = '';
				if(_code==10001){
					cus_str = '<p>采购方：'+_data[i].cus_abb+'</p>';
				}
				m_str += '<li class="weui-cell weui-cell_access" style="padding-left:0px;" onclick="check(this)" data-no="'+_data[i].contract_no+'">'+
			                '<div class="weui-cell__bd">'+complete+
			                    '<p>合同编号：'+_data[i].contract_no+'</p>'+
								'<p>签订日期：'+_data[i].sign_time+'</p>'+cus_str+
								'<p class="content-cpy">货品：'+goods_str+'</p>'+
								'<p>'+
									'<span class="goods">发货状态：'+_data[i].delivery_state+'</span>'+
									'<span>'+pay_status+'</span>'+
								'</p>'+
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
	var no = $(obj).attr('data-no');
	window.location.href = route('contract/head/'+no);
}

function scan() {
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
        	config.jsApiList = ['scanQRCode'];
        	wx.config(config);
        	wx.ready(function(){
        		wx.scanQRCode({
				    desc: 'scanQRCode desc',
				    needResult: 1, 
				    scanType: ["qrCode","barCode"],
				    success: function (res) {
						try{
							var contractNo = res.resultStr.split(',')[1];
							window.location.href = route('contract/head/'+contractNo);
						}catch(e){
							wxToast('非法条形码');
						}
				    },
				    error: function(err){
				        if(err.errMsg.indexOf('function_not_exist') > 0){
			               alert('版本过低请升级');
			            }
				    }
				});
        	});
        }
    });
}