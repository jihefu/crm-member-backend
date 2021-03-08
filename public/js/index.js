var page=2;
$(document).ready(function(){
	var height = window.innerHeight;
	var isAndroid = /Android|wechatdevtools/ig.test(navigator.userAgent);
	window.onscroll = function(){
		// var s_height = $('body').scrollTop();
		// var s_height = isAndroid ? $('body').scrollTop() : document.documentElement.scrollTop;
		var s_height = document.documentElement.scrollTop || $('body').scrollTop();
		var b_height = $('body').height();
		if(b_height-height-s_height<20){
			if($('body').attr('data-scroll')==0){
				$('body').attr('data-scroll',1);
				getList('normal');
			}
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
function search(){
	var val = $('.form input').val();
	if(val!=''){
		if(!/^(\d+)$/.test(val)){
			$('.form input').val('');
			alertToast('请输入数字！');
			return;
		}
	}
	if(val.length>7){
		$('.form input').val('');
		alertToast('请勿超过七位数！');
		return;
	}else if(val=='0'){
		$('.form input').val('');
		alertToast('输入不合法！');
		return;
	}
	page = 1;
	wxLoadToast('正在搜索');
	getList('search');
}

function getList(type){
	var keywords = $('.form input').val();
	$.ajax({
		url:route('service/products'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'page': page,
			'keywords': keywords
		},
		success:function(res){
			$('#loadingToast').remove();
			if(res.data[0]!=null){
				page++;
				$('body').attr('data-scroll',0);
				var data = res.data;
				var str = '';
				for (var i = 0; i < data.length; i++) {
					var model = data[i].model?data[i].model:'AD800';
					if(data[i].validTime==''||data[i].validTime==null||data[i].validTime=='null'){
						var validTime = '';
					}else if(data[i].validTime==0){
						var validTime = '永久注册';
					}else{
						var validTime = data[i].validTime;
					}
					// if(data[i].validTime==0){
					// 	var validTime = '永久注册';
					// }else if(data[i].validTime==''||data[i].validTime==null||data[i].validTime=='null'){
					// 	var validTime = '';
					// }else{
					// 	var validTime = data[i].validTime;
					// }
					if(model=='V802'){
						var src = '../img/small_802.png';
					}else if(model=='V801'){
						var src = '../img/small_801.png';
					}else if(model=='V800'){
						var src = '../img/small_800.png';
					}else if(model=='V881'){
						var src = '../img/small_881.png';
					}else if(model=='V884'){
						var src = '../img/small_884.png';
					}else if(model=='V882'){
						var src = '../img/small_884.png';
					}else if(model=='D700'){
						var src = '../img/small_700.png';
					}else if(model=='D900'){
						var src = '../img/small_900.png';
					}else if(model=='D910'){
						var src = '../img/small_910.png';
					}else if(model=='D921'){
						var src = '../img/small_921.png';
					}else{
						var src = '../img/small_ad800.png';
					}
					str += '<li class="weui-cell weui-cell_access" style="padding-left:0px;" onclick="check(this)" data-model="'+data[i].model+'" data-sn="'+data[i].serialNo+'">'+
							'<div class="weui-cell__hd">'+
								'<img src="'+src+'" alt="">'+
							'</div>'+
							'<div class="weui-cell__bd">'+
								'<p>序列号：'+data[i].serialNo+'</p>'+
								'<p>型号：'+model+'</p>'+
								'<p>有效期：'+validTime+'</p>'+
							'</div>'+
							'<div class="weui-cell__ft"></div>'+
						'</li>';
				};
				if(type=='search'&&page==2){
					$('.content ul').html('');
				}else{
					$('.li-mark').remove();
				}
				$('.content ul').append(str+'<li class="weui-cell weui-cell_access li-mark"></li>');
			}else{
				wxToast('没有更多了');
			}
		}
	});
}
function check(obj){
	var sn = $(obj).attr('data-sn');
	var model = $(obj).attr('data-model');
	if (/^D/.test(model)) {
		window.location.href = route('service/product/dyna/'+sn);
	} else {
		window.location.href = route('service/product/vir8/'+sn);
	}
}
function cl(){
	$('.form input').val('');
}
function codeScan(){
	// var page = 'http://www.langjie.com:8090/service/products';
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
							window.location.href = route('service/product/vir8/'+sn);
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