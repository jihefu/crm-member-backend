var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');
var basicAuth = require("basic-auth");
var async = require('async');

function test(cb){
    var sqls = {
        'update':'UPDATE customers SET reg_compsany = "asqwewww" WHERE company = "test"',
        'select':'SELECT reg_company FROM customers WHERE company = "test"'
    };
    SERIES(sqls);
    async.series(G,function(err,result){
        cb(result);
    });
}



this.auth = function(id,cb){
    console.log(id);
    CON('SELECT pwd,user_id FROM employee WHERE on_job = 1 AND (English_name = "'+id+'" OR English_abb = "'+id+'" OR user_name = "'+id+'" OR user_id = "'+id+'")',function(err,rows){
        if(err){
            LOG('err:'+err);
            var o = {'msg':'err'};
            cb(o);
            return;
        }
        console.log(rows);
        if(rows[0]==null){
            var o = {'msg':'err'};
            cb(o);
        }else{
            cb(rows);
        }
    });
}
this.authOpenId = function(openId,cb){
    CON('SELECT user_id FROM employee WHERE open_id = "'+openId+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            var o = {'msg':'err'};
            cb(o);
            return;
        }
        cb(rows);
    });
}

this.info = function(opt,cb){
    CON('SELECT * FROM customers WHERE company = "'+opt+'" AND isdel = 0',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.cpy = function(cb){
    CON('SELECT company,level,abb FROM customers WHERE isdel = 0 ORDER BY id',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.filter1 = function(opt1,opt2,cb){
	CON('SELECT company FROM customers WHERE province = "'+opt1+'" AND town = "'+opt2+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.filter2 = function(opt,cb){
	CON('SELECT company FROM customers WHERE province = "'+opt+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.filter3 = function(opt,cb){
	CON('SELECT company FROM customers WHERE town = "'+opt+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.search = function(keyword,cb){
	if(keyword=='all'){
		CON('SELECT company,level FROM customers WHERE isdel = 0',function(err,rows){
	        if(err){
	            LOG('err:'+err);
	            return;
	        }
	        cb(rows);
	    });
	}else{
		var len = keyword.length;
		var str = '%';
		for(var i=0;i<len;i++){
			str += keyword.charAt(i)+'%';
		}
		CON('SELECT company,level FROM customers WHERE isdel = 0 AND (company LIKE "'+str+'" OR reg_person = "'+keyword+'" OR legal_person = "'+keyword+'" OR abb LIKE "'+str+'")',function(err,rows){
	        if(err){
	            LOG('err:'+err);
	            return;
	        }
	        cb(rows);
	    });
	}
}
this.mySort = function(key,cb){
	if(key=='level'){
		var str = 'SELECT company,level FROM customers WHERE isdel = 0 ORDER BY '+key;
	}else if(key=='all'){
		var str = 'SELECT company,level FROM customers WHERE isdel = 0';
	}else if(key=='update_time'){
        var str = 'SELECT company,level,update_time FROM customers WHERE isdel = 0';
    }else{
		var str = 'SELECT company,level,total_sale,last_sale FROM customers WHERE isdel = 0 ORDER BY LENGTH('+key+'),'+key;
	}
	CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.transPerson = function(val,cb){
    var str = 'SELECT user_name FROM employee WHERE user_id = "'+val+'" OR user_name = "'+val+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('erra:'+err);
            return;
        }
        cb(rows);
    });
}
this.checkAbb = function(abb,cb){
    let user_promise = new Promise(function(resolve,reject){
        let m_str = 'SELECT user_id FROM users WHERE abb = "'+abb+'" AND isdel = 0';
        CON(m_str,function(err,rows){
            if(err){
                reject(err);
            }
            resolve(rows);
        });
    });
    let cus_promise = new Promise(function(resolve,reject){
        let m_str = 'SELECT user_id FROM customers WHERE abb = "'+abb+'" AND isdel = 0';
        CON(m_str,function(err,rows){
            if(err){
                reject(err);
            }
            resolve(rows);
        });
    });
    Promise.all([user_promise,cus_promise]).then(function(result){
        cb(result);
    }).catch(function(err){
        LOG(err);
    });
    // var str = 'SELECT abb FROM customers';
    // CON(str,function(err,rows){
    //     if(err){
    //         LOG('err:'+err);
    //         return;
    //     }
    //     cb(rows);
    // });
}
this.checkCnAbb = function(cn_abb,cb){
    let user_promise = new Promise(function(resolve,reject){
        let m_str = 'SELECT user_id FROM users WHERE cn_abb = "'+cn_abb+'" AND isdel = 0';
        CON(m_str,function(err,rows){
            if(err){
                reject(err);
            }
            resolve(rows);
        });
    });
    let cus_promise = new Promise(function(resolve,reject){
        let m_str = 'SELECT user_id FROM customers WHERE cn_abb = "'+cn_abb+'" AND isdel = 0';
        CON(m_str,function(err,rows){
            if(err){
                reject(err);
            }
            resolve(rows);
        });
    });
    Promise.all([user_promise,cus_promise]).then(function(result){
        cb(result);
    }).catch(function(err){
        LOG(err);
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
this.updateInfo = function(cpy,str,user_id,update_person,cb){
	var _str = str.split('\,')[0];
    if(user_id==''||user_id==null||user_id=='null'||user_id==0){
        CON('UPDATE customers SET '+str+' WHERE company = "'+cpy+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            var time = TIME();
            CON('UPDATE customers SET update_person = '+update_person+',update_time = "'+time+'" WHERE company = "'+cpy+'"',function(err,rows){
                if(err){
                    LOG('err:'+err);
                    return;
                }
                infoScore(cpy,function(){
                    CON('SELECT * FROM customers WHERE '+_str,function(err,rows){
                        if(err){
                            LOG('err:'+err);
                            return;
                        }
                        cb(rows);
                    });
                });
            });
        });
    }else{
        CON('SELECT company,user_id FROM customers',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            var aa = 0;
            rows.forEach(function(items){
                if(items.user_id==user_id&&items.company!=cpy){
                    var res = {'status':'error','msg':'客户号已存在'};
                    aa = 1;
                    cb(res);
                }
            });
            if(aa==1) return;
            CON('UPDATE customers SET '+str+' WHERE company = "'+cpy+'"',function(err,rows){
                if(err){
                    LOG('err:'+err);
                    return;
                }
                var time = TIME();
                CON('UPDATE customers SET update_person = '+update_person+',update_time = "'+time+'" WHERE company = "'+cpy+'"',function(err,rows){
                    if(err){
                        LOG('err:'+err);
                        return;
                    }
                    infoScore(cpy,function(){
                        CON('SELECT * FROM customers WHERE '+_str,function(err,rows){
                            if(err){
                                LOG('err:'+err);
                                return;
                            }
                            cb(rows);
                        });
                    });
                });
            });
        });
    }
} 
this.delCpy = function(cpy,update_person,time,cb){
    var str = 'UPDATE customers SET isdel = 1,update_person = "'+update_person+'",update_time = "'+time+'" WHERE company = "'+cpy+'"';
    CON(str,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        cb(JSON.stringify({'status':'succeed'}));
    });
}
this.checkName = function(cpy,abb,cb){
    let user_promise = new Promise(function(resolve,reject){
        let m_str = 'SELECT user_id FROM users WHERE company = "'+cpy+'" OR abb = "'+abb+'"';
        CON(m_str,function(err,rows){
            if(err){
                reject(err);
            }
            resolve(rows);
        });
    });
    let cus_promise = new Promise(function(resolve,reject){
        let m_str = 'SELECT user_id FROM customers WHERE company = "'+cpy+'" OR abb = "'+abb+'"';
        CON(m_str,function(err,rows){
            if(err){
                reject(err);
            }
            resolve(rows);
        });
    });
    Promise.all([user_promise,cus_promise]).then(function(result){
        cb(result);
    }).catch(function(err){
        LOG(err);
    });
    // CON('SELECT company,abb FROM customers',function(err,rows){
    //     if(err){
    //         LOG('err:'+err);
    //         return;
    //     }
    //     cb(rows);
    // });
}
this.createCpy = function(cpy,abb,update_person,cb){
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
        CON('INSERT INTO customers (company,abb,user_id) VALUES ("'+cpy+'","'+abb+'",'+user_id+')',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            CON('UPDATE customers SET update_person = '+update_person+' WHERE company = "'+cpy+'"',function(err,rows){
                if(err){
                    LOG('err:'+err);
                    return;
                }
                infoScore(cpy,function(){
                    CON('SELECT company,level FROM customers',function(err,rows){
                        if(err){
                            LOG('err:'+err);
                            return;
                        }
                        cb(rows);
                    });
                });
            });
        });
    });
}
this.putImg = function(cpy,newPath,cb){
	CON('SELECT album FROM customers WHERE company = "'+cpy+'"',function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
		if(rows[0].album==''){
			CON('UPDATE customers SET album = "'+newPath+'" WHERE company = "'+cpy+'"',function(err,rows){
				if(err){
		            LOG('err:'+err);
		            return;
		        }
                infoScore(cpy,function(){
                    CON('SELECT album FROM customers WHERE company = "'+cpy+'"',function(err,rows){
                        cb(rows);
                    })
                });
			})
		}else{
			CON('SELECT album FROM customers WHERE company = "'+cpy+'"',function(err,rows){
				if(err){
		            LOG('err:'+err);
		            return;
		        }
				var oldStr = rows[0].album;
				var newStr = oldStr + ',' + newPath;
				CON('UPDATE customers SET album = "'+newStr+'" WHERE company = "'+cpy+'"',function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
					CON('SELECT album FROM customers WHERE company = "'+cpy+'"',function(err,rows){
						cb(rows);
					})
				})
			})
		}
	});
}
this.getImg = function(cpy,cb){
	CON('SELECT album FROM customers WHERE company = "'+cpy+'"',function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.delImg = function(st,cpy,arr,cb){
	CON('UPDATE customers SET album = "'+st+'" WHERE company = "'+cpy+'"',function(err,rows){
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
        infoScore(cpy,function(){
            CON('SELECT album FROM customers WHERE company = "'+cpy+'"',function(err,rows){
                if(err){
                    LOG('err:'+err);
                    return;
                }
                cb(rows);
            });
        })
	})
}
this.coverImg = function(st,cpy,cb){
    CON('UPDATE customers SET album = "'+st+'" WHERE company = "'+cpy+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        CON('SELECT album FROM customers WHERE company = "'+cpy+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb(rows);
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
function fsRemove(arr){
    arr.forEach(function(items){
        fs.unlink(DIRNAME+'/public/img/'+items);
    });
}


/*SQL FUNCTION*/
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

function ccc(table){
    CON('SELECT abb,id FROM '+table,function(err,rows){
        if(err){
            console.log('err:'+err);
            return;
        }
        var len = rows.length;
        var count = 0;
        var first_abb = rows[count].abb;
        var first_id = rows[count].id;
        var search = function(first_abb,first_id){
            var arr = [];
            var _count = 2;
            if(count<len){
                async.waterfall([
                    function(callback){
                        CON('SELECT abb,id FROM '+table,function(err,rows){
                            if(err){
                                console.log('err:'+err);
                                return;
                            }
                            rows.forEach(function(items,index){
                                if((first_abb==items.abb)&&(count!=index)){
                                    var o = {};
                                    o.id = rows[index].id;
                                    o.abb = rows[index].abb+_count;
                                    arr.push(o);
                                    _count++;
                                }
                            });
                            callback(null,arr);
                        });
                    },
                    function(o,callback){
                        var l = o.length,s = 0;
                        var c = function(){
                            if(s<l){
                                CON('UPDATE '+table+' SET abb = "'+o[s].abb+'" WHERE id = '+o[s].id,function(err,rows){
                                    if(err){
                                        console.log('err:'+err);
                                        return;
                                    }
                                    s++;
                                    c();
                                });
                            }else{
                                callback(null);
                            }
                        }
                        c();
                    },
                    function(callback){
                        CON('SELECT abb,id FROM '+table,function(err,rows){
                            if(err){
                                console.log('err:'+err);
                                return;
                            }
                            count++;
                            try{
                                callback(rows[count].abb,rows[count].id);
                            }catch(e){
                                callback(rows[count-1].abb,rows[count-1].id);
                            }
                        });
                    }
                ],function(result1,result2){
                    search(result1,result2);
                });
            }
        }
        search(first_abb,first_id);
    });
}

function updateIS(table){
    CON('SELECT abb FROM '+table,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        rows.forEach(function(items){
            updateInfoScore(table,items.abb);
        });
    });
}

function updateInfoScore(table,abb){
    CON('SELECT * FROM '+table+' WHERE abb = "'+abb+'"',function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        var o = rows[0];
        var count = 0;
        var sum = 0;
        for(var i in o){
            if(o[i]==''||o[i]==null||o[i]=='0000-00-00'||o[i]==0||o[i]=='null'){
                count++;
            }
            sum++;
        }
        var info_score = ((1-count/(sum-2)).toFixed(2))*100;
        CON('UPDATE '+table+' SET info_score = '+info_score+' WHERE abb = "'+abb+'"',function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
        });
    });
}