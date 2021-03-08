var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');
var async = require('async');
var nodemailer=require("nodemailer");

this.info = function(sn,cb){
	CON('SELECT serialNo FROM table_card WHERE serialNo = '+sn,function(err,rows){
	// CON('SELECT serialNo FROM table_card WHERE serialNo = 111',function(err,rows){
		if(err){
            LOG('err:'+err);
            cb(RESULT(-1,'failed',err));
            return;
        }
		cb(RESULT(200,'succeed',rows));
	});
}
this.updateInfo = function(sn,str,time,open_id,cb){
	CON('SELECT user_id FROM employee WHERE open_id = "'+open_id+'"',function(err,rows){
		if(err){
            LOG('err:'+err);
            cb(RESULT(-1,'failed',err));
            return;
        }
        var user_id = rows[0].user_id;
        CON('UPDATE table_card SET '+str+' WHERE serialNo = '+sn,function(err,rows){
			if(err){
	            LOG('err:'+err);
	            cb(RESULT(-1,'failed',err));
	            return;
	        }
	        CON('UPDATE table_card SET EMP_NO = '+user_id+',update_person = '+user_id+',update_time = "'+time+'",EMP_NO = '+user_id+' WHERE serialNo = '+sn,function(err,rows){
				if(err){
		            LOG('err:'+err);
		            cb(RESULT(-1,'failed',err));
		            return;
		        }
		        CON('SELECT user_name FROM employee WHERE user_id = '+user_id,function(err,rows){
					if(err){
			            LOG('err:'+err);
			            cb(RESULT(-1,'failed',err));
			            return;
			        }
			        var user_name = rows[0].user_name;
			        CON('SELECT update_time,model,EMP_NO FROM table_card WHERE serialNo = '+sn,function(err,rows){
						if(err){
				            LOG('err:'+err);
				            cb(RESULT(-1,'failed',err));
				            return;
				        }
				        var o = {};
				        o.update_person = user_name;
				        rows.push(o);
				        cb(RESULT(200,'succeed',rows));
				    });
			    });
		    });
		});
	});
}
this.insertInfo = function(sn,str1,str2,time,open_id,cb){
	CON('INSERT INTO table_card ('+str1+') VALUES ('+str2+')',function(err,rows){
		if(err){
            LOG('err:'+err);
            cb(RESULT(-1,'failed',err));
            return;
        }
        CON('SELECT user_id FROM employee WHERE open_id = "'+open_id+'"',function(err,rows){
			if(err){
	            LOG('err:'+err);
	            cb(RESULT(-1,'failed',err));
	            return;
	        }
	        var user_id = rows[0].user_id;
	        CON('UPDATE table_card SET EMP_NO = '+user_id+',update_person = '+user_id+',update_time = "'+time+'",inputDate = "'+time+'",inputPerson = "'+user_id+'" WHERE serialNo = '+sn,function(err,rows){
				if(err){
		            LOG('err:'+err);
		            cb(RESULT(-1,'failed',err));
		            return;
		        }
		        cb(RESULT(200,'succeed',rows));
		    });
	    });
	});
}
this.dealerUpdateInfo = function(sn,str,cb){
	var m_str = 'UPDATE table_card SET '+str+' WHERE serialNo = '+sn;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.getInfo = function(sn,cb){
	// SEARCH('tester','table_card');
	CON('SELECT * FROM table_card WHERE isdel = 0 AND serialNo = '+sn,function(err,rows){
		if(err){
            LOG('err:'+err);
            cb(RESULT(-1,'failed',err));
            return;
        }
		cb(RESULT(200,'succeed',rows));
	});
}
this.getUserId = function(sn,open_id,cb){
	CON('SELECT user_id FROM employee WHERE open_id = "'+open_id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			CON('SELECT dealer FROM table_card WHERE serialNo = '+sn,function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				if(rows[0]==null){
        			cb(-1);
        		}else{
        			cb(rows[0].dealer);
        		}
			});
		}else{
			cb(rows[0].user_id);
		}
	});
}
this.getRegEvent = function(sn,p,cb){
	if(p==1){
		var m_str = 'SELECT * FROM event WHERE sn = '+sn+' ORDER BY id DESC';
		CON(m_str,function(err,rows){
			if(err){
	            LOG('err:'+err);
	            cb(RESULT(-1,'failed',err));
	            return;
	        }
			cb(RESULT(200,'succeed',rows));
		});
	}else{
		if(p.length>1){
			var m_str = 'SELECT * FROM event WHERE sn = '+sn+' ORDER BY id DESC';
			CON(m_str,function(err,rows){
				if(err){
		            LOG('err:'+err);
		            cb(RESULT(-1,'failed',err));
		            return;
		        }
				cb(RESULT(200,'succeed',rows));
			});
		}else{
			CON('SELECT company FROM customers WHERE user_id = "'+p+'"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				var m_str = 'SELECT * FROM event WHERE sn = '+sn+' AND company = "'+rows[0].company+'" ORDER BY id DESC';
				CON(m_str,function(err,rows){
					if(err){
			            LOG('err:'+err);
			            cb(RESULT(-1,'failed',err));
			            return;
			        }
					cb(RESULT(200,'succeed',rows));
				});
			});
		}
	}
}
this.updateRegNo = function(sn,regCode,authOperKey,time){
	var str = 'UPDATE table_card SET latestRegNo = '+regCode+',regAuth = '+authOperKey+',validTime = "'+time+'" WHERE serialNo = "'+sn+'"';
	CON(str,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
    });
}
this.updateAppRegNo = function(sn,appRegCode,authOperKey,time,appName){
	var str = 'UPDATE table_card SET appRegCode = '+appRegCode+',regAuth = '+authOperKey+',validTime = "'+time+'",regAppName = "'+appName+'" WHERE serialNo = "'+sn+'"';
	CON(str,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
    });
}
this.putAppRegEvent = function(data,cb){
	var sn = data.sn;
	var open_id = data.open_id;
	CON('SELECT user_name FROM employee WHERE open_id = "'+open_id+'"',function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        if(rows[0]!=null){
        	var user_name = rows[0].user_name;
	        data.user_name = user_name;
	        data.company = '杭州朗杰测控技术开发有限公司';
	        var str = '';
	        for(var i in data){
	        	if(i!='open_id'){
	        		str += trans(i,data)+',';
	        	}
	        }
	        var str2 = str.slice(0,str.length-1);
	   		var str1 = 'sn,validDate,regDate,regCode,product,authOperKey,name,company';
	        CON('INSERT INTO event ('+str1+') VALUES ('+str2+')',function(err,rows){
				if(err){
		            LOG('err:'+err);
		        }
		        cb();
		    });
        }else{
        	CON('SELECT name,company FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
        		if(err){
		            LOG('err:'+err);
		            return;
		        }
		        if(rows[0]!=null){
		        	var name = rows[0].name;
		        	var company = rows[0].company;
			        data.name=name;
			        data.company=company;
			        var str = '';
			        for(var i in data){
			        	if(i!='open_id'){
			        		str += trans(i,data)+',';
			        	}
			        }
			        var str2 = str.slice(0,str.length-1);
			        var str1 = 'sn,validDate,regDate,regCode,product,authOperKey,name,company';
			        CON('INSERT INTO event ('+str1+') VALUES ('+str2+')',function(err,rows){
						if(err){
				            LOG('err:'+err);
				        }
				        cb();
				    });
			    }
		    });
        }
    });
}
this.putRegEvent = function(data,cb){
	var obj = data;
	var sn = data.sn;
	var open_id = data.open_id;
	CON('SELECT model FROM table_card WHERE serialNo = '+sn,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        var model = rows[0].model;
        data.model=model;
    	CON('SELECT user_name FROM employee WHERE open_id = "'+open_id+'"',function(err,rows){
    		if(err){
	            LOG('err:'+err);
	            return;
	        }
	        if(rows[0]!=null){
	        	var user_name = rows[0].user_name;
		        data.user_name = user_name;
		        data.company = '杭州朗杰测控技术开发有限公司';
		        var str = '';
		        for(var i in data){
		        	if(i!='open_id'){
		        		str += trans(i,data)+',';
		        	}
		        }
		        var str2 = str.slice(0,str.length-1);
		        var str1 = 'sn,validDate,regDate,regCode,authOperKey,mid,product,name,company';
		        CON('INSERT INTO event ('+str1+') VALUES ('+str2+')',function(err,rows){
					if(err){
			            LOG('err:'+err);
			        }
			        cb();
			    });
	        }else{
	        	CON('SELECT name,company FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
	        		if(err){
			            LOG('err:'+err);
			            return;
			        }
			        if(rows[0]!=null){
			        	var name = rows[0].name;
			        	var company = rows[0].company;
				        data.name=name;
				        data.company=company;
				        var str = '';
				        for(var i in data){
				        	if(i!='open_id'){
				        		str += trans(i,data)+',';
				        	}
				        }
				        var str2 = str.slice(0,str.length-1);
				        var str1 = 'sn,validDate,regDate,regCode,authOperKey,mid,product,name,company';
				        CON('INSERT INTO event ('+str1+') VALUES ('+str2+')',function(err,rows){
							if(err){
					            LOG('err:'+err);
					        }
					        cb();
					    });
			        }
	        	});
	        }
    	});
	});
}
this.getLegalInfo = function(company,cb){
	CON('SELECT * FROM vip_basic WHERE company = "'+company+'" AND job = "法人" AND check_company = 1 AND check_job = 1',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.visitorList = function(page,cb){
	var num = 100;
	var start_page = (page-1)*num;
	CON('select serialNo,model,validTime from table_card WHERE isdel = 0 ORDER BY id DESC limit '+start_page+','+num,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.proList = function(page,cb){
    var num = 10;
	var start_page = (page-1)*num;
	CON('select serialNo,model,validTime from table_card WHERE isdel = 0 ORDER BY id DESC limit '+start_page+','+num,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.custList = function(dealer,page,cb){
	var _str = '';
	dealer.forEach(function(items,index){
		_str += ' dealer = "'+items+'" OR';
	});
	_str = _str.slice(0,_str.length-2);
	var num = 10;
	var start_page = (page-1)*num;
	CON('select serialNo,model,validTime from table_card WHERE isdel = 0 AND ('+_str+') ORDER BY id DESC limit '+start_page+','+num,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
    });
}
this.endUserList = function(open_id,page,cb){
	var num = 10;
	var start_page = (page-1)*num;
	CON('SELECT company FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('SELECT user_id FROM users WHERE company = "'+rows[0].company+'"',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			CON('select serialNo,model,validTime from table_card WHERE isdel = 0 AND endUser = "'+rows[0].user_id+'" ORDER BY id DESC limit '+start_page+','+num,function(err,rows){
				if(err){
		            LOG('err:'+err);
		            return;
		        }
		        cb(rows);
		    });
		});
	});
}
this.add = function(sn,cb){
	CON('select serialNo from table_card WHERE serialNo = '+sn,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        if(rows[0]==null){
        	cb('200');
        }else{
        	cb('-1');
        }
    });
}
this.addSn = function(sn,cb){
	CON('select * from table_card WHERE serialNo = '+sn,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        if(rows[0]==null){
        	CON('select * from table_card LIMIT 0,1',function(err,rows){
				if(err){
		            LOG('err:'+err);
		            return;
		        }
		        var obj = {};
	        	obj.status = '-1';
	        	rows.push(obj);
	        	cb(rows);
		    });
        }else{
        	var obj = {};
        	obj.status = '200';
        	rows.push(obj);
        	cb(rows);
        }
    });
}
this.insertNewInfo = function(sn,str1,str2,str_end,open_id,cb){
	CON('select serialNo from table_card WHERE serialNo = '+sn,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        if(rows[0]==null){
        	CON('INSERT INTO table_card (serialNo,'+str1+') VALUES ('+sn+','+str2+')',function(err,rows){
				if(err){
		            LOG('err:'+err);
		            cb('failed');
		            return;
		        }
		        CON('select user_id from employee WHERE open_id = "'+open_id+'"',function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
			        var user_id = rows[0].user_id;
			        var str = 'update_person = "'+user_id+'",update_time = "'+TIME()+'",inputDate = "'+TIME()+'",inputPerson = "'+user_id+'",EMP_NO = '+user_id;
			        CON('UPDATE table_card SET '+str+' WHERE serialNo = '+sn,function(err,rows){
						if(err){
				            LOG('err:'+err);
				            return;
				        }
			        	cb('添加成功');
			        });
			    });
		    });
        }else{
        	CON('select user_id from employee WHERE open_id = "'+open_id+'"',function(err,rows){
				if(err){
		            LOG('err:'+err);
		            return;
		        }
		        var user_id = rows[0].user_id;
		        str_end += ',update_person = "'+user_id+'",update_time = "'+TIME()+'",EMP_NO='+user_id;
	        	CON('UPDATE table_card SET '+str_end+' WHERE serialNo = '+sn,function(err,rows){
					if(err){
			            LOG('err1:'+err);
			            return;
			        }
		        	cb('更新成功');
		        });
		    });
        }
    });
}
this.getNewAddInfo = function(sn,open_id,cb){
	CON('select user_name from employee WHERE open_id = "'+open_id+'"',function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        var user_name = rows[0].user_name;
		CON('select * from table_card WHERE serialNo = '+sn,function(err,rows){
			if(err){
	            LOG('err:'+err);
	            return;
	        }
	        var obj = {};
	        obj.user_name = user_name;
	        rows.push(obj);
	        cb(rows);
	    });
	});
}
this.search = function(sn,cb){
	var arr = [];
	var len = sn.length;
	var str = '%';
	for(var i=0;i<len;i++){
		str += sn.charAt(i)+'%';
	}
	CON('select serialNo,machineNo,model,validTime from table_card WHERE (serialNo = '+sn+' OR machineNo = '+sn+' OR serialNo LIKE "'+str+'") AND isdel = 0 ORDER BY id DESC',function(err,rows){
		if(err){
	        LOG('err:'+err);
	        return;
	    }
	    cb(rows);
	});
}
this.searchScr = function(open_id,type,page,sn,cb){
	var num = 10;
	var start_page = (page-1)*num;
	var len = sn.length;
	var str = '%';
	for(var i=0;i<len;i++){
		str += sn.charAt(i)+'%';
	}
	if(type=='employee'){
		var m_str = 'SELECT * FROM table_card WHERE isdel = 0 AND (serialNo = '+sn+' OR machineNo = '+sn+' OR serialNo LIKE "'+str+'") ORDER BY id DESC LIMIT '+start_page+','+num;
		CON(m_str,function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			cb(rows);
		});
	}else if(type=='dealer_member'||type=='endUser_member'||type=='no_member'){
		CON('SELECT * FROM table_card WHERE isdel = 0 AND serialNo = "'+sn+'" ORDER BY id DESC LIMIT '+start_page+','+num,function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			cb(rows);
		});
	}else if(type=='endUser'){
		CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			CON('SELECT * FROM users WHERE company = "'+rows[0].company+'"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				CON('SELECT * FROM table_card WHERE isdel = 0 AND endUser = "'+rows[0].user_id+'" AND (serialNo = '+sn+' OR machineNo = '+sn+' OR serialNo LIKE "'+str+'") ORDER BY id DESC LIMIT '+start_page+','+num,function(err,rows){
					if(err){
						LOG(err);
						return;
					}
					cb(rows);
				});
			});
		});
	}else{
		var m_str = 'SELECT * FROM table_card WHERE isdel = 0 AND dealer = "'+type+'" AND (serialNo = '+sn+' OR machineNo = '+sn+' OR serialNo LIKE "'+str+'") ORDER BY id DESC LIMIT '+start_page+','+num;
		CON(m_str,function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			cb(rows);
		});
	}
}
this.searchCust = function(sn,dealer,cb){
	var arr = [];
	var len = sn.length;
	var str = '%';
	for(var i=0;i<len;i++){
		str += sn.charAt(i)+'%';
	}
	var d_str = '';
	dealer.forEach(function(items,index){
		d_str += ' dealer = "'+items+'" OR';
	});
	d_str = d_str.slice(0,d_str.length-2);
	CON('select serialNo,machineNo,model,validTime from table_card WHERE (serialNo = '+sn+' OR machineNo = '+sn+' OR serialNo LIKE "'+str+'") AND ('+d_str+') ORDER BY id DESC',function(err,rows){
		if(err){
	        LOG('err:'+err);
	        return;
	    }
	    cb(rows);
	});
}
this.searchEnd = function(sn,open_id,cb){
	var arr = [];
	var len = sn.length;
	var str = '%';
	for(var i=0;i<len;i++){
		str += sn.charAt(i)+'%';
	}
	CON('SELECT company FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('SELECT user_id FROM users WHERE company = "'+rows[0].company+'"',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			CON('select serialNo,machineNo,model,validTime from table_card WHERE (serialNo = '+sn+' OR machineNo = '+sn+' OR serialNo LIKE "'+str+'") AND endUser = "'+rows[0].user_id+'" ORDER BY id DESC',function(err,rows){
				if(err){
			        LOG('err:'+err);
			        return;
			    }
			    cb(rows);
			});
		});
	});
}
this.seaEndUser = function(sn,cb){
	CON('select serialNo,machineNo,model,validTime from table_card WHERE serialNo = "'+sn+'" OR machineNo = "'+sn+'" ORDER BY id DESC',function(err,rows){
		if(err){
	        LOG('err:'+err);
	        return;
	    }
	    cb(rows);
	});
}
this.cardDel = function(sn,time,open_id,cb){
	CON('UPDATE table_card SET isdel = 1,update_time = "'+time+'" WHERE serialNo = '+sn,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}

this.searchDealer = function(key,val,cb){
	if(val==''){
		CON('select user_id,cn_abb from customers LIMIT 0,5',function(err,rows){
			if(err){
		        LOG('err:'+err);
		        return;
		    }
		    cb(rows);
		});
	}else{
		var len = val.length;
		var str = '%';
		for(var i=0;i<len;i++){
			str += val.charAt(i)+'%';
		}
		CON('select cn_abb,user_id from customers WHERE company LIKE "'+str+'" OR abb LIKE "'+str+'" OR cn_abb LIKE "'+str+'" OR user_id LIKE "'+str+'" limit 0,5',function(err,rows){
			if(err){
		        LOG('err:'+err);
		        cb(rows);
		        return;
		    }
		    cb(rows);
		});
	}
}
this.searchEndUser = function(key,val,cb){
	if(val==''){
		CON('select user_id,cn_abb from users LIMIT 0,5',function(err,rows){
			if(err){
		        LOG('err:'+err);
		        return;
		    }
		    cb(rows);
		});
	}else{
		var len = val.length;
		var str = '%';
		for(var i=0;i<len;i++){
			str += val.charAt(i)+'%';
		}
		CON('select cn_abb,user_id from users WHERE company LIKE "'+str+'" OR abb LIKE "'+str+'" OR cn_abb LIKE "'+str+'" OR user_id LIKE "'+str+'" limit 0,5',function(err,rows){
    		if(err){
		        LOG('err:'+err);
		        cb(rows);
		        return;
		    }
		    cb(rows);
    	});
	}
}
this.searchSalesman = function(key,val,cb){
	if(val==''){
		CON('select user_name,user_id from employee WHERE branch = "客户关系部" AND on_job = 1 limit 0,5',function(err,rows){
			if(err){
		        LOG('err:'+err);
		        return;
		    }
		    cb(rows);
		});
	}else{
		var len = val.length;
		var str = '%';
		for(var i=0;i<len;i++){
			str += val.charAt(i)+'%';
		}
		CON('select user_name,user_id from employee WHERE (user_name LIKE "'+str+'" OR English_name LIKE "'+str+'" OR English_abb LIKE "'+str+'" OR user_id LIKE "'+str+'") AND on_job = 1 limit 0,5',function(err,rows){
			if(err){
		        LOG('err1:'+err);
		        cb(rows);
		        return;
		    }
		    cb(rows);
		});
	}
}
this.searchMaker = function(key,val,cb){
	if(val==''){
		CON('select user_name,user_id from employee WHERE branch = "生产部" AND on_job = 1 limit 0,5',function(err,rows){
			if(err){
		        LOG('err:'+err);
		        return;
		    }
		    cb(rows);
		});
	}else{
		var len = val.length;
		var str = '%';
		for(var i=0;i<len;i++){
			str += val.charAt(i)+'%';
		}
		CON('select user_name,user_id from employee WHERE (user_name LIKE "'+str+'" OR English_name LIKE "'+str+'" OR English_abb LIKE "'+str+'" OR user_id LIKE "'+str+'") AND on_job = 1 limit 0,5',function(err,rows){
			if(err){
		        LOG('err:'+err);
		        cb(rows);
		        return;
		    }
		    cb(rows);
		});
	}
}
this.searchTester = function(key,val,cb){
	if(val==''){
		CON('select user_name,user_id from employee WHERE branch = "生产部" AND on_job = 1 limit 0,5',function(err,rows){
			if(err){
		        LOG('err:'+err);
		        return;
		    }
		    cb(rows);
		});
	}else{
		var len = val.length;
		var str = '%';
		for(var i=0;i<len;i++){
			str += val.charAt(i)+'%';
		}
		CON('select user_name,user_id from employee WHERE (user_name LIKE "'+str+'" OR English_name LIKE "'+str+'" OR English_abb LIKE "'+str+'" OR user_id LIKE "'+str+'") AND on_job = 1 limit 0,5',function(err,rows){
			if(err){
		        LOG('err:'+err);
		        cb(rows);
		        return;
		    }
		    cb(rows);
		});
	}
}
this.transEndUser = function(val,cb){
	CON('SELECT cn_abb FROM customers WHERE user_id = '+val,function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        cb(rows);
	});
}
this.dealerTrans = function(arr,cb){
	var _arr = [];
	async.waterfall(
		[
			function(callback){
				if(arr[0]==''||arr[0]==0){
					var o = {};
			        o.id = '';
			        o.name = '';
			        o.key = 'dealer';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
				}
				CON('SELECT cn_abb,user_id FROM customers WHERE user_id = '+arr[0],function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
			        try{
			        	var o = {};
				        o.id = rows[0].user_id;
				        o.name = rows[0].cn_abb;
				        o.key = 'dealer';
				        _arr.push(o);
				        callback(null,_arr);
				        return;
			        }catch(e){
			        	var o = {};
				        o.id = '';
				        o.name = '';
				        o.key = 'dealer';
				        _arr.push(o);
				        callback(null,_arr);
				        return;
			        }
			    });
			},
			function(_arr,callback){
				if(arr[1]==''){
					var o = {};
			        o.id = '';
			        o.name = '';
			        o.key = 'salesman';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
				}else if(/[\u4e00-\u9fa5]/.test(arr[1])==true){
					var o = {};
			        o.id = arr[1];
			        o.name = arr[1];
			        o.key = 'salesman';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
				}
				CON('SELECT user_name,user_id FROM employee WHERE user_id = '+arr[1],function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
			        try{
			        	var o = {};
				        o.id = rows[0].user_id;
				        o.name = rows[0].user_name;
				        o.key = 'salesman';
				        _arr.push(o);
				        callback(null,_arr);
				        return;
			        }catch(e){
			        	var o = {};
				        o.id = '';
				        o.name = '';
				        o.key = 'salesman';
				        _arr.push(o);
				        callback(null,_arr);
				        return;
			        }
			    });
			},
			function(_arr,callback){
				if(arr[2]==''){
					var o = {};
			        o.id = '';
			        o.name = '';
			        o.key = 'endUser';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
				}
				CON('SELECT cn_abb,user_id FROM users WHERE user_id = '+arr[2],function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
			        try{
			        	var o = {};
				        o.id = rows[0].user_id;
				        o.name = rows[0].cn_abb;
				        o.key = 'endUser';
				        _arr.push(o);
				        callback(null,_arr);
				        return;
			        }catch(e){
			        	var o = {};
				        o.id = '';
				        o.name = '';
				        o.key = 'endUser';
				        _arr.push(o);
				        callback(null,_arr);
				        return;
			        }
			    });
			},
			function(_arr,callback){
				if(arr[3]==''){
					var o = {};
			        o.id = '';
			        o.name = '';
			        o.key = 'maker';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
				}
				CON('SELECT user_name,user_id FROM employee WHERE user_id = '+arr[3],function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
			        var o = {};
			        o.id = rows[0].user_id;
			        o.name = rows[0].user_name;
			        o.key = 'maker';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
			    });
			},
			function(_arr,callback){
				if(arr[4]==''){
					var o = {};
			        o.id = '';
			        o.name = '';
			        o.key = 'tester';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
				}
				CON('SELECT user_name,user_id FROM employee WHERE user_id = '+arr[4],function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
			        var o = {};
			        o.id = rows[0].user_id;
			        o.name = rows[0].user_name;
			        o.key = 'tester';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
			    });
			},
			function(_arr,callback){
				if(arr[5]==''||arr[5]==0){
					var o = {};
			        o.id = '';
			        o.name = '';
			        o.key = 'EMP_NO';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
				}
				CON('SELECT user_name,user_id FROM employee WHERE user_id = '+arr[5],function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
			        if(rows[0]!=null){
			        	var o = {};
				        o.id = rows[0].user_id;
				        o.name = rows[0].user_name;
				        o.key = 'EMP_NO';
				        _arr.push(o);
				        callback(null,_arr);
				        return;
			        }else{
			        	CON('SELECT cn_abb,user_id FROM customers WHERE user_id = '+arr[5],function(err,rows){
							if(err){
					            LOG('err:'+err);
					            return;
					        }
					        try{
					        	var o = {};
						        o.id = rows[0].user_id;
						        o.name = rows[0].cn_abb;
						        o.key = 'EMP_NO';
						        _arr.push(o);
						        callback(null,_arr);
						        return;
					        }catch(e){
					        	var o = {};
						        o.id = '';
						        o.name = '';
						        o.key = 'EMP_NO';
						        _arr.push(o);
						        callback(null,_arr);
						        return;
					        }
					    });
			        }
			    });
			},
			function(_arr,callback){
				if(arr[6]==''){
					var o = {};
			        o.id = '';
			        o.name = '';
			        o.key = 'inputPerson';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
				}
				CON('SELECT user_name,user_id FROM employee WHERE user_id = '+arr[6],function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
			        var o = {};
			        o.id = rows[0].user_id;
			        o.name = rows[0].user_name;
			        o.key = 'inputPerson';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
			    });
			},
			function(_arr,callback){
				if(arr[7]==''){
					var o = {};
			        o.id = '';
			        o.name = '';
			        o.key = 'update_person';
			        _arr.push(o);
			        callback(null,_arr);
			        return;
				}
				CON('SELECT user_name,user_id FROM employee WHERE user_id = '+arr[7],function(err,rows){
					if(err){
			            LOG('err:'+err);
			            return;
			        }
			        try{
			        	var o = {};
				        o.id = rows[0].user_id;
				        o.name = rows[0].user_name;
				        o.key = 'update_person';
				        _arr.push(o);
				        callback(null,_arr);
			        }catch(e){
			        	var o = {};
				        o.id = '';
				        o.name = '';
				        o.key = 'update_person';
				        _arr.push(o);
				        callback(null,_arr);
			        }
			    });
			}
		],function(err,result){
			cb(result);
		});
}
this.applyReg = function(openid,name,res,mobile,cpy,job,gender,addr,time,cb){
	CON("select * from vip_basic where openid='"+openid+"'",function(err,results){
        if(err){
        	LOG(err);
        	return;
        }
        if(results[0]==undefined){
            CON("insert into reg_events(id,name,mobile,cpy,job,gender,addr,openid,isHandle,time) values(null,'"+name+"',"+mobile+",'"+cpy+"','"+job+"','"+gender+"','"+addr+"','"+openid+"',"+0+",'"+time+"')",function(err,results){
                if(err){
		        	LOG(err);
		        	return;
		        }
		        var update_time = TIME();
		        CON("insert into vip_basic(id,name,phone,company,job,gender,addr,openid,submit_time) values(null,'"+name+"',"+mobile+",'"+cpy+"','"+job+"','"+gender+"','"+addr+"','"+openid+"','"+update_time+"')",function(err,results){
	                if(err){
			        	LOG(err);
			        	return;
			        }
			        CON('SELECT name,phone,basic,evaluate FROM item_score',function(err,rows){
			        	if(err){
				        	LOG(err);
				        	return;
				        }
				        var basic_score = rows[0].basic;
				        var evaluate_score = rows[0].evaluate;
				        var name_score = (basic_score-evaluate_score) * rows[0].name;
				        var phone_score = (basic_score-evaluate_score) * rows[0].phone;
				        var basic = name_score + phone_score;
				        CON("insert into vip_score(id,name,phone,basic,total) values(null,'"+name+"',"+mobile+",'"+basic+"','"+basic+"')",function(err,results){
				            if(err){
					        	LOG(err);
					        	return;
					        }
					        CON('INSERT INTO sign_score(name,phone) VALUES("'+name+'","'+mobile+'")',function(err,rows){
					        	if(err){
					        		LOG(err);
					        		return;
					        	}
					        	cb('succ');
					        });
					    });
			        });
	            });
            });
        }else{
            cb("openidExist");
        }
    })
}
this.checkCredit = function(open_id,cb){
	CON('SELECT open_id FROM employee WHERE open_id = "'+open_id+'"',function(err,result){
		if(err){
            LOG('err:'+err);
            return;
        }
        if(result[0]==null){
        	CON('SELECT company FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				CON('SELECT credit_qualified,level FROM customers WHERE company = "'+rows[0].company+'"',function(err,rows){
					if(err){
						LOG(err);
						return;
					}
					cb(rows);
				});
			});
        }else{
        	CON('SELECT credit_qualified,level FROM customers WHERE company = "杭州朗杰测控技术开发有限公司"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				cb(rows);
			});
        }
    });
}
this.getAppName = function(cb){
	CON('SELECT * FROM app_name_lib ORDER BY score DESC LIMIT 0,10',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.searchAppName = function(appName,cb){
	CON('SELECT * FROM app_name_lib WHERE appName = "'+appName+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.UpdateAppNameScore = function(appName,score,cb){
	CON('UPDATE app_name_lib SET score = "'+score+'" WHERE appName = "'+appName+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.InsertAppName = function(appName,cb){
	CON('INSERT INTO app_name_lib (appName) VALUES ("'+appName+'")',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
//here
this.checkDealer = function(open_id,sn,cb){
	CON('SELECT dealer FROM table_card WHERE serialNo = '+sn,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0].dealer==null){
			cb('no_dealer');
		}else{
			var dealer = rows[0].dealer;
			CON('SELECT * FROM customers WHERE user_id = "'+dealer+'"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				try{
					if(rows[0].company==null){
						cb('no_dealer');
					}else{
						CON('SELECT name,phone FROM vip_basic WHERE company = "'+rows[0].company+'"',function(err,row){
							if(err){
								LOG(err);
								return;
							}
							var all_arr = row;	//公司对应不上则为空
							CON('SELECT reg_person FROM customers WHERE company = "'+rows[0].company+'"',function(err,r){
								if(err){
									LOG(err);
									return;
								}
								//获取客户表中的注册人（单表操作）
								var m_arr = getRegPerson(r[0].reg_person);
								CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
									if(err){
										LOG(err);
										return;
									}
									rows[0].sn = sn;
									cb(all_arr,m_arr,rows);
								});
							});
						});
					}
				}catch(e){
					cb('no_dealer');
				}
			});
		}
	});
}
this.getMemberInfo = function(open_id,cb){
	var m_str = 'SELECT * FROM vip_basic WHERE openid = "'+open_id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getEmpId = function(open_id,cb){
	var m_str = 'SELECT user_id FROM employee WHERE open_id = "'+open_id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows[0].user_id);
	});
}
// function indexRegPerson(name,cb){
// 	var m_str = '%'+name+'%';
// 	CON('SELECT * FROM customers WHERE reg_person LIKE "'+m_str+'"',function(err,rows){
// 		if(err){
// 			LOG(err);
// 			return;
// 		}
// 		var m_len = rows.length;
// 		var m_mark = 0;
// 		rows.forEach(function(items,index){
// 			var regPersonArr = items.reg_person.split('&');
// 			var m_reg_len = regPersonArr.length;
// 			regPersonArr.forEach(function(it,ind){
// 				if(it==name){
// 					CON('SELECT user_id FROM customers WHERE reg_person = "'+items.reg_person+'"',function(err,rows){
// 						if(err){
// 							LOG(err);
// 							return;
// 						}
// 						m_mark = 1;
// 						cb(rows[0].user_id);
// 					});
// 				}else if(m_len==index+1&&m_reg_len==ind+1&&m_mark==0){
// 					CON('SELECT user_id FROM customers WHERE legal_person = "'+name+'"',function(err,rows){
// 						if(err){
// 							LOG(err);
// 							return;
// 						}
// 						if(rows[0]==null){
// 							cb('inexistence');
// 						}else{
// 							cb(rows[0].user_id);
// 						}
// 					});
// 				}
// 			});
// 		});
// 	});
// }

