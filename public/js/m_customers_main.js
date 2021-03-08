$(document).ready(function(){
	var slide = new auiSlide({
		 "container":document.getElementById("aui-slide"),
		 // "height":240,
        "speed":500,
        "autoPlay": 3000, //自动播放
        "loop":true,
        "pageShow":true,
        "pageStyle":'dot',
        'dotPosition':'center'
	});
	$('#grid input[type=button]').on('click', function () {
		var that = this;
        weui.datePicker({
            start: 1950,
            end: new Date().getFullYear(),
            onConfirm: function (result) {
                var yy = result[0];
                var mm = result[1]<10?'0'+result[1]:result[1];
                var dd = result[2]<10?'0'+result[2]:result[2];
                var m_str = yy+'-'+mm+'-'+dd;
                $(that).val(m_str);
            }
        });
    });
});
function transPerson(val,obj){
	$.ajax({
		url:router('customer/transPerson'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'val':val,
		},
		success:function(res){
			$(obj).val(res[0].user_name);
		}
	});
}
function sub(){
	var input = $('#grid tr input').not('[readonly]');
	var str = '';
	for (var i = 0; i < input.length; i++) {
		if(checkPat(i)==1) return;
		var key = input.eq(i).attr('data-key');
		var val = input.eq(i).val();
		if(key=='abb'){
			var input_abb = val;
		}else if(key=='company'){
			var input_company = val;
		}
		str += key+'='+getVal(key,val)+',';
	};
	var select = $('#grid tr select');
	for (var i = 0; i < select.length; i++) {
		var key = select.eq(i).attr('data-key');
		var val = select.eq(i).val();
		str += key+'='+getVal(key,val)+',';
	};
	var _str = str.slice(0,str.length-1);
	var cpy = $('#grid').attr('data-cpy');
	wxLoadToast('正在提交');
	$.ajax({
		url:mRoute('admin_ajax/customers/update'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			'str':_str,
			'cpy':cpy,
			'input_abb':input_abb,
			'input_company':input_company
		},
		success:function(res){
			$('#loadingToast').remove();
			if(res&&res.code==200){
				wxToast('提交成功');
				var _input = $('#grid tr input[readonly]');
				for (var i = 0; i < _input.length; i++) {
					var key = _input.eq(i).attr('data-key');
					if(key=='update_person'){
						transPerson(res.data[0].update_person,_input.eq(i));
					}else if(key=='update_time'){
						_input.eq(i).val(res.data[0].update_time);
					}	
				};
			}else if(res&&res.code==-100){
				reload(res.msg);
			}else{
				wxToast(res.msg);
				$('input[data-key=abb]').focus();
			}
		}
	});
}
function checkPat(i){
	var val = $('#grid tr input').not('[readonly]').eq(i).val();
	var pattern = $('#grid tr input').not('[readonly]').eq(i).attr('pattern');
	var pat = new RegExp(pattern,'ig');
	if((!pat.test(val))&&(val!='')){
		$('#grid tr input').not('[readonly]').eq(i).focus();
		return 1;
	}
}
function getVal(key,val){
	// if(key=='id'||key=='user_id'||key=='use_per'||key=='credit_line'||key=='credit_period'||key=='last_sale'||key=='total_sale'||key=='zip_code'||key=='star'){
	// 	return val;
	// }else{
		if(key=='datefrom'){
			if(val.indexOf('/')==-1){
				var str = '\"'+val+'\"';
			}else{
				var yy = val.split('/')[2];
				var mm = val.split('/')[0];
				var dd = val.split('/')[1];
				var st = yy+'-'+mm+'-'+dd;
				var str = '\"'+st+'\"';
			}
			return str;
		}else if(key=='credit_qualified'){
			if(val=='合格'){
				return 1;
			}else{
				return 0;
			}
		}else{
			var str = '\"'+val+'\"';
			return str;
		}
	// }
}



