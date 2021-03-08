var count = 0;
$(document).ready(function(){
	$.ajax({
		url:router('customer/info'),
		type:'get',
		dataType:'json',
		timeout:30000,
		success:function(res){
			delete res.info[0].insert_person;
			delete res.info[0].insert_time;
			delete res.info[0].certified;
			album(res.info[0].album);
			var interText = doT.template($("#company_info").text()); 
  			$(".bar-bottom ul").html(interText(res.list));
			$(".bar-bottom ul li").eq(0).addClass('high-light');
			var interText = doT.template($("#table_info").text()); 
			$(".table-wrap tbody").html(interText(dataReo(res.info)));
  			$('.right-score span').html(parseInt(res.info[0].info_score)+'%');
  			star(res.info[0].star);
  			var data_cpy = $('.table-wrap tbody tr').eq(0).find('input').eq(0).val();
  			$('.table-wrap tbody').attr('data-cpy',data_cpy);
  			selectList();
  			$("#datepicker").kendoDatePicker();
  			var val = $("#datepicker").val();
  			$("#datepicker").keyup(function(){
				$(this).val(val);
			});
			transPerson();
			creditList(res.info[0]);
		}
	});
	$('.modal-dialog').css('margin-top','10%');
	$('.dropdown-menu li').click(function(){
		if(checkChange()==1) return;
		var text = $(this).find('a').html();
		$('.dropdown button').html(text+'<span class="caret"></span>');
		mySort(text);
	});
	$('#search').focus(function(e){
		if(document.activeElement.id=='search'&&$('#search').val()!=''){
			var left = $('#search').width();
			var top = $('#search').height()-13;
			$('.icon-form-del').css({
				'display':'block',
				'left':left,
				'top':top
			});
		}
		document.onkeyup = function(e){
			if(document.activeElement.id=='search'&&e.keyCode==13){
				if(checkChange()==1) return;
				$('.sear button').trigger('click');
			}
			if(document.activeElement.id=='search'&&$('#search').val()!=''){
				var left = $('#search').width();
				var top = $('#search').height()-13;
				$('.icon-form-del').css({
					'display':'block',
					'left':left,
					'top':top
				});
			}
		}
	});
	$('#search').blur(function(){
		setTimeout(function(){
			$('.icon-form-del').hide();
		},300);
	});
});
function filter(){
	if(checkChange()==1) return;
	$('#myModal').modal();
}
function checkCpy(obj){
	if(checkChange()==1) return;
	$('.album-btn button').attr('disabled','disabled');
	$('.bar-bottom li').removeClass('high-light');
	$(obj).addClass('high-light');
	var text = $(obj).find('span').html();
	$.ajax({
		url:router('customer/info'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'company':text
		},
		success:function(res){
			delete res[0].insert_person;
			delete res[0].insert_time;
			delete res[0].certified;
			var interText = doT.template($("#table_info").text()); 
  			$(".table-wrap tbody").html(interText(dataReo(res)));
  			transPerson();
  			album(res[0].album);
  			$('.right-score span').html(parseInt(res[0].info_score)+'%');
  			star(res[0].star);
  			$('.album-btn button').removeAttr('disabled');
  			var data_cpy = $('.table-wrap tbody tr').eq(0).find('input').eq(0).val();
  			$('.table-wrap tbody').attr('data-cpy',data_cpy);
  			selectList();
  			$("#datepicker").kendoDatePicker();
  			var val = $("#datepicker").val();
  			$("#datepicker").keyup(function(){
				$(this).val(val);
			});
			creditList(res[0]);
		}
	});
}
function sub(){
	var cpy = $('.modal-dialog .modal-body .input-group .cpy').val();
	var _abb = $('.modal-dialog .modal-body .input-group .abb').val();
	if(cpy==''||abb==''){
		$('#myModal').trigger('click');
		toast('请输入完整信息！');
		return;
	}
	if(/^\w{1,8}$/ig.test(_abb)==true){
		var abb = _abb.toUpperCase();
	}else{
		toast('英文缩写输入有误');
	}
	$('#myModal').trigger('click');
	toast('正在提交','info',1);
	$.ajax({
		url:router('customer/createCpy'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			'cpy':cpy,
			'abb':abb
		},
		success:function(res){
			$('.my-toast').remove();
			if(res&&res.code==200){
				$('#myModal').trigger('click');
				var interText = doT.template($("#company_info").text()); 
	  			$(".bar-bottom ul").html(interText(res.data));
				$('.bar-bottom li').removeClass('high-light');
				$('.bar-bottom li:last').addClass('high-light');
				$('.bar-bottom li:last').trigger('click');
				var height = $('.bar-bottom ul').height();
				$('.bar-bottom').scrollTop(height);
			}else{
				$('#myModal').trigger('click');
				toast(res.msg);
			}
		}
	});
}
function search(){
	if(checkChange()==1) return;
	var keyword = $('.sear input').val();
	toast('正在搜索...','info',1);
	$.ajax({
		url:router('customer/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'keyword':keyword
		},
		success:function(res){
			$('.alert').remove();
			if(res&&res.err){
				toast('不存在该公司！');
				// $(".bar-bottom ul,.table-wrap tbody").html('');
				// newCpy();
				return false;
			}
			album(res.info[0].album);
			var interText = doT.template($("#company_info").text()); 
  			$(".bar-bottom ul").html(interText(res.list));
			$(".bar-bottom ul li").eq(0).addClass('high-light');
			var interText = doT.template($("#table_info").text()); 
  			$(".table-wrap tbody").html(interText(dataReo(res.info)));
  			transPerson();
  			$('.right-score span').html(parseInt(res.info[0].info_score)+'%');
  			star(res.info[0].star);
  			var data_cpy = $('.table-wrap tbody tr').eq(0).find('input').eq(0).val();
  			$('.table-wrap tbody').attr('data-cpy',data_cpy);
  			selectList();
  			$("#datepicker").kendoDatePicker();
  			var val = $("#datepicker").val();
  			$("#datepicker").keyup(function(){
				$(this).val(val);
			});
			creditList(res.info[0]);
		}
	});
}
function mySort(key){
	if(key=="累计销售额"){
		key = "total_sale";
	}else if(key=="上年销售额"){
		key = "last_sale";
	}else if(key=="请选择排序方式"){
		key = "all";
	}else if(key=="最近更新"){
		key = "update_time";
	}else{
		key = "level";
	}
	toast('正在搜索...','info',1);
	$.ajax({
		url:router('customer/mySort'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'key':key
		},
		success:function(res){
			$('.alert').remove();
			var interText = doT.template($("#company_info").text()); 
  			$(".bar-bottom ul").html(interText(res));
			$(".bar-bottom ul li").eq(0).addClass('high-light');
			$(".bar-bottom ul li").eq(0).trigger('click');
		}
	});
}
function subInfo(){
	var text = $('.table-wrap tbody').attr('data-cpy');
	$('#myModalLabel').html('消息框');
	$('.modal-body').html('确定提交<span style="font-size: 18px;color: #f60;">'+text+'</span>的所有信息？');
	$('.modal-footer').find('button').eq(1).attr('onclick','submitInfo("'+text+'");');
	$('#myModal').modal();
}
function checkAbb(cb){
	var len = $('.table-wrap input').length;
	for (var i = 0; i < len; i++) {
		var k = $('.table-wrap input').eq(i).attr('data-abb');
		var v = $('.table-wrap input').eq(i).parent().prev().html();
		if(k==1&&(v=='英文缩写'||v=='中文缩写')){
			// var abb = $('.table-wrap input').eq(i).val();
			var abb = $('.table-wrap input[data-value=abb]').val();
			var cn_abb = $('.table-wrap input[data-value=cn_abb]').val();
			exec(abb,cn_abb,cb);
			break;
		}else if(i==len-1){
			cb();
		}
	};
}
function exec(abb,cn_abb,cb){
	var user_id = $('.table-wrap input[data-value=user_id]').val();
	$.ajax({
		url:router('customer/checkAbb'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'user_id': user_id,
			'abb': abb,
			'cn_abb': cn_abb
		},
		success:function(res){
			if(res&&res.code==200){
				cb();
			}else{
				$('.my-toast').remove();
				toast(res.msg);
			}
		}
	});
}
function submitInfo(cpy){
	if(checkForm()==0) return false;
	$('#myModal').trigger('click');
	var _str = '';
	var len = $('.table-wrap tbody input').length;
	for(var i=0;i<len;i++){
		if($('.table-wrap tbody tr').find('input').eq(i).attr('data-value')=='user_id'){
			var user_id = $('.table-wrap tbody tr').find('input').eq(i).val();
		}
		_str += trans(i)+' = ';
		if($('.table-wrap tbody tr').find('input').eq(i).attr('data-value')=='update_person'){
			var _val = $('.table-wrap tbody tr').find('input').eq(i).attr('data-person');
		}else{
			var _val = $('.table-wrap tbody tr').find('input').eq(i).val();
		}
		if(!_val){
			if($('.table-wrap tbody tr').find('input').eq(i).attr('data-value')=='operKey'){
				var val = 0;
			}else{
				var val = '\"\"';
			}
		}else{
			var val = makeSQL(trans(i),_val);
		}
		_str += val+',';
	}
	var str = _str.slice(0,_str.length-1);
	var cpy = $('.table-wrap tbody').attr('data-cpy');
	if(checkName()==0) return;
	checkAbb(function(){
		toast('正在提交...','info',1);
		$.ajax({
			url:router('customer/updateInfo'),
			type:'post',
			dataType:'json',
			timeout:30000,
			data:{
				'cpy':cpy,
				'str':str,
				'user_id':user_id
			},
			success:function(res){
				if(res&&res.status=='error'){
					$('.alert').remove();
					toast(res.msg);
					$('.table-wrap tbody tr').find('input').eq(1).focus();
				}else{
					$('.alert').remove();
					var interText = doT.template($("#table_info").text()); 
		  			$(".table-wrap tbody").html(interText(dataReo(res)));
		  			transPerson();
		  			album(res[0].album);
		  			$('.right-score span').html(parseInt(res[0].info_score)+'%');
		  			star(res[0].star);
		  			var data_cpy = $('.table-wrap tbody tr').eq(0).find('input').eq(0).val();
		  			$('.table-wrap tbody').attr('data-cpy',data_cpy);
		  			$('.bar-bottom .high-light p').html('('+res[0].level+')<span>'+res[0].company+'</span>');
		  			cancel();
		  			selectList();
		  			$("#datepicker").kendoDatePicker();
		  			var val = $("#datepicker").val();
		  			$("#datepicker").keyup(function(){
						$(this).val(val);
					});
					toast('修改成功');
				}
			}
		});
	});
}
function makeSQL(key,val){
	if(key=='id'||key=='user_id'||key=='use_per'||key=='credit_line'||key=='credit_period'||key=='last_sale'||key=='total_sale'||key=='zip_code'||key=='star'){
		return val;
	}else{
		var val = val.replace(/(\'|\")/g,'');
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
		}else if(key=='update_time'){
			var date = new Date();
			var yy = date.getFullYear();
			var mm = date.getMonth()+1;
			var dd = date.getDate();
			var _str = yy+'-'+mm+'-'+dd;
			var str = '\"'+_str+'\"';
			return str;
		}else if(key=='abb'){
			var _v = val.toUpperCase();
			var str = '\"'+_v+'\"';
			return str;
		}else if(key=='credit_qualified'){
			if(val=='合格'){
				var _v = 1;
			}else{
				var _v = 0;
			}
			return _v;
		}else{
			var str = '\"'+val+'\"';
			return str;
		}
	}
}
function dataChange(obj){
	$('.table-wrap tbody').attr('data-change',true);
	$(obj).attr('data-change',true);
	var abb = $(obj).attr('data-value');
	// var text = $(obj).parent().prev().html();
	if(abb=='abb'||abb=='cn_abb'){
		$(obj).attr('data-abb',1);
	}
}
function checkChange(){
	if($('.table-wrap tbody').attr('data-change')){
		submitInfo();
		return 1;
	}else{
		return 0;
	}
}
function cancel(){
	$('.table-wrap tbody').removeAttr('data-change');
	$('.modal-dialog .modal-footer button').eq(0).removeAttr('onclick');
	checkChange();
}
function dataReo(obj){
	var arr = [];
	for(var i in obj[0]){
		if(i!='id'&&i!='info_score'&&i!='isdel'&&i!='pwd'&&i!='credit_record'){
			var o = {};
			o.key = i;
			o.val = obj[0][i]!=null?obj[0][i]:'';
			// o.val = obj[0][i]?obj[0][i]:'';
			arr.push(o);
		}
	}
	count = 0;
	return arr;
}
function transName(i){
	var arr = ['','编号','客户','客户号','英文缩写','中文缩写','注册人','法人','省份','城镇','注册公司','注册地','注册电话','开户行',
	'银行账户','税号','类型','等级','业务员','开始合作时间','网站','邮箱','密码','主营产品','采用率','附注','更新时间','信用额',
	'信用期','上年销售额','累计销售额','营业地址','邮政编码','相册','信息完整度'];
	count++;
	return arr[count];
}
function trans(i){
	var val = $('.table-wrap td input').eq(i).attr('data-value');
	return val;
	// var arr = ['id','company','user_id','abb','cn_abb','reg_person','legal_person','province','town','reg_company','reg_addr','reg_tel','bank_name',
	// 'bank_account','tax_id','type','level','manager','datefrom','website','email','pwd','products','use_per','rem','update_time','credit_line',
	// 'credit_period','last_sale','total_sale','bussiness_addr','zip_code','album','info_score'];
	// return arr[i];
}
function cl(){
	$('#search').val('').focus();
}
function newCpy(){
	var str = '<p>'+
				'<div class="input-group">'+
				  '<span class="input-group-addon" id="basic-addon1">公司名</span>'+
				  '<input type="text" class="form-control cpy" placeholder="请输入公司全称" aria-describedby="basic-addon1">'+
				  '<span class="input-group-addon" id="basic-addon2">英文缩写</span>'+
				  '<input type="text" class="form-control abb" placeholder="请输入英文缩写" aria-describedby="basic-addon2">'+
				'</div>'+
			  '</p>';
	$('#myModalLabel').html('新建公司');
	$('.modal-body').html(str);
	$('.modal-footer button').eq(1).attr('onclick','sub()');
	$('#myModal').modal();
}
function delCpyBtn(){
	var cpy = $('.table-wrap tbody').attr('data-cpy');
	$('#myModalLabel').html('警告框');
	$('.modal-body').html('确定删除<span style="font-size:16px;color:#f60">'+cpy+'</span>？');
	$('.modal-footer button').eq(1).attr('onclick','delcpy()');
	$('#myModal').modal();
}
function delcpy(){
	$('#myModal').trigger('click');
	var cpy = $('.table-wrap tbody').attr('data-cpy');
	toast('正在删除...','',1);
	$.ajax({
		url:router('customer/delCpy'),
		type:'delete',
		dataType:'json',
		timeout:30000,
		data:{
			'cpy':cpy,
		},
		success:function(res){
			if(res&&res.status=='succeed'){
				toast('删除成功！');
				setTimeout(function(){
					window.location.reload();
				},1000);
			}
		}
	});
}
function album(opt){
	if(opt==''){
		arr = [''];
	}else{
		try{
			var arr = opt.split(',');
		}catch(e){
			var arr = [opt];
		}
	}
	var interText = doT.template($("#company_album").text()); 
	$("#myCarousel").html(interText(arr));
	$('.carousel').carousel();
}
function selectList(){
	$('.table-wrap input').click(function(){
		var v = $(this).val();
		var key = $(this).parent().prev().html();
		if(list(key)==''){
			return false;
		}else{
			var arr = list(key);
			var _str = '';
			arr.forEach(function(item){
				_str +='<li>'+item+'</li>';
			});
			var width = $(this).width();
			var str = '<ul class="selectList" style="width:'+width+'px">'+_str+'</ul>';
			var that = this;
			$(this).parent().css('position','relative');
			$(this).parent().append(str);
			$(this).keyup(function(){
				$(this).val(v);
			});
			$('.selectList li').mouseover(function(){
				$(this).css('background','#999');
				$(this).parent().attr('data-rem',true);
			});
			$('.selectList li').mouseout(function(){
				$(this).css('background','#fff');
				$(this).parent().removeAttr('data-rem');
			});
			$('.selectList li').click(function(){
				dataChange();
				var val = $(this).html();
				$(that).val(val);
				$('.selectList').remove();
			});
			$(that).blur(function(){
				if(!$('.selectList').attr('data-rem')){
					$('.selectList').remove();
				}
			});
		}
	});
}
function list(key){
	switch(key){
		case '类型':
			return ['生产厂家','经销商','终端客户'];
			break;
		case '等级':
			return ['A','B','C','D','E','F'];
			break;
		case '星级':
			return [0,1,2,3,4,5,6,7,8,9,10];
			break;
		case '信用评价':
			return ['合格','不合格'];
			break;
		case '省份':
			return ['山东','吉林','上海','广东','浙江','广西','北京','甘肃','湖南','陕西','重庆','河南','宁夏','湖北',
					'辽宁','河北','江苏','海南','新疆','广州','四川','云南','安徽','江西','福建','天津','山西','内蒙古',
					'青海','贵州','重庆','西藏','黑龙江','香港','澳门','台湾','国外','其他'];
			break;
		default:
			return '';
			break;
	}
}
function checkForm(){
	var len = $('.table-wrap td input').length;
	for(var i=0;i<len;i++){
		if($('.table-wrap td input').eq(i).attr('data-change')=='true'){
			if(checkPat(i)==0){
				return 0;
			}
		}
	}
}
function checkPat(i){
	var val = $('.table-wrap td input').eq(i).val();
	var pattern = $('.table-wrap td input').eq(i).attr('pattern');
	var pat = new RegExp(pattern,'ig');
	if((!pat.test(val))&&(val!='')){
		deal(i);
		return 0;
	}
}
function deal(i){
	toast('输入格式不正确！');
	$('.table-wrap td input').eq(i).focus();
}

function star(num){
	$('.search .star span').removeClass('icon-half-star light').addClass('icon-all-star');
	var half_num = num/2;
	var str = half_num.toString();
	var n = str.split('.')[0];
	var f = str.split('.')[1];
	if(f=='5'){
		for (var i = 0; i < n; i++) {
			$('.search .star span').eq(i).addClass('light');
		}
		$('.search .star span').eq(i).removeClass('icon-all-star').addClass('icon-half-star');
	}else{
		for (var i = 0; i < n; i++) {
			$('.search .star span').eq(i).addClass('light');
		}
	}
}

function checkName(){
	var cpy,abb;
	$('.table-wrap tbody input').each(function(i){
		if($(this).attr('data-value')=='company'){
			cpy = $(this).val();
		}
		if($(this).attr('data-value')=='abb'){
			abb = $(this).val().toUpperCase();
		}
	});
	var len = $('.bar-bottom li').length;
	var key = $('.bar-bottom li');
	for (var i = 0; i < len; i++) {
		if(key.eq(i).attr('data-cpy')==cpy&&(!key.eq(i).hasClass('high-light'))){
			$('.my-toast').remove();
			toast('该公司名已存在');
			$('.table-wrap tbody input').eq(0).focus();
			return 0;
		}else if(key.eq(i).attr('data-abb')==abb&&(!key.eq(i).hasClass('high-light'))){
			$('.my-toast').remove();
			toast('该缩写已存在');
			$('.table-wrap tbody input').eq(2).focus();
			return 0;
		}
	};
}
function transPerson(){
	setTimeout(function(){
		var len = $('.table-wrap input').length;
		var t = $('.table-wrap input');
		for (var i = 0; i < len; i++) {
			if(t.eq(i).attr('data-value')=='update_person'){
				var val = t.eq(i).val();
				var ind = i;
				$.ajax({
					url:router('customer/transPerson'),
					type:'get',
					dataType:'json',
					timeout:30000,
					data:{
						'val':val,
					},
					success:function(res){
						try{
							t.eq(ind).val(res[0].user_name);
							t.eq(ind).attr('data-person',val);
						}catch(e){

						}
					}
				});
			}else if(t.eq(i).attr('data-value')=='credit_qualified'){
				transCredit(t.eq(i),t.eq(i).val());
			}
		};
	},50);
}

function transCredit(el,v){
	if(v==1){
		el.val('合格');
	}else{
		el.val('不合格');
	}
}
function creditList(data){
	if(data.credit_record==null||data.credit_record==''){
		var str = '<li>'+
					'<span>暂无记录</span>'+
				'</li>';
		$('.relevance').html(str);
		return;
	}
	var data_arr = JSON.parse(data.credit_record);
	var str = '';
	if(data_arr.length==0){
		str += '<li>'+
					'<span>暂无记录</span>'+
				'</li>';
	}else{
		for (var i = 0; i < data_arr.length; i++) {
			str += '<li>'+
						'<span>'+data_arr[i].name+'</span></br>'+
						'<span>'+data_arr[i].time+'</span></br>'+
						'<span>'+data_arr[i].content+'</span>'+
					'</li>';
		};
	}
	$('.relevance').html(str);
}
function newRec(){
	if($('#rec').length==0){
		var str = '<div style="text-align:right;">'+
					'<textarea rows=5 id="rec" style="width: 94%;margin-top: 10px;margin-right: 4%;border-radius: 6px;" placeholder="请输入..."></textarea>'+
					'<button class="alert alert-info" onclick="recSub();" style="width:70px;margin-right:4%;padding: 7px;">提交</button>';
				'</div>';
		$('.relevance').prepend(str);
	}
}
function recSub(){
	var content = $('#rec').val();
	content = content.replace(/\n/g,'</br>');
	content = content.replace(/\s/g,'&nbsp;');
	var cpy = $('.table-wrap tbody').attr('data-cpy');
	$.ajax({
		url:router('customer/addRec'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			cpy: cpy,
			content: content
		},
		success:function(res){
			toast(res.msg);
			$('.bar-bottom li[data-cpy='+cpy+']').trigger('click');
		}
	});
}

function table(key){
	switch(key){
		case 'company' :
			return {
				'name':'客户',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'user_id' :
			return {
				'name':'客户号',
				'readonly':'readonly',
				'pattern':'^[0-9]{1,4}$'
			};
			break;
		case 'abb' :
			return {
				'name':'英文缩写',
				'readonly':'',
				'pattern':'^[\\w]{1,8}$'
			};
			break;
		case 'cn_abb' :
			return {
				'name':'中文缩写',
				'readonly':'',
				'pattern':'^[\\u4e00-\\u9fa5]{1,8}$'
			};
			break;
		case 'reg_person' :
			return {
				'name':'指定注册人',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'legal_person' :
			return {
				'name':'法定代表人',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'province' :
			return {
				'name':'省份',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'town' :
			return {
				'name':'城镇',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'reg_company' :
			return {
				'name':'开票公司',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'reg_addr' :
			return {
				'name':'开票地址',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'reg_tel' :
			return {
				'name':'开票电话',
				'readonly':'',
				'pattern':'^[\\-0-9]{1,20}$'
			};
			break;
		case 'bank_name' :
			return {
				'name':'开户行',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'bank_account' :
			return {
				'name':'银行账户',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'tax_id' :
			return {
				'name':'税号',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'type' :
			return {
				'name':'类型',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'level' :
			return {
				'name':'等级',
				'readonly':'',
				'pattern':'',
			};
			break;
		case 'manager' :
			return {
				'name':'业务员',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'datefrom' :
			return {
				'name':'开始合作时间',
				'readonly':'',
				'pattern':'',
				'type':'datepicker'
			};
			break;
		case 'website' :
			return {
				'name':'网站',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'email' :
			return {
				'name':'邮箱',
				'readonly':'',
				'pattern':'^\\w[-\\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\\.)+[A-Za-z]{2,14}$'
			};
			break;
		case 'pwd' :
			return {
				'name':'密码',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'products' :
			return {
				'name':'主营产品',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'use_per' :
			return {
				'name':'采用率',
				'readonly':'',
				'pattern':'^\\d{1,3}$'
			};
			break;
		case 'rem' :
			return {
				'name':'附注',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'update_time' :
			return {
				'name':'更新时间',
				'readonly':'readonly',
				'pattern':''
			};
			break;
		case 'credit_line' :
			return {
				'name':'信用额',
				'readonly':'',
				'pattern':'^\\d{1,10}$'
			};
			break;
		case 'credit_period' :
			return {
				'name':'信用期',
				'readonly':'',
				'pattern':'^\\d{1,10}$'
			};
			break;
		case 'credit_qualified' :
			return {
				'name':'信用评价',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'last_sale' :
			return {
				'name':'上年销售额',
				'readonly':'',
				'pattern':'^\\d{1,10}$'
			};
			break;
		case 'total_sale' :
			return {
				'name':'累计销售额',
				'readonly':'',
				'pattern':'^\\d{1,10}$'
			};
			break;
		case 'bussiness_addr' :
			return {
				'name':'营业地址',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'zip_code' :
			return {
				'name':'邮政编码',
				'readonly':'',
				'pattern':'^\\d{6}$'
			};
			break;
		case 'album' :
			return {
				'name':'相册',
				'readonly':'readonly',
				'pattern':'^(\\d{1,4})$'
			};
			break;
		case 'info_score' :
			return {
				'name':'信息完整度',
				'readonly':'readonly',
				'pattern':'',
			};
			break;
		case 'star' :
			return {
				'name':'星级',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'update_person' :
			return {
				'name':'更新人',
				'readonly':'readonly',
				'pattern':'',
			};
			break;
		case 'operKey' :
			return {
				'name':'操作码',
				'readonly':'readonly',
				'pattern':'',
			};
			break;
		case 'partner' :
			return {
				'name':'合伙人',
				'readonly':'',
				'pattern':'',
			};
			break;
		case 'tech_support' :
			return {
				'name':'技术支持',
				'readonly':'',
				'pattern':'',
			};
			break;
		case 'intention_products' :
			return {
				'name':'意向产品',
				'readonly':'',
				'pattern':'',
			};
			break;
		case 'adopt_product' :
			return {
				'name':'采用产品',
				'readonly':'',
				'pattern':'',
			};
			break;
		default: 
			return {
				'name':'',
				'readonly':'',
				'pattern':'',
			};
			break;
	}
}