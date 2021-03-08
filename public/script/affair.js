var directorArr = [];
var DATA;
// 判断是否处于登陆状态
function checkLogin(cb){
    if(sessionStorage.getItem('token')){
        cb();
    }else{
        // 需要登陆
        var dialog = new auiDialog({});
        dialog.alert({
            title:"用户登陆",
            msg:'<input class="c_input" type="text" name="username" placeholder="请输入姓名" value="" />'+
                '<input class="c_input" type="password" name="password" placeholder="请输入密码" value="" />',
            buttons:['取消','确定']
        },function(ret){
            if(ret&&ret.buttonIndex==2){
                var username = $('input[name=username]').val();
                var password = $('input[name=password]').val();
                if(username==''||password==''){
                    alert('输入不能为空！');
                    return;
                }
                apiAjax({
                    url: 'home/login',
                    type: 'post',
                    data: {
                        userName: username,
                        passWord: password
                    }
                },function(res){
                    sessionStorage.setItem('token',res.data[0].token);
                    sessionStorage.setItem('user_id',res.data[0].user_id);
                    sessionStorage.setItem('user_name',res.data[0].user_name);
                    cb();
                });
            }
        });
    }
}

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

/**
 * 获取更多信息
 */
function getMoreInfo(){
    apiAjax({
        url: 'home/attendance/onlineAssessment',
        data: {
            keywords: sessionStorage.getItem('user_name'),
            filter: JSON.stringify({
                date: '当月'
            })
        }
    },function(res){
        apiAjax({
            url: 'home/attendance/getHasMobileStaffArr'
        },function(hasMobileStaffArr){
            if(hasMobileStaffArr.indexOf(sessionStorage.getItem('user_id'))==-1){
                $('.appSign').html('<div>'+
                        '<p>进度警告</p>'+
                        '<p class="warnProgress"></p>'+
                    '</div><div></div><div></div><div></div>');
            }
            for(var key in res.data.data[0]){
                $('.'+key).text(res.data.data[0][key]);
            }
        });
    });
}

/**
 *  获取签到信息
 */
function getSignInfo(){
    apiAjax({
        url:'home/attendance/workingNum',
    },function(res){
        DATA = res.data;
        renderSign(res.data);
    });
}

function renderSign(data){
    var status = data.status;
    $('.workTime').html(data.workTime);
    $('.overWorkTime').html(data.overWorkTime);
    $('.onDutyTime').html(data.onDutyTime);
    $('.total').html(data.total);
    $('.notUpdate').html(data.notUpdate);
    showWorkTime(data,data.workTime);
    if(status==0){
        var str = '<div style="text-align: center;margin-top: 60px;">'+
                        '<a href="javascript:;" onclick="signIn();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">上班</a>'+
                    '</div>'+
                    '<div class="wrap-duty" >'+
                        '<p style="padding-top: 5px;">'+
                            '<span onclick="absence();">请假</span>'+
                        '</p>'+
                    '</div>';
        $('.sign-wrap').html(str);
    }else if(status==1){
        var onCusDutyStaff = data.onCusDutyStaff?data.onCusDutyStaff:'';
        var onDutyStaff = data.onDutyStaff?data.onDutyStaff:'';
        var onDutyInsideStaff = data.onDutyInsideStaff?data.onDutyInsideStaff:'';
        var str = '<div style="text-align: center;">'+
                        '<div class="wrap-duty">'+
                            '<label onclick="safeDuty();" style="color: rgb(117,117,117);">'+
                                '<span>安卫：</span>'+
                                '<span>'+onDutyStaff+'</span>'+
                            '</label>'+
                            '<label onclick="cusDuty();" style="color: rgb(117,117,117);text-align: center">'+
                                '<span>客服：</span>'+
                                '<span>'+onCusDutyStaff+'</span>'+
                            '</label>'+
                            '<label onclick="insideDuty();" style="color: rgb(117,117,117);text-align: right">'+
                                '<span>内勤：</span>'+
                                '<span>'+onDutyInsideStaff+'</span>'+
                            '</label>'+
                        '</div>'+
                        '<a href="javascript:;" style="margin-top: 10px;" onclick="signOut();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">下班</a>'+
                        '<div class="wrap-duty" >'+
                            '<p style="padding-top: 5px;">'+
                                '<span onclick="goOutDialog();">登记外出</span>'+
                            '</p>'+
                            '<p style="padding-top: 5px;">'+
                                '<span onclick="recallWork();">撤销上班</span>'+
                            '</p>'+
                        '</div>'+
                    '</div>';
        $('.sign-wrap').html(str);
    }else if(status==2){
        var str = '<div style="text-align: center;margin-top: 60px;">'+
                        '<a href="javascript:;" onclick="outLeave();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">下班</a>'+
                        '<div class="wrap-duty" >'+
                            '<p style="padding-top: 5px;">'+
                                '<span onclick="backWork();">返岗</span>'+
                            '</p>'+
                        '</div>'+
                    '</div>';
        $('.sign-wrap').html(str);
    }else if(status==3){
        var str = '<div style="text-align: center;margin-top: 60px;"><a href="javascript:;" onclick="overWorkStart();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">加班</a></div>';
        $('.sign-wrap').html(str);
    }else if(status==4){
        var str = '<div style="text-align: center;margin-top: 60px;">'+
                        '<a href="javascript:;" onclick="overWorkEnd();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">结束加班</a>'+
                        '<div class="wrap-duty" >'+
                            '<p style="padding-top: 5px;">'+
                                '<span onclick="recallOverWork();">撤销上班</span>'+
                            '</p>'+
                        '</div>'+
                    '</div>';
        $('.sign-wrap').html(str);
    }
}

