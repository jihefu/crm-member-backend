var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');


this.info = function(abb,cb){
    // searchModel('job','contacts');
    var str = 'SELECT * FROM contacts WHERE abb = "'+abb+'" AND isdel = 0';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.cpy = function(cb){
    CON('SELECT name,abb FROM contacts WHERE isdel = 0 ORDER BY id',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.search = function(keyword,cb){
    if(keyword=='all'){
        CON('SELECT name,abb FROM contacts WHERE isdel = 0',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb(rows);
        });
    }else{
        var len = keyword.length;
        var str = '%';
        var str2 = keyword+'%';
        for(var i=0;i<len;i++){
            str += keyword.charAt(i)+'%';
        }
        CON('SELECT abb,name FROM contacts WHERE isdel = 0 AND (company LIKE "'+str+'" OR name LIKE "'+str+'" OR abb LIKE "'+str2+'" OR phone1 = "'+keyword+'" OR phone2 = "'+keyword+'")',function(err,rows){
        // CON('SELECT abb,name,verified FROM contacts WHERE isdel = 0 AND (company LIKE "'+str+'" OR name LIKE "'+str+'" OR abb LIKE "'+str2+'")',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb(rows);
        });
    }
}
this.checkName = function(cpy,abb,cb){
    CON('SELECT name,abb FROM contacts',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.mySort = function(key,cb){
    if(key=='all'){
        var str = 'SELECT name,abb FROM contacts WHERE isdel = 0';
    }else if(key=='verified'){
        var str = 'SELECT name,abb FROM contacts WHERE isdel = 0';
    }else if(key=='update_time'){
        var str = 'SELECT name,abb,update_time FROM contacts WHERE isdel = 0';
    }
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}

this.createCpy = function(name,abb,update_person,time,cb){
    CON('INSERT INTO contacts (name,abb,insert_time) VALUES ("'+name+'","'+abb+'","'+time+'")',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        CON('UPDATE contacts SET update_person = "'+update_person+'" WHERE abb = "'+abb+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            CON('SELECT name,abb FROM contacts',function(err,rows){
                if(err){
                    LOG('err:'+err);
                    return;
                }
                cb(rows);
            });
        });
    });
}
this.delCpy = function(abb,update_person,time,cb){
    var str = 'UPDATE contacts SET isdel = 1,update_person = "'+update_person+'",update_time = "'+time+'" WHERE abb = "'+abb+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(JSON.stringify({'status':'succeed'}));
    });
}
this.searchUpdataPerson = function(bs_name,cb){
    CON('SELECT user_id FROM employee WHERE English_abb = "'+bs_name+'" OR English_name = "'+bs_name+'" OR user_name = "'+bs_name+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        if(rows[0]==null){
            var arr = [{'user_id':bs_name}];
            cb(arr);     
        }else{
            cb(rows);     
        }
    });
}
this.updateInfo = function(abb,str,new_abb,update_person,cb){
    var str = 'UPDATE contacts SET '+str+' WHERE abb = "'+abb+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        var time = TIME();
        CON('UPDATE contacts SET update_person = "'+update_person+'",update_time = "'+time+'" WHERE abb = "'+abb+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            var _str = 'SELECT * FROM contacts WHERE abb = "'+new_abb+'"';
            infoScore(new_abb,function(){
                CON(_str,function(err,rows){
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
this.getImg = function(abb,cb){
    var str = 'SELECT album FROM contacts WHERE abb = "'+abb+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.putImg = function(abb,imgPath,cb){
    var str = 'SELECT album FROM contacts WHERE abb = "'+abb+'"';
    var _str = 'UPDATE contacts SET album = "'+imgPath+'" WHERE abb = "'+abb+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        if(rows[0].album==''){
            CON(_str,function(err,rows){
                if(err){
                    LOG('err:'+err);
                    return;
                }
                CON(str,function(err,rows){
                    cb(rows);
                });
            })
        }else{
            CON(str,function(err,rows){
                if(err){
                    LOG('err:'+err);
                    return;
                }
                var oldStr = rows[0].album;
                var newStr = oldStr + ',' + imgPath;
                var st = 'UPDATE contacts SET album = "'+newStr+'" WHERE abb = "'+abb+'"';
                CON(st,function(err,rows){
                    if(err){
                        LOG('err:'+err);
                        return;
                    }
                    CON(str,function(err,rows){
                        cb(rows);
                    })
                })
            })
        }
    });
    infoScore(abb,function(){});
}
this.delImg = function(st,abb,arr,cb){
    var str = 'UPDATE contacts SET album = "'+st+'" WHERE abb = "'+abb+'"';
    var _str = 'SELECT album FROM contacts WHERE abb = "'+abb+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        //coding
        try{
            fsRemove(arr);
        }catch(e){
            LOG(e);
        }
        CON(_str,function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb(rows);
        });
    });
    infoScore(abb,function(){});
}
this.coverImg = function(st,abb,cb){
    var str = 'UPDATE contacts SET album = "'+st+'" WHERE abb = "'+abb+'"';
    var _str = 'SELECT album FROM contacts WHERE abb = "'+abb+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        CON(_str,function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb(rows);
        });
    });
}

function fsRemove(arr){
    arr.forEach(function(items){
        fs.unlink(DIRNAME+'/public/img/'+items);
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


function searchModel(k,t){
    CON('SELECT '+k+' FROM '+t,function(err,rows){
        if(err){
            console.log('err:'+err);
            return;
        }
        console.log(rows.length);
        var arr = [{"key":null,"len":0}];
        for(var i=0;i<rows.length;i++){
            var model = rows[i][k];
            for(var j in arr){
                if(arr[j].key==model){
                    arr[j].len++;
                    break;
                }else{
                    if(j==arr.length-1){
                        var o = {
                            'key':model,
                            'len':1
                        };
                        arr.push(o);
                    }
                }
            }
        }
        console.log(arr);
    });
}