var ctrlPage,change = 0,Data;
function PageChild(opt){}
PageChild.prototype = new Page({
	page: 1,
	url: 'admin/repair/page_default'
});
PageChild.prototype.setList = function(res,cb){
	if(res.data[0]==null){
		toast('没有更多了');
		return;
	}
	var str = '';
	for (var i = 0; i < res.data.length; i++) {
		str += '<li onclick="checkCpy(this);" data-no="'+res.data[i].repair_contractno+'">'+
					'<p>'+
						'<span>'+res.data[i].repair_contractno+'</span>'+
						'<span>'+res.data[i].cust_name+'</span>'+
					'</p>'+
				'</li>';
	};
	$('.bar-bottom ul').html(str);
	cb();
}
$(document).ready(function(){
	$('.bar-bottom li').eq(0).trigger('click');
	ctrlPage = new PageChild();
	inputDel();
	sort();
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
function checkCpy(obj){
	if(change){
		sub();
		return;
	}
	var no = $(obj).attr('data-no');
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/repair/no'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"no":no
		},
		success:function(res){
			$('.bar-bottom ul li').removeClass('high-light');
			$(obj).addClass('high-light');
			$('.my-toast').remove();
			createTable(res.data);
		}
	});
}
function createTable(data,cb){
	initImg(data);
	initHistory(data);
	var status = data.status;
	Data = data.result;
	switch(status){
		case '待检定':
			initData({
				'hide': ['express','deliver_time','take_person','take_time']
			});
			break;
		case '维修中':
			initData({
				'hide': ['take_person','take_time']
			});
			break;
		case '已发件':
			initData({
				'hide': []
			});
			break;
		case '已收件':
			initData({
				'hide': []
			});
			break;
	}
	var str = '';
	for (let i = 0; i < Data.length; i++) {
		if(Data[i].column_name=='insert_time'||Data[i].column_name=='insert_person'){
			Data.splice(i,1);
			i--;
		}
	}
	for (var i = 0; i < Data.length; i=i+2) {
		try{
			str += '<tr>'+
					'<td>'+Data[i].mark+Data[i].column_comment+'</td>'+
					'<td>'+
						'<input name="'+Data[i].column_name+'" type="text" value="'+Data[i].val+'">'+
					'</td>'+
					'<td>'+Data[i+1].mark+Data[i+1].column_comment+'</td>'+
					'<td>'+
						'<input name="'+Data[i+1].column_name+'" type="text" value="'+Data[i+1].val+'">'+
					'</td>'+
				'</tr>';
		}catch(e){
			str += '<tr>'+
					'<td>'+Data[i].column_comment+'</td>'+
					'<td>'+
						'<input name="'+Data[i].column_name+'" type="text" value="'+Data[i].val+'">'+
					'</td>'+
				'</tr>';
		}
	};
	str += '<tr>'+
				'<td colspan="4" class="td_btn">'+
					'<button class="alert alert-danger" onclick="delContract();">删除维修单</button>'+
				'</td>'+
			'</tr>';
	$(".table-wrap tbody").html(str);
	$("input[name=receive_time],input[name=deliver_time],input[name=take_time]").attr('data-type','date').kendoDatePicker();
	var val = $("input[data-type=date]").val();
	$("input[data-type=date]").keyup(function(){
		$(this).val(val);
	});
	$("input[name=guarantee_repair]").attr('data-arr','是,否');
	// $("input[name=deliver_state]").attr('data-arr','待检定,维修中,已发件,已收件');
	$(".table-wrap tbody input").on('change',function(){
		change = 1;
	});
	var readonly_arr = ['repair_contractno','complete','update_person','update_time','deliver_state'];
	readonly_arr.forEach(function(items,index){
		$('input[name='+items+']').attr('readonly','readonly');
	});
	$('input[name=deliver_state]').width('65px');
	if($('input[name=deliver_state]').val()!='已收件'){
		var status_arr = ['待检定','维修中','已发件','已收件'];
		var index = status_arr.indexOf(status);
		$('input[name=deliver_state]').after('<button type="button" onclick="nextStatus()">切换至'+status_arr[index+1]+'</button>');
	}
	selectList();
	$('input[name=cust_name]').attr('onclick','searchInput(this)');
}
function initData(obj){
	var hide_arr = ['id','related_contract_salary','related_contract_owncost','isdel','sql_stamp','album'];
	hide_arr = hide_arr.concat(obj.hide);
	for (var i = 0; i < Data.length; i++) {
		var key = Data[i].column_name;
		Data[i].readonly = '';
		Data[i].update = 0;
		Data[i].mark = '';
		for(let j = 0; j < hide_arr.length; j++ ){
			if(key==hide_arr[j]){
				Data.splice(i,1);
				i--;
			}
		}
		if(key=='complete'){
			if(Data[i].val){
				Data[i].val = '是';
			}else{
				Data[i].val = '否';
			}
		}else if((key=='contact'||key=='contact_type'||key=='receive_time'||key=='deliver_time'||key=='update_time'||key=='take_time'||key=='update_person')&&(Data[i].val==0||Data[i].val==null||Data[i].val=='null')){
			Data[i].val = '';
		}
		// if(key=='deliver_state'){
		// 	Data.forEach(function(items,index){
		// 		if(index<i){
		// 			try{
		// 				Data[index].mark = '<span> * </span>';
		// 			}catch(e){

		// 			}
		// 		}
		// 	});
		// }
	}
}
function selectList(){
	$('.table-wrap input').click(function(){
		var v = $(this).val();
		if(!$(this).attr('data-arr')){
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
function search(){
	var keywords = $('#search').val();
	keywords = keywords.toUpperCase();
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/repair/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"keywords":keywords
		},
		success:function(res){
			$('.my-toast').remove();
			if(res.code==-100){
				toast(res.msg);
				return;
			}
			if(res.data[0]==null){
				toast(res.msg);
				return;
			}
			ctrlPage.page = 1;
			ctrlPage.url = 'admin/repair/search';
			ctrlPage.keywords = keywords;
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
			url:route('admin/repair/sort'),
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
				ctrlPage.page = 1;
				ctrlPage.url = 'admin/repair/sort';
				ctrlPage.keywords = key;
				ctrlPage.setList(res,function(){
					$('.page_num').html(ctrlPage.page);
					$('.bar-bottom ul li').eq(0).trigger('click');
				});
			}
		});
	});
}
function insert(){
	$('#myModalLabel').html('提醒');
	$('.modal-body').html('<span style="font-size:16px;color:#f60">确定新增数据？</span>（新增成功后请及时更新维修状态）');
	// $('.modal-body').html('确定删除<span style="font-size:16px;color:#f60">123</span>？');
	$('.modal-footer button').eq(1).attr('onclick','insertData()');
	$('#myModal').modal();
}
function insertData(){
	toast('正在同步...','info',1);
	$.ajax({
		url:route('admin/repair/insertData'),
		type:'get',
		dataType:'json',
		timeout:30000,
		success:function(res){
			$('.my-toast').remove();
			$('#myModal').trigger('click');
			toast(res.msg);
			if(res.code==200){
				setTimeout(function(){
					window.location.reload();
				},2000);
			}
		}
	});
}
function update(){
	$('#myModalLabel').html('提醒');
	$('.modal-body').html('<span style="font-size:16px;color:#f60">确定更新所有维修信息？</span>（更新后可能会造成部分数据被覆盖，请谨慎！）');
	$('.modal-footer button').eq(1).attr('onclick','updateData()');
	$('#myModal').modal();
}
function updateData(){
	toast('正在同步...','info',1);
	$.ajax({
		url:route('admin/repair/updateData'),
		type:'get',
		dataType:'json',
		timeout:30000,
		success:function(res){
			$('.my-toast').remove();
			$('#myModal').trigger('click');
			toast(res.msg);
			setTimeout(function(){
				window.location.reload();
			},2000);
		}
	});
}
function updateIt(){
	var no = $('input[name=repair_contractno]').val();
	$('#myModalLabel').html('提醒');
	$('.modal-body').html('确定更新<span style="font-size:16px;color:#f60">'+no+'</span>该维修单信息？（更新后可能会造成部分数据被覆盖，请谨慎！）');
	$('.modal-footer button').eq(1).attr('onclick','updateOneData()');
	$('#myModal').modal();
}
function updateOneData(){
	toast('正在同步...','info',1);
	var no = $('input[name=repair_contractno]').val();
	$.ajax({
		url:route('admin/repair/updateOneData'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			no: no
		},
		success:function(res){
			$('.my-toast').remove();
			$('#myModal').trigger('click');
			toast(res.msg);
			$('.bar-bottom li[data-no='+no+']').trigger('click');
		}
	});
}
function delContract(){
	var no = $('input[name=repair_contractno]').val();
	$('#myModalLabel').html('提醒');
	$('.modal-body').html('确定删除<span style="font-size:16px;color:#f60">'+no+'</span>该维修单？（恢复数据请联系开发人员）');
	$('.modal-footer button').eq(1).attr('onclick','del()');
	$('#myModal').modal();
}
function del(){
	toast('正在删除...','info',1);
	var no = $('input[name=repair_contractno]').val();
	$.ajax({
		url:route('admin/repair/del'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			no: no
		},
		success:function(res){
			$('.my-toast').remove();
			$('#myModal').trigger('click');
			toast(res.msg);
			setTimeout(function(){
				window.location.reload();
			},2000);
		}
	});
}
function nextStatus(){
	var arr = ['待检定','维修中','已发件','已收件'];
	var no = $('input[name=repair_contractno]').val();
	status = arr[arr.indexOf($('input[name=deliver_state]').val())+1];
	if(checkStatus(status)==0){
		return;
	}
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/repair/nextStatus'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			no: no,
			status: status
		},
		success:function(res){
			$('.my-toast').remove();
			$('input[name=deliver_state]').val(status);
			$('.bar-bottom li[data-no='+no+']').trigger('click');
		}
	});
}
function checkStatus(status){
	switch(status){
		case '已发件':
			var express = $('input[name=express]').val();
			var deliver_time = $('input[name=deliver_time]').val();
			if(express&&deliver_time){
				return 1;
			}else{
				toast('请输入快递单号和发件时间');
				return 0;
			}
			break;
		case '已收件':
			var take_person = $('input[name=take_person]').val();
			var take_time = $('input[name=take_time]').val();
			if(take_person&&take_time){
				return 1;
			}else{
				toast('请输入收件确认人和发件确认时间');
				return 0;
			}
			break;
		default:
			return 1;
			break;
	}
}
function sub(){
	if($('input[name=cust_name]').val()==''){
		toast('请输入维修单位');
		$('input[name=cust_name]').focus();
		return;
	}
	var str = '';
	$('.table-wrap input').each(function(){
		var key = $(this).attr('name');
		var val = $(this).val();
		val = checkCode(val);
		if(key=='receive_time'||key=='deliver_time'){
			if(val!=''||val!=0){
				val = parseInt(new String(Date.parse(val)).slice(0,10));
			}else{
				val = 0;
			}
		}
		if(key!='complete'&&key!='update_time'&&key!='update_person'){
			if(key=='take_time'&&val!=''){
				val = dateTime(val);
				str += key+'="'+val+'",';
			}else if(key!='take_time'){
				str += key+'="'+val+'",';
			}
		}
	});
	var no = $('input[name=repair_contractno]').val();
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/repair/sub'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			no: no,
			str: str
		},
		success:function(res){
			$('.my-toast').remove();
			setTimeout(function(){
				toast(res.msg);
			},300);
			change = 0;
			$('.bar-bottom li[data-no='+no+']').trigger('click');
		}
	});
}
function initImg(data){
	data.result.forEach(function(items,index){
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

function newCpy(){
	var str = '<p>'+
				'<div class="input-group">'+
				  '<span class="input-group-addon" id="basic-addon1">维修单号</span>'+
				  '<input type="text" class="form-control repair_no" placeholder="请输入维修单号" aria-describedby="basic-addon1">'+
				'</div>'+
			  '</p>';
	$('#myModalLabel').html('新建维修单');
	$('#myModal .modal-body').html(str);
	$('#myModal .modal-footer button').eq(1).attr('onclick','add()');
	$('#myModal').modal();
}
function add(){
	var no = $('.repair_no').val();
	no = checkCode(no);
	no = no.toUpperCase();
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/repair/add'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			no: no
		},
		success:function(res){
			$('.my-toast').remove();
			toast(res.msg);
			$('#myModal').trigger('click');
			if(res.code==200){
				$('.dropdown-menu li[data-key=all]').trigger('click');
			}
		}
	});
}


