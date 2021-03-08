var express = require('express');
var url = require('url');
var fs = require('fs');
var base = require('./base');
var modRepair = require('../model/repair');
var mod_admin = require('../model/mod_contacts.js');
var basicAuth = require("basic-auth");
var mod_admin = require('../model/mod_contacts.js');

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var num = 30;
	modRepair.getList(page,num,'employee',function(result){
		if(page==1){
			res.render('./pages/repair',{
				result: result
			});
		}else{
			SEND(res,200,'',result);
		}
	});
}
this.info = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var no = params.no;
	modRepair.getComment(function(comment){
		modRepair.info(no,'employee',function(result){
			for(var i in result[0]){
				if(i=='deliver_state'){
					var status = result[0][i];
				}
				for (var j = 0; j < comment.length; j++) {
					if(i == comment[j].column_name) {
						comment[j].val = result[0][i];
					}
				};
			}
			comment.forEach(function(items,index){
				if(items.column_name=='update_person'){
					if(items.val!=''&&items.val!=null){
						exec(items.val,index,function(name){
							comment[index].val = name;
							SEND(res,200,'',{
								result: comment,
								status: status
							});
						});
					}else{
						SEND(res,200,'',{
							result: comment,
							status: status
						});
					}
				}
			});
		});
	});
}
function exec(v,index,cb){
	modRepair.getName(v,function(name){
		cb(name,index);
	});
}

