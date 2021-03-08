var token;
var _d1 = [];
var _d2 = [];
var local_data; //本地数据源
var proxy_data = [];
var dataPool; //初始化后的数据池
var data1 = [],data2 = [],data3 = [];
var hzArr = [],jnArr = [];
var k_sale = 1,k_customer = 1;
var LASTYEAR = new Date().getFullYear()-1,LASTLASTYEAR = new Date().getFullYear()-2;
var closedArr = [];
$(document).ready(function(){
    var href = window.location.href;
    token = href.split('?token=')[1];
    getData();
    initSearch();
    $('._last_year,._last_year_d').html(LASTYEAR);
    $('._last_last_year_d').html(LASTLASTYEAR);
    getClosedData();
});

$(document).on('change','input[name=sale_mans]',function(){
	var v = $(this).val();
	if(v==1||v==2||v==3){
		$('input[name=sale_man]').attr('readonly','readonly');
	}else if(v==4){
		$('input[name=sale_man]').removeAttr('readonly');
    }
	listenSearchChange('sale_man',v);
});

$(document).on('change','input[name=customers]',function(){
	var v = $(this).val();
	if(v==1||v==2||v==3){
		$('input[name=customer]').attr('readonly','readonly');
	}else{
		$('input[name=customer]').removeAttr('readonly');
	}
	listenSearchChange('customer',v);
});

function dealer(){
    var yyyy = new Date().getFullYear();
    dataPool = [];
    data1 = [];
    data2 = [];
    data3 = [];
    proxy_data.forEach(function(items,index){
        var o = {
            value: Number(items.achievement),
            date: new Date(items.sign_time)
        };
        if(items.hasDelivery){
            o.hasDelivery = Number(items.achievement);
            o.notDelivery = 0;
        }else{
            o.hasDelivery = 0;
            o.notDelivery = Number(items.achievement);
        }
        dataPool.push(o);
        if(new Date(items.sign_time).getFullYear()==yyyy){
            data3.push(o);
        }else if(new Date(items.sign_time).getFullYear()==yyyy-1){
            data2.push(o);
        }else{
            data1.push(o);
        }
    });
}

/*获取合同业绩数据*/
function getData(){
	var endTime = dateTime();
	var yyyy = new Date().getFullYear();
	var startTime = yyyy - 2 + '-01-01';
	$.ajax({
		url:route('home/pricing/getAchievementInfo'),
		type:'get',
		dataType:'json',
        timeout:30000,
        headers: {
            token: token
        },
		data:{
			startTime: startTime,
			endTime: endTime
		},
		success:function(res){
			$('body').show();
			if(res.code==200){
				if(res.data[0]==null){
                    //数据为空
                    alert('数据不存在');
				}else{
                    local_data = res.data;
                    _d1 = local_data;
                    local_data.forEach(function(items,index){
                        proxy_data.push(items);
                    });
					dealer();
                    getStaffData();
				}
			}
		}
	});
}

function getClosedData() {
	var year = new Date().getFullYear();
	$.ajax({
        url:route('home/pricing/getClosedAchievementInfo'),
        headers: {
            token: token
        },
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			year: year
		},
		success:function(res){
			closedArr = res.data;
			renderClosedAmount();
		}
	});
}

function renderClosedAmount() {
	var sale_mans = $('input[name=sale_mans]:checked').val();
	var customers = $('input[name=customers]:checked').val();
	if (customers != 1) {
		$('.closedAmount').html('');
	}
    var amount = 0;
	if (sale_mans == 1) {
		for (var i = 0; i < closedArr.length; i++) {
			amount += Number(closedArr[i].achievement);
		}
	} else if (sale_mans == 2) {
		// 济南
		for (var i = 0; i < closedArr.length; i++) {
			if (jnArr.indexOf(closedArr[i].sale_person) != -1) {
				amount += Number(closedArr[i].achievement);
			}
		}
	} else if (sale_mans == 3) {
		// 杭州
		for (var i = 0; i < closedArr.length; i++) {
			if (hzArr.indexOf(closedArr[i].sale_person) != -1) {
				amount += Number(closedArr[i].achievement);
			}
		}
	} else {
        var sale_man = $('input[name=sale_man]').val();
		if (sale_man) {
			searchSalePerson(sale_man, function(user_id) {
				for (var i = 0; i < closedArr.length; i++) {
					if (user_id == closedArr[i].sale_person) {
						amount += Number(closedArr[i].achievement);
					}
				}
				$('.closedAmount').html(amount);
			});
		}
    }
	$('.closedAmount').html(amount);
}

/*获取新客户数据*/
function getNewData(y,cb){
    y = y==2?1:2;
    $.ajax({
		url:route('home/pricing/getNewCusAchievementInfo'),
		type:'get',
		dataType:'json',
        timeout:30000,
        headers: {
            token: token
        },
		data:{
			year: y
		},
		success:function(res){
            _d2 = res.data;
            cb();
        }
    });
}

