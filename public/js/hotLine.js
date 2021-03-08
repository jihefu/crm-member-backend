var page = 1,num = 50,loading = false,hasMore = true,scrollHeight = 0,originArr = [];
$(function(){
    pullInit();
});
$(document).on('focus','textarea',function(){
    if(navigator.userAgent.indexOf('iPhone')!=-1){
        setTimeout(function(){
            // $('body').scrollTop(1000000);
            window.scrollTo(0, 1000000);
        },300);
    }
});

getHotList();

function pullInit() {
    var pullRefresh = new auiPullToRefresh({
        container: document.querySelector('.aui-refresh-content'),
        triggerDistance: 50
    },function(ret){
        if(ret.status=="success"){
            setTimeout(function(){
                getHotList();
                pullRefresh.cancelLoading(); //刷新成功后调用此方法隐藏
            },500);
        }
    });
}

function getHotList(){
    if(loading||!hasMore) return;
    loading = true;
    $.ajax({
		url: route('member/getHotList'),
		type: 'get',
		dataType: 'json',
		timeout: 30000,
		data:{
            page: page,
            num: num,
            self: true
		},
		success:function(res){
            if(res.data.length==0) hasMore = false;
            loading = false;
            page++;
            var str = '';
            for (var i = 0; i < res.data.length; i++) {
                var params = {
                    post_time: time(res.data[i].post_time),
                    content: res.data[i].content,
                    album: res.data[i].album
                };
                if(res.data[i].sender==selfOpenId){
                    str += msgTemp(true,params,album);
                }else{
                    str += msgTemp(false,params,'../img/朗杰弓三角.png');
                }
            }
            $('.aui-chat').prepend(str);
            setTimeout(function(){
                $('.aui-chat-item:last').css({
                    'margin-bottom': '4rem'
                });
                if(page==2){
                    // $('body').scrollTop(30000);
                    window.scrollTo(0, 30000);
                    scrollHeight = document.getElementsByTagName('body')[0].scrollHeight;
                    originArr = res.data;
                    setInterval(function(){
                        pollingMsg();
                    },5000);
                }else{
                    var _scrollHeight = document.getElementsByTagName('body')[0].scrollHeight - scrollHeight;
                    document.getElementsByTagName('body')[0].scrollTop = _scrollHeight;
                    window.scrollTo(0, _scrollHeight);
                    scrollHeight = document.getElementsByTagName('body')[0].scrollHeight;
                }
            },50);
        },
        error: function(e){
            window.location.href = route('member/onlineService');
        }
    });
}

function msgTemp(self,params,album){
    var time = params.post_time;
    var content = params.content;
    var content_album = params.album?'<a href="../img/notiClient/'+params.album+'"><img style="min-height: 100px" src="../img/notiClient/'+params.album+'" /></a>':'';
    var direct;
    if(self){
        direct = 'aui-chat-right';
    }else{
        direct = 'aui-chat-left';
    }
    var str = '<div class="aui-chat-item '+direct+'">'+
                    '<div class="aui-chat-media">'+
                        '<img src="'+album+'" />'+
                    '</div>'+
                    '<div class="aui-chat-inner">'+
                        '<div class="aui-chat-name">'+
                            '<span>'+time+'</span>'+
                        '</div>'+
                        '<div class="aui-chat-content">'+
                            '<div class="aui-chat-arrow"></div>'+
                            '<span>'+content+'</span>'+content_album+
                        '</div>'+
                    '</div>'+
                '</div>'
    return str;
}

function send(){
    var v = $('.msgContent textarea').val();
    if(v=='') return;
    wxLoadToast('发送中');
    $.ajax({
		url: route('member/addHostMsg'),
		type: 'post',
		dataType: 'json',
		timeout: 30000,
		data:{
            form_data: JSON.stringify({
                content: v
            })
		},
		success:function(res){
            $('#loadingToast').remove();
            page = 1;
            loading = false;
            hasMore = true;
            $('.aui-chat').html('');
            getHotList();
            $('.msgContent textarea').val('');
            pullInit();
        },
        error: function(res){
            window.location.href = route('member/onlineService');
        }
    });
}

