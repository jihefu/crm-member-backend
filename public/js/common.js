var DIRECTOR = [101,1003,1103,1702];
var inter_action_temp_arr = [
	{
		key: 'json/txt',
		name: '通用文本'
	},
	{
		key: 'json/knowledge',
		name: '售后·知识'
	},
	{
		key: 'json/sign',
		name: '售前·签订'
	}
];
var router = function(options){
	return 'http://192.168.50.230:8090/admin/'+options;
}
function route(options){
	return 'http://192.168.50.230:8090/'+options;
}
var mRoute = function(options){
	return 'http://192.168.50.230:8090/m/'+options;
}
var wxmpRoute = function(options){
	return 'https://mp.langjie.com/wx'+options;
}
var log = function(options){
	if(typeof(options)=='string'){
		return console.log(options);
	}else{
		return console.log(JSON.stringify(options));
	}
}
function wxloadmore(el){
	var str = '<div class="weui-loadmore">'+
		        '<i class="weui-loading"></i>'+
		        '<span class="weui-loadmore__tips">正在加载</span>'+
		    '</div>';
	$(el).append(str);
}
function toast(text,type,num){
	var ty = type?type:'danger';
	var sec = num?num:2000;
	var str = '<div class="my-toast" style="width:100%;position:absolute;top:40%;z-index:9999;"><div class="alert alert-'+ty+'" style="width:500px;margin:0 auto">'+text+'</div></div>';
	$('#wrap').prepend(str);
	if(sec!=1){
		setTimeout(function(){
			$('.my-toast').remove();
		},sec);
	} 
}
function mToast(text,n){
	var str = '<div class="my-toast" style="width:100%;position:absolute;top:40%;z-index:9999;">'+
					'<div style="width: 215px;background: #f2dede;color: #a94442;text-align: center;padding: 14px;border-radius: 4px;margin:0 auto">'+text+'</div>'+
				'</div>';
	$('#wrap').prepend(str);
	if(n!=1){
		setTimeout(function(){
			$('.my-toast').remove();
		},2000);
	}
}
function back(){
	window.history.back(-1);
}
function GetRequest(name) { 
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if(window.top!=window.self){
    	r = window.parent.location.search.substr(1).match(reg);
    }
    if (r != null) {
        return r[2];
    }
    return null;
} 
function GetRequestSelf(name){
	var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return r[2];
    }
    return null;
}
function getCookie(cookieName) {
    var strCookie = document.cookie;
    var arrCookie = strCookie.split("; ");
    for(var i = 0; i < arrCookie.length; i++){
        var arr = arrCookie[i].split("=");
        if(cookieName == arr[0]){
            return arr[1];
        }
    }
    return "";
}
function wxLoadToast(text){
	var str = '<div id="loadingToast">'+
			        '<div class="weui-mask_transparent"></div>'+
			        '<div class="weui-toast">'+
			            '<i class="weui-loading weui-icon_toast"></i>'+
			            '<p class="weui-toast__content" style="color: #fff">'+text+'</p>'+
			        '</div>'+
			    '</div>';
	$('body').append(str);
}
function wxToast(text){
	var str = '<div id="toast">'+
		        '<div class="weui-mask_transparent"></div>'+
		        '<div class="weui-toast">'+
		            '<i class="weui-icon-success-no-circle weui-icon_toast"></i>'+
		            '<p class="weui-toast__content" style="color: #fff">'+text+'</p>'+
		        '</div>'+
		    '</div>';
	$('body').append(str);
	setTimeout(function(){
		$('#toast').remove();
	},2000);
}
function wxToastFit(text){
	var str = '<div id="toast">'+
		        '<div class="weui-mask_transparent"></div>'+
		        '<div class="weui-toast" style="width:auto">'+
		            '<i class="weui-icon-success-no-circle weui-icon_toast"></i>'+
		            '<p class="weui-toast__content">'+text+'</p>'+
		        '</div>'+
		    '</div>';
	$('body').append(str);
	setTimeout(function(){
		$('#toast').remove();
	},2000);
}
function alertToast(msg){
	var str = '<div id="toast">'+
		        '<div class="weui-mask_transparent"></div>'+
		        '<div class="weui-toast" style="width:11em;margin-left:-5.5em;">'+
		            '<i class="weui-icon-warn weui-icon_msg" style="margin-top:10px;color:#fff;font-size:74px"></i>'+
		            '<p class="weui-toast__content">'+msg+'</p>'+
		        '</div>'+
		    '</div>';
	$('body').append(str);
	setTimeout(function(){
		$('#toast').remove();
	},2000);
}
function time(t){
  if(t){
  	if(t=='0000-00-00') return t;
    var date = new Date(t);
  }else{
    var date = new Date();
  }
  var yy = date.getFullYear();
  var MM = date.getMonth()+1;
  var dd = date.getDate();
  if(date.getHours()<10){
    var HH = '0'+date.getHours();
  }else{
    var HH = date.getHours();
  }
  if(date.getMinutes()<10){
    var mm = '0'+date.getMinutes();
  }else{
    var mm = date.getMinutes();
  }
  if(date.getSeconds()<10){
    var ss = '0'+date.getSeconds();
  }else{
    var ss = date.getSeconds();
  }
  var time = yy + '-' + MM + '-' + dd +' '+HH+':'+mm+':'+ss;
  return time;
}
function dateTime(t){
  if(t){
  	if(t=='0000-00-00') return t;
    var date = new Date(t);
  }else{
    var date = new Date();
  }
  var yy = date.getFullYear();
  var MM = date.getMonth()+1;
  var dd = date.getDate();
  if(MM<10) MM ='0'+MM;
  if(dd<10) dd ='0'+dd;
  var time = yy + '-' + MM + '-' + dd;
  return time;
}
var kendoDate = function(t){
  if(t){
    var date = new Date(t);
  }else{
    var date = new Date();
  }
  var yy = date.getFullYear();
  var MM = date.getMonth()+1;
  var dd = date.getDate();
  if(MM<10) MM ='0'+MM;
  if(dd<10) dd ='0'+dd;
  // var time = yy + '-' + MM + '-' + dd;
  var time = MM + '/' + dd + '/' + yy;
  return time;
}
function reload(msg){
	wxToast(msg);
	setTimeout(function(){
		window.location.reload();
	},2000);
}
function nav(arr){
	var con_str = '';
	for (var i = 0; i < arr.length; i++) {
		con_str += '<a href="'+arr[i].path+'">'+arr[i].name+'</a>';
	};
	var height = window.innerHeight;
	var _height = height-50;
	var str = '<div class="mobile">'+
				'<div class="mobile-inner">'+
				    '<div class="mobile-inner-nav" style="height:'+_height+'px">'+
					    '<a href="#" style="font-size:20px;font-weight:bold;">快速链接</a>'+con_str+
				    '</div>'+
				'</div>'+
			'</div>'+
			'<div class="mobile-inner-header">'+
		        '<div class="mobile-inner-header-icon mobile-inner-header-icon-out" style="position: absolute;right: 0px;">'+
			        '<span class="first-span first-span-normal"></span>'+
			        '<span class="second-span second-span-normal"></span>'+
			        '<span class="third-span"></span>'+
		    	'</div>'+
		    '</div>';
	$('body').prepend(str);
	setTimeout(function(){
		$(".mobile-inner-header-icon").click(function(){
			$(this).toggleClass("mobile-inner-header-icon-click mobile-inner-header-icon-out");
			$(".mobile-inner-nav").slideToggle(250);
			if($('.mobile').attr('data-mark')==1){
				setTimeout(function(){
					$('.third-span').show();
					$('.mobile').attr('data-mark',0);
					$('.first-span').addClass('first-span-normal');
					$('.second-span').addClass('second-span-normal');
					$('.mobile').css('z-index',0);
					$('.mobile-inner-header-icon').css('z-index',1111);
					$('body').off('touchmove');
				},200);
			}else{
				$('.mobile').attr('data-mark',1);
				$('.third-span').hide();
				$('.first-span-normal').removeClass('first-span-normal');
				$('.second-span-normal').removeClass('second-span-normal');
				$('.mobile').css('z-index',1111);
				$('body').on('touchmove',function(e){
					e.preventDefault();
				})
			}
		});
		$(".mobile-inner-nav a").each(function( index ) {
			$( this ).css({'animation-delay': (index/10)+'s'});
		});
	},100);
}

