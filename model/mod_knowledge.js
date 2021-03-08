var express = require('express');
var mysql = require('mysql');
var url = require('url');
var fs = require('fs');

this.checkUser = function(open_id,cb){
	var m_str = 'SELECT * FROM vip_basic WHERE openid = "'+open_id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}

this.getList = function(page,num,cb){
	var start_page = (page-1)*num;
	var m_str = 'SELECT * FROM testing_knowledge WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.info = function(id,cb){
	var m_str = 'SELECT * FROM testing_knowledge WHERE id = "'+id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		try{
			rows[0].insert_time = TIME(rows[0].insert_time);
			rows[0].update_time = TIME(rows[0].update_time);
			var insert_promise = new Promise(function(resolve,reject){
				CON('SELECT user_name FROM employee WHERE user_id = "'+rows[0].insert_person+'"',function(err,rows){
					if(err){
						reject(err);
						return;
					}
					resolve(rows);
				});
			});
			var update_promise = new Promise(function(resolve,reject){
				CON('SELECT user_name FROM employee WHERE user_id = "'+rows[0].update_person+'"',function(err,rows){
					if(err){
						reject(err);
						return;
					}
					resolve(rows);
				});
			});
			Promise.all([insert_promise,update_promise]).then(function(result){
		        rows[0].insert_person = result[0][0].user_name;
		        rows[0].update_person = result[1][0].user_name;
		        cb(rows);
		    }).catch(function(err){
		        LOG(err);
		    });
		}catch(e){
			cb(rows);
		}
	});
}
this.search = function(page,num,keywords,cb){
	var start_page = (page-1)*num;
	var len = keywords.length;
    var str = '%';
    for(var i=0;i<len;i++){
        str += keywords.charAt(i)+'%';
    }
    var m_str = 'SELECT * FROM testing_knowledge WHERE isdel = 0 AND ( question LIKE "'+str+'" OR question_tags LIKE "'+str+'" OR products_tags LIKE "'+str+'" ) LIMIT '+start_page+','+num;
    CON(m_str,function(err,rows){
    	if(err){
    		LOG(err);
    		return;
    	}
    	cb(rows);
    });
}
this.sort = function(page,num,key,cb){
	var start_page = (page-1)*num;
	if(key=='all'){
		var m_str = 'SELECT * FROM testing_knowledge WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
	}else if(key=='update_time'){
		var m_str = 'SELECT * FROM testing_knowledge WHERE isdel = 0  ORDER BY update_time DESC LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.add = function(update_person,update_time,cb){
	CON('INSERT INTO testing_knowledge (question,insert_person,insert_time,update_person,update_time) VALUES ("","'+update_person+'","'+update_time+'","'+update_person+'","'+update_time+'")',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.getTags = function(cb,tip){
	if(tip){
		var m_str = 'SELECT * FROM tags_lib WHERE isdel = 0 ORDER BY basic_freq + acc_freq DESC LIMIT 0,5';
	}else{
		var m_str = 'SELECT * FROM tags_lib WHERE isdel = 0 ORDER BY basic_freq + acc_freq DESC';
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.delTag = function(tag,cb){
	var m_str = 'UPDATE tags_lib SET isdel = 1 WHERE tag = "'+tag+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.update = function(id,str,update_person,update_time,cb){
	CON('UPDATE testing_knowledge SET '+str+'update_person = "'+update_person+'",update_time = "'+update_time+'" WHERE id = "'+id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.updateTagsLib = function(tags_lib,result){
	CON('UPDATE tags_lib SET '+tags_lib+'="'+result+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
	});
}	
this.getDoc = function(page,num,cb){
	var start_page = (page-1)*num;
	var m_str = 'SELECT * FROM documents_lib LIMIT '+start_page+','+num;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.checkExist = function(name,type,cb){
	CON('SELECT * FROM documents_lib WHERE name = "'+name+'" AND type = "'+type+'"',function(err,rows){
		if(err){
			LOG('119'+err);
			return;
		}
		try{
			CON('SELECT user_name FROM employee WHERE user_id = "'+rows[0].upload_person+'"',function(err,result){
				if(err){
					LOG('155'+err);
					return;
				}
				rows[0].upload_person = result[0].user_name;
				cb(rows)
			});
		}catch(e){
			cb(rows);
		}
	});
}
this.insert = function(name,type,update_person,time){
	var m_str = 'INSERT INTO documents_lib (name,type,upload_person,upload_time) VALUES ("'+name+'","'+type+'","'+update_person+'","'+time+'")';
	CON(m_str,function(err,rows){
		if(err){
			LOG('129'+err);
			return;
		}
	});
}
this.updateDocLib = function(name,type,update_person,time){
	CON('UPDATE documents_lib SET upload_person = "'+update_person+'",upload_time = "'+time+'" WHERE name = "'+name+'" AND type = "'+type+'"',function(err,rows){
		if(err){
			LOG('137'+err);
			return;
		}
	});
}
this.docSearch = function(text,cb){
    var str = '%';
    for(var i=0;i<text.length;i++){
        str += text.charAt(i)+'%';
    }
    var m_str = 'SELECT name,type FROM documents_lib WHERE name LIKE "'+str+'"';
    CON(m_str,function(err,rows){
    	if(err){
    		LOG('150'+err);
    		return;
    	}
    	cb(rows);
    });
}
this.getSingleTag = function(tag,cb){
	CON('SELECT * FROM tags_lib WHERE tag = "'+tag+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.addScore = function(tag,acc_freq,cb){
	CON('UPDATE tags_lib SET acc_freq = "'+acc_freq+'" WHERE tag = "'+tag+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.addTag = function(tag,cb){
	CON('INSERT INTO tags_lib (tag,type,acc_freq) VALUES ("'+tag+'","custom",1)',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.addFromCus = function(key_str,val_str){
	CON('INSERT INTO testing_knowledge ('+key_str+') VALUES ('+val_str+')',function(err,rows){
		if(err){
			LOG(err);
		}
	});
}	
this.checkFromCus = function(action_id,cb){
	CON('SELECT * FROM testing_knowledge WHERE action_id = "'+action_id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.updateFromCus = function(action_id,params){
	CONINSERT('UPDATE testing_knowledge SET ? WHERE action_id = "'+action_id+'"',params,function(err,rows){
		if(err){
			LOG(err);
		}
	});
}