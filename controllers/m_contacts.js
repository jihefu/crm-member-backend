var express = require('express');
var url = require('url');
var mod_m_contacts = require('../model/m_contacts.js');
var mod_admin = require('../model/mod_contacts.js');

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	mod_m_contacts.list(page,function(result){
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
			res.render('./pages/m_contacts',{
				result:result,
				album_arr:album_arr
			});
		}else{
			SEND(res,200,'ok',result);
		}	
	});
}
this.index_list = function(req,res,next){
	mod_m_contacts.list(1,function(result){
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
	mod_m_contacts.search(keyword,function(rows){
		if(rows[0]==null){
			SEND(res,-1,'不存在该联系人',[]);
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
	mod_m_contacts.selectSort(keyword,page,function(rows){
		if(keyword!='update_time'){
			SEND(res,200,'',rows);
		}else{
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
			var send_arr = arr_end.slice(start,end);
			send_arr.forEach(function(items,index){
				if(items.album.indexOf(',')!=-1){
					var album =  items.album.split(',')[0];
					send_arr[index].album = album;
				}
			});
			SEND(res,200,'',send_arr);
		}
	});
}
this.createCpy = function(req,res,next){
	var name = req.body.name;
	var abb = req.body.abb;
	// var update_person = req.cookies.admin_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	mod_admin.checkName(name,abb,function(rows){
		var m = 0;
		rows.forEach(function(items){
			if(items.abb==abb){
				m = 1;
				SEND(res,-1,'该缩写已存在',[]);
			}
		});
		if(m == 1) return;
		mod_admin.createCpy(name,abb,update_person,time,function(rows){
			SEND(res,200,'创建成功',[]);
		});
	});
}
this.mainContact = function(req,res,next){
	// var params = url.parse(req.url,true).query;
	// var abb = params.abb;
	var abb = req.path.split('/mainContact/')[1];
	mod_m_contacts.getInfo(abb,function(result){
		var album_arr = [];
		result.forEach(function(items,index){
			if(items.album.indexOf(',')==-1){
				album_arr.push(items.album);
			}else{
				album_arr = items.album.split(',');
			}
		});
		res.render('./pages/m_contacts_main',{
			result:result[0],
			album_arr:album_arr
		});
	});
}
this.update = function(req,res,next){
	var str = req.body.str;
	var abb = req.body.abb;
	var input_abb = req.body.input_abb;
	var input_name = req.body.input_name;
	// var update_person = req.cookies.admin_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	var isExist = 0;
	mod_m_contacts.checkAbb(function(result){
		result.forEach(function(items,index){
			if(items.abb==input_abb&&items.name!=input_name){
				isExist = 1;
				SEND(res,-1,'已存在该简称',[]);
				return;
			}
		});
		if(!isExist){
			mod_m_contacts.update(abb,str,update_person,time,function(result){
				SEND(res,200,'更新成功',result);
			});
		}
	});
}
this.del = function(req,res,next){
	var abb = req.body.abb;
	// var update_person = req.cookies.admin_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	mod_m_contacts.del(abb,update_person,time,function(rows){
		res.send(rows);
	});
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