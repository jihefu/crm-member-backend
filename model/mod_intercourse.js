var express = require('express');
var mysql = require('mysql');
var common = require('../controllers/common');
var DIRECTOR = [101,1003,1103,1702];

function isDirector(user_id){
	for (var i = 0; i < DIRECTOR.length; i++) {
		if(DIRECTOR[i]==user_id){
			return true;
		}else if(DIRECTOR[i]!=user_id&&i==DIRECTOR.length-1){
			return false;
		}
	}
}
this.getList = function(user_id,page,num,cb){
	var start_page = (page-1)*num;
	if(isDirector(user_id)){
		var m_str = 'SELECT * FROM customer_contact WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
	}else{
		var m_str = 'SELECT * FROM customer_contact WHERE isdel = 0 AND cus_manager = "'+user_id+'" ORDER BY id DESC LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]!=null){
			var count = 0;
			rows.forEach(function(items,index){
				exec(items,index,function(){
					cb(rows);
				});
			});
		}else{
			cb(rows);
		}
		function exec(items,ind,cb){
			middleTrans(items,function(arr){
				arr.forEach(function(items,index){
					rows[ind][items.key] = items.val;
				});
				for(let key in items){
					if(key=='start_time'){
						rows[ind][key] = rows[ind][key]?(rows[ind][key]=='0000-00-00'?null:DATETIME(rows[ind][key])):null;
					}
				}
				count++;
				if(count==rows.length){
					cb();
				}
			});
		}
	});
}
this.info = function(id,cb){
	var m_str = 'SELECT * FROM customer_contact WHERE id = "'+id+'" AND isdel = 0';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		middleTrans(rows[0],function(arr){
			arr.forEach(function(items,index){
				rows[0][items.key] = items.val;
			});
			for(let key in rows[0]){
				if(key=='insert_time'||key=='update_time'){
					rows[0][key] = rows[0][key]?TIME(rows[0][key]):null;
				}else if(key=='start_time'||key=='finish_time'){
					rows[0][key] = rows[0][key]?(rows[0][key]=='0000-00-00'?null:DATETIME(rows[0][key])):null;
				}
			}
			cb(rows);
		});
	});
}
this.action = function(id,cb){
	var m_str = 'SELECT * FROM contact_action WHERE contact_id = "'+id+'" AND isdel = 0';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.tag = function(val,cb){
	var str = '%';
	for (var i = 0; i < val.length; i++) {
		str += val[i]+'%';
	};
	var m_str = 'SELECT tag FROM contact_action WHERE tag LIKE "'+str+'" AND isdel = 0 LIMIT 0,5';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getAllTag = function(stage,cb){
	var m_str;
	if(stage==''){
		m_str = 'SELECT tag FROM cus_tags_lib WHERE isdel = 0';
	}else{
		m_str = 'SELECT tag FROM cus_tags_lib WHERE isdel = 0 AND type = "'+stage+'" OR type = "custom"';
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
function middleTrans(it,cb){
	var name_arr = [],cb_arr = [];
	for(let key in it){
		if(key=='cus_manager'||key=='director'||key=='insert_person'||key=='update_person'){
			if(it[key]){
				name_arr.push({
					key: key,
					val: it[key]
				});
				cb_arr.push({
					key: key
				});
			}
		}
	}
	name_arr.forEach(function(items,index){
		name_arr[index] = new Promise(function(resolve,reject){
			common.getEmployeeName(items.val,function(name){
				if(name[0]!=null){
					resolve(name);
				}else{
					resolve(items.cus_manager);
				}
			});
		});
	});
	Promise.all(name_arr).then(function(result){
		cb_arr.forEach(function(items,index){
			cb_arr[index].val = result[index][0].user_name;
		});
		cb(cb_arr);
	});	
}
this.updateCusCon = function(id,str,cb){
	var m_str = 'UPDATE customer_contact SET '+str+' WHERE id = "'+id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err+'124');
			cb({
				code: -1
			});
			return;
		}
		cb({
			code: 1
		});
	});
}
this.updateAct = function(id,str,_json,cb){
	var m_str = 'UPDATE contact_action SET '+str+' WHERE id = "'+id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err+'139');
			cb({
				code: -1
			});
			return;
		}
		_json = JSON.stringify(_json);
		CONINSERT('UPDATE contact_action SET ? WHERE id = "'+id+'"',{action_content:_json},function(err,rows){
			if(err){
				LOG(err+'147');
				cb({
					code: -1
				});
				return;
			}
			cb({
				code: 1
			});
		});
	});
} 
this.getImg = function(id,cb){
	var m_str = 'SELECT * FROM contact_action WHERE contact_id = "'+id+'" AND isdel = 0';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.updateActImg = function(id,str,update_person,update_time,cb){
	var m_str = 'UPDATE contact_action SET '+str+' WHERE contact_id = "'+id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('UPDATE customer_contact SET update_person = "'+update_person+'",update_time = "'+update_time+'"',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			cb(rows);
		});
	});
}
this.search = function(page,num,keywords,cb){
	var str = '%';
	for (var i = 0; i < keywords.length; i++) {
		str += keywords[i]+'%';
	};
	var start_page = (page-1)*num;
	var m_str = 'SELECT * FROM customer_contact WHERE isdel = 0 AND ( cus_abb LIKE "'+str+'" OR cus_manager LIKE "'+str+'" OR join_person LIKE "'+str+'" OR cus_person LIKE "'+str+'" ) ORDER BY start_time DESC LIMIT '+start_page+','+num;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var count = 0;
		if(rows[0]!=null){
			var count = 0;
			rows.forEach(function(items,index){
				exec(items,index,function(){
					cb(rows);
				});
			});
		}else{
			cb(rows);
		}
		function exec(items,ind,cb){
			middleTrans(items,function(arr){
				arr.forEach(function(items,index){
					rows[ind][items.key] = items.val;
				});
				for(let key in items){
					if(key=='start_time'){
						rows[ind][key] = rows[ind][key]?(rows[ind][key]=='0000-00-00'?null:DATETIME(rows[ind][key])):null;
					}
				}
				count++;
				if(count==rows.length){
					cb();
				}
			});
		}
	});
}
//未作处理...
this.searchActAll = function(sql_str,key,page,num,cb){
	var start_page = (page-1)*num;
	if(key==''){
		var m_str = 'SELECT customer_contact.* FROM customer_contact INNER JOIN contact_action ON customer_contact.id = contact_action.contact_id WHERE'+sql_str+'AND customer_contact.isdel = 0 LIMIT '+start_page+','+num;                                                
	}else{
		var str = '%';
		for (let i = 0; i < key.length; i++) {
			str += key[i]+'%';
		};
		var m_str = 'SELECT customer_contact.* FROM customer_contact INNER JOIN contact_action ON customer_contact.id = contact_action.contact_id WHERE'+sql_str+'AND customer_contact.isdel = 0 AND ( customer_contact.cus_abb LIKE "'+str+'" OR customer_contact.cus_manager LIKE "'+str+'" OR customer_contact.join_person LIKE "'+str+'" OR customer_contact.cus_person LIKE "'+str+'" ) LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var count = 0;
		if(rows[0]!=null){
			var count = 0;
			rows.forEach(function(items,index){
				exec(items,index,function(){
					cb(rows);
				});
			});
		}else{
			cb(rows);
		}
		function exec(items,ind,cb){
			middleTrans(items,function(arr){
				arr.forEach(function(items,index){
					rows[ind][items.key] = items.val;
				});
				for(let key in items){
					if(key=='start_time'){
						rows[ind][key] = rows[ind][key]?(rows[ind][key]=='0000-00-00'?null:DATETIME(rows[ind][key])):null;
					}
				}
				count++;
				if(count==rows.length){
					cb();
				}
			});
		}
	});
}
this.sort = function(page,num,keywords,user_id,cb){
	var start_page = (page-1)*num;
	if(keywords=='all'){
		if(isDirector(user_id)){
			var m_str = 'SELECT * FROM customer_contact WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
		}else{
			var m_str = 'SELECT * FROM customer_contact WHERE isdel = 0 AND cus_manager = "'+user_id+'" ORDER BY id DESC LIMIT '+start_page+','+num;
		}
	}else if(keywords=='update_time'){
		if(isDirector(user_id)){
			var m_str = 'SELECT * FROM customer_contact WHERE isdel = 0 ORDER BY update_time DESC LIMIT '+start_page+','+num;
		}else{
			var m_str = 'SELECT * FROM customer_contact WHERE isdel = 0 AND cus_manager = "'+user_id+'" ORDER BY update_time DESC LIMIT '+start_page+','+num;
		}
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var count = 0;
		if(rows[0]!=null){
			var count = 0;
			rows.forEach(function(items,index){
				exec(items,index,function(){
					cb(rows);
				});
			});
		}else{
			cb(rows);
		}
		function exec(items,ind,cb){
			middleTrans(items,function(arr){
				arr.forEach(function(items,index){
					rows[ind][items.key] = items.val;
				});
				for(let key in items){
					if(key=='start_time'){
						rows[ind][key] = rows[ind][key]?(rows[ind][key]=='0000-00-00'?null:DATETIME(rows[ind][key])):null;
					}
				}
				count++;
				if(count==rows.length){
					cb();
				}
			});
		}
	});
}
this.filter = function(sql_str,page,num,cb){
	var start_page = (page-1)*num;
	var m_str = 'SELECT * FROM customer_contact WHERE '+sql_str+'isdel= 0 ORDER BY start_time LIMIT '+start_page+','+num;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var count = 0;
		if(rows[0]!=null){
			var count = 0;
			rows.forEach(function(items,index){
				exec(items,index,function(){
					cb(rows);
				});
			});
		}else{
			cb(rows);
		}
		function exec(items,ind,cb){
			middleTrans(items,function(arr){
				arr.forEach(function(items,index){
					rows[ind][items.key] = items.val;
				});
				for(let key in items){
					if(key=='start_time'){
						rows[ind][key] = rows[ind][key]?(rows[ind][key]=='0000-00-00'?null:DATETIME(rows[ind][key])):null;
					}
				}
				count++;
				if(count==rows.length){
					cb();
				}
			});
		}
	});
}
this.filterAll = function(sql_str,cb){
	var m_str = 'SELECT * FROM customer_contact WHERE '+sql_str+'isdel= 0 ORDER BY start_time';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var count = 0;
		if(rows[0]!=null){
			var count = 0;
			rows.forEach(function(items,index){
				exec(items,index,function(){
					cb(rows);
				});
			});
		}else{
			cb(rows);
		}
		function exec(items,ind,cb){
			middleTrans(items,function(arr){
				arr.forEach(function(items,index){
					rows[ind][items.key] = items.val;
				});
				for(let key in items){
					if(key=='start_time'){
						rows[ind][key] = rows[ind][key]?(rows[ind][key]=='0000-00-00'?null:DATETIME(rows[ind][key])):null;
					}
				}
				count++;
				if(count==rows.length){
					cb();
				}
			});
		}
	});
}
this.filtStage = function(stage,cb){
	var m_str = 'SELECT * FROM contact_action WHERE stage = "'+stage+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.add = function(template,action_content,user_id,time,cb){
	CON('INSERT INTO customer_contact (cus_manager,insert_person,insert_time,update_person,update_time) VALUES ("'+user_id+'","'+user_id+'","'+time+'","'+user_id+'","'+time+'")',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('SELECT id FROM customer_contact WHERE update_time = "'+time+'"',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			var id = rows[0].id;
			CON('INSERT INTO contact_action (contact_id,action_type,action_content) VALUES ("'+rows[0].id+'","'+template+'","'+action_content+'")',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				cb(id);
			});
		});
	});
}
this.searchTemp = function(cb){
	CON('SELECT action_type FROM contact_action',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.addTemp = function(id,temp,action_content,user_id,time,cb){
	var sql_arr = [];
	sql_arr[0] = 'INSERT INTO contact_action (contact_id,action_type,action_content) VALUES ("'+id+'","'+temp+'","'+action_content+'")';
	sql_arr[1] = 'UPDATE customer_contact SET update_person = "'+user_id+'",update_time = "'+time+'"';
	common.transaction(sql_arr,function(result){
		cb(result);
	});
}
this.getLastTempId = function(id,cb){
	CON('SELECT id FROM contact_action WHERE contact_id = "'+id+'" AND isdel = 0 ORDER BY id DESC LIMIT 0,1',function(err,rows){
		cb(rows);
	});
}
this.star = function(id,star,update_person,update_time,cb){
	var m_str = 'UPDATE customer_contact SET director = "'+update_person+'",director_evaluate = "'+star+'",update_person = "'+update_person+'",update_time = "'+update_time+'",finish_time = "'+update_time+'",complete = 1 WHERE id = "'+id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(m_str);
	});
}
this.getSalerName = function(cb){
	CON('SELECT user_name FROM employee WHERE branch = "客户关系部" AND on_job = 1',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getTags = function(cb){
	var m_str = 'SELECT * FROM cus_tags_lib WHERE isdel = 0 ORDER BY basic_freq + acc_freq DESC LIMIT 0,5';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.delTag = function(tag,cb){
	var m_str = 'UPDATE cus_tags_lib SET isdel = 1 WHERE tag = "'+tag+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.actionTag = function(id,cb){
	var m_str = 'SELECT tag FROM contact_action WHERE id = "'+id+'" AND isdel = 0';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getSingleTag = function(tag,cb){
	var m_str = 'SELECT * FROM cus_tags_lib WHERE tag = "'+tag+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.addTag = function(tag,cb){
	CON('INSERT INTO cus_tags_lib (tag,type,acc_freq) VALUES ("'+tag+'","custom",1)',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.addScore = function(tag,acc_freq,cb){
	CON('UPDATE cus_tags_lib SET acc_freq = "'+acc_freq+'" WHERE tag = "'+tag+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.delActionId = function(action_id,id,update_person,update_time,cb){
	var p = [];
	p[0] = new Promise(function(resolve,reject){
		CON('UPDATE contact_action SET isdel = 1 WHERE id = "'+action_id+'"',function(err,rows){
			if(err){
				reject();
				return;
			}
			resolve();
		});
	});
	p[1] = new Promise(function(resolve,reject){
		CON('UPDATE customer_contact SET update_person = "'+update_person+'",update_time = "'+update_time+'" WHERE id = "'+id+'"',function(err,rows){
			if(err){
				reject();
				return;
			}
			resolve();
		});
	});
	Promise.all(p).then(function(){
		cb();
	}).catch(function(result){
		LOG(result);
	});
}
/**
 * 移动端
 */
this.updateActionImg = function(id,str,update_person,update_time,cb){
	CON('UPDATE customer_contact SET update_person = "'+update_person+'",update_time = "'+update_time+'" WHERE id = "'+id+'"',function(err,rows){});
	CON('UPDATE contact_action SET action_img = "'+str+'" WHERE contact_id = "'+id+'"',function(err,rows){});
}