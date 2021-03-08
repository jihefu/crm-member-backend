var affairInfo;
apiReady(function(){
    api.addEventListener({
        name: 'responseAffairClick'
    }, function(ret, err) {
        $('.renderAdd').remove();
        getAllStaff(ret.value.team);
        affairInfo = ret.value;
        //给摘要页面，消息列表页面，发送消息页面发送通知
        // alert(JSON.stringify(ret.value));
    });
});

function votesMore(obj){
    $(obj).hide();
    $('.votes-hide').removeClass('votes-hide');
}

function atMore(obj){
    $(obj).hide();
    $('.at-hide').removeClass('at-hide');
}

/**
 * 获取所有员工
 */
function getAllStaff(team){
    apiAjax({
        url: '/home/staff/all'
    },function(res){
        var staffMap = {};
        var selfUserId = localStorage.getItem('user_id');
        res.data.forEach(function(items,index){
            if(selfUserId!=items.user_id){
                staffMap[items.user_id] = items.user_name;
            }
        });
        renderAtList(staffMap,team);
    });
}

/**
 * 渲染@列表
 */
function renderAtList(staffMap,team){
    var teamArr,otherArr = [];
    var selfUserId = localStorage.getItem('user_id');
    try{
        teamArr = team.split(',');
    }catch(e){
        teamArr = [];
    }
    if(teamArr.indexOf(selfUserId)!=-1){
        teamArr.splice(teamArr.indexOf(selfUserId),1);
    }
    for (var key in staffMap) {
        if(teamArr.indexOf(key)==-1){
            otherArr.push(key);
        }
    }
    var str = '';
    for (var i = 0; i < teamArr.length; i++) {
        str += '<li class="aui-list-item renderAdd">'+
                    '<div class="aui-list-item-inner">'+
                        '<label><input class="aui-radio" type="checkbox" name="atSomeone" value="'+teamArr[i]+'"><span style="margin-left: 10px;">'+staffMap[teamArr[i]]+'</span></label>'+
                    '</div>'+
                '</li>';
    }
    str += '<li class="aui-list-item renderAdd" tapmode onclick="atMore(this);">'+
                '<div class="aui-list-item-inner">更多</div>'+
            '</li>';
    for (var i = 0; i < otherArr.length; i++) {
        str += '<li class="aui-list-item at-hide renderAdd">'+
                    '<div class="aui-list-item-inner">'+
                        '<label><input class="aui-radio" type="checkbox" name="atSomeone" value="'+otherArr[i]+'"><span style="margin-left: 10px;">'+staffMap[otherArr[i]]+'</span></label>'+
                    '</div>'+
                '</li>';
    }
    $('.aui-form-list').append(str);
}

/**
 * @param {string} s
 * @param {number} numRows
 * @return {string}
 */
var convert = function(s, numRows) {
    var strArr = [];
    var index = 0;
    for (var i = 0; i < s.length; i++) {
        strArr.push(s[i]);
    }
    var len = s.length;
    var arr = [];
    var i = 0;

    while (index<len-1) {
        arr[i] = new Array(numRows);
        for(var j = 0;j < numRows; j++ ){
            arr[i][j] = strArr[index];
            index++;
            if(index==len-1){
                //跳出
                break;
            }
        }
        i++;
        arr[i] = new Array(numRows);
        for(var j = numRows-2;j>0;j--){
            arr[i][j] = strArr[index];
            i++;
            arr[i] = new Array(numRows);
            index++;
            if(index==len-1){
                //跳出
                break;
            }
        }
    }
    var temp;
    for(var i = 0;i<arr.length;i++){
        for(var j = i+1;j<arr.length;j++){
            temp=arr[i][j];
            arr[i][j]=arr[j][i];
            arr[j][i] = temp;
        }
    }
    var str = '';
    for(var i = 0;i<arr.length;i++){
        for(var j = 0;j<arr[i].length;j++){
            if(arr[i][j]){
                str += arr[i][j];
            }
        }
    }
    return str;
};

/**
 * 提交
 */
function sub(){
    var selfUserId = localStorage.getItem('user_id');
    var form_data = {
        class: 'respoAffair',
        priority: '普通',
        frontUrl: '',
        title: affairInfo.name,
        content: $('textarea[name=content]').val(),
        // album: album,
        // albumName: albumName,
        // file: file,
        // fileName: fileName,
        votes: '',
        subscriber: '',
        atSomeone: '',
        noti_client_affair_group_uuid: affairInfo.uuid
    };
    if(affairInfo.RespoAffairs){
        form_data.class = 'respoAffair';
        var department = affairInfo.RespoAffairs[0].department;
        if(department=='客户关系部'){
            if(affairInfo.customerId){
                form_data.frontUrl = '/specialLine';
            }else{
                form_data.frontUrl = '/custRelationsAffairs';
            }
        }else if(department=='生产部'){
            form_data.frontUrl = '/productsAffairs';
        }else if(department=='研发部'){
            form_data.frontUrl = '/researchAffairs';
        }else{
            form_data.frontUrl = '/manageAffairs';
        }
    }else{
        form_data.class = 'projectAndSmallAffair';
        form_data.frontUrl = '/projectAffair';
    }
    var voteArr = [],atSomeoneArr = [],subscriberArr = [];
    $('input[name=votes]:checked').each(function(){
        voteArr.push($(this).val());
    });
    $('input[name=atSomeone]:checked').each(function(){
        atSomeoneArr.push($(this).val());
    });
    try{
        subscriberArr = affairInfo.team.split(',');
    }catch(e){}
    if(subscriberArr.indexOf(selfUserId)!=-1){
        subscriberArr.splice(subscriberArr.indexOf(selfUserId),1);
    }
    atSomeoneArr.forEach(function(items,index){
        if(subscriberArr.indexOf(items)==-1){
            subscriberArr.push(items);
        }
    });
    form_data.votes = voteArr.join();
    form_data.atSomeone = atSomeoneArr.join();
    form_data.subscriber = subscriberArr.join();
    if(form_data.content==''){
        api.toast({
            msg: '内容不能为空'
        });
        return;
    }
    if(form_data.atSomeone==''&&form_data.votes==''){
        api.toast({
            msg: '请选择选项'
        });
        return;
    }
    apiAjax({
        url: '/home/notiClient/add',
        type: 'post',
        data: form_data
    },function(res){
        api.toast({
            msg: res.msg
        });
        $('textarea[name=content]').val('');
    });
}
