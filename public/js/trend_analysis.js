var local_data = [];
var orignal_data = [],dataPool = [];
var data1 = [],data2 = [],data3 = [];
var k_sale = '',k_cpy = '';
var hz_arr_ify = '',jn_arr_ify = '';
var LASTYEAR = new Date().getFullYear()-1,LASTLASTYEAR = new Date().getFullYear()-2;
var closedArr = [];
$(document).ready(function(){
    getData();
	initSearch();
	getClosedData();
});
$(document).on('change','input[name=sale_mans]',function(){
	var v = $(this).val();
	if(v==1||v==3||v==4){
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
		orignal_data = local_data;
	}else if(v==2||v==4){
		$('input[name=customer]').attr('readonly','readonly');
	}else if(v==3){
		$('input[name=customer]').removeAttr('readonly');
		orignal_data = local_data;
	}
	listenSearchChange('customer',v);
});

/*获取合同销售数据(1)*/
function getData(){
	var endTime = dateTime();
	var yyyy = new Date().getFullYear();
	var startTime = yyyy - 2 + '-01-01';
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
					for(var i=0;i<res.data.length;i++){
						res.data[i].payable = parseInt(res.data[i].payable);
					}
					local_data = res.data;
					dataPool = [];
					orignal_data = res.data;
					res.data.forEach(function(items,index){
						var o = {
							value: items.payable,
							date: new Date(items.sign_time)
						};
						if(items.hasDelivery){
							o.hasDelivery = items.payable;
							o.notDelivery = 0;
						}else{
							o.hasDelivery = 0;
							o.notDelivery = items.payable;
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
					getStaffData();
				}
			}
		}
	});
}

function getClosedData() {
	var year = new Date().getFullYear();
	$.ajax({
		url:route('admin/contract/getClosedData'),
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
			amount += Number(closedArr[i].payable);
		}
	} else if (sale_mans == 3) {
		// 济南
		var userIdArr = jn_arr_ify.split(',');
		for (var i = 0; i < closedArr.length; i++) {
			if (userIdArr.indexOf(closedArr[i].sale_person) != -1) {
				amount += Number(closedArr[i].payable);
			}
		}
	} else if (sale_mans == 4) {
		// 杭州
		var userIdArr = hz_arr_ify.split(',');
		for (var i = 0; i < closedArr.length; i++) {
			if (userIdArr.indexOf(closedArr[i].sale_person) != -1) {
				amount += Number(closedArr[i].payable);
			}
		}
	} else {
		var sale_man = $('input[name=sale_man]').val();
		if (sale_man) {
			searchSalePerson('', sale_man, function(user_id) {
				for (var i = 0; i < closedArr.length; i++) {
					if (user_id == closedArr[i].sale_person) {
						amount += Number(closedArr[i].payable);
					}
				}
				$('.closedAmount').html(amount);
			});
		}
	}
	$('.closedAmount').html(amount);
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
					hz_arr_ify += items.user_id + ',';
				}else{
					jn_arr_ify += items.user_id + ',';
				}
			});
			hz_arr_ify = hz_arr_ify.slice(0,hz_arr_ify.length-1);
			jn_arr_ify = jn_arr_ify.slice(0,jn_arr_ify.length-1);
			createChart();
			createChartRound();
		}
	});
}

/*获取新客户相关数据*/
function getNewData(){
	var v = $('input[name=customers]:checked').val();
	if(v==2){
		var year = 2;
	}else{
		var year = 1;
	}
	$.ajax({
		url:route('admin/customers/type_new'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			page: 1,
			pageSize: 1000,
			keywords: '',
			year: year
		},
		success:function(res){
			// var testData = res.data.data;
			// var s = 0;
			// for (let i = 0; i < testData.length; i++) {
			// 	if(new Date(testData[i].sign_time).getFullYear()=='2018'&&new Date(testData[i].sign_time).getMonth()==0){
			// 		s += Number(testData[i].payable);
			// 	}	
			// }
			// console.log(s);
			if(res.code==200){
				if(res.data.data[0]==null){
					//数据为空
					console.log('不存在');
				}else{
					for(var i=0;i<res.data.data.length;i++){
						res.data.data[i].payable = parseInt(res.data.data[i].payable);
					}
					orignal_data = [];
					orignal_data = res.data.data;
					dataPool = [];
					for (var i = 0; i < orignal_data.length; i++) {
						if(orignal_data[i].sign_time==null||orignal_data[i].sign_time==''||orignal_data[i].sign_time=='null'){
							orignal_data.splice(i,1);
							i--;
						}
					}
					orignal_data.forEach(function(items,index){
						if(items.sign_time!=null&&items.sign_time!=''){
							var o = {
								value: items.pay,
								date: new Date(items.sign_time)
							};
							if(items.hasDelivery){
								o.hasDelivery = items.payable;
								o.notDelivery = 0;
							}else{
								o.hasDelivery = 0;
								o.notDelivery = items.payable;
							}
							dataPool.push(o);
						}
					});
					createChart();
					$('input[name=sale_mans]').prop('checked',false);
					$('input[name=sale_mans]').eq(0).prop('checked',true);

					var yyyy = new Date().getFullYear();
					data1 = [],data2 = [],data3 = [];
					dataPool.forEach(function(items,index){
						if(items.date.getFullYear()==yyyy){
							data3.push(items);
						}else if(items.date.getFullYear()==yyyy-1){
							data2.push(items);
						}else{
							data1.push(items);
						}
					});
					createChartRound();
					/*不加这个方法有bug*/
					/*未找到原因*/
					listenSearchChange('sale_man',1);
				}
			}
		}
	});
}

