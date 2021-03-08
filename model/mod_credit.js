var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');

this.list = function(page,page_size,keywords,sort_str,cb){
	var start_page = (page-1)*page_size;
	var m_str = 'SELECT * FROM credit_records WHERE isdel = 0 AND ( company LIKE "%'+keywords+'%" OR abb LIKE "%'+keywords+'%" ) ORDER BY '+sort_str+' LIMIT '+start_page+','+page_size;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('SELECT count(*) AS _count FROM credit_records WHERE isdel = 0 AND ( company LIKE "%'+keywords+'%" OR abb LIKE "%'+keywords+'%" )',function(err,count){
			if(err){
				LOG(err);
				return;
			}
			cb({
				code:200,
				rows: rows,
				count: count
			});
		});
	});
	// CON('SELECT * FROM customers',function(err,rows){
	// 	if(err){
	// 		LOG(err);
	// 		return;
	// 	}
	// 	var _p = [];
	// 	rows.forEach(function(items,index){
	// 		_p[index] = new Promise(function(resolve,reject){
	// 			var params = {};
	// 			params.company = items.company;
	// 			params.abb = items.abb
	// 			CONINSERT('INSERT credit_records SET ?',params,function(err,rows){
	// 				if(err){
	// 					LOG(err);
	// 					return;
	// 				}
	// 				resolve();
	// 			});
	// 		});
	// 	});
	// 	Promise.all(_p).then(function(){
	// 		console.log(111);
	// 	});
	// });
}
this.update = function(id,params,cb){
	CONINSERT('UPDATE credit_records SET ? WHERE id = "'+id+'"',params,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.add = function(params,cb){
	CONINSERT('INSERT credit_records SET ?',params,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.getAlbum = function(id,cb){
	CON('SELECT * FROM credit_records WHERE id = "'+id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.updateAlbum = function(id,str,cb){
	CON('UPDATE credit_records SET '+str+' WHERE id = "'+id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getId = function(insert_person,insert_time,cb){
	CON('SELECT id FROM credit_records WHERE insert_time = "'+insert_time+'" AND insert_person = "'+insert_person+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
