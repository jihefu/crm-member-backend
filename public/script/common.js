var version = '1.2.0';
/**
 * 路由配置
 */
function route(url){
    // return 'https://os.langjie.com'+url;
    return 'http://192.168.50.230:8090'+url;
}

/**
 * log
 */
function log(data){
    data = typeof(data) == 'object'?JSON.stringify(data,null,4):data;
    alert(data);
}

/**
 * 加载完成（取消300ms延迟）
 */
function apiReady(cb){
    apiready = function () {
        api.parseTapmode();
        cb();
    }
}

/**
 * 刷新初始化
 */
function apiRefresh(cb) {
    var pullRefresh = new auiPullToRefresh({
        container: document.querySelector('.aui-refresh-content'),
        triggerDistance: 150
    },function(ret){
        if(ret.status=="success"){
            setTimeout(function(){
                pullRefresh.cancelLoading();
                api.toast({
                    msg: '刷新成功'
                });
                cb();
            },1500);
        }
    });
}

/**
 * 封装ajax
 */
function apiAjax(option,cb){
    // option.data.self_user_id = localStorage.getItem('user_id');
    // option.data.self_phone = localStorage.getItem('phone');
    var token = localStorage.getItem('token');
    $.ajax({
        url:route(option.url),
        type:option.type?option.type:'get',
        beforeSend: function(request){
            request.setRequestHeader('token',token);
            request.setRequestHeader('version',version);
        },
        dataType:'json',
        timeout:30000,
        data: option.data,
        success:function(res){
    		cb(res);
        },
        error: function(err){
            try{
                api.alert({
                    title: '提醒',
                    msg: err.responseJSON.msg
                });
            }catch(e){

            }
        }
    });
}

/**
 * 检查是否登陆
 */
function checkLogin(cb){
    if(localStorage.getItem('token')){
        cb();
    }else{
        login(function(){
            cb();
        });
    }
}
function login(cb){
    if(localStorage.getItem('token')) return;
    if($('input[name=username]').length) return;
    var dialog = new auiDialog({});
    dialog.alert({
        title:"用户登陆",
        msg:'<input class="c_input" type="text" name="username" placeholder="请输入姓名" value="" />'+
            '<input class="c_input" type="password" name="password" placeholder="请输入密码" value="" />'+
            '<input class="c_input" type="text" name="phone" placeholder="请输入本机号码" value="" />',
        buttons:['取消','确定']
    },function(ret){
        if(ret&&ret.buttonIndex==2){
            var username = $('input[name=username]').val();
            var password = $('input[name=password]').val();
            var phone = $('input[name=phone]').val();
            if(username==''||password==''||phone==''){
                api.toast({
                    msg: '输入不能为空！'
                });
                return;
    		    }
            api.showProgress({
                title: '正在登陆',
                text: '',
                modal: true
            });
            apiAjax({
                url: '/hybrid/user/login',
                data: {
                    username: username,
                    password: password,
                    phone: phone,
                }
            },function(res){
                api.hideProgress();
                api.toast({
                    msg: res.msg
                });
                if(res.code==200){
                    localStorage.setItem('username', res.data[0].user_name);
                    localStorage.setItem('phone', phone);
                    localStorage.setItem('user_id', res.data[0].user_id);
                    localStorage.setItem('token', res.data[0].token);
                    cb();
                    //群发execScript需要更新登陆的页面
                    updateLoginStatus();
                }
            });
        }
    });
}

function updateLoginStatus(){
    var frameName = ['frame1','frame2','frame3'];
    frameName.forEach(function(items,index){
        api.execScript({
            frameName: frameName[index],
            script: 'window.location.reload();'
        });
    });
}

/**
 * 2018-03-05 10:31:22
 */
function time(t){
    if(t){
    	  if(t=='0000-00-00') return t;
        var date = new Date(t);
    }else{
        var date = new Date();
    }
    var yy = date.getFullYear();
    var MM = date.getMonth()+1;
    var dd = date.getDate();
    if(date.getHours()<10){
        var HH = '0'+date.getHours();
    }else{
        var HH = date.getHours();
    }
    if(date.getMinutes()<10){
        var mm = '0'+date.getMinutes();
    }else{
        var mm = date.getMinutes();
    }
    if(date.getSeconds()<10){
        var ss = '0'+date.getSeconds();
    }else{
        var ss = date.getSeconds();
    }
    if(MM<10) MM = '0'+MM;
    if(dd<10) dd = '0'+dd;
    var time = yy + '-' + MM + '-' + dd +' '+HH+':'+mm+':'+ss;
    return time;
}

/**
 * 2018-03-05
 */
function dateTime(t){
    if(t){
       	if(t=='0000-00-00') return t;
        var date = new Date(t);
    }else{
        var date = new Date();
    }
    var yy = date.getFullYear();
    var MM = date.getMonth()+1;
    var dd = date.getDate();
    if(MM<10) MM ='0'+MM;
    if(dd<10) dd ='0'+dd;
    var time = yy + '-' + MM + '-' + dd;
    return time;
}

/**
 * 10:31:22
 */
function hoursTime(t){
    if(t){
    	  if(t=='0000-00-00') return t;
        var date = new Date(t);
    }else{
        var date = new Date();
    }
    if(date.getHours()<10){
        var HH = '0'+date.getHours();
    }else{
        var HH = date.getHours();
    }
    if(date.getMinutes()<10){
        var mm = '0'+date.getMinutes();
    }else{
        var mm = date.getMinutes();
    }
    if(date.getSeconds()<10){
        var ss = '0'+date.getSeconds();
    }else{
        var ss = date.getSeconds();
    }
    var time = HH+':'+mm+':'+ss;
    return time;
}
