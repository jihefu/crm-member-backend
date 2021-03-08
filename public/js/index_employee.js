var page=2,t_count = 0;
$(document).ready(function(){
	var height = window.innerHeight;
	var isAndroid = /Android|wechatdevtools/ig.test(navigator.userAgent);
	window.onscroll = function(){
		// var s_height = $('body').scrollTop();
		// var s_height = isAndroid ? $('body').scrollTop() : document.documentElement.scrollTop;
		var s_height = document.documentElement.scrollTop || $('body').scrollTop();
		var b_height = $('body').height();
		if(b_height-height-s_height<20){
			if($('body').attr('data-scroll')!=1){
				$('body').attr('data-scroll',1);
				getList('normal');
			}
		}
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
		slideDel();
		$('body').click(function(){
			t_count=0;
		});
	}
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
function check(obj){
	if(t_count==1){
		cancelDel();
		return;
	}
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
function del(obj){
	var sn = $(obj).parent().attr('data-sn');
	var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
		            '<div class="weui-mask"></div>'+
		            '<div class="weui-dialog">'+
		                '<div class="weui-dialog__hd" style="border-bottom:none;"><strong class="weui-dialog__title">提示</strong></div>'+
		                '<div class="weui-dialog__bd" style="margin-top:0px;height:auto;font-size: 16px;">确定删除此卡？</div>'+
		                '<div class="weui-dialog__ft">'+
		                   '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="delSub(\''+sn+'\')";>确定</a>'+
		                    '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="cancel()";>取消</a>'+
		                '</div>'+
		            '</div>'+
		        '</div>';
	$('body').append(str);
}
function delSub(sn){
	cancel();
	wxLoadToast('正在删除');
	$.ajax({
		url:route('service/products/del'),
		type:'delete',
		dataType:'json',
		timeout:30000,
		data:{
			'sn':sn
		},
		success:function(res){
			if(res&&res.code==200){
				$('#loadingToast').remove();
				wxToast('删除成功！');
				$('.content li[data-sn='+sn+']').remove();
			}
		}
	});
}
function cancel(){
	$('#iosDialog1').remove();
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
				cancelListen();
			}else{
				wxToast('没有更多了');
			}
		}
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
function add(){
	var sn = $('.form input').val();
	if(sn==''||!/^(\d+)$/.test(sn)){
		alertToast('请输入序列号！');
		return;
	}
	if(sn.length>7){
		alertToast('请勿超过七位数！');
		return;
	}
	tipAddType();

	function tipAddType() {
		var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
					'<div class="weui-mask"></div>'+
					'<div class="weui-dialog">'+
						'<div class="weui-dialog__hd"><strong class="weui-dialog__title">提示</strong></div>'+
						'<div class="weui-dialog__bd">'+
							'<div class="weui-cell" style="display:flex;">'+
								// '<div class="weui-cell__hd" style="width: 70px;text-align: left;"><label class="weui-label">外出原因：</label></div>'+
								'<div class="weui-cell__bd">控制器类型</div>'+
							'</div>'+
						'</div>'+
						'<div class="weui-dialog__ft">'+
							'<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="typeV('+sn+');">威程</a>'+
							'<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="typeD('+sn+');">代龙</a>'+
						'</div>'+
					'</div>'+
				'</div>';
		$('body').append(str);
	}
}

function typeD(sn) {
	$.ajax({
		url:route('service/products/add'),
		type:'post',
		timeout:30000,
		data:{
			'sn':sn,
			model: 'D900'
		},
		success:function(res){
			if(res.code==-1){
				alertToast(res.msg);
			}else{
				window.location.href = route('service/product/dyna/'+sn+'?add_sn=1');
			}
		}
	});
}

function typeV(sn) {
	$.ajax({
		url:route('service/products/add'),
		type:'post',
		timeout:30000,
		data:{
			'sn':sn,
			model: 'V802'
		},
		success:function(res){
			if(res.code==-1){
				alertToast(res.msg);
			}else{
				window.location.href = route('service/product/vir8/'+sn+'?add_sn=1');
			}
		}
	});
}

function codeScan(){
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
							// 判断序列号是威程还是代龙
							jumpToInfoPage(sn);
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

function jumpToInfoPage(sn) {
	$.ajax({
        url: route('service/product/checkCtrlCardType/' + sn),
        type: 'get',
        dataType:"json",
        success: function(res) {
			if (res.code == -1) {
				wxToast(res.msg);
			} else {
				var type = res.data.type;
				if (type == 'D') {
					window.location.href = route('service/product/dyna/'+sn);
				} else {
					window.location.href = route('service/product/vir8/'+sn);
				}
			}
		}
	});
}