function trans(i,data){
	if(i=='sn'||i=='regCode'||i=='authOperKey'||i=='appRegCode'){
		return data[i];
	}else if(i=='open_id'){
		return 'others';
	}else{
		return '\''+data[i]+'\'';
	}
}
function getRegPerson(str){
	var arr = [];
	var count = 0;
	for (var i = 0; i < str.length+1; i++) {
		if(!/[\u4e00-\u9fa5]/.test(str[i])){
			arr.push(str.slice(count,i));
			count = i+1;
		}
	};
	return arr;
}
function traverse(name,cb){
	var reg_name_arr = [],user_id_arr = [];
	CON('SELECT * FROM customers',function(err,rows){
		rows.forEach(function(items,index){
			try{
				var reg_person_arr = items.reg_person.split(',');
			}catch(e){
				var reg_person_arr = [''];
			}
			try{
				var legal_person_arr = items.legal_person.split(',');
			}catch(e){
				var legal_person_arr = [''];
			}
			try{
				var partner_arr = items.partner.split(',');
			}catch(e){
				var partner_arr = [''];
			}
			reg_person_arr.forEach(function(it,ind){
				reg_name_arr.push({
					name: it,
					user_id: items.user_id
				});
			});
			legal_person_arr.forEach(function(it,ind){
				reg_name_arr.push({
					name: it,
					user_id: items.user_id
				});
			});
			partner_arr.forEach(function(it,ind){
				reg_name_arr.push({
					name: it,
					user_id: items.user_id
				});
			});
		});
		reg_name_arr.forEach(function(items,index){
			if(items.name==name){
				user_id_arr.push(items.user_id);
			}
		});
		cb(user_id_arr);
	});
}
this.checkPartner = function(name,info){
	try{
		var partner_arr = info.partner.split(',');
	}catch(e){
		var partner_arr = [''];
	}
	for (var i = 0; i < partner_arr.length; i++) {
		if(partner_arr[i]==name){
			return 1;
			break;
		}else if(partner_arr[i]!=name&&i==partner_arr.length-1){
			return 0;
		}
	}
}
function checkPartner(name,info){
	try{
		var partner_arr = info.partner.split(',');
	}catch(e){
		var partner_arr = [''];
	}
	for (var i = 0; i < partner_arr.length; i++) {
		if(partner_arr[i]==name){
			return 1;
			break;
		}else if(partner_arr[i]!=name&&i==partner_arr.length-1){
			return 0;
		}
	}
}

