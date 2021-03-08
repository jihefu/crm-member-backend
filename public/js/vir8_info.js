var sn,mid,type;
$(document).ready(function(){
	// var height = window.innerHeight;
	// var width = window.innerWidth;
	// // var head_height = $('header').height();
	// var img_height = width/2.68;
	// $('.img,.img img').height(img_height);
	// // $('body').height(height);
	// var table_height = (height-img_height-80)<200?200:height-img_height-80;
	var height = window.innerHeight;
	var width = window.innerWidth;
	var img_height = width/2.68;
	img_height = img_height > 320 ? 320 : img_height;
	var btnHeight = height > 900 ? 160 : 80;
	$('.img,.img img').height(img_height);
	var table_height = height-img_height-btnHeight;
	var href = window.location.href;
	var str = href.split('product/')[1];
	type = str.split('/')[0];
	if(!/\?/.test(href)){
		sn = str.split('/')[1];
	}else{
		var _sn = str.split('/')[1];
		sn = _sn.split('?')[0];
		$('.header-back').show();
	}
	$.ajax({
		url:route('service/product/info'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"sn":sn,
			"type":type
		},
		success:function(res){
			if(res&&res.code==200){
				var arr = [];
				var data = res.data[0];
				mid = data.machineNo;
				if(data.model=='V802'){
					$('.img img').attr('src','../img/1802.jpg');
					$('head title').html('威程802产品介绍');
					$('.img a').attr('href','../../../products/vir8/1802');
				}else if(data.model=='V801'){
					$('.img img').attr('src','../img/1801.jpg');
					$('head title').html('威程801产品介绍');
					$('.img a').attr('href','../../../products/vir8/1801');
				}else if(data.model=='V800'){
					$('.img img').attr('src','../img/1800.jpg');
					$('head title').html('威程800产品介绍');
					$('.img a').attr('href','../../../products/vir8/1800');
				}else{
					$('.img img').attr('src','../img/800.jpg');
					$('head title').html('威程试验卡产品介绍');
					$('.img a').attr('href','../../../products/vir8/800');
				}
				for(var i in data){
					var obj = init(i);
					obj.val = data[i];
					if(obj.name!='其他'){
						arr.push(obj);
					}
				}
				if(type=='vir8_end_user'){
	            	$('.btn-groups button:gt(1)').show();
	            	$("#grid").kendoGrid({
		                height: table_height,
						columns:[
							{
							  field: "name",
							  title: "产品信息"
							},
							{
							  field: "val",
							  title: "具体内容"
							}
						],
						dataSource: {
							data: arr
						}
		            });
	            }else if(type=='vir8_customer'){
	            	$('.btn-groups button:lt(1)').show();
	            	$("#grid").kendoGrid({
		                height: table_height,
						columns:[
							{
							  field: "name",
							  title: "产品信息"
							},
							{
							  field: "val",
							  title: "具体内容"
							}
						],
						dataSource: {
							data: arr
						}
		            });
	            }else{
	            	$('.btn-groups button:lt(2)').show();
	            	var temp = "<input type='#:type#' #:readonly# pattern='#:pattern#' data-arr='#:arr#' data-key='#:key#' style='border:none;background:inherit' value=#:val# >";
	            	$("#grid").kendoGrid({
		                height: table_height,
						columns:[
							{
							  field: "name",
							  title: "产品项目"
							},
							{
							  field: "val",
							  title: "参数",
							  template: temp
							}
						],
						dataSource: {
							data: arr
						}
		            });
	            }
	            $('button').kendoButton();
	            $('#grid tr input').each(function(){
	            	var type = $(this).attr('type');
	            	if(type=='select'){
	            		var str = '';
	            		var s = $(this).attr('data-arr');
	            		var _arr = s.split(',');
	            		var arr = [];
	            		for (var i = 0; i < _arr.length; i++) {
	            			arr.push(_arr[i]);
	            		};
	            		var v = $(this).val();
	            		var d = $(this).attr('data-key');
	            		for (var i = 0; i < arr.length; i++) {
	            			if(arr[i]==v){
	            				var t = arr[0];
	            				arr[0] = arr[i];
	            				arr[i] = t;
	            			}
	            		};
	            		for (var i = 0; i < arr.length; i++) {
	            			str += '<option>'+arr[i]+'</option>';
	            		};
	            		var _str = '<select style="background:inherit;width:150px;border:none;" data-key="'+d+'">'+str+'</select>';
	            		$(this).parent().html(_str);
	            	}else if(type=='dater'){
	            		var v = $(this).val();
	            		var d = $(this).attr('data-key');
	            		var str = '<input id="useDate" style="width:100%;height:30px;background:inherit;border:none" data-key="'+d+'" class="date" value="'+v+'" />'
	            		$(this).parent().html(str);
	            		scroller();
	            	}
	            });
			}
			$('#useDate').click(function(){
				setTimeout(function(){
			    	$('.dwb-n span').trigger('click');
			    },500);
			});
		}
	});
});
function scroller(){
	var curr = new Date().getFullYear();
    var opt = {  
		'default': {
			theme: 'default',
			mode: 'scroller',
			display: 'modal',
			animate: 'fade',
        },		
		'dateYMD': {
            preset: 'date',
			dateFormat: 'yyyy-mm-dd',
			defaultValue: new Date(new Date())
        },
    }
    $('#useDate').scroller($.extend(opt['dateYMD'],opt['default']));
 //    var optDateTime = $.extend(opt['dateYMD'], opt['default']);
	// $("#useDate").mobiscroll(optDateTime).datetime(optDateTime);
	// var requestDate = $("#useDate").val();
	// if(requestDate != ""){
	// 	requestDate = new Date(requestDate);
	// 	$("#useDate").scroller('setDate', requestDate, false);
	// }
}

