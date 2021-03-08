var express = require('express');
var url = require('url');
var modMCustomers = require('../model/m_customers.js');

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	modMCustomers.list(page,function(result){
		var album_arr = [];
		result.forEach(function(items,index){
			if(items.album.indexOf(',')==-1){
				album_arr.push(items.album);
			}else{
				album_arr.push(items.album.split(',')[0]);
				result[index].album = items.album.split(',')[0];
			}
		});
		if(page==1){
			res.render('./pages/m_customers',{
				result:result,
				album_arr:album_arr
			});
		}else{
			SEND(res,200,'ok',result);
		}	
	});
}
this.index_list = function(req,res,next){
	modMCustomers.list(1,function(result){
		result.forEach(function(items,index){
			if(items.album.indexOf(',')!=-1){
				var album =  items.album.split(',')[0];
				result[index].album = album;
			}
		});
		SEND(res,200,'ok',result);
	});
}
this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var keyword = params.keyword;
	var page = params.page;
	modMCustomers.search(keyword,function(rows){
		if(rows[0]==null){
			SEND(res,-1,'不存在该公司',[]);
		}else{
			var arr = [];
			rows.forEach(function(items,index){
				arr.push(items);
			});
			var start = parseInt(page-2+'0');
			var end = start+10;
			var arrEnd = arr.slice(start,end);
			arrEnd.forEach(function(items,index){
				if(items.album.indexOf(',')!=-1){
					var album =  items.album.split(',')[0];
					arrEnd[index].album = album;
				}
			});
			SEND(res,200,'succeed',arrEnd);
		}
	});
}
this.createCpy = function(req,res,next){
	var name = req.body.name;
	var abb = req.body.abb;
	// var update_person = req.cookies.admin_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	modMCustomers.checkName(name,abb,function(rows){
		if(rows.length>0){
			SEND(res,-1,'该简称已存在',[]);
		}else{
			modMCustomers.createCpy(name,abb,update_person,time,function(rows){
				SEND(res,200,'创建成功',[]);
			});
		}
	});
}
this.del = function(req,res,next){
	var abb = req.body.abb;
	// var update_person = req.cookies.admin_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	modMCustomers.del(abb,update_person,time,function(rows){
		res.send(rows);
	});
}
this.sort = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var keyword = params.keyword;
	var page = params.page;
	modMCustomers.selectSort(keyword,page,function(rows){
		if(keyword=='update_time'){
			var arr = [],arr_null = [];
			rows.forEach(function(items,index){
				var time = Date.parse(new Date(items.update_time));
				if(items.update_time==''){
					arr_null.push(items);
				}else{
					items.date = time;
					arr.push(items);
				}
			});
			var _arr = bubbleSort(arr);
			var sort_arr = [];
			var l = _arr.length-1;
			_arr.forEach(function(items,index){
				sort_arr[l-index]=items;
			});
			var __arr = [];
			var arr_end = __arr.concat(sort_arr,arr_null);
			var start = parseInt(page-2+'0');
			var end = start+10;
			arr_end = arr_end.slice(start,end);
			SEND(res,200,'',arr_end);
		}else if(keyword=='all'||keyword=='level'){
			rows.forEach(function(items,index){
				if(items.album!=null&&items.album.indexOf(',')!=-1){
					var album =  items.album.split(',')[0];
					rows[index].album = album;
				}
			});
			SEND(res,200,'',rows);
		}else{
			var res_arr = resortArr(rows);
			var start = parseInt(page-2+'0');
			var end = start+10;
			res_arr = res_arr.slice(start,end);
			SEND(res,200,'',res_arr);
		}
	});
}
this.mainCustomer = function(req,res,next){
	// var params = url.parse(req.url,true).query;
	// var abb = params.abb;
	var abb = req.path.split('/mainCustomer/')[1];
	modMCustomers.getInfo(abb,function(result){
		var album_arr = [];
		result.forEach(function(items,index){
			try{
				if(items.album.indexOf(',')==-1){
					album_arr.push(items.album);
				}else{
					album_arr = items.album.split(',');
				}
			}catch(e){}
		});
		res.render('./pages/m_customers_main',{
			result:result[0],
			album_arr:album_arr
		});
	});
}
this.update = function(req,res,next){
	var str = req.body.str;
	var cpy = req.body.cpy;
	var input_abb = req.body.input_abb;
	var input_company = req.body.input_company;
	// var update_person = req.cookies.admin_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	var isExist = 0;
	modMCustomers.checkAbb(function(result){
		result.forEach(function(items,index){
			if(items.abb==input_abb&&items.company!=input_company){
				isExist = 1;
				SEND(res,-1,'已存在该简称',[]);
				return;
			}
		});
		if(!isExist){
			modMCustomers.update(cpy,str,update_person,time,function(result){
				SEND(res,200,'更新成功',result);
			});
		}
	});
}
function resort(page,rows,bool){
	var arr = [],arr_null = [];
	rows.forEach(function(items,index){
		var t = items.update_time?items.update_time:items.birth;
		var time = Date.parse(new Date(t));
		if(t==''){
			arr_null.push(items);
		}else{
			items.date = time;
			arr.push(items);
		}
	});
	var _arr = bubbleSort(arr);
	if(bool){
		var sort_arr = [];
		var l = _arr.length-1;
		_arr.forEach(function(items,index){
			sort_arr[l-index]=items;
		});
	}
	var __arr = [];
	if(bool){
		var arr_end = __arr.concat(sort_arr,arr_null);
	}else{
		var arr_end = __arr.concat(_arr,arr_null);
	}
	// var arr_end = __arr.concat(sort_arr,arr_null);
	var start = parseInt(page-2+'0');
	var end = start+10;
	var send_arr = arr_end.slice(start,end);
	send_arr.forEach(function(items,index){
		if(items.album!=null&&items.album.indexOf(',')!=-1){
			var album =  items.album.split(',')[0];
			send_arr[index].album = album;
		}
	});
	return send_arr;
}
function bubbleSort(arr){
    var len=arr.length,j;
    var temp;
    while(len>0){
        for(j=0;j<len-1;j++){
            if(parseInt(arr[j].date)>parseInt(arr[j+1].date)){
                temp=arr[j];
                arr[j]=arr[j+1];
                arr[j+1]=temp;
            }
        }
        len--;
    }
    return arr;
} 
function resortArr(arr){
	var len = arr.length;
	var _arr = [];
	for (var i = 0; i < len; i++) {
		_arr[i] = arr[len-i-1];
	};
	return _arr
}