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
	CON('select name,abb,phone1,phone2,company,album from contacts WHERE isdel = 0 ORDER BY id DESC limit '+start_page+','+num,function(err,rows){
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
    CON('SELECT name,abb,phone1,phone2,company,album FROM contacts WHERE isdel = 0 AND (company LIKE "'+str+'" OR name LIKE "'+str+'" OR abb LIKE "'+str2+'" OR phone1 = "'+keyword+'" OR phone2 = "'+keyword+'")',function(err,rows){
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
    if(key=='all'){
        var str = 'select name,abb,phone1,phone2,company,album from contacts WHERE isdel = 0 ORDER BY id DESC limit '+start_page+','+num;
    }else if(key=='verified'){
        var str = 'SELECT name,abb,phone1,phone2,company,album FROM contacts WHERE isdel = 0 AND verified = 1 ORDER BY id DESC limit '+start_page+','+num;
    }else if(key=='update_time'){
        var str = 'SELECT name,abb,phone1,phone2,company,album,update_time FROM contacts WHERE isdel = 0';
    }
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.getInfo = function(abb,cb){
    CON('SELECT * FROM contacts WHERE abb = "'+abb+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.checkAbb = function(cb){
    CON('SELECT abb,name FROM contacts',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.update = function(abb,str,update_person,time,cb){
    var str = 'UPDATE contacts SET '+str+' WHERE abb = "'+abb+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        CON('UPDATE contacts SET update_person = "'+update_person+'",update_time = "'+time+'" WHERE abb = "'+abb+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            infoScore(abb,function(){
                CON('SELECT info_score,update_person,update_time FROM contacts WHERE abb = "'+abb+'" AND isdel = 0',function(err,rows){
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
this.del = function(abb,update_person,time,cb){
    var str = 'UPDATE contacts SET isdel = 1,update_person = "'+update_person+'",update_time = "'+time+'" WHERE abb = "'+abb+'"';
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