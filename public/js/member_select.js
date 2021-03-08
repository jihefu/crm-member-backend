var startx
var endx
function start(e){
    startx= e.changedTouches[0].pageX;
}
function touch(e){
    endx=e.changedTouches[0].pageX;
    if(endx-startx>0){
        //alert("you")
        if(e.target.className=="cd_name"){
            $(e.target.parentElement.parentElement.parentElement).addClass("cd_right")
        }else if(e.target.className=="weui-cell__ft"){
            $(e.target.parentElement.parentElement).addClass("cd_right")
        }
    }else if(endx-startx<-40){
        //alert("zuo")
        if(e.target.className=="cd_name"){
            $(e.target.parentElement.parentElement.parentElement).removeClass("cd_right")
            $(e.target.parentElement.parentElement.parentElement).addClass("cd_left")
        }else if(e.target.className=="weui-cell__ft"){
            $(e.target.parentElement.parentElement).removeClass("cd_right")
            $(e.target.parentElement.parentElement).addClass("cd_left")
        }
    }
}


function cd_modal(){
    var keyword = $('input[name=search]').val();
    if(keyword==''){
        wxToast('输入不能为空');
        $('input[name=search]').focus();
        return;
    }
    wxLoadToast('正在搜索');
    $.ajax({
        url:route('m/admin_ajax/member/search_member'),
        type:'get',
        dataType:'json',
        timeout:30000,
        data: {
            keyword: keyword
        },
        success:function(res){
            log(res);
            $('#loadingToast').remove();
            if(res&&res.code==-1){
                wxToast(res.msg);
            }else if(res&&res.code==-100){
                reload(res.msg);
            }else if(res&&res.code==200){
                var str = '';
                for (var i = 0; i < res.data.length; i++) {
                    str += '<label class="weui-cell weui-check__label">'+
                                '<div class="weui-cell__hd">'+
                                    '<input type="checkbox" class="weui-check" name=checkbox1>'+
                                    '<i class="weui-icon-checked"></i>'+
                                '</div>'+
                                '<div class="weui-cell__bd">'+
                                    '<p>'+res.data[i].name+':'+res.data[i].phone+'</p>'+
                                '</div>'+
                            '</label>';
                };
                $('#cd_xian').html(str);
                $("#cd_modal").addClass("cd_in").removeClass("cd_hide");
            }
        }
    });
}

function cd_select() {
    $("#cd_modal").addClass("cd_hide").removeClass("cd_in");
    $('input:checked').each(function(i){
       var str=$(this).parent()[0].nextElementSibling.children[0].innerHTML;
        var arr=str.split(":");
        var html =`
                 <div class="weui-cell weui-cell_swiped">
            <div class="weui-cell__bd" ontouchstart="start(event)" ontouchmove="touch(event)">
                <div class="weui-cell">
                    <div class="weui-cell__bd">
                        <p class="cd_name">${arr[0]}</p>
                    </div>
                    <div class="weui-cell__ft">${arr[1]}</div>
                </div>
            </div>

            <div class="weui-cell__ft">
                <a class="weui-swiped-btn weui-swiped-btn_warn" onclick="cd_delete(event)">删除</a>
            </div>
        </div>
        `;
        var div = document.createElement("div");
            div.innerHTML=html;
        var isExist=false;
                 $(".cd_name").each(function(j){
                     if(this.innerHTML==arr[0]&&this.parentElement.nextElementSibling.innerHTML==arr[1]){
                         isExist=true;
                     }
                 })
            if(!isExist){
                var div = document.createElement("div");
                div.innerHTML=html;
                $(".cd_select_box")[0].appendChild(div.children[0]);
                isExist=false;
            }


    })
}
function cd_delete(e){
    $(".cd_select_box")[0].removeChild($(e.target).parent().parent()[0]);
}


//全选
    var num_click=0
function cd_all(){
    if(num_click==0){
        $("input[name=checkbox1]").each(function(o){
           this.checked=true
        })
        num_click=1;
    }else if(num_click==1){
        $("input[name=checkbox1]").each(function(o){
            this.checked=false;
        })
        num_click=0;
    }
}

function sub(){
    var user_arr = [];
    var el = $('.cd_select_box .weui-cell_swiped');
    var s_val = $('select[name=select1]').val();
    if(s_val!=''&&el.length!=0){
        wxToast('不能同时选择多种类型');
    }else if(s_val!=''&&el.length==0){
        sessionStorage.setItem("user_key",s_val);
        window.location.href = mRoute('admin/member_send');
    }else if(s_val==''&&el.length!=0){
        for (var i = 0; i < el.length; i++) {
            var user_obj = {};
            user_obj.name = el.eq(i).find('.cd_name').html();
            user_obj.phone = el.eq(i).find('.weui-cell__ft').html();
            user_arr.push(user_obj);
        };
        var user_key = JSON.stringify(user_arr);
        sessionStorage.setItem("user_key",user_key);
        window.location.href = mRoute('admin/member_send');
    }else{
        wxToast('请指定会员');
    }
}