var change = 0;
var keywords = '',page = 1,num = 30,order = 'id',filter = {};
$(document).ready(function(){
	$('.bar-bottom li').eq(0).trigger('click');
});
$(document).on('change','tbody input[type=text]',function(){
	change = 1;
});


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
			createTable(res.data.result,function(data){
				$('.my-toast').remove();
			});
		}
	});
}

/**
 * 	初始化表格
 */
function createTable(data,cb){

	//初始化数据
	function transData(){
		for (var i = 0; i < data.length; i++) {
			if(data[i].column_name=='related_contract_owncost'||data[i].column_name=='id'||data[i].column_name=='related_contract_salary'||data[i].column_name=='album'||data[i].column_name=='sql_stamp'||data[i].column_name=='isdel'){
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
			}else if(items.column_name=='guarantee_repair'){
				if(items.val==1){
					data[index].val = '是';
				}else{
					data[index].val = '否';
				}
			}
		});
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
				name: 'guarantee_repair',
				data: ['是','否']
			}
		];
		var disabled_arr = ['take_person','repair_contractno','update_person','complete','update_time','deliver_state','take_time'];
		var date_arr = ['receive_time','deliver_time'];
		var num_arr = ['number'];
		var search_arr = [
			{
				name: 'cust_name',
				url: 'admin/contract/cus'
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
			if(key=="undefined") delete form_data[key];
			if(key=='guarantee_repair'){
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
			if(key=='receive_time'||key=='deliver_time'){
				if(form_data[key]=='') form_data[key] = null;
			}
		}
		return form_data;
	}
	var no = getFormData().repair_contractno;
	var form_data = JSON.stringify(getFormData());
	console.log(form_data);
}