var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');

this.list = function(page,page_size,keywords,sort_str,cb){
	var start_page = (page-1)*page_size;
	var m_str = 'SELECT * FROM payment WHERE isdel = 0 AND ( company LIKE "%'+keywords+'%" OR abb LIKE "%'+keywords+'%" ) ORDER BY '+sort_str+' LIMIT '+start_page+','+page_size;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('SELECT count(*) AS _count FROM payment WHERE isdel = 0',function(err,count){
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
}
this.payUse = function(id,cb){
	CON('SELECT * FROM pay_use WHERE pay_id = "'+id+'" AND isdel = 0',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.update = function(id,params,cb){
	CONINSERT('UPDATE payment SET ? WHERE id = "'+id+'"',params,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.add = function(params,cb){
	CONINSERT('INSERT payment SET ?',params,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.payUseUpdate = function(id,params,cb){
	CONINSERT('UPDATE pay_use SET ? WHERE id = "'+id+'"',params,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.payUseAdd = function(params,cb){
	CONINSERT('INSERT pay_use SET ?',params,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.getCusAbb = function(company,cb){
	CON('SELECT * FROM customers WHERE company = "'+company+'" AND isdel = 0',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			CON('SELECT * FROM users WHERE company = "'+company+'" AND isdel = 0',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				cb(rows);
			});
		}else{
			cb(rows);
		}
	});
}
this.searchContractNo = function(abb,val,cb){
	CON('SELECT * FROM contracts_head WHERE contract_no LIKE "%'+val+'%" AND cus_abb = "'+abb+'" AND contract_state = "有效" AND isdel = 0 AND payable - paid > 0 LIMIT 0,30',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getAlbum = function(id,cb){
	CON('SELECT * FROM payment WHERE id = "'+id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.updateAlbum = function(id,str,cb){
	CON('UPDATE payment SET '+str+' WHERE id = "'+id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getId = function(insert_person,insert_time,cb){
	CON('SELECT id FROM payment WHERE insert_time = "'+insert_time+'" AND insert_person = "'+insert_person+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getPayUseInfo = function(id,cb){
	CON('SELECT * FROM pay_use WHERE pay_id = "'+id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}