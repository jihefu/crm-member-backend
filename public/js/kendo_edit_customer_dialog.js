/**
 *  获取指定客户信息
 *  展示编辑dialog
 */
function editCusInfo(obj){
    var company = $(obj).text();
    $.ajax({
        url:route('admin/customers/customerInfo'),
        type:'get',
        dataType:'json',
        timeout:30000,
        data:{
            'company':company
        },
        success:function(res){
            var data = res.data;
            var content = '<div style="max-height:500px;overflow:auto;" id="dialog_content_id" data-id="'+data['id']+'" data-user_id="'+data['user_id']+'">';
            for(var i in data){
                var obj = initDataSource(i,data);
                if(obj['text']=='') continue;
                content += '<p style="display: flex;width: 80%;margin: auto;margin-bottom: 10px;"><span style="flex:2;" class="_name">'+obj['text']+'</span><input style="flex:5;text-align:left;" '+obj['readonly']+' name="'+i+'" data-type="'+obj['type']+'" value="'+obj['value']+'" /></p>'
            }
            content += '</div>';
            initDialog({
                title: '客户信息编辑',
                content: content,
                actions: [
                    { text: '确定', primary: true , action: function(){
                        updateInfo();
                    } },
                    { text: '取消', action: function(){
                        del();
                    } }
                ]
            });
            init(data);
        }
    });

    /*界面初始化*/
    function init(data){
        $('input[data-type=text]').addClass('k-textbox');
        $('input[data-type=date]').kendoDatePicker({
            format: "yyyy-MM-dd",
            parseFormats: ["yyyy-MM-dd"]
        });
        $('input[data-type=select]').each(function(){
            var key = $(this).attr('name');
            var dataSourse = initDataSource(key,data).select_arr;
            $(this).kendoDropDownList({
                autoBind: true,
                dataSource: {
                    data: dataSourse
                }
            });
        });
        $('input[data-type=remote_search]').kendoAutoComplete({
            dataSource: {
                serverFiltering: true,
                transport: {
                    read: {
                        url: route('admin/contract/salesMan')
                    }
                }
            },
            clearButton: false,
            select: function(t){
                // select_val = t.dataItem;
            },
            open: function(e){
                // init_val = e.sender.dataSource._data[0];
            },
            close: function(e){
                // var end_val = container.find('input').val();
                // if(select_val){
                //     if(select_val!=end_val){
                //         container.find('input').val(init_val);
                //     }
                // }else{
                //     container.find('input').val(init_val);
                // }
            }
        });
    }
}

/**
 *  提交指定客户信息
 */
function updateInfo(){
    var form_data = {
        id: $('#dialog_content_id').attr('data-id'),
        user_id: $('#dialog_content_id').attr('data-user_id')
    };
    $('#dialog p input[readonly!=readonly]').each(function(){
        form_data[$(this).attr('name')] = $(this).val();
    });
    $.ajax({
        url:route('admin/customers/updateCustomerInfo'),
        type:'put',
        dataType:'json',
        timeout:30000,
        data:{
            'form_data': JSON.stringify(form_data)
        },
        success:function(res){
            del();
            TOAST(res.msg);
            if(res.code==200){
                $('#grid').data("kendoGrid").dataSource.read();
            }
        }
    });
}

/**
 *  初始化数据源
 */