this.pageDef = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var num = 30;
	modRepair.getList(page,num,'employee',function(list){
		SEND(res,200,'',list);
	});
}
this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var keywords = params.keywords;
	var num = 30;
	if(keywords==''){
		modRepair.getList(page,num,'employee',function(result){
			SEND(res,200,'',result);
		});
	}else{
		modRepair.search(page,num,'employee',keywords,function(result){
			if(result[0]==null){
				if(page==1){
					SEND(res,200,'该合同不存在',result);
				}else{
					SEND(res,200,'没有更多了',result);
				}	
			}else{
				SEND(res,200,'',result);
			}
		});
	}
}
this.sort = function(req,res,next){
	var authority = 'employee';
	var params = url.parse(req.url,true).query;
	var key = params.keywords;
	var page = params.page?params.page:1;
	var num = 30;
	modRepair.sort(page,num,authority,key,function(result){
		if(result[0]==null){
			SEND(res,200,'不存在',[]);
		}else{
			SEND(res,200,'',result);
		}
	});
}
this.insertData = function(req,res,next){
	modRepair.insertData(function(result){
		if(result==-1){
			SEND(res,-1,'已是最新数据',[]);
		}else{
			SEND(res,200,'新增'+result+'条数据',[]);
		}
	});
}
this.updateData = function(req,res,next){
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		modRepair.updateAll(update_person,time,function(){
			SEND(res,200,'更新成功',[]);
		});
	});
}
this.updateOneData = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var no = params.no;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		modRepair.update(no,update_person,time,function(result){
			if(result==-1){
				SEND(res,-1,'原数据库不存在该单号',[]);
			}else{
				SEND(res,200,'更新成功',[]);
			}
		});
	});
}
this.del = function(req,res,next){
	var no = req.body.no;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		modRepair.del(no,update_person,time,function(result){
			SEND(res,200,'删除成功',[]);
		});
	});
}
this.sub = function(req,res,next){
	var no = req.body.no;
	var str = req.body.str;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		modRepair.sub(no,str,update_person,time,function(result){
			SEND(res,200,'提交成功',[]);
		});
	});
}
this.nextStatus = function(req,res,next){
	var no = req.body.no;
	var status = req.body.status;
	var deviceAgent = req.headers['user-agent'].toLowerCase();  
    var agentID = deviceAgent.match(/(iphone|ipod|ipad|android)/);
    if(agentID){
        var bs_name = req.session.name;
    }else{
        var bs_name = basicAuth(req).name;
    }
    mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		var str = 'deliver_state="'+status+'",';
		modRepair.sub(no,str,update_person,time,function(result){
			SEND(res,200,'提交成功',[]);
		});
	});
}
this.getImg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var no = params.no;
	modRepair.getImg(no,function(rows){
		var str = rows[0].album;
		if(str==null){
			var arr = [''];
			res.send(JSON.stringify(arr));
		}else{
			var arr = str.split(',');
			res.send(JSON.stringify(arr));
		}
	});
}
this.uploadImg = function(req,res,next){
	var uploadImg = new base.UploadImg('/public/img/repair',1);
	uploadImg.upload(req,function(no){
		var bs_name = basicAuth(req).name;
		mod_admin.searchUpdataPerson(bs_name,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			modRepair.getImg(no,function(rows){
				if(rows[0].album==null||rows[0].album==''){
					var str = 'album="/repair/'+uploadImg.name+'",';
				}else{
					var str = rows[0].album + ',/repair/' + uploadImg.name;
					str = 'album="'+str+'"'+',';
				}
				modRepair.sub(no,str,update_person,time,function(){
					modRepair.getImg(no,function(rows){
						SEND(res,200,'上传成功',rows);
					});
				});
			});
		});
		uploadImg.resize();
	});
}
this.cover = function(req,res,next){
	var pic = req.body.pic;
	var no = req.body.no;
	modRepair.getImg(no,function(rows){
		var str = rows[0].album;
		var arr = str.split(',');
		arr.forEach(function(items,index){
			if(items=='/repair/'+pic){
				var it = arr[0];
				arr[0]=items;
				arr[index] = it;
			}
		});
		var _str = '';
		arr.forEach(function(item){
			_str += item+',';
		});
		_str = _str.slice(0,_str.length-1);
		var bs_name = basicAuth(req).name;
		mod_admin.searchUpdataPerson(bs_name,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			_str = 'album="'+_str+'",';
			modRepair.sub(no,_str,update_person,time,function(){
				SEND(res,200,'替换成功',rows);
			});
		});
	});
}
this.delImg = function(req,res,next){
	var pic = JSON.parse(req.body.pic);
	var no = req.body.no;
	modRepair.getImg(no,function(rows){
		var str = rows[0].album;
		var arr = str.split(',');
		var len = arr.length;
		var delArr = [];
		var fsArr = [];
		for(var i=0;i<len;i++){
			if(pic.indexOf(arr[i])==-1){
				delArr.push(arr[i]);
			}else{
				fsArr.push(arr[i]);
			}
		}
		var _str = '';
		delArr.forEach(function(item){
			_str += item+',';
		});
		var st = _str.slice(0,_str.length-1);
		st = 'album="'+st+'",';
		var bs_name = basicAuth(req).name;
		mod_admin.searchUpdataPerson(bs_name,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			modRepair.sub(no,st,update_person,time,function(){
				SEND(res,200,'删除成功',rows);
			});
			fsArr.forEach(function(items){
		        fs.unlink(DIRNAME+'/public/img/'+items);
		    });
		});
	});
}
this.add = function(req,res,next){
	var no = req.body.no;
	modRepair.info(no,'employee',function(result){
		if(result[0]==null){
			modRepair.add(no,function(result){
				SEND(res,200,'添加成功',[]);
			});
		}else{
			SEND(res,-1,'该单号已存在，不可重复',[]);
		}
	});
}
this.searchInput = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var val = params.val;
	modRepair.searchInput(val,function(result){
		var arr = [];
		for (var i = 0; i < result.length; i++) {
			for (var j = 0; j < result[i].length; j++) {
				if(arr.length<5){
					arr.push(result[i][j].cn_abb);
				}
			};
		};
		SEND(res,200,'',arr);
	});
}
this.searchHistory = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var val = params.val;
	modRepair.searchHistory(val,function(result){
		SEND(res,200,'',result);
	});
}