this.identity = function(open_id,cb){
	var indexType = new IndexType(open_id);
	indexType.getFirstTier(function(obj){
		if(obj.code==0){
			cb(obj);		//非会员
		}else if(obj.code==100){
			cb(obj);		//员工	
		}else if(obj.code==200){
			indexType.checkDealer(function(result){
				result.obj = indexType;
				cb(result);
			});
		}else if(obj.code==300){
			indexType.checkEndUser(function(result){
				result.obj = indexType;
				cb(result);
			});
		}else if(obj.code==400){
			cb(obj);		//未录入
		}
	});
}
function IndexType(open_id){
	this.open_id = open_id;
}
IndexType.prototype.getFirstTier = function(cb){
	var open_id = this.open_id;
	var that = this;
	CON('SELECT open_id FROM employee WHERE open_id = "'+open_id+'"',function(err,rows){
		if(err){
            LOG('err:'+err);
            return;
        }
        if(rows[0]==null){
        	CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
				if(err){
		            LOG('err:'+err);
		            return;
		        }
		        if(rows[0]==null){
		        	cb({
		        		code: 0,
		        		msg: 'no_member'
		        	});		//非会员
		        }else{
		        	CON('SELECT * FROM customers WHERE company = "'+rows[0].company+'"',function(err,result){
		        		if(err){
		        			LOG(err);
		        			return;
		        		}
		        		if(result[0]==null){
		        			CON('SELECT * FROM users WHERE company = "'+rows[0].company+'"',function(err,r){
				        		if(err){
				        			LOG(err);
				        			return;
				        		}
				        		if(r[0]==null){
				        			cb({
						        		code: 400,
						        		msg: 'not_entered'
						        	});		//不存在，需要添加
				        		}else{
				        			//最终用户(分endUser和endUser_member)
				        			that.rows = rows;
		        					that.result = r;
				        			cb({
						        		code: 300,
						        		rows: rows,
						        		result: r
						        	});
				        		}
				        	});
		        		}else{
		        			//中间商
		        			that.rows = rows;
		        			that.result = result;
		        			cb({
				        		code: 200,
				        		rows: rows,
				        		result: result
				        	});
		        		}
		        	});
		        }
		    });
        }else{
        	cb({
        		code: 100,
        		msg: 'employee'
        	});
        }
    });
}
IndexType.prototype.checkDealer = function(cb){
	var rows = this.rows;
	var result = this.result;
	var that = this;
	if(rows[0].check_company){
		//判断合伙人
		var p = new Promise(function(resolve,reject){
			if(rows[0].check_company&&rows[0].check_job){
				var name = rows[0].name;
				if(checkPartner(name,result[0])){
					traverse(name,function(user_id_arr){
						if(user_id_arr[0]!=null){
							that.user_id_arr = user_id_arr;
							resolve({
								code: 1,
								msg: 'dealer'
							});
						}else{
							resolve({
								code: -7,
								msg: 'dealer_member'
							});
						}
					});
				}else{
					resolve();
				}
			}
		});
		p.then(function(s){
			if(s==undefined){
				if((rows[0].job=='法人'||rows[0].job=='注册人')&&rows[0].check_job==1){
					var name = rows[0].name;
					traverse(name,function(user_id_arr){
						if(user_id_arr[0]!=null){
							that.user_id_arr = user_id_arr;
							cb({
								code: 1,
								msg: 'dealer'
							});
						}else{
							cb({
								code: -7,
								msg: 'dealer_member'
							});
						}
					});
				}else if((rows[0].job=='法人'||rows[0].job=='注册人')&&rows[0].check_job==0){
					cb({
						code: -2,
						msg: 'dealer_member'
					});
					return;
				}else{
					cb({
						code: -3,
						msg: 'dealer_member'
					});
				}
			}else{
				cb(s);
			}
		});
	}else{
		cb({
			code: -1,
			msg: 'dealer_member'
		});
	}
}
IndexType.prototype.getUserId = function(cb){
	// var result = this.result;
	// var user_id = result[0].user_id;
	var user_id_arr = this.user_id_arr;
	cb(user_id_arr);
}
IndexType.prototype.checkDealerCard = function(user_id,sn,cb){
	CON('SELECT dealer FROM table_card WHERE serialNo = '+sn,function(err,r){
		if(err){
            LOG(err);
            return;
        }
        if(r[0]==null){
        	cb({
        		code: -4,
        		msg: 'dealer_member'
        	});		
        }else if(r[0].dealer==null||r[0].dealer==''){
        	cb({
        		code: -5,
        		msg: 'dealer_member'
        	});	
        }else{
        	for (var i = 0; i < user_id.length; i++) {
        		if(r[0].dealer==user_id[i]){
	        		cb({
	        			code: 1,
	        			msg: 'dealer'
	        		});
	        		break;
	        	}else if(i==user_id.length-1){
	        		cb({
	        			code: -6,
		        		msg: 'dealer_member'
		        	});
		        	break;
	        	}
        	};
        }
    });
}
IndexType.prototype.checkEndUser = function(cb){
	var rows = this.rows;
	var result = this.result;
	//最终用户(分endUser和endUser_member)
	if(rows[0].check_company){
		if(rows[0].job!='法人'&&rows[0].job!='注册人'){
			cb({
				code: -10,
				msg: 'endUser_member'
			});
		}else{
			if(rows[0].check_job){
		    	var reg_person_str = result[0].reg_person;
		        var legal_person = result[0].legal_person;
		        var m_arr = getRegPerson(reg_person_str);
				m_arr.push(legal_person);
				for (var i = 0; i < m_arr.length; i++) {
					if(m_arr[i]==rows[0].name){
						cb({
							code: 2,
							msg: 'endUser'
						}); 
			        	break;
					}else if(i==m_arr.length-1){
						cb({
							code: -9,
							msg: 'endUser_member'
						});    
					}
				};
			}else{
				cb({
					code: -11,
					msg: 'endUser_member'
				});
			}
		}
	}else{
		cb({
			code: -12,
			msg: 'endUser_member'
		});
	}
}
IndexType.prototype.checkEndUserCard = function(user_id,sn,cb){
	CON('SELECT endUser FROM table_card WHERE serialNo = '+sn,function(err,r){
		if(err){
            LOG(err);
            return;
        }
        if(r[0]==null){
        	cb({
        		code: -24,
        		msg: 'endUser_member'
        	});		
        }else if(r[0].endUser==null||r[0].endUser==''){
        	cb({
        		code: -25,
        		msg: 'endUser_member'
        	});	
        }else{
        	if(r[0].endUser==user_id){
        		cb({
        			code: 2,
        			msg: 'endUser'
        		});
        	}else{
        		cb({
        			code: -26,
	        		msg: 'endUser_member'
	        	});
        	}
        }
    });
}