$('button').show().kendoButton();
function sub(){
	var val = $('input[name=phone]').val();
	if(!/^1(3|5|7|8|9)\d{9}$/.test(val)){
		mToast('手机号码输入格式有误！');
		$('input[name=phone]').focus();
		return;
	}
}