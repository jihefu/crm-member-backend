var sn,mid,type;
$(document).ready(function(){
	// var height = window.innerHeight;
	// var width = window.innerWidth;
	// var img_height = width/2.68;
	// $('.img,.img img').height(img_height);
	// var table_height = (height-img_height-80)<200?200:height-img_height-80;
	// var table_height = height-img_height-80;
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
});

function sub(){
	var sn = $('body').attr('data-sn');
	var ele = $('#grid td input');
	var obj = {};
	for (var i = 0; i < ele.length; i++) {
		obj[ele.eq(i).attr('data-key')] = ele.eq(i).val();
	};
	wxLoadToast('正在提交');
	$('button').attr('disabled','disabled');
	$.ajax({
		url:route('service/product/dealerUpdateInfo'),
		type:'put',
		dataType:'json',
		timeout:30000,
		data:{
			"form_data":JSON.stringify(obj),
			"sn":sn
		},
		success:function(res){
			if(res&&res.code==200){
				$('#loadingToast').remove();
				$('button').removeAttr('disabled');
				wxToast('提交成功');
			}
		}
	});
}
function reg(){
	$.ajax({
		url:route('service/product/checkReg'),
		type:'get',
		dataType: 'json',
		timeout:30000,
		data: {
			sn: sn
		},
		success:function(res){
			if(res.code==-1001||res.code==-1002||res.code==-1004){
				wxToast(res.msg);
			}else if(res.code==-1003){
				var str = '<div class="js_dialog" id="iosDialog2">'+
				            '<div class="weui-mask"></div>'+
				            '<div class="weui-dialog">'+
				                '<div class="weui-dialog__bd">'+
				                	'<p>贵公司合同信用额度已透支或逾期</p>'+
				                	'<p>请及时与朗杰财务联系</p>'+
								'</div>'+
				                '<div class="weui-dialog__ft">'+
				                    '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary"><span class="delay">1</span>秒后可进行注册</a>'+
				                '</div>'+
				            '</div>'+
				        '</div>';
				$('body').append(str);
				setTimeout(function(){
					var delay;
					delay = setInterval(function(){
						var text = parseInt($('.delay').html());
						text--;
						$('.delay').html(text);
						if(text==0){
							clearInterval(delay);
							$('.js_dialog .weui-dialog__ft a').attr('onclick','goToReg();');
							$('.js_dialog .weui-dialog__ft a').html('进入注册');
						}
					},1000);
				},200);
			}else{
				window.location.href = route('service/product/reg?sn='+sn+'&mid='+mid);
			}
		}
	});
}
function goToReg(){
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
				'name':'其他',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'dealer':
			return {
				'key':'dealer',
				'name':'其他',
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
				'name':'其他',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'inputDate':
			return {
				'key':'inputDate',
				'name':'其他',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
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
				'name':'其他',
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
				'name':'其他',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'tester':
			return {
				'key':'tester',
				'name':'其他',
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
				'name':'其他',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'VBGN':
			return {
				'key':'VBGN',
				'name':'其他',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'VEND':
			return {
				'key':'VEND',
				'name':'其他',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'update_person':
			return {
				'key':'update_person',
				'name':'其他',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'update_time':
			return {
				'key':'update_time',
				'name':'其他',
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
		case 'dealer_endUser':
			return {
				'key':'dealer_endUser',
				'name':'终端用户',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'dealer_remark':
			return {
				'key':'dealer_remark',
				'name':'终端用户备注',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'oemUser':
			return {
				'key':'oemUser',
				'name':'其他',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			}
			break;
		case 'inputPerson':
			return {
				'key':'inputPerson',
				'name':'其他',
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
	};
	return labelObj;
}