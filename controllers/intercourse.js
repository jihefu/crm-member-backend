var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var formidable = require('formidable');
var child_process = require('child_process');
var base = require('./base');
var common = require('../controllers/common');
var modIntercourse = require('../model/mod_intercourse');
var message = require('../controllers/message');
var knowledge = require('./admin_knowledge');
var DIRECTOR = [101,1003,1103,1702];

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var num = 30;
	var p_list,p_tag,user_id;
	common.getEmployeeId(req,res,next,function(result){
		user_id = result[0].user_id;
		p_list = new Promise(function(resolve,reject){
			modIntercourse.getList(user_id,page,num,function(list){
				resolve(list);
			});
		});
		p_tag = new Promise(function(resolve,reject){
			modIntercourse.getTags(function(result){
				resolve(result);
			});
		});
		Promise.all([p_list,p_tag]).then(function(result){
			res.render('./pages/intercourse',{
				user_id: user_id,
				result: result[0],
				tags: result[1]
			});
		});
	});
}
this.info = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var id = params.id;
	modIntercourse.info(id,function(head){
		modIntercourse.action(head[0].id,function(body){
			if(USERAGENT(req)=='pc'){
				common.getEmployeeId(req,res,next,function(user_id){
					common.getEmployeeName(user_id[0].user_id,function(name){
						try{
							SEND(res,200,'',{
								name: name[0].user_name,
								head: head,
								body: body
							});
						}catch(e){
							SEND(res,200,'',{
								name: '',
								head: head,
								body: body
							});
						}
					});
				});
			}else{
				common.getEmployeeName(req.session.admin_id,function(name){
					try{
						SEND(res,200,'',{
							name: name[0].user_name,
							head: head,
							body: body
						});
					}catch(e){
						SEND(res,200,'',{
							name: '',
							head: head,
							body: body
						});
					}
				});
			}
		});
	});
}
this.tag = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var stage = params.stage;
	modIntercourse.getAllTag(stage,function(result){
		SEND(res,200,'',result);
	});
}
this.sub = function(req,res,next){
	var id = req.body.id;
	var head_arr = JSON.parse(req.body.head_arr);
	var body_arr = JSON.parse(req.body.body_arr);
	var foot_arr = JSON.parse(req.body.foot_arr);
	var p_cus_manager,p_director,p_update_person;
	var str_head = '',update_person,exec_arr = [],end_arr = [];
	var end_p_1,end_p_2;
	var _salesman,_customer,_start_time;
	modIntercourse.info(id,function(_rows){
		_salesman = _rows[0].cus_manager;
		_customer = _rows[0].cus_abb;
		_start_time = _rows[0].start_time;
		//add
		var p_add = new Promise(function(resolve,reject){
			var all_arr = [];
			body_arr.forEach(function(items,index){
				var id = items[0].id;
				var sub_tags_str;
				items.forEach(function(it,ind){
					if(it.key=='tag'){
						sub_tags_str = it.val;
					}
				});
				all_arr.push({
					id: id,
					sub_tags_str: sub_tags_str
				});
			});
			var p_arr = [];
			all_arr.forEach(function(items,index){
				p_arr[index] = new Promise(function(resolve,reject){
					modIntercourse.actionTag(items.id,function(result){
						if(items.sub_tags_str==result[0].tag){
							resolve();
						}else{
							if(items.sub_tags_str!=''||items.sub_tags_str!=undefined){
								addScore(result,items,function(){
									resolve();
								});
							}else{
								resolve();
							}
						}
					});
				});	
			});
			Promise.all(p_arr).then(function(){
				resolve();
			}).catch(function(){
				console.log(123);
			});
		});
		function addScore(rows,params,cb){
			let get_arr = rows[0].tag.split(',');
			let sub_arr = params.sub_tags_str.split(',');
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
					addTagScore(items,resolve);
				}); 
			});
			Promise.all(p_arr).then(function(result){
				cb();
			}).catch(function(){
				console.log(222);
			});
		}
		function addTagScore(tag,resolve){
			modIntercourse.getSingleTag(tag,function(result){
				if(result[0]==null){
					//insert
					modIntercourse.addTag(tag,function(){
						resolve();
					});
				}else{
					var acc_freq = result[0].acc_freq+1;
					modIntercourse.addScore(tag,acc_freq,function(){
						resolve();
					})
				}
			});
		}
		//update
		p_add.then(function(){
			body_arr.forEach(function(items,index){
				exec_arr[index] = 'p_'+index;
				var str_body = '',json_body;
				items.forEach(function(it,ind){
					if(it.key!='action_content'){
						str_body += it.key+'="'+it.val+'",';
					}else{
						json_body = it.val;
					}
				});
				str_body = str_body.slice(0,str_body.length-1);
				exec_arr[index] = new Promise(function(resolve,reject){
					exec(items[0].id,str_body,json_body,function(result){
						if(result.code==-1){
							reject();
						}else{
							resolve();
						}
					});
				});
			});
			head_arr.forEach(function(items,index){
				if(items.key=='cus_manager'){
					p_cus_manager = new Promise(function(resolve,reject){
						common.getEmployeeId(req,res,next,function(name){
							resolve(name);
						},items.val);
					});
				}
			});
			foot_arr.forEach(function(items,index){
				if(items.key=='director'){
					p_director = new Promise(function(resolve,reject){
						if(items.val){
							common.getEmployeeId(req,res,next,function(name){
								resolve(name);
							},items.val);
						}else{
							resolve([{
								user_id: null
							}]);
						}
					});
				}
			});
			p_update_person = new Promise(function(resolve,reject){
				if(USERAGENT(req)=='pc'){
					common.getEmployeeId(req,res,next,function(name){
						update_person = name[0].user_id;
						resolve(update_person);
					});
				}else{
					var name = req.session.admin_id;
					update_person = name;
					resolve(name);
				}
			});
			Promise.all([p_cus_manager,p_director,p_update_person]).then(function(result){
				head_arr.forEach(function(items,index){
					if(items.key=='cus_manager'){
						str_head += items.key +'="'+ result[0][0].user_id + '",';
					}else{
						str_head += items.key +'="'+ items.val + '",';
					}
				});
				foot_arr.forEach(function(items,index){
					if(items.key=='director'){
						str_head += items.key +'='+ result[1][0].user_id + ',';
					}else{
						str_head += items.key +'="'+ items.val + '",';
					}
				});
				// update_person = result[2];
				str_head += 'update_person="'+update_person+'",update_time="'+TIME()+'"';
				updateCusCon(str_head);
			}).catch(function(){
				console.log(1233121);
			});

			end_arr[0] = new Promise(function(resolve,reject){
				Promise.all(exec_arr).then(function(){
					resolve();
				}).catch(function(){
					reject();
				});;
			});
			Promise.all(end_arr).then(function(){
				SEND(res,200,'更新成功',[]);
				knowledge.addFromCus(update_person,body_arr);
				//执行bat文件
				child_process.exec(DIRNAME+'/bin/restart.bat');
				// child_process.exec(DIRNAME+'/bin/start.bat');
			}).catch(function(){
				SEND(res,-1,'更新失败',[]);
			});
			function updateCusCon(str_head){
				end_arr[1] = new Promise(function(resolve,reject){
					modIntercourse.updateCusCon(id,str_head,function(result){
						if(result.code==1){
							resolve();
						}else{
							reject();
						}
					});
				});
			}
			function exec(id,str,_json,cb){
				modIntercourse.updateAct(id,str,_json,function(result){
					cb(result);
				});
			}
		});
	});
}
this.getImg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var no = params.no;
	modIntercourse.getImg(no,function(rows){
		var str = rows[0].action_img;
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
	var uploadImg = new base.UploadImg('/public/img/intercourse',1);
	uploadImg.upload(req,function(no){
		common.getEmployeeId(req,res,next,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			modIntercourse.getImg(no,function(rows){
				if(rows[0].action_img==null||rows[0].action_img==''){
					var str = 'action_img="/intercourse/'+uploadImg.name+'"';
				}else{
					var str = rows[0].action_img + ',/intercourse/' + uploadImg.name;
					str = 'action_img="'+str+'"';
				}
				modIntercourse.updateActImg(no,str,update_person,time,function(result){
					modIntercourse.getImg(no,function(rows){
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
	modIntercourse.getImg(no,function(rows){
		var str = rows[0].action_img;
		var arr = str.split(',');
		arr.forEach(function(items,index){
			if(items=='/intercourse/'+pic){
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
		common.getEmployeeId(req,res,next,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			_str = 'action_img="'+_str+'"';
			modIntercourse.updateActImg(no,_str,update_person,time,function(){
				SEND(res,200,'替换成功',rows);
			});
		});
	});
}
this.delImg = function(req,res,next){
	var pic = JSON.parse(req.body.pic);
	var no = req.body.no;
	modIntercourse.getImg(no,function(rows){
		var str = rows[0].action_img;
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
		st = 'action_img="'+st+'"';
		common.getEmployeeId(req,res,next,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			modIntercourse.updateActImg(no,st,update_person,time,function(){
				SEND(res,200,'删除成功',rows);
			});
			fsArr.forEach(function(items){
		        fs.unlink(DIRNAME+'/public/img/'+items);
		    });
		});
	});
}
this.pageDef = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var num = 30;
	common.getEmployeeId(req,res,next,function(result){
		var user_id = result[0].user_id;
		modIntercourse.getList(user_id,page,num,function(list){
			if(list[0]==null){
				SEND(res,-1,'',[]);
			}else{
				SEND(res,200,'',list);
			}
		});
	});
}
this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var keywords = params.keywords;
	var page = parseInt(params.page)?parseInt(params.page):1;
	var num = 30;
	common.getEmployeeId(req,res,next,function(result){
		var user_id = parseInt(result[0].user_id);
		if(keywords==''){
			modIntercourse.getList(user_id,page,num,function(list){
				SEND(res,200,'',list);
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
					// sphinx.SetFilter('cus_manager',user_id);
					sphinx.Query(keywords,'index_intercourse',function(err, result) {
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
					    			modIntercourse.info(items.id,function(head){
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
				}
			},keywords);
		}
	});
}
this.sort = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var key = params.keywords;
	var page = params.page?params.page:1;
	var num = 30;
	common.getEmployeeId(req,res,next,function(result){
		var user_id = result[0].user_id;
		modIntercourse.sort(page,num,key,user_id,function(result){
			if(result[0]==null){
				SEND(res,200,'没有更多了',[]);
			}else{
				SEND(res,200,'',result);
			}
		});
	});
}
this.del = function(req,res,next){
	var id = req.body.id;
	if(USERAGENT(req)=='pc'){
		var p = new Promise(function(resolve,reject){
			common.getEmployeeId(req,res,next,function(result){
				resolve(result[0].user_id);
			});
		});
	}else{
		var p = new Promise(function(resolve,reject){
			resolve(req.session.admin_id);
		});
	}
	p.then(function(result){
		var update_person = result;
		var time = TIME();
		var str = 'isdel = 1,update_person="'+update_person+'",update_time="'+time+'"';
		modIntercourse.updateCusCon(id,str,function(result){
			SEND(res,200,'',[]);
		});
	});
}
this.add = function(req,res,next){
	var template = req.body.temp?req.body.temp:req.body.template;
	var action_content = this.temp(template);
	if(USERAGENT(req)=='pc'){
		common.getEmployeeId(req,res,next,function(result){
			modIntercourse.add(template,action_content,result[0].user_id,TIME(),function(){
				SEND(res,200,'添加成功',[]);
			});
		});
	}else{
		modIntercourse.add(template,action_content,req.session.admin_id,TIME(),function(id){
			SEND(res,200,'添加成功',id);
		});
	}
}
this.temp = function(template){
	var action_content = {};
	action_content.class = template;
	if(template=='json/txt'){
		action_content.content = '';
	}else if(template=='json/knowledge'){
		action_content.question = '';
		action_content.analysis = '';
		action_content.solution = '';
	}else if(template=='json/sign'){
		action_content.contract_no = '';
		action_content.other_promise = '';
	}
	action_content = JSON.stringify(action_content).replace(/\"/g,'\\"');
	return action_content;
}
this.searchTemp = function(req,res,next){
	modIntercourse.searchTemp(function(result){
		var type_arr = [];
		result.forEach(function(items,index){
			type_arr.push(items.action_type);
		});
		var end_arr = common.arrayUnique(type_arr);
		end_arr.forEach(function(items,index){
			if(items=='json/txt'){
				end_arr[index] = {
					key: items,
					name: '纯文本'
				};
			}else{
				end_arr[index] = {
					key: items,
					name: '测试文本'
				};
			}
		});
		SEND(res,200,'',end_arr);
	});
}
this.addTemp = function(req,res,next){
	var id = req.body.id;
	var temp = req.body.temp?req.body.temp:req.body.template;
	var action_content = this.temp(temp);
	if(USERAGENT(req)=='pc'){
		common.getEmployeeId(req,res,next,function(result){
			modIntercourse.addTemp(id,temp,action_content,result[0].user_id,TIME(),function(result){
				if(result.code==-1){
					SEND(res,-1,'新增失败',[]);
				}else{
					SEND(res,200,'新增成功',[]);
				}
			});
		});
	}else{
		modIntercourse.addTemp(id,temp,action_content,req.session.admin_id,TIME(),function(result){
			if(result.code==-1){
				SEND(res,-1,'新增失败',[]);
			}else{
				modIntercourse.getLastTempId(id,function(_id){
					SEND(res,200,'新增成功',_id);
				});
			}
		});
	}
}
this.star = function(req,res,next){
	var id = req.body.id;
	var star = req.body.star;
	modIntercourse.info(id,function(info){
		if(USERAGENT(req)=='pc'){
			var p = new Promise(function(resolve,reject){
				common.getEmployeeId(req,res,next,function(result){
					resolve(result[0].user_id);
				});
			});
		}else{
			var p = new Promise(function(resolve,reject){
				resolve(req.session.admin_id);
			});
		}
		p.then(function(result){
			var update_person = result;
			modIntercourse.star(id,star,update_person,TIME(),function(result){
				common.getEmployeeName(update_person,function(name){
					let middleware = new base.Middleware();
					middleware.use(function(){
						let that = this;
						message.middleMsg({
							name: info[0].cus_manager,
							sender: update_person,
							title: '客户往来管理',
							message: name[0].user_name+'评价了您和'+info[0].cus_abb+'在'+info[0].start_time+'的交流信息。'
						},function(result){
							if(result.code==200){
								that.next();
							}else{
								SEND(res,200,'消息发送失败,'+result.msg,[]);
							}
						});
					});
					middleware.use(function(){
						SEND(res,200,'评分成功',result);
					});
					middleware.handleRequest();
				});
			});
		});
	});
}
this.getSalerName = function(req,res,next){
	modIntercourse.getSalerName(function(result){
		SEND(res,200,'',result);
	});
}
this.filter = function(req,res,next){
	var par = url.parse(req.url,true).query;
	var params = JSON.parse(par.keywords);
	var page = par.page?par.page:1;
	var num = 30;
	var len = page*num;
	if(params.stage){
		stage(function(end_arr){
			notStage(function(sql_str){
				if(sql_str==''){
					end_arr = end_arr.slice((page-1)*num,len);
					if(end_arr[0]!=null){
						SEND(res,200,'',end_arr);
					}else{
						SEND(res,-1,'',[]);
					}
				}else{
					modIntercourse.filterAll(sql_str,function(result){
						if(end_arr[0]==null){
							SEND(res,-1,'',[]);
						}else if(result[0]==null){
							SEND(res,-1,'',[]);
						}else{
							var mix_arr = [];
							for (let i = 0; i < end_arr.length; i++) {
								for (let j = 0; j < result.length; j++) {
									if(end_arr[i].id==result[j].id){
										mix_arr.push(result[j]);
										if(i==end_arr.length-1&&j==result.length-1){
											SEND(res,200,'',mix_arr);
										}
									}else{
										if(i==end_arr.length-1&&j==result.length-1){
											SEND(res,200,'',mix_arr);
										}
									}
								};
							};
						}
					});
				}
			});
		});
	}else{
		notStage(function(sql_str){
			modIntercourse.filter(sql_str,page,num,function(result){
				SEND(res,200,'',result);
			});
		});
	}
	function notStage(cb){
		var sql_str = '';
		var p = new Promise(function(resolve,reject){
			if(params.cus_manager){
				common.getEmployeeId(req,res,next,function(result){
					params.cus_manager = result[0].user_id;
					resolve();
				},params.cus_manager);
			}else{
				resolve();
			}
		});
		p.then(function(){
			for(let key in params){
				if(key=='start_time'){
					sql_str += 'DATE_SUB(NOW(), INTERVAL '+params[key]+' MONTH) <= start_time AND ';
				}else if(key=='director_evaluate'){
					sql_str += '(director_evaluate = '+params[key]*2+' OR director_evaluate = '+(params[key]*2-1)+') AND ';
				}else if(key=='cus_evaluate'){
					sql_str += '(cus_evaluate = '+params[key]*2+' OR cus_evaluate = '+(params[key]*2-1)+') AND ';
				}else if(key=='cus_manager'){
					sql_str += 'cus_manager = '+params[key]+' AND ';
				}else if(key=='complete'){
					sql_str += 'complete = '+params[key]+' AND ';
				}
			}
			cb(sql_str);
		});
	}
	function stage(cb){
		modIntercourse.filtStage(params.stage,function(result){
			var res_arr = [];
			result.forEach(function(items,index){
				res_arr.push(items.contact_id);
			});
			res_arr = common.arrayUnique(res_arr);
			var end_arr = [];
			res_arr.forEach(function(items,index){
				exec(items,function(){
					cb(end_arr);
				});
			});
			function exec(id,cb){
				modIntercourse.info(id,function(result){
					if(end_arr.length<res_arr.length-1){
						end_arr.push(result[0]);
					}else if(end_arr.length==res_arr.length-1){
						end_arr.push(result[0]);
						cb();
					}
				});
			}
		});
	}
}
this.delTag = function(req,res,next){
	var tag = req.body.text;
	modIntercourse.delTag(tag,function(){
		SEND(res,200,'删除成功',[]);
	});
}
this.delActionId = function(req,res,next){
	var id = req.body.id;
	var id_arr = JSON.parse(req.body.id_arr);
	var _p = [];
	var update_time = TIME();
	var update_person;
	if(USERAGENT(req)=='pc'){
		update_person = common.getEmployeeId(req,res,next,function(result){
			update_person = result[0].user_id;
		});
	}else{
		update_person = req.session.admin_id;
	}
	id_arr.forEach(function(items,index){
		_p[index] = new Promise(function(resolve,reject){
			modIntercourse.delActionId(items,id,update_person,update_time,function(){
				resolve();
			});
		});
	});	
	Promise.all(_p).then(function(){
		SEND(res,200,'删除成功',[]);
	});
}