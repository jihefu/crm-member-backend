var INTENT_DEGREE;
$(document).ready(function () {
    dataSource = new kendo.data.DataSource({
        transport: {
            read:  {
                url: route('admin/customers/type_d_list'),
                type: 'post',
                dataType: "json"
            },
            parameterMap: function(options, operation) {
                if (operation == "read") {
                    var parameter = {
                        page: options.page,
                        pageSize: options.pageSize,
                        keywords: $('#search').val(),
                        sort: options.sort ? options.sort[0] : {},
                    };
                    return {models: kendo.stringify(parameter)};
                }
            }
        },
        batch: true,
        pageSize: 30,
        serverPaging: true,
        serverSorting: true,
        schema: {
            model: {
                id: "id",
                fields: {
                    company: { editable: false},
                    level: { editable: false},
                    manager: { editable: false},
                    datefrom: { editable: false},
                    count: { editable: false },
                    intention_products: { editable: false},
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
        serverSorting : true,
        columns: [
            { field: "company", sortable: false, title: "?????????",width: '300px'},
            { field: "total_contact_num", title: "????????????",width: '120px'},
            { field: "latest_contact_num", title: "??????????????????",width: '120px'},
            { field: "latest_contact_time", title: "??????????????????",width: '120px', template: function(dataItem) {
                if (dataItem.latest_contact_time) return dateTime(dataItem.latest_contact_time);
                return '';
            }},
            { field: "intent_degree", title: "?????????",width: '80px', 
                template: function(dataItem) {
                    if (dataItem.intent_degree) {
                        return '<div style="cursor: pointer;" onclick="changeIntentDegree('+dataItem.user_id+','+dataItem.intent_degree+')">'+dataItem.intent_degree+'</div>';
                    }
                    return 0;
                }
            },
            { field: "hot_degree", title: "??????",width: '80px'},
            { field: "intention_products", sortable: false, title: "????????????",width: '250px'},
            { field: "manager", title: "?????????", sortable: false, width: '80px',template: function(dataItem){
                if(dataItem.manager=='null'||dataItem.manager==null) dataItem.manager = '';
                return dataItem.manager;
            }},
            { field: "other_staff", sortable: false, title: "??????????????????", width: '200px'},
        ],
        editable: false,
    });

    function selectOption(v) {
        var str = '';
        const optionArr = [1, 2, 3, 4, 5];
        optionArr.forEach(function(items){
            if (items == v) {
                str += '<option selected value="'+items+'">'+items+'</option>';
            } else {
                str += '<option value="'+items+'">'+items+'</option>';
            }
        });
        return str;
    }
}

function changeIntentDegree(user_id, intent_degree) {
    initDialog(user_id, intent_degree);
}

function search(){
    $('#grid').data("kendoGrid").dataSource.options.page = 1;
    $('#grid').data("kendoGrid").dataSource.read();
}

function initDialog(user_id, intent_degree){
    var str = '<div id="dialog" style="font-size: 14px;"></div>';
    $('body').append(str);
    INTENT_DEGREE = intent_degree;
    $('#dialog').kendoDialog({
        width: "500px",
        "max-height": "600px",
        title: '??????',
        closable: false,
        modal: true,
        content: '<span>????????????</span><input class="intent_degree_input" />',
        actions: [
            { text: '??????', primary: true , action: function(){
                sub(user_id, INTENT_DEGREE);
            } },
            { text: '??????', action: function(){
                cancel();
            }}
        ]
    });
    $('.intent_degree_input').kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: [
            { text: "1", value: "1" },
            { text: "2", value: "2" },
            { text: "3", value: "3" },
            { text: "4", value: "4" },
            { text: "5", value: "5" },
        ],
        value: intent_degree,
        change: function(e){
            INTENT_DEGREE = e.sender._old;
        },
    });
}

function cancel() {
    $('#dialog').remove();
}

function sub(user_id, intent_degree) {
    cancel();
    $.ajax({
        url: route('admin/customers/changeIntentDegree'),
        type: 'put',
        data: {
            intent_degree: intent_degree,
            user_id: user_id,
        },
        success: function(res){
            $('#grid').data("kendoGrid").dataSource.read();
        }
    });
}