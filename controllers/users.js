var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var mod_admin = require('../model/mod_admin.js');
var users = require('../model/users');

this.renderPage = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	users.getList(page,num,function(list){
		users.getInfo(list[0].user_id,function(result){
			var info = [];
			var count = 0;
			for(var i in result[0]){
				var m_obj = {};
				m_obj.key = i;
				m_obj.val = result[0][i];
				info[count] = m_obj;
				count++;
			}
			res.render('./pages/users',{
				list: list,
				result: result,
				info: info,
			});
		});
	});
}
this.getInfo = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var user_id = params.user_id;
	users.getInfo(user_id,function(info){
		var content = [];
		var count = 0;
		for(var i in info[0]){
			var o = {};
			o.key = i;
			o.val = info[0][i];
			content[count] = o;
			count++;
		}
		SEND(res,200,'',content);
	});
}
this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var sn = params.sn;
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	if(sn){
		users.search(sn,function(result){
			SEND(res,200,'',result);
		});
	}else{
		users.getList(1,num,function(list){
			SEND(res,200,'',list);
		});
	}
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
	users.sort(key,page,num,function(result){
		SEND(res,200,'',result);
	});
}
this.getPage = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	users.getList(page,num,function(list){
		SEND(res,200,'',list);
	});
}
this.add = function(req,res,next){
	var cpy = req.body.cpy;
	var abb = req.body.abb;
	if(USERAGENT(req)=='pc'){
		var num = 30;
	}else{
		var num = 10;
	}
	users.checkAbb(abb,function(result){
		for (var i = 0; i < result.length; i++) {
			if(result[i].length>0){
				SEND(res,-1,'已存在该简称',[]);
				break;
			}else if(i==result.length-1){
				var bs_name = basicAuth(req).name;
				mod_admin.searchUpdataPerson(bs_name,function(result){
					var update_person = result[0].user_id;
					var time = TIME();
					users.createUser(abb,cpy,update_person,time,function(){
						users.getList(1,num,function(list){
							SEND(res,200,'创建成功',list);
						});
					});
				});
			}
		};
	});
}
this.del = function(req,res,next){
	var user_id = req.body.user_id;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		users.del(user_id,update_person,time,function(result){
			SEND(res,200,'删除成功',[]);
		});
	});
}
this.update = function(req,res,next){
	var user_id = req.body.user_id;
	var abb = req.body.abb;
	var cn_abb = req.body.cn_abb;
	var str = req.body.str;
	users.checkAbb(abb,function(result){
		for (var i = 0; i < result.length; i++) {
			if(result[i].length>1||(result[i].length==1&&result[i][0].user_id!=user_id)){
				SEND(res,-1,'已存在该英文简称',[]);
				break;
			}else if(i==result.length-1){
				users.checkCnAbb(cn_abb,function(result){
					for (var i = 0; i < result.length; i++) {
						if(result[i].length>1||(result[i].length==1&&result[i][0].user_id!=user_id)){
							SEND(res,-1,'已存在该中文简称',[]);
							break;
						}else if(i==result.length-1){
							var bs_name = basicAuth(req).name;
							mod_admin.searchUpdataPerson(bs_name,function(result){
								var update_person = result[0].user_id;
								var time = TIME();
								users.update(user_id,str,update_person,time,function(result){
									SEND(res,200,'更新成功',[]);
								});
							});
						}
					}
				});
			}
		}
	});
}
this.getImg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var user_id = params.user_id;
	users.getImg(user_id,function(rows){
		var str = rows[0].album;
		if(str==''){
			var arr = [''];
			res.send(JSON.stringify(arr));
		}else{
			var arr = str.split(',');
			res.send(JSON.stringify(arr));
		}
	});
}
this.uploadImg = function(req,res,next){
	var form = new formidable.IncomingForm();
	form.encoding = 'utf-8'; 
    form.uploadDir = DIRNAME+'/public/img'; //设置上传目录
    form.keepExtensions = true; //保留后缀
    form.type = true;
    form.parse(req, function(err, fields, files) {
    	if (err) {
            LOG(err);
            return;
        }
        var extName = ''; //后缀名
        switch (files.img.type) {
            case 'image/pjpeg':
                extName = 'jpg';
                break;
            case 'image/jpeg':
                extName = 'jpg';
                break;
            case 'image/png':
                extName = 'png';
                break;
            case 'image/x-png':
                extName = 'png';
                break;
        }
        var cpy = fields.user_id;
        var path = files.img.path;
        var _img_name = files.img.name;
        if(_img_name.indexOf('.')==-1){
        	img_name = files.img.name + '.' + extName;
        }else{
        	img_name = files.img.name;
        }
        var name = path.split('\\');
        var len = name.length-1;
        var cust = DIRNAME + '/public/img/users/';
        if(!fs.existsSync(cust)){
        	fs.mkdirSync(cust);
        }
        var userDirPath = DIRNAME + '/public/img/users/' + cpy;
	    if (!fs.existsSync(userDirPath)) {
	        fs.mkdirSync(userDirPath);
	    }
	    users.getImg(cpy,function(rows){
	    	var str = rows[0].album;
			if(str!=''){
				var arr = str.split(',');
				if(arr.indexOf('/users/'+cpy+'/'+img_name)==-1){
					var newPath = userDirPath+'/'+img_name;
			        fs.renameSync(files.img.path, newPath); 
			        var path = newPath.split('/img')[1];
			        users.putImg(cpy,path,function(rows){
			        	res.send(JSON.stringify(rows));
			        });
				}else{
					res.send(JSON.stringify({'msg':'图片已存在'}));
					fs.unlink(files.img.path);
				}
			}else{
				var newPath = userDirPath+'/'+img_name;
		        fs.renameSync(files.img.path, newPath); 
		        var path = newPath.split('/img')[1];
		        users.putImg(cpy,path,function(rows){
		        	res.send(JSON.stringify(rows));
		        });
			}
	    });
    });
}
this.cover = function(req,res,next){
	var pic = req.body.pic;
	var cpy = req.body.user_id;
	users.getImg(cpy,function(rows){
		var str = rows[0].album;
		var arr = str.split(',');
		arr.forEach(function(items,index){
			if(items=='/users/'+cpy+'/'+pic){
				var it = arr[0];
				arr[0]=items;
				arr[index] = it;
			}
		});
		var _str = '';
		arr.forEach(function(item){
			_str += item+',';
		});
		var st = _str.slice(0,_str.length-1);
		users.coverImg(st,cpy,function(rows){
			var s = rows[0].album;
			var new_arr = s.split(',');
			res.send(JSON.stringify(new_arr));
		});
	});
}
this.delImg = function(req,res,next){
	var pic = JSON.parse(req.body.pic);
	var cpy = req.body.cpy;
	users.getImg(cpy,function(rows){
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
		users.delImg(st,cpy,fsArr,function(rows){
			var s = rows[0].album;
			var new_arr = s.split(',');
			res.send(JSON.stringify(new_arr));
		});
	});
}