var keywords,filter,page=2;
var getting = 0;
$(document).ready(function(){ 
	var isAndroid = /Android|wechatdevtools/ig.test(navigator.userAgent);
	window.onscroll = function(){
		var h_window = window.innerHeight;
		var h_body = $('body').height();
		// var h_scroll = isAndroid ? $('body').scrollTop() : document.documentElement.scrollTop;
		var h_scroll = document.documentElement.scrollTop || $('body').scrollTop();
		// var h_scroll = $('body').scrollTop();
		if(h_body-h_window-h_scroll<20){
			if(!getting) getList();
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
	keywords = $('.form input').val();
	keywords = keywords.toUpperCase();
	page = 1;
	getList();
}
function sort(obj){
	page = 1;
	filter = $(obj).val();
	getList();
}
function getList(){
	getting = 1;
	$.ajax({
        url:route('repair/index'),
        type:'get',
        dataType:'json',
        timeout:30000,
        data: {
        	page: page,
            keywords: keywords,
            filter: filter
        },
        success:function(res){
        	var _data = res.data.res_arr;
        	if(_data[0]==null){
				var msg = res.msg?res.msg:'没有更多了';
				wxToast(msg);
				return;
			}else{
				page++;
				getting = 0;
				var m_str = '';
				for (var i = 0; i < _data.length; i++) {
					try{
						var img = _data[i].album.split(',')[0];
						if (img) {
							img = '/repair/small_104_' + img.split('/repair/')[1];
						} else {
							img = '';
						}
					}catch(e){
						var img = '';
					}
					if(img==''){
						var img_str = '<img class="assign_member" src="../img/no_img.png">';
					}else{
						var img_str = '<img class="assign_member" src="../img'+img+'">';
					}
					m_str += '<li class="weui-cell weui-cell_access" style="padding-left:0px;" onclick="check(this)" data-no="'+_data[i].repair_contractno+'">'+
				                '<div class="weui-cell__hd">'+
									'<div class="default_member">'+img_str+'</div>'+
								'</div>'+
				                '<div class="weui-cell__bd">'+
				                    '<p>序列号：'+_data[i].serial_no+'</p>'+
									'<p class="content-cpy">当前状态：'+_data[i].deliver_state+'</p>'+
									'<p class="content-cpy">送修单位：'+_data[i].cust_name+'</p>'+
				                '</div>'+
				                '<div class="weui-cell__ft">'+
				                '</div>'+
				            '</li>';
				};
				if(page==2){
					$('.content ul').html('');
				}
				$('.content ul').append(m_str);
			}
        }	
    });
}
function check(obj){
	var no = $(obj).attr('data-no');
	window.location.href = route('repair/info/'+no);
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
							var sn = res.resultStr.split(',')[1];
							getNotDeliveryNoBySn(sn);
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

function getNotDeliveryNoBySn(sn) {
	window.location.href = route('repair/getNotDeliveryNoBySn?sn=' + sn);
}