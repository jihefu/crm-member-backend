$(document).ready(function(){
	$('input[name=company]').click(function(e){
        e.preventDefault();
        var val = $(this).val();
        $(this).val('');
        $(this).val(val);
        $(this).focus();
    });
    $('input[name=company]').change(function(){
    	$(this).attr('data-change',1);
	});
	var jobSelectedArr = [];
	try {
		jobSelectedArr = jobStr.split(',');
	} catch (e) {
		jobSelectedArr = [];
	}
	for (var i = 0; i < jobSelectedArr.length; i++) {
		$('input[name="'+jobSelectedArr[i]+'"]').prop('checked',true);
	}
    // $('select').change(function(){
    // 	$(this).attr('data-change',1);
    // });
});
function sub(){
	// var input_len = $('.page__bd input[data-change=1]').length;
	// var str = '';
	// for (var i = 0; i < input_len; i++) {
	// 	var text = $('input[data-change=1]').eq(i).val();
	// 	var key = $('input[data-change=1]').eq(i).attr('name');
	// 	var pattern = $('input[data-change=1]').eq(i).attr('pattern');
	// 	var pat = new RegExp(pattern,'ig');
	// 	if(key!='birth'&&pat.test(text)==false&&text!=''){
	// 		$('input').eq(i).focus();
	// 		wxToast('格式错误');
	// 		return;
	// 	}else{
	// 		str += key+'="'+text+'",check_'+key+'=0,';
	// 	}
	// };
	// var select_len = $('select[data-change=1]').length;
	// for (var i = 0; i < select_len; i++) {
	// 	var text = $('select[data-change=1]').eq(i).val();
	// 	var key = $('select[data-change=1]').eq(i).attr('name');
	// 	str += key+'="'+text+'",check_'+key+'=0,';
	// };
	// var _str = str.slice(0,str.length-1);
	// if(_str==''){
	// 	wxToast('未修改内容');
	// 	return;
	// }
	if ($('input[name=company]').val() == '') {
		wxToast('公司名不能为空');
		return;
	}
	var job = [];
	$('.weui-cells_checkbox input[type=checkbox]').each(function(){
		if ($(this).prop('checked')) {
			job.push($(this).attr('name'));
		}
	});
	if (job.length === 0) {
		wxToast('至少选择一个职位');
		return;
	}
	var form_data = {
		company: $('input[name=company]').val(),
		job: job.join()
	};
	var r = window.confirm('修改后需要重新审核，期间部分功能无法使用，是否继续？');
	if (!r) return;
	wxLoadToast('正在提交');
	$.ajax({
		url:route('member_ajax/subBnsInfo'),
		type:'put',
		dataType:'json',
		timeout:30000,
		data:{
			'form_data': JSON.stringify(form_data)
		},
		success:function(res){
			$('#loadingToast').remove();
			wxToast(res.msg);
			setTimeout(function(){
				window.location.href = route('member/index');
			},2000);
		}
	});
}