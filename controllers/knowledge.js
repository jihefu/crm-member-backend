var express = require('express');
var url = require('url');
var base = require('./base');
var modKnowledge = require('../model/mod_knowledge');

this.list = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var num = 10;
	modKnowledge.getList(page,num,function(result){
		if(page==1){
			var arr = [];
			result.forEach(function(items,index){
				try{
					arr.push(items.album.split(',')[0]);
				}catch(e){
					arr.push('');
				}
			});
			res.render('./pages/knowledge_list',{
				result: result,
				arr: arr
			});
		}else{
			SEND(res,200,'',result);
		}
	});
}
this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	var keywords = params.keywords;
	var num = 10;
	if(keywords==''){
		modKnowledge.getList(page,num,function(result){
			SEND(res,200,'',result);
		});
	}else{
		var searchEngine = new base.SearchEngine(keywords);
		searchEngine.init(function(v,i){
			searchEngine.searchStart(v,i,page,num,function(result){
				if(result[0]==null){
					if(page==1){
						SEND(res,200,'不存在',result);
					}else{
						SEND(res,200,'没有更多了',result);
					}
				}else{
					searchEngine.getRes(result,function(r){
						SEND(res,200,'',r);
					});
				}
			});
		});
	}
}
this.info = function(req,res,next){
	var path = req.path;
	var id = path.split('/info/')[1];
	modKnowledge.info(id,function(result){
		if(result[0]==null){
			res.render('./pages/tip',{
				tip: '不存在'
			});
		}else{
			var album = result[0].album.split(',');
			var question_tags = result[0].question_tags.split(',');
			var products_tags = result[0].products_tags.split(',');
			var documents = result[0].documents.split(',');
			var doc_arr = [];
			documents.forEach(function(items,index){
				doc_arr.push(items.split('/knowledge_lib/')[1]);
			});
			res.render('./pages/m_knowledge_info',{
				result: result,
				question_tags: question_tags,
				products_tags: products_tags,
				documents: documents,
				doc_arr: doc_arr,
				album: album
			});
		}
	});
}