function showWorkTime(data,workTime){
    if(data.status==1||data.status==2){
        show();
        // clearInterval(timer);
        timer = setInterval(function(){
            show();
        },60*1000);
    }

    function show(){
        var sign_on_time = Date.parse(data.checkTime);
        var _date = dateTime()+' 09:00:00';
        _date = _date.replace(/-/g,'/');
        var todayNineClock = Date.parse(_date);
        // var todayNineClock = Date.parse(moment().format('YYYY-MM-DD')+' 09:00:00');
        if(sign_on_time<todayNineClock){
            sign_on_time = todayNineClock;
        }
        var resStamp = Date.now() - sign_on_time;
        resStamp = resStamp<0?0:resStamp;
        var viewWorkTime = parseInt(Number(resStamp));
        viewWorkTime += Number(workTime)*1000*60*60;
        var hours,minute;
        hours = parseInt(viewWorkTime/1000/60/60);
        minute = parseInt(viewWorkTime/1000/60%60);
        viewWorkTime = hours+'时'+minute+'分';
        $('.workTime').html(viewWorkTime);
    }
}

function absence() {
    var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
                '<div class="weui-mask"></div>'+
                '<div class="weui-dialog">'+
                    '<div class="weui-dialog__hd"><strong class="weui-dialog__title">请假事由</strong></div>'+
                    '<div class="weui-dialog__bd">'+
                        '<div class="weui-cell" style="display:flex;">'+
                            '<div class="weui-cell__bd">'+
                                '<input style="border: 1px solid #d1d1d1;border-radius: 4px;" class="weui-input" name="absence" placeholder="">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="weui-dialog__ft">'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="cancelDialog();">否</a>'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="subAnsence();">是</a>'+
                    '</div>'+
                '</div>'+
            '</div>';
    $('body').append(str);
}

function subAnsence() {
    var description = $('input[name=absence]').val();
    if (!description) return wxToast('不能为空');
    var staff_sign_id;
    var user_id = sessionStorage.getItem('user_id');
    DATA.staffSignInfoArr.forEach(function(items){
        if (items.user_id == user_id) {
            staff_sign_id = items.id;
        }
    });
    wxLoadToast('正在提交');
    apiAjax({
        url: 'home/attendance/applyAbsence',
        type: 'post',
        data: {
            staff_sign_id: staff_sign_id,
            description: description
        }
    },function(res){
        $('#loadingToast').remove();
        wxToast(res.msg);
        cancelDialog();
    });
}

/**
 *  获取指派人列表
 */
function getDirectrListByLevel(){
    var user_id = sessionStorage.getItem('user_id');
    apiAjax({
        url: 'home/staff/getListByLevel',
        data: {
            level: getLevel(user_id)
        }
    },function(res){
        res.data.forEach(function(items,index){
            directorArr.push(items.user_name);
        });
    });
}

function safeDuty(){
    wxLoadToast('正在提交');
    apiAjax({
        url: 'home/attendance/hybridSafeDuty',
        type: 'post'
    },function(res){
        $('#loadingToast').remove();
        wxToast(res.msg);
        getSignInfo();
    });
}

