$(document).ready(function () {
    dataSource = new kendo.data.DataSource({
        transport: {
            read:  {
                url: route('admin/customers/newIncomingCustomers'),
                type: 'post',
                dataType: "json"
            },
            parameterMap: function(options, operation) {
                if (operation == "read") {
                    var parameter = {
                        page: options.page,
                        pageSize: options.pageSize,
                        keywords: $('#search').val()
                    };
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
                    company: { editable: false},
                    level: { editable: false},
                    manager: { editable: false},
                    sign_time: { editable: false},
                    total: { editable: false},
                    total_sale: { editable: false},
                    pay: { editable: false},
                    latest: { editable: false}
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
        toolbar: [{template: kendo.template($("#template").html())}],
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
            { field: "company", title: "客户名",width: '300px',template: function(dataItem){
                return '<span onclick="editCusInfo(this)">'+dataItem.company+'</span>'
            }},
            { field: "level", title: "类型",width: '80px'},
            { field: "manager", title: "业务员",width: '80px'},
            { field: "sign_time", title: "首签时间",width: '150px'},
            { field: "total", title: "累计合同数",width: '90px'},
            { field: "total_sale", title: "累计销售额",width: '150px',attributes: {style: 'text-align: right'},headerAttributes: {style: 'text-align: right'}},
            { field: "pay", title: "已付款",width: '150px',attributes: {style: 'text-align: right'},headerAttributes: {style: 'text-align: right'}},
            { field: "latest", title: "最新合同",template: function(dataItem){
                return '<span onclick="goTOContracts(this)">'+dataItem.latest+'</span>'
            }},
        ],
        editable: false
    });
}

function search(){
    $('#grid').data("kendoGrid").dataSource.options.page = 1;
    $('#grid').data("kendoGrid").dataSource.read();
}

//跳转合同详细页面
function goTOContracts(obj){
    var contract_no = JSON.stringify([$(obj).text()]);
    //打开子frame，合同管理
    sessionStorage.setItem('contract',contract_no);
    var height = $('#grid').height();
    $('#grid').hide();
    $('body').append('<iframe id="in_frame" name="in_frame" style="height: '+height+'px;width:100%;position:absolute;z-index:99999;border:none;" src="../html/contracts_view.html" >');
}