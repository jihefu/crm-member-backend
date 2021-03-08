$(document).ready(function(){
	// setTimeout(function(){
		$('#loading').remove();
		var height = window.innerHeight;
		var width = window.innerWidth;
		img_height = width/2.68;
		img_height = img_height > 320 ? 320 : img_height;
		btnHeight = height > 900 ? 160 : 80;
		$('.img,.img img').height(img_height);
		table_height = height-img_height-btnHeight;

		initImg(data);
		initStep();
	// }, 300);
});
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
	var no;
	data.forEach(function(items,index){
		if(items.column_name=='repair_contractno') no = items.val;
	});
	window.location.href = route('repair/slider/'+no);
}

function initStep() {
	$('.stage0').html(getHours(info.receive_time, info.stage0));
    $('.stage1').html(getHours(info.receive_time, info.stage1));
    $('.stage2').html(getHours(info.receive_time, info.stage2));
    $('.stage3').html(getHours(info.receive_time, info.stage3));
    $('.stage4').html(getHours(info.receive_time, info.stage4));
	$('.stage5').html(getHours(info.receive_time, info.stage5));

	var stateArr = ['送修检验中', '维修中', '维修检验中', '待发件', '已发件', '已收件'];
	var i = stateArr.indexOf(info.deliver_state);
	var index = 7 - i - 3;
	if (index < 0) {
		$('.layui-timeline-item').show();
	} else {
		$('.layui-timeline-item:gt('+index+')').show();
	}

	// if (info.express) {
        // $('.express').append('<a onclick="queryExpress();" style="margin-left: 1rem;" href="javascript:void(0);">查询</a>');
	// }
	if (isStaff == '0' && info.express && info.deliver_state == '已发件') {
		$('.express').append('<a style="font-size: 0.9rem; margin-left: 1rem;" onclick="confirmTakeGoods();" href="javascript:void(0);">确认收件</a>');
        // $('.stage4').parent().append('<div><a style="font-size: 0.9rem;" onclick="confirmTakeGoods();" href="javascript:void(0);">确认收件</a></div>');
    }
	
	function getHours(receiveTime, stageTime) {
		if (stageTime) {
			receiveTime = receiveTime.replace(/-/ig, '/');
			var t = (Date.parse(stageTime) - Date.parse(receiveTime)) / (1000 * 60 * 60);
			if (!isNaN(t)) {
				return t.toFixed(2) + 'h';
			}
		}
	}
}

function queryExpress() {
    var no = info.express;
    wxToast('查询中');
	window.location.href = route('repair/queryExpress/'+no);
}

function confirmTakeGoods() {
    $.ajax({
        url: route('repair_ajax/takeGoods'),
        type: 'post',
        dataType: 'json',
        data: {
            no: info.repair_contractno,
        },
        success: function (res) {
            window.location.reload();
        }
    });
}