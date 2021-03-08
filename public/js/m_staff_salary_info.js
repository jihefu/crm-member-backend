var subsidy_arr = ['news','meal','overtime','bussiness_trip','service','duty_day','high_temperature','tax_back'];
var chargeback_arr = ['absence','affair_not_update','provident_fund_supplement','repay'];
var bonus_arr = ['new_customer','drawback','year_end_awards'];
var withholding_arr = ['social_security','provident_fund','salary_personal_tax','year_end_awards_personal_tax'];
var enterprise_arr = ['enterprise_social_security','enterprise_provident_fund'];
$(function(){
    monthInit();
    dataInit();
    $('.weui-form-preview__value').click(function(){
        loadMore(this);
    });
});

function monthInit(){
    for (var i = 0; i < month_arr.length; i++) {
        month_arr[i].show = 'visible';
    }
    if(month_arr.length < 6){
        for (var i = month_arr.length; i < 6; i++) {
            month_arr.push({y_m_salary: 'foo',show: 'hidden'});
        }
    }
    var str = '';
    for (var i = 0; i < month_arr.length; i++) {
        if(i==0){
            str += '<a href="javascript:;" onclick="getData(this);" class="weui-btn month-btn weui-btn_plain-primary" style="visibility:'+month_arr[i].show+'">'+month_arr[i].y_m_salary+'</a>';
        }else{
            str += '<a href="javascript:;" onclick="getData(this);" class="weui-btn month-btn weui-btn_plain-default" style="visibility:'+month_arr[i].show+'">'+month_arr[i].y_m_salary+'</a>';
        }
    }
    $('#head').html(str);
}
function getData(obj){
    var y_m_salary = $(obj).text();
    $('.month-btn').css({
        'color': '#999',
        'border-color': '#999'
    });
    $(obj).css({
        'color': '#1aad19',
        'border-color': '#1aad19'
    });
    $.ajax({
        url:route('m/staff/salaryInfo'),
        type:'get',
        dataType:'json',
        timeout:30000,
        data:{
            "y_m_salary":y_m_salary
        },
        success:function(res){
            data_arr = res.data[0];
            dataInit();
        }
    });
}
function dataInit(){
    var main_arr = [subsidy_arr,chargeback_arr,bonus_arr,withholding_arr,enterprise_arr];
    var subsidy = 0,chargeback = 0,bonus = 0,withholding = 0,enterprise = 0;
    $('._subsidy,._chargeback,._bonus,._withholding,._enterprise').remove();
    $('.icon-triangledown').css({
        "transform":"rotate(0deg)"
    });
    $('.icon-triangledown').attr('data-open',0);
    main_arr.forEach(function(items,index){
        var c = 0;
        items.forEach(function(it,ind){
            c += Number(data_arr[0][it]);
        });
        if(c%1 !== 0 ) c = c.toFixed(2);
        if(index==0){
            subsidy = c;
        }else if(index==1){
            chargeback = c;
        }else if(index==2){
            bonus = c;
        }else if(index==3){
            withholding = c;
        }else if(index==4){
            enterprise = c;
        }
    });
    var main_obj = {
        actual_pay: data_arr[0].actual_pay,
        user_id: data_arr[0].user_id,
        user_name: data_arr[0].user_name,
        basic_salary: data_arr[0].basic_salary,
        performance_salary: data_arr[0].performance_salary,
        subsidy: subsidy,
        chargeback: chargeback,
        bonus: bonus,
        should_pay: data_arr[0].should_pay,
        withholding: withholding,
        enterprise: enterprise
    };
    for(var key in main_obj){
        $('.'+key).text(main_obj[key]);
    }
}
function loadMore(obj){
    var $trig = $(obj).find('.icon-triangledown');
    if($trig.length){
        if($trig.attr("data-open")==1){
            $trig.attr('data-open',0);
            $trig.css({
                "transform":"rotate(0deg)"
            });
            var type = $(obj).find('span').eq(0).attr('class');
            $('._'+type).remove();
        }else{
            $trig.attr('data-open',1);
            $trig.css({
                "transform":"rotate(180deg)"
            });
            var type = $(obj).find('span').eq(0).attr('class');
            var str = '';
            var arr = eval(type+'_arr');
            for (var i = 0; i < arr.length; i++) {
                for(var j in data_arr[0]){
                    if(arr[i]==j){
                        var key = transComment(j);
                        var val = data_arr[0][j];
                        str += '<div class="weui-form-preview__item _'+type+'">'+
                                    '<label class="weui-form-preview__label">'+
                                        '<span class="child_key"> · '+key+'</span>'+
                                    '</label>'+
                                    '<span class="weui-form-preview__value">'+
                                        '<span class="child_val">'+val+'</span>'+
                                    '</span>'+
                                '</div>';
                    }
                }
            }
            str = '<p class="more">'+str+'</p>';
            $(obj).parent().append(str);
        }
    }
}
function transComment(key){
    for (var i = 0; i < comment_arr.length; i++) {
        if(key==comment_arr[i].column_name){
            return comment_arr[i].column_comment;
        }
    }
}