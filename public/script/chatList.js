var scroller = {
    noti_client_affair_group_uuid: null,
    page: 1,
    num: 10,
    hasmore: true,
    loading: false,
    keywords: '',
    height: 0
};
/**
 * 封装ajax
 */
function apiAjax(option,cb){
    var token = sessionStorage.getItem('token');
    $.ajax({
        url:route(option.url),
        type:option.type?option.type:'get',
        beforeSend: function(request){
            request.setRequestHeader('token',token);
        },
        dataType:'json',
        timeout:30000,
        data: option.data,
        success:function(res){
    		cb(res);
        },
        error: function(err){
            try{
                alert(err.responseJSON.msg);
            }catch(e){

            }
        }
    });
}
$(function() {
    $('.aui-chat').html('');
    $('header').html(decodeURIComponent(GetRequest('title')));
    var pullRefresh = new auiPullToRefresh({
        container: document.querySelector('.aui-refresh-content'),
        triggerDistance: 100
    },function(ret){
        if(ret.status=="success"){
            if(scroller.loading) return;
            if(!scroller.hasmore) {
                wxToast('没有更多了');
                pullRefresh.cancelLoading();
                return;
            }
            scroller.page++;
            getMsgList(function(){
                pullRefresh.cancelLoading();
            });
        }
    });
    scroller.noti_client_affair_group_uuid = GetRequest('affairId');
    scroller.page = 1;
    scroller.hasmore = true;
    scroller.loading = false;
    if(!GetRequest('affairId')||GetRequest('affairId')=='null'){
        wxToast('请登录PC端处理');
        setTimeout(function(){
            window.history.back(-1);
        },2000);
        return;
    }
    getMsgList();
});

function getMsgList(cb) {
    if(!scroller.hasmore) return;
    scroller.loading = true;
    apiAjax({
        url: 'home/notiClient/list',
        data: {
            noti_client_affair_group_uuid: scroller.noti_client_affair_group_uuid,
            page: scroller.page,
            num: scroller.num,
            keywords: scroller.keywords
        }
    },function(res){
        scroller.loading = false;
        if(res.data.length==0) {
            scroller.hasmore = false;
            wxToast('没有更多了');
        }
        res.data = res.data.reverse();
        var str = '';
        for (var i = 0; i < res.data.length; i++) {
            str += msgTemp(res.data[i]);
        }
        $('.aui-chat').prepend(str);
        setTimeout(function(){
            if(scroller.page==1){
                $('body').scrollTop(30000);
            }else{
                var _scrollHeight = document.getElementsByTagName('body')[0].scrollHeight - scroller.height;
                document.getElementsByTagName('body')[0].scrollTop = _scrollHeight;
            }
            scroller.height = document.getElementsByTagName('body')[0].scrollHeight;
        },30);
        if(cb) cb();
    })
}
