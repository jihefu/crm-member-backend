var express = require('express');
var url = require('url');
var base = require('./base');
var common = require('./common');
var modContract = require('../model/contract');

this.list = function(req,res,next){
	var authority = req.session.authority;
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var num = 10;
	modContract.getList(page,num,authority,function(result){
		var len = result.length;
		if(len!=0){
			var asynLoop = new base.AsynLoop(len,result);
			for(var i = 0; i < len; i++ ){
				asynLoop.exec(i,function(count){
					if(count==len){
						if(page==1){
							res.render('./pages/contract_list',{
								result: asynLoop.arr
							});
						}else{
							SEND(res,200,'',asynLoop.arr);
						}
					}
				});
			}
		}else{
			res.render('./pages/tip',{
				tip: '<p>很抱歉，未查到相关合同信息。</p><p>如有疑问，请联系朗杰客服。</p>'
			});
		}
	});
}
this.ajaxList = function(req,res,next){
	var authority = req.session.authority;
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var num = 10;
	modContract.getList(page,num,authority,function(result){
		var len = result.length;
		if(len!=0){
			var asynLoop = new base.AsynLoop(len,result);
			for(var i = 0; i < len; i++ ){
				asynLoop.exec(i,function(count){
					if(count==len){
						if(page==1){
							res.render('./pages/contract_list',{
								result: asynLoop.arr
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

this.search = function(req,res,next){
	var authority = req.session.authority;
	var params = url.parse(req.url,true).query;
	var keywords = params.keywords;
	var page = params.page;
	var num = 10;
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
	}else{
		modContract.search(page,num,authority,keywords,function(result){
			if(result[0]==null){
				if(page==1){
					SEND(res,200,'该合同不存在',result);
				}else{
					SEND(res,200,'没有更多了',result);
				}	
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

this.head = function(req,res,next){
	var authority = req.session.authority;
	var path = req.path;
	var no = decodeURIComponent(path.split('/head/')[1]);
	modContract.getComment(function(comment){
		modContract.headContent(no,authority,function(result){
			if(result[0]==null){
				res.render('./pages/tip',{
					tip: '不存在该合同'
				});
			}else{
				for(var i in result[0]){
					if(i=='delivery_state'){
						var status = result[0][i];
					}
					for (var j = 0; j < comment.length; j++) {
						if(i == comment[j].column_name) {
							comment[j].val = result[0][i];
						}
					};
				}
				comment.forEach(function(items,index){
					if(items.column_name=='cus_abb'){
						common.searchCustomerName(items.val,function(result){
							items.val = result[0].cn_abb;
							res.render('./pages/contract_cus_content',{
								result: comment,
								status: status
							});
						});
					}
				});
			}
		});
	});
}

this.takeGoods = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var no = params.no;
	var time = DATETIME();
	var oper = req.session.name;
	modContract.take(no,oper,time,function(){
		SEND(res,200,'已确认收货',[{
			time: time,
			name: oper,
			state: '已收货'
		}]);
	});
}
this.slider = function(req,res,next){
	var path = req.path;
	var no = path.split('/slider/')[1];
	var authority = req.session.authority;
	modContract.headContent(no,authority,function(result){
		var album_arr = result[0].album.split(',');
		res.render('./pages/contract_slider',{
			result: album_arr,
			title: '合同照片'
		});
	});
}

this.body = function(req,res,next){
	var authority = req.session.authority;
	var path = req.path;
	var no = decodeURIComponent(path.split('/body/')[1]);
	modContract.getBodyComment(function(comment){
		modContract.bodyContent(no,authority,function(result){
			if(result[0]==null){
				res.render('./pages/tip',{
					tip: '不存在该合同'
				});
			}else{
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
				res.render('./pages/contract_goods_list',{
					comment: comment,
					result: result,
					wrap_arr: wrap_arr
				});
			}
		});
	});
}