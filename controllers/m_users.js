var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var mod_admin = require('../model/mod_admin.js');
// var modUsers = require('../model/mod_users');
var users = require('../model/users');

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	users.getList(page,num,function(list){
		list.forEach(function(items,index){
			if(items.album.indexOf(',')!=-1){
				var album =  items.album.split(',')[0];
				list[index].album = album;
			}
		});
		if(page==1){
			res.render('./pages/m_users',{
				result: list
			});
		}else{
			SEND(res,200,'',list);
		}
	});
}
this.index_list = function(req,res,next){
	users.getList(1,10,function(result){
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
	users.search(keyword,function(rows){
		if(rows[0]==null){
			SEND(res,-1,'不存在该用户',[]);
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
	var key = params.key;
	var page = params.page?params.page:1;
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	page = page - 1;
	users.sort(key,page,num,function(result){
		SEND(res,200,'',result);
	});
}
this.del = function(req,res,next){
	var user_id = req.body.user_id;
	var update_person = req.session.admin_id;
	var time = TIME();
	users.del(user_id,update_person,time,function(result){
		SEND(res,200,'删除成功',[]);
	});
}
this.createCpy = function(req,res,next){
	var name = req.body.name;
	var abb = req.body.abb;
	users.checkAbb(abb,function(result){
		if(result.length>0){
			SEND(res,-1,'已存在该简称',[]);
		}else{
			var update_person = req.session.admin_id;
			var time = TIME();
			users.createUser(abb,name,update_person,time,function(user_id){
				SEND(res,200,'创建成功',[user_id]);
			});
		}
	});
}
this.mainUsers = function(req,res,next){
	// var params = url.parse(req.url,true).query;
	// var user_id = params.user_id;
	var user_id = req.path.split('/mainUser/')[1];
	users.getInfo(user_id,function(result){
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
		res.render('./pages/m_users_main',{
			result: result[0],
			album_arr: album_arr
		});
	});
}
this.update = function(req,res,next){
	var str = req.body.str;
	var user_id = req.body.user_id;
	var abb = req.body.abb;
	var update_person = req.session.admin_id;
	var time = TIME();
	users.checkAbb(abb,function(result){
		if(result.length>1){
			SEND(res,-1,'已存在该简称',[]);
			return;
		}else{
			users.update(user_id,str,update_person,time,function(){
				SEND(res,200,'更新成功',[
					{
						update_person: update_person,
						update_time: time
					}
				]);
			});
		}
	});
}