/*获取员工数据*/
function getStaffData(){
	$.ajax({
		url:route('admin/employees/getAllList'),
		type:'get',
		dataType:'json',
		timeout:30000,
		success:function(res){
			var res_arr = res.data;
			res_arr.forEach(function(items,index){
				if(items.group=='杭州组'){
                    hzArr.push(items.user_id);
				}else{
					jnArr.push(items.user_id);
				}
			});
			createChart();
			createChart2();
		}
	});
}

/*创建图1*/
function createChart(){
    function sortArr(arr){
		var _arr = [];
		for(var i = 0; i < 12; i++ ){
			_arr[i] = [];
		}
		arr.forEach(function(items,index){
			var _i = items.date.getMonth();
			_arr[_i].push(items);
		});
		_arr.forEach(function(items,index){
			var sum = 0;
			items.forEach(function(it,ind){
				sum += it.value;
			});
			_arr[index] = sum;
		});
		return _arr;
	}
	function sortTotalarr(arr){
		var _arr = [];
		for(var i = 11; i >= 0;i-- ){
			var sum = 0;
			arr.forEach(function(items,index){
				if(index<=i){
					sum += items;
				}
			});
			_arr[i] = sum;
		}
		return _arr;
	}

	// var _data1 = sortArr(data1);
    // var _data2 = sortArr(data2);
    var _data1 = data1.filter(items => items.hasDelivery != 0);
	_data1 = sortArr(_data1);
	var _data2 = data2.filter(items => items.hasDelivery != 0);
	_data2 = sortArr(_data2);

	var _data3 = sortArr(data3);
	var _data4_ = [];
	data3.map(items => {
		if(items.hasDelivery){
			_data4_.push(items);
		}
	});
	var _data4 = sortArr(_data4_);


	var total_data1 = sortTotalarr(_data1);
	var total_data2 = sortTotalarr(_data2);
	var total_data3 = sortTotalarr(_data3);
	var total_data4 = sortTotalarr(_data4);
	var yyyy = new Date().getFullYear();
	$("#chart").kendoChart({
		renderAs: "canvas",
		title: {
            text: "业绩同比"
        },
        legend: {
            position: "bottom"
        },
        series: [{
        	type: "column",
            name: yyyy-2+"年",
            field: "value",
            data: _data1,
            color: 'rgb(255,112,14)'
        },{
        	type: "line",
            name: yyyy-2+"年",
            field: "value",
            data: total_data1,
            color: 'rgb(255,112,14)'
        },{
        	type: "column",
            name: yyyy-1+"年",
            field: "value",
            data: _data2,
            color: '#0f0'
        },{
        	type: "line",
            name: yyyy-1+"年",
            field: "value",
            data: total_data2,
            color: '#0f0'
		},{
        	type: "column",
            name: yyyy+"年",
            field: "value",
            data: _data3,
            color: '#00f'
        },{
        	type: "line",
            name: yyyy+"年",
            field: "value",
            data: total_data3,
            color: '#00f'
		}
		,{
        	type: "column",
            name: yyyy+"年已发货",
            field: "hasDelivery",
            data: _data4,
            color: '#a52ed5'
        },{
        	type: "line",
            name: yyyy+"年已发货",
            field: "hasDelivery",
            data: total_data4,
            color: '#a52ed5'
		}],
        categoryAxis: {
            categories: ["1月", "2月", "3月", "4月", "5月", "6月","7月", "8月", "9月", "10月", "11月", "12月"],
            majorGridLines: {
                visible: false
            }
        },
        tooltip: {
            visible: true,
            template: "#= series.name #: #= value #"
        },
        pannable: {
            lock: "y"
        },
        zoomable: {
            mousewheel: {
                lock: "y"
            },
            selection: {
                lock: "y"
            }
        }
    });
    getSum();
}

