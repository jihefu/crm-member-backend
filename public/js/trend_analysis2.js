var orignal_data = [],dataPool = [];
var credit_orignal_data = [],creditDataPool = [];
var k_sale = '',k_cpy = '';
$(document).ready(function(){
    getData();
    initSearch();
    getCreditData();
});
$(".box").bind("change", refresh);
$(".box_credit").bind("change", refreshCredit);
$(document).on('change','input[name=rangeDate]',function(){
	getData();
	$('input[name=customers],input[name=sale_mans]').prop('checked',false);
	$('input[name=customers]').eq(0).prop('checked',true);
	$('input[name=sale_mans]').eq(0).prop('checked',true);
});
$(document).on('change','input[name=sale_mans]',function(){
	var v = $(this).val();
	if(v==1){
		$('input[name=sale_man]').attr('readonly','readonly');
	}else if(v==2){
		$('input[name=sale_man]').removeAttr('readonly');
	}
	listenSearchChange('sale_man',v);
});
$(document).on('change','input[name=customers]',function(){
	var v = $(this).val();
	if(v==1){
		$('input[name=customer]').attr('readonly','readonly');
	}else if(v==2){
		$('input[name=customer]').attr('readonly','readonly');
	}else if(v==3){
		$('input[name=customer]').removeAttr('readonly');
	}
	listenSearchChange('customer',v);
});

$(document).on('change','input[name=rangeDateCredit]',function(){
	getCreditData();
});

/*获取合同销售数据*/
function getData(){
	var y = parseInt($('input[name=rangeDate]:checked').val());
	var endTime = dateTime();
	var startTime = dateTime(new Date(Date.parse(new Date()) - 60*60*24*1000*365*y));
	$.ajax({
		url:route('admin/contract/getInfoByDateAndCpy'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			startTime: startTime,
			endTime: endTime
		},
		success:function(res){
			$('body').show();
			if(res.code==200){
				if(res.data[0]==null){
					//数据为空
				}else{
					dataPool = [];
					orignal_data = res.data;
					res.data.forEach(function(items,index){
						var o = {
							value: items.payable,
							count: 1,
							date: new Date(items.sign_time)
						};
						dataPool.push(o);
					});
					createChart();
				}
			}
		}
	});
}

/*获取新客户相关数据*/
function getNewData(){
	$.ajax({
		url:route('admin/customers/type_new'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			page: 1,
			pageSize: 1000,
			keywords: ''
		},
		success:function(res){
			if(res.code==200){
				if(res.data.data[0]==null){
					//数据为空
				}else{
					dataPool = [];
					orignal_data = res.data.data;
					res.data.data.forEach(function(items,index){
						var o = {
							value: items.pay,
							count: 1,
							date: new Date(items.sign_time)
						};
						dataPool.push(o);
					});
					createChart();
					$('input[name=sale_mans]').prop('checked',false);
					$('input[name=sale_mans]').eq(0).prop('checked',true);
				}
			}
		}
	});
}

/*获取信用相关数据*/
function getCreditData(){
	var y = parseInt($('input[name=rangeDateCredit]:checked').val());
	var endDate = dateTime();
	var startDate = dateTime(new Date(Date.parse(new Date()) - 60*60*24*1000*365*y));
	var company = $('input[name=customerCredit]').val();
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
					TOAST('不存在');
				}else{
					creditDataPool = [];
					credit_orignal_data = res.data;
					res.data.forEach(function(items,index){
						var o = {
							overDraft: items.overDraft,
							creditLine: items.creditLine,
							creditPeriod: items.creditPeriod,
							date: new Date(items.checkDate)
						};
						creditDataPool.push(o);
					});
					createCreditChart();
				}
			}
		}
	});
}

/*创建合同销售图*/
function createChart() {
	var baseUnit = $('input[name=baseUnit]:checked').val();
    $("#chart").kendoChart({
    	title: {
            text: "合同趋势"
        },
        legend: {
            position: "bottom"
        },
        dataSource: {
            data: dataPool
        },
        series: [{
            type: "column",
            field: "value",
            name: '销售额',
            aggregate: 'sum',
            categoryField: "date"
        },{
            type: "column",
            field: "count",
            name: '合同数',
            aggregate: 'sum',
            categoryField: "date",
            axis: "c"
        }],
        categoryAxis: {
            baseUnit: baseUnit,
            majorGridLines: {
                visible: false
            },
            labels: {
            	dateFormats: {
            		months: "MM/yy"
            	}
            },
            axisCrossingValues: [0, 100]
        },
        valueAxes: [{
        	name: "v",
        	title: {'text': '销售额'}
        },{
        	name: "c",
        	title: {'text': '合同数'}
        }],
        valueAxis: {
            line: {
                visible: false
            }
        },
        tooltip: {
            visible: true,
            template: "#= value #"
        }
    });
}

