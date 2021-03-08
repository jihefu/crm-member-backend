apiReady(function(){
    getTagHash(function(){
        getData();
    });
    // getTags();
    apiRefresh(function(){
        getData();
    });
});
//数据池
var format_data;
var state;
var pre_arr = [],ing_arr = [],after_arr = [],products_arr = [],application_arr = [],
    measuring_arr = [],ctrl_arr = [],news_arr = [],standard_arr = [],part_arr = [],fun_arr = [],
    customer_arr = [];
var tagHash = {};

function getTagHash(cb){
    apiAjax({
        url: '/hybrid/getTagHash'
    },function(result){
        tagHash = result.data;
        cb();
    });
}
/**
 * 初始化基本数据
 */
function getData(){
    apiAjax({
        url: '/hybrid/order/info',
        data: {
            id: api.pageParam.id
        }
    },function(result){
        state = result.data[0]['state'];
        if(state=='待提交'){
            $('.btnBar').css('display','flex');
        }else{
            $('.btnBar').css('display','none');
        }
        init(result.data[0]);
        // api.execScript({
        //     name: 'order_info',
        //     script: 'changeStatusEdit();'
        // });
    });
}
/**
 * 获取所有标签
 */
function getTags(){
    apiAjax({
        url: '/hybrid/order/getTags',
        data: {}
    },function(result){
        result = result.data;
        result.sort(orderSocre);
        result.forEach(function(items,index){
            var obj = {};
            obj.label = items.name;
            obj.value = items.name;
            if(items.type=="售前"){
                pre_arr.push(obj);
            }else if(items.type=="售中"){
                ing_arr.push(obj);
            }else if(items.type=="售后"){
                after_arr.push(obj);
            }else if(items.type=="产品"){
                products_arr.push(obj);
            }else if(items.type=="应用"){
                application_arr.push(obj);
            }else if(items.type=="测量"){
                measuring_arr.push(obj);
            }else if(items.type=="控制"){
                ctrl_arr.push(obj);
            }else if(items.type=="通讯"){
                news_arr.push(obj);
            }else if(items.type=="标准"){
                standard_arr.push(obj);
            }else if(items.type=="部件"){
                part_arr.push(obj);
            }else if(items.type=="功能"){
                fun_arr.push(obj);
            }else if(items.type=="自定义"){
                customer_arr.push(obj);
            }
        });
    });

    //冒泡排序
    function orderSocre(a,b){
        return (b.base_score+b.incremental_score) - (a.base_score+a.incremental_score);
    }
}

/**
 * 初始化界面
 */
function init(data){
    $('.aui-form-list').html('<li class="aui-list-header">详情</li>');
    var str = '';
    format_data = {
        id: {comment:'id'},
        contact_name: {comment:'联系人'},
        contact_phone: {comment:'联系电话'},
        contact_unit: {comment:'联系单位'},
        staff: {comment:'员工'},
        staff_phone: {comment:'员工电话'},
        tags: {comment:'标签'},
        demand: {comment:'客户需求'},
        content: {comment:'我的答复'},
    };
    for(var i in format_data){
        format_data[i].visible = 1;
        format_data[i].model = data[i];
        format_data[i].value = data[i]?data[i]:'';
        format_data[i].type = 'input';
        format_data[i].disabled = '';
        if(i=="id"||i=="m_id"||i=="feedback_flag"||i=="isdel"||i=="staff"||i=="staff_phone"){
            format_data[i].visible = 0;
        }else if(i=="incoming_time"||i=="handle_time"||i=="hang_up_time"){
            format_data[i].value = time(format_data[i].value,2);
        }else if(i=="other_visible"||i=="complete"||i=="hasToDo"){
            if(format_data[i].model){
                format_data[i].value = "是";
            }else{
                format_data[i].value = "否";
            }
        }else if(i=="hasRelativeResource"){
            if(format_data[i].model==0){
                format_data[i].value = "";
            }
        }
        if(i=='incoming_time'||i=='handle_time'||i=='hang_up_time'||i=='contact_type'||i=='check_person'||i=='contact_phone'){
            format_data[i].disabled = 'disabled';
        }else if(i=='other_visible'||i=='complete'||i=="hasToDo"){
            format_data[i].type = 'select';
            format_data[i].option = '是,否';
        }else if(i=='content'||i=='demand'||i=='toDoContent'){
            format_data[i].type = 'textarea';
        }else if(i=='tags'){
            format_data[i].type = 'block';
        }
    }
    for (var i in format_data) {
        if(format_data[i].visible){
            str += '<li class="aui-list-item">'+
                        '<div class="aui-list-item-inner">'+
                            '<div class="aui-list-item-label">'+format_data[i].comment+'</div>'+
                            '<div class="aui-list-item-input">'+templateInput(i,format_data)+'</div>'+
                        '</div>'+
                    '</li>';
        }
    }
    $('.aui-form-list').append(str);
    var v = $('select[name=tags]').val();
    try{
        $('textarea[name=demand]').attr('placeholder',tagHash[v].description);
    }catch(e){

    }
}

/**
 * 编辑界面模板
 */
function templateInput(key,data){
    if(state=='待提交'){
        if(key=='tags'){
            var str = '';
            for(var key in tagHash){
                str += '<option value="'+key+'">'+key+'</option>';
            }
            return '<select name="tags" onChange="tagsChange(this)">'+str+'</select>';
        }else if(key=='demand'){
            return '<textarea name="demand">'+data[key].value+'</textarea>';
        }else if(key=='content'){
            return '<textarea name="content">'+data[key].value+'</textarea>';
        }else{
            return '<span data-key="'+key+'">'+data[key].value+'</span>';
        }
    }else{
        return '<span>'+data[key].value+'</span>';
    }
}

