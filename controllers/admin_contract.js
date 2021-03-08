var express = require('express');
var url = require('url');
var fs = require('fs');
var dealImages = require('images');
var base = require('./base');
var basicAuth = require("basic-auth");
var common = require('./common');
var mod_admin = require('../model/mod_contacts.js');
var modContract = require('../model/contract');

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = 1;
	var num = 30;
	modContract.getList(page,num,'employee',function(result){
		var len = result.length;
		if(len!=0){
			var asynLoop = new base.AsynLoop(len,result);
			for(var i = 0; i < len; i++ ){
				asynLoop.exec(i,function(count){
					if(count==len){
						if(page==1){
							res.render('./pages/contract',{
								list: asynLoop.arr
							});
						}else{
							SEND(res,200,'',asynLoop.arr);
						}
					}
				});
			}
		}else{
			SEND(res,200,'',[]);
		}
	});
}
this.goodsList = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var no = params.no;
	modContract.getBodyComment(function(comment){
		modContract.bodyContent(no,'employee',function(result){
			var wrap_arr = [];
			for(var i=0;i<result.length;i++){
				var arr = [];
				for(var j in result[i]){
					for(var z=0;z<comment.length;z++){
						if(j==comment[z].column_name&&j!='id'&&j!='contract_no'){
							var obj = {};
							obj.key = comment[z].column_comment;
							obj.val = result[i][j];
							arr.push(obj);
						}
					}
				}
				wrap_arr.push(arr);
			}
			SEND(res,200,'',wrap_arr);
		});
	});
}
this.info = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var no = params.no;
	modContract.getComment(function(comment){
		modContract.headContent(no,'employee',function(result){
			for(var i in result[0]){
				for (var j = 0; j < comment.length; j++) {
					if(i == comment[j].column_name) {
						comment[j].val = result[0][i];
					}
				};
			}
			comment.forEach(function(items,index){
				if(items.column_name=='cus_abb'){
					// exec(items.val,index,function(cn_abb){
					// 	comment[index].val = cn_abb;
					// 	SEND(res,200,'',comment);
					// });
					exe(items.val,index,function(company){
						comment[index].val = company;
						SEND(res,200,'',comment);
					});
				}
			});
		});
	});	
}
function exe(v,index,cb){
	modContract.getCompanyByAbb(v,function(name){
		cb(name,index);
	});
}
function exec(v,index,cb){
	modContract.getCnAbb(v,function(name){
		cb(name,index);
	});
}
this.search = function(req,res,next){
	var authority = 'employee';
	var params = url.parse(req.url,true).query;
	var keywords = params.keywords;
	var page = params.page?params.page:1;
	var num = 30;
	if(keywords==''){
		modContract.getList(page,num,authority,function(result){
			var len = result.length;
			if(len!=0){
				var asynLoop = new base.AsynLoop(len,result);
				for(var i = 0; i < len; i++ ){
					asynLoop.exec(i,function(count){
						if(count==len){
							SEND(res,200,'',asynLoop.arr);
						}
					});
				}
			}else{
				SEND(res,200,'',[]);
			}
		});
	}else if(/[\u4e00-\u9fa5]/.test(keywords)){
		modContract.searchCn(keywords,num,page,function(result){
			if(result==-2){
				SEND(res,-2,'不存在该公司',[]);
			}else if(result==-3){
				SEND(res,-3,'合同系统跟客户系统简称不一致',[]);
			}else{
				var len = result.length;
				if(len!=0){
					var asynLoop = new base.AsynLoop(len,result);
					for(var i = 0; i < len; i++ ){
						asynLoop.exec(i,function(count){
							if(count==len){
								SEND(res,200,'',asynLoop.arr);
							}
						});
					}
				}else{
					SEND(res,200,'',[]);
				}
			}
		});
	}else{
		modContract.search(page,num,authority,keywords,function(result){
			if(result[0]==null){
				SEND(res,-1,'该合同不存在',result);
			}else{
				var len = result.length;
				if(len!=0){
					var asynLoop = new base.AsynLoop(len,result);
					for(var i = 0; i < len; i++ ){
						asynLoop.exec(i,function(count){
							if(count==len){
								SEND(res,200,'',asynLoop.arr);
							}
						});
					}
				}else{
					SEND(res,200,'',[]);
				}
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
	modContract.sort(page,num,authority,key,function(result){
		var len = result.length;
		if(len!=0){
			var asynLoop = new base.AsynLoop(len,result);
			for(var i = 0; i < len; i++ ){
				asynLoop.exec(i,function(count){
					if(count==len){
						SEND(res,200,'',asynLoop.arr);
					}
				});
			}
		}else{
			SEND(res,200,'',[]);
		}
	});
}
this.pageDef = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	var num = 30;
	modContract.getList(page,num,'employee',function(list){
		var len = list.length;
		if(len!=0){
			var asynLoop = new base.AsynLoop(len,list);
			for(var i = 0; i < len; i++ ){
				asynLoop.exec(i,function(count){
					if(count==len){
						SEND(res,200,'',asynLoop.arr);
					}
				});
			}
		}else{
			SEND(res,200,'',[]);
		}
	});
}
this.del = function(req,res,next){
	var no = req.body.no;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		modContract.del(no,update_person,time,function(){
			SEND(res,200,'删除成功',[]);
		});
	});
}
this.transId = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var id_arr = JSON.parse(params.arr);
	var count = 0;
	var arr = [];
	var s = function(){
		if(count==id_arr.length){
			SEND(res,200,'',arr);
		}else{
			var id = id_arr[count];
			modContract.getEmployeeName(id,function(res){
				arr.push(res);
				count++;
				s();
			});
		}
	}
	s();
}
this.update = function(req,res,next){
	var no = req.body.no;
	var str = req.body.str;
	var bs_name = basicAuth(req).name;
	if(str.indexOf('delivery_state="已发货"')!=-1){
		modContract.headContent(no,'employee',function(result){
			if(result[0].delivery_state!='已发货'){
				mod_admin.searchUpdataPerson(bs_name,function(result){
					var update_person = result[0].user_id;
					var time = TIME();
					modContract.update(no,update_person,time,str,function(){
						modContract.update(no,update_person,time,'delivery_time = "'+DATETIME()+'",',function(){
							SEND(res,200,'更新成功',[]);
						});
					});
				});
			}else{
				mod_admin.searchUpdataPerson(bs_name,function(result){
					var update_person = result[0].user_id;
					var time = TIME();
					modContract.update(no,update_person,time,str,function(){
						SEND(res,200,'更新成功',[]);
					});
				});
			}
		});
	}else{
		mod_admin.searchUpdataPerson(bs_name,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			modContract.update(no,update_person,time,str,function(){
				SEND(res,200,'更新成功',[]);
			});
		});
	}
}
this.searchInput = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var val = params.val;
	modContract.searchInput(val,function(result){
		SEND(res,200,'',result);
	});
}

