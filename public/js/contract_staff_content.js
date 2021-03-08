$(document).ready(function(){
	setTimeout(function(){
		$('#loading').remove();
		var height = window.innerHeight;
		var width = window.innerWidth;
		img_height = width/2.68;
		img_height = img_height > 320 ? 320 : img_height;
		var btnHeight = height > 900 ? 160 : 80;
		$('.img,.img img').height(img_height);
		var stepHeight = $('.steps').height();
		table_height = height-img_height-btnHeight-stepHeight;
		
		initImg();
		initTable();
	}, 300);
});
function initTable(){
	$("#grid").kendoGrid({
        height: table_height,
		columns:[
			{
			  field: "name",
			  title: "合同项目"
			},
			{
			  field: "val",
			  title: "合同参数"
			}
		],
		dataSource: {
			data: data.label
		}
    });
    $('.k-grid-content').css('height',table_height);
    $('thead').hide();
	$('.k-grid-header').remove();
	btnShow(data.data.delivery_state);

	function btnShow(status) {
		var allowDeliveryStr = '<button onclick="turnToAllowDelivery()" style="display:none;margin-left: 6px;">允许发货</button>';
		var deliveryInfoStr = '<button onclick="deliveryInfo()" style="display:none;margin-left: 6px;">发货信息</button>';
		var takeStr = '<button onclick="take()" class="takeGoods" style="display:none;margin-left: 6px;">确认收货</button>';
		if (status === '审核中') {
			if (allowDelivery == 1) {
				$('.btn-groups').append(allowDeliveryStr);
			}
		} else if (status === '待发货') {
			$('.btn-groups').append(deliveryInfoStr);
		} else if (status === '已发货') {
			$('.btn-groups').append(deliveryInfoStr);
			$('.btn-groups').append(takeStr);
		} else {
			$('.btn-groups').append(deliveryInfoStr);
		}
		$('button').show();
		$('button').kendoButton();
	}
}

function turnToAllowDelivery() {
	var no = data.data.contract_no;
	wxLoadToast('正在提交');
	$.ajax({
		url:route('contract_ajax/turnToAllowDelivery/' + no),
		type:'put',
		dataType:'json',
		success:function(res){
			$('#loadingToast').remove();
			reload(res.msg);
		}
	});
}

function deliveryInfo() {
	window.location.href = route('contract/packingPage/' + data.data.id);
}

function take(){
	$('.weui-mask,.weui-dialog').show();
}
function cancel(){
	$('.weui-mask,.weui-dialog').hide();
}
function comfirm(){
	var no = data.data.contract_no;
	wxLoadToast('正在提交');
	$.ajax({
		url:route('contract_ajax/takeGoods'),
		type:'get',
		dataType:'json',
		data:{
			no: no
		},
		success:function(res){
			reload(res.msg);
		}
	});
}
function more(){
	var no = data.data.contract_no;
	window.location.href = route('contract/body/'+no);
}

function initImg(){
	var val = data.data.album;
	if(val!=''&&val!=null){
		var img_arr = val.split(',');
		var str = '';
		img_arr.forEach(function(items,index){
			str += '<div class="aui-slide-node" onclick="contractSlider()">'+
						'<img src="../img'+items+'" height="'+img_height+'px" />'+
					'</div>';
		});
		$('.aui-slide-wrap').html(str);
		new auiSlide({
			"container":document.getElementById("aui-slide"),
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
	var no = data.data.contract_no;
	window.location.href = route('contract/slider/'+no);
}