var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');

this.info = function(opt,cb){
    // searchModel('native_adr','employee');
    // updateIS('employee');
    CON('SELECT * FROM employee WHERE user_id = "'+opt+'" AND isdel = 0',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.cpy = function(cb){
    CON('SELECT user_name,user_id,on_job FROM employee WHERE isdel = 0',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        var arr = on_job(rows);
        cb(arr);
    });
}
this.getAllList = function(cb){
    CON('SELECT * FROM employee WHERE isdel = 0',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.search = function(keyword,cb){
    if(keyword=='all'){
        CON('SELECT user_id,user_name,on_job FROM employee WHERE isdel = 0',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            var arr = on_job(rows);
            cb(arr);
        });
    }else{
        var len = keyword.length;
        var str = '%';
        for(var i=0;i<len;i++){
            str += keyword.charAt(i)+'%';
        }
        CON('SELECT user_name,user_id FROM employee WHERE isdel = 0 AND (user_name LIKE "'+str+'" OR user_name = "'+keyword+'" OR user_id = "'+keyword+'")',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb(rows);
        });
    }
}
this.mySort = function(key,cb){
    if(key=='all'){
        var str = 'SELECT user_name,user_id,on_job FROM employee WHERE isdel = 0';
        CON(str,function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            var arr = on_job(rows);
            cb(arr);
        });
        return;
    }else if(key == "user_id"){
        var str = 'SELECT user_name,user_id,on_job FROM employee WHERE isdel = 0 ORDER BY user_id';
    }else if(key == "first_name"){
        var str = 'SELECT user_name,user_id,on_job FROM employee WHERE isdel = 0 ORDER BY English_name';
    }else if(key == "birth"){
        var str = 'SELECT user_name,user_id,on_job,birth FROM employee WHERE isdel = 0 ORDER BY birth';
    }else if(key == "update_time"){
        var str = 'SELECT user_name,user_id,on_job,birth,update_time FROM employee WHERE isdel = 0';
    }
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.createCpy = function(name,id,time,cb){
    CON('INSERT INTO employee (user_name,user_id,insert_time) VALUES ("'+name+'","'+id+'","'+time+'")',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        CON('SELECT user_name,user_id FROM employee',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb(rows);
        });
    });
}
this.delCpy = function(user_id,update_person,time,cb){
    var str = 'UPDATE employee SET isdel = 1,update_person = "'+update_person+'",update_time = "'+time+'" WHERE user_id = "'+user_id+'"';
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
this.updateInfo = function(user_id,str,new_id,update_person,cb){
    var str = 'UPDATE employee SET '+str+' WHERE user_id = "'+user_id+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        var time = TIME();
        CON('UPDATE employee SET update_person = "'+update_person+'",update_time = "'+time+'" WHERE user_id = "'+user_id+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            var _str = 'SELECT * FROM employee WHERE user_id = "'+new_id+'"';
            infoScore(new_id,function(){
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
this.getImg = function(user_id,cb){
    var str = 'SELECT album FROM employee WHERE user_id = "'+user_id+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.putImg = function(user_id,imgPath,cb){
    var str = 'SELECT album FROM employee WHERE user_id = "'+user_id+'"';
    var _str = 'UPDATE employee SET album = "'+imgPath+'" WHERE user_id = "'+user_id+'"';
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
                var st = 'UPDATE employee SET album = "'+newStr+'" WHERE user_id = "'+user_id+'"';
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
}
this.delImg = function(st,user_id,arr,cb){
    var str = 'UPDATE employee SET album = "'+st+'" WHERE user_id = "'+user_id+'"';
    var _str = 'SELECT album FROM employee WHERE user_id = "'+user_id+'"';
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
}
this.coverImg = function(st,user_id,cb){
    var str = 'UPDATE employee SET album = "'+st+'" WHERE user_id = "'+user_id+'"';
    var _str = 'SELECT album FROM employee WHERE user_id = "'+user_id+'"';
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
this.employeeId = function(cb){
    CON('SELECT user_name,user_id FROM employee WHERE isdel = 0 AND on_job = 1',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}

function on_job(rows){
    var arr = [],arr1 = [],arr2 = [];
    rows.forEach(function(items){
        if(items.on_job==1){
            arr1.push(items);
        }else{
            arr2.push(items);
        }
    });
    var _arr = arr.concat(arr1,arr2);
    return _arr;
}

function fsRemove(arr){
    arr.forEach(function(items){
        fs.unlink(DIRNAME+'/public/img/'+items);
    });
}

function infoScore(new_id,callback){
    var str = 'SELECT * FROM employee WHERE user_id = "'+new_id+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        var o = rows[0];
        var count = 0;
        var sum = 0;
        var on_job = 1;
        for(var i in o){
            if(o[i]==''||o[i]==null||o[i]=='0000-00-00'||o[i]==0||o[i]=='null'){
                count++;
            }
            if(i=='on_job'){
                on_job = o[i];
            }
            sum++;
        }
        if(on_job){
            var info_score = (((1-(count-4)/(sum-7)).toFixed(2))*100)>100?100:parseInt(((1-(count-4)/(sum-7)).toFixed(2))*100);
        }else{
            var info_score = (((1-(count-2)/(sum-7)).toFixed(2))*100)>100?100:parseInt(((1-(count-4)/(sum-7)).toFixed(2))*100);
        }
        var _str = 'UPDATE employee SET info_score = '+info_score+' WHERE user_id = "'+new_id+'"';
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
function updateIS(table){
    CON('SELECT user_id FROM '+table,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        rows.forEach(function(items){
            updateInfoScore(table,items.user_id);
        });
    });
}
function updateInfoScore(table,user_id){
    CON('SELECT * FROM '+table+' WHERE user_id = "'+user_id+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        var o = rows[0];
        var count = 0;
        var sum = 0;
        var on_job = 1;
        for(var i in o){
            if(o[i]==''||o[i]==null||o[i]=='0000-00-00'||o[i]==0||o[i]=='null'){
                count++;
            }
            if(i=='on_job'){
                on_job = o[i];
            }
            sum++;
        }
        if(on_job){
            var info_score = (((1-(count-4)/(sum-7)).toFixed(2))*100)>100?100:parseInt(((1-(count-4)/(sum-7)).toFixed(2))*100);
        }else{
            var info_score = (((1-(count-2)/(sum-7)).toFixed(2))*100)>100?100:parseInt(((1-(count-2)/(sum-7)).toFixed(2))*100);
        }
        CON('UPDATE '+table+' SET info_score = '+info_score+' WHERE user_id = "'+user_id+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
        });
    });
}


function insertPwd(){
    var str = "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (101, '53cc7f2d4a2013a58add9f99894985fc', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (102, '55f8421c1259761b0c90c43a6a5a009a', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (103, 'c4ca4238a0b923820dcc509a6f75849b', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (401, 'e10adc3949ba59abbe56e057f20f883e', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (402, '45f00de2bd080ee7c7be676e28534f75', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (601, 'f5f52fb1242e16a136716d4e93a27087', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (602, 'a927ac70561855ba3053d71b5a31a869', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (701, '33f839a8addb6d67ee27fee88a37e34a', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (902, '36e217f29db37ff3dcba77f60aa34331', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1003, 'a8366cd13864391f8364a1319bbc2b65', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1006, '57ba172a6be125cca2f449826f9980ca', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1101, '0dbfa4e47b7d60ccbf8127cea8334008', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1103, '4b3cea01360d02e85cf9116f39f95d42', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1104, '3e2b9526e148652b5cbefdcc8f06b82b', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1106, '299cf17acc4af27fdc9da05b4ff7fbe2', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1206, 'e10adc3949ba59abbe56e057f20f883e', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1301, '04967429d374a3f545eccb44c5aef98f', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1302, '0dbfa4e47b7d60ccbf8127cea8334008', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1305, '0dbfa4e47b7d60ccbf8127cea8334008', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1306, '774dd32e5389fb893319041e9bfa4c3a', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1401, '0c7bbe57745af91c75ebe57369239b08', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1402, '0c57cfb36f30483a1a410e30bb19e162', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1403, '4a64064a033b1bee8c19668cd48c71a5', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1404, '48258f21b76daa0bc6d09f71f5b76330', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1405, 'e10adc3949ba59abbe56e057f20f883e', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1406, 'e10adc3949ba59abbe56e057f20f883e', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1407, '3c59dc048e8850243be8079a5c74d079', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1408, 'ba64315edeb11978ab2ef3479092e820', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1409, '2467913556fbc1eee042b8a4047c27ca', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1410, '202cb962ac59075b964b07152d234b70', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1411, '06356b9dde912a22362112cc20b88782', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1412, '56fb51f2001c4c572104f4df6c8e147d', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1413, '887f7cb1d529424474f99727a9f33fbc', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1414, 'c9dc3d3048734f5997f7ba6eb59d6779', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1415, 'b61a3e1cc496ef439201e4e76c5db06a', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1416, '57185946a0276bdd3876c601944f7dd9', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1417, '10a886a4d6948ca1f7689c46695c3812', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1418, 'a06b4c20d5697344d1dbba48a8fdbdf6', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1419, '4968437122a1daf1136df76845b72171', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1503, 'b61a3e1cc496ef439201e4e76c5db06a', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1504, '10a886a4d6948ca1f7689c46695c3812', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1507, 'b07aea7749484d21be3cfa8aa5f1710a', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1602, '23ae5849968c99e26fac2fa3820be35a', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1603, '23ae5849968c99e26fac2fa3820be35a', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1604, 'f1887d3f9e6ee7a32fe5e76f4ab80d63', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1605, 'cafdb4ef1b66a99d14e3bbf037f34913', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1701, 'dea1caeb097301a5e809bff721bd29a5', 0);"+
    "INSERT INTO `user` (`user_id`, `password`, `login_lock`) VALUES (1702, '1da62a8a186d1634b4460310112e831c', 0)"

    var _arr = str.split(';');
    var arr = [],arr_id = [];
    var arr2 = [],arr3 = [];
    _arr.forEach(function(items){
        var a = items.split(', \'')[1];
        arr.push(a);
        var b = items.split('VALUES (')[1];
        arr_id.push(b);
    });
    arr.forEach(function(items){
        var a = items.split('\', 0')[0];
        arr2.push(a);
    });
    arr_id.forEach(function(items){
        var a = items.split(', \'')[0];
        arr3.push(a);
    });
    // console.log(arr2);
    // console.log(arr3);
    arr2.forEach(function(items,index){
        CON('UPDATE employee SET pwd = "'+items+'" WHERE user_id = '+arr3[index],function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            console.log(rows);
        });
    });

}