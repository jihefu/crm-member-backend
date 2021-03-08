var temp = 0;
$(document).ready(function(){
	$('.bar-bottom li').eq(0).addClass('high-light');
	createTable(_data);
	inputDel();
	sort();
	dealerTrans();
	selectList();
	listenChange();
});
$(document).on('mouseover','.item',function(){
	$(this).attr('data-value',$(this).html());
	$(this).html('移除');
});
$(document).on('mouseout','.item',function(){
	$(this).html($(this).attr('data-value'));
});
function listenChange(){
	$('.table-wrap tbody input').on('change',function(){
		$('.table-wrap tr').eq(0).attr('data-change',true);
	});
}
function pageAjax(page,type,cb){
	if(type=='default'){
		$.ajax({
			url:route('admin/vir8/getPage'),
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
			url:route('admin/vir8/sort'),
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
				str += '<li onclick="checkCpy(this);" data-sn="'+res.data[i].serialNo+'">'+
							'<p><span>序列号：</span>'+res.data[i].serialNo+'<span class="iconfont icon-correct"></span></p>'+
						'</li>'
			};
			$('.bar-bottom ul').html(str);
			if(temp==1) {
				$('.bar-bottom li').each(function(){
					var that = this;
					$('.sns .item').each(function(){
						if($(that).attr('data-sn')==$(this).attr('data-value')) $(that).find('.iconfont').show();
					});
				});
				return;
			}
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
	$('.page').attr('data-page',page);
	$('.page_num').html(page);
	pageAjax(page,type,function(res){
		$('.my-toast').remove();
		if(res.data[0]==null){
			toast('没有更多了');
			return;
		}
		var str = '';
		for (var i = 0; i < res.data.length; i++) {
			str += '<li onclick="checkCpy(this);" data-sn="'+res.data[i].serialNo+'">'+
						'<p><span>序列号：</span>'+res.data[i].serialNo+'<span class="iconfont icon-correct"></span></p>'+
					'</li>'
		};
		$('.bar-bottom ul').html(str);
		if(temp==1) {
			$('.bar-bottom li').each(function(){
				var that = this;
				$('.sns .item').each(function(){
					if($(that).attr('data-sn')==$(this).attr('data-value')) $(that).find('.iconfont').show();
				});
			});
			return;
		}
		$('.bar-bottom li').eq(0).addClass('high-light');
		$('.bar-bottom li').eq(0).trigger('click');
	});
}
var sort_key;
function sort(){
	$('.dropdown-menu li').click(function(){
		if(temp==1){
			toast('当前无法使用此功能');
			return;
		}
		sort_key = $(this).attr('data-key');
		var key = $(this).attr('data-key');
		var text = $(this).text();
		$('#dropdownMenu1').html(text+'<span class="caret"></span>');
		$('body').attr('data-type','sort');
		$.ajax({
			url:route('admin/vir8/sort'),
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
					str += '<li onclick="checkCpy(this);" data-sn="'+res.data[i].serialNo+'">'+
								'<p><span>序列号：</span>'+res.data[i].serialNo+'<span class="iconfont icon-correct"></span></p>'+
							'</li>'
				};
				$('.bar-bottom ul').html(str);
				$('.bar-bottom li').eq(0).addClass('high-light');
				$('.bar-bottom li').eq(0).trigger('click');
				$('.page_num').html(1);
				$('.page').attr('data-page',1);
			}
		});
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
function checkToTemp(obj){
	if($(obj).find('.iconfont').css('display')=='block') return false;
	var sn = $(obj).attr('data-sn');
	$(obj).find('.iconfont').show();
	$('.bar-bottom li').removeClass('high-light');
	$(obj).addClass('high-light');
	var str = '<p class="item" data-value="'+sn+'" onclick="removeItem(this)">'+sn+'</p>';
	$('.sns').append(str);
}
function removeItem(obj){
	$(obj).remove();
	$('.bar-bottom li').each(function(){
		if($(this).attr('data-sn')==$(obj).attr('data-value')) $(this).find('.iconfont ').hide();
	});
}
function checkCpy(obj){
	if(temp==1){
		checkToTemp(obj);
		return;
	}
	if($('.table-wrap tr').eq(0).attr('data-change')){
		var sn = $('input[data-key=serialNo]').val();
		update(sn);
		return;
	}
	var sn = $(obj).attr('data-sn');
	$('.bar-bottom li').removeClass('high-light');
	toast('正在搜索','info',1);
	$(obj).addClass('high-light');
	$.ajax({
		url:route('admin/vir8/info'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			sn: sn
		},
		success:function(res){
			$('.my-toast').remove();
			createTable(res.data.info);
			createImg(res.data.info);
			createHistory(res.data.reg);
			dealerTrans();
			selectList();
			listenChange();
		}
	});
}
function search(){
	var val = $('#search').val();
	$('body').attr('data-type','search');
	if(val!=''){
		if(!/^(\d+)$/.test(val)){
			$('.form input').val('');
			toast('请输入数字！');
			return;
		}
	}
	if(val.length>7){
		$('#search').val('');
		toast('请勿超过七位数！');
		return;
	}else if(val=='0'){
		$('#search').val('');
		toast('输入不合法！');
		return;
	}else if(val.length<4&&val!=''){
		$('#search').val('');
		toast('关键字过短！');
		return;
	}
	if(val=='') $('body').attr('data-type','default');
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/vir8/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			sn:val
		},
		success:function(res){
			$('.my-toast').remove();
			if(res.data[0]==null){
				toast('不存在该卡');
			}else{
				var str = '';
				for (var i = 0; i < res.data.length; i++) {
					str += '<li onclick="checkCpy(this);" data-sn="'+res.data[i].serialNo+'">'+
								'<p><span>序列号：</span>'+res.data[i].serialNo+'<span class="iconfont icon-correct"></span></p>'+
							'</li>'
				};
				$('.bar-bottom ul').html(str);
				$('.bar-bottom li').eq(0).addClass('high-light');
				$('.page_num').html(1);
				$('.page').attr('data-page',1);
				if(temp==1) {
					$('.bar-bottom li').each(function(){
						var that = this;
						$('.sns .item').each(function(){
							if($(that).attr('data-sn')==$(this).attr('data-value')) $(that).find('.iconfont').show();
						});
					});
					return;
				}
				$('.bar-bottom li').eq(0).trigger('click');
			}
		}
	});
}
function tempCancel(){
	$('.sns').html('');
	$('.bar-bottom li .iconfont').hide();
	$('.input-item input[type=text]').val('');
	$('.input-item input[type=checkbox]').removeAttr('checked');
}
function newCpy(){
	if(temp==1){
		toast('当前无法使用此功能');
		return;
	}
	var str = '<p>'+
				'<div class="input-group">'+
				  '<span class="input-group-addon" id="basic-addon1">序列号</span>'+
				  '<input type="text" class="form-control cpy" placeholder="请输入序列号" aria-describedby="basic-addon1">'+
				'</div>'+
			  '</p>';
	$('#myModalLabel').html('新建卡');
	$('#myModal .modal-body').html(str);
	$('#myModal .modal-footer button').eq(1).attr('onclick','sub()');
	$('#myModal').modal();
}
function sub(obj){
	var sn = $('.cpy').val();
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/vir8/add'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			sn:sn
		},
		success: function(res){
			$('.my-toast').remove();
			$('.modal-footer .btn-default').trigger('click');
			if(res.code==-1){
				toast(res.msg);
			}else if(res.code==200){
				toast(res.msg);
				var str = '';
				for (var i = 0; i < res.data.length; i++) {
					str += '<li onclick="checkCpy(this);" data-sn="'+res.data[i].serialNo+'">'+
								'<p><span>序列号：</span>'+res.data[i].serialNo+'<span class="iconfont icon-correct"></span></p>'+
							'</li>'
				};
				$('.bar-bottom ul').html(str);
				$('.bar-bottom li').eq(0).addClass('high-light');
				$('.bar-bottom li').eq(0).trigger('click');
				$('.contacts ul').html('<p class="reg-list">暂无注册记录</p>');
			}
		}
	});
}
function delCpyBtn(){
	for (var i = 0; i < $('.bar-bottom li').length; i++) {
		if($('.bar-bottom li').eq(i).hasClass('high-light')){
			var sn = $('.bar-bottom li').eq(i).attr('data-sn');
		}
	};
	$('#myModalLabel').html('警告框');
	$('.modal-body').html('确定删除<span style="font-size:16px;color:#f60">'+sn+'</span>？');
	$('.modal-footer button').eq(1).attr('onclick','delcpy('+sn+')');
	$('#myModal').modal();
}
function delcpy(sn){
	$('#myModal').trigger('click');
	toast('正在删除...','',1);
	$.ajax({
		url:route('admin/vir8/del'),
		type:'delete',
		dataType:'json',
		timeout:30000,
		data:{
			'sn':sn,
		},
		success:function(res){
			$('.my-toast').remove();
			for (var i = 0; i < $('.bar-bottom li').length; i++) {
				if($('.bar-bottom li').eq(i).attr('data-sn')==sn){
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
function dealerTrans(){
// 	var val_str = '';
	$('.table-wrap tbody input').each(function(){
		var dk = $(this).attr('data-key');
		if(dk=='dealer'||dk=='salesman'||dk=='maker'||dk=='tester'||dk=='EMP_NO'||dk=='update_person'||dk=='inputPerson'||dk=='endUser'){
			if(dk!='EMP_NO'&&dk!='update_person'&&dk!='inputPerson'){
				$(this).attr('onclick','searchInput(this)');
			}
		}
	});
// 	var _val = val_str.slice(0,val_str.length-1);
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
// 				$('.table-wrap tbody input').each(function(){
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
}
var t;
function searchInput(obj){
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
			url:route('admin/vir8/searchInput'),
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
					if(key=='dealer'||key=='endUser'){
						res.data.forEach(function(item){
							str +='<li data-id="'+item.user_id+'">'+item.cn_abb+'</li>';
						});
					}else{
						res.data.forEach(function(item){
							str +='<li data-id="'+item.user_id+'">'+item.user_name+'</li>';
						});
					}
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
						if(temp==0) $('.table-wrap tr').eq(0).attr('data-change',true);
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
function selectList(){
	$('.table-wrap input').click(function(){
		if($(this).attr('data-key')=='model'){
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
				if(temp==0) $('.table-wrap tr').eq(0).attr('data-change',true);
				setTimeout(function(){
					$('.selectList').remove();
				},200);
			});
		}
	});
}
function update(sn){
	if(checkPat()==0) return;
	var obj = $('.table-wrap tbody input[readonly!=readonly]');
	// var str = '';
	// for (var i = 0; i < obj.length; i++) {
	// 	var key = obj.eq(i).attr('data-key');
	// 	var val = obj.eq(i).val();
	// 	str += key+'='+transToSQL(key,val)+',';
	// };
	// str = str.slice(0,str.length-1);
	// console.log(str);
	var form_data = {};
	for (var i = 0; i < obj.length; i++) {
		var key = obj.eq(i).attr('data-key');
		var val = obj.eq(i).val();
		form_data[key] = transToSQL(key,val);
	};
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/vir8/update'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			"sn":sn,
			"form_data": JSON.stringify(form_data)
		},
		success:function(res){
			$('.table-wrap tbody tr').eq(0).removeAttr('data-change');
			var obj = $('.bar-bottom li');
			for (var i = 0; i < obj.length; i++) {
				if(obj.eq(i).attr('data-sn')==sn) {
					$('.my-toast').remove();
					obj.eq(i).trigger('click');
					setTimeout(function(){
						toast(res.msg);
					},300);
				}
			};
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
	if(key=='serialNo'||key=='machineNo'||key=='ad2Mode'||key=='SPWM_AC_AMP'||key=='SSI_MODE'||key=='HOURS'||key=='EMP_NO'||key=='VBGN'||key=='VEND'){
		if(v){
			var val = parseInt(v);
			return val;
		}else{
			return v;
		}
	}else{
		if((key=='dealer'||key=='salesman'||key=='tester'||key=='maker'||key=='endUser')&&v!=''){
			var len = $('.table-wrap td input').length;
			for (var i = 0; i < len; i++) {
				if($('.table-wrap input').eq(i).attr('data-key')==key){
					var val = $('.table-wrap td input').eq(i).attr('data-value');
					return val;
				}
			};
		}else{
			return v;
		}
	}
}
// function transToSQL(key,v){
// 	if(key=='serialNo'||key=='machineNo'||key=='ad2Mode'||key=='SPWM_AC_AMP'||key=='SSI_MODE'||key=='HOURS'||key=='EMP_NO'||key=='VBGN'||key=='VEND'){
// 		if(v){
// 			var val = parseInt(v);
// 			return val;
// 		}else{
// 			return '\"'+v+'\"';
// 		}
// 	}else{
// 		if((key=='dealer'||key=='salesman'||key=='tester'||key=='maker'||key=='endUser')&&v!=''){
// 			var len = $('.table-wrap td input').length;
// 			for (var i = 0; i < len; i++) {
// 				if($('.table-wrap input').eq(i).attr('data-key')==key){
// 					var val = $('.table-wrap td input').eq(i).attr('data-value');
// 					return '\"'+val+'\"';
// 				}
// 			};
// 		}else{
// 			return '\"'+v+'\"';
// 		}
// 	}
// }
function createTable(data){
	var arr = [],count=0;
	for (var i = 0; i < data.length; i++) {
		if(trans(data[i].key).name!='其它'){
			arr[count] = trans(data[i].key,data[i].val?data[i].val:'');
			count++;
		}
	};
	var str = '';
	for (var i = 0; i < arr.length; i=i+2) {
		try{
			str += '<tr>'+
					'<td>'+arr[i].name+'</td>'+
					'<td>'+
						'<input data-key="'+arr[i].key+'" type="text" '+arr[i].readonly+' data-arr="'+arr[i].arr+'" pattern="'+arr[i].pattern+'" value="'+arr[i].val+'">'+
					'</td>'+
					'<td>'+arr[i+1].name+'</td>'+
					'<td>'+
						'<input data-key="'+arr[i+1].key+'" type="text" '+arr[i+1].readonly+' data-arr="'+arr[i+1].arr+'" pattern="'+arr[i+1].pattern+'" value="'+arr[i+1].val+'">'+
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
					'<button class="alert alert-danger" onclick="delCpyBtn();">删除此卡</button>'+
				'</td>'+
			'</tr>';
	$(".table-wrap tbody").html(str);
}
function createImg(data){
	data.forEach(function(items,index){
		if(items.key=='model'){
			if(items.val=="V802"){
				$('#myCarousel img').attr("src","../img/1802.jpg");
			}else if(items.val=="V801"){
				$('#myCarousel img').attr("src","../img/1801.jpg");
			}else if(items.val=="V800"){
				$('#myCarousel img').attr("src","../img/1800.jpg");
			}else if(items.val=="V881"){
				$('#myCarousel img').attr("src","../img/1881.jpg");
			}else if(items.val=="V884"){
				$('#myCarousel img').attr("src","../img/1884.jpg");
			}else{
				$('#myCarousel img').attr("src","../img/800.jpg");
			}	
		}
	});
}
function createHistory(data){
	var str = '';
	if(data[0]==null){
		str += '<p class="reg-list">暂无注册记录</p>';
	}else{
		for (var i = 0; i < data.length; i++) {
			if(data[i].validDate==0){
				var _str = '已永久注册。';
			}else{
				var _str = '有效期至'+data[i].validDate+'。';
			}
			str += '<li>'+
						'<span>'+data[i].regDate+':</span></br>'+
						'<span>'+data[i].name+'（'+data[i].company +'）注册产品'+data[i].product +'，</span>'+
						'<span>'+_str+'</span>'+
						'<span>注册码：'+data[i].regCode+' ，授权操作码：'+data[i].authOperKey +'</span>'+
					'</li>';
		};
	}
	$('.contacts ul').html(str);
}
function inputInfo(){
	temp = 1;
	$('.up-dialog,.my-mask').show();
	$('.my-mask').click(function(){
		$('.up-dialog,.my-mask').hide();
		temp = 0;
	});
}
function subTemp(){
	if($('.sns').html()==''){
		toast('序列号为空');
		return;
	}
	var str_sn = '';
	$('.sns .item').each(function(){
		str_sn += parseInt($(this).attr('data-value'))+',';
	});
	str_sn = str_sn.slice(0,str_sn.length-1);
	var ele = $('.input-item label input[type=checkbox]:checked');
	var str_id = '';
	for (var i = 0; i < ele.length; i++) {
		var t = ele.parent().parent().find('input[type=text]').eq(i);
		var key = t.attr('data-key');
		var val = t.attr('data-value');
		if(val==undefined){
			toast('勾选框内容为空');
			return;
		}
		str_id += key+'='+val+',';
	};
	if(str_id==''){
		toast('请勾选');
		return;
	}
	$.ajax({
		url:route('admin/vir8/putInfo'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			str_id: str_id,
			str_sn: str_sn
		},
		success:function(res){
			toast('提交成功');
			tempCancel();
			$('.my-mask').trigger('click');
		}
	});
}
function trans(key,val){
	switch(key){
		case 'serialNo':
			return {
				'key':'serialNo',
				'val':val,
				'val':val,
				'name':'序列号',
				'readonly':'readonly',
				'pattern':'^\\d{1,7}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'model':
			return {
				'key':'model',
				'val':val,
				'name':'型号',
				'readonly':'',
				'pattern':'',
				'type':'select',
				'arr':'V802,V801,V800,AD800,V881,V884'
			};
			break;
		case 'fwVer':
			return {
				'key':'fwVer',
				'val':val,
				'name':'固件版本',
				'readonly':'readonly',
				'pattern':'^\\d{1,7}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'regVer':
			return {
				'key':'regVer',
				'val':val,
				'name':'注册版本',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'latestRegNo':
			return {
				'key':'latestRegNo',
				'val':val,
				'name':'最近注册码',
				'readonly':'',
				'pattern':'^\\d{1,15}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'validTime':
			return {
				'key':'validTime',
				'val':val,
				'name':'有效期',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'regAuth':
			return {
				'key':'regAuth',
				'val':val,
				'name':'授权操作码',
				'readonly':'',
				'pattern':'^\\d{1,15}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'dealer':
			return {
				'key':'dealer',
				'val':val,
				'name':'中间商',
				'readonly':'',
				'pattern':'',
				'type':'list',
				'arr':''
			};
			break;
		case 'salesman':
			return {
				'key':'salesman',
				'val':val,
				'name':'业务经理',
				'readonly':'',
				'pattern':'',
				'type':'list',
				'arr':''
			};
			break;
		case 'endUser':
			return {
				'key':'endUser',
				'val':val,
				'name':'终端用户',
				'readonly':'',
				'pattern':'',
				'type':'list',
				'arr':''
			};
			break;
		case 'oemUser':
			return {
				'key':'oemUser',
				'val':val,
				'name':'指定配套用户',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'authType':
			return {
				'key':'authType',
				'val':val,
				'name':'授权类型',
				'readonly':'',
				'pattern':'^\\d{1,7}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'VBGN':
			return {
				'key':'VBGN',
				'val':val,
				'name':'名义起始期',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'VEND':
			return {
				'key':'VEND',
				'val':val,
				'name':'名义有效期',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'machineNo':
			return {
				'key':'machineNo',
				'val':val,
				'name':'机器码',
				'readonly':'',
				'pattern':'^\\d{1,15}$',
				'type':'text',
				'arr':''
			};
			break;
		case 'maker':
			return {
				'key':'maker',
				'val':val,
				'name':'生产者',
				'readonly':'',
				'pattern':'',
				'type':'list',
				'arr':''
			};
			break;
		case 'tester':
			return {
				'key':'tester',
				'val':val,
				'name':'测试者',
				'readonly':'',
				'pattern':'',
				'type':'list',
				'arr':''
			};
			break;
		case 'chnlNum':
			return {
				'key':'chnlNum',
				'val':val,
				'name':'通道数',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'caliCoeff':
			return {
				'key':'caliCoeff',
				'val':val,
				'name':'标定系数',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'ad2Mode':
			return {
				'key':'ad2Mode',
				'val':val,
				'name':'AD采集模式',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'pulseMode':
			return {
				'key':'pulseMode',
				'val':val,
				'name':'PM脉冲模式',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'vibFreq':
			return {
				'key':'vibFreq',
				'val':val,
				'name':'DA伺服颤振频率',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'vibAmp':
			return {
				'key':'vibAmp',
				'val':val,
				'name':'DA伺服颤振幅值',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'SPWM_AC_AMP':
			return {
				'key':'SPWM_AC_AMP',
				'val':val,
				'name':'SPWM交流幅值',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'SSI_MODE':
			return {
				'key':'SSI_MODE',
				'val':val,
				'name':'SSI模式',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'HOURS':
			return {
				'key':'HOURS',
				'val':val,
				'name':'已用小时数',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'EMP_NO':
			return {
				'key':'EMP_NO',
				'val':val,
				'name':'最近操作者',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'inputDate':
			return {
				'key':'inputDate',
				'val':val,
				'name':'录入时间',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'inputPerson':
			return {
				'key':'inputPerson',
				'val':val,
				'name':'录入者',
				'readonly':'readonly',
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
				'name':'更新者',
				'readonly':'readonly',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'remark':
			return {
				'key':'remark',
				'val':val,
				'name':'附注',
				'readonly':'',
				'pattern':'',
				'type':'text',
				'arr':''
			};
			break;
		case 'dealer_endUser':
			return {
				'key':'dealer_endUser',
				'val':val,
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
				'val':val,
				'name':'中间商备注',
				'readonly':'readonly',
				'pattern':'',
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