function cusDuty(){
    wxLoadToast('正在提交');
    apiAjax({
        url: 'home/attendance/hybridCusDuty',
        type: 'post'
    },function(res){
        $('#loadingToast').remove();
        wxToast(res.msg);
        getSignInfo();
    });
}

function insideDuty() {
    wxLoadToast('正在提交');
    apiAjax({
        url: 'home/attendance/hybridInsideDuty',
        type: 'post'
    },function(res){
        $('#loadingToast').remove();
        wxToast(res.msg);
        getSignInfo();
    });
}

function confirmLeaveJob(cb){
    var result = confirm('确定下班？');
    if(result){
        cb();
    }
}

//获取位置信息
function getLocation(cb){
    const geolocation = new BMap.Geolocation();
    geolocation.getCurrentPosition(function(r){
        cb(r.point);
    });
}

/**
 *  签到
 *  0 -> 1
 */
function signIn(){
    wxLoadToast('正在提交');
    apiAjax({
        url: 'home/attendance/sign',
        data: {
            isNotApp: 1
        }
    },function(res){
        $('#loadingToast').remove();
        wxToast(res.msg);
        getSignInfo();
        getLocation(function(point){
            var gps = JSON.stringify(point);
            apiAjax({
                url: 'home/attendance/signGps',
                type: 'put',
                data: {
                    gps: gps
                }
            },function(){});
        });
    });
}

/**
 *  下班
 *  1 -> 0
 */
function signOut(){
    confirmLeaveJob(function(){
        wxLoadToast('正在提交');
        apiAjax({
            url: 'home/attendance/leave'
        },function(res){
            $('#loadingToast').remove();
            wxToast(res.msg);
            getSignInfo();
        });
    });
}

function recallWork(){
    var result = confirm('确定撤销上班？');
    if(result){
        wxLoadToast('正在提交');
        apiAjax({
            url: 'home/attendance/recall',
            type: 'delete'
        },function(res){
            $('#loadingToast').remove();
            wxToast(res.msg);
            getSignInfo();
        });
    }
}

function goOutDialog(){
    var mark = 0,director;
    directorArr.forEach(function(items,index) {
        if(items=='马颜春'){
            director = items;
            mark = 1;
        }
    });
    if(mark==0) director = directorArr[0];
    var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
                '<div class="weui-mask"></div>'+
                '<div class="weui-dialog">'+
                    '<div class="weui-dialog__hd"><strong class="weui-dialog__title">外出申请</strong></div>'+
                    '<div class="weui-dialog__bd">'+
                        '<div class="weui-cell" style="display:flex;">'+
                            '<div class="weui-cell__hd" style="width: 70px;text-align: left;"><label class="weui-label">指派人：</label></div>'+
                            '<div class="weui-cell__bd director" style="height: 16px;text-align: left;" onclick="directorListShow();">'+director+'</div>'+
                        '</div>'+
                        '<div class="weui-cell" style="display:flex;">'+
                            '<div class="weui-cell__hd" style="width: 70px;text-align: left;"><label class="weui-label">外出原因：</label></div>'+
                            '<div class="weui-cell__bd">'+
                                '<input style="border: 1px solid #d1d1d1;border-radius: 4px;" class="weui-input" name="reason" placeholder="">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="weui-dialog__ft">'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="cancelDialog();">否</a>'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="subGoOut();">是</a>'+
                    '</div>'+
                '</div>'+
            '</div>';
    $('body').append(str);
    return;


    // api.actionSheet({
    //     title: '选择指派人',
    //     cancelTitle: '取消',
    //     buttons: directorArr
    // }, function(ret, err) {
    //     var index = ret.buttonIndex;
    //     if(index<=directorArr.length){
    //         var director = directorArr[index-1];
    //         api.prompt({
    //             title: '外出理由',
    //             buttons: ['确定', '取消']
    //         }, function(ret, err) {
    //             var index = ret.buttonIndex;
    //             var text = ret.text;
    //             if(index==1){
    //                 if(text==''){
    //                     api.toast({
    //                         msg: "不能为空"
    //                     });
    //                     return;
    //                 }
    //                 api.showProgress({
    //                     title: '正在提交',
    //                     modal: true
    //                 });
    //                 apiAjax({
    //                     url: '/home/attendance/goOut',
    //                     type: 'put',
    //                     data: {
    //                         director: director,
    //                         reason: text
    //                     }
    //                 },function(res){
    //                     api.hideProgress();
    //                     api.toast({
    //                         msg: res.msg
    //                     });
    //                     getSignInfo();
    //                 });
    //             }
    //         });
    //     }
    // });
}

