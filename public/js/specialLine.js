var page = 1,num = 50,loading = false,hasMore = true,scrollHeight = 0,originArr = [],t;
$(function(){
    downloadApp();
    var u = navigator.userAgent;
    var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
    var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    if(isiOS){
        $('.file-icon-menu').remove();
    }
    initRefresh();
});
function initRefresh(){
    var pullRefresh = new auiPullToRefresh({
        container: document.querySelector('.aui-refresh-content'),
        triggerDistance: 50
    },function(ret){
        if(ret.status=="success"){
            setTimeout(function(){
                var type = $('.weui-bar__item_on').html().trim();
                if(type=='会议室'){
                    getSpecialList();
                }else if(type=='管理'){
                    return;
                }else{
                    getHotList();
                }
                pullRefresh.cancelLoading(); //刷新成功后调用此方法隐藏
            },500);
        }
    });
}

$(document).on('focus','textarea',function(){
    if(navigator.userAgent.indexOf('iPhone')!=-1){
        setTimeout(function(){
            // $('body').scrollTop(1000000);
            window.scrollTo(0, 1000000);
        },300);
    }
});

function tabClick(obj){
    $('.weui-navbar__item').removeClass('weui-bar__item_on');
    $(obj).addClass('weui-bar__item_on');
    $('.aui-chat').html('');
    if($(obj).html().trim()=='会议室'){
        $('.bottom-bar,.aui-refresh-content').show();
        $('.memberGroup').hide();
        page = 1;
        loading = false;
        hasMore = true;
        scrollHeight = 0;
        originArr = [];
        getSpecialList();
    }else if($(obj).html().trim()=='管理'){
        getMember();
        $('.bottom-bar,.aui-refresh-content').hide();
        $('.memberGroup').show();
    }else{
        $('.bottom-bar,.aui-refresh-content').show();
        $('.memberGroup').hide();
        page = 1;
        loading = false;
        hasMore = true;
        scrollHeight = 0;
        originArr = [];
        getHotList();
    }
    initRefresh();
}

getSpecialList();

function getMember(){
    $.ajax({
		url: route('member/getSpecialLineInfoByCustomerId'),
		type: 'get',
		dataType: 'json',
		timeout: 30000,
		success:function(res){
            normalMemberList('成员列表',res.data.outerContactArr,res.data.allMember);
            if(res.data.canEdit){
                var otherMemberArr = [];
                for (var i = 0; i < res.data.allMember.length; i++) {
                    for (var j = 0; j < res.data.outerContactArr.length; j++) {
                        if(res.data.allMember[i].open_id==res.data.outerContactArr[j]){
                            break;
                        }else if(res.data.allMember[i].open_id!=res.data.outerContactArr[j]&&j==res.data.outerContactArr.length-1){
                            otherMemberArr.push(res.data.allMember[i].open_id);
                        }
                    }
                }
                normalMemberList('非成员列表',otherMemberArr,res.data.allMember);
            }
        }
    });
}

function normalMemberList(title,outerContactArr,allMember){
    var str = '';
    for (var i = 0; i < outerContactArr.length; i++) {
        var name,phone,portrait,open_id;
        for (var j = 0; j < allMember.length; j++) {
            if(allMember[j].open_id==outerContactArr[i]){
                name = allMember[j].name;
                phone = allMember[j].phone;
                open_id = allMember[j].open_id;
                portrait = allMember[j].portrait?'/img/member/'+allMember[j].portrait:'../img/default_member2.jpg';
            }
        }
        str += '<label class="weui-media-box weui-media-box_appmsg">'+
                    '<div class="weui-media-box__hd" style="width: 2.75rem;height: 2.75rem;line-height: 2.75rem;">'+
                        '<img class="weui-media-box__thumb" src="'+portrait+'" alt="">'+
                    '</div>'+
                    '<div class="weui-media-box__bd open_id" data-openid="'+open_id+'">'+
                        '<h4 class="weui-media-box__title" style="font-size: 0.75rem;margin-bottom: 0.4375rem;">'+name+'</h4>'+
                        '<p class="weui-media-box__desc" style="font-size: 0.75rem">手机: '+
                            '<span>'+
                                '<a href="tel:'+phone+'">'+phone+'</a>'+
                            '</span>'+
                        '</p>'+
                    '</div>'+
                    '<div class="weui-cell__ft"></div>'+
                '</label>';
    }
    str = '<div class="weui-panel weui-panel_access" data-title="'+title+'">'+
                '<div class="weui-panel__hd">'+title+'</div>'+
                    '<div class="weui-panel__bd weui-cells_checkbox">'+str+'</div>'+
                '</div>'+
            '</div>';
    if(title=='成员列表'){
        $('.memberGroup .memberList').html(str);
    }else{
        str += '<div class="btns" style="margin: auto;margin-top: 1rem;margin-bottom: 1rem;width: 90%;display: flex">'+
                    '<a href="javascript:;" class="weui-btn weui-btn_primary manage" onclick="memberManage();">成员管理</a>'+
                    '<a href="javascript:;" class="weui-btn weui-btn_primary sub" onClick="sub();">提交</a>'+
                    '<a href="javascript:;" class="weui-btn weui-btn_default cancel" onClick="cancel();">取消</a>'+
                '</div>';
        $('.memberGroup .memberList').append(str);
    }
}

