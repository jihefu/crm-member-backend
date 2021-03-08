var sn,mid,type,g_update_time,g_input_time;
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
	var form_data = {
		model: $('select[data-key=model]').val(),
		batch: $('input[data-key=batch]').val(),
		maker: $('input[data-key=maker]').val(),
		tester: $('input[data-key=tester]').val(),
		machineNo: $('input[data-key=machineNo]').val(),
		remark: $('input[data-key=remark]').val(),
		chnlNum: $('input[data-key=chnlNum]').val(),
		caliCoeff: $('input[data-key=caliCoeff]').val(),
	};
	// console.log(form_data);
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
				wxToast('更新成功');
				setTimeout(function(){
					window.location.reload();
				},2000);
			}
		}
	});
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
	var width = $('td').width()?$('td').width():$('.weui-cell__bd').width();
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
		},300);
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
				'name':'授权码',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'latestRegNo':
			return {
				'key':'latestRegNo',
				'name':'注册码',
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
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'pulseMode':
			return {
				'key':'pulseMode',
				'name':'PM脉冲模式',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'vibFreq':
			return {
				'key':'vibFreq',
				'name':'DA伺服颤振频率',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'vibAmp':
			return {
				'key':'vibAmp',
				'name':'DA伺服颤振幅值',
				'readonly':'readonly',
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
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'SSI_MODE':
			return {
				'key':'SSI_MODE',
				'name':'SSI模式',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'HOURS':
			return {
				'key':'HOURS',
				'name':'已用小时数',
				'readonly':'readonly',
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
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'VEND':
			return {
				'key':'VEND',
				'name':'名义有效期',
				'readonly':'readonly',
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
				'readonly':'readonly',
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
				'readonly':'readonly',
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
		case 'regAppName':
			return {
				'key':'regAppName',
				'name':'自费App',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'appRegCode':
			return {
				'key':'appRegCode',
				'name':'注册码',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'dealer_endUser':
			return {
				'key':'dealer_endUser',
				'name':'中间商指定最终用户',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'dealer_remark':
			return {
				'key':'dealer_remark',
				'name':'中间商备注',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'appValidTime':
				return {
					'key':'appValidTime',
					'name':'有效期',
					'readonly':'readonly',
					'pattern':'',
					'type':'text',
					'arr':''
				};
				break;
			case 'appRegAuth':
				return {
					'key':'appRegAuth',
					'name':'授权码',
					'readonly':'readonly',
					'pattern':'',
					'type':'text',
					'arr':''
				};
				break;
		default :
			if (i.indexOf('regAppName') !== -1) {
				return {
					'key': i,
					'name':'自费App',
					'readonly':'readonly',
					'pattern':'',
					'type':'text',
					'arr':''
				};
			} else if (i.indexOf('appValidTime') !== -1) {
				return {
					'key': i,
					'name':'有效期',
					'readonly':'readonly',
					'pattern':'',
					'type':'text',
					'arr':''
				};
			} else if (i.indexOf('appRegCode') !== -1) {
				return {
					'key': i,
					'name':'注册码',
					'readonly':'readonly',
					'pattern':'',
					'type':'text',
					'arr':''
				};
			} else if (i.indexOf('appRegAuth') !== -1) {
				return {
					'key': i,
					'name':'授权码',
					'readonly':'readonly',
					'pattern':'',
					'type':'text',
					'arr':''
				};
			} else {
				return {
					'name':'其他'
				}
			}
			break;
	}
}

function labelItem(data) {
	var labelObj = {
		// 出厂
		model: {
			'key':'model',
			'name':'型号',
			'readonly':'',
			'pattern':'',
			'type':'select',
			'arr':'V800,V801,V802,AD800,V881,V884'
		},
		serialNo: {
			'key':'serialNo',
			'name':'序列号',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		batch: {
			'key':'batch',
			'name':'批次',
			'readonly':'',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		inputDate: {
			'key':'inputDate',
			'name':'组装日期',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		maker: {
			'key':'maker',
			'name':'组装人',
			'readonly':'',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		tester: {
			'key':'tester',
			'name':'测试人',
			'readonly':'',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		isTest: {
			'key':'isTest',
			'name':'是否检验',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		isPass: {
			'key':'isPass',
			'name':'是否合格',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		notPassRem: {
			'key':'notPassRem',
			'name':'不合格备注',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		chnlNum: {
			'key':'chnlNum',
			'name':'通道数',
			'readonly':'',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		caliCoeff: {
			'key':'caliCoeff',
			'name':'标比',
			'readonly':'',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		// 订单
		isDirectSale: {
			'key':'isDirectSale',
			'name':'是否直销',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		contract_no: {
			'key':'contract_no',
			'name':'合同号',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		dealer: {
			'key':'dealer',
			'name':'购方',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		purchase: {
			'key':'purchase',
			'name':'购方采购人',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		salesman: {
			'key':'salesman',
			'name':'业务员',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		sign_time: {
			'key':'sign_time',
			'name':'签订时间',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		// 硬件配置
		modelCode: {
			'key':'modelCode',
			'name':'型号编码',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		fwVer: {
			'key':'fwVer',
			'name':'固件版本',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		authType: {
			'key':'authType',
			'name':'型号配置',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		oemUser: {
			'key':'oemUser',
			'name':'用户软件许可',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		VBGN: {
			'key':'VBGN',
			'name':'名义试用起始',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		VEND: {
			'key':'VEND',
			'name':'名义试用终止',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		machineNo: {
			'key':'machineNo',
			'name':'机器码',
			'readonly':'',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		latestRegNo: {
			'key':'latestRegNo',
			'name':'注册码',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		validTime: {
			'key':'validTime',
			'name':'注册状态',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		ad2Mode: {
			'key':'ad2Mode',
			'name':'AD采集模式',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		pulseMode: {
			'key':'pulseMode',
			'name':'PM脉冲模式',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		vibFreq: {
			'key':'vibFreq',
			'name':'DA伺服颤振频率',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		vibAmp: {
			'key':'vibAmp',
			'name':'DA伺服颤振幅值',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		SSI_MODE: {
			'key':'SSI_MODE',
			'name':'SSI模式',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		SPWM_AC_AMP: {
			'key':'SPWM_AC_AMP',
			'name':'SPWM交流幅值',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		HOURS: {
			'key':'HOURS',
			'name':'已用小时数',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		EMP_NO: {
			'key':'EMP_NO',
			'name':'最近操作者',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		regAuth: {
			'key':'regAuth',
			'name':'授权码',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		},
		remark: {
			'key':'remark',
			'name':'附注',
			'readonly':'',
			'pattern':'',
			'type':'text',
			'arr':''
		},
	};
	var count = 0;
	while (data['regAppName' + count]) {
		labelObj['regAppName' + count] = {
			'key': 'regAppName' + count,
			'name':'自费App',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		};
		labelObj['appRegCode' + count] = {
			'key': 'appRegCode' + count,
			'name':'注册码',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		};
		labelObj['appValidTime' + count] = {
			'key': 'appValidTime' + count,
			'name':'注册状态',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		};
		labelObj['appRegAuth' + count] = {
			'key': 'appRegAuth' + count,
			'name':'授权码',
			'readonly':'readonly',
			'pattern':'',
			'type':'text',
			'arr':''
		};
		count++;
	}
	if (!data.isTest) {
		delete labelObj.isPass;
		delete labelObj.notPassRem;
	} else {
		if (data.isPass) {
			delete labelObj.notPassRem;
		}
	}
	return labelObj;
}

function isPass() {
	wxLoadToast('正在提交');
	$.ajax({
		url:route('service/product/checkPass/' + sn),
		type:'put',
		dataType:'json',
		timeout:30000,
		success:function(res){
			$('#loadingToast').remove();
			wxToast(res.msg);
			if(res&&res.code==200){
				setTimeout(function(){
					window.location.reload();
				},2000);
			}
		}
	});
}

function notPass() {
	var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
                '<div class="weui-mask"></div>'+
                '<div class="weui-dialog">'+
                    '<div class="weui-dialog__hd"><strong class="weui-dialog__title">不合格备注</strong></div>'+
                    '<div class="weui-dialog__bd">'+
                        '<div class="weui-cell" style="display:flex;">'+
                            // '<div class="weui-cell__hd" style="width: 70px;text-align: left;"><label class="weui-label">外出原因：</label></div>'+
                            '<div class="weui-cell__bd">'+
                                '<input style="border: 1px solid #d1d1d1;border-radius: 4px;" class="weui-input" name="notPassRem" placeholder="">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="weui-dialog__ft">'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="cancelDialog();">否</a>'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="subNotPass();">是</a>'+
                    '</div>'+
                '</div>'+
            '</div>';
    $('body').append(str);
}

function cancelDialog() {
	$('#iosDialog1').remove();
}

function subNotPass() {
	var notPassRem = $('input[name=notPassRem]').val();
	if (!notPassRem) {
		wxToast('不能为空');
		return;
	}
	wxLoadToast('正在提交');
	$.ajax({
		url:route('service/product/checkNotPass/' + sn),
		type:'put',
		dataType:'json',
		timeout:30000,
		data: {
			notPassRem: notPassRem
		},
		success:function(res){
			cancelDialog();
			$('#loadingToast').remove();
			wxToast(res.msg);
			if(res&&res.code==200){
				setTimeout(function(){
					window.location.reload();
				},2000);
			}
		}
	});
}