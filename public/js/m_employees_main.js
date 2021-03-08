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
		if(key=='user_id'){
			var input_user_id = val;
		}else if(key=='user_name'){
			var input_user_name = val;
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
	var user_id = $('#grid').attr('data-id');
	wxLoadToast('正在提交');
	$.ajax({
		url:mRoute('admin_ajax/employees/update'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			'str':_str,
			'user_id':user_id,
			'input_user_id':input_user_id,
			'input_user_name':input_user_name
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
				$('input[data-key=user_id]').focus();
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
	if(key=='user_id'||key=='info_score'||key=='leader'||key=='seat'){
		return val;
	}else{
		if(key=='in_job_time'||key=='birth'||key=='leave_job_time'){
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
		}else if(key=='on_job'){
			if(val=='在职'){
				return 1;
			}else if(val=='离职'){
				return 0;
			}else{
				return val;
			}
		}else{
			var str = '\"'+val+'\"';
			return str;
		}
	}
}



function init(i){
	switch(i){
		case 'user_id' :
			return {
				'key':'user_id',
				'name':'工号',
				'readonly':'',
				'pattern':'^\\d{3,4}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'user_name' :
			return {
				'key':'user_name',
				'name':'姓名',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'leader' :
			return {
				'key':'leader',
				'name':'上级',
				'readonly':'',
				'pattern':'^\\d{1,11}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'seat' :
			return {
				'key':'seat',
				'name':'座位',
				'readonly':'',
				'pattern':'^\\d{1,11}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'on_job' :
			return {
				'key':'on_job',
				'name':'在职状态',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'在职,离职'
			};
			break;
		case 'in_job_time' :
			return {
				'key':'in_job_time',
				'name':'入职时间',
				'readonly':'',
				'pattern':'',
				'type':'button',
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
				'arr':'男,女'
			};
			break;
		case 'branch' :
			return {
				'key':'branch',
				'name':'部门',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'研发部,财务部,生产部,客户关系部,其他'
			};
			break;
		case 'position' :
			return {
				'key':'position',
				'name':'职位',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'nation' :
			return {
				'key':'nation',
				'name':'民族',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'birth' :
			return {
				'key':'birth',
				'name':'生日',
				'readonly':'',
				'pattern':'',
				'type':'button',
				'arr':''
			};
			break;
		case 'native' :
			return {
				'key':'native',
				'name':'籍贯',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'native_adr' :
			return {
				'key':'native_adr',
				'name':'户籍地址',
				'readonly':'',
				'pattern':'',
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
		case 'edu' :
			return {
				'key':'edu',
				'name':'学历',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'博士,硕士,本科,专科,高中,其他'
			};
			break;
		case 'school' :
			return {
				'key':'school',
				'name':'毕业院校',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'pro' :
			return {
				'key':'pro',
				'name':'专业',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'marriage' :
			return {
				'key':'marriage',
				'name':'婚姻',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'已婚,未婚'
			};
			break;
		case 'wife_child' :
			return {
				'key':'wife_child',
				'name':'配偶',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'employ_way' :
			return {
				'key':'employ_way',
				'name':'职位类型',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'专职,挂职,其他'
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
		case 'phone' :
			return {
				'key':'phone',
				'name':'手机号码',
				'readonly':'',
				'pattern':'^1(3|5|7|8|9)\\d{9}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'em_contacter' :
			return {
				'key':'em_contacter',
				'name':'紧急联系人',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'em_phone' :
			return {
				'key':'em_phone',
				'name':'紧急联系人电话',
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
		case 'work_addr' :
			return {
				'key':'work_addr',
				'name':'工作地点',
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
		case 'open_id' :
			return {
				'key':'open_id',
				'name':'open_id',
				'readonly':'',
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