function memberManage(){
    $('.sub,.cancel').css('display','block');
    $('.manage').hide();
    var checkedStr = '<span class="checks">'+
                    '<input type="checkbox" class="weui-check" checked="checked">'+
                    '<i class="weui-icon-checked" style="margin-right: 0.5rem;"></i>'+
                '</span>';
    var notCheckedStr = '<span class="checks">'+
                    '<input type="checkbox" class="weui-check">'+
                    '<i class="weui-icon-checked" style="margin-right: 0.5rem;"></i>'+
                '</span>';
    $('.weui-panel_access[data-title="成员列表"] .weui-media-box_appmsg').prepend(checkedStr);
    $('.weui-panel_access[data-title="非成员列表"] .weui-media-box_appmsg').prepend(notCheckedStr);
}

function sub(){
    var resArr = [];
    $('.weui-media-box_appmsg').each(function(){
        var checked = $(this).find('.weui-check').prop('checked');
        var open_id = $(this).find('.open_id').attr('data-openid');
        if(checked) resArr.push(open_id);
    });
    if(resArr.length==0){
        wxToast('不能全部移除');
        return;
    }
    var outerContact = resArr.join();
    wxLoadToast('正在提交');
    $.ajax({
		url: route('member/updateOuterContact'),
		type: 'put',
		dataType: 'json',
		timeout: 30000,
		data:{
            outerContact: outerContact
		},
		success:function(res){
            $('#loadingToast').remove();
            wxToast(res.msg);
            cancel();
            $('.weui-bar__item_on').trigger('click');
        }
    });
}

function cancel(){
    $('.sub,.cancel').css('display','none');
    $('.manage').css('display','block');
    $('.checks').remove();
}

