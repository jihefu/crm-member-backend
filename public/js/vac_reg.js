var t;
var regArr = [];
var ITEM;
$(document).ready(function(){
	compatIos();
	getRegEvent();
	if (productInfo.funCodeAuth == 0) {
		$('.funRadio').hide();
	}
	if (!productInfo.regAppName) {
		$('.appRadio').hide();
	} else {
		var appArr = [], endArr = [];
		try {
			appArr = productInfo.regAppName.split(',');
		} catch (error) {
			
		}
		for (var i = 0; i < appArr.length; i++) {
			if (appArr[i]) endArr.push(appArr[i]);
		}
		var w = $('input[name=mid]').width();
		var str = '<select name="appNameSelect" class="k-input" style="width: '+w+'px">';
		for (var i = 0; i < endArr.length; i++) {
			str += '<option value="'+endArr[i]+'">'+endArr[i]+'</option>';
		}
		str += '</select><span class="iconfont icon-triangledown"></span>';
		$('.appSelect').html(str);
	}
	$('input[name=target]').change(function(){
		if($('input[name=target]:checked').val()==1){
			// App注册
			$('.targetApp').css('display', 'flex');
			$('.targetMid,.targetFun').hide();
		} else if ($('input[name=target]:checked').val()==2) {
			// 功能码注册
			$('.targetFun').css('display', 'flex');
			$('.targetMid,.targetApp').hide();
		} else {
			// 控制器注册
			$('.targetMid').css('display', 'flex');
			$('.targetApp,.targetFun').hide();
		}
	});
	$('input[name=reg]').change(function(){
		if($('input[name=reg]:checked').val()==1){
			var date = new Date();
			var yy = date.getFullYear();
			var mm = date.getMonth()+1<10?'0'+(date.getMonth()+1):date.getMonth()+1;
			var val = yy+'-'+mm;
			$('#useDate').val(val);
			if($('.reg_time').hasClass('m')){
				$('.reg_time').show();
			}else{
				$('.reg_time').show().addClass('m');
				scroller();
			}
		}else{
			$('.reg_time').hide();
			$('#useDate').val('');
		}
		resize();
	});
	$('button').show().kendoButton();
	resize();
	$('#useDate').click(function(){
		setTimeout(function(){
	    	$('.dwb-n span').trigger('click');
	    },500);
	});
	initAppSelect();
});

function resize(){
	var height = window.innerHeight;
	var form = document.getElementsByClassName('form')[0].offsetHeight;
	document.getElementsByTagName('body')[0].style.height=height+'px';
	document.getElementsByClassName('event')[0].style.height=height-form+'px';
}
function searchSN(){
	var val = $('input[name=sn]').val();
	clearTimeout(t);
	$('.event').html('<p style="text-align:center">正在搜索...</p>');
	t = setTimeout(function(){
		getRegEvent();
	},1000);
}

function scroller(){
	var curr = new Date().getFullYear();
    var opt = {  
		'default': {
			theme: 'default',
			mode: 'scroller',
			display: 'modal',
			animate: 'fade',
			dateFormat: 'yyyy-mm'
        },		
		'dateYM': {
            preset: 'date',
			dateFormat: 'yyyy-mm',
			defaultValue: new Date(new Date()),					
			onBeforeShow: function (inst) { 
				if(inst.settings.wheels[0].length>2)
				{
					inst.settings.wheels[0].pop();
				}else{
					null
				}
			}
        },
    }
    $('#useDate').scroller($.extend(opt['dateYM'],opt['default']));
}

function sendSMS(obj){
	var p = $(obj).parent();
	var option = {
		name: GetRequest('name'),
		phone: GetRequest('phone'),
		regCode: p.find('.s-regCode').html(),
		authOperKey: p.find('.s-authOperKey').html(),
		sn: p.attr('data-sn'),
		mid: GetRequest('mid'),
		appName: p.attr('data-appName')
	};
	option = JSON.stringify(option);
	if(GetRequest('phone')){
		var str = '<div class="js_dialog" id="iosDialog2">'+
	        '<div class="weui-mask"></div>'+
	        '<div class="weui-dialog">'+
	            '<div class="weui-dialog__bd">'+
					'<p style="margin-top:8px">确定发送短信？</p>'+
				'</div>'+
	            '<div class="weui-dialog__ft">'+
	                '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary">确定</a>'+
	                '<a href="javascript:;" onclick="cancel()" class="weui-dialog__btn">取消</a>'+
	            '</div>'+
	        '</div>'+
	    '</div>';
		$('body').append(str);
		$('#iosDialog2 .weui-dialog__ft a').eq(0).attr('onclick','send('+option+')');
	}else{
		wxToast('无法发送短信');
	}
}
function send(option){
	option = JSON.stringify(option);
	$('#iosDialog2 .weui-dialog__bd p').html('正在发送中...');
	$.ajax({
		url:route('sms/reg_code'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			option: option
		},
		success:function(res){
			cancel();
			wxToast(res.msg);
		}
	});
}