/*创建图2*/
function createChart2(){
    $("#chart2").kendoChart({
    	title: {
            text: "业绩走势"
        },
        renderAs: "canvas",
        legend: {
            position: "bottom"
		},
		seriesDefaults: {
            type: "bar",
            stack: true
        },
        dataSource: {
            data: dataPool
        },
        series: [{
            type: "column",
            field: "hasDelivery",
            name: '已发货',
            aggregate: 'sum',
			categoryField: "date",
			color: '#a52ed5'
        },{
            type: "column",
            field: "notDelivery",
            name: '未发货',
            aggregate: 'sum',
			categoryField: "date",
			color: '#00f'
        }],
        categoryAxis: {
        	baseUnit: 'months',
            labels: {
            	dateFormats: {
            		months: "MM/yy"
            	}
            },
            majorGridLines: {
                visible: false
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
        },
        pannable: {
            lock: "y"
        },
        zoomable: {
            mousewheel: {
                lock: "y"
            },
            selection: {
                lock: "y"
            }
        }
    });
}

/*搜索条件切换*/
function listenSearchChange(type,v){
    if(type=='sale_man'){
        if(v==1||v==2||v==3){
            k_sale = v;
            doChart();
        }else{
            v = $('input[name=sale_man]').val();
            if(v){
                searchSalePerson(v,function(user_id){
                    k_sale = user_id;
                    doChart();
				});
            }
        }
    }else{
        if(v==1){
            k_customer = 1;
            local_data = _d1;
            doChart();
        }else if(v==2||v==3){
            k_customer = v;
            getNewData(v,function(){
                local_data = _d2;
                doChart();
            });
        }else{
            v = $('input[name=customer]').val();
            if(v){
                local_data = _d1;
                k_customer = v;
                doChart();
            }
        }
    }
    renderClosedAmount();

    function doChart(){
        proxy_data = [];
        local_data.forEach(function(items,index){
            if(k_sale==1){
                proxy_data.push(items);
            }else if(k_sale==2){
                if(jnArr.indexOf(items.sale_person)!=-1){
                    proxy_data.push(items);
                }
            }else if(k_sale==3){
                if(hzArr.indexOf(items.sale_person)!=-1){
                    proxy_data.push(items);
                }
            }else{
                if(items.sale_person==k_sale){
                    proxy_data.push(items);
                }
            }
        });
        var middleArr = [];
        proxy_data.forEach(function(items,index){
            if(k_customer==1||k_customer==2||k_customer==3){
                middleArr.push(items);
            }else{
                if(items.company==k_customer){
                    middleArr.push(items);
                }
            }
        });
        var n_arr = [];
        for (var i = 0; i < proxy_data.length; i++) {
            for (var j = 0; j < middleArr.length; j++) {
                if(proxy_data[i].id==middleArr[j].id){
                    n_arr.push(proxy_data[i]);
                    break;
                }
            }
        }
        proxy_data = n_arr;
        dealer();
        createChart();
        createChart2();
    }
}

/*初始化搜索(1)*/
function initSearch(){
	var _arr = [{
		name: 'sale_man',
		url: route('admin/contract/salesMan')
	},{
		name: 'customer',
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
	        	}
	        }
	    });
	});
}

/*搜索业务员(1)*/
function searchSalePerson(val,cb){
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

function getSum(){
    var formData = {};
    var company = $('input[name=customers]:checked').val();
    if(company==4) formData.company = $('input[name=customer]').val();

    var sale_person = $('input[name=sale_mans]:checked').val();
    if(sale_person==4){
        formData.sale_person = $('input[name=sale_man]').val();
    }else if (sale_person==1){
        formData.sale_person = '业务部';
    }else if (sale_person==2){
        formData.sale_person = '济南组';
    }else if (sale_person==3){
        formData.sale_person = '杭州组';
    }
    if(company==2||company==3){
        // $('#info-bar').hide();
        // return;
        $('._last_year_d_price').html('...');
        $('._last_two_year_d_price').html('...');
		$('._last_three_year_d_price').html('...');

        newCustomerDeferred(LASTYEAR, new Date().getFullYear(), function(sum){
			$('._last_year_d_price').text(sum);
        });
        // newCustomerDeferred(LASTYEAR - 1, new Date().getFullYear() -1 , function(sum){
		// 	$('._last_two_year_d_price').text(sum);
        // });
        // newCustomerDeferred(LASTYEAR - 2, new Date().getFullYear() - 2, function(sum){
		// 	$('._last_three_year_d_price').text(sum);
		// });

        function newCustomerDeferred(orderSignYear, orderDeliveryYear, cb) {
            $.ajax({
                url:route('home/pricing/newCustomerDeferred'),
                type:'get',
                dataType:'json',
                timeout:30000,
                headers: {
                    token: token
                },
                data: {
                    year: Number(company) - 1,
                    sale_person: formData.sale_person,
                    orderSignYear: orderSignYear,
                    orderDeliveryYear: orderDeliveryYear
                },
                success:function(res){
                    var sum = res.data;
                    cb(sum);
                }
            });
        }
        return;
    } else {
        // $('#info-bar').show();
    }


    getSumData({
        orderSignYear: LASTYEAR,
        orderDeliveryYear: new Date().getFullYear()
    },formData,'._last_year_d_price');
    // getSumData({
    //     orderSignYear: LASTYEAR - 1,
    //     orderDeliveryYear: new Date().getFullYear() - 1
    // },formData,'._last_two_year_d_price');
    // getSumData({
    //     orderSignYear: LASTYEAR - 2,
    //     orderDeliveryYear: new Date().getFullYear() - 2
    // },formData,'._last_three_year_d_price');
    function getSumData(timeObj,data,cls){
        $(cls).text('...');
        $.ajax({
            url:route('home/pricing/getSum'),
            type:'get',
            dataType:'json',
            timeout:30000,
            headers: {
                token: token
            },
            data: {
                company: data.company,
                sale_person: data.sale_person,
                orderSignYear: timeObj.orderSignYear,
                orderDeliveryYear: timeObj.orderDeliveryYear
            },
            success:function(res){
                var sum = res.data;
                $(cls).text(sum);
            }
        });
    }
}