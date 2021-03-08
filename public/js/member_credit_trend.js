var credit_orignal_data = [],creditDataPool = [];
var data = {};
var company;
$(document).ready(function(){
    company = decodeURIComponent(GetRequest('company'));
    getCreditData(company);
});
window.onresize = function(){
    createCreditChart();
}

/*获取信用相关数据*/
function getCreditData(company){
	var y = 0.6;
	var endDate = dateTime();
	var startDate = dateTime(new Date(Date.parse(new Date()) - parseInt(60*60*24*1000*365*y)));
	$.ajax({
		url:route('admin/getCreditTrendData'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			company: company,
			startDate: startDate,
			endDate: endDate
		},
		success:function(res){
			if(res.code==200){
				if(res.data[0]==null){
					//数据为空
					$('.weui-loadmore').html('对不起，暂无数据。');
				}else{
					creditDataPool = [];
					credit_orignal_data = res.data;
					res.data.forEach(function(items,index){
						var o = {
							overDraft: items.overDraft,
                            insideAmount: items.insideAmount,
                            outsideAmount: items.outsideAmount,
                            freezeAmount: items.freezeAmount,
							creditLine: items.creditLine,
							date: new Date(items.checkDate)
						};
						creditDataPool.push(o);
                    });
                    $.ajax({
                        url:route('admin/getOver'),
                        type:'post',
                        dataType:'json',
                        timeout:30000,
                        data:{
                            models: JSON.stringify({
                                page: 1,
                                pageSize: 30,
                                keywords: company,
                                type:"全部"
                            })
                        },
                        success:function(res){
                            creditDataPool.push({
                                insideAmount: res.data[0].inside_amount,
                                outsideAmount: res.data[0].outside_amount,
                                freezeAmount: res.data[0].freeze_amount,
                                creditLine: res.data[0].credit_line,
                                date: new Date(dateTime())
                            });
                            createCreditChart();
                        }
                    });
				}
			}
		}
	});
}

/*创建信用趋势图*/
function createCreditChart(){
	$('body').show();
    $("#chart").kendoChart({
    	title: {
            text: company
        },
        legend: {
            position: "bottom"
        },
        dataSource: {
            data: creditDataPool
        },
        seriesDefaults: {
            type: "bar",
            stack: true
        },
        series: [{
            type: "line",
            field: "creditLine",
            name: '信用额度',
            style: "step",
            aggregate: 'max',
            categoryField: "date"
        },{
            field: "insideAmount",
            name: '期内待付',
            color: "#0f0",
            categoryField: "date"
        },{
            field: "outsideAmount",
            name: '逾期待付',
            color: "#f00",
            categoryField: "date"
        },{
            field: "freezeAmount",
            name: '冻结',
            color: "#00f",
            categoryField: "date"
        }],
        categoryAxis: {
            baseUnit: 'months',
            majorGridLines: {
                visible: false
            },
            labels: {
            	dateFormats: {
            		months: "MM/yy"
            	}
            }
        },
        valueAxis: {
            line: {
                visible: false
            }
        },
        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        }
    });
}