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
                display: "?????? {0} - {1}?????? {2} ???",
                empty: "????????????",
                page: "???",
                of: "/ {0}",
                itemsPerPage: "???/???",
                first: "?????????",
                previous: "?????????",
                next: "?????????",
                last: "????????????",
                refresh: "??????"
            }
        },
        sortable: true,
        columns: [
            { field: "company", title: "?????????",width: '300px',template: function(dataItem){
                return '<span onclick="editCusInfo(this)">'+dataItem.company+'</span>'
            }},
            { field: "level", title: "??????",width: '80px'},
            { field: "manager", title: "?????????",width: '80px'},
            { field: "sign_time", title: "????????????",width: '150px'},
            { field: "total", title: "???????????????",width: '90px'},
            { field: "total_sale", title: "???????????????",width: '150px',attributes: {style: 'text-align: right'},headerAttributes: {style: 'text-align: right'}},
            { field: "pay", title: "?????????",width: '150px',attributes: {style: 'text-align: right'},headerAttributes: {style: 'text-align: right'}},
            { field: "latest", title: "????????????",template: function(dataItem){
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

//????????????????????????
function goTOContracts(obj){
    var contract_no = JSON.stringify([$(obj).text()]);
    //?????????frame???????????????
    sessionStorage.setItem('contract',contract_no);
    var height = $('#grid').height();
    $('#grid').hide();
    $('body').append('<iframe id="in_frame" name="in_frame" style="height: '+height+'px;width:100%;position:absolute;z-index:99999;border:none;" src="../html/contracts_view.html" >');
}