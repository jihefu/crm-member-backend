var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');
var async = require('async');

this.reviewList = function(page,num,cb){
	var start_page = (page-1)*num;
	CON('select name,phone,company,portrait,job,company from vip_basic ORDER BY submit_time DESC limit '+start_page+','+num,function(err,rows){
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
    CON('SELECT name,phone,company,portrait,job,company FROM vip_basic WHERE name LIKE "'+str+'" OR phone = "'+keyword+'" OR company LIKE "'+str+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.searchMember = function(keyword,cb){
    var len = keyword.length;
    var str = '%';
    var str2 = keyword+'%';
    for(var i=0;i<len;i++){
        str += keyword.charAt(i)+'%';
    }
    CON('SELECT name,phone FROM vip_basic WHERE name LIKE "'+str+'" OR phone LIKE "'+str+'" OR company LIKE "'+str+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.updateCheckItem = function(name,phone,str,admin_id,cb){
    CON('UPDATE vip_basic SET '+str+',checked = 1 WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,result){
        if(err){
            LOG(err);
            return;
        }
        CON('UPDATE admin_message SET is_read=1,read_time="'+TIME()+'",read_name="'+admin_id+'" WHERE name = "'+name+'" AND phone = "'+phone+'" AND type = "basic"',function(err,rows){
            if(err){
                LOG(err);
                return;
            }
            cb();
        });
    });
}
this.checkToZero = function(name,phone){
    CON('UPDATE vip_basic SET check_company = 0,check_job = 0,checked = 0 WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,result){
        if(err){
            LOG(err);
            return;
        }
    });
}
this.getScore = function(cb){
    CON('SELECT * FROM item_score',function(err,rows){
        if(err){
            LOG(err);
            return;
        }
        cb(rows);
    });
}
this.getStar = function(company,cb){
    CON('SELECT star FROM customers WHERE company = "'+company+'"',function(err,rows){
        if(err){
            LOG(err);
            return;
        }
        cb(rows);
    });
}
this.UpdateScore = function(score1,score2,name,phone,cb){
    CON('SELECT * FROM vip_score WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,rows){
        if(err){
            LOG(err);
            return;
        }
        var certificate = rows[0].certificate;
        var activity = rows[0].activity;
        var total = score1+score2+certificate+activity;
        CON('UPDATE vip_score SET basic='+score1+',business='+score2+',total='+total+' WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,rows){
            if(err){
                LOG(err);
                return;
            }
            cb();
        });
    });
}
this.sort = function(key,page,num,cb){
    var start_page = (page-2)*num;
    if(key=='all'){
        var str = 'select * from vip_basic ORDER BY submit_time DESC limit '+start_page+','+num;
    }else if(key=='checked'){
        var str = 'select * from vip_basic WHERE checked = 0 ORDER BY submit_time DESC limit '+start_page+','+num;
    }else if(key=='score'){
        var str = 'select * from vip_score ORDER BY total DESC limit '+start_page+','+num;
    }
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.temp = function(cb){
    CON('SELECT distinct model FROM vip_message',function(err,rows){
        if(err){
            LOG(err);
            return;
        }
        cb(rows);
    });
}
this.getMemberScore = function(name,phone,cb){
    CON('SELECT total FROM vip_score WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,rows){
        if(err){
            LOG(err);
            return;
        }
        cb(rows);
    });
}
this.searchUsers = function(company,cb){
    CON('SELECT * FROM users WHERE company = "'+company+'"',function(err,rows){
        if(err){
            LOG(err);
            return;
        }
        cb(rows);
    });
}
this.checkCompanyRight = function(company,cb){
    CON('SELECT * FROM customers WHERE company = "'+company+'" AND isdel = 0',function(err,rows){
        if(err){
            LOG(err);
            return;
        }
        if(rows[0]==null){
            CON('SELECT * FROM users WHERE company = "'+company+'" AND isdel = 0',function(err,rows){
                if(err){
                    LOG(err);
                }
                cb(rows);
            });
        }else{
            cb(rows);
        }
    });
}