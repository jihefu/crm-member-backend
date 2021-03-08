var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var mod_admin = require('../model/mod_admin.js');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var image_npm = require('images');

this.info = function(req,res,next){
	// res.header("Access-Control-Allow-Origin", "*");
	var params = url.parse(req.url,true).query;
	if(params.company){
		mod_admin.info(params.company,function(rows){
			res.send(JSON.stringify(rows));
		});
	}else{
		var o = {};
		mod_admin.cpy(function(rows){
			var first = rows[0].company;
			o.list = rows;
			mod_admin.info(first,function(rows){
				o.info = rows;
				res.send(JSON.stringify(o));
			});
		});
	}
}
this.filter = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var province = params.province;
	var town = params.town;
	var o = {};
	if(province&&town){
		mod_admin.filter1(province,town,function(rows){
			o.list = rows;
			try{
				mod_admin.info(rows[0].company,function(rows){
					o.info = rows;
					res.send(JSON.stringify(o));
				});
			}catch(err){
				o.err = 'err';
				res.send(JSON.stringify(o));
			}
		});
	}else if(province){
		mod_admin.filter2(province,function(rows){
			o.list = rows;
			try{
				mod_admin.info(rows[0].company,function(rows){
					o.info = rows;
					res.send(JSON.stringify(o));
				});
			}catch(err){
				o.err = 'err';
				res.send(JSON.stringify(o));
			}
		});
	}else{
		mod_admin.filter3(town,function(rows){
			o.list = rows;
			try{
				mod_admin.info(rows[0].company,function(rows){
					o.info = rows;
					res.send(JSON.stringify(o));
				});
			}catch(err){
				o.err = 'err';
				res.send(JSON.stringify(o));
			}
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
			mod_admin.info(rows[0].company,function(rows){
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
		if(key=='total_sale'||key=='last_sale'){
			var _arr = [];
			for (var i = 0; i < rows.length; i++) {
				_arr.unshift(rows[i]);
			};
			// res.send(JSON.stringify(_arr));
			var len = _arr.length;
			for (var i = 0; i < len; i++) {
				if(_arr[i][key]==0){
					var index = i;
					break;
				}
			};
			if(index==0){
				mod_admin.mySort('level',function(rows){
					res.send(JSON.stringify(rows));
				});
			}else{
				var arr = [];
				var arr1 = _arr.slice(0,index);
				mod_admin.mySort('level',function(rows){
					var arr2 = [];
					for (var i = 0; i < rows.length; i++) {
						for (var j = 0; j < arr1.length; j++) {
							if(rows[i].company==arr1[j].company){
								break;
							}
							if((j==arr1.length-1)&&(arr1[j].company!=rows[i].company)){
								arr2.push(rows[i]);
							}
						};
					};
					var res_arr = arr.concat(arr1,arr2);
					res.send(JSON.stringify(res_arr));
				});
			}
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
this.checkAbb = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var user_id = params.user_id;
	var abb = params.abb;
	var cn_abb = params.cn_abb;
	mod_admin.checkAbb(abb,function(result){
		for (var i = 0; i < result.length; i++) {
			if(result[i].length>1||(result[i].length==1&&result[i][0].user_id!=user_id)){
				SEND(res,-1,'已存在该英文简称',[]);
				break;
			}else if(i==result.length-1){
				mod_admin.checkCnAbb(cn_abb,function(result){
					console.log(result);
					for (var i = 0; i < result.length; i++) {
						if(result[i].length>1||(result[i].length==1&&result[i][0].user_id!=user_id)){
							SEND(res,-1,'已存在该中文简称',[]);
							break;
						}else if(i==result.length-1){
							SEND(res,200,'可使用该简称',[]);
						}
					}
				});
			}
		};
	});
}
this.transPerson = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var val = params.val;
	if(val==''){
		res.send('');
	}else{
		mod_admin.transPerson(val,function(result){
			res.send(result);
		});
	}
}
this.updateInfo = function(req,res,next){
	var cpy = req.body.cpy;
	var str = req.body.str;
	var user_id = req.body.user_id;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		mod_admin.updateInfo(cpy,str,user_id,update_person,function(rows){
			res.send(JSON.stringify(rows));
		});
	});
}
this.delCpy = function(req,res,next){
	var cpy = req.body.cpy;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		mod_admin.delCpy(cpy,update_person,time,function(rows){
			res.send(rows);
		});
	});
}
this.createCpy = function(req,res,next){
	var cpy = req.body.cpy;
	var abb = req.body.abb;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		mod_admin.checkName(cpy,abb,function(rows){
			for (var i = 0; i < rows.length; i++) {
				if(rows[i].length>0){
					SEND(res,-1,'已存在该公司或简称',[]);
					break;
				}else if(i==rows.length-1){
					mod_admin.createCpy(cpy,abb,update_person,function(rows){
						var o = {'code':200,'msg':'创建成功','data':rows};
						res.send(JSON.stringify(o));
					});
				}
			};
		});
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
        var cpy = fields.cpy;
        var path = files.img.path;
        var _img_name = files.img.name;
        if(_img_name.indexOf('.')==-1){
        	img_name = files.img.name + '.' + extName;
        }else{
        	img_name = files.img.name;
        }
        var name = path.split('\\');
        var len = name.length-1;
        var cust = DIRNAME + '/public/img/customers/';
        if(!fs.existsSync(cust)){
        	fs.mkdirSync(cust);
        }
        var userDirPath = DIRNAME + '/public/img/customers/' + cpy;
	    if (!fs.existsSync(userDirPath)) {
	        fs.mkdirSync(userDirPath);
	    }
	    mod_admin.getImg(cpy,function(rows){
	    	var str = rows[0].album;
			if(str!=''){
				var arr = str.split(',');
				if(arr.indexOf('/customers/'+cpy+'/'+img_name)==-1){
					var newPath = userDirPath+'/'+img_name;
			        fs.renameSync(files.img.path, newPath); 
			        var path = newPath.split('/img')[1];
			        mod_admin.putImg(cpy,path,function(rows){
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
		        mod_admin.putImg(cpy,path,function(rows){
		        	res.send(JSON.stringify(rows));
		        });
			}
	    });
    });
}
this.getImg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var cpy = params.cpy;
	mod_admin.getImg(cpy,function(rows){
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
this.delImg = function(req,res,next){
	var pic = JSON.parse(req.body.pic);
	var cpy = req.body.cpy;
	mod_admin.getImg(cpy,function(rows){
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
		mod_admin.delImg(st,cpy,fsArr,function(rows){
			var s = rows[0].album;
			var new_arr = s.split(',');
			res.send(JSON.stringify(new_arr));
		});
	});
}
this.cover = function(req,res,next){
	var pic = req.body.pic;
	var cpy = req.body.cpy;
	mod_admin.getImg(cpy,function(rows){
		var str = rows[0].album;
		var arr = str.split(',');
		arr.forEach(function(items,index){
			if(items=='/customers/'+cpy+'/'+pic){
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
		mod_admin.coverImg(st,cpy,function(rows){
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