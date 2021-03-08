var sn,mid,type,g_update_time,g_input_time;
// function dealerTrans(val){
// 	var _val = val.slice(0,val.length-1);
// 	$.ajax({
// 		url:route('service/product/dealerTrans'),
// 		type:'get',
// 		dataType:'json',
// 		timeout:30000,
// 		data:{
// 			"val":_val
// 		},
// 		success:function(res){
// 			if(res!=''){
// 				$('#grid tr input').each(function(){
// 					var dk = $(this).attr('data-key');
// 					var that = this;
// 					res.forEach(function(items,index){
// 						if(dk==items.key){
// 							$(that).val(items.name);
// 							$(that).attr('data-value',items.id);
// 						}
// 					});
// 				});
// 			}
// 		}
// 	});
// }
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
}

function sub(){
	var form_data = {};
	var len1 = $('#grid tbody input').length;
	var len2 = $('#grid tbody select').length;
	// var str = '';
	for (var i = 0; i < len1; i++) {
		if($('#grid tbody input').eq(i).attr('readonly')!='readonly'){
			var key = $('#grid tbody input').eq(i).attr('data-key');
			var v = $('#grid tbody input').eq(i).val();
			form_data[key] = v;
			// var val = trans(key,v);
			// str += key + '=' + val +',';
		}
	};
	for (var j = 0; j < len2; j++) {
		var key = $('#grid tbody select').eq(j).attr('data-key');
		var v = $('#grid tbody select').eq(j).val();
		form_data[key] = v;
		// var val = trans(key,v);
		// str += key + '=' + val +',';
	};
	// var _str = str.slice(0,str.length-1);
	sn = window.location.pathname.split('vir8/')[1];
	wxLoadToast('正在提交');
	$.ajax({
		url:route('service/product/staffUpdateInfo'),
		type:'put',
		dataType:'json',
		timeout:30000,
		data:{
			"form_data":JSON.stringify(form_data),
			"sn":sn
		},
		success:function(res){
			$('#loadingToast').remove();
			if(res&&res.code==200){
				window.location.reload();
				// wxToast(res.msg);
				// $('#grid input').each(function(){
				// 	var t = $(this).attr('data-key');
				// 	if($(this).attr('data-key')=='update_time'){
				// 		$(this).val(res.data[0].update_time);
				// 	}else if($(this).attr('data-key')=='inputDate'){
				// 		$(this).val(res.data[0].inputDate);
				// 	}else if(t=='update_person'||t=='inputPerson'||t=='EMP_NO'){
				// 		$(this).val(res.data[1].user_name);
				// 	}
				// });
				// if(res.data[0].model=='Vir802'){
				// 	$('.img img').attr('src','../img/_802.png');
				// 	$('head title').html('威程802产品介绍');
				// 	$('#main a').attr('href','../../../products/vir8/1802');
				// }else if(res.data[0].model=='Vir801'){
				// 	$('.img img').attr('src','../img/_801.png');
				// 	$('head title').html('威程801产品介绍');
				// 	$('#main a').attr('href','../../../products/vir8/1801');
				// }else if(res.data[0].model=='Vir800'){
				// 	$('.img img').attr('src','../img/_800.png');
				// 	$('head title').html('威程800产品介绍');
				// 	$('#main a').attr('href','../../../products/vir8/1800');
				// }else if(res.data[0].model=='Vir881'){
				// 	$('.img img').attr('src','../img/_881.png');
				// 	$('head title').html('威程881产品介绍');
				// 	$('#main a').attr('href','../../../products/vir8/1881');
				// }else if(res.data[0].model=='Vir884'){
				// 	$('.img img').attr('src','../img/_884.png');
				// 	$('head title').html('威程884产品介绍');
				// 	$('#main a').attr('href','../../../products/vir8/1884');
				// }else{
				// 	$('.img img').attr('src','../img/_ad800.png');
				// 	$('head title').html('威程试验卡产品介绍');
				// 	$('#main a').attr('href','../../../products/vir8/800');
				// }
			}else{
				wxToast(res.msg);
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
			return '\"'+v+'\"';
		}
	}else{
		if((key=='dealer'||key=='salesman'||key=='tester'||key=='maker'||key=='endUser')&&v!=''){
			var len = $('#grid td input').length;
			for (var i = 0; i < len; i++) {
				if($('#grid td input').eq(i).attr('data-key')==key){
					var val = $('#grid td input').eq(i).attr('data-value');
					return '\"'+val+'\"';
				}
			};
		}else{
			return '\"'+v+'\"';
		}
	}
}
var t;
function searchInput(obj){
	$(obj).on('keyup',function(){
		var key = $(obj).attr('data-key');
		var _val = $(obj).val();
		var val = _val.replace(/\s|\'/g,'');
		clearTimeout(t);
		t = setTimeout(function(){
			if(localStorage.getItem(it)&&val==''){
				local_input(key,val,obj);
			}else{
				ajax_input(key,val,obj);
			}
		},300);
	});
	var width = $('td').width();
	var str = '<div class="weui-actionsheet__menu" style="width:'+width+'px;max-height:240px;overflow:auto;position:absolute;margin-top:6px;border: 1px solid #C5C5C5;">'+
	                '<div class="weui-actionsheet__cell" style="text-align:center">'+
	                	'<i class="weui-loading weui-icon_toast" style="text-align:center;margin:0px;"></i>'+
	                '</div>'+
		    	'</div>';
	$(obj).parent().css('position','realtive');
	$(obj).parent().append(str);
	var key = $(obj).attr('data-key');
	var val = $(obj).val();
	$(obj).blur(function(){
		var v = $(obj).val();
		setTimeout(function(){
			if((val!=v)&&($(obj).attr('data-input-mark')!=1)){
				$(obj).val('');
			}
			$(obj).removeAttr('data-input-mark');
			$('.weui-actionsheet__menu').remove();
			$(obj).off();
		},100);
	});
	var it = $(obj).attr('data-key');
	if(localStorage.getItem(it)){
		local_input(key,val,obj);
	}else{
		ajax_input(key,val,obj);
	}
}
function ajax_input(key,val,obj){
	$.ajax({
		url:route('service/product/searchInput'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"key":key,
			"val":val
		},
		success:function(res){
			log(res);
			if(res&&res.data!=''){
				if($(obj).attr('data-key')=='dealer'||$(obj).attr('data-key')=='endUser'){
					var str = '';
					for (var i = 0; i < res.data.length; i++) {
						str += '<div class="weui-actionsheet__cell" data-value="'+res.data[i].user_id+'" onclick="inputVal(this)" style="text-align:center">'+res.data[i].cn_abb+'</div>';
					};
					$('.weui-actionsheet__menu').html(str);
				}else{
					var str = '';
					for (var i = 0; i < res.data.length; i++) {
						str += '<div class="weui-actionsheet__cell" data-value="'+res.data[i].user_id+'" onclick="inputVal(this)" style="text-align:center">'+res.data[i].user_name+'</div>';
					};
					$('.weui-actionsheet__menu').html(str);
				}
			}else{
				$('.weui-actionsheet__menu').html('<div class="weui-actionsheet__cell" style="text-align:center">搜索目标不存在</div>');
			}
		}
	});
}
function local_input(key,val,obj){
	var data = JSON.parse(localStorage.getItem($(obj).attr('data-key')));
	var str = '';
	for (var i = 0; i < data.length; i++) {
		str += '<div class="weui-actionsheet__cell" data-value="'+data[i].user_id+'" onclick="inputVal(this)" style="text-align:center">'+data[i].user_name+'</div>';
	};
	$('.weui-actionsheet__menu').html(str);
}
function inputVal(obj){
	if($(obj).attr('data-value')){
		$(obj).parent().prev().attr('data-value',$(obj).attr('data-value'));
	}
	var val = $(obj).html();
	$(obj).parent().prev().val(val);
	$(obj).parent().prev().attr('data-input-mark',1);
	getLocal(obj);
}
function getLocal(obj){
	var it = $(obj).parent().prev().attr('data-key');
	var id = $(obj).attr('data-value');
	var name = $(obj).html();
	if(localStorage.getItem(it)){
		var arr = JSON.parse(localStorage.getItem(it));
		var o = {};
		o.user_id = id;
		o.user_name = name;
		var len = arr.length;
		console.log('len:'+len);
		for (var i = 0; i < len; i++) {
			if(arr[i].user_id==id){
				break;
			}else if((arr[i].user_id!=id)&&(i==len-1)){
				arr.unshift(o);
			}
		};
		if(arr.length>5) arr.pop();
	}else{
		var arr = [];
		var o = {};
		o.user_id = id;
		o.user_name = name;
		arr.unshift(o);
	}
	var str_arr = JSON.stringify(arr);
	localStorage.setItem(it,str_arr);
}
function removeActionsheet(){
	$('#androidActionsheet').remove();
}
function reg(){
	window.location.href = route('service/product/reg?sn='+sn+'&mid='+mid);
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
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'authType':
			return {
				'key':'authType',
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
				'arr':'V800,V801,V802,AD800,V881,V884'
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
				'name':'最近操作者',
				'readonly':'readonly',
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
				'readonly':'readonly',
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