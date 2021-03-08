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
		}else if(key=='name'){
			var input_name = val;
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
	var abb = $('#grid').attr('data-abb');
	wxLoadToast('正在提交');
	$.ajax({
		url:mRoute('admin_ajax/contacts/update'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			'str':_str,
			'abb':abb,
			'input_abb':input_abb,
			'input_name':input_name
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
	if(key=='abb'){
		var s = val.toUpperCase();
		var str = '\"'+s+'\"';
		return str;
	}else{
		var str = '\"'+val+'\"';
		return str;
	}
}



function init(i){
	switch(i){
		case 'abb' :
			return {
				'key':'abb',
				'name':'英文简称',
				'readonly':'',
				'pattern':'^[\\w]{1,8}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'name' :
			return {
				'key':'name',
				'name':'姓名',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'sex' :
			return {
				'key':'sex',
				'name':'性别',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'男,女,未知'
			};
			break;
		case 'phone1' :
			return {
				'key':'phone1',
				'name':'手机号码1',
				'readonly':'',
				'pattern':'^1(3|5|7|8|9)\\d{9}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'phone2' :
			return {
				'key':'phone2',
				'name':'手机号码2',
				'readonly':'',
				'pattern':'^1(3|5|7|8|9)\\d{9}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'company' :
			return {
				'key':'company',
				'name':'公司',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'tel' :
			return {
				'key':'tel',
				'name':'电话',
				'readonly':'',
				'pattern':'[\\-0-9]{1,20}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'qq' :
			return {
				'key':'qq',
				'name':'qq',
				'readonly':'',
				'pattern':'^\\d{6,12}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'wx_id' :
			return {
				'key':'wx_id',
				'name':'微信号',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'wx_open_id' :
			return {
				'key':'wx_open_id',
				'name':'wx_open_id',
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
		case 'identify' :
			return {
				'key':'identify',
				'name':'身份证',
				'readonly':'',
				'pattern':'^\\d{15}|\\d{17}[0-9Xx]$',
				'type':'text',
				'arr':''
			};
			break;
		case 'relation' :
			return {
				'key':'relation',
				'name':'关系',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'客户,同行,经销商,供应商,主管单位,主管部门,合作,公共关系,其他'
			};
			break;
		case 'job' :
			return {
				'key':'job',
				'name':'职位',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'addr' :
			return {
				'key':'addr',
				'name':'地址',
				'readonly':'',
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
		case 'insert_time' :
			return {
				'key':'insert_time',
				'name':'添加时间',
				'readonly':'readonly',
				'pattern':'',
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