function initDataSource(key,data){
    var obj = {
        text: '',
        value: data[key],
        type: 'text',
        readonly: '',
        select_arr: []
    };
    switch(key){
        case 'company':
            obj.text = '客户';
            obj.readonly = 'readonly';
            return obj;
            break;
        case 'abb':
            obj.text = '英文简称';
            return obj;
            break;
        case 'cn_abb':
            obj.text = '中文简称';
            return obj;
            break;
        case 'legal_person':
            obj.text = '法人';
            return obj;
            break;
        case 'reg_person':
            obj.text = '注册人';
            return obj;
            break;
        case 'province':
            obj.text = '省份';
            obj.type = 'select';
            obj.select_arr = ['山东','吉林','上海','广东','浙江','广西','北京','甘肃','湖南','陕西','重庆','河南','宁夏','湖北',
                    '辽宁','河北','江苏','海南','新疆','广州','四川','云南','安徽','江西','福建','天津','山西','内蒙古',
                    '青海','贵州','重庆','西藏','黑龙江','香港','澳门','台湾','国外','其他',''];
            return obj;
            break;
        case 'town':
            obj.text = '城镇';
            return obj;
            break;
        case 'level':
            obj.text = '等级';
            obj.type = 'select';
            obj.select_arr = ['A','B','C','D','E','F'];
            return obj;
            break;
        case 'manager':
            obj.text = '业务经理';
            obj.type = 'remote_search';
            return obj;
            break;
        case 'tech_support':
            obj.text = '技术支持';
            obj.type = 'remote_search';
            return obj;
            break;
        case 'datefrom':
            obj.text = '开始合作时间';
            obj.type = 'date';
            return obj;
            break;
        case 'star':
            obj.text = '星级';
            obj.type = 'select';
            obj.select_arr = ['0','1','2','3','4','5','6','7','8','9','10'];
            return obj;
            break;
        case 'credit_line':
            obj.text = '信用额';
            obj.readonly = 'readonly';
            return obj;
            break;
        case 'credit_period':
            obj.text = '信用期';
            obj.readonly = 'readonly';
            return obj;
            break;
        case 'credit_qualified':
            obj.text = '信用合格';
            obj.readonly = 'readonly';
            obj.value = data[key]?'合格':'不合格';
            return obj;
            break;
        case 'last_sale':
            obj.text = '上年销售额';
            obj.readonly = 'readonly';
            return obj;
            break;
        case 'total_sale':
            obj.text = '总销售额';
            obj.readonly = 'readonly';
            return obj;
            break;
        case 'operKey':
            obj.text = '操作码';
            obj.readonly = 'readonly';
            return obj;
            break;
        case 'partner':
            obj.text = '合伙人';
            obj.readonly = 'readonly';
            return obj;
            break;
        default: 
            return obj;
            break;
    }
}

function initDialog(option){
    var str = '<div id="dialog" style="font-size: 14px;"></div>';
    $('body').append(str);
    $('#dialog').kendoDialog({
        width: option.width?option.width:"500px",
        "max-height": "600px",
        title: option.title,
        closable: false,
        modal: true,
        content: option.content,
        actions: option.actions
    });
}

function del(){
    $('.k-dialog,.k-overlay').remove();
}

function TOAST(str,type,n){
    if(type=='info'||!type){
        var icon = 'icon-correct';
        var color = '#3e4a61';
    }else if(type=='err'){
        var icon = 'icon-cha';
        var color = '#3e4a61';
    }
    var html = '<div id="my-toast" class="k-overlay" style="display: block; z-index: 99; opacity: 0.4;"></div>'+
                '<div id="hs_modal" style="width: 100%;height: 100%;position: fixed;top:0;z-index: 100;">'+
                    '<div style="display:flex;color:white;width:auto;height: auto;min-width: 250px;max-width: 500px;min-height: 125px;border-radius:7px;padding: 18px 30px;position: absolute;top:50%;left: 50%;box-shadow: 0 2px 2px 0 rgba(0,0,0,.3);transform: translate(-50%,-50%);background: '+color+';">'+
                        '<div class="iconfont '+icon+'" style="display:flex;align-items: center;font-size:45px;margin-right: 20px;"></div>'+
                        '<div style="letter-spacing: 1px;display:flex;align-items:center;font-size:20px;word-wrap: break-word;">'+str+'</div>'+
                    '</div>'+
                '</div>';
    $("body").append(html);
    // window.top.$("body").append(html);
    if(!n){
        setTimeout(function(){
            CANCEL();
        },1500);
    }
}

function CANCEL(){
    $('#my-toast,#hs_modal').remove();
    // window.top.$('#my-toast,#hs_modal').remove();
}