this.getImg = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var no = params.no;
	modContract.getImg(no,function(rows){
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
	var uploadImg = new base.UploadImg('/public/img/contract',1);
	uploadImg.upload(req,function(no){
		var bs_name = basicAuth(req).name;
		mod_admin.searchUpdataPerson(bs_name,function(result){
			var update_person = result[0].user_id;
			var time = TIME();
			modContract.getImg(no,function(rows){
				if(rows[0].album==null||rows[0].album==''){
					var str = 'album="/contract/'+uploadImg.name+'",';
				}else{
					var str = rows[0].album + ',/contract/' + uploadImg.name;
					str = 'album="'+str+'"'+',';
				}
				modContract.update(no,update_person,time,str,function(){
					modContract.getImg(no,function(rows){
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
	modContract.getImg(no,function(rows){
		var str = rows[0].album;
		var arr = str.split(',');
		arr.forEach(function(items,index){
			if(items=='/contract/'+pic){
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
			modContract.update(no,update_person,time,_str,function(){
				SEND(res,200,'替换成功',rows);
			});
		});
	});
}
this.delImg = function(req,res,next){
	var pic = JSON.parse(req.body.pic);
	var no = req.body.no;
	modContract.getImg(no,function(rows){
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
			modContract.update(no,update_person,time,st,function(){
				SEND(res,200,'删除成功',rows);
			});
			fsArr.forEach(function(items){
		        fs.unlink(DIRNAME+'/public/img/'+items);
		    });
		});
	});
}

this.searchMore = function(req,res,next){
	let params = url.parse(req.url,true).query;
	let contract_no_arr = JSON.parse(params.contract_no_arr);
	let p_c = [];
	contract_no_arr.forEach(function(items,index){
		p_c[index] = new Promise(function(resolve,reject){
			modContract.searchMore(items,function(result){
				var _p = [];
				result.forEach(function(it,ind){
					_p[ind] = new Promise(function(reso,rej){
						common.getEmployeeName(it.sale_person,function(name){
							result[ind].sale_person = name[0].user_name;
							reso(result);
						});
					});
				});
				Promise.all(_p).then(function(result){
					resolve(result[0]);
				});
			});
		});
	});
	Promise.all(p_c).then(function(result){
		SEND(res,200,'',result);
	});
}
this.filter = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var num = 30;
	var keywords = JSON.parse(params.keywords);
	var s = keywords.s;
	var company = keywords.company;
	if(company==''){
		modContract.getContractByNoCpy(s,page,num,function(result){
			if(result[0]==null){
				SEND(res,-1,'不存在该合同',[]);
			}else{
				var len = result.length;
				var asynLoop = new base.AsynLoop(len,result);
				for(var i = 0; i < len; i++ ){
					asynLoop.exec(i,function(count){
						if(count==len){
							SEND(res,200,'',asynLoop.arr);
						}
					});
				}
			}
		});
	}else{
		modContract.transAbb(company,function(result){
			if(result[0]==null){
				SEND(res,-1,'不存在该公司',[]);
			}else{
				var abb = result[0].abb;
				modContract.getContract(s,abb,page,num,function(result){
					if(result[0]==null){
						SEND(res,-1,'不存在该合同',[]);
					}else{
						var len = result.length;
						var asynLoop = new base.AsynLoop(len,result);
						for(var i = 0; i < len; i++ ){
							asynLoop.exec(i,function(count){
								if(count==len){
									SEND(res,200,'',asynLoop.arr);
								}
							});
						}
					}
				});
			}
		});
	}
}