function msgTemp(data) {
    var user_id = sessionStorage.getItem('user_id');
    if (user_id == data.sender) {
        //我自己发的
        return msgItem(true);
    } else {
        //别人发的
        return msgItem(false);
    }

    function msgItem(self) {
        var direct;
        var _time = time(data.post_time);
        var content = data.content;
        var content_album = '';
        var content_file = '';
        if (data.album) {
            var _arr = [];
            try {
                _arr = data.album.split(',');
            } catch (e) {

            }
            for (var i = 0; i < _arr.length; i++) {
                var href = route("img/notiClient/"+_arr[i]);
                var src = route("img/notiClient/small_"+_arr[i]);
                content_album += '<a data-href="'+href+'" onclick="picClick(this,1);" href="javascript:void(0)"><img height="100px;" src="'+src+'" /></a>';
            }
        }
        if (data.file) {
            var _arr = [];
            try {
                _arr = data.file.split(',');
            } catch (e) {

            }
            for (var i = 0; i < _arr.length; i++) {
                var href = route("notiClient/"+_arr[i]);
                content_file += '<a href="'+href+'" data-href="'+href+'" target="_blank" style="margin-left: 16px;">' + _arr[i] + '</a>';
            }
        }
        if (self) {
            direct = 'aui-chat-right';
        } else {
            direct = 'aui-chat-left';
        }
        var maxWidth = window.innerWidth - 20;
        var str = '<div class="aui-chat-item ' + direct + '" data-uuid="'+data.mailId+'">' +
                        '<div class="aui-chat-inner">' +
                            '<div class="aui-chat-name">' +innerTitle(self)+ '</div>' +
                            '<div class="aui-chat-content" style="margin-bottom: 8px;!important">' +
                                '<div class="aui-chat-arrow"></div>' +
                                '<span onclick="addReply(this);" data-uuid="'+data.mailId+'">' + content + '</span>' + content_album +content_file+
                                '<p>'+actionBar(data)+'</p>'+
                            '</div>' +
                        '</div>'+
                    '</div>';
        return str;

        function innerTitle(self){
            if(self){
                return '<span>' + _time + '</span><span style="margin-left: 8px;">' + data.senderName + '</span>';
            }else{
                return '<span>' + data.senderName + '</span><span style="margin-left: 8px;">' + _time + '</span>';
            }
        }

        function actionBar(it){
            var user_id = sessionStorage.getItem('user_id');
            if(it.sender==user_id){
                return tempSelfPublish(it);
            }else{
                return tempOtherPublish(it);
            }

            //自己发的模板
            function tempSelfPublish(it){
                var trans = function(content){
                    try{
                        content = content.replace(/\n/g,'</br>');
                        content = content.replace(/\s/g,'&nbsp;');
                    }catch(e){

                    }
                    return content;
                }
                var _contentArr;
                try{
                    _contentArr = it.votes.split(',');
                }catch(e){
                    _contentArr = [];
                }
                _contentArr.forEach(function(_it,_ind) {
                    _contentArr[_ind] = {};
                    _contentArr[_ind][_it] = [];
                });
                _contentArr.push({
                    '未处理': []
                });
                it.NotiClientSubs.map(function(_items,_index) {
                    _contentArr.forEach(function(_it,_ind) {
                        for(var _key in _it){
                            if(_items.vote==_key){
                                _contentArr[_ind][_key].push(_items.receiverName);
                                break;
                            }
                        }
                    });
                    if(_items.replied==0){
                        _contentArr[_contentArr.length-1]['未处理'].push(_items.receiverName);
                    }
                });
                var inRender = function(items) {
                    for(var key in items){
                        return  '<p>'+
                                    '<span>'+key+'（'+items[key].length+'）：</span>'+
                                    '<span>'+items[key].join()+'</span>'+
                                '</p>';
                    }
                }
                var orderReply = function() {
                    var resArr = [];
                    it.NotiClientSubs.map(function(_items,_index) {
                        if(_items.atMe){
                            resArr.push(_items);
                        }
                    });
                    var s = function(a,b) {
                        return Date.parse(a.replyTime) - Date.parse(b.replyTime);
                    }
                    resArr = resArr.sort(s);
                    return resArr.map(function(items){
                        items.atReply = items.atReply?items.atReply:'';
                        return '<p>'+
                                    '<p key='+items.id+' style="margin-bottom: 0px">'+
                                        '<span>'+items.receiverName+'：</span>'+trans(items.atReply)+
                                    '</p>'+
                                '</p>';
                    });
                }
                /*************清除已阅********************/
                var key1,key2,v1,v2;
                _contentArr.forEach(function(items,index) {
                    for(var key in items){
                        if(index==0){
                            key1 = key;
                        }else if(index==1){
                            key2 = key;
                            v2 = items[key];
                        }
                    }
                });
                if(_contentArr.length==2&&key1=='已阅'&&key2=='未处理'&&v2.length==0){
                    _contentArr = [];
                }
                /****************************************/

                _contentArr.forEach(function(items,index){
                    for(var key in items){
                        if(key=='未处理'&&items[key].length==0) {
                            _contentArr.splice(index,1);
                        }
                    }
                });

                /*****************返回结果***********************/
                var orderReplyArr = orderReply();
                if(orderReplyArr.length!=0||_contentArr.length!=0){
                    var _str = '',_str2 = '';
                    _contentArr.map(function(items){
                        if(items){
                            _str += inRender(items);
                        }
                    });
                    orderReplyArr.map(function(items){
                        if(items){
                            _str2 += items;
                        }
                    });
                    return  '<div>'+_str2+_str+'</div>';
                }else{
                    return '';
                }
            }

            //别人发的模板
            function tempOtherPublish(it){
                var mark = false;
                //防止回复模板刷多次
                var hasDoneArr = [],otherArr = [];
                otherArr = it.NotiClientSubs.map(function(_items,_index){
                    if(user_id==_items.receiver){
                        mark = true;
                        if(_items.replied==1){
                            if(hasDoneArr.indexOf(_items.receiver)==-1){
                                hasDoneArr.push(_items.receiver);
                                //回复完毕之后，看到的内容跟发送人一致
                                return tempSelfPublish(it);
                            }
                        }else{
                            var _arr;
                            try{
                                _arr = it.votes.split(',');
                            }catch(e){
                                _arr = [];
                            }
                            function radioTemp(){
                                if(_arr.length==0) return '';
                                function checkHasDone(){
                                    var hasDone = false;
                                    if(_items.vote) hasDone = true;
                                    if(hasDone){
                                        return  '<div>'+_items.vote+'</div>';
                                    }else{
                                        var radioStr = '';
                                        _arr.forEach(function(items,index){
                                            if(index==0){
                                                radioStr += '<label>'+
                                                                '<input type="radio" checked name="vote'+_items.id+'" value="'+items+'" />'+
                                                                '<span style="margin-left: 4px;margin-right: 8px;">'+items+'</span>'+
                                                            '</label>';
                                            }else{
                                                radioStr += '<label>'+
                                                                '<input type="radio" name="vote'+_items.id+'" value="'+items+'" />'+
                                                                '<span style="margin-left: 4px;margin-right: 8px;">'+items+'</span>'+
                                                            '</label>';
                                            }
                                        });
                                        return '<div data-id="'+_items.id+'" data-noti_client_mailId="'+_items.noti_client_mailId+'">'+radioStr+
                                                    '<a href="javascript:;" onclick="publishReply(this);" class="weui-btn weui-btn_mini weui-btn_default">提交</a>'+
                                                '</div>';
                                    }
                                }
                                return checkHasDone();
                            }
                            function atMeTemp(){
                                if(_items.atMe==0) return '';
                                function checkHasDone(){
                                    var hasDone = false;
                                    if(_items.atReply) hasDone = true;
                                    if(hasDone){
                                        return  '<div>'+_items.atReply+'</div>';
                                    }else{
                                        return '<div data-id="'+_items.id+'" data-noti_client_mailId="'+_items.noti_client_mailId+'">'+
                                                    '<textarea style="width: 100%;height: 100px;border: 1px solid #eee;margin-top: 5px;margin-bottom: 5px;" rows="6"></textarea>'+
                                                    '<a href="javascript:;" onclick="publishReply(this);" class="weui-btn weui-btn_mini weui-btn_default">提交</a>'+
                                                '</div>';
                                    }
                                }
                                return checkHasDone();
                            }
                            return  '<div>'+radioTemp(_items)+atMeTemp(_items)+'</div>';
                        }
                    }else if(user_id!=_items.receiver&&_index==it.NotiClientSubs.length-1){
                        //路人看到的回执信息跟发件人一样
                        if(!mark) return tempSelfPublish(it);
                    }
                });
                var endOtherArr = [];
                otherArr.forEach(function(items,index){
                    if(items){
                        endOtherArr.push(items);
                    }
                });
                return endOtherArr;
            }

            return '';
        }
    }
}