function sub(){
	var len1 = $('#grid tbody input').length;
	var len2 = $('#grid tbody select').length;
	var str = '';
	for (var i = 0; i < len1; i++) {
		var key = $('#grid tbody input').eq(i).attr('data-key');
		var v = $('#grid tbody input').eq(i).val();
		var val = trans(key,v);
		str += key + '=' + val +',';
	};
	for (var j = 0; j < len2; j++) {
		var key = $('#grid tbody select').eq(j).attr('data-key');
		var v = $('#grid tbody select').eq(j).val();
		var val = trans(key,v);
		str += key + '=' + val +',';
	};
	var _str = str.slice(0,str.length-1);
	mToast('正在提交...',1);
	$('button').attr('disabled','disabled');
	$.ajax({
		url:route('service/product/updateInfo'),
		type:'put',
		dataType:'json',
		timeout:30000,
		data:{
			"str":_str,
			"sn":sn
		},
		success:function(res){
			if(res&&res.msg=='succeed'){
				$('.my-toast').remove();
				$('button').removeAttr('disabled');
				mToast('更新成功');
				$('#grid input').each(function(){
					if($(this).attr('data-key')=='update_person'){
						$(this).val(res.data[0].update_person);
					}
					if($(this).attr('data-key')=='update_time'){
						$(this).val(res.data[0].update_time);
					}
				});
			}
		}
	});
}
function trans(key,v){
	if(key=='serialNo'||key=='machineNo'||key=='ad2Mode'||key=='SPWM_AC_AMP'||key=='SSI_MODE'||key=='HOURS'||key=='EMP_NO'||key=='VBGN'||key=='VEND'){
		if(v){
			var val = parseInt(v);
			return val;
		}else{
			return '\''+v+'\'';
		}
	}else{
		return '\''+v+'\'';
	}
}
function reg(){
	window.location.href = route('service/product/vac_reg?sn='+sn+'&mid='+mid);
}
function applyReg(){
	window.location.href = route('service/product/applyReg');
}
var rootFix=function(){
 //    var baseFontSize = 100;
	// var baseWidth = 320;
	// var clientWidth = document.documentElement.clientWidth || window.innerWidth;
	// var innerWidth = Math.max(Math.min(clientWidth, 480), 320);
	// var rem = 100;
	// if (innerWidth > 362 && innerWidth <= 375) {
	// 	rem = Math.floor(innerWidth / baseWidth * baseFontSize * 0.9);
	// }
	// if (innerWidth > 375) {
	// 	rem = Math.floor(innerWidth / baseWidth * baseFontSize * 0.84);
	// }
	// //window.__baseREM = rem;
	// document.querySelector('html').style.fontSize = rem + 'px';
	// document.body.style.height=window.innerHeight+"px";
}
window.onload=function(){
	rootFix();
}
window.onresize=function(){
	rootFix();
}
function back(){
	window.history.back(-1);
}
function init(i){
	switch(i){
		case 'type':
			return {
				'key':'type',
				'name':'其他',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'serialNo':
			return {
				'key':'serialNo',
				'name':'序列号',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'machineNo':
			return {
				'key':'machineNo',
				'name':'机器码',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'salesman':
			return {
				'key':'salesman',
				'name':'业务经理',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'dealer':
			return {
				'key':'dealer',
				'name':'中间商',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'regAuth':
			return {
				'key':'regAuth',
				'name':'授权操作码',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'latestRegNo':
			return {
				'key':'latestRegNo',
				'name':'最近注册码',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'regVer':
			return {
				'key':'regVer',
				'name':'注册版本',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'inputDate':
			return {
				'key':'inputDate',
				'name':'录入时间',
				'readonly':'',
				'pattern':'',
				'type':'dater',
				'arr':''
			}
			break;
		case 'authType':
			return {
				'key':'cardType',
				'name':'授权类型',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'state':
			return {
				'key':'state',
				'name':'其他',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'caliCoeff':
			return {
				'key':'caliCoeff',
				'name':'标定系数',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'remark':
			return {
				'key':'remark',
				'name':'附注',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'chnlNum':
			return {
				'key':'chnlNum',
				'name':'通道数',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'ad2Mode':
			return {
				'key':'ad2Mode',
				'name':'AD采集模式',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'pulseMode':
			return {
				'key':'pulseMode',
				'name':'PM脉冲模式',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'vibFreq':
			return {
				'key':'vibFreq',
				'name':'DA伺服颤振频率',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'vibAmp':
			return {
				'key':'vibAmp',
				'name':'DA伺服颤振幅值',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'maker':
			return {
				'key':'maker',
				'name':'生产者',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'tester':
			return {
				'key':'tester',
				'name':'测试者',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'model':
			return {
				'key':'model',
				'name':'型号',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'V800,V801,V802,AD800'
			}
			break;
		case 'tongdao':
			return {
				'key':'tongdao',
				'name':'其他',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'SPWM_AC_AMP':
			return {
				'key':'SPWM_AC_AMP',
				'name':'SPWM交流幅值',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'SSI_MODE':
			return {
				'key':'SSI_MODE',
				'name':'SSI模式',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'HOURS':
			return {
				'key':'HOURS',
				'name':'已用小时数',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'EMP_NO':
			return {
				'key':'EMP_NO',
				'name':'最后操作者',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'VBGN':
			return {
				'key':'VBGN',
				'name':'名义起始期',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'VEND':
			return {
				'key':'VEND',
				'name':'名义有效期',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'update_person':
			return {
				'key':'update_person',
				'name':'更新者',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'update_time':
			return {
				'key':'update_time',
				'name':'更新时间',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'validTime':
			return {
				'key':'validTime',
				'name':'有效期',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'fwVer':
			return {
				'key':'fwVer',
				'name':'固件版本',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'endUser':
			return {
				'key':'endUser',
				'name':'终端用户',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'oemUser':
			return {
				'key':'oemUser',
				'name':'指定配套用户',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'inputPerson':
			return {
				'key':'inputPerson',
				'name':'录入者',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		default :
			return {
				'name':'其他'
			}
			break;
	}
}