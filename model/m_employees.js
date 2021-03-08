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
	CON('select user_name,user_id,phone,album from employee WHERE isdel = 0 AND on_job = 1 limit '+start_page+','+num,function(err,rows){
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
    CON('SELECT user_name,user_id,phone,album FROM employee WHERE isdel = 0 AND (user_name LIKE "'+str+'" OR user_id = "'+keyword+'")',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.selectSort = function(key,page,cb){
    var num = 10;
    var start_page = (page-2)*num;
    var list = {
        all: function(start_page,num){
            var str = 'select user_name,user_id,phone,album from employee WHERE isdel = 0 AND on_job = 1 limit '+start_page+','+num;
            return str;
        },
        update_time: function(){
            var str = 'SELECT user_name,user_id,phone,album,update_time FROM employee WHERE isdel = 0 AND on_job = 1';
            return str;
        },
        birth: function(){
            var str = 'SELECT user_name,user_id,phone,album,birth FROM employee WHERE isdel = 0 AND on_job = 1';
            return str;
        },
        user_name: function(start_page,num){
            var str = 'SELECT user_name,user_id,phone,album FROM employee WHERE isdel = 0 AND on_job = 1 ORDER BY English_name limit '+start_page+','+num;
            return str;
        },
        user_id: function(start_page,num){
            var str = 'SELECT user_name,user_id,phone,album FROM employee WHERE isdel = 0 AND on_job = 1';
            return str;
        },
        employees: function(start_page,num){
            var str = 'SELECT user_name,user_id,phone,album FROM employee WHERE isdel = 0 limit '+start_page+','+num;
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
this.getInfo = function(user_id,cb){
    CON('SELECT * FROM employee WHERE user_id = "'+user_id+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.checkAbb = function(cb){
    CON('SELECT user_id,user_name FROM employee',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.update = function(user_id,str,update_person,time,cb){
    var str = 'UPDATE employee SET '+str+' WHERE user_id = '+user_id;
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        CON('UPDATE employee SET update_person = "'+update_person+'",update_time = "'+time+'" WHERE user_id = '+user_id,function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            infoScore(user_id,function(){
                CON('SELECT info_score,update_person,update_time FROM employee WHERE user_id = "'+user_id+'" AND isdel = 0',function(err,rows){
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
this.del = function(user_id,update_person,time,cb){
    var str = 'UPDATE employee SET isdel = 1,update_person = "'+update_person+'",update_time = "'+time+'" WHERE user_id = "'+user_id+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(JSON.stringify({'status':'succeed'}));
    });
}
function infoScore(new_abb,callback){
    var str = 'SELECT * FROM contacts WHERE abb = "'+new_abb+'"';
    CON(str,function(err,rows){
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
        var info_score = (((1-(count-1)/(sum-4)).toFixed(2))*100)>100?100:(((1-(count-1)/(sum-4)).toFixed(2))*100);
        var _str = 'UPDATE contacts SET info_score = '+info_score+' WHERE abb = "'+new_abb+'"';
        CON(_str,function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            callback();
        });
    });
}
this.checkName = function(name,user_id,cb){
    CON('SELECT * FROM employee WHERE user_id = '+user_id,function(err,rows){
        if(err){
            LOG(err);
            return;
        }
        cb(rows);
    });
}
this.createCpy = function(name,id,update_person,time,cb){
    CON('INSERT INTO employee (user_name,user_id,update_person,insert_time) VALUES ("'+name+'","'+id+'","'+update_person+'","'+time+'")',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb();
    });
}