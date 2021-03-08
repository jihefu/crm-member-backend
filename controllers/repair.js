var express = require('express');
var url = require('url');
var base = require('./base');
var modRepair = require('../model/repair');
var mod_admin = require('../model/mod_contacts.js');

this.list = function(req,res,next){
	var authority = req.session.cnAuthority;
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var num = 10;
	modRepair.getList(page,num,authority,function(result){
		if(page==1){
			if(result[0]!=null){
				var arr = [];
				result.forEach(function(items,index){
					arr.push(items.album.split(',')[0]);
				});
				res.render('./pages/repair_list',{
					result: result,
					arr: arr
				});
			}else{
				res.render('./pages/tip',{
					tip: '<p>很抱歉，未查到相关维修信息。</p><p>如有疑问，请联系朗杰客服。</p>'
				});
			}
		}else{
			SEND(res,200,'',result);
		}
	});
}
this.search = function(req,res,next){
	var authority = req.session.cnAuthority;
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var keywords = params.keywords;
	var num = 10;
	if(keywords==''){
		modRepair.getList(page,num,authority,function(result){
			SEND(res,200,'',result);
		});
	}else{
		modRepair.search(page,num,authority,keywords,function(result){
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
	var num = 10;
	modRepair.sort(page,num,authority,key,function(result){
		if(result[0]==null){
			SEND(res,200,'没有更多了',[]);
		}else{
			SEND(res,200,'',result);
		}
	});
}
this.info = function(req,res,next){
	var authority = req.session.cnAuthority;
	var path = req.path;
	var no = path.split('/info/')[1];
	no = decodeURIComponent(no);
	modRepair.getComment(function(comment){
		modRepair.info(no,authority,function(result){
			if(result[0]==null){
				res.render('./pages/tip',{
					tip: '不存在该合同'
				});
			}else{
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
				if(authority=='employee'){
					comment.forEach(function(items,index){
						if(items.column_name=='update_person'){
							if(items.val!=''&&items.val!=null){
								exec(items.val,index,function(name){
									comment[index].val = name;
									res.render('./pages/repair_info',{
										result: comment,
										status: status
									});
								});
							}else{
								res.render('./pages/repair_info',{
									result: comment,
									status: status
								});
							}
						}
					});
				}else{
					res.render('./pages/repair_info_m',{
						result: comment,
						status: status
					});
				}
			}
		});
	});
}
function exec(v,index,cb){
	modRepair.getName(v,function(name){
		cb(name,index);
	});
}
this.sub = function(req,res,next){
	var no = req.body.repair_contractno;
	var str = '';
	for(var key in req.body){
		if(key=='receive_time'||key=='deliver_time'){
			if(req.body[key]!=''||req.body[key]!=0){
				req.body[key] = parseInt(new String(Date.parse(req.body[key])).slice(0,10));
			}else{
				req.body[key] = 0;
			}
		}
		if(key!='complete'&&key!='update_time'&&key!='update_person'&&key!='take_person'&&key!='take_time'){
			str += key+'="'+req.body[key]+'",'
		}
	}
	var name = req.session.name;
	mod_admin.searchUpdataPerson(name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		modRepair.sub(no,str,update_person,time,function(result){
			res.redirect(ROUTE('repair/info/'+no));
		});
	});
}
this.takeGoods = function(req,res,next){
	var no = req.body.no;
	var time = DATETIME();
	var oper = req.session.name;
	modRepair.take(no,oper,time,function(result){
		if(result==1){
			SEND(res,200,'已确认收货',[]);
		}else{
			SEND(res,-1,'确认收货失败',[]);
		}
	});
}
this.update = function(req,res,next){
	var no = req.body.no;
	var name = req.session.name;
	mod_admin.searchUpdataPerson(name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		modRepair.update(no,update_person,time,function(result){
			if(result==-1){
				SEND(res,-1,'更新失败',[]);		//原数据库找不到该编号
			}else{
				SEND(res,200,'更新成功',[]);
			}
		});
	});
}
this.slider = function(req,res,next){
	var path = req.path;
	var no = path.split('/slider/')[1];
	var authority = req.session.cnAuthority;
	modRepair.info(no,authority,function(result){
		var album_arr = result[0].album.split(',');
		res.render('./pages/contract_slider',{
			result: album_arr,
			title: '维修件照片'
		});
	});
}