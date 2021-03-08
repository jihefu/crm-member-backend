$(document).ready(function(){
	setTimeout(function(){
		$('#loading').remove();
		var height = window.innerHeight;
		var width = window.innerWidth;
		img_height = width/2.68;
		img_height = img_height > 320 ? 320 : img_height;
		btnHeight = height > 900 ? 160 : 80;
		$('.img,.img img').height(img_height);
		table_height = height-img_height-btnHeight;
		initImg(data);
		switch(status){
			case '送修检验中':
				initData({
					'hide': ['express','deliver_time','take_person','take_time','related_contract','pri_check_person',
							'again_conclusion','again_check_person','own_cost','outer_cost','conclusion','treatement']
				});
				break;
			case '维修中': 
				initData({
					'hide': ['express','deliver_time','take_person','take_time','related_contract','pri_check_person',
							'again_conclusion','again_check_person','own_cost','outer_cost']
				});
				break;
			case '维修测试中': 
				initData({
					'hide': ['express','deliver_time','take_person','take_time','pri_check_person',
							'again_conclusion','again_check_person','own_cost','outer_cost']
				});
				break;
			case '待发件': 
				initData({
					'hide': ['express','deliver_time','take_person','take_time','pri_check_person',
							'again_conclusion','again_check_person','own_cost','outer_cost']
				});
				break;
			case '已发件':
				initData({
					'hide': ['take_person','take_time','pri_check_person',
							'again_conclusion','again_check_person','own_cost','outer_cost']
				});
				$('button').show();
				if (showExpressBtn == 1) {
					$('.queryExpress').show();
				} else {
					$('.queryExpress').hide();
				}
			case '已收件':
				initData({
					'hide': ['pri_check_person','again_conclusion','again_check_person','own_cost','outer_cost']
				});
				// $('button').html('已确认收货').attr('disabled','disabled').removeClass('k-primary').show();
				break;
			// case '待检定':
			// 	initData({
			// 		'hide': ['conclusion','treatement','express','deliver_time','take_person','take_time']
			// 	});
			// 	break;
			// case '维修中':
			// 	initData({
			// 		'hide': ['express','deliver_time','take_person','take_time']
			// 	});
			// 	break;
			// case '已发件':
			// 	initData({
			// 		'hide': []
			// 	});
			// 	$('button').show();
			// 	break;
			// case '已收件':
			// 	initData({
			// 		'hide': []
			// 	});
			// 	$('button').html('已确认收货').attr('disabled','disabled').removeClass('k-primary').show();
			// 	break;
		}
		initTable();
	}, 300);
});
function initTable(){
	$("#grid").kendoGrid({
		height: table_height,
		columns:[
			{
			  field: "column_comment",
			  title: "合同项目"
			},
			{
			  field: "val",
			  title: "合同参数"
			}
		],
		dataSource: {
			data: data
		}
    });
    $('.k-grid-content').css('height',table_height);
    $('thead').hide();
    $('button').kendoButton();
    $('.k-grid-header').remove();
}
function initData(obj){
	var hide_arr = ['id','related_contract_salary','related_contract_owncost','own_cost','outer_cost','isdel','sql_stamp','complete','update_person','update_time','album','contact','contact_type','insert_person','insert_time'];
	hide_arr = hide_arr.concat(obj.hide);
	data.forEach((items,index) => {
		console.log(items.column_name);
	});
	for (var i = 0; i < data.length; i++) {
		var key = data[i].column_name;
		data[i].readonly = 0;
		data[i].update = 0;
		for(var j = 0; j < hide_arr.length; j++ ){
			if(key==hide_arr[j]){
				data.splice(i,1);
				i--;
				break;
			}
		}
		if((key=='receive_time'||key=='deliver_time'||key=='update_time'||key=='take_time')&&(data[i].val==0||data[i].val==null)){
			data[i].val = '';
		}
	}
}
function comfirm(){
	$('.weui-mask,.weui-dialog').show();
}
function cancel(){
	$('.weui-mask,.weui-dialog').hide();
}
function take(){
	var url = window.location.href.split('?')[0];
	var no = url.split('info/')[1];
	wxLoadToast('正在提交');
	$.post(route('repair_ajax/takeGoods'),{
		no: no
	},function(res){
		$('#loadingToast').remove();
		reload(res.msg);
	},'json');
}
function initImg(data){
	var val;
	data.forEach(function(items,index){
		if(items.column_name=='album'){
			val = items.val;
		}
	});
	if(val!=''&&val!=null){
		var img_arr = val.split(',');
		var str = '';
		img_arr.forEach(function(items,index){
			str += '<div class="aui-slide-node" onclick="contractSlider()">'+
						'<img src="../img'+items+'" height="'+img_height+'px" />'+
					'</div>';
		});
		$('.aui-slide-wrap').html(str);
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
		$('.aui-slide-node').css({
			"background": "url('../../../img/card_bg.jpg')",
			"background-repeat": "round"
		});
	}
}
function contractSlider(){
	var no;
	data.forEach(function(items,index){
		if(items.column_name=='repair_contractno') no = items.val;
	});
	window.location.href = route('repair/slider/'+no);
}