function init(i){
	switch(i){
		case 'company' :
			return {
				'key':'company',
				'name':'客户',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'user_id' :
			return {
				'key':'user_id',
				'name':'客户号',
				'readonly':'',
				'pattern':'^[0-9]{1,4}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'abb' :
			return {
				'key':'abb',
				'name':'英文缩写',
				'readonly':'',
				'pattern':'^[\\w]{1,8}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'cn_abb' :
			return {
				'key':'cn_abb',
				'name':'中文缩写',
				'readonly':'',
				'pattern':'^[\\u4e00-\\u9fa5]{1,8}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'legal_person' :
			return {
				'key':'legal_person',
				'name':'法人',
				'readonly':'',
				'pattern':'',
				'type':'',
				'arr':''
			};
			break;
		case 'reg_person' :
			return {
				'key':'reg_person',
				'name':'注册人',
				'readonly':'',
				'pattern':'',
				'type':'',
				'arr':''
			};
			break;
		case 'province' :
			return {
				'key':'province',
				'name':'省份',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'山东,吉林,上海,广东,浙江,广西,北京,甘肃,湖南,陕西,重庆,河南,宁夏,湖北,辽宁,河北,江苏,海南,新疆,广州,四川,云南,安徽,江西,福建,天津,山西,内蒙古,青海,贵州,重庆,西藏,黑龙江,香港,澳门,台湾,国外,其他'
			};
			break;
		case 'town' :
			return {
				'key':'town',
				'name':'城镇',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'reg_company' :
			return {
				'key':'reg_company',
				'name':'开票公司',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'reg_addr' :
			return {
				'key':'reg_addr',
				'name':'开票地址',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'reg_tel' :
			return {
				'key':'reg_tel',
				'name':'开票电话',
				'readonly':'',
				'pattern':'^[\\-0-9]{1,20}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'bank_name' :
			return {
				'key':'bank_name',
				'name':'开户行',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'bank_account' :
			return {
				'key':'bank_account',
				'name':'银行账户',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'tax_id' :
			return {
				'key':'tax_id',
				'name':'税号',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'type' :
			return {
				'key':'type',
				'name':'类型',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'生产厂家,经销商,终端客户'
			};
			break;
		case 'level' :
			return {
				'key':'level',
				'name':'等级',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'A,B,C,D,E,F'
			};
			break;
		case 'manager' :
			return {
				'key':'manager',
				'name':'业务员',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'datefrom' :
			return {
				'key':'datefrom',
				'name':'开始合作时间',
				'readonly':'',
				'pattern':'',
				'type':'button',
				'arr':''
			};
			break;
		case 'website' :
			return {
				'key':'website',
				'name':'网站',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'email' :
			return {
				'key':'email',
				'name':'邮箱',
				'readonly':'',
				'pattern':'^\\w[-\\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\\.)+[A-Za-z]{2,14}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'products' :
			return {
				'key':'products',
				'name':'主营产品',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'use_per' :
			return {
				'key':'use_per',
				'name':'采用率',
				'readonly':'',
				'pattern':'^\\d{1,3}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'star' :
			return {
				'key':'star',
				'name':'星级',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'0,1,2,3,4,5,6,7,8,9,10'
			};
			break;
		case 'credit_line' :
			return {
				'key':'credit_line',
				'name':'信用额',
				'readonly':'',
				'pattern':'^\\d{1,10}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'credit_period' :
			return {
				'key':'credit_period',
				'name':'信用期',
				'readonly':'',
				'pattern':'^\\d{1,10}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'credit_qualified' :
			return {
				'key':'credit_qualified',
				'name':'信用合格',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'合格,不合格'
			};
			break;
		case 'last_sale' :
			return {
				'key':'last_sale',
				'name':'上年销售额',
				'readonly':'',
				'pattern':'^\\d{1,10}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'total_sale' :
			return {
				'key':'total_sale',
				'name':'累计销售额',
				'readonly':'',
				'pattern':'^\\d{1,10}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'bussiness_addr' :
			return {
				'key':'bussiness_addr',
				'name':'营业地址',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'zip_code' :
			return {
				'key':'zip_code',
				'name':'邮政编码',
				'readonly':'',
				'pattern':'^\\d{6}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'album' :
			return {
				'key':'album',
				'name':'相册',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'rem' :
			return {
				'key':'rem',
				'name':'附注',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'update_person' :
			return {
				'key':'update_person',
				'name':'更新人',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'update_time' :
			return {
				'key':'update_time',
				'name':'更新时间',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		default: 
			return {
				'name':'其它',
				'readonly':'',
				'pattern':'',
			};
			break;
	}
}