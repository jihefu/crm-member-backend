var data;
var directorArr;
var timer;
getSignInfo();
getMoreInfo();
getDirectrListByLevel();
if(hasMobileStaffArr.indexOf(user_id)==-1){
    $('.appSign').html('<div>'+
            '<p>进度警告</p>'+
            '<p class="warnProgress"></p>'+
        '</div><div></div><div></div><div></div>');
}

/**
 * 获取更多信息
 */
function getMoreInfo(){
    $.ajax({
        url:route('m/attendance/onlineAssessment'),
        type:'get',
        data: {
            keywords: user_name,
            filter: JSON.stringify({
                date: '当月'
            })
        },
        dataType:'json',
        timeout:30000,
        success:function(res){
            for(var key in res.data.data[0]){
                $('.'+key).text(res.data.data[0][key]);
                $('.'+key).css('color','#999');
            }
        }
    });
}

/**
 *  获取签到信息
 */
function getSignInfo(){
    $.ajax({
        url:route('m/attendance/signInfo'),
        type:'get',
        dataType:'json',
        timeout:30000,
        success:function(res){
            data = res.data;
            render();
        }
    });
}

/**
 *  获取指派人列表
 */
function getDirectrListByLevel(){
    $.ajax({
        url:route('m/attendance/getDirectorListByLevel'),
        type:'get',
        dataType:'json',
        timeout:30000,
        data: {
            level: getLevel(user_id)
        },
        success:function(res){
            directorArr = res.data;
        }   
    });
}

/**
 *  渲染界面
 */
function render(){
    clearInterval(timer);
    $('.workTime').html(data.workTime);
    $('.overWorkTime').html(data.overWorkTime);
    $('.onDutyTime').html(data.onDutyTime);
    $('.total').html(data.total);
    $('.notUpdate').html(data.notUpdate);
    showWorkTime(data.workTime);
    if(data.status==0){
        var str = '<div class="sign-checkin" onclick="signIn()">'+
                    // '<p class="iconfont icon-dingwei"></p>'+
                    '<p>上班</p>'+
                '</div>'+
                '<div class="weui-form-preview__ft" style="position: fixed;bottom: 0px;width: 100%;text-align: center;">'+
                    '<a class="weui-form-preview__btn weui-form-preview__btn_default" href="javascript:" onclick="absence()">请假</a>'+
                '</div>';
        $('.sign-wrap').html(str);
        $('.sign-wrap').css('justify-content','center');
    }else if(data.status==1){
        var onCusDutyStaff = data.onCusDutyStaff?data.onCusDutyStaff:'';
        var onDutyStaff = data.onDutyStaff?data.onDutyStaff:'';
        var onDutyInsideStaff = data.onDutyInsideStaff?data.onDutyInsideStaff:'';
        var str =   '<div class="wrap-duty" style="color: #999;">'+
                        '<label onclick="safeDuty();">'+
                            '<span>安卫：</span>'+
                            '<span>'+onDutyStaff+'</span>'+
                        '</label>'+
                        '<label onclick="cusDuty();" style="color: #999;">'+
                            '<span>客服：</span>'+
                            '<span>'+onCusDutyStaff+'</span>'+
                        '</label>'+
                        '<label onclick="insideDuty();" style="color: #999;">'+
                            '<span>内勤：</span>'+
                            '<span>'+onDutyInsideStaff+'</span>'+
                        '</label>'+
                    '</div>'+
                    '<div class="sign-checkin" onclick="signOut()">下班</div>'+
                    '<div class="weui-form-preview__ft b-act">'+
                        '<button type="submit" class="weui-form-preview__btn weui-form-preview__btn_default" onclick="goOutDialog();" href="javascript:">登记外出</button>'+
                        '<a class="weui-form-preview__btn weui-form-preview__btn_default" href="javascript:" onclick="recall();">撤销上班</a>'+
                    '</div>';
        $('.sign-wrap').html(str);
        $('.sign-wrap').css('justify-content','space-between');
    }else if(data.status==2){
        var onCusDutyStaff = data.onCusDutyStaff?data.onCusDutyStaff:'';
        var onDutyStaff = data.onDutyStaff?data.onDutyStaff:'';
        var onDutyInsideStaff = data.onDutyInsideStaff?data.onDutyInsideStaff:'';
        var str =   '<div class="wrap-duty" style="color: #999;">'+
                        '<label onclick="safeDuty();">'+
                            '<span>安卫：</span>'+
                            '<span>'+onDutyStaff+'</span>'+
                        '</label>'+
                        '<label onclick="cusDuty();" style="color: #999;">'+
                            '<span>客服：</span>'+
                            '<span>'+onCusDutyStaff+'</span>'+
                        '</label>'+
                        '<label onclick="insideDuty();" style="color: #999;">'+
                            '<span>内勤：</span>'+
                            '<span>'+onDutyInsideStaff+'</span>'+
                        '</label>'+
                    '</div>'+
                    '<div class="sign-checkin" onclick="outLeave()">下班</div>'+
                    '<div class="weui-form-preview__ft b-act">'+
                        '<a class="weui-form-preview__btn weui-form-preview__btn_default" href="javascript:" onclick="outBack();">返岗</a>'+
                    '</div>';
        $('.sign-wrap').html(str);
        $('.sign-wrap').css('justify-content','space-between');
    }else if(data.status==3){
        var str = '<div class="sign-checkin" onclick="overWorkIn()">'+
                    // '<p class="iconfont icon-dingwei"></p>'+
                    '<p>加班</p>'+
                '</div>';
        $('.sign-wrap').html(str);
        $('.sign-wrap').css('justify-content','center');
    }else if(data.status==4){
        var str =   '<div></div>'+
                    '<div class="sign-checkin" onclick="overWorkOut()">结束加班</div>'+
                    '<div class="weui-form-preview__ft b-act">'+
                        '<a class="weui-form-preview__btn weui-form-preview__btn_default" href="javascript:" onclick="recallOverWork();">撤销加班</a>'+
                    '</div>';
        $('.sign-wrap').html(str);
        $('.sign-wrap').css('justify-content','space-between');
    }
}