function getSpecialList(){
    if(loading||!hasMore) return;
    loading = true;
    $.ajax({
		url: route('member/getSpecialList'),
		type: 'get',
		dataType: 'json',
		timeout: 30000,
		data:{
            page: page,
            num: num
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
                    album: res.data[i].album,
                    file: res.data[i].file,
                    senderName: res.data[i].senderName
                };
                var portrait = res.data[i].portrait?'../img/member/'+res.data[i].portrait:'../img/default_member2.jpg';
                if(res.data[i].sender==selfOpenId){
                    str += msgTemp(true,params,portrait);
                }else if(res.data[i].sender.indexOf('oxI')!=-1){
                    str += msgTemp(false,params,portrait);
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
                    clearInterval(t);
                    t = setInterval(function(){
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
        error: function(res){
            window.location.href = route('member/onlineService');
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
                    album: res.data[i].album,
                    file: res.data[i].file
                };
                if(res.data[i].sender==selfOpenId){
                    str += hotMsgTemp(true,params,album);
                }else{
                    str += hotMsgTemp(false,params,'../img/朗杰弓三角.png');
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
                    clearInterval(t);
                    t = setInterval(function(){
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
        error: function(res){
            window.location.href = route('member/onlineService');
        }
    });
}

function msgTemp(self,params,album){
    var time = params.post_time;
    var content = params.content;
    var content_album = '';
    var content_file = '';
    var _arr = [];
    if(params.album){
        try{
            _arr = params.album.split(',');
        }catch(e){

        }
        for (var i = 0; i < _arr.length; i++) {
            content_album += '<a href="../img/notiClient/'+_arr[i]+'"><img style="min-height: 100px" src="../img/notiClient/'+_arr[i]+'" /></a>';
        }
        // _arr.forEach((items,index) => {
        //     content_album += '<a href="../img/notiClient/'+items+'"><img style="min-height: 100px" src="../img/notiClient/'+items+'" /></a>';
        // });
    }
    if(params.file){
        try{
            _arr = params.file.split(',');
        }catch(e){

        }
        for (var i = 0; i < _arr.length; i++) {
            content_file += '<a style="margin-left: 0.5rem;" href="../notiClient/'+_arr[i]+'">'+_arr[i]+'</a>';
        }
        // _arr.forEach((items,index) => {
        //     content_album += '<a style="margin-left: 0.5rem;" href="../notiClient/'+items+'">'+items+'</a>';
        // });
    }
    var senderName = params.senderName;
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
                            '<span>'+senderName+'</span>'+
                            '<span style="margin-left: 4px">'+time+'</span>'+
                        '</div>'+
                        '<div class="aui-chat-content">'+
                            '<div class="aui-chat-arrow"></div>'+
                            '<span>'+content+'</span>'+content_album+content_file+
                        '</div>'+
                    '</div>'+
                '</div>'
    return str;
}

function hotMsgTemp(self,params,album){
    var time = params.post_time;
    var content = params.content;
    var content_album = '';
    var _arr = [];
    if(params.album){
        try{
            _arr = params.album.split(',');
        }catch(e){

        }
        for (var i = 0; i < _arr.length; i++) {
            content_album += '<a href="../img/notiClient/'+_arr[i]+'"><img style="min-height: 100px" src="../img/notiClient/'+_arr[i]+'" /></a>';
        }
        // _arr.forEach((items,index) => {
        //     content_album += '<a href="../img/notiClient/'+items+'"><img style="min-height: 100px" src="../img/notiClient/'+items+'" /></a>';
        // });
    }else if(params.file){
        try{
            _arr = params.file.split(',');
        }catch(e){

        }
        for (var i = 0; i < _arr.length; i++) {
            content_album += '<a style="margin-left: 0.5rem;" href="../notiClient/'+_arr[i]+'">'+_arr[i]+'</a>';
        }
        // _arr.forEach((items,index) => {
        //     content_album += '<a style="margin-left: 0.5rem;" href="../notiClient/'+items+'">'+items+'</a>';
        // });
    }else{
        content_album = '';
    }
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
    var type = $('.weui-bar__item_on').html().trim();
    var url;
    if(type=='会议室'){
        url = 'member/addSpecialMsg';
    }else{
        url = 'member/addHostMsg';
    }
    wxLoadToast('发送中');
    $.ajax({
		url: route(url),
		type: 'post',
		dataType: 'json',
		timeout: 30000,
		data:{
            form_data: JSON.stringify({
                content: v,
                title: TITLE,
            }),
            self: true
		},
		success:function(res){
            $('#loadingToast').remove();
            page = 1;
            loading = false;
            hasMore = true;
            $('.aui-chat').html('');
            $('.msgContent textarea').val('');
            if(type=='会议室'){
                getSpecialList();
            }else{
                getHotList();
            }
            initRefresh();
        },
        error: function(res){
            window.location.href = route('member/onlineService');
        }
    });
}

function uploadImg(obj){
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
            var type = $('.weui-bar__item_on').html().trim();
            var url;
            if(type=='会议室'){
                url = 'member/addSpecialMsg';
            }else{
                url = 'member/addHostMsg';
            }
            $.ajax({
                url: route(url),
                type: 'post',
                dataType: 'json',
                timeout: 30000,
                data:{
                    form_data: JSON.stringify({
                        content: '图片',
                        title: TITLE,
                        album: img,
                        albumName: albumName
                    })
                },
                success:function(res){
                    page = 1;
                    loading = false;
                    hasMore = true;
                    $('.aui-chat').html('');
                    $('.msgContent textarea').val('');
                    $('.tool-bar').slideUp('fast');
                    if(type=='会议室'){
                        getSpecialList();
                    }else{
                        getHotList();
                    }
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

function uploadImgCanvas(obj){
    var filenode = $(obj).prop('files')[0];
    var albumName = filenode.name;
    ljDealerPhoto(obj, function (dataUrl) {
        var data = new FormData();
        data.append("file", dataURLtoBlob(dataUrl), filenode);
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
                var type = $('.weui-bar__item_on').html().trim();
                var url;
                if(type=='会议室'){
                    url = 'member/addSpecialMsg';
                }else{
                    url = 'member/addHostMsg';
                }
                $.ajax({
                    url: route(url),
                    type: 'post',
                    dataType: 'json',
                    timeout: 30000,
                    data:{
                        form_data: JSON.stringify({
                            content: '图片',
                            title: TITLE,
                            album: img,
                            albumName: albumName
                        })
                    },
                    success:function(res){
                        page = 1;
                        loading = false;
                        hasMore = true;
                        $('.aui-chat').html('');
                        $('.msgContent textarea').val('');
                        $('.tool-bar').slideUp('fast');
                        if(type=='会议室'){
                            getSpecialList();
                        }else{
                            getHotList();
                        }
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
    });
}

function uploadFile(obj){
    var data = new FormData();
    var filenode = $(obj).prop('files')[0];
    // var filenode = document.getElementById('uploadFile').files[0];
    var fileName = filenode.name;
    data.append("file", filenode);
    wxLoadToast('正在上传');
    $.ajax({
        url: route('member/uploadFileToHotLine'),
        type: 'POST',
        data: data,
        dataType:"json",
        cache: false,
        contentType: false, //不可缺参数
        processData: false, //不可缺参数
        success: function(res) {
            $('#loadingToast').remove();
            var file = res.data[0];
            var type = $('.weui-bar__item_on').html().trim();
            var url;
            if(type=='会议室'){
                url = 'member/addSpecialMsg';
            }else{
                url = 'member/addHostMsg';
            }
            $.ajax({
                url: route(url),
                type: 'post',
                dataType: 'json',
                timeout: 30000,
                data:{
                    form_data: JSON.stringify({
                        content: '文件',
                        title: TITLE,
                        file: file,
                        fileName: fileName
                    })
                },
                success:function(res){
                    page = 1;
                    loading = false;
                    hasMore = true;
                    $('.aui-chat').html('');
                    $('.msgContent textarea').val('');
                    $('.tool-bar').slideUp('fast');
                    if(type=='会议室'){
                        getSpecialList();
                    }else{
                        getHotList();
                    }
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

function pollingMsg(){
    var type = $('.weui-bar__item_on').html().trim();
    var url;
    if(type=='会议室'){
        url = 'member/getSpecialList';
    }else if(type=='管理'){
        return;
    }else{
        url = 'member/getHotList';
    }
    $.ajax({
		url: route(url),
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
            if(type=='会议室'){
                var params = {
                    post_time: time(addArr[i].post_time),
                    content: addArr[i].content,
                    album: addArr[i].album,
                    file: addArr[i].file,
                    senderName: addArr[i].senderName
                };
                var portrait = addArr[i].portrait?'../img/member/'+addArr[i].portrait:'../img/default_member2.jpg';
                if(addArr[i].sender==selfOpenId){
                    str += msgTemp(true,params,portrait);
                }else if(addArr[i].sender.indexOf('oxI')!=-1){
                    str += msgTemp(false,params,portrait);
                }else{
                    str += msgTemp(false,params,'../img/朗杰弓三角.png');
                }
            }else{
                var params = {
                    post_time: time(addArr[i].post_time),
                    content: addArr[i].content,
                    album: addArr[i].album,
                    file: addArr[i].file
                };
                if(addArr[i].sender==selfOpenId){
                    str += hotMsgTemp(true,params,album);
                }else{
                    str += hotMsgTemp(false,params,'../img/朗杰弓三角.png');
                }
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

function msgSubChange(obj){
    var isSub;
    if($(obj).prop('checked')){
        isSub = 1;
    }else{
        isSub = 0;
    }
    wxLoadToast('正在提交');
    $.ajax({
		url: route('member/checkWxServerMsg'),
		type: 'put',
		dataType: 'json',
		timeout: 30000,
		data:{
            isSub: isSub
		},
		success:function(res){
            $('#loadingToast').remove();
            wxToast(res.msg);
        }
    });
}

function downloadApp() {
    if(/(iphone|ipod|ipad)/ig.test(navigator.userAgent)){
        // iphone
    }else{
        // android
        $('#downloadApp').attr('href',route('html/downloadCusApp.html'));
        // $('#downloadApp').attr('href',route('releaseApp/考勤通.apk'));
    }
}