/*创建信用趋势图*/
function createCreditChart(){
	setTimeout(function(){
		var baseUnit = $('input[name=baseUnitCredit]:checked').val();
	    $("#creditChart").kendoChart({
	    	title: {
	            text: "信用趋势"
	        },
	        legend: {
	            position: "bottom"
	        },
	        dataSource: {
	            data: creditDataPool
	        },
	        series: [{
	            type: "column",
	            field: "creditLine",
	            name: '信用额度',
	            aggregate: 'max',
	            categoryField: "date",
	            axis: "l"
	        },{
	            type: "column",
	            field: "creditPeriod",
	            name: '信用期限',
	            aggregate: 'max',
	            categoryField: "date",
	            axis: "p"
	        },{
	            type: "line",
	            field: "overDraft",
	            name: '欠款',
	            aggregate: 'max',
	            color: "#0f9500",
	            categoryField: "date",
	            axis: "m"
	        }],
	        categoryAxis: {
	            baseUnit: baseUnit,
	            majorGridLines: {
	                visible: false
	            },
	            labels: {
	            	dateFormats: {
	            		months: "MM/yy"
	            	}
	            },
	            axisCrossingValues: [0,0,100]
	        },
	        valueAxes: [{
	        	name: "m",
	        	title: {'text': '欠款'}
	        },{
	        	name: "l",
	        	title: {'text': '信用额度'}
	        },{
	        	name: "p",
	        	title: {'text': '信用期限'}
	        }],
	        valueAxis: {
	            line: {
	                visible: false
	            }
	        },
	        tooltip: {
	            visible: true,
	            template: "#= value #"
	        }
	    });
	},500);
}

/*刷新合同销售图*/
function refresh() {
    var chart = $("#chart").data("kendoChart"),
        series = chart.options.series,
        categoryAxis = chart.options.categoryAxis,
        baseUnitInputs = $("input:radio[name=baseUnit]"),
        aggregateInputs = $("input:radio[name=type_show]");

    categoryAxis.baseUnit = baseUnitInputs.filter(":checked").val();
    // for (var i = 0, length = series.length; i < length; i++) {
        // series[i].aggregate = aggregateInputs.filter(":checked").val();
    // };

    chart.refresh();
}

/*刷新信用趋势图*/
function refreshCredit(){
	var chart = $("#creditChart").data("kendoChart"),
        series = chart.options.series,
        categoryAxis = chart.options.categoryAxis,
        baseUnitInputs = $("input:radio[name=baseUnitCredit]");

    categoryAxis.baseUnit = baseUnitInputs.filter(":checked").val();

    chart.refresh();
}

/*初始化搜索*/
function initSearch(){
	var _arr = [{
		name: 'sale_man',
		url: route('admin/contract/salesMan')
	},{
		name: 'customer',
		url: route('common/fogSearchCustomerName')
	},{
		name: 'customerCredit',
		url: route('common/fogSearchCustomerName')
	}];	
	_arr.forEach(function(items,index){
		$('input[name="'+items.name+'"]').kendoAutoComplete({
	        dataSource: {
	            serverFiltering: true,
	            transport: {
	                read: {
	                    url: items.url
	                }
	            }
	        },
	        clearButton: false,
	        close: function(t){
	        	var type = t.sender.element.attr('name');
	        	if(type=='sale_man'){
	        		var v = $('input[name=sale_mans]:checked').val();
	        		listenSearchChange(type,v);
	        	}else if(type=='customer'){
	        		var v = $('input[name=customers]:checked').val();
	        		listenSearchChange(type,v);
	        	}else{
	        		getCreditData();
	        	}
	        }
	    });
	});
}

/*业务员客户点击*/
function listenSearchChange(type,v){
	var val_cpy = $('input[name=customer]').val();
	var val_sale_man = $('input[name=sale_man]').val();
	if(type=='sale_man'){
		if(v==1){
			k_sale = '';
			next();
		}else if(v==2){
			if(val_sale_man!=''){
				searchSalePerson('orignal_data',val_sale_man,function(user_id){
					k_sale = user_id;
					next();
				});
			}
		}
	}else{
		if(v==1){
			k_cpy = '';
			next();
		}else if(v==3){
			if(val_cpy!=''){
				searchCpy('orignal_data',val_cpy,function(abb){
					k_cpy = abb;
					next();
				});
			}
		}else if(v==2){
			getNewData();
		}
	}

	function next(){
		dataPool = [];
		var _dataPool = [];
		var arr_sale = [],arr_cpy = [];
		orignal_data.forEach(function(items,index){
			if(k_sale==''){
				arr_sale.push({
					id: items.id,
					value: items.payable,
					count: 1,
					date: new Date(items.sign_time)
				});
			}else{
				if(k_sale==items.sale_person){
					arr_sale.push({
						id: items.id,
						value: items.payable,
						count: 1,
						date: new Date(items.sign_time)
					});
				}
			}
			if(k_cpy==''){
				arr_cpy.push({
					id: items.id,
					value: items.payable,
					count: 1,
					date: new Date(items.sign_time)
				});
			}else{
				if(k_cpy==items.cus_abb){
					arr_cpy.push({
						id: items.id,
						value: items.payable,
						count: 1,
						date: new Date(items.sign_time)
					});
				}
			}
		});
		_dataPool = _dataPool.concat(arr_sale);
		_dataPool = _dataPool.concat(arr_cpy);
		var hash_obj = {};
		_dataPool.forEach(function(items,index){
			if(!hash_obj[items.id]){
				hash_obj[items.id] = 1;
			}else{
				dataPool.push(items);
			}
		});
		// console.log(dataPool);
		createChart();
	}
}

/*搜索业务员*/
function searchSalePerson(o_arr,val,cb){
	$.ajax({
		url:route('common/getUserIdByUserName'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			val: val
		},
		success:function(res){
			var user_id = res.data;
			cb(user_id);
		}
	});
}

/*搜索公司*/
function searchCpy(o_arr,val,cb){
	$.ajax({
		url:route('common/getAbbByCompany'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			val: val
		},
		success:function(res){
			var abb = res.data.abb;
			cb(abb);
		}
	});
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
    window.top.$("body").append(html);
    if(!n){
        setTimeout(function(){
            CANCEL();
        },1500);
    }
}
function CANCEL(){
    window.top.$('#my-toast,#hs_modal').remove();
}