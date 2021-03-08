var ctrlPage,change = 0;
$(document).ready(function(){
	$('.bar-bottom li').eq(0).trigger('click');
	ctrlPage = new Page({
		page: 1,
		url: 'admin/contract/page_default'
	});
	inputDel();
	sort();
	// dealerTrans();
	// selectList();
	// listenChange();
});
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
function initData(data){
	var key = data.column_name;
	var obj = {
		readonly:'',
		pattern: '',
		arr: '',
		type: ''
	}
	if(key=='contract_no'||key=='cus_abb'||key=='favo'||key=='complete'||key=='insert_person'||key=='insert_time'||key=='update_time'||key=='update_person'){
		obj.readonly = 'readonly';
		return obj;
	}else if(key=='total_amount'||key=='payable'||key=='paid'){
		obj.pattern = '^\\d{1,10}$';
		return obj;
	}else if(key=='install'){
		obj.arr = '是,否';
		return obj;
	}else if(key=='delivery_state'){
		obj.arr = '生产中,待发货,已发货,已收货,安装中,已验收';
		return obj;
	}else if(key=='contract_state'){
		obj.arr = '草签,有效,关闭';
		return obj;
	}else if(key=='isFreeze'){
		obj.arr = '是,否';
		return obj;
	}else if(key=='sign_time'||key=='take_time'||key=='delivery_time'||key=='freeze_time'||key=='close_time'){
		obj.type = 'date';
		return obj;
	}else{
		return obj;
	}
}
function selectList(){
	$('.table-wrap input').click(function(){
		var v = $(this).val();
		var key = $(this).parent().prev().html();
		if($(this).attr('data-arr')==''){
			return false;
		}else{
			var data_arr = $(this).attr('data-arr');
			var arr = data_arr.split(',');
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
				// dataChange();
				change = 1;
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
function createTable(data,cb){
	album(data);
	data = transData(data);
	var str = '';
	for (var i = 0; i < data.length; i=i+2) {
		try{
			str += '<tr>'+
					'<td>'+data[i].column_comment+'</td>'+
					'<td>'+
						'<input data-key="'+data[i].column_name+'" '+initData(data[i]).readonly+' pattern="'+initData(data[i]).pattern+'" data-arr="'+initData(data[i]).arr+'" data-type="'+initData(data[i]).type+'" type="text" value="'+data[i].val+'">'+
					'</td>'+
					'<td>'+data[i+1].column_comment+'</td>'+
					'<td>'+
						'<input data-key="'+data[i+1].column_name+'" '+initData(data[i+1]).readonly+' pattern="'+initData(data[i+1]).pattern+'" data-arr="'+initData(data[i+1]).arr+'" data-type="'+initData(data[i+1]).type+'" type="text" value="'+data[i+1].val+'">'+
					'</td>'+
				'</tr>';
		}catch(e){
			str += '<tr>'+
					'<td>'+data[i].column_comment+'</td>'+
					'<td>'+
						'<input data-key="'+data[i].column_name+'" '+initData(data[i]).readonly+' pattern="'+initData(data[i]).pattern+'" data-arr="'+initData(data[i]).arr+'" data-type="'+initData(data[i]).type+'" type="text" value="'+data[i].val+'">'+
					'</td>'+
				'</tr>';
		}
	};
	str += '<tr>'+
				'<td colspan="4" class="td_btn">'+
					'<button class="alert alert-danger" onclick="delContract();">删除合同</button>'+
				'</td>'+
			'</tr>';
	$(".table-wrap tbody").html(str);
	$("input[data-type=date]").kendoDatePicker();
	var val = $("input[data-type=date]").val();
	$("input[data-type=date]").keyup(function(){
		$(this).val(val);
	});
	$(".table-wrap tbody input[data-key=sale_person]").attr('onclick','searchInput(this)');
	transId();
	selectList();
	$(".table-wrap tbody input").on('change',function(){
		change = 1;
	});
	var no = $('input[data-key=contract_no]').val();
	$.ajax({
		url:route('admin/contract/goodsList'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"no":no
		},
		success:function(res){
			cb(res.data);
		}
	});
	highLight();
}
function album(data){
	data.forEach(function(items,index){
		if(items.column_name=='album'){
			if(items.val==null){
				var arr = [''];
			}else{
				var arr = items.val.split(',');
			}
			var interText = doT.template($("#album").text());
			$("#myCarousel").html(interText(arr));
			$('.carousel').carousel();
		}
	});
	imgLazyLoad();
}
function imgLazyLoad(){
	var t;
	$(".lazy").lazyload({
		placeholder: '../img/loading.gif'
	});
	var len = $(".lazy").length;
	var count = 1;
	t = setInterval(function(){
		if(count<len*5||count==len*5){
			$(".lazy").lazyload({
				placeholder: '../img/loading.gif'
			});
			count++;
		}else{
			clearInterval(t);
		}
	},1000);
}
function transId(){
	var arr = [];
	arr[0] = $('input[data-key=sale_person]').val();
	arr[1] = $('input[data-key=insert_person]').val();
	arr[2] = $('input[data-key=update_person]').val();
	$('input[data-key=sale_person]').attr('data-value',arr[0]);
	arr = JSON.stringify(arr);
	$.ajax({
		url:route('admin/contract/transId'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"arr":arr
		},
		success:function(res){
			if(res.code==200){
				$('input[data-key=sale_person]').val(res.data[0]);
				$('input[data-key=insert_person]').val(res.data[1]);
				$('input[data-key=update_person]').val(res.data[2]);
			}
		}
	});
}
function createGoodsList(res){
	var str = '';
	for (var i = 0; i < res.length; i++) {
		str += '<li>';
			for(var j = 0; j < res[i].length; j++){
				str += '<div class="goods">'+
							'<span>'+res[i][j].key+'</span>：'+
							'<span>'+res[i][j].val+'</span>'+
						'</div>';
			}
		str += '</li>';
	}
	$('.contacts ul').html(str);
}
function transData(data){
	var total_amount,payable,i;
	for (var i = 0; i < data.length; i++) {
		if(data[i].column_name=='id'||data[i].column_name=='isdel'||data[i].column_name=='album'){
			data.splice(i,1);
			i--;
		}
	};
	data.forEach(function(items,index){
		// if(items.column_name=='id'||items.column_name=='isdel'){
		// 	data.splice(index,1);
		// }
		if(items.column_name=='total_amount') 
			total_amount = items.val;
		if(items.column_name=='payable') {
			payable = items.val;
			i = index;
		}
		if(items.column_name=='complete') {
			if(items.val==1){
				data[index].val = '已完成';
			}else{
				data[index].val = '未完成';
			}
		}
		if(items.column_name=='install'||items.column_name=='isFreeze') {
			if(items.val==1){
				data[index].val = '是';
			}else{
				data[index].val = '否';
			}
		}
		if(items.val=='null'||items.val==null) data[index].val = '';
	});
	var favo = total_amount - payable;
	var obj = {
		column_name: 'favo',
		column_comment: '优惠金额',
		val: favo
	};
	data.splice(i,0,obj);
	return data;
}
function checkCpy(obj){
	if(change){
		sub();
		return;
	}
	var no = $(obj).attr('data-no');
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/contract/no'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"no":no
		},
		success:function(res){
			$('.bar-bottom ul li').removeClass('high-light');
			$(obj).addClass('high-light');
			createTable(res.data,function(data){
				$('.my-toast').remove();
				createGoodsList(data);
			});
		}
	});
}
function search(){
	var keywords = $('#search').val();
	keywords = keywords.toUpperCase();
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/contract/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"keywords":keywords
		},
		success:function(res){
			$('.my-toast').remove();
			if(res.code==-1||res.code==-2||res.code==-3){
				toast(res.msg);
				return;
			}
			if(res.data[0]==null){
				toast(res.msg);
				return;
			}
			function SearchPage(){}
			SearchPage.prototype = new Page({
				page: 1,
				url: 'admin/contract/search',
				keywords: keywords
			});
			ctrlPage = new SearchPage();
			ctrlPage.setList(res,function(){
				$('.page_num').html(ctrlPage.page);
				$('.bar-bottom ul li').eq(0).trigger('click');
			});
		}
	});
}
function sort(){
	$('.dropdown-menu li').click(function(){
		var key = $(this).attr('data-key');
		var text = $(this).text();
		$('#dropdownMenu1').html(text+'<span class="caret"></span>');
		toast('正在搜索...','info',1);
		$.ajax({
			url:route('admin/contract/sort'),
			type:'get',
			dataType:'json',
			timeout:30000,
			data: {
				keywords: key
			},
			success:function(res){
				$('.my-toast').remove();
				if(res.data[0]==null){
					toast(res.msg);
					return;
				}
				function SortPage(){}
				SortPage.prototype = new Page({
					page: 1,
					url: 'admin/contract/sort',
					keywords: key
				});
				ctrlPage = new SortPage();
				ctrlPage.setList(res,function(){
					$('.page_num').html(ctrlPage.page);
					$('.bar-bottom ul li').eq(0).trigger('click');
				});
			}
		});
	});
}

