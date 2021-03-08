var count = 0;
$(document).ready(function(){
	$.ajax({
		url:router('contact/info'),
		type:'get',
		dataType:'json',
		timeout:30000,
		success:function(res){
			delete res.info[0].insert_person;
			var interText = doT.template($("#company_info").text()); 
  			$(".bar-bottom ul").html(interText(res.list));
			$(".bar-bottom ul li").eq(0).addClass('high-light');
			var interText = doT.template($("#table_info").text()); 
			$(".table-wrap tbody").html(interText(dataReo(res.info)));
			ajax_res(res.info);
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
function ajax_res(res){
	transPerson();
	try{
		$('.right-score span').html(res[0].info_score+'%');
	}catch(e){}
	var len = $('.table-wrap tbody input').length;
	for (var i = 0; i < len; i++) {
		var key = $('.table-wrap tbody input').eq(i).attr('data-value');
		var val = $('.table-wrap tbody input').eq(i).val();
		if(key=='abb'){
			$('.table-wrap tbody').attr('data-abb',val);
		}else if(key=='verified'){
			if(val==1){
				$('.table-wrap tbody input').eq(i).val('已认证');
			}else{
				$('.table-wrap tbody input').eq(i).val('未认证');
			}
		}
	};
	selectList();
	album(res[0].album);
	$("#datepicker").kendoDatePicker();
	var val = $("#datepicker").val();
	$("#datepicker").keyup(function(){
		$(this).val(val);
	});
}
function filter(){
	if(checkChange()==1) return;
	$('#myModal').modal();
}
function checkCpy(obj){
	if(checkChange()==1) return;
	$('.bar-bottom li').removeClass('high-light');
	$(obj).addClass('high-light');
	var abb = $(obj).attr('data-abb');
	$.ajax({
		url:router('contact/info'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'abb':abb
		},
		success:function(res){
			delete res[0].insert_person;
			var interText = doT.template($("#table_info").text()); 
  			$(".table-wrap tbody").html(interText(dataReo(res)));
  			ajax_res(res);
		}
	});
}
function sub(){
	var name = $('.modal-dialog .modal-body input[type="text"]').eq(0).val();
	var _abb = $('.modal-dialog .modal-body input[type="text"]').eq(1).val();
	var abb = _abb.toUpperCase();
	if(name==''||abb==''){
		$('#myModal').trigger('click');
		toast('请输入完整信息！');
		return;
	}
	if(/^\w{1,8}$/ig.test(abb)==false){
		toast('英文缩写格式不正确！');
		return;
	}
	if(checkAbb(abb)==1) return;
	$.ajax({
		url:router('contact/createCpy'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			'name':name,
			'abb':abb
		},
		success:function(res){
			$('#myModal').trigger('click');
			var interText = doT.template($("#company_info").text()); 
  			$(".bar-bottom ul").html(interText(res));
			$('.bar-bottom li').removeClass('high-light');
			$('.bar-bottom li:last').addClass('high-light');
			$('.bar-bottom li:last').trigger('click');
			var height = $('.bar-bottom ul').height();
			$('.bar-bottom').scrollTop(height);
		}
	});
}
function search(){
	if(checkChange()==1) return;
	var keyword = $('.sear input').val();
	if(keyword=='0'){
		toast('输入不合法');
		return;
	}
	toast('正在搜索...','info',1);
	$.ajax({
		url:router('contact/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			'keyword':keyword
		},
		success:function(res){
			$('.alert').remove();
			if(res&&res.err){
				toast('不存在该联系人！');
				// $(".bar-bottom ul,.table-wrap tbody").html('');
				// newCpy();
				return false;
			}
			var interText = doT.template($("#company_info").text()); 
  			$(".bar-bottom ul").html(interText(res.list));
			$(".bar-bottom ul li").eq(0).addClass('high-light');
			var interText = doT.template($("#table_info").text()); 
  			$(".table-wrap tbody").html(interText(dataReo(res.info)));
  			ajax_res(res.info);
		}
	});
}
function mySort(key){
	if(key=="是否认证"){
		key = "verified";
	}else if(key=="请选择排序方式"){
		key = "all";
	}else if(key=="最近更新"){
		key = "update_time";
	}
	toast('正在搜索...','info',1);
	$.ajax({
		url:router('contact/mySort'),
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
function submitInfo(cpy){
	if(checkForm()==0) return false;
	$('#myModal').trigger('click');
	var _str = '';
	var len = $('.table-wrap tbody input').length;
	for(var i=0;i<len;i++){
		if($('.table-wrap tbody tr').find('input').eq(i).attr('data-value')=='abb'){
			var new_abb = $('.table-wrap tbody tr').find('input').eq(i).val();
		}
		_str += trans(i)+' = ';
		if($('.table-wrap tbody tr').find('input').eq(i).attr('data-value')=='update_person'){
			var _val = $('.table-wrap tbody tr').find('input').eq(i).attr('data-person');
		}else{
			var _val = $('.table-wrap tbody tr').find('input').eq(i).val();
		}
		if(!_val){
			var val = '\"\"';
		}else{
			var val = makeSQL(trans(i),_val);
		}
		_str += val+',';
	}
	var str = _str.slice(0,_str.length-1);
	var abb = $('.table-wrap tbody').attr('data-abb');
	var new_abb_upper = new_abb.toUpperCase();
	if(checkAbb2(new_abb_upper)==1) return;
	toast('正在提交...','info',1);
	$.ajax({
		url:router('contact/updateInfo'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			'abb':abb,
			'str':str,
			'new_abb':new_abb
		},
		success:function(res){
			$('.alert').remove();
			var interText = doT.template($("#table_info").text()); 
  			$(".table-wrap tbody").html(interText(dataReo(res)));
  			ajax_res(res);
  			if(res[0].verified=='已认证'){
  				$('.bar-bottom .high-light p').html('<span class="iconfont icon-verified-v" style="margin-right: 4px;"></span><span>'+res[0].name+'</span>');
  			}else{
  				$('.bar-bottom .high-light p').html('<span>'+res[0].name+'</span>');
  			}
  			$('.bar-bottom .high-light').attr('data-abb',res[0].abb);
  			cancel();
			toast('修改成功');
		}
	});
}
function makeSQL(key,val){
	if(key=='id'||key=='info_score'){
		return val;
	}else{
		if(key=='insert_time'){
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
		}else if(key=='abb'){
			var s = val.toUpperCase();
			var str = '\"'+s+'\"';
			return str;
		}else if(key=='verified'){
			if(val=='已认证'){
				var str = '\"'+1+'\"';
			}else{
				var str = '\"'+0+'\"';
			}
			return str;
		}else{
			var str = '\"'+val+'\"';
			return str;
		}
	}
}
function dataChange(obj){
	$('.table-wrap tbody').attr('data-change',true);
	$(obj).attr('data-change',true);
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
		if(i!='id'&&i!='info_score'&&i!='isdel'&&i!='verified'){
			var o = {};
			o.key = i;
			o.val = obj[0][i]?obj[0][i]:'';
			// o.key = transName(i);
			// o.val = obj[0][i];
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
				  '<span class="input-group-addon" id="basic-addon1">姓名</span>'+
				  '<input type="text" class="form-control province" placeholder="姓名" aria-describedby="basic-addon1">'+
				  '<span class="input-group-addon" id="basic-addon2">英文简称</span>'+
				  '<input type="text" class="form-control province" placeholder="英文简称" aria-describedby="basic-addon2">'+
				'</div>'+
			  '</p>';
	$('#myModalLabel').html('新建联系人');
	$('.modal-body').html(str);
	$('.modal-footer button').eq(1).attr('onclick','sub()');
	$('#myModal').modal();
}
function delCpyBtn(){
	var abb = $('.table-wrap tbody').attr('data-abb');
	$('#myModalLabel').html('警告框');
	$('.modal-body').html('确定删除<span style="font-size:16px;color:#f60">'+abb+'</span>？');
	$('.modal-footer button').eq(1).attr('onclick','delcpy()');
	$('#myModal').modal();
}
function delcpy(){
	$('#myModal').trigger('click');
	var abb = $('.table-wrap tbody').attr('data-abb');
	toast('正在删除...','',1);
	$.ajax({
		url:router('contact/delCpy'),
		type:'delete',
		dataType:'json',
		timeout:30000,
		data:{
			'abb':abb
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
		case '认证':
			return ['已认证','未认证'];
			break;
		case '性别':
			return ['男','女','未知'];
			break;
		case '关系':
			return ['客户','同行','经销商','供应商','主管单位','主管部门','合作','公共关系','其他'];
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
function checkAbb(abb){
	var len = $('.bar-bottom li').length;
	var k = $('.bar-bottom li');
	for (var i = 0; i < len; i++) {
		if(k.eq(i).attr('data-abb')==abb){         
			toast('该英文简称已存在！');
			return 1;
		}
	};
}
function checkAbb2(abb){
	var len = $('.bar-bottom li').length;
	var k = $('.bar-bottom li');
	for (var i = 0; i < len; i++) {
		if(k.eq(i).attr('data-abb')==abb&&(!k.eq(i).hasClass('high-light'))){         
			toast('该英文简称已存在！');
			return 1;
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
						t.eq(ind).val(res[0].user_name);
						t.eq(ind).attr('data-person',val);
					}
				});
			}
		};
	},50);
}

function table(key){
	switch(key){
		case 'abb' :
			return {
				'name':'英文简称',
				'readonly':'',
				'pattern':'^[\\w]{1,8}$'
			};
			break;
		case 'verified' :
			return {
				'name':'认证',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'name' :
			return {
				'name':'姓名',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'sex' :
			return {
				'name':'性别',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'phone1' :
			return {
				'name':'手机号码1',
				'readonly':'',
				'pattern':'^1(3|5|7|8|9)\\d{9}$'
			};
			break;
		case 'phone2' :
			return {
				'name':'手机号码2',
				'readonly':'',
				'pattern':'^1(3|5|7|8|9)\\d{9}$'
			};
			break;
		case 'company' :
			return {
				'name':'公司',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'tel' :
			return {
				'name':'电话',
				'readonly':'',
				'pattern':'^[\\-0-9]{1,20}$'
			};
			break;
		case 'qq' :
			return {
				'name':'qq',
				'readonly':'',
				'pattern':'^\\d{6,12}$'
			};
			break;
		case 'wx_id' :
			return {
				'name':'微信号',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'wx_open_id' :
			return {
				'name':'wx_open_id',
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
		case 'identify' :
			return {
				'name':'身份证',
				'readonly':'',
				'pattern':'^\\d{15}|\\d{17}[0-9Xx]$'
			};
			break;
		case 'relation' :
			return {
				'name':'关系',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'job' :
			return {
				'name':'职位',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'addr' :
			return {
				'name':'地址',
				'readonly':'',
				'pattern':'',
			};
			break;
		case 'rem' :
			return {
				'name':'附注',
				'readonly':'',
				'pattern':''
			};
			break;
		case 'insert_time' :
			return {
				'name':'添加时间',
				'readonly':'readonly',
				'pattern':''
			};
			break;
		case 'album' :
			return {
				'name':'相册',
				'readonly':'readonly',
				'pattern':''
			};
			break;
		case 'info_score' :
			return {
				'name':'信息完整度',
				'readonly':'readonly',
				'pattern':'',
			};
			break;
		case 'update_person' :
			return {
				'name':'更新人',
				'readonly':'readonly',
				'pattern':'',
			};
			break;
		case 'update_time' :
			return {
				'name':'更新时间',
				'readonly':'readonly',
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