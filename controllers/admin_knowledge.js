var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var formidable = require('formidable');
var child_process = require('child_process');
var base = require('./base');
var common = require('./common');
var modKnowledge = require('../model/mod_knowledge');
var mod_admin = require('../model/mod_contacts.js');

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var num = 30;
	var p_list = new Promise(function(resolve,reject){
		modKnowledge.getList(page,num,function(result){
			resolve(result);
		});
	});
	var p_tag = new Promise(function(resolve,reject){
		modKnowledge.getTags(function(result){
			resolve(result);
		},1);
	});
	Promise.all([p_list,p_tag]).then(function(result){
		res.render('./pages/knowledge',{
			result: result[0],
			tags: result[1]
		});
	});
}
this.info = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var id = params.id;
	modKnowledge.info(id,function(result){
		if(result[0]!=null){
			result[0].insert_time = TIME(result[0].insert_time);
			result[0].update_time = TIME(result[0].update_time);
		}
		SEND(res,200,'',result);
	});
}
this.pageDef = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var num = 30;
	modKnowledge.getList(page,num,function(list){
		SEND(res,200,'',list);
	});
}
this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var keywords = params.keywords;
	var page = params.page?params.page:1;
	var num = 30;
	if(keywords==''){
		modKnowledge.getList(page,num,function(list){
			SEND(res,200,'',list);
		});
	}else{
		common.getEmployeeId(req,res,next,function(result){
			keywords = result[0].user_id;
			var weights = {
				'tags': 5,
				'resources': 5,
			};
			sphinx.SetLimits((page-1)*num,num);
			sphinx.SetFieldWeights(weights);
			sphinx.SetMatchMode(SphinxClient.SPH_MATCH_ANY);
			sphinx.Query(keywords,'index_knowledge',function(err, result) {
			    if(err){
			    	LOG(err);
			    	return;
			    }
			    var matches = result.matches;
			    if(matches.length==0){
			    	SEND(res,200,'搜索为空',[]);
			    }else{
			    	var len = matches.length;
			    	var _p = [];
			    	var res_arr = new Array(len);
			    	matches.forEach(function(items,index){
			    		_p[index] = new Promise(function(resolve,reject){
			    			modKnowledge.info(items.id,function(head){
			    				if(head[0]!=null){
									head[0].insert_time = TIME(head[0].insert_time);
									head[0].update_time = TIME(head[0].update_time);
								}
			    				res_arr[index] = head[0];
			    				resolve();
			    			});
			    		});
			    	});
			    	Promise.all(_p).then(function(){
			    		SEND(res,200,'',res_arr);
			    	});
			    }
			});
		},keywords);
	}
}
this.sort = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var key = params.keywords;
	var page = params.page?params.page:1;
	var num = 30;
	modKnowledge.sort(page,num,key,function(result){
		SEND(res,200,'',result);
	});
}
this.add = function(req,res,next){
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		modKnowledge.add(update_person,time,function(){
			modKnowledge.getList(1,30,function(list){
				SEND(res,200,'',list);
			});
		});
	});
}
this.del = function(req,res,next){
	var id = req.body.id;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		var str = 'isdel = 1,';
		modKnowledge.update(id,str,update_person,time,function(result){
			SEND(res,200,'',[]);
		});
	});
}
this.getTags = function(req,res,next){
	modKnowledge.getTags(function(result){
		SEND(res,200,'',result);
	});
}
this.getDoc = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var num = 10;
	modKnowledge.getDoc(page,num,function(result){
		SEND(res,200,'',result);
	});
}
this.sub = function(req,res,next){
	let params = req.body;
	let str = '';
	for(let i in params){
		if(i=='documents'){
			let doc_arr = params[i].split(',');
			var doc_str = '';
			doc_arr.forEach(function(items,index){
				if(items==''){
					doc_str += ',';
				}else{
					doc_str += '../knowledge_lib/'+ items + ',';
				}
			});
			doc_str = doc_str.slice(0,doc_str.length-1);
			str += i + '="'+doc_str+'",';
		}else if(i!='id'&&i!='documents'&&i!='resources'){
			str += i + '="' + params[i] + '",';
		}
	}
	let id = params.id;
	//add
	var p = new Promise(function(resolve,reject){
		modKnowledge.info(id,function(rows){
			if(params.tags!=rows[0].tags){
				if(params.tags!=''){
					let get_arr = rows[0].tags.split(',');
					let sub_arr = params.tags.split(',');
					let sub_obj = {};
					sub_arr.forEach(function(items,index){
						sub_obj[items] = 1;
					});
					get_arr.forEach(function(items,index){
						if(sub_obj[items]){
							sub_obj[items] = 2;
						}
					});
					let res_arr = [];
					for(let key in sub_obj){
						if(sub_obj[key]==1){
							res_arr.push(key);
						}
					}
					var p_arr = [];
					res_arr.forEach(function(items,index){
						p_arr[index] = new Promise(function(resolve,reject){
							exec(items,resolve);
						}); 
					});
					Promise.all(p_arr).then(function(result){
						resolve();
					});
				}else{
					resolve();
				}
			}else{
				resolve();
			}
		});
	});
	function exec(tag,resolve){
		modKnowledge.getSingleTag(tag,function(result){
			if(result[0]==null){
				//insert
				modKnowledge.addTag(tag,function(){
					resolve();
				});
			}else{
				var acc_freq = result[0].acc_freq+1;
				modKnowledge.addScore(tag,acc_freq,function(){
					resolve();
				})
			}
		});
	}
	//update
	p.then(function(){
		var bs_name = basicAuth(req).name;
		mod_admin.searchUpdataPerson(bs_name,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			modKnowledge.update(id,str,update_person,time,function(result){
				SEND(res,200,'',[]);
				//执行bat文件
				child_process.exec(DIRNAME+'/bin/restart.bat');
			});
		});
	});
}
this.getImg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var id = params.id;
	modKnowledge.info(id,function(rows){
		var str = rows[0].album;
		if(str==null||str==''){
			var arr = [''];
			res.send(JSON.stringify(arr));
		}else{
			var arr = str.split(',');
			res.send(JSON.stringify(arr));
		}
	});
}
this.uploadImg = function(req,res,next){
	var uploadImg = new base.UploadImg('/public/img/knowledge',1);
	uploadImg.upload(req,function(no){
		var bs_name = basicAuth(req).name;
		mod_admin.searchUpdataPerson(bs_name,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			modKnowledge.info(no,function(rows){
				if(rows[0].album==null||rows[0].album==''){
					var str = 'album="/knowledge/'+uploadImg.name+'",';
				}else{
					var str = rows[0].album + ',/knowledge/' + uploadImg.name;
					str = 'album="'+str+'"'+',';
				}
				modKnowledge.update(no,str,update_person,time,function(){
					modKnowledge.info(no,function(rows){
						SEND(res,200,'上传成功',rows);
					});
				});
			});
		});
		uploadImg.resize();
	});
}
this.delImg = function(req,res,next){
	var pic = JSON.parse(req.body.pic);
	var no = req.body.id;
	modKnowledge.info(no,function(rows){
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
			modKnowledge.update(no,st,update_person,time,function(){
				SEND(res,200,'删除成功',rows);
			});
			fsArr.forEach(function(items){
		        fs.unlink(DIRNAME+'/public/img/'+items);
		    });
		});
	});
}
this.cover = function(req,res,next){
	var pic = req.body.pic;
	var no = req.body.id;
	modKnowledge.info(no,function(rows){
		var str = rows[0].album;
		var arr = str.split(',');
		arr.forEach(function(items,index){
			if(items=='/knowledge/'+pic){
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
			modKnowledge.update(no,_str,update_person,time,function(){
				SEND(res,200,'替换成功',rows);
			});
		});
	});
}
this.uploadFile = function(req,res,next){
	var form = new formidable.IncomingForm();
	form.encoding = 'utf-8'; 
    form.uploadDir = DIRNAME+'/downloads/knowledge_lib';
    form.keepExtensions = true; //保留后缀
    form.type = true;
	form.parse(req, function(err, fields, files) {
    	if(err){
    		LOG(err);
    		return;
    	}
    	var fileId = fields.name;
    	var fileName = files.file.name;
    	var oldPath = files.file.path;
    	var newPath = oldPath.split('\\upload_')[0]+'\\'+fileName;
    	try{
    		fs.renameSync(oldPath, newPath);
	    	modKnowledge.info(fileId,function(result){
	    		var documents = result[0].documents;
	    		if(documents==''||documents==null){
	    			var str = 'documents="../knowledge_lib/'+fileName+'",';
	    		}else{
	    			var arr = result[0].documents.split(',');
	    			for (var i = 0; i < arr.length; i++) {
	    				if(arr[i].indexOf(fileName)!=-1){
	    					var str = '';
	    					break;
	    				}else if(arr[i].indexOf(fileName)==-1&&i==arr.length-1){
	    					var str = 'documents="'+documents+',../knowledge_lib/'+fileName+'",';
	    				}
	    			};
	    		}
				var bs_name = basicAuth(req).name;
	    		mod_admin.searchUpdataPerson(bs_name,function(result){
					var update_person = result[0].user_id;
					var time = TIME();
					var arr = fileName.split('.');
					var type = arr[arr.length-1];
					var name = '';
					arr.forEach(function(items,index){
						if(index<arr.length-1){
							name += items + '.';
						}
					});
					name = name.slice(0,name.length-1);
					// var name = fileName.split('.')[0];
					// var type = fileName.split('.')[1];
					modKnowledge.checkExist(name,type,function(result){
						if(result[0]==null){
							modKnowledge.update(fileId,str,update_person,time,function(){
								SEND(res,200,'上传成功',[]);
							});
							modKnowledge.insert(name,type,update_person,time);
						}else{
							SEND(res,-1,'该文件已存在，是否覆盖？',{
								fileId: fileId,
								str: str,
								name: name,
								type: type,
								update_person: result[0].upload_person,
								time: time
							});
						}
					});
				});
	    	});
    	}catch(e){
    		SEND(res,-2,'上传失败，请重试',[]);
    	}
    });
}
this.continueUpload = function(req,res,next){
	var data = req.body;
	mod_admin.searchUpdataPerson(data.update_person,function(result){
		data.update_person = result[0].user_id;
		modKnowledge.update(data.fileId,data.str,data.update_person,data.time,function(){
			SEND(res,200,'上传成功',[]);
		});
		modKnowledge.updateDocLib(data.name,data.type,data.update_person,data.time);
	});
}
this.docSearch = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var text = params.text;
	modKnowledge.docSearch(text,function(result){
		SEND(res,200,'',result);
	});
}
this.delTag = function(req,res,next){
	var tag = req.body.text;
	modKnowledge.delTag(tag,function(){
		SEND(res,200,'删除成功',[]);
	});
}
this.addFromCus = function(update_person,body_arr){
	body_arr.forEach(function(items,index){
		items.forEach(function(it,ind){
			if(it.key=='action_content'&&it.val.class=='json/knowledge'){
				if(it.val.question=='') return;
				var action_id = it.id;
				modKnowledge.checkFromCus(action_id,function(result){
					var params = {
						question: it.val.question,
						analysis: it.val.analysis,
						solution: it.val.solution,
						update_person: update_person,
						update_time: TIME()
					};
					var key_str = '',val_str = '';
					if(result[0]==null){
						params.action_id = action_id;
						params.insert_person = update_person;
						params.insert_time = TIME();
						for(let i in params){
							key_str += i+',';
							val_str += '"'+params[i]+'",';
						}
						key_str = key_str.slice(0,key_str.length-1);
						val_str = val_str.slice(0,val_str.length-1);
						modKnowledge.addFromCus(key_str,val_str);
					}else{
						modKnowledge.updateFromCus(action_id,params);
					}
				});
			}
		});
	});
}	