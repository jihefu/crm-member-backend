var change = 0;
var keywords = '',page = 1,num = 30,order = 'id',filter = {};
$(document).ready(function(){
	$('.bar-bottom li').eq(0).trigger('click');
	$('.dropdown-menu li').click(function(){
		order = $(this).attr('data-key');
	});
	inputDel();
});
$(document).on('change','tbody input[type=text]',function(){
	change = 1;
});

/**
 * 	搜索框显示×
 */
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


/**
 * 	获取列表
 */
function getList(){
	$.ajax({
		url:route('admin/contract/getListPc'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			page: page,
			num: num,
			keywords: keywords,
			order: order
		},
		success:function(res){
			renderList(res);
		}
	});
}

/**
 * 	渲染列表
 */
function renderList(res){
	if(res.data[0]==null){
		page--;
		toast('没有更多了');
	}else{
		var str = '';
		res.data.forEach(function(items,index){
			try{
				str += '<li onclick="checkCpy(this);" data-no="'+res.data[index].contract_no+'">'+
						'<p>'+
							'<span>'+res.data[index].contract_no+'</span>'+
							'<span>'+res.data[index].body[0].goods_name+'×'+res.data[index].body[0].goods_num+'</span>'+
						'</p>'+
					'</li>';
			}catch(e){
				str += '<li onclick="checkCpy(this);" data-no="'+res.data[index].contract_no+'">'+
						'<p>'+
							'<span>'+res.data[index].contract_no+'</span>'+
						'</p>'+
					'</li>';
			}
		});
		$('.bar-bottom ul').html(str);
		$('.page_num').html(page);
		$('.bar-bottom li').eq(0).trigger('click');
	}
}

/**
 * 	上一页
 */
function prev(){
	if(page==1){
		toast('已是第一页');
	}else{
		page--;
		if(filter['s']==undefined){
			getList();
		}else{
			subFilter();
		}
	}
}

/**
 * 	下一页
 */
function next(){
	page++;
	if(filter['s']==undefined){
		getList();
	}else{
		subFilter();
	}
}

/**
 * 	搜索
 */
function search(){
	page = 1;
	keywords = $('#search').val();
	filter = {};
	getList();
}

/**
 * 	列表点击
 */
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
			createTable(res.data.comment,function(data){
				$('.my-toast').remove();
				var payable = $('input[data-key=payable]').val();
				var paid = $('input[data-key=paid]').val();
				if(paid<payable){
					$('input[data-key=paid]').css('color','#f00');
				}
			});
		}
	});
}

/**
 * 	初始化表格
 */