function uploadFile(obj){
    var data = new FormData();
    var filenode = $(obj).prop('files')[0];
    // var filenode = document.getElementById('uploadImg').files[0];
    var albumName = filenode.name;
    data.append("file", filenode);
    wxLoadToast('正在上传');
    $.ajax({
        url: route('member/uploadImgToHotLine'),
        type: 'POST',
        data: data,
        dataType:"json",
        cache: false,
        contentType: false, //不可缺参数
        processData: false, //不可缺参数
        success: function(res) {
            $('#loadingToast').remove();
            var img = res.data[0];
            $.ajax({
                url: route('member/addHostMsg'),
                type: 'post',
                dataType: 'json',
                timeout: 30000,
                data:{
                    form_data: JSON.stringify({
                        content: '图片',
                        album: img,
                        albumName: albumName
                    })
                },
                success:function(res){
                    page = 1;
                    loading = false;
                    hasMore = true;
                    $('.aui-chat').html('');
                    getHotList();
                    $('.msgContent textarea').val('');
                    $('.tool-bar').slideUp('fast');
                }
            });
        },
        error: function() {
            $('#loadingToast').remove();
            wxToast('上传失败');
            setTimeout(function(){
                window.location.href = route('member/onlineService');
            },1500);
        }
    });
}

function uploadAlbum(obj) {
    var filenode = $(obj).prop('files')[0];
    var albumName = filenode.name;
    ljDealerPhoto(obj, function (dataUrl) {
        var data = new FormData();
        data.append('file', dataURLtoBlob(dataUrl), filenode);
        wxLoadToast('正在上传');
        $.ajax({
            url: route('member/uploadImgToHotLine'),
            type: 'POST',
            data: data,
            dataType: "json",
            cache: false,
            contentType: false, //不可缺参数
            processData: false, //不可缺参数
            success: function (res) {
                $('#loadingToast').remove();
                var img = res.data[0];
                $.ajax({
                    url: route('member/addHostMsg'),
                    type: 'post',
                    dataType: 'json',
                    timeout: 30000,
                    data: {
                        form_data: JSON.stringify({
                            content: '图片',
                            album: img,
                            albumName: albumName
                        })
                    },
                    success: function (res) {
                        page = 1;
                        loading = false;
                        hasMore = true;
                        $('.aui-chat').html('');
                        getHotList();
                        $('.msgContent textarea').val('');
                        $('.tool-bar').slideUp('fast');
                    }
                });
            },
            error: function () {
                $('#loadingToast').remove();
                wxToast('上传失败');
                setTimeout(function () {
                    window.location.href = route('member/onlineService');
                }, 1500);
            }
        });
    });
}

function pollingMsg(){
    $.ajax({
		url: route('member/getHotList'),
		type: 'get',
		dataType: 'json',
		timeout: 30000,
		data:{
            page: 1,
            num: num,
            self: true
		},
		success:function(res){
            var newArr = res.data;
            if(newArr.length==0) return;
            if(newArr.length!=0&&originArr.length==0){
                getNewAddItem(newArr,originArr);
            }else if(newArr[newArr.length-1].post_time!=originArr[originArr.length-1].post_time){
                getNewAddItem(newArr,originArr);
            }
        }
    });

    function getNewAddItem(newArr,_originArr){
        var addArr = [];
        if(_originArr.length==0){
            addArr = newArr;
        }else{
            var post_time = _originArr[_originArr.length-1].post_time;
            var _i;
            for (var i = 0; i < newArr.length; i++) {
                if(newArr[i].post_time==post_time){
                    _i = i;
                }
            }
            for (var i = _i+1; i < newArr.length; i++) {
                addArr.push(newArr[i]);
            }
        }
        var str = '';
        for (var i = 0; i < addArr.length; i++) {
            var params = {
                post_time: time(addArr[i].post_time),
                content: addArr[i].content,
                album: addArr[i].album
            };
            if(addArr[i].sender==selfOpenId){
                str += msgTemp(true,params,album);
            }else{
                str += msgTemp(false,params,'../img/朗杰弓三角.png');
            }
        }
        $('.aui-chat').append(str);
        setTimeout(function(){
            $('.aui-chat-item').css({
                'margin-bottom': '0.75rem'
            });
            $('.aui-chat-item:last').css({
                'margin-bottom': '4rem'
            });
            // $('body').scrollTop(30000000);
            window.scrollTo(0, 30000000);
        },100);
        originArr = newArr;
    }
}