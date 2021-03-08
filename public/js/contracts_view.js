$(document).ready(function () {
    dataSource = new kendo.data.DataSource({
        transport: {
            read:  {
                url: route('admin/contracts/view'),
                type: 'post',
                dataType: "json"
            },
            parameterMap: function(options, operation) {
                if (operation == "read") {
                    var contract_session = sessionStorage.getItem('contract')?sessionStorage.getItem('contract'):'';
                    contract_session = contract_session=='null'?contract_session=='':contract_session;
                    //检测是否显示返回按钮
                    if(contract_session!=''){
                        $('#back_to').show();
                    }
                    //生命周期仅为一次查询
                    sessionStorage.setItem('contract',null);
                    var parameter = {
                        page: options.page,
                        pageSize: options.pageSize,
                        keywords: $('#search').val(),
                        contract_session: contract_session
                    };
                    if(options.sort&&options.sort.length!=0){
                        parameter.field = options.sort[0].field;
                        parameter.dir = options.sort[0].dir;
                    }
                    return {models: kendo.stringify(parameter)};
                }
            }
        },
        batch: true,
        pageSize: 30,
        serverPaging: true,
        serverSorting: false,
        schema: {
            model: {
                id: "id",
                fields: {
                    id: { editable: false, nullable: true },
                    contract_no: { editable: false},
                    contract_state: { editable: false},
                    company: { editable: false},
                    payable: { editable: false},
                    delivery_state: { editable: false},
                    pay_state: { editable: false},
                    credit_state: { editable: false}
                }
            },
            data: function (response) {
                return response.data;
            },
            total: function (response) {
                return response.total;
            }
        },
        requestEnd: function (e) {
            //为了本地排序，初始化数据结构，给kendo识别
            try{
                var data = e.response.data;
                data.forEach(function(items,index){
                    data[index].pay_state = parseInt(items.payable - items.paid);
                });
            }catch(e){
                
            }
        }
    });
    init();
});
function init(){
    var height = $('body').height()-3;
    $("#grid").kendoGrid({
        dataSource: dataSource,
        pageable: true,
        height: height,
        toolbar: [{template: '<button id="back_to" style="width:100px;display:none;" onclick="backTo();" class="k-button">返回</button>'},{template: kendo.template($("#template").html())}],
        pageable: {
            refresh: true,
            buttonCount: 5,
            page: 1,
            pageSize: 30,
            pageSizes: [10,30,50,100,200],
            messages: {
                display: "当前 {0} - {1}，共 {2} 条",
                empty: "没有数据",
                page: "页",
                of: "/ {0}",
                itemsPerPage: "条/页",
                first: "第一页",
                previous: "前一页",
                next: "下一页",
                last: "最后一页",
                refresh: "刷新"
            }
        },
        sortable: true,
        columns: [
            { field: "contract_no", title: "合同编号",width: '150px'},
            { field: "contract_state", title: "合同状态",width: '150px'},
            { field: "company", title: "客户名",width: '250px'},
            { field: "payable", title: "金额",width: '150px'},
            { field: "delivery_state", title: "发货状态",width: '150px'},
            { field: "pay_state", title: "付款状态",width: '150px',template: function(dataItem) {
                var pay_state = dataItem.pay_state;
                if(pay_state>0){
                    return '<span style="color: #f00">欠款（'+pay_state+'）</span>';
                }else{
                    return '<span>已结清</span>';
                }   
            }},
            { field: "credit_state", title: "信用状态",width: '150px',template: function(dataItem) {
                if(dataItem.credit_state){
                    return '<span>合格</span>';
                }else{
                    return '<span style="color: #f00">不合格</span>';
                }
            }}
        ],
        editable: false
    });
}

function search(){
    $('#grid').data("kendoGrid").dataSource.options.page = 1;
    $('#grid').data("kendoGrid").dataSource.read();
}

function backTo(){
    // window.top.frames['grid'].$('#grid').show();
    // window.parent.$('#in_frame').remove();
    window.parent.$('#grid').show();
    window.parent.$('#in_frame').remove();
}