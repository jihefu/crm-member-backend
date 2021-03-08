$(document).ready(function(){
	$('.bar-bottom li').eq(0).addClass('high-light');
	createTable(_data);
	inputDel();
	sort();
	transPerson();
	selectList();
	listenChange();
	transDate();
});
function createImg(data){
	var album_str = '';
	data.forEach(function(items,index){
		if(items.key=='album') {
			album_str = items.val;
		}
	});
	var album_arr = album_str.split(',');
	if(album_arr[0]==''){
		var str = '<div class="pic item active">'+
						'<img src="http://iph.href.lu/440x200?text=朗杰测控" onclick="cdIn()">'+
					'</div>';
		$('.carousel-inner').append(str);
		$('.carousel').carousel();
		return;
	}
	var str = '';
	for (var i = 0; i < album_arr.length; i++) {
		if(i==0){
			str += '<div class="pic item active">'+
					'<img src="../img'+album_arr[i]+'" onclick="cdIn()">'+
				'</div>';
		}else{
			str += '<div class="pic item">'+
				'<img src="../img'+album_arr[i]+'" onclick="cdIn()">'+
			'</div>';
		}
	};
	$('.carousel-inner').append(str);
	$('.carousel').carousel();
}
function transDate(){
	$('.table-wrap tbody input').each(function(){
		if($(this).attr('data-key')=='datefrom'){
			$(this).kendoDatePicker();
  			var val = $(this).val();
  			$(this).keyup(function(){
				$(this).val(val);
			});
		}
	});
}
function listenChange(){
	$('.table-wrap tbody input').on('change',function(){
		$('.table-wrap tr').eq(0).attr('data-change',true);
	});
}
function pageAjax(page,type,cb){
	if(type=='default'){
		$.ajax({
			url:route('admin/users/getPage'),
			type:'get',
			dataType:'json',
			timeout:30000,
			data: {
				page: page
			},
			success:function(res){
				cb(res);
			}
		});
	}else if(type=='sort'){
		$.ajax({
			url:route('admin/users/sort'),
			type:'get',
			dataType:'json',
			timeout:30000,
			data: {
				key: sort_key,
				page: page
			},
			success:function(res){
				cb(res);
			}
		});
	}
}
function prev(){
	var page = $('.page').attr('data-page');
	var type = $('body').attr('data-type');
	page--;
	if(page==0){
		toast('已是第一页');
		return;
	}
	$('.page').attr('data-page',page);
	$('.page_num').html(page);
	pageAjax(page,type,function(res){
		$('.my-toast').remove();
		var str = '';
		for (var i = 0; i < res.data.length; i++) {
			str += '<li onclick="checkCpy(this);" data-id="'+res.data[i].user_id+'">'+
						'<p><span>('+res.data[i].level+')</span>'+res.data[i].company+'</p>'+
					'</li>'
		};
		$('.bar-bottom ul').html(str);
		$('.bar-bottom li').eq(0).addClass('high-light');
		$('.bar-bottom li').eq(0).trigger('click');
	});
}
function next(){
	var page = $('.page').attr('data-page');
	var type = $('body').attr('data-type');
	if(type=='search') {
		toast('没有更多了');
		return;
	}
	page++;
	pageAjax(page,type,function(res){
		$('.my-toast').remove();
		if(res.data[0]==null){
			toast('没有更多了');
			return;
		}
		$('.page').attr('data-page',page);
		$('.page_num').html(page);
		var str = '';
		for (var i = 0; i < res.data.length; i++) {
			str += '<li onclick="checkCpy(this);" data-id="'+res.data[i].user_id+'">'+
						'<p><span>('+res.data[i].level+')</span>'+res.data[i].company+'</p>'+
					'</li>'
		};
		$('.bar-bottom ul').html(str);
		$('.bar-bottom li').eq(0).addClass('high-light');
		$('.bar-bottom li').eq(0).trigger('click');
	});
}
function createTable(data){
	var arr = [],count=0;
	for (var i = 0; i < data.length; i++) {
		if(trans(data[i].key).name!='其它'){
			arr[count] = trans(data[i].key,data[i].val?data[i].val:'');
			count++;
		}
	};
	arr.forEach(function(items,index){
		if(items.key=='update_time'||items.key=='datefrom') arr[index].val = time(items.val);
	});
	var str = '';
	for (var i = 0; i < arr.length; i=i+2) {
		try{
			str += '<tr>'+
					'<td>'+arr[i].name+'</td>'+
					'<td>'+
						'<input data-key="'+arr[i].key+'" onclick="searchInput(this)" type="text" '+arr[i].readonly+' data-arr="'+arr[i].arr+'" pattern="'+arr[i].pattern+'" value="'+arr[i].val+'">'+
					'</td>'+
					'<td>'+arr[i+1].name+'</td>'+
					'<td>'+
						'<input data-key="'+arr[i+1].key+'" onclick="searchInput(this)" type="text" '+arr[i+1].readonly+' data-arr="'+arr[i+1].arr+'" pattern="'+arr[i+1].pattern+'" value="'+arr[i+1].val+'">'+
					'</td>'+
				'</tr>';
		}catch(e){
			str += '<tr>'+
					'<td>'+arr[i].name+'</td>'+
					'<td>'+
						'<input data-key="'+arr[i].key+'" type="text" '+arr[i].readonly+' data-arr="'+arr[i].arr+'" pattern="'+arr[i].pattern+'" value="'+arr[i].val+'">'+
					'</td>'+
				'</tr>';
		}
	};
	str += '<tr>'+
				'<td colspan="4" class="td_btn">'+
					'<button class="alert alert-danger" onclick="delCpyBtn();">删除用户</button>'+
				'</td>'+
			'</tr>';
	$(".table-wrap tbody").html(str);
	createImg(data);
}
function checkCpy(obj){
	if($('.table-wrap tr').eq(0).attr('data-change')){
		var user_id = $('input[data-key=user_id]').val();
		update(user_id);
		return;
	}
	var user_id = $(obj).attr('data-id');
	$('.bar-bottom li').removeClass('high-light');
	toast('正在搜索','info',1);
	$(obj).addClass('high-light');
	$.ajax({
		url:route('admin/users/info'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			user_id: user_id
		},
		success:function(res){
			$('.my-toast').remove();
			createTable(res.data);
			// createImg(res.data.info);
			transPerson();
			selectList();
			listenChange();
			transDate();
		}
	});
}
function newCpy(){
	var str = '<p>'+
				'<div class="input-group">'+
				  '<span class="input-group-addon" id="basic-addon1">公司</span>'+
				  '<input type="text" class="form-control cpy" placeholder="请输入公司" aria-describedby="basic-addon1">'+
				  '<span class="input-group-addon" id="basic-addon2">英文缩写</span>'+
				  '<input type="text" class="form-control abb" placeholder="英文缩写" aria-describedby="basic-addon1">'+
				'</div>'+
			  '</p>';
	$('#myModalLabel').html('新建用户');
	$('#myModal .modal-body').html(str);
	$('#myModal .modal-footer button').eq(1).attr('onclick','sub()');
	$('#myModal').modal();
}
function sub(){
	var cpy = $('.input-group .cpy').val();
	var abb = $('.input-group .abb').val();
	if(cpy==''||abb==''){
		toast('输入不能为空');
		return;
	}
	if(!/^\w{1,8}$/ig.test(abb)){
		toast('缩写输入不合法');
		return;
	}
	abb = abb.toUpperCase();
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/users/add'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			cpy: cpy,
			abb: abb
		},
		success:function(res){
			$('.my-toast').remove();
			$('.modal-footer .btn-default').trigger('click');
			if(res.code==-1){
				toast(res.msg);
			}else if(res.code==200){
				toast(res.msg);
				var str = '';
				for (var i = 0; i < res.data.length; i++) {
					str += '<li onclick="checkCpy(this);" data-id="'+res.data[i].user_id+'">'+
								'<p><span>('+res.data[i].level+')</span>'+res.data[i].company+'</p>'+
							'</li>'
				};
				$('.bar-bottom ul').html(str);
				$('.bar-bottom li').eq(0).addClass('high-light');
				$('.bar-bottom li').eq(0).trigger('click');
			}
		}
	});
}
function delCpyBtn(){
	var company = $('input[data-key=company]').val();
	var user_id = $('input[data-key=user_id]').val();
	$('#myModalLabel').html('警告框');
	$('.modal-body').html('确定删除<span style="font-size:16px;color:#f60">'+company+'</span>？');
	$('.modal-footer button').eq(1).attr('onclick','delcpy('+user_id+')');
	$('#myModal').modal();
}
function delcpy(user_id){
	$('#myModal').trigger('click');
	toast('正在删除...','',1);
	$.ajax({
		url:route('admin/users/del'),
		type:'delete',
		dataType:'json',
		timeout:30000,
		data:{
			'user_id':user_id,
		},
		success:function(res){
			$('.my-toast').remove();
			for (var i = 0; i < $('.bar-bottom li').length; i++) {
				if($('.bar-bottom li').eq(i).attr('data-id')==user_id){
					$('.bar-bottom li').eq(i).remove();
				}
			};
			$('.table-wrap tbody').html('');
			try{
				$('.bar-bottom li').eq(0).addClass('high-light');
				$('.bar-bottom li').eq(0).trigger('click');
			}catch(e){}
			setTimeout(function(){
				toast(res.msg);
			},500);
		}
	});
}
function search(){
	var val = $('#search').val();
	if(val==''){
		$('body').attr('data-type','default');
	}else{
		$('body').attr('data-type','search');
	}
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/users/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			sn:val
		},
		success:function(res){
			$('.my-toast').remove();
			if(res.data[0]==null){
				toast('不存在该用户');
				$('body').attr('data-type','default');
			}else{
				var str = '';
				for (var i = 0; i < res.data.length; i++) {
					str += '<li onclick="checkCpy(this);" data-id="'+res.data[i].user_id+'">'+
								'<p><span>('+res.data[i].level+')</span>'+res.data[i].company+'</p>'+
							'</li>'
				};
				$('.bar-bottom ul').html(str);
				$('.bar-bottom li').eq(0).addClass('high-light');
				$('.page_num').html(1);
				$('.page').attr('data-page',1);
				$('.bar-bottom li').eq(0).trigger('click');
			}
		}
	});
}
function inputDel(){
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
				// if(checkChange()==1) return;
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
}
function cl(){
	$('#search').val('').focus();
}
function update(user_id){
	if(checkPat()==0) return;
	var obj = $('.table-wrap tbody input[readonly!=readonly]');
	var str = '';
	for (var i = 0; i < obj.length; i++) {
		var key = obj.eq(i).attr('data-key');
		var val = obj.eq(i).val();
		str += key+'='+transToSQL(key,val)+',';
	};
	str = str.slice(0,str.length-1);
	var user_id = $('input[data-key=user_id]').val();
	var abb = $('input[data-key=abb]').val();
	var cn_abb = $('input[data-key=cn_abb]').val();
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/users/update'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			user_id: user_id,
			abb: abb,
			cn_abb: cn_abb,
			str: str
		},
		success:function(res){
			$('.table-wrap tbody tr').eq(0).removeAttr('data-change');
			$('.my-toast').remove();
			setTimeout(function(){
				toast(res.msg);
			},300);
			if(res.code==200){
				var obj = $('.bar-bottom li');
				for (var i = 0; i < obj.length; i++) {
					if(obj.eq(i).attr('data-id')==user_id) {
						obj.eq(i).trigger('click');
					}
				};
			}
		}
	});
}
function checkPat(){
	var o = $('.table-wrap td input[readonly!=readonly]');
	for(var i=0;i<o.length;i++){
		var val = o.eq(i).val();
		var pattern = o.eq(i).attr('pattern');
		var pat = new RegExp(pattern,'ig');
		if((!pat.test(val))&&(val!='')){
			o.eq(i).focus();
			toast('输入不合法');
			return 0;
			break;
		}
	}
}
function transToSQL(key,v){
	if(key=='total_sale'){
		if(v){
			var val = parseInt(v);
			return val;
		}else{
			return 0;
		}
	}else if(key=='datefrom'){
		if(v.indexOf('/')==-1){
			var str = '\"'+v+'\"';
		}else{
			var str = '\"'+time(v)+'\"';
		}
		return str;
	}else{
		return '\"'+v+'\"';
	}
}
function selectList(){
	$('.table-wrap input').click(function(){
		var _k = $(this).attr('data-arr');
		if(_k){
			var v = $(this).val();
			var that = this;
			var width = $(this).width();
			var arr = $(this).attr('data-arr').split(',');
			var str = '';
			for (var i = 0; i < arr.length; i++) {
				str += '<li>'+arr[i]+'</li>';
			};
			str = '<ul class="selectList" style="width:'+width+'px;text-align:center;">'+str+'</ul>';
			$(this).parent().append(str);
			$(this).parent().css('position','relative');
			$('.selectList li').mouseover(function(){
				$(this).css('background','#999');
			});
			$('.selectList li').mouseout(function(){
				$(this).css('background','#fff');
			});
			$(this).blur(function(){
				if($(this).attr('data-mark')){
					$(this).attr('data-mark',false);
				}else{
					$(this).val(v);
				}
				setTimeout(function(){
					$('.selectList').remove();
				},200);
			});
			$('.selectList li').click(function(){
				$(this).attr('data-mark',true);
				var val = $(this).html();
				$(that).val(val);
				$('.table-wrap tr').eq(0).attr('data-change',true);
				setTimeout(function(){
					$('.selectList').remove();
				},200);
			});
		}
	});
}
var t;
function searchInput(obj){
	if($(obj).attr('data-key')!='manager') return;
	$('.selectList').html('');
	var key = $(obj).attr('data-key');
	var _val = $(obj).val();
	var val = _val.replace(/\s|\'/g,'');
	var width = $(obj).width();
	str = '<ul class="selectList" style="width:'+width+'px;text-align:center;">正在搜索</ul>';
	$(obj).parent().append(str);
	$(obj).blur(function(){
		if($(obj).attr('data-mark')){
			$(obj).attr('data-mark',false);
		}else{
			$(obj).val(_val);
		}
		setTimeout(function(){
			$('.selectList').remove();
		},200);
	});
	$(obj).on('keyup',function(){
		var _val = $(obj).val();
		var val = _val.replace(/\s|\'/g,'');
		ajax_input(key,val,obj);
	});
	ajax_input(key,val,obj);
}
function ajax_input(key,val,obj){
	clearTimeout(t);
	t = setTimeout(function(){
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
					var str = '';
					res.data.forEach(function(item){
						str +='<li data-id="'+item.user_id+'">'+item.user_name+'</li>';
					});
					var width = $(obj).width();
					$(obj).parent().css('position','relative');
					$(obj).parent().find('ul').html(str);

					$('.selectList li').mouseover(function(){
						$(this).css('background','#999');
					});
					$('.selectList li').mouseout(function(){
						$(this).css('background','#fff');
					});
					$('.selectList li').click(function(){
						$(obj).attr('data-mark',true);
						var val = $(this).html();
						$(obj).val(val);
						$('.table-wrap tr').eq(0).attr('data-change',true);
						setTimeout(function(){
							$('.selectList').remove();
						},200);
						$(obj).attr('data-value',$(this).attr('data-id'));
					});
				}else{
					$('.selectList').html('不存在');
				}
			}
		});
	},300);
}
var sort_key;
function sort(){
	$('.dropdown-menu li').click(function(){
		sort_key = $(this).attr('data-key');
		var key = $(this).attr('data-key');
		var text = $(this).text();
		$('#dropdownMenu1').html(text+'<span class="caret"></span>');
		$('body').attr('data-type','sort');
		$.ajax({
			url:route('admin/users/sort'),
			type:'get',
			dataType:'json',
			timeout:30000,
			data: {
				key: key
			},
			success:function(res){
				$('.my-toast').remove();
				var str = '';
				for (var i = 0; i < res.data.length; i++) {
					str += '<li onclick="checkCpy(this);" data-id="'+res.data[i].user_id+'">'+
								'<p><span>('+res.data[i].level+')</span>'+res.data[i].company+'</p>'+
							'</li>'
				};
				$('.bar-bottom ul').html(str);
				$('.bar-bottom li').eq(0).addClass('high-light');
				$('.page_num').html(1);
				$('.page').attr('data-page',1);
				$('.bar-bottom li').eq(0).trigger('click');
			}
		});
	});
}
function transPerson(){
	setTimeout(function(){
		var len = $('.table-wrap input').length;
		var t = $('.table-wrap input');
		for (var i = 0; i < len; i++) {
			if(t.eq(i).attr('data-key')=='update_person'){
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
					}
				});
			}
		};
	},50);
}
function trans(key,val){
	switch(key){
		case 'company':
			return {
				'key':'company',
				'val':val,
				'name':'用户',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'user_id':
			return {
				'key':'user_id',
				'val':val,
				'name':'用户编号',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'abb':
			return {
				'key':'abb',
				'val':val,
				'name':'英文缩写',
				'readonly':'',
				'pattern':'^[\\w]{1,8}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'cn_abb':
			return {
				'key':'cn_abb',
				'val':val,
				'name':'中文缩写',
				'readonly':'',
				'pattern':'^[\\u4e00-\\u9fa5]{1,8}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'reg_person':
			return {
				'key':'reg_person',
				'val':val,
				'name':'指定注册人',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'legal_person':
			return {
				'key':'legal_person',
				'val':val,
				'name':'法定代表人',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'province':
			return {
				'key':'province',
				'val':val,
				'name':'省份',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'山东,吉林,上海,广东,浙江,广西,北京,甘肃,湖南,陕西,重庆,河南,宁夏,湖北,辽宁,河北,江苏,海南,新疆,广州,四川,云南,安徽,江西,福建,天津,山西,内蒙古,青海,贵州,重庆,西藏,黑龙江,香港,澳门,台湾,国外,其他'
			};
			break;
		case 'town':
			return {
				'key':'town',
				'val':val,
				'name':'城镇',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'reg_company':
			return {
				'key':'reg_company',
				'val':val,
				'name':'开票公司',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'reg_addr':
			return {
				'key':'reg_addr',
				'val':val,
				'name':'开票地址',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'reg_tel':
			return {
				'key':'reg_tel',
				'val':val,
				'name':'开票电话',
				'readonly':'',
				'pattern':'^[\\-0-9]{1,20}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'bank_name':
			return {
				'key':'bank_name',
				'val':val,
				'name':'开户行',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'bank_account':
			return {
				'key':'bank_account',
				'val':val,
				'name':'银行账户',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'tax_id':
			return {
				'key':'tax_id',
				'val':val,
				'name':'税号',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'type':
			return {
				'key':'type',
				'val':val,
				'name':'类型',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'生产厂家,经销商,终端客户'
			};
			break;
		case 'level':
			return {
				'key':'level',
				'val':val,
				'name':'等级',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'A,B,C,D,E,F'
			};
			break;
		case 'manager':
			return {
				'key':'manager',
				'val':val,
				'name':'介绍人',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'datefrom':
			return {
				'key':'datefrom',
				'val':val,
				'name':'开始合作时间',
				'readonly':'',
				'pattern':'',
				'type':'datepicker',
				'arr':''
			};
			break;
		case 'website':
			return {
				'key':'website',
				'val':val,
				'name':'网站',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'email':
			return {
				'key':'email',
				'val':val,
				'name':'邮箱',
				'readonly':'',
				'pattern':'\\w[-\\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\\.)+[A-Za-z]{2,14}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'rem':
			return {
				'key':'rem',
				'val':val,
				'name':'附注',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'update_time':
			return {
				'key':'update_time',
				'val':val,
				'name':'更新时间',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'update_person':
			return {
				'key':'update_person',
				'val':val,
				'name':'更新人',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'total_sale':
			return {
				'key':'total_sale',
				'val':val,
				'name':'累计销售额',
				'readonly':'',
				'pattern':'^\\d{1,10}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'bussiness_addr':
			return {
				'key':'bussiness_addr',
				'val':val,
				'name':'营业地址',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'zip_code':
			return {
				'key':'zip_code',
				'val':val,
				'name':'邮政编码',
				'readonly':'',
				'pattern':'^\\d{6}$',
				'type':'text',
				'arr':''
			};
			break;
		default: 
			return {
				'name':'其它'
			};
			break;
	}
}