function directorListShow(){
    var director_list_arr = [];
    var defaultValue;
    directorArr.forEach(function(items,index){
        var obj = {};
        obj.label = items;
        obj.value = items;
        director_list_arr.push(obj);
        if(items=='马颜春') defaultValue = [items];
    });
    defaultValue = defaultValue?defaultValue:[directorArr[0]];
    weui.picker(director_list_arr, {
        defaultValue: defaultValue,
        onConfirm: function (result) {
            directorArr.forEach(function(items,index) {
                if(items==result[0]){
                    $('.director').html(items);
                }
            });
        }
    });
}

function cancelDialog(){
    $('#iosDialog1').remove();
}

function subGoOut(){
    var director = $('.director').text();
    var reason = $('input[name=reason]').val();
    const user_name = sessionStorage.getItem('user_name');
    if (director == user_name) {
        wxToast('指派人不能为自己');
        return;
    }
    wxLoadToast('正在提交');
    apiAjax({
        url: 'home/attendance/goOut',
        type: 'put',
        data: {
            director: director,
            reason: reason
        }
    },function(res){
        cancelDialog();
        $('#loadingToast').remove();
        wxToast(res.msg);
        getSignInfo();
    });
}

function backWork(){
    wxLoadToast('正在提交');
    apiAjax({
        url: 'home/attendance/outBack',
        type: 'put'
    },function(res){
        $('#loadingToast').remove();
        wxToast(res.msg);
        getSignInfo();
    });
}

function outLeave(){
    confirmLeaveJob(function(){
        wxLoadToast('正在提交');
        apiAjax({
            url: 'home/attendance/outLeave',
            type: 'put'
        },function(res){
            $('#loadingToast').remove();
            wxToast(res.msg);
            getSignInfo();
        });
    });
}

function overWorkStart(){
    wxLoadToast('正在提交');
    apiAjax({
        url: 'home/attendance/overWork',
        type: 'put'
    },function(res){
        $('#loadingToast').remove();
        wxToast(res.msg);
        getSignInfo();
        getLocation(function(point){
            var gps = JSON.stringify(point);
            apiAjax({
                url: 'home/attendance/overWorkGps',
                type: 'put',
                data: {
                    on_gps: gps
                }
            },function(){});
        });
    });
}

function overWorkEnd(){
    wxLoadToast('正在提交');
    apiAjax({
        url: 'home/attendance/endOverWork',
        type: 'put'
    },function(res){
        $('#loadingToast').remove();
        wxToast(res.msg);
        getSignInfo();
    });
}

function recallOverWork(){
    var result = confirm('确定撤销加班？');
    if(result){
        wxLoadToast('正在提交');
        apiAjax({
            url: 'home/attendance/recallOverWork',
            type: 'delete'
        },function(res){
            $('#loadingToast').remove();
            wxToast(res.msg);
            getSignInfo();
        });
    }
}

function transToPC(){
    sessionStorage.setItem('pc',1);
    window.location.href = 'https://os.langjie.com/home';
}

/*************************************************************************** */
$(function(){
    checkLogin(function(){
        getSignInfo();
        getMsg();
        getDirectrListByLevel();
        getMoreInfo();
    });
});

$(document).on('click','.weui-actionsheet__action',function(){
    $('.weui-actions_mask').remove();
});
$(document).on('click','.weui-actions_mask',function(){
    $('.weui-actions_mask').remove();
});

