var date;
$(document).ready(function(){
	$('input').not('[type=file]').click(function(e){
        e.preventDefault();
        var val = $(this).val();
        $(this).val('');
        $(this).val(val);
        $(this).focus();
    });
    $('#showDatePicker').click(function(){
    	date = $(this).html();
    	// $(this).attr('data-change',1);
    });
    $('input').not('[type=file]').change(function(){
    	$(this).attr('data-change',1);
    });
    $('select').change(function(){
    	$(this).attr('data-change',1);
    });
});
function sub(){
	var input_len = $('.page__bd input[data-change=1]').not('[type=file]').length;
	var str = '';
	for (var i = 0; i < input_len; i++) {
		var text = $('input[data-change=1]').not('[type=file]').eq(i).val();
		var key = $('input[data-change=1]').not('[type=file]').eq(i).attr('name');
		var pattern = $('input[data-change=1]').not('[type=file]').eq(i).attr('pattern');
		var pat = new RegExp(pattern,'ig');
		if(key!='birth'&&pat.test(text)==false&&text!=''){
			$('input[data-change=1]').not('[type=file]').eq(i).focus();
			wxToast('格式错误');
			return;
		}else{
			// if(key=='birth'){
			// 	if(text==''){
			// 		str += key+'="0000-00-00",check_'+key+'=0,';
			// 	}else{
			// 		str += key+'="'+text+'",check_'+key+'=0,';
			// 	}
			// }else{
				str += key+'="'+text+'",check_'+key+'=0,';
			// }
		}
	};
	// var select_len = $('select[data-change=1]').length;
	// for (var i = 0; i < select_len; i++) {
	// 	var text = $('select[data-change=1]').eq(i).val();
	// 	var key = $('select[data-change=1]').eq(i).attr('name');
	// 	str += key+'="'+text+'",';
	// };
	// if($('#showDatePicker').html()!=date){
	// 	var text = $('#showDatePicker').html();
	// 	var key = $('#showDatePicker').attr('name');
	// 	str += key+'="'+text+'",check_'+key+'=0,';
	// }
	// var _str = str.slice(0,str.length-1);
	var form_data = {};
	$('input[type=text]').each(function(){
		form_data[$(this).attr('name')] = $(this).val();
	});
	form_data['gender'] = $('select[name=gender]').val();
	form_data['birth'] = $('button[name=birth]').text()?$('button[name=birth]').text():null;
	var name = $('#wrap').attr('data-name');
	var phone = $('#wrap').attr('data-phone');
	var newName = $('input[name=name]').val();
	var newPhone = $('input[name=phone]').val();
	wxLoadToast('正在提交');
	$.ajax({
		url:route('member_ajax/subBasicInfo'),
		type:'put',
		dataType:'json',
		timeout:30000,
		data:{
			'name':name,
			'phone':phone,
			'form_data':JSON.stringify(form_data),
			'newName':newName,
			'newPhone':newPhone
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