var t;
function searchInput(obj){
	$('.selectList').html('');
	var key = 'cust_name';
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
			url:route('admin/repair/searchInput'),
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
						str +='<li>'+item+'</li>';
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
						change = 1;
						var val = $(this).html();
						$(obj).val(val);
						setTimeout(function(){
							$('.selectList').remove();
						},200);
					});
				}else{
					$('.selectList').html('不存在');
				}
			}
		});
	},300);
}
function initHistory(data){
	data = data.result;
	for (var i = 0; i < data.length; i++) {
		if(data[i].column_name=='serial_no'){
			var val = data[i].val;
		}
	};
	if(val==''){
		showHistory([]);
	}else{
		$.ajax({
			url:route('admin/repair/searchHistory'),
			type:'get',
			dataType:'json',
			timeout:30000,
			data:{
				"val":val
			},
			success:function(res){
				showHistory(res.data);
			}
		});
	}
}
function showHistory(val){
	var str = '';
	if(val[0]==null){
		str += '<li>'+
					'<p>暂无维修历史</p>'+
				'</li>';
	}else{
		for (var i = 0; i < val.length; i++) {
			if(val[i].repair_contractno!=$('input[name=repair_contractno]').val()){
				str += '<li style="padding-bottom:1px;">'+
							'<p style="margin-bottom:1px;font-size: 16px;color: #000;">维修单号：<p style="text-indent: 32px;">'+val[i].repair_contractno+'</p></p>'+
							'<p style="margin-bottom:1px;font-size: 16px;color: #000;">问题：<p style="text-indent: 32px;">'+val[i].problems+'</p></p>'+
							'<p style="margin-bottom:1px;font-size: 16px;color: #000;">测试结论：<p style="text-indent: 32px;">'+val[i].conclusion+'</p></p>'+
							'<p style="margin-bottom:1px;font-size: 16px;color: #000;">处理方法：<p style="text-indent: 32px;">'+val[i].treatement+'</p></p>'+
						'</li>';
			}
		};
		if(str==''){
			str += '<li>'+
					'<p>暂无维修历史</p>'+
				'</li>';
		}
	}
	$('.right-bar ul').html(str);
}