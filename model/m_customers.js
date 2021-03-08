var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');
var async = require('async');

this.list = function(page,cb){
	var num = 10;
	var start_page = (page-1)*num;
	CON('select user_id,abb,company,level,album from customers WHERE isdel = 0 limit '+start_page+','+num,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.search = function(keyword,cb){
    var len = keyword.length;
    var str = '%';
    var str2 = keyword+'%';
    for(var i=0;i<len;i++){
        str += keyword.charAt(i)+'%';
    }
    CON('SELECT user_id,company,level,abb,album FROM customers WHERE isdel = 0 AND (company LIKE "'+str+'" OR user_id = "'+keyword+'" OR legal_person = "'+keyword+'" OR reg_person LIKE "'+str+'" OR abb = "'+keyword+'")',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.checkName = function(name,abb,cb){
    CON('SELECT * FROM customers WHERE abb = "'+abb+'"',function(err,rows){
        if(err){
            LOG(err);
            return;
        }
        cb(rows);
    });
}
this.createCpy = function(name,abb,update_person,time,cb){
    CON('SELECT user_id FROM customers ORDER BY id DESC LIMIT 0,1',function(err,r){
        if(err){
            LOG(err);
            return;
        }
        var user_id = new String(r[0].user_id);   //结尾不能1,2,3,4
        var d = user_id.slice(0,user_id.length-1);
        var n = user_id.slice(user_id.length-1,user_id.length);
        if(n==0||n==1||n==2||n==3){
            user_id = parseInt(d+5);
        }else{
            user_id = parseInt(user_id)+1;
        }
        CON('INSERT INTO customers (company,abb,update_person,update_time,user_id) VALUES ("'+name+'","'+abb+'","'+update_person+'","'+time+'","'+user_id+'")',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb();
        });
    });
}
this.del = function(abb,update_person,time,cb){
    var str = 'UPDATE customers SET isdel = 1,update_person = "'+update_person+'",update_time = "'+time+'" WHERE abb = "'+abb+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(JSON.stringify({'status':'succeed'}));
    });
}
this.selectSort = function(key,page,cb){
    var num = 10;
    var start_page = (page-2)*num;
    var list = {
        all: function(start_page,num){
            var str = 'select * from customers WHERE isdel = 0 limit '+start_page+','+num;
            return str;
        },
        update_time: function(){
            var str = 'SELECT * FROM customers WHERE isdel = 0';
            return str;
        },
        level: function(start_page,num){
        	var str = 'SELECT * FROM customers WHERE isdel = 0 ORDER BY level limit '+start_page+','+num;
            return str;
        },
        total_sale: function(){
        	var str = 'SELECT * FROM customers WHERE isdel = 0 ORDER BY LENGTH(total_sale),total_sale';
        	return str;
        },
        last_sale: function(){
        	var str = 'SELECT * FROM customers WHERE isdel = 0 ORDER BY LENGTH(last_sale),last_sale';
        	return str;
        }
    };
    var getList = function(key,start_page,num){
        return list[key](start_page,num);
    }
    CON(getList(key,start_page,num),function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.getInfo = function(abb,cb){
    CON('SELECT * FROM customers WHERE abb = "'+abb+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.checkAbb = function(cb){
    CON('SELECT abb,company FROM customers',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.update = function(cpy,str,update_person,time,cb){
    var str = 'UPDATE customers SET '+str+' WHERE company = "'+cpy+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        CON('UPDATE customers SET update_person = "'+update_person+'",update_time = "'+time+'" WHERE company = "'+cpy+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            infoScore(cpy,function(){
                CON('SELECT info_score,update_person,update_time FROM customers WHERE company = "'+cpy+'" AND isdel = 0',function(err,rows){
                    if(err){
                        LOG('err:'+err);
                        return;
                    }
                    cb(rows);
                });
            });
        });
    });
}

function infoScore(cpy,callback){
    CON('SELECT * FROM customers WHERE company = "'+cpy+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        var o = rows[0];
        var count = 0;
        var sum = 0;
        for(var i in o){
            if(i!='rem'&&(o[i]==''||o[i]==null||o[i]=='0000-00-00'||o[i]==0||o[i]=='null')){
                count++;
            }
            sum++;
        }
        var info_score = ((1-(count-1)/(sum-2)).toFixed(2))*100;
        CON('UPDATE customers SET info_score = '+info_score+' WHERE company = "'+cpy+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            callback();
        });
    });
}