function sub(){
	var time = $('#useDate').val() ? $('#useDate').val() : 0;
	var data = {
		"sn": sn,
		"mid": mid,
		"time":time,
	};
	if ($('input[name=target]:checked').val() == 1) {
		data.isAppReg = 1;
		data.appName = $('select[name=appNameSelect]').val();
	} else if ($('input[name=target]:checked').val() == 2) {
		data.isFunReg = 1;
		data.funCode = $('input[name=fun]').val();
		if (data.funCode == '') {
			wxToast('请输入功能码');
			return;
		}
	} else {
		data.mid = $('input[name=mid]').val()
		if(/^\d+$/.test(data.mid)==false){
			wxToast('请输入纯数字！');
			return;
		}
	}
	wxLoadToast('正在提交');
	$.ajax({
		url:route('service/product/subReg'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:data,
		success:function(res){
			if(res&&res.code==200){
				$('#loadingToast').remove();
				if(res.data.msg){
					var _str = '<p style="margin-top:10px;">'+res.data.msg+'</p>';
				}else{
					var _str = '';
				}
				if(res.data.regCode){
					var code = res.data.regCode;
				}else{
					var code = res.data.appRegCode;
				}
				var str = '<div class="js_dialog" id="iosDialog2">'+
				            '<div class="weui-mask"></div>'+
				            '<div class="weui-dialog">'+
				                '<div class="weui-dialog__bd">'+
				                	'<p>注册码：'+code+'</p>'+
									'<p style="margin-top:8px">授权操作码：'+res.data.authOperKey+'</p>'+_str+
								'</div>'+
				                '<div class="weui-dialog__ft">'+
									'<a href="javascript:;" onclick="comfirm()" class="weui-dialog__btn weui-dialog__btn_default">确定</a>'+
									'<a href="javascript:;" onclick="copyFun('+code+', '+res.data.authOperKey+')" class="weui-dialog__btn weui-dialog__btn_primary">复制</a>'+
				                '</div>'+
				            '</div>'+
				        '</div>';
				$('body').append(str);
		        getRegEvent();
			}else{
				$('#loadingToast').remove();
				var str = '<div class="js_dialog" id="iosDialog2">'+
				            '<div class="weui-mask"></div>'+
				            '<div class="weui-dialog">'+
				                '<div class="weui-dialog__bd">'+
				                	'<p>'+res.msg+'</p>'+
								'</div>'+
				                '<div class="weui-dialog__ft">'+
				                    '<a href="javascript:;" onclick="comfirm()" class="weui-dialog__btn weui-dialog__btn_primary">确定</a>'+
				                '</div>'+
				            '</div>'+
				        '</div>';
				$('body').append(str);
			}
		}
	});
}
function copyFun(regCode, regAuthCode) {
	copyToClipboard('注册码：'+regCode+'\n授权操作码：'+regAuthCode, {
		debug: true,
	});
	wxToast('复制成功');
}
function getRegEvent(){
	$(".event").html('<p style="text-align:center">正在搜索...</p>');
	$.ajax({
		url:route('service/product/regEvent'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"sn":sn,
		},
		success:function(res){
			if(res&&res.data!=''){
				var str = '';
				regArr = res.data;
				for (var i = 0; i < res.data.length; i++) {
					if(res.data[i].validDate==0){
						_str = '已永久注册。';
					}else{
						_str = '有效期至'+res.data[i].validDate+'。';
					}
					var stamp = Date.parse(new Date(res.data[i].regDate.replace(/-/g, '/')));
					str += '<p onclick="releaseReg(this);" data-isFunReg="'+res.data[i].isFunReg+'" data-id="'+res.data[i].id+'" data-sn="'+res.data[i].sn+'" data-mid="'+res.data[i].mid+'" data-appName="'+res.data[i].product+'">'+
								'<span style="color: #333;" class="e-time" data-time="'+stamp+'">'+res.data[i].regDate+':  </span></br>'+
								'<span>'+res.data[i].name+'（'+res.data[i].company+'）注册产品'+res.data[i].product+'，</span>'+
									'<span>'+_str+'</span>'+
								'<span>注册码：<span class="s-regCode">'+res.data[i].regCode+'</span>，授权操作码：<span class="s-authOperKey">'+res.data[i].authOperKey+'</span>。</span>'+
								'<button onclick="sendSMS(this);">【短信通知】</button>'+
							'</p>';
				};
				$(".event").html(str);
				setTimeout(function(){
					if(GetRequest('phone')){
						$('.event button').show();
					}
				},50);
				fetchHasReleaseInfo();
			}else{
				$(".event").html('<p style="text-align:center">暂无注册记录</p>');
			}
		}
	});
}
function comfirm(){
	$('#iosDialog2').remove();
}
function cancel(){
	$('#iosDialog2').remove();
}
function picker(){
	$.ajax({
		url:route('service/getAppNameList'),
		type:'get',
		dataType:'json',
		timeout:30000,
		success:function(res){
			var appName_arr = [];
			res.data.forEach(function(items,index){
				var obj = {};
				obj.label = items.appName;
				obj.value = items.appName;
				appName_arr.push(obj);
			});
			weui.picker(appName_arr,{
				onConfirm: function(result){
					$('input[name=app]').val(result[0]);
				}
			});
		}
	});
}
function compatIos(){
	var ua = navigator.userAgent;
	if(/iphone|ipod|ipad/ig.test(ua)){
		var str = '<span class="iconfont icon-triangledown"></span>';
		$('.mid').parent().append(str);
		$('.sn').css({
			'margin-right': '1.125rem'
		});
	}
}

function releaseReg(obj) {
	var id = $(obj).attr('data-id');
	var sn = $(obj).attr('data-sn');
	var isFunReg = $(obj).attr('data-isFunReg');
	if (isFunReg == 1) {
		wxToast('功能码暂不支持公开');
		return;
	}
	if ($(obj).find('.isOpen').length === 1) {
		var str = '<div class="js_dialog" id="iosDialog2">'+
				'<div class="weui-mask"></div>'+
				'<div class="weui-dialog">'+
					'<div class="weui-dialog__bd">'+
						'<p>关闭该注册信息？</p>'+
					'</div>'+
					'<div class="weui-dialog__ft">'+
						'<a href="javascript:;" onclick="subReleaseDestroy('+sn+')" class="weui-dialog__btn weui-dialog__btn_primary">确定</a>'+
						'<a href="javascript:;" onclick="cancel()" class="weui-dialog__btn weui-dialog__btn_default">取消</a>'+
					'</div>'+
				'</div>'+
			'</div>';
		$('body').append(str);
		return;
	}
	for (var i = 0; i < regArr.length; i++) {
		if (regArr[i].id == id) {
			ITEM = regArr[i];
			break;
		}
	}
	ITEM.regPerson = ITEM.name;
	var validDate;
	if (ITEM.validDate == 0) {
		validDate = '永久';
	} else {
		validDate = ITEM.validDate;
	}
	var str = '<div class="js_dialog" id="iosDialog2">'+
				'<div class="weui-mask"></div>'+
				'<div class="weui-dialog">'+
					'<div class="weui-dialog__bd">'+
						'<p>公开有效期为<span style="">'+validDate+'</span>的注册信息？</p>'+
					'</div>'+
					'<div class="weui-dialog__ft">'+
						'<a href="javascript:;" onclick="subRelease()" class="weui-dialog__btn weui-dialog__btn_primary">确定</a>'+
						'<a href="javascript:;" onclick="cancel()" class="weui-dialog__btn weui-dialog__btn_default">取消</a>'+
					'</div>'+
				'</div>'+
			'</div>';
	$('body').append(str);
}

function subRelease() {
	const pd = ITEM.product;
	if (pd.indexOf('V') === -1 && pd.indexOf('800') === -1) {
		ITEM.appRegCode = ITEM.regCode;
		ITEM.appAuthOperKey = ITEM.authOperKey;
		ITEM.appValidDate = ITEM.validDate;
		ITEM.appRegDate = ITEM.regDate;
		ITEM.appRegPerson = ITEM.regPerson;
		delete ITEM.regCode;
		delete ITEM.authOperKey;
		delete ITEM.validDate;
		delete ITEM.regDate;
		delete ITEM.regPerson;
	}
	cancel();
	wxLoadToast('正在提交');
	$.ajax({
		url:route('service/releaseReg'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: ITEM,
		success:function(res){
			$('#loadingToast').remove();
			wxToast(res.msg);
			getRegEvent();
		}
	});
}

function subReleaseDestroy(sn) {
	cancel();
	wxLoadToast('正在提交');
	$.ajax({
		url:route('service/releaseRegDestroy/' + sn),
		type:'delete',
		dataType:'json',
		timeout:30000,
		success:function(res){
			$('#loadingToast').remove();
			wxToast(res.msg);
			getRegEvent();
		}
	});
}

function fetchHasReleaseInfo() {
	$.ajax({
		url:route('service/getRegInfoFromCloud/' + sn),
		type:'get',
		dataType:'json',
		timeout:30000,
		success:function(res){
			if (res.code==200) {
				$('.e-time[data-time="'+Date.parse(res.data.regDate)+'"]').html('<span style="color: #f60;position: relative;left: -5px;" class="isOpen">【已公开】</span>' + $('.e-time[data-time="'+Date.parse(res.data.regDate)+'"]').html());
				$('.e-time[data-time="'+Date.parse(res.data.appRegDate)+'"]').html('<span style="color: #f60;position: relative;left: -5px;" class="isOpen">【已公开】</span>' + $('.e-time[data-time="'+Date.parse(res.data.appRegDate)+'"]').html());
			}
		}
	});
}

function initAppSelect() {
	var appName = GetRequest('appName');
	if (!appName) return;
	$('.appRadio').trigger('click');
	$('select[name=appNameSelect]').val(appName);
}