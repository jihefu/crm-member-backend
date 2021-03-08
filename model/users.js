var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');
var async = require('async');

this.getList = function(page,num,cb){
	var start_page = (page-1)*num;
	var m_str = 'SELECT user_id,company,level,manager,album FROM users WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getInfo = function(user_id,cb){
	var m_str = 'SELECT * FROM users WHERE user_id = '+user_id;
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
	CON('select user_id,company,level,manager,album from users WHERE (abb = "'+sn+'" OR cn_abb = "'+sn+'" OR legal_person = "'+sn+'" OR company LIKE "'+str+'") AND isdel = 0',function(err,rows){
		if(err){
	        LOG('err:'+err);
	        return;
	    }
	    cb(rows);
	});
}
this.sort = function(key,page,num,cb){
	var start_page = (page-1)*num;
	if(key=='all'){
		var m_str = 'SELECT user_id,company,level,manager,album FROM users WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
	}else if(key=='update_time'){
		var m_str ='SELECT user_id,company,level,manager,album FROM users WHERE isdel = 0 ORDER BY update_time DESC LIMIT '+start_page+','+num;
	}else if(key=='total_sale'){
		var m_str ='SELECT user_id,company,level,manager,album FROM users WHERE isdel = 0 ORDER BY total_sale DESC LIMIT '+start_page+','+num;
	}else if(key=='level'){
		var m_str ='SELECT user_id,company,level,manager,album FROM users WHERE isdel = 0 ORDER BY level LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
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
}
this.checkCnAbb = function(abb,cb){
	let user_promise = new Promise(function(resolve,reject){
		let m_str = 'SELECT user_id FROM users WHERE cn_abb = "'+abb+'" AND isdel = 0';
		CON(m_str,function(err,rows){
			if(err){
				reject(err);
			}
			resolve(rows);
		});
	});
	let cus_promise = new Promise(function(resolve,reject){
		let m_str = 'SELECT user_id FROM customers WHERE cn_abb = "'+abb+'" AND isdel = 0';
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
this.createUser = function(abb,cpy,update_person,time,cb){
	CON('SELECT user_id FROM users ORDER BY id DESC LIMIT 1',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var user_id = rows[0].user_id+1;
		var m_str = 'INSERT INTO users (user_id,company,abb,update_time,update_person) VALUES ("'+user_id+'","'+cpy+'","'+abb+'","'+time+'","'+update_person+'")';
		CON(m_str,function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			cb(user_id);
		});
	});
}
this.del = function(user_id,update_person,time,cb){
	var m_str = 'UPDATE users SET isdel=1,update_person="'+update_person+'",update_time="'+time+'" WHERE user_id = '+user_id;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.update = function(user_id,str,update_person,time,cb){
	var m_str = 'UPDATE users SET '+str+',update_person="'+update_person+'",update_time="'+time+'" WHERE user_id = '+user_id;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.getImg = function(user_id,cb){
	var m_str = 'SELECT album FROM users WHERE user_id = '+user_id;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.putImg = function(cpy,newPath,cb){
	CON('SELECT album FROM users WHERE user_id = '+cpy,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
		if(rows[0].album==''){
			CON('UPDATE users SET album = "'+newPath+'" WHERE user_id = '+cpy,function(err,rows){
				if(err){
		            LOG('err:'+err);
		            return;
		        }
		        CON('SELECT album FROM users WHERE user_id = '+cpy,function(err,rows){
					cb(rows);
				})
			})
		}else{
			CON('SELECT album FROM users WHERE user_id = '+cpy,function(err,rows){
				if(err){
		            LOG('err:'+err);
		            return;
		        }
				var oldStr = rows[0].album;
				var newStr = oldStr + ',' + newPath;
				CON('UPDATE users SET album = "'+newStr+'" WHERE user_id = '+cpy,function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
					CON('SELECT album FROM users WHERE user_id = '+cpy,function(err,rows){
						cb(rows);
					})
				})
			})
		}
	});
}
this.coverImg = function(st,cpy,cb){
    CON('UPDATE users SET album = "'+st+'" WHERE user_id = '+cpy,function(err,rows){
        if(err){
            LOG('err:'+err);
            return;
        }
        CON('SELECT album FROM users WHERE user_id = '+cpy,function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb(rows);
        });
    });
}
this.delImg = function(st,cpy,arr,cb){
	CON('UPDATE users SET album = "'+st+'" WHERE user_id = '+cpy,function(err,rows){
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
        CON('SELECT album FROM users WHERE user_id = '+cpy,function(err,rows){
            if(err){
                LOG('err:'+err);
                return;
            }
            cb(rows);
        });
	})
}
function fsRemove(arr){
    arr.forEach(function(items){
        fs.unlink(DIRNAME+'/public/img/'+items);
    });
}