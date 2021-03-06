var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var basicAuth = require("basic-auth");
var async = require('async');
var mod_admin = require('../model/mod_contacts.js');


this.info = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var abb = params.abb;
	if(abb){
		mod_admin.info(abb,function(rows){
			res.send(JSON.stringify(rows));
		});
	}else{
		var o = {};
		mod_admin.cpy(function(rows){
			var first_abb = rows[0].abb;
			o.list = rows;
			mod_admin.info(first_abb,function(rows){
				o.info = rows;
				res.send(JSON.stringify(o));
			});
		});
	}
}

this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var keyword = params.keyword?params.keyword:'all';
	mod_admin.search(keyword,function(rows){
		var o  = {};
		try{
			o.list = rows;
			mod_admin.info(rows[0].abb,function(rows){
				o.info = rows;
				res.send(JSON.stringify(o));
			});
		}catch(err){
			o.err = 'err';
			res.send(JSON.stringify(o));
		}
	});
}
this.mySort = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var key = params.key;
	mod_admin.mySort(key,function(rows){
		if(key=='verified'){
			var arr = [],arr1 = [],arr2 = [];
			async.waterfall([
				function(cb){
					rows.forEach(function(items,index){
						if(items.verified=='1'){
							arr1.push(items);
						}else{
							arr2.push(items);
						}
					});
					cb(null,arr1,arr2);
				}
			],function(err,result1,result2){
				var _arr = arr.concat(result1,result2);
				res.send(JSON.stringify(_arr));
			});
		}else if(key=='update_time'){
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
			res.send(JSON.stringify(arr_end));
		}else{
			res.send(JSON.stringify(rows));
		}
	});
}
this.createCpy = function(req,res,next){
	var name = req.body.name;
	var abb = req.body.abb;
	// var update_person = basicAuth(req).name;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		mod_admin.checkName(name,abb,function(rows){
			var m = 0;
			rows.forEach(function(items){
				if(items.abb==abb){
					m = 1;
					SEND(res,-1,'??????????????????',[]);
				}
			});
			if(m == 1) return;
			mod_admin.createCpy(name,abb,update_person,time,function(rows){
				res.send(rows);
			});
		});
	});
}
this.delCpy = function(req,res,next){
	var abb = req.body.abb;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		mod_admin.delCpy(abb,update_person,time,function(rows){
			res.send(rows);
		});
	});
}
this.updateInfo = function(req,res,next){
	var abb = req.body.abb;
	var str = req.body.str;
	var new_abb = req.body.new_abb;
	// var update_person = basicAuth(req).name;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		mod_admin.updateInfo(abb,str,new_abb,update_person,function(rows){
			res.send(JSON.stringify(rows));
		});
	});
}
this.getImg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var abb = params.abb;
	mod_admin.getImg(abb,function(rows){
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
    form.uploadDir = DIRNAME+'/public/img'; //??????????????????
    form.keepExtensions = true; //????????????
    form.type = true;
    form.parse(req, function(err, fields, files) {
    	if (err) {
            LOG(err);
            return;
        }
        var extName = ''; //?????????
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
        var abb = fields.abb;
        var _path = files.img.path;
        var stamp = Date.parse(new Date());
        var img_name = stamp+ '.' + extName;
        // var _img_name = files.img.name;
        // if(_img_name.indexOf('.')==-1){
        // 	img_name = files.img.name + '.' + extName;
        // }else{
        // 	img_name = files.img.name;
        // }
        var cont = DIRNAME + '/public/img/contacts/';
        if(!fs.existsSync(cont)){
        	fs.mkdirSync(cont);
        }
        var userDirPath = DIRNAME + '/public/img/contacts/' + abb;
	    if (!fs.existsSync(userDirPath)) {
	        fs.mkdirSync(userDirPath);
	    }
        var imgPath = userDirPath +'/'+ img_name;
	    mod_admin.getImg(abb,function(rows){
	    	var str = rows[0].album;
			if(str!=''){
				console.log(str);
				var arr = str.split(',');
				if(arr.indexOf('contacts/'+abb+'/'+img_name)==-1){
					// var newPath = userDirPath+'/'+img_name;
			        fs.renameSync(files.img.path, imgPath); 
			        var path = imgPath.split('/img/')[1];
			        mod_admin.putImg(abb,path,function(rows){
			        	res.send(JSON.stringify(rows));
			        });
				}else{
					fs.unlink(files.img.path);
					res.send(JSON.stringify({'msg':'???????????????'}));
				}
			}else{
		        fs.renameSync(files.img.path, imgPath); 
		        var path = imgPath.split('/img/')[1];
		        mod_admin.putImg(abb,path,function(rows){
		        	res.send(JSON.stringify(rows));
		        });
			}
	    });
    });
}
this.delImg = function(req,res,next){
	var pic = JSON.parse(req.body.pic);
	var abb = req.body.abb;
	mod_admin.getImg(abb,function(rows){
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
		mod_admin.delImg(st,abb,fsArr,function(rows){
			var s = rows[0].album;
			var new_arr = s.split(',');
			res.send(JSON.stringify(new_arr));
		});
	});
}
this.cover = function(req,res,next){
	var pic = req.body.pic;
	var abb = req.body.abb;
	console.log(pic);
	mod_admin.getImg(abb,function(rows){
		var str = rows[0].album;
		var arr = str.split(',');
		arr.forEach(function(items,index){
			if(items==pic){
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
		mod_admin.coverImg(st,abb,function(rows){
			var s = rows[0].album;
			var new_arr = s.split(',');
			res.send(JSON.stringify(new_arr));
		});
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