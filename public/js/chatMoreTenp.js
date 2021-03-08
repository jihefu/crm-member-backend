function toolBarShow(){
    var status = $('.tool-bar').css('display');
    if(status=='none'){
        $('.tool-bar').slideDown('fast');
        var w = $('.menu-item').width();
        $('.menu-item input').css('width',w);
    }else{
        $('.tool-bar').slideUp('fast');
    }
}

$(document).on('focus','.msgContent textarea',function(){
    $('.tool-bar').hide();
    setTimeout(function() {
        if ($('.bottom-bar').css('bottom') == '-1px') {
            $('.bottom-bar').css('bottom', '0px');
        } else {
            $('.bottom-bar').css('bottom', '-1px');
        }
    }, 400);
});