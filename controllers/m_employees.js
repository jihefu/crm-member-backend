var express = require('express');
var url = require('url');
var mod_m_employees = require('../model/m_employees.js');
var mod_admin = require('../model/mod_employees.js');

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	mod_m_employees.list(page,function(result){
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
			res.render('./pages/m_employees',{
				result:result,
				album_arr:album_arr
			});
		}else{
			SEND(res,200,'ok',result);
		}	
	});
}
this.index_list = function(req,res,next){
	mod_m_employees.list(1,function(result){
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
	mod_m_employees.search(keyword,function(rows){
		if(rows[0]==null){
			SEND(res,-1,'不存在员工',[]);
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
this.sort = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var keyword = params.keyword;
	var page = params.page;
	mod_m_employees.selectSort(keyword,page,function(rows){
		if(keyword=='update_time'){
			var send_arr = resort(page,rows,true);
			SEND(res,200,'',send_arr);
		}else if(keyword=='birth'){
			var send_arr = resort(page,rows,false);
			SEND(res,200,'',send_arr);
		}else if(keyword=='all'||keyword=='user_name'||keyword=='employees'){
			rows.forEach(function(items,index){
				if(items.album.indexOf(',')!=-1){
					var album =  items.album.split(',')[0];
					rows[index].album = album;
				}
			});
			SEND(res,200,'',rows);
		}else if(keyword=='user_id'){
			var arr1 = [],arr2 = [],_arr = [];
			rows.forEach(function(items,index){
				if(items.user_id.length==3){
					arr2.push(items);
				}else{
					arr1.push(items);
				}
			});
			var arr = _arr.concat(arr2,arr1);
			var start = parseInt(page-2+'0');
			var end = start+10;
			arr = arr.slice(start,end);
			SEND(res,200,'',arr);
		}
	});
}
this.createCpy = function(req,res,next){
	var name = req.body.name;
	var user_id = req.body.user_id;
	// var update_person = req.cookies.admin_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	mod_m_employees.checkName(name,user_id,function(rows){
		if(rows.length>0){
			SEND(res,-1,'该缩写已存在',[]);
		}else{
			mod_m_employees.createCpy(name,user_id,update_person,time,function(rows){
				SEND(res,200,'创建成功',[]);
			});
		}
	});
}
this.mainEmployee = function(req,res,next){
	// var params = url.parse(req.url,true).query;
	// var user_id = params.user_id;
	var user_id = req.path.split('/mainEmployee/')[1];
	mod_m_employees.getInfo(user_id,function(result){
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
		res.render('./pages/m_employee_main',{
			result:result[0],
			album_arr:album_arr
		});
	});
}
this.update = function(req,res,next){
	var str = req.body.str;
	var user_id = req.body.user_id;
	var input_user_id = req.body.input_user_id;
	var input_user_name = req.body.input_user_name;
	// var update_person = req.cookies.admin_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	var isExist = 0;
	mod_m_employees.checkAbb(function(result){
		result.forEach(function(items,index){
			if(items.user_id==input_user_id&&items.user_name!=input_user_name){
				isExist = 1;
				SEND(res,-1,'已存在该工号',[]);
				return;
			}
		});
		if(!isExist){
			mod_m_employees.update(user_id,str,update_person,time,function(result){
				SEND(res,200,'更新成功',result);
			});
		}
	});
}
this.del = function(req,res,next){
	var user_id = req.body.user_id;
	// var update_person = req.cookies.admin_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	mod_m_employees.del(user_id,update_person,time,function(rows){
		res.send(rows);
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
		if(items.album.indexOf(',')!=-1){
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