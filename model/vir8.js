var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');
var async = require('async');

this.getList = function(page,cb){
	var num = 30;
	var start_page = (page-1)*num;
	var m_str = 'SELECT serialNo FROM table_card WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getInfo = function(serialNo,cb){
	var m_str = 'SELECT * FROM table_card WHERE serialNo = '+serialNo;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getRegHistory = function(sn,cb){
	// sn = 1234567;
	var m_str = 'SELECT * FROM event WHERE sn = '+sn+' ORDER BY id DESC';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.search = function(sn,cb){
	var arr = [];
	var len = sn.length;
	var str = '%';
	for(var i=0;i<len;i++){
		str += sn.charAt(i)+'%';
	}
	CON('select serialNo from table_card WHERE (serialNo = '+sn+' OR machineNo = '+sn+' OR serialNo LIKE "'+str+'") AND isdel = 0 ORDER BY id DESC',function(err,rows){
		if(err){
	        LOG('err:'+err);
	        return;
	    }
	    cb(rows);
	});
}
this.checkSn = function(sn,cb){
	var m_str = 'SELECT serialNo FROM table_card WHERE serialNo = "'+sn+'" AND isdel = 0';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.createCard = function(sn,update_person,time,cb){
	var m_str = 'INSERT INTO table_card (serialNo,EMP_NO,inputDate,update_time,inputPerson,update_person) VALUES ("'+sn+'","'+update_person+'","'+time+'","'+time+'","'+update_person+'","'+update_person+'")';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.del = function(sn,update_person,time,cb){
	var m_str = 'UPDATE table_card SET isdel=1,update_person="'+update_person+'",update_time="'+time+'",EMP_NO="'+update_person+'" WHERE serialNo = '+sn;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.sort = function(key,page,cb){
	var num = 30;
	var start_page = (page-1)*num;
	if(key=='all'){
		var m_str = 'SELECT serialNo FROM table_card WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
	}else if(key=='update_time'){
		var m_str ='SELECT serialNo FROM table_card WHERE isdel = 0 ORDER BY update_time DESC LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.update = function(sn,form_data,cb){
	CONINSERT('UPDATE table_card SET ? WHERE serialNo = "'+sn+'"',form_data,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
	// var m_str = 'UPDATE table_card SET '+str+',update_person="'+update_person+'",update_time="'+time+'",EMP_NO="'+update_person+'" WHERE serialNo = '+sn;
	// CON(m_str,function(err,rows){
	// 	if(err){
	// 		LOG(err);
	// 		return;
	// 	}
	// 	cb(rows);
	// });
}
this.putInfo = function(str_id,str_sn,cb){
	CON('UPDATE table_card SET '+str_id+ 'WHERE serialNo in ('+str_sn+')',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}