$(document).ready(function(){
	$('.bar-bottom li').eq(0).trigger('click');
	// createTable(_data);
	inputDel();
	sort();
	// transPerson();
	// selectList();
	// listenChange();
	// transDate();
});
$(document).on('mouseover','.item',function(){
	$(this).attr('data-value',$(this).html());
	$(this).html('移除');
});
$(document).on('mouseout','.item',function(){
	$(this).html($(this).attr('data-value'));
});
function pageAjax(page,type,cb){
	if(type=='default'){
		$.ajax({
			url:route('admin/member/getPage'),
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
			url:route('admin/member/sort'),
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
			str += '<li onclick="checkCpy(this);" data-name="'+res.data[i].name+'" data-phone="'+res.data[i].phone+'">'+ 
						'<p>'+res.data[i].name+'</p>'+
					'</li>';
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
			str += '<li onclick="checkCpy(this);" data-name="'+res.data[i].name+'" data-phone="'+res.data[i].phone+'">'+ 
						'<p>'+res.data[i].name+'</p>'+
					'</li>';
		};
		$('.bar-bottom ul').html(str);
		$('.bar-bottom li').eq(0).addClass('high-light');
		$('.bar-bottom li').eq(0).trigger('click');
	});
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
			url:route('admin/member/sort'),
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
					str += '<li onclick="checkCpy(this);" data-name="'+res.data[i].name+'" data-phone="'+res.data[i].phone+'">'+ 
								'<p>'+res.data[i].name+'</p>'+
							'</li>';
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
function search(){
	var val = $('#search').val();
	if(val==''){
		$('body').attr('data-type','default');
	}else{
		$('body').attr('data-type','search');
	}
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/member/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			val:val
		},
		success:function(res){
			$('.my-toast').remove();
			if(res.data[0]==null){
				toast('不存在该会员');
				$('body').attr('data-type','default');
			}else{
				var str = '';
				for (var i = 0; i < res.data.length; i++) {
					str += '<li onclick="checkCpy(this);" data-name="'+res.data[i].name+'" data-phone="'+res.data[i].phone+'">'+ 
								'<p>'+res.data[i].name+'</p>'+
							'</li>';
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
function checkCpy(obj){
	var evaluate = $('.table-wrap tbody').attr('data-evaluate');
	var v = parseFloat($('#slider').val()/10);
	if(evaluate&&evaluate!=v) $('.table-wrap tbody').attr('data-change',1);
	if($('.table-wrap tbody').attr('data-change')){
		sub();
		return;
	}
	var name = $(obj).attr('data-name');
	var phone = $(obj).attr('data-phone');
	$('.bar-bottom li').removeClass('high-light');
	$(obj).addClass('high-light');
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/member/info'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			name: name,
			phone: phone
		},
		success:function(res){
			$('.my-toast').remove();
			createInfo(res.data);
		}
	});
}
function createInfo(data){
	var result = data[0].result;
	var member_score = data[0].score;
	if(member_score<400){
		var member_type = '白银会员';
	}else if(member_score>=400&&member_score<1000){
		var member_type = '黄金会员';
	}else if(member_score>=1000&&member_score<2000){
		var member_type = '铂金会员';
	}else{
		var member_type = '钻石会员';
	}
	$('.member_type').html(member_type);
	$('.member_score').html(member_score);
	if(result.portrait){
		$('.carousel-inner .pic').html('<img src="../img/member/'+result.portrait+'" />');
	}else{
		$('.carousel-inner .pic').html('<img src="../img/default_member2.jpg" />');
	}
	createTable(data);
}
function createTable(data){
	var item_arr = data[0].item_arr;
	var check_arr = data[0].check_arr;
	var name_arr = data[0].name_arr;
	$('.table-wrap tbody').attr('data-phone',data[0].result.phone);
	$('.table-wrap tbody').attr('data-evaluate',data[0].evaluate);
	var str = '';
	for (var i = 0; i < item_arr.length; i=i+2) {
		try{
			if(check_arr[i].val==1){
				var check_1 = '<input type="checkbox" data-key="'+item_arr[i].key+'" checked>';
			}else{
				var check_1 = '<input type="checkbox" data-key="'+item_arr[i].key+'">';
			}
			if(check_arr[i+1].val){
				var check_2 = '<input type="checkbox" data-key="'+item_arr[i+1].key+'" checked>';
			}else{
				var check_2 = '<input type="checkbox" data-key="'+item_arr[i+1].key+'">';
			}
			str += '<tr>'+
					'<td>'+
						'<label>'+check_1+name_arr[i]+'</label>'+
					'</td>'+
						'<td>'+item_arr[i].val+'</td>'+
					'<td>'+
						'<label>'+check_2+name_arr[i+1]+'</label>'+
					'</td>'+
						'<td>'+item_arr[i+1].val+'</td>'+
				'</tr>';
		}catch(e){
			if(check_arr[i].val){
				var check_1 = '<input type="checkbox" data-key="'+item_arr[i].key+'" checked>';
			}else{
				var check_1 = '<input type="checkbox" data-key="'+item_arr[i].key+'">';
			}
			str += '<tr>'+
					'<td>'+
					    '<label>'+check_1+name_arr[i]+'</label>'+
					'</td>'+
					'<td>'+item_arr[i].val+'</td>'+
				'</tr>';
		}
	};
	if(data[0].result.check_portrait){
		var check_1 = '<input type="checkbox" data-key="portrait" checked>';
	}else{
		var check_1 = '<input type="checkbox" data-key="portrait">';
	}
	$('.table-wrap tbody').html(str);
	if($('.table-bordered td').length%4==0){
		var str = '<tr>'+
				'<td>'+
				    '<label>'+check_1+'头像</label>'+
				'</td>'+
				'<td>头像</td>'+
			'</tr>';
		$('.table-wrap tbody').append(str);
	}else{
		var str = '<td>'+
				    '<label>'+check_1+'头像</label>'+
				'</td>'+
				'<td>头像</td>';
		$('.table-wrap tbody tr').last().append(str);
	}
	$('input[data-key=name]').attr('disabled','disabled');
	$('input[data-key=phone]').attr('disabled','disabled');
	$('input[type=checkbox]').on('change',function(){
		$('.table-wrap tbody').attr('data-change',1);
	});
	$('.k-slider-wrap,.k-slider').remove();
	if($('#slider').length==0) $('.table-wrap h4').after('<input id="slider" class="balSlider" value="" />');
	$("#slider").attr('value',data[0].evaluate*10);
	$("#slider").kendoSlider({
        increaseButtonTitle: "Right",
        decreaseButtonTitle: "Left",
        min: 0,
        max: 10,
        smallStep: 1,
        largeStep: 1
    }).data("kendoSlider");
}
function sub(){
	var evaluate = parseFloat($('#slider').val()/10);
	var name = $('input[data-key=name]').parent().parent().next().html();
	var phone = $('input[data-key=phone]').parent().parent().next().html();
	var job = $('input[data-key=job]').parent().parent().next().html();
	var company = $('input[data-key=company]').parent().parent().next().html();
	var arr = [],arr2 = [];
	var check = $('input[type=checkbox]:checked');
    for (var i = 0; i < check.length; i++) {
        var _name = check.eq(i).attr('data-key');
        arr.push(_name);
    };
    var notCheck = $('input[type=checkbox]').not(':checked');
    for (var i = 0; i < notCheck.length; i++) {
        var _name = notCheck.eq(i).attr('data-key');
        arr2.push(_name);
    };
    arr = JSON.stringify(arr);
    arr2 = JSON.stringify(arr2);
    toast('正在提交','',1);
    $.ajax({
        url: route('admin/member/sub_check'),
        type: 'post',
        dataType: 'json',
        timeout: 30000,
        data: {
            name: name,
            phone: phone,
            job: job,
            company: company,
            evaluate: evaluate,
            arr: arr,
            arr2: arr2
        },
        success:function(res){
            $('.my-toast').remove();
            $('.table-wrap tbody').removeAttr('data-change');
            $('.table-wrap tbody').attr('data-evaluate',parseFloat($('#slider').val()/10));
            if(res.code==-100){
                toast(res.msg);
            }else{
                toast('提交成功');
            }
            var len = $('.bar-bottom li').length;
            for (var i = 0; i < len; i++) {
            	var ele = $('.bar-bottom li').eq(i);
            	if(ele.attr('data-phone')==phone) ele.trigger('click');
            };
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
var temp = 0;
function message(){
	temp = 1;
	$('.up-dialog,.my-mask').show();
	$('.my-mask').click(function(){
		$('.up-dialog,.my-mask').hide();
		temp = 0;
	});
}
function getItems(){
	var key = $('.k_w').val();
	if(key==''){
		toast('输入不能为空');
		return;
	}
	$.ajax({
		url:route('admin/member/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			val:key
		},
		success:function(res){
			if(res.data[0]==null){
				toast('不存在该会员');
				return;
			}
			var str = '';
			var len = $('._select_left .sns li').length;
			if(len==0){
				for (var i = 0; i < res.data.length; i++) {
					str += '<li onclick="checkItem(this)" data-name="'+res.data[i].name+'" data-phone="'+res.data[i].phone+'">'+
								'<span class="iconfont icon-correct"></span>'+
								'<span>'+res.data[i].name+'</span>'+
							'</li>';
				}
			}else{
				for (var i = 0; i < res.data.length; i++) {
					for (var j = 0; j < len; j++) {
						var ele = $('._select_left .sns li').eq(j);
						if(ele.attr('data-phone')==res.data[i].phone){
							break;
						}else if(j==len-1){
							str += '<li onclick="checkItem(this)" data-name="'+res.data[i].name+'" data-phone="'+res.data[i].phone+'">'+
										'<span class="iconfont icon-correct"></span>'+
										'<span>'+res.data[i].name+'</span>'+
									'</li>';
						}
					};
				};
			}
			$('._select_left .sns').append(str);
		}
	});
}
function selectRadio(obj){
	if($(obj).val()!='self'){
		$('.my-dialog .input-group').css('min-height',0);
		$('.t').hide();
	}else{
		$('.my-dialog .input-group').css('min-height',310+'px');
		$('.t').show();
	}
}
function checkItem(obj){
	if($(obj).find('.iconfont').css('display')=='none'){
		$(obj).find('.iconfont').show();
		var name = $(obj).attr('data-name');
		var phone = $(obj).attr('data-phone');
		$('._select_right').append('<p class="item" data-name="'+name+'" data-phone="'+phone+'" onclick="removeItem(this)">'+name+'</p>');
	}
}
function removeItem(obj){
	$('._select_left .sns li').each(function(){
		if($(this).attr('data-phone')==$(obj).attr('data-phone')) $(this).find('.iconfont').hide();
	});
	$(obj).remove();
}
function clearAll(){
	$('._select_left .sns,._select_right').html('');
	$('.k_w').val('');
}
function comfirm(){
	var v = $('.radio input[type=radio]:checked').val();
	if(v=='self'){
		if($('._select_right').html()==''){
			toast('请指定会员');
			return;
		}else{
			var user = [];
			$('._select_right p').each(function(){
				var obj = {};
				obj.name = $(this).attr('data-name');
				obj.phone = $(this).attr('data-phone');
				user.push(obj);
			});
			user = JSON.stringify(user);
		}
	}else{
		var user = v;
	}
	sessionStorage.setItem("user_key",user);
	$('.page1').hide();
	$('.page2').show();
	$('.my-dialog .modal-footer button').eq(1).html('提交');
	$('.my-dialog .modal-footer button').eq(1).attr('onclick','subTemp()');
	$('.my-dialog .modal-footer button').eq(0).hide();
}
function listenTemp(obj){
	if($(obj).val()=='singleMsg'){
		$('._link').hide();
	}else if($(obj).val()=='linkMsg'){
		$('._link').show();
	}
}
function subTemp(){
	var user = sessionStorage.getItem("user_key");
	try{
		var len = JSON.parse(user);
	}catch(e){
		var len = 1;
	}
	if((!user)||len==0){
		toast('未选择指定人');
		return;
	}
	var template = $('input[name=radio2]:checked').val();
	var title = $('#form_tit').val();
	var url = $('#form_link').val()?$('#form_link').val():'';
	var val = $('.g textarea').val();
	val = val.replace(/\n/g,'<br/>');
	val = val.replace(/\s/g,'&nbsp;');
	var sender = $('body').attr('data-sender');
	if(title==''){
		toast('标题不能为空');
		$('#form_tit').focus();
		return;
	}else if(val==''){
		toast('内容不能为空');
		return;
	}
	var params_arr = [
		{
			table: 'vip_message',
			user: user,
			model: template,
			title: title,
			url: url,
			message: val,
			sender: sender
		}
	];
	params_arr = JSON.stringify(params_arr);
	toast('正在发送','',1);
	$.ajax({
		url:route('message/msg_to_consumer'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			params: params_arr
		},
		success:function(res){
			$('.my-toast').remove();	
			if(res&&res.code==200){
				toast('发送成功');
				sessionStorage.removeItem("user_key");
				$('.my-mask,.my-dialog').hide();
				$('.page2').hide();
				$('.page1').show();
				$('.my-dialog .modal-footer button').eq(1).html('确定');
				$('.my-dialog .modal-footer button').eq(1).attr('onclick','comfirm()');
				$('.my-dialog .modal-footer button').eq(0).show();
				clearAll();
				$('input[name=radio2]').attr('checked','checked');
				$('#form_tit,#form_link,textarea').val('');
			}else if(res&&res.code==-100){
				toast(res.msg);
				setTimeout(function(){
					window.location.reload();
				},2000);
			}
		}
	});
}