function showWorkTime(workTime){
    if(data.status==1||data.status==2){
        show();
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
                            // '<div class="weui-cell__hd" style="width: 70px;text-align: left;"><label class="weui-label">外出原因：</label></div>'+
                            '<div class="weui-cell__bd">'+
                                '<input style="border: 1px solid #d1d1d1;border-radius: 4px;" class="weui-input" name="absence" placeholder="">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="weui-dialog__ft">'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="cancelDialog();">否</a>'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="subAbsence();">是</a>'+
                    '</div>'+
                '</div>'+
            '</div>';
    $('body').append(str);
}

function subAbsence() {
    var description = $('input[name=absence]').val();
    if (!description) return wxToast('不能为空');
    var staff_sign_id;
    data.staffSignInfoArr.forEach(function(items){
        if (items.user_id == user_id) {
            staff_sign_id = items.id;
        }
    });
    wxLoadToast('正在提交');
    $.ajax({
        url:route('m/attendance/applyAbsence'),
        type:'post',
        dataType:'json',
        timeout:30000,
        data: {
            staff_sign_id: staff_sign_id,
            description: description
        },
        success:function(res){
            $('#loadingToast').remove();
            cancelDialog();
            wxToast(res.msg);
        }
    });
}

/**
 *  获取当前位置信息
 */
function getLocation(cb){
    return;
    var geolocation = new BMap.Geolocation();
    geolocation.getCurrentPosition(function(r){
        cb(r.point);
    });
}

/**
 *  点击安卫值日
 */
function safeDuty(){
    wxLoadToast('正在提交');
    $.ajax({
        url:route('m/attendance/safeDuty'),
        type:'post',
        dataType:'json',
        timeout:30000,
        success:function(res){
            $('#loadingToast').remove();
            if(res.code==-1){
                wxToast(res.msg);
            }else{
                getSignInfo();
            }
        }
    });
}

/**
 *  点击客服值日
 */
function cusDuty(){
    wxLoadToast('正在提交');
    $.ajax({
        url:route('m/attendance/cusDuty'),
        type:'post',
        dataType:'json',
        timeout:30000,
        success:function(res){
            $('#loadingToast').remove();
            if(res.code==-1){
                wxToast(res.msg);
            }else{
                getSignInfo();
            }
        }
    });
}

/**
 *  点击内勤值日
 */
function insideDuty(){
    wxLoadToast('正在提交');
    $.ajax({
        url:route('m/attendance/insideDuty'),
        type:'post',
        dataType:'json',
        timeout:30000,
        success:function(res){
            $('#loadingToast').remove();
            if(res.code==-1){
                wxToast(res.msg);
            }else{
                getSignInfo();
            }
        }
    });
}

/**
 *  外出dialog框
 */
function goOutDialog(){
    var mark = 0,director;
    directorArr.forEach(function(items,index) {
        if(items.user_name=='马颜春'){
            director = items.user_name;
            mark = 1;
        }
    });
    if(mark==0) director = directorArr[0].user_name;
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
}

/**
 *  点击指派人控件
 */
function directorListShow(){
    var director_list_arr = [];
    var defaultValue;
    directorArr.forEach(function(items,index){
        var obj = {};
        obj.label = items.user_name;
        obj.value = items.user_id;
        director_list_arr.push(obj);
        if(items.user_name=='马颜春') defaultValue = [items.user_id];
    });
    defaultValue = defaultValue?defaultValue:[directorArr[0].user_id];
    weui.picker(director_list_arr, {
        defaultValue: defaultValue,
        onConfirm: function (result) {
            directorArr.forEach(function(items,index) {
                if(items.user_id==result[0]){
                    $('.director').html(items.user_name);
                }
            });
        }
    });
}

/**
 *  撤销上班dialog框
 */
function recall(){
    var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
                '<div class="weui-mask"></div>'+
                '<div class="weui-dialog">'+
                    '<div class="weui-dialog__hd"><strong class="weui-dialog__title">提醒</strong></div>'+
                    '<div class="weui-dialog__bd">确定撤销上班？</div>'+
                    '<div class="weui-dialog__ft">'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="cancelDialog();">否</a>'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="recallWork();">是</a>'+
                    '</div>'+
                '</div>'+
            '</div>';
    $('body').append(str);
}

/**
 *  撤销加班dialog框
 */
function recallOverWork(){
    var str = '<div class="js_dialog" id="iosDialog1" style="opacity: 1;">'+
                '<div class="weui-mask"></div>'+
                '<div class="weui-dialog">'+
                    '<div class="weui-dialog__hd"><strong class="weui-dialog__title">提醒</strong></div>'+
                    '<div class="weui-dialog__bd">确定撤销加班？</div>'+
                    '<div class="weui-dialog__ft">'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" onclick="cancelDialog();">否</a>'+
                        '<a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" onclick="subRecallWork();">是</a>'+
                    '</div>'+
                '</div>'+
            '</div>';
    $('body').append(str);
}

/**
 *  提交撤销上班
 */
function recallWork(){
    $.ajax({
        url:route('m/attendance/recall'),
        type:'delete',
        dataType:'json',
        timeout:30000,
        success:function(res){
            $('#loadingToast').remove();
            cancelDialog();
            if(res.code==-1){
                window.location.reload();
            }else{
                getSignInfo();
            }
        }
    });
}

/**
 *  提交撤销加班
 */
function subRecallWork(){
    $.ajax({
        url:route('m/attendance/recallOverWork'),
        type:'delete',
        dataType:'json',
        timeout:30000,
        success:function(res){
            $('#loadingToast').remove();
            cancelDialog();
            if(res.code==-1){
                window.location.reload();
            }else{
                getSignInfo();
            }
        }
    });
}

function cancelDialog(){
    $('#iosDialog1').remove();
}

/**
 *  签到
 *  0 -> 1
 */
function signIn(){
    wxLoadToast('正在提交');
    $.ajax({
        url:route('m/attendance/sign'),
        type:'get',
        dataType:'json',
        timeout:30000,
        data:{
            isNotApp: 1
            // "gps": gps
        },
        success:function(res){
            $('#loadingToast').remove();
            if(res.code==-1){
                window.location.reload();
            }else{
                getSignInfo();
                getLocation(function(gps){
                    gps = JSON.stringify(gps);
                    $.ajax({
                        url:route('m/attendance/signGps'),
                        type:'put',
                        dataType:'json',
                        timeout:30000,
                        data:{
                            "gps": gps
                        },
                        success:function(res){

                        }
                    });
                });
            }
        }
    });
}

/**
 *  下班
 *  1 -> 0
 */
function signOut(){
    wxLoadToast('正在提交');
    $.ajax({
        url:route('m/attendance/leave'),
        type:'get',
        dataType:'json',
        timeout:30000,
        success:function(res){
            $('#loadingToast').remove();
            if(res.code==-1){
                window.location.reload();
            }else{
                getSignInfo();
            }
        }
    });
}

/**
 *  提交外出申请单
 *  1 -> 2
 */
function subGoOut(){
    var reason = $('input[name=reason]').val();
    var director = $('.director').html();
    if(reason==''){
        wxToast('理由不能为空');
        return;
    }
    if (user_name == director) {
        wxToast('指派人不能为自己');
        return;
    }
    wxLoadToast('正在提交');
    $.ajax({
        url:route('m/attendance/goOut'),
        type:'put',
        dataType:'json',
        timeout:30000,
        data: {
            director: director,
            reason: reason
        },
        success:function(res){
            $('#loadingToast').remove();
            cancelDialog();
            if(res.code==-1){
                window.location.reload();
            }else{
                getSignInfo();
            }
        }
    });
}

/**
 *  返岗
 *  2 -> 1
 */
function outBack(){
    $.ajax({
        url:route('m/attendance/outBack'),
        type:'put',
        dataType:'json',
        timeout:30000,
        success:function(res){
            $('#loadingToast').remove();
            cancelDialog();
            if(res.code==-1){
                window.location.reload();
            }else{
                getSignInfo();
            }
        }
    });
}

/**
 *  外出下班
 *  2 -> 0
 */
function outLeave(){
    $.ajax({
        url:route('m/attendance/outLeave'),
        type:'put',
        dataType:'json',
        timeout:30000,
        success:function(res){
            $('#loadingToast').remove();
            cancelDialog();
            if(res.code==-1){
                window.location.reload();
            }else{
                getSignInfo();
            }
        }
    });
}

/**
 *  加班
 *  3 —> 4
 */
function overWorkIn(){
    wxLoadToast('正在提交');
    $.ajax({
        url:route('m/attendance/overWork'),
        type:'put',
        dataType:'json',
        timeout:30000,
        data:{
            // "on_gps": gps
        },
        success:function(res){
            $('#loadingToast').remove();
            if(res.code==-1){
                window.location.reload();
            }else{
                getSignInfo();
                getLocation(function(gps){
                    gps = JSON.stringify(gps);
                    $.ajax({
                        url:route('m/attendance/overWorkGps'),
                        type:'put',
                        dataType:'json',
                        timeout:30000,
                        data:{
                            "on_gps": gps
                        },
                        success:function(res){

                        }
                    });
                });
            }
        }
    });
}

/**
 *  结束加班
 *  4 -> 3
 */
function overWorkOut(){
    wxLoadToast('正在提交');
    // getLocation(function(gps){
        // gps = JSON.stringify(gps);
        $.ajax({
            url:route('m/attendance/endOverWork'),
            type:'put',
            dataType:'json',
            timeout:30000,
            data:{
                // "off_gps": gps
            },
            success:function(res){
                $('#loadingToast').remove();
                if(res.code==-1){
                    window.location.reload();
                }else{
                    getSignInfo();
                }
            }
        });
    // });
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