function tagsChange(obj){
    var v = $(obj).val();
    try{
        $('textarea[name=demand]').attr('placeholder',tagHash[v].description);
    }catch(e){

    }
}

/**
 * 删除标签
 */
function delTags(obj){
    var text = $(obj).text();
    var model_tags_arr = JSON.parse(format_data['tags'].model);
    model_tags_arr.forEach(function(items,index){
        if(items==text){
            model_tags_arr.splice(index,1);
            $(obj).remove();
            format_data['tags'].model = JSON.stringify(model_tags_arr);
        }
    });
}
/**
 * 新增标签
 */
 function add(){
     var pick_arr = [{
         label: '状态',
         value: '状态',
         children: [{
             label: '售前',
             value: '售前',
             children: pre_arr
         },{
             label: '售中',
             value: '售中',
             children: ing_arr
         },{
             label: '售后',
             value: '售后',
             children: after_arr
         }]
     },{
         label: '产品',
         value: '产品',
         children: products_arr
     },{
         label: '应用',
         value: '应用',
         children: application_arr
     },{
         label: '测量',
         value: '测量',
         children: measuring_arr
     },{
         label: '控制',
         value: '控制',
         children: ctrl_arr
     },{
         label: '通讯',
         value: '通讯',
         children: news_arr
     },{
         label: '标准',
         value: '标准',
         children: standard_arr
     },{
         label: '部件',
         value: '部件',
         children: part_arr
     },{
         label: '功能',
         value: '功能',
         children: fun_arr
     },{
         label: '自定义',
         value: '自定义',
         children: customer_arr
     },{
         label: '添加标签',
         value: '添加标签',
         children: [
            {
                label: '点击确定新增',
                value: 'createCustomerTag'
            }
         ]
     }];
     if(customer_arr[0]==null){
         pick_arr.forEach(function(items,index){
             if(items.label=='自定义') pick_arr.splice(index,1);
         });
     }
     weui.picker(pick_arr,{
         defaultValue: ['状态','售前','拜访'],
         onConfirm: function(result){
             var tag = result[result.length-1];
             var model_tags_arr = JSON.parse(format_data['tags'].model);
             renderTag(model_tags_arr,tag);
         }
     });

    function renderTag(model_tags_arr,tag){
        if(tag=='createCustomerTag'){
            handleCustomerTag(model_tags_arr);
            return;
        }
        //去重
        if(model_tags_arr==null||model_tags_arr==''){
            model_tags_arr = [];
            model_tags_arr.push(tag);
            handle();
        }else{
            for (var i = 0; i < model_tags_arr.length; i++) {
                if(model_tags_arr[i]==tag){
                    break;
                }else if(model_tags_arr[i]!=tag&&i==model_tags_arr.length-1){
                    model_tags_arr.push(tag);
                    handle();
                }
            }
        }

        function handle(){
            var str = '<span class="input_mark tags iconfont icon-cancel" onclick="delTags(this);">'+tag+'</span>';
            $('.icon-add').before(str);
            format_data['tags'].model = JSON.stringify(model_tags_arr);
        }
    }

    function handleCustomerTag(model_tags_arr){
      var dialog = new auiDialog({});
      dialog.alert({
          title:"自定义标签",
          msg:'<input type="text" name="tag" placeholder="请输入自定义标签" value="" />',
          buttons:['取消','确定']
      },function(ret){
          if(ret&&ret.buttonIndex==2){
              var tag = $('input[name=tag]').val();
              renderTag(model_tags_arr,tag);
          }
      });
    }
 }
/**
 * 编辑
 */
function edit(){
    $('.list_value').hide();
    $('.input_mark').removeClass('input_value');
    api.execScript({
        name: 'order_info',
        script: 'changeStatusSub();'
    });
}
/**
 * 提交
 */
function sub(){
    var form_data = {
        contact_name: {
            model: $('span[data-key=contact_name]').text()
        },
        tags: {
            model: $('select[name=tags]').val()
        },
        demand: {
            model: $('textarea[name=demand]').val()
        },
        content: {
            model: $('textarea[name=content]').val()
        },
        state: {
            model: '已提交'
        },
        id: {
            model: format_data.id.model
        }
    };
    if(!form_data.demand.model){
        api.toast({
            msg: '客户需求不能为空'
        });
        return;
    }
    api.showProgress({
        title: '正在提交',
        text: '',
        modal: true
    });
    apiAjax({
        url: '/hybrid/order/update',
        type: 'put',
        data: {
            format_data: JSON.stringify(form_data)
        }
    },function(res){
        if(res.data==200){
            api.toast({
                msg: '提交成功'
            });
        }else{
            api.toast({
                msg: '提交失败'
            });
        }
        api.hideProgress();
        getData();
    });
}

function closeOrder(){
    api.confirm({
        title: '提醒',
        msg: '确定关闭？',
        buttons: ['确定', '取消']
    }, function(ret, err) {
        var index = ret.buttonIndex;
        if(index==1){
            api.showProgress({
                title: '正在提交',
                text: '',
                modal: true
            });
            apiAjax({
                url: '/hybrid/order/closeOrder',
                type: 'put',
                data: {
                    id: format_data.id.model
                }
            },function(res){
                api.toast({
                    msg: '提交成功'
                });
                api.hideProgress();
                getData();
            });
        }
    });
}
/**
 * 监听model变化
 */
function modelChange(obj){
    var key = $(obj).attr('data-key');
    format_data[key].model = $(obj).val();
    if(key=='hasToDo'){
        if(format_data[key].model==1){
            $('textarea[data-key=toDoContent]').parents('li').show();
        }else{
            $('textarea[data-key=toDoContent]').parents('li').hide();
            $('textarea[data-key=toDoContent]').val('');
            format_data['toDoContent'].model = '';
        }
    }
}
