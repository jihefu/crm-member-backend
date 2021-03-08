apiReady(function(){
    $('.name').click(function(){
        triggerCheckLogin();
    });
    triggerCheckLogin();

    api.addEventListener({
        name: 'frame3'
    }, function(ret, err) {
        triggerCheckLogin();
    });
});

function triggerCheckLogin(){
    checkLogin(function(){
        $('.name').text(localStorage.getItem('username'));
    });
}

function logout(){
    if(!localStorage.getItem('token')) return;
    var dialog = new auiDialog({});
    dialog.alert({
        title:"提示",
        msg:'确定退出',
        buttons:['取消','确定']
    },function(ret){
        if(ret&&ret.buttonIndex==2){
            apiAjax({
                url: '/hybrid/user/logout',
                type: 'delete',
                data: {
                    self_phone: localStorage.getItem('phone')
                }
            },function(result){

            });
            localStorage.removeItem('username');
            localStorage.removeItem('phone');
            localStorage.removeItem('user_id');
            localStorage.removeItem('token');
            //群发execScript需要更新登陆的页面
            updateLoginStatus();
        }
    });
}
