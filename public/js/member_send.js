function input(){
	// if(text1.value.length>100){
	// 	wxToast('最多输入100字符');
	// 	return;
	// }
    document.getElementById('num1').innerHTML=text1.value.length;
}
function temp(obj){
	var val = $(obj).val();
	if(val=='singleMsg'){
		$('input,textarea').val('');
		$('.url').hide();
	}else if(val=='linkMsg'){
		$('input,textarea').val('');
		$('.url').show();
	}
}
function send(){
	$('#dialog').show();
}
function cancel(){
	$('#dialog').hide();
}
function sub(){
	var user = sessionStorage.getItem("user_key");
	try{
		var len = JSON.parse(user);
	}catch(e){
		var len = 1;
	}
	if((!user)||len==0){
		wxToast('未选择指定人');
		return;
	}
	$('#dialog').hide();
	var template = $('select[name=template]').val();
	var title = $('input[name=title]').val();
	var url = $('input[name=url]').val()?$('input[name=url]').val():'';
	var message = $('textarea[name=message]').val();
	message = message.replace(/\n/g,'<br/>');
	message = message.replace(/\s/g,'&nbsp;');
	var sender = $('body').attr('data-sender');
	if(title==''){
		wxToast('标题不能为空');
		return;
		$('input[name=title]').focus();
	}
	var params_arr = [
		{
			table: 'vip_message',
			user: user,
			model: template,
			title: title,
			url: url,
			message: message,
			sender: sender
		}
	];
	params_arr = JSON.stringify(params_arr);
	wxLoadToast('正在发送');
	$.ajax({
		url:route('message/msg_to_consumer'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			params: params_arr
		},
		success:function(res){
			$('#loadingToast').remove();	
			if(res&&res.code==200){
				wxToast('发送成功');
				sessionStorage.removeItem("user_key");
			}else if(res&&res.code==-100){
				wxToast(res.msg);
				setTimeout(function(){
					window.location.reload();
				},2000);
			}
		}
	});
}