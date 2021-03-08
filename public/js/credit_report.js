$(document).on('click','.weui-cell_access',function(){
	var href = $(this).attr('data-href');
    if(!href) return;
	var time = $('select').val();
    if(href=='payments_list'&&time!=0) return;
	window.location.href = route('member/'+href+'?company='+company+'&time='+time);
});
function getData(company,time){
	$.ajax({
        url:route('member_ajax/credit'),
        type:'get',
        dataType:'json',
        timeout:30000,
        data: {
            company: company,
            time: time?time:0
        },
        success:function(res){
    		for(var i in res.data){
    			$('.'+i).html(res.data[i]);
    		}
            var time = $('select').val();
            var _n = $('.payment_num').html();
            if(time==0){
                $('.payment_num').parent().html('<span class="payment_num trans">'+_n+'</span>笔');
            }else{
                $('.payment_num').parent().html('<span class="payment_num trans">'+_n+'</span>');
            }
            $('.trans').each(function(){
                var price = $(this).text();
                $(this).text(trans(price));
            });
        }
    });
}
function trans(text){
	text = text.replace(/,/g,'');
    var len = text.length;
    var new_text = '';
    for (var i = 0; i < len; i++) {
        if(i==3||i==6||i==9){
            new_text =  ',' + new_text;
        }
        new_text = text[len-1-i] + new_text;
    }
    return new_text;
}
function selectTime(obj){
	var time = $(obj).val();
	// $('.v-time').text($(obj).find('option').eq([time]).html());
	getData(company,time);
}