function createTable(data,cb){

	//获取相应货品列表
	function getGoodsList(data){
		var contract_no;
		data.forEach(function(items,index){
			if(items.column_name == 'contract_no') contract_no = items.val;
		});
		$.ajax({
			url:route('admin/contract/no_body'),
			type:'get',
			dataType:'json',
			timeout:30000,
			data:{
				"contract_no": contract_no
			},
			success:function(res){
				res = res.data;
				var str = '';
				for (var i = 0; i < res.length; i++) {
					str += '<li>';
						for(var key in res[i]){
							if(key=='id'||key=='contract_no') continue;
							str += '<div class="goods">'+
										'<span>'+trans(key)+'</span>：'+
										'<span>'+res[i][key]+'</span>'+
									'</div>';
						}
					str += '</li>';
				}
				$('.contacts ul').html(str);
			}
		});

		function trans(key){
			if(key=='goods_name'){
				return '名称';
			}else if(key=='goods_spec'){
				return '规格型号';
			}else if(key=='goods_num'){
				return '数量';
			}else if(key=='goods_price'){
				return '单价';
			}else if(key=='rem'){
				return '备注';
			}
		}
	}

	//初始化数据
	function transData(){
		var total_amount,payable,i;
		for (var i = 0; i < data.length; i++) {
			if(data[i].column_name=='id'||data[i].column_name=='isdel'||data[i].column_name=='album'){
				data.splice(i,1);
				i--;
			}
		};
		data.forEach(function(items,index){
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
			if(items.column_name=='update_time') data[index].val = time(data[index].val);
			if(items.val=='null'||items.val==null) data[index].val = '';

			if(items.column_name=='total_amount') 
				total_amount = items.val;
			if(items.column_name=='payable') {
				payable = items.val;
				i = index;
			}
		});

		var favo = total_amount - payable;
		var obj = {
			column_name: 'favo',
			column_comment: '优惠金额',
			val: favo
		};
		data.splice(i,0,obj);
	}

	//表格模板
	function templateTable(){
		var str = '';
		for (var i = 0; i < data.length; i=i+2) {
			try{
				str += '<tr>'+
						'<td>'+data[i].column_comment+'</td>'+
						'<td>'+
							'<input class="t" name="'+data[i].column_name+'" type="text" value="'+data[i].val+'">'+
						'</td>'+
						'<td>'+data[i+1].column_comment+'</td>'+
						'<td>'+
							'<input class="t" name="'+data[i+1].column_name+'" type="text" value="'+data[i+1].val+'">'+
						'</td>'+
					'</tr>';
			}catch(e){
				str += '<tr>'+
						'<td>'+data[i].column_comment+'</td>'+
						'<td>'+
							'<input class="t" name="'+data[i].column_name+'" type="text" value="'+data[i].val+'">'+
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
	}

	//控件初始化
	function controls(){
		var select_arr = [
			{
				name: 'contract_state',
				data: ['草签','有效','关闭']
			},
			{
				name: 'install',
				data: ['是','否']
			},
			{
				name: 'delivery_state',
				data: ['生产中','待发货','已发货','已收货','安装中','已验收']
			},
			{	
				name: 'isFreeze',
				data: ['是','否']
			}
		];
		var disabled_arr = ['cus_abb','favo','contract_no','complete','insert_person','update_person','insert_time','update_time','freeze_start_time'];
		var date_arr = ['sign_time','delivery_time','take_time','freeze_time','close_time'];
		var num_arr = ['total_amount','payable','paid'];
		var search_arr = [
			{
				name: 'sale_person',
				url: 'admin/contract/salesMan'
			}
		];

		select_arr.forEach(function(items,index){
			$('input[name="'+items.name+'"]').kendoDropDownList({
	            autoBind: true,
	            dataSource: {
	                data: items.data
	            }
	        });
		});

		disabled_arr.forEach(function(items,index){
			$('input[name="'+items+'"]').attr('readonly','readonly');
		});

		date_arr.forEach(function(items,index){
			$('input[name="'+items+'"]').kendoDatePicker({
				format: "yyyy-MM-dd",
            	parseFormats: ["yyyy-MM-dd"]
			});
		});

		num_arr.forEach(function(items,index){
			$('input[name="'+items+'"]').kendoNumericTextBox();
		});

		search_arr.forEach(function(items,index){
			var it = items;
			$('input[name="'+it.name+'"]').attr('data-init-value',$('input[name="'+it.name+'"]').val());
			$('input[name="'+it.name+'"]').kendoAutoComplete({
	            dataSource: {
	                serverFiltering: true,
	                transport: {
	                    read: {
	                        url: route(it.url)
	                    }
	                }
	            },
	            clearButton: false,
	            select: function(t){
	                var select_val = t.dataItem;
	                $('input[name="'+it.name+'"]').attr('data-select-value',select_val);
	                $('input[name="'+it.name+'"]').attr('data-init-value',select_val);
	            },
	            close: function(){
	            	var end_val = $('input[name="'+it.name+'"]').val();
	            	var init_val = $('input[name="'+it.name+'"]').attr('data-init-value');
	            	var select_val = $('input[name="'+it.name+'"]').attr('data-select-value');
	            	if(select_val){
	            		if(select_val!=end_val){
	            			$('input[name="'+it.name+'"]').val(init_val);
	            		}
	            	}else{
	            		$('input[name="'+it.name+'"]').val(init_val);
	            	}
	            }
	        });
		});
	}

	//初始化图片
	function album(){
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

	getGoodsList(data);
	album();
	transData();
	templateTable();
	controls();
	cb();
}

/**
 * 	提交
 */
function sub(){
	
	//序列化数据
	function getFormData(){
		var form_data = {};
		$('tbody .t').each(function(){
			form_data[$(this).attr('name')] = $(this).val();
		});
		for(var key in form_data){
			if(key=="undefined"||key=="favo") delete form_data[key];
			if(key=='install'||key=='isFreeze'){
				if(form_data[key]=='是'){
					form_data[key] = 1;
				}else{
					form_data[key] = 0;
				}
			}
			if(key=='complete'){
				if(form_data[key]=='已完成'){
					form_data[key] = 1;
				}else{
					form_data[key] = 0;
				}
			}
			if(key=='sign_time'||key=='freeze_time'||key=='close_time'||key=='take_time'||key=='delivery_time'||key=='freeze_start_time'){
				if(form_data[key]=='') form_data[key] = null;
			}
		}
		return form_data;
	}

	var no = getFormData().contract_no;
	var form_data_obj = getFormData();
	if(form_data_obj.contract_state=='关闭'){
		var close_reason = form_data_obj.close_reason;
		var close_time = form_data_obj.close_time;
		if(close_reason==''||close_time==''||close_time=='null'||close_time==null){
			toast('关闭原因或关闭时间不能为空！');
			return;
		}
	}else if(form_data_obj.isFreeze==1){
		var freeze_start_time = form_data_obj.freeze_start_time;
		var freeze_time = form_data_obj.freeze_time;
		var freeze_reason = form_data_obj.freeze_reason;
		if(freeze_start_time==null){
			form_data_obj.freeze_start_time = dateTime();
		}
		if(freeze_time==null||freeze_reason==''){
			toast('冻结原因或冻结截至时间不能为空！');
			return;
		}
	}
	var form_data = JSON.stringify(form_data_obj);
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/contract/update'),
		type:'put',
		dataType:'json',
		timeout:30000,
		data: {
			form_data: form_data
		},
		success: function(res){
			$('.my-toast').remove();
			change = 0;
			$('.bar-bottom li[data-no='+no+']').trigger('click');
			$('.bar-bottom li[data-no='+no+']').trigger('click');
		}
	});
}

/**
 * 	筛选
 */
function filterMod(){
	$('#myModal').modal();
	page = 1;
}

/**
 * 	提交筛选
 */
function subFilter(){
	var type = $('input[name=s]:checked').val();
	var company = $('input[name=f_company]').val();
	filter = {
		s: type,
		company: company
	};
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/contract/filter'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			keywords: JSON.stringify(filter),
			page: page
		},
		success:function(res){
			$('.my-toast').remove();
			$('.modal').trigger('click');
			if(res.data[0]==null){
				page--;
				toast('没有更多了');
			}else{
				var str = '';
				res.data.forEach(function(items,index){
					str += '<li onclick="checkCpy(this);" data-no="'+res.data[index][0].contract_no+'">'+
							'<p>'+
								'<span>'+res.data[index][0].contract_no+'</span>'+
							'</p>'+
						'</li>';
				});
				$('.bar-bottom ul').html(str);
				$('.page_num').html(page);
				$('.bar-bottom li').eq(0).trigger('click');
			}
		}
	});
}

/**
 * 	删除合同
 */
function delContract(){
	var no = $('input[name=contract_no]').val();
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