function prev(){
	ctrlPage.prev({},function(res){
		ctrlPage.setList(res,function(){
			$('.page_num').html(ctrlPage.page);
			$('.bar-bottom ul li').eq(0).trigger('click');
		});
	});
}

function next(){
	ctrlPage.next({},function(res){
		ctrlPage.setList(res,function(){
			$('.page_num').html(ctrlPage.page);
			$('.bar-bottom ul li').eq(0).trigger('click');
		});
	});
}

function delContract(){
	var no = $('input[data-key=contract_no]').val();
	$.ajax({
		url:route('admin/contract/del'),
		type:'delete',
		dataType:'json',
		timeout:30000,
		data: {
			no: no
		},
		success: function(res){
			window.location.reload();
		}
	});
}
function sub(){
	var $input = $('.table-wrap input[readonly!=readonly]');
	var str = '';
	for (var i = 0; i < $input.length; i++) {
		var pat = $input.eq(i).attr('pattern');
		var k = $input.eq(i).attr('data-key');
		var v = $input.eq(i).val();
		if(pat!=''){
			var pattern = new RegExp(pat);
			if(!pattern.test(v)){
				toast('输入不合法');
				$input.eq(i).focus();
				return;
			}
		}
		str += k+'='+transSub(k,v)+',';
	};
	var no = $('input[data-key=contract_no]').val();
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/contract/update'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			no: no,
			str: str
		},
		success: function(res){
			$('.my-toast').remove();
			change = 0;
			$('.bar-bottom li[data-no='+no+']').trigger('click');
		}
	});
}
function transSub(k,v){
	if(k=='sale_person'){
		var val = $('input[data-key=sale_person]').attr('data-value');
		return '\"'+val+'\"';
	}else if(k=='sign_time'||k=='take_time'||k=='delivery_time'||k=='freeze_time'||k=='close_time'){
		if(v==''){
			return null;
		}else{
			return '\"'+dateTime(v)+'\"';
		}
	}else if(k=='install'||k=='isFreeze'){
		if(v=='是'){
			return 1;
		}else{
			return 0;
		}
	}else if(k=='total_amount'||k=='payable'||k=='paid'){
		if(v==''){
			return 0;
		}else{
			return '\"'+v+'\"';
		}
	}else{
		return '\"'+v+'\"';
	}
}
var t;
function searchInput(obj){
	$('.selectList').html('');
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
		ajax_input(val,obj);
	});
	ajax_input(val,obj);
}
function ajax_input(val,obj){
	clearTimeout(t);
	t = setTimeout(function(){
		$.ajax({
			url:route('admin/contract/searchInput'),
			type:'get',
			dataType:'json',
			timeout:30000,
			data:{
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
						change = 1;
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

function filter(){
	$('#myModal').modal();
}
function subFilter(){
	var s = $('input[name=s]:checked').val();
	var company = $('input[name=f_company]').val();
	var keywords = {
		s: s,
		company: company
	};
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/contract/filter'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			keywords: JSON.stringify(keywords)
		},
		success:function(res){
			$('.my-toast').remove();
			$('.modal').trigger('click');
			if(res.code==-1){
				toast(res.msg);
				return;
			}
			function SortPage(){}
			SortPage.prototype = new Page({
				page: 1,
				url: 'admin/contract/filter',
				keywords: JSON.stringify(keywords)
			});
			ctrlPage = new SortPage();
			ctrlPage.setList(res,function(){
				$('.page_num').html(ctrlPage.page);
				$('.bar-bottom ul li').eq(0).trigger('click');
			});
		}
	});
}

function highLight(){
	var payable = $('input[data-key=payable]').val();
	var paid = $('input[data-key=paid]').val();
	if(paid<payable){
		$('input[data-key=paid]').css('color','#f00');
	}
}