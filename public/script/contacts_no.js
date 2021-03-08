var popup,default_start_time,isToBottom = true;
var keywords = '',filter = '',page = 1,num = 10;
/**
 * 初始化操作
 */
apiReady(function(){
    popup = new auiPopup();
    api.addEventListener({
        name:'scrolltobottom',
        extra:{
            threshold: 10    //设置距离底部多少距离时触发，默认值为0，数字类型
        }
    }, function(ret, err){
        getList();
    });
    triggerCheckLogin();

    api.addEventListener({
        name: 'frame1'
    }, function(ret, err) {
        page = 1;
        keywords = '';
        default_start_time = null;
        $('#search-input').val('');
        $('.aui-media-list').html('');
        triggerCheckLogin();
    });
});
function triggerCheckLogin(){
    checkLogin(function(){
        init();
    });
}

/**
 * 刷新
 */
apiRefresh(function(){
    page = 1;
    keywords = '';
    default_start_time = null;
    $('#search-input').val('');
    $('.aui-media-list').html('');
    triggerCheckLogin();
});

/**
 * 请求列表数据
 */
function init(){
    if(!localStorage.getItem('username')) return;
    apiAjax({
        url: '/hybrid/order/list',
        data: {
            user_id: localStorage.getItem('user_id'),
            page: page,
            num: num,
            keywords: keywords,
            filter: filter
        }
    },function(result){
        isToBottom = true;
        if(result.data[0]==null){
            if(page==1){
                $('.aui-media-list').html('');
            }else{
                page--;
            }
            api.toast({
                msg: '没有更多了'
            });
        }else{
            render(result.data);
        }
    });
}

/**
 * 渲染列表
 */
function render(data){
    if(page==1){
        $('.aui-media-list').html('');
    }
    var str = '';
    for (var i = 0; i < data.length; i++) {
        if(default_start_time!=dateTime(data[i].incoming_time)){
            default_start_time = dateTime(data[i].incoming_time);
            str += '<li class="aui-list-header date_line">'+dateTime(data[i].incoming_time)+'</li>';
        }
        var content = data[i].content?data[i].content:'';
        var demand = data[i].demand?data[i].demand:'';
        str += '<li class="aui-list-item aui-list-item-middle" tapmode data-id="'+data[i].id+'" onclick="orderInfo(this);">'+
                    '<div class="aui-media-list-item-inner">'+
                        '<div class="aui-list-item-inner aui-list-item-arrow">'+
                            '<div class="aui-list-item-text">'+data[i].contact_name+'（'+data[i].contact_unit+'）'+
                                '<div class="aui-list-item-right">'+data[i].state+'</div>'+
                            '</div>'+
                            '<div class="aui-list-item-text">'+
                                '<div style="width: 250px;min-height: 26px;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">'+demand+'</div>'+
                                '<div class="aui-list-item-right">'+hoursTime(data[i].incoming_time)+'</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</li>';
    }
    if(page==1){
        $('.aui-media-list').html(str);
    }else{
        $('.aui-media-list').append(str);
    }
    api.parseTapmode();
}

/**
 * 跳转到指定联系单
 */
function orderInfo(obj){
    var id = $(obj).attr('data-id');
    api.openWin({
        name: 'order_info',
        url: '../html/order_info_win.html',
        pageParam: {
            id: id
        }
    });
}


/**
 * 右上角筛选
 */
function showPopup(){
    popup.init({
        frameBounces:false,
        location:'top-right',
        buttons:[{
            text:'全部',
            value:''
        },{
            text:'待提交',
            value:'待提交'
        },{
            text:'已提交',
            value:'已提交'
        },{
            text:'已关闭',
            value:'已关闭'
        }],
    },function(ret){
        default_start_time = null;
        filter = ret.buttonValue;
        page = 1;
        init();
    });
}

/**
 * 获取数据
 */
function getList(){
    if(isToBottom){
        isToBottom = false;
        page++;
        init();
    }
}

/**
 * 搜索界面功能初始化
 */
var searchBar = document.querySelector(".aui-searchbar");
var searchBarInput = document.querySelector(".aui-searchbar input");
var searchBarBtn = document.querySelector(".aui-searchbar .aui-searchbar-btn");
var searchBarClearBtn = document.querySelector(".aui-searchbar .aui-searchbar-clear-btn");
if(searchBar){
    searchBarInput.onclick = function(){
        searchBarBtn.style.marginRight = 0;
    }
    searchBarInput.oninput = function(){
        if(this.value.length){
            searchBarClearBtn.style.display = 'block';
            searchBarBtn.classList.add("aui-text-info");
            searchBarBtn.textContent = "搜索";
        }else{
            searchBarClearBtn.style.display = 'none';
            searchBarBtn.classList.remove("aui-text-info");
            searchBarBtn.textContent = "取消";
        }
    }
}
searchBarClearBtn.onclick = function(){
    this.style.display = 'none';
    searchBarInput.value = '';
    searchBarBtn.classList.remove("aui-text-info");
    searchBarBtn.textContent = "取消";
}
searchBarBtn.onclick = function(){
    keywords = searchBarInput.value;
    if(keywords.length){
        searchBarInput.blur();
        default_start_time = null;
        page = 1;
        init();
    }else{
        this.style.marginRight = "-"+this.offsetWidth+"px";
        searchBarInput.value = '';
        searchBarInput.blur();
    }
}