function dbImg(obj){
	var src = $(obj).attr('src');
	src = route(src.split('../')[1]);
	window.open(src);
}
function checkCode(text){
	var str = '';
	for (var i = 0; i < text.length; i++) {
		if(text[i]=='"'||text[i]=='\''){
			str += '\\'+text[i];
		}else{
			str += text[i];
		}
	};
	return str;
}
function wxDatePicker(obj){
    var text = $(obj).html();
    if(text!=''){
        var y = text.split('-')[0];
        var m = text.split('-')[1];
        var d = text.split('-')[2];
        var defaultValue = [y,m,d];
    }else{
        var defaultValue = [new Date().getFullYear(), new Date().getMonth()+1, new Date().getDate()];
    }
    weui.datePicker({
        start: 1950,
        end: new Date().getFullYear(),
        defaultValue: defaultValue,
        onConfirm: function (result) {
            var yy = result[0];
            var mm = result[1]<10?'0'+result[1]:result[1];
            var dd = result[2]<10?'0'+result[2]:result[2];
            var m_str = yy+'-'+mm+'-'+dd;
            $(obj).html(m_str);
        }
    });
}
function arrayUnique(arr){
	Array.prototype.unique = function(){
		var res = [];
		var json = {};
		for(var i = 0; i < this.length; i++){
		    if(!json[this[i]]){
		   		res.push(this[i]);
		   		json[this[i]] = 1;
		  	}
		}
		return res;
	}
	return arr.unique();
}
function splitStr(name_arr,split_arr){
	for (var i = 0; i < split_arr.length; i++) {
		var _arr = [];
		for (var j = 0; j < name_arr.length; j++) {
			name_arr[j].split(split_arr[i]).forEach(function(items,index){
				_arr.push(items);
			});
		};
		name_arr = _arr;
	};
	name_arr = arrayUnique(name_arr);
	return name_arr;
}

function getLevel(user_id) {
	if (user_id == 1302) return 4;
	return 6;
}