function addReply(obj){
    // return;
    // var mailId = $(obj).attr('data-uuid');
    // apiAjax({
    //     url: 'home/notiClient/addReply',
    //     type: 'post',
    //     data: {
    //         atReply: 'asd',
    //         noti_client_mailId: mailId
    //     }
    // },function(res){
    //     wxToast(res.msg);
    //     apiAjax({
    //         url: 'home/notiMail/'+mailId
    //     },function(res){
    //         var str = msgTemp(res.data);
    //         $('.aui-chat-item[data-uuid="'+mailId+'"]').replaceWith(str);
    //     });
    // });
}

function publishReply(obj){
    var id = $(obj).parent().attr('data-id');
    var noti_client_mailId = $(obj).parent().attr('data-noti_client_mailId');
    var form_data = {
        id: id,
        noti_client_mailId: noti_client_mailId
    };
    if($(obj).parent().find('textarea').length==0){
        form_data.vote = $(obj).parent().find('input:checked').val();
    }else{
        form_data.atReply = $(obj).parent().find('textarea').val();
        if(form_data.atReply==''){
            wxToast('不能为空');
            return;
        }
    }
    apiAjax({
        url: 'home/notiClient/subUpdate',
        type: 'put',
        data: form_data
    },function(res){
        wxToast(res.msg);
        apiAjax({
            url: 'home/notiMail/'+noti_client_mailId
        },function(res){
            var str = msgTemp(res.data);
            $('.aui-chat-item[data-uuid="'+noti_client_mailId+'"]').replaceWith(str);
        });
    });
}

function picClick(obj,type){
    window.location.href = $(obj).attr('data-href');
}
