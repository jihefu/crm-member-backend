var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var log4js = require('../logs/log_start');

this.vir_info = function(page,cb){
	var num = 10;
	var start_page = (page-1)*num;
	CON('select serialNo from table_card ORDER BY id DESC limit '+start_page+','+num,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.vir_search = function(val,cb){
	CON('select serialNo from table_card WHERE serialNo = "'+val+'"',function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.putInfo = function(obj,cb){
	var str = '',sn = '';
	for(var i in obj){
		if(i!='arr'){
			str += i+'="'+obj[i]+'",';
		}
	}
	str += 'update_time = "'+TIME()+'",EMP_NO = "'+obj.update_person+'",';
	var _str = str.slice(0,str.length-1);
	obj.arr.forEach(function(items,index){
		sn += items+',';
	});
	var _sn = sn.slice(0,sn.length-1);
	CON('UPDATE table_card SET '+_str+ 'WHERE serialNo in ('+_sn+')',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}

function transToZero(v){
	CON('SELECT serialNo FROM table_card WHERE '+v+' = 65535',function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        var str = '';
        rows.forEach(function(items,index){
        	str += items.serialNo+',';
        });
        var _str = str.slice(0,str.length-1);
    	CON('UPDATE table_card SET '+v+' = 0 WHERE serialNo in ('+_str+')',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			console.log('ok');
		});
    });
}