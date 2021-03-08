var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var formidable = require('formidable');
var base = require('./base');
var common = require('../controllers/common');
var modIntercourse = require('../model/mod_intercourse');
var message = require('../controllers/message');

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var num = 10;
	var album_arr = [],p_album = [];
	var user_id = req.session.admin_id;
	modIntercourse.getList(user_id,page,num,function(list){
		list.forEach(function(items,index){
			p_album[index] = new Promise(function(resolve,reject){
				var contact_id = items.id;
				modIntercourse.action(contact_id,function(result){
					try{
						album_arr[index] = (result[0].action_img.split(',')[0]);
					}catch(e){
						album_arr[index] = '';
					}
					resolve();
				});
			});
		});
		Promise.all(p_album).then(function(){
			if(page==1){
				res.render('./pages/m_intercourse',{
					user_id: req.session.admin_id,
					result: list,
					album_arr: album_arr
				});
			}else{
				SEND(res,200,'',{
					result: list,
					album_arr: album_arr
				});
			}
		});
	});
}
this.action = function(req,res,next){
	var id = req.path.split('/inter_action/')[1];
	modIntercourse.info(id,function(head){
		modIntercourse.action(head[0].id,function(body){
			res.render('./pages/m_inter_action',{
				head: head,
				body: body
			});
		});
	});
}
this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var keywords = params.keywords;
	var page = parseInt(params.page)?parseInt(params.page):1;
	var num = 10;
	var album_arr = [],p_album = [];
	if(keywords==''){
		var user_id = req.session.admin_id;
		modIntercourse.getList(user_id,page,num,function(list){
			searchRes(list);
		});
	}else{
		common.getEmployeeId(req,res,next,function(result){
			if(result[0]!=null){
				keywords = result[0].user_id;
				var weights = {
					'cus_abb': 5,
					'cus_manager': 10,
					'stage': 5,
					'tag': 5,
					'action_content': 1
				};
				sphinx.SetLimits((page-1)*num,num);
				sphinx.SetFieldWeights(weights);
				sphinx.SetMatchMode(SphinxClient.SPH_MATCH_ANY);
				sphinx.Query(keywords,'index_intercourse', function(err, result) { 
				    if(err){
				    	LOG(err);
				    	return;
				    }
				    var matches = result.matches;
				    if(matches.length==0){
				    	if(page==1){
				    		SEND(res,200,'搜索为空',{
					    		result: []
					    	});
				    	}else{
				    		SEND(res,200,'没有更多了',{
					    		result: []
					    	});
				    	}
				    }else{
				    	var len = matches.length;
				    	var _p = [];
				    	var res_arr = new Array(len);
				    	matches.forEach(function(items,index){
				    		_p[index] = new Promise(function(resolve,reject){
				    			modIntercourse.info(items.id,function(head){
				    				res_arr[index] = head[0];
				    				resolve();
				    			});
				    		});
				    	});
				    	Promise.all(_p).then(function(){
				    		searchRes(res_arr);
				    	});
				    }
				});
			}
		},keywords);
	}
	function searchRes(list){
		list.forEach(function(items,index){
			p_album[index] = new Promise(function(resolve,reject){
				var contact_id = items.id;
				modIntercourse.action(contact_id,function(result){
					try{
						album_arr[index] = (result[0].action_img.split(',')[0]);
					}catch(e){
						album_arr[index] = '';
					}
					resolve();
				});
			});
		});
		Promise.all(p_album).then(function(){
			SEND(res,200,'',{
				result: list,
				album_arr: album_arr
			});
		});
	}
}
this.uploadImg = function(req,res,next){
	class MulUploadImg extends base.UploadImg {
		constructor(uploadDir,stamp){
			super(uploadDir,stamp);
		}

		upload(req,cb){
			let form = new formidable.IncomingForm();
			let that = this;
			form.encoding = 'utf-8'; 
		    form.uploadDir = DIRNAME+'/public';
		    form.keepExtensions = true; //保留后缀
		    form.type = true;
		    var allFile = [];
			form.on('file', function (fields, files) {
				allFile.push([fields,files]);
			});
		    form.parse(req, function(err, fields, files) {
		    	if(err){
		    		LOG(err);
		    		return;
		    	}
		    	var res_arr = [];
		    	allFile.forEach(function(items,index){
		    		var extName = ''; 
			        switch (items[1].type) {
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
			            default: 
			            	extName = 'jpg';
			                break;
			        }
			        that.size = items[1].size;
			        that.id = fields.id;
			        if(that.stamp){
			        	that.name = Date.parse(new Date())+'.'+extName;
			        }else{
			        	that.name = fields.name+'.'+extName;
			        }
			        let path = that.uploadDir.split('/public/')[1];
			        let path_arr = path.split('/');
			        let path_str = DIRNAME+'/public';
			        path_arr.forEach(function(items,index){
			        	path_str += '/'+items;
			        	if(!fs.existsSync(path_str)) fs.mkdirSync(path_str);
			        });
			        let img_name = that.name?'\\'+that.name:items[1].path.split('\\public')[1];
			        let new_path = path_str + img_name;
			        fs.renameSync(items[1].path, new_path);
			        that.path = new_path;
			        res_arr.push(img_name);
		    	});
		    	cb(res_arr);
		    });
		}
	}
	var mulUploadImg = new MulUploadImg('/public/img/intercourse',1);
	mulUploadImg.upload(req,function(res_arr){
		SEND(res,200,'上传成功',res_arr);
		mulUploadImg.resize();
		var str = '';
		res_arr.forEach(function(items,index){
			str += '/intercourse/'+items+',';
		});
		str = str.slice(0,str.length-1);
		var update_person = req.session.admin_id;
		var update_time = TIME();
		var id = mulUploadImg.id;
		modIntercourse.action(id,function(result){
			if(result[0].action_img!=''){
				str = result[0].action_img+','+str;
			}
			modIntercourse.updateActionImg(id,str,update_person,update_time,function(){});
		});
	});
}