$(document).on('click','.weui-swiped-btn',function(e){
    var id = $(this).attr('data-id');
    var noti_client_mailId = $(this).attr('data-noti_client_mailId');
    var votes = $(this).attr('data-votes');
    var text = $(this).html();
    if(text=='已阅'){
        reply({
            id: id,
            noti_client_mailId: noti_client_mailId,
            vote: text
        });
    }else if(text=='选单'){
        var actions = [];
        votes.split(',').forEach(function(items,index){
            actions.push({
                text: items,
                onClick: function() {
                    $('.weui-actions_mask').remove();
                    reply({
                        id: id,
                        noti_client_mailId: noti_client_mailId,
                        vote: items
                    });
                }
            });
        });
        $.actions({
            actions: actions
        });
    }else if(text=='回复'){
        var dialog = new auiDialog({});
        dialog.alert({
            title:"回复",
            msg:'<textarea style="border: 1px solid #eee;height: 80px;" name="reply" placeholder="请输入回复信息" value=""></textarea>',
            buttons:['取消','确定']
        },function(ret){
            if(ret&&ret.buttonIndex==2){
                var atReply = $('textarea[name=reply]').val();
                reply({
                    id: id,
                    noti_client_mailId: noti_client_mailId,
                    atReply: atReply
                });
            }
        });
    }
});

function reply(params){
    if(!params.vote&&!params.atReply){
        alert('回复不能为空');
        return;
    }
    apiAjax({
        url: 'home/notiPost/fromCenterUpdate',
        type: 'put',
        data: params
    },function(result){
        wxToast(result.msg);
        getMsg();
    });
}

function getMsg() {
    apiAjax({
        url: 'home/notiPost/fromCenterList'
    }, function(result) {
        $('.weui-cell_swiped').remove();
        var dataStore = result.data;
        var str = '';
        for (var i = 0; i < dataStore.length; i++) {
            var item = dataStore[i];
            var title = item.NotiPost.title;
            var content = item.NotiPost.content;
            var len;
            try{
                len = item.NotiPost.votes.split(',').length;
            }catch(e){
                len = 0;
            }
            var in_str = '';
            if(len==1){
                if(!dataStore[i].vote){
                    // 已阅
                    in_str += '<a style="display: flex;align-items: center;" '+
                                'data-id="'+item.id+'" data-noti_client_mailId="'+item.NotiPost.mailId+'" '+
                                'class="weui-swiped-btn weui-swiped-btn_default close-swipeout" '+
                                'href="javascript:">已阅</a>';
                }
            }else if(len>1){
                if(!dataStore[i].vote){
                    // 选单
                    in_str += '<a data-votes="'+item.NotiPost.votes+'" data-id="'+item.id+'" data-noti_client_mailId="'+item.NotiPost.mailId+'" style="display: flex;align-items: center;" class="weui-swiped-btn weui-swiped-btn_default close-swipeout" href="javascript:">选单</a>';
                }
            }
            if(dataStore[i].atMe&&!dataStore[i].atReply){
                // 回复
                in_str += '<a data-id="'+item.id+'" data-noti_client_mailId="'+item.NotiPost.mailId+'" style="display: flex;align-items: center;" class="weui-swiped-btn weui-swiped-btn_warn delete-swipeout" href="javascript:">回复</a>';
            }
            str += '<div class="weui-cell weui-cell_swiped" data-locationId="'+item.NotiPost.locationId+'" data-title="'+title+'" data-affairId="'+item.NotiPost.noti_client_affair_group_uuid+'" onclick="msgClick(this);">'+
                        '<div class="weui-cell__bd" style="transform: translate3d(0px, 0px, 0px);">'+
                            '<div class="weui-cell">'+
                                '<div class="weui-cell__bd">'+
                                    '<p>'+title+'</p>'+
                                    '<p>'+content+'</p>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                        '<div class="weui-cell__ft">'+in_str+'</div>'+
                '</div>';
        }
        $('.aui-media-list').append(str);
        setTimeout(function(){
            $('.weui-cell_swiped').swipeout();
        },200);
    });
}

function msgClick(obj) {
    var sty = $(obj).find('.weui-cell__bd').css('transform');
    if(sty=='matrix(1, 0, 0, 1, 0, 0)'){
        var affairId = $(obj).attr('data-affairId');
        var title = $(obj).attr('data-title');
        var locationId = $(obj).attr('data-locationId');
        // window.location.href = route('m/home/affair?affairId='+affairId+'&title='+title+'&locationId='+locationId);
        window.location.href = 'https://os.langjie.com/m/home/affair?affairId='+affairId+'&title='+title+'&locationId='+locationId;
    }else{
        $('.weui-cell_swiped').swipeout('close');
    }
}

function more() {
    if($('.more').css('display')=='none'){
        $('.more').slideDown();
        $('.moreBar').text('收起');
    }else{
        $('.more').slideUp();
        $('.moreBar').text('更多');
    }
}