/*创建销售走势图(1)*/
function createChart() {
    $("#chart").kendoChart({
    	title: {
            text: "销售走势"
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
	getSum();
}

/*创建销售同比图(1)*/
function createChartRound(){
	
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
	$("#chart2").kendoChart({
		renderAs: "canvas",
		title: {
            text: "销售同比"
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
}

/*刷新销售走势图(1)*/
function refresh() {
    createChart();
}

/*刷新销售同比图(1)*/
function refresh2() {
	createChartRound();
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
		}else if(v==3){
			/*济南组*/
			k_sale = jn_arr_ify;
			next();
		}else if(v==4){
			/*杭州组*/
			k_sale = hz_arr_ify;
			next();
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
		}else if(v==2||v==4){
			getNewData();
		}
	}
	renderClosedAmount();

	function next(){
		dataPool = [];
		data1 = [],data2 = [],data3 = [];
		var _dataPool = [];
		var arr_sale = [],arr_cpy = [];
		orignal_data.forEach(function(items,index){
			if(k_sale==''){
				var o = {
					id: items.id,
					value: items.payable,
					date: new Date(items.sign_time)
				};
				if(items.hasDelivery){
					o.hasDelivery = items.payable;
					o.notDelivery = 0;
				}else{
					o.hasDelivery = 0;
					o.notDelivery = items.payable;
				}
				arr_sale.push(o);
			}else{
				var k_sale_arr = k_sale.split(',');
				k_sale_arr.forEach(function(it,ind){
					if(it==items.sale_person){
						var o = {
							id: items.id,
							value: items.payable,
							date: new Date(items.sign_time)
						};
						if(items.hasDelivery){
							o.hasDelivery = items.payable;
							o.notDelivery = 0;
						}else{
							o.hasDelivery = 0;
							o.notDelivery = items.payable;
						}
						arr_sale.push(o);
						// arr_sale.push({
						// 	id: items.id,
						// 	value: items.payable,
						// 	date: new Date(items.sign_time)
						// });
					}
				});
			}
			if(k_cpy==''){
				var o = {
					id: items.id,
					value: items.payable,
					date: new Date(items.sign_time)
				};
				if(items.hasDelivery){
					o.hasDelivery = items.payable;
					o.notDelivery = 0;
				}else{
					o.hasDelivery = 0;
					o.notDelivery = items.payable;
				}
				arr_cpy.push(o);
				// arr_cpy.push({
				// 	id: items.id,
				// 	value: items.payable,
				// 	date: new Date(items.sign_time)
				// });
			}else{
				if(k_cpy==items.cus_abb){
					var o = {
						id: items.id,
						value: items.payable,
						date: new Date(items.sign_time)
					};
					if(items.hasDelivery){
						o.hasDelivery = items.payable;
						o.notDelivery = 0;
					}else{
						o.hasDelivery = 0;
						o.notDelivery = items.payable;
					}
					arr_cpy.push(o);
					// arr_cpy.push({
					// 	id: items.id,
					// 	value: items.payable,
					// 	date: new Date(items.sign_time)
					// });
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
		createChart();
		var yyyy = new Date().getFullYear();
		dataPool.forEach(function(items,index){
			if(items.date.getFullYear()==yyyy){
				data3.push(items);
			}else if(items.date.getFullYear()==yyyy-1){
				data2.push(items);
			}else{
				data1.push(items);
			}
		});
		createChartRound();
	}
}

/*搜索业务员(1)*/
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

/*搜索公司(1)*/
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

function getSum(){
    var formData = {};
    var company = $('input[name=customers]:checked').val();
    if(company==3) formData.company = $('input[name=customer]').val();

    var sale_person = $('input[name=sale_mans]:checked').val();
    if(sale_person==2){
        formData.sale_person = $('input[name=sale_man]').val();
    }else if (sale_person==1){
        formData.sale_person = '业务部';
    }else if (sale_person==3){
        formData.sale_person = '济南组';
    }else if (sale_person==4){
        formData.sale_person = '杭州组';
	}
    if(company==4||company==2){
		//新客户
		// $('#info-bar').hide();
		// return;
		$('._last_year_d_price').html('...');
		$('._last_two_year_d_price').html('...');
		$('._last_three_year_d_price').html('...');
		var m_y_c = company==4?1:2;

		newCustomerDeferred(LASTYEAR, new Date().getFullYear(), function(sum){
			$('._last_year_d_price').text(sum);
		});
		// newCustomerDeferred(LASTYEAR - 1, new Date().getFullYear() - 1, function(sum){
		// 	$('._last_two_year_d_price').text(sum);
		// });
		// newCustomerDeferred(LASTYEAR - 2, new Date().getFullYear() - 2, function(sum){
		// 	$('._last_three_year_d_price').text(sum);
		// });

		function newCustomerDeferred (orderSignYear, orderDeliveryYear, cb) {
			$.ajax({
				url:route('contracts/newCustomerDeferred'),
				type:'get',
				dataType:'json',
				timeout:30000,
				data: {
					year: m_y_c,
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
	
    function getSumData(timeObj,data,cls){
		$(cls).text('...');
		var formData = {
			company: data.company,
			sale_person: data.sale_person,
			orderSignYear: timeObj.orderSignYear,
			orderDeliveryYear: timeObj.orderDeliveryYear
		};
        $.ajax({
            url:route('contracts/getSum'),
            type:'get',
            dataType:'json',
            timeout:30000,
            data: formData,
            success:function(res){
                var sum = res.data;
                $(cls).text(sum);
            }
        });
    }
}