var express = require('express');
var mysql = require('mysql');
var url = require('url');
var fs = require('fs');

/**
 *  public interface CheckGoods {
 *  	public string no;
 *  	public void setStatus( callback ); 
 *  }
 */
class CheckGoods {
	constructor(no){
		this.no = no;
	}

	setStatus(cb){
		var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND repair_contractno = "'+this.no+'"';
		var that = this;
		private_query(m_str,function(result){
			var deliver_state = result[0].deliver_state;
			if(deliver_state=='已收件'){
				var str = 'UPDATE repairs SET complete = 1 WHERE isdel = 0 AND repair_contractno = "'+that.no+'"';
			}else{
				var str = 'UPDATE repairs SET complete = 0 WHERE isdel = 0 AND repair_contractno = "'+that.no+'"';
			}
			try{
				private_query(str,function(){
					cb(1);
				});
			}catch(e){
				cb(-1);
			}
		});
	}
}
function private_query(str,cb){
	CON(str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.checkUser = function(open_id,cb){
	var m_str = 'SELECT user_id FROM employee WHERE open_id = "'+open_id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			CON('SELECT company FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				if(rows[0]==null){
					cb('non-member');	//返回非会员
				}else{
					CON('SELECT company FROM vip_basic WHERE openid = "'+open_id+'" AND check_company = 1',function(err,rows){
						if(err){
							LOG(err);
							return;
						}
						if(rows[0]==null){
							cb('non-auth');	//返回没有权限
						}else{
							CON('SELECT cn_abb FROM customers WHERE company = "'+rows[0].company+'"',function(err,r){
								if(err){
									LOG(err);
									return;
								}
								if(r[0]==null){
									CON('SELECT cn_abb FROM users WHERE company = "'+rows[0].company+'"',function(err,rows){
										if(err){
											LOG(err);
											return;
										}
										cb(rows);	//返回最终用户中文简称
									});
								}else{
									cb(r);	//返回客户中文简称
								}
							});
						}
					});
				}
			});
		}else{
			cb('employee');		//返回员工
		}
	});
}
this.getName = function(user_id,cb){
	var m_str = 'SELECT user_name FROM employee WHERE user_id = "'+user_id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows[0].user_name);
	});
}

this.getList = function(page,num,authority,cb){
	var start_page = (page-1)*num;
	var abb = '%'+authority+'%';
	if(authority=='employee'){
		var m_str = 'SELECT * FROM repairs WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
	}else{
		var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND cust_name LIKE "'+abb+'" ORDER BY id DESC LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.search = function(page,num,authority,keywords,cb){
	var start_page = (page-1)*num;
	var len = keywords.length;
    var str = '%';
    for(var i=0;i<len;i++){
        str += keywords.charAt(i)+'%';
    }
    var abb = '%'+authority+'%';
    if(authority=='employee'){
		var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND repair_contractno LIKE "'+str+'" ORDER BY id DESC LIMIT '+start_page+','+num;
	}else{
		var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND cust_name LIKE "'+abb+'" AND repair_contractno LIKE "'+str+'" ORDER BY id DESC LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getComment = function(cb){
	var m_str = 'SELECT column_name,column_comment FROM INFORMATION_SCHEMA.Columns WHERE table_schema="lj_node" AND table_name="repairs"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.info = function(no,authority,cb){
	var abb = '%'+authority+'%';
	if(authority=='employee'){
		var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND repair_contractno = "'+no+'"';
	}else{
		var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND cust_name LIKE "'+abb+'" AND repair_contractno = "'+no+'"';
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		try{
			rows.forEach(function(items,index){
				if(items.receive_time) rows[index].receive_time = DATETIME(parseInt(items.receive_time+'000'));
				if(items.deliver_time) rows[index].deliver_time = DATETIME(parseInt(items.deliver_time+'000'));
				if(items.take_time) rows[index].take_time = DATETIME(items.take_time);
				if(items.update_time) rows[index].update_time = TIME(items.update_time);
			});
			cb(rows);
		}catch(e){
			cb(rows);
		}
	});
}
this.take = function(no,oper,time,cb){
	var m_str = 'UPDATE repairs SET deliver_state = "已收件", take_person = "'+oper+'",take_time = "'+time+'" WHERE isdel = 0 AND repair_contractno = "'+no+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var check = new CheckGoods(no);
		check.setStatus(function(result){
			cb(result);
		});
	});
}
this.sub = function(no,str,update_person,time,cb){
	var m_str = 'UPDATE repairs SET '+str+'update_person = "'+update_person+'",update_time = "'+time+'" WHERE repair_contractno = "'+no+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var check = new CheckGoods(no);
		check.setStatus(function(result){
			cb(result);
		});
	});
}
this.update = function(no,update_person,time,cb){	//cb(-1,result)
	CONRE('SELECT * FROM repairs WHERE repair_contractno = "'+no+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			cb(-1);
			return;
		}else{
			var str = '';
			for(var i in rows[0]){
				if(i!='id'){
					var type = typeof(rows[0][i]);
					if(type.toLowerCase()=='number'){
						str += i+'='+rows[0][i]+',';
					}else{
						str += i+'="'+rows[0][i]+'",';
					}
				}
			}
			CON('UPDATE repairs SET '+str+'update_person="'+update_person+'",update_time="'+time+'" WHERE repair_contractno = "'+no+'"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				cb(rows);
			});
		}
	});
}
this.updateAll = function(update_person,time,cb){	//cb(1)
	var count = 0;
	CONRE('SELECT * FROM repairs',function(err,rows){
		var len = rows.length;
		rows.forEach(function(items,index){
			var str = '';
			var id;
			for(var i in items){
				if(i!='id'){
					var type = typeof(rows[index][i]);
					if(type.toLowerCase()=='number'){
						str += i+'='+rows[index][i]+',';
					}else{
						str += i+'="'+rows[index][i]+'",';
					}
				}else{
					id = rows[index][i];
				}
			}
			exec(str,id,function(){
				if(count==len){
					cb(1);
				}
			});
		});
	});
	function exec(str,id,cb){
		CON('UPDATE repairs SET '+str+'update_person="'+update_person+'",update_time="'+time+'" WHERE id = '+id,function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			count++;
			cb();
		});
	}
}
this.insertData = function(cb){	//cb(-1,1)
	var count = 0;
	CON('SELECT id FROM repairs ORDER BY id DESC LIMIT 0,1',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var id = rows[0].id;
		CONRE('SELECT * FROM repairs WHERE id > '+id,function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			if(rows[0]==null){
				cb(-1);
				return;
			}else{
				var len = rows.length;
				rows.forEach(function(items,index){
					var str = '';
					var str_key = '';
					for(var i in items){
						str += '"'+items[i]+'",';
						str_key += i+',';
					}
					str = str.slice(0,str.length-1);
					str_key = str_key.slice(0,str_key.length-1);
					str = '('+str+')';
					str_key = '('+str_key+')';
					exec(str_key,str,function(){
						if(count==len){
							cb(len);
						}
					});
				});
			}
		});
	});
	function exec(str_key,str,cb){
		CON('INSERT INTO repairs '+str_key+' VALUES '+str,function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			count++;
			cb();
		});
	}
}
this.sort = function(page,num,authority,key,cb){
	var start_page = (page-1)*num;
	if(authority=='employee'){
		if(key=='all'){
			var m_str = 'SELECT * FROM repairs WHERE isdel = 0 ORDER BY id DESC LIMIT '+start_page+','+num;
		}else if(key=='update_time'){
			var m_str = 'SELECT * FROM repairs WHERE isdel = 0 ORDER BY update_time DESC LIMIT '+start_page+','+num;
		}else if(key=='tested'){
			var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND deliver_state = "待检定" ORDER BY id DESC LIMIT '+start_page+','+num;
		}else if(key=='repairing'){
			var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND deliver_state = "维修中" ORDER BY id DESC LIMIT '+start_page+','+num;
		}else if(key=='send'){
			var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND deliver_state = "已发件" ORDER BY id DESC LIMIT '+start_page+','+num;
		}else if(key=='receive'){
			var m_str = 'SELECT * FROM repairs WHERE isdel = 0 AND deliver_state = "已收件" ORDER BY id DESC LIMIT '+start_page+','+num;
		}
	}else{
		if(key=='all'){
			var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+authority+'" ORDER BY sign_time DESC LIMIT '+start_page+','+num;
		}else if(key=='update_time'){
			var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+authority+'" ORDER BY update_time DESC LIMIT '+start_page+','+num;
		}
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.del = function(no,update_person,time,cb){
	var m_str = 'UPDATE repairs SET isdel = 1,update_person = "'+update_person+'",update_time = "'+time+'" WHERE repair_contractno = "'+no+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.getImg = function(no,cb){
	CON('SELECT * FROM repairs WHERE repair_contractno = "'+no+'" AND isdel = 0',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.add = function(no,cb){
	CON('INSERT INTO repairs (repair_contractno) VALUES ("'+no+'")',function(err,rows){
		if(err){
			LOG('375'+err);
			return;
		}
		cb(rows);
	});
}
this.searchInput = function(val,cb){
	var str = '%';
	for (var i = 0; i < val.length; i++) {
		str += val[i]+'%';
	};
	var cust_promise = new Promise(function(resolve,reject){
		CON('SELECT cn_abb FROM customers WHERE company LIKE "'+str+'" OR abb LIKE "'+str+'" LIMIT 0,5',function(err,rows){
			if(err){
				reject(err);
				return;
			}
			resolve(rows);
		});
	});
	var end_promise = new Promise(function(resolve,reject){
		CON('SELECT cn_abb FROM users WHERE company LIKE "'+str+'" OR abb LIKE "'+str+'" LIMIT 0,5',function(err,rows){
			if(err){
				reject(err);
				return;
			}
			resolve(rows);
		});
	});
	Promise.all([cust_promise,end_promise]).then(function(result){
		cb(result);
	}).catch(function(err){
		LOG('407'+err);
	});
}
this.searchHistory = function(val,cb){
	var v_arr = [];
	var v_str = '';
	for (var i = 0; i < val.length; i++) {
		if(/\d/.test(val[i])&&i!=val.length-1){
			v_str += val[i];
		}else if((!/\d/.test(val[i]))&&/\d/.test(val[i-1])){
			v_arr.push(v_str);
			v_str = '';
		}else if(/\d/.test(val[i])&&i==val.length-1){
			v_str += val[i];
			v_arr.push(v_str);
		}
	};
	CON('SELECT * FROM repairs where isdel = 0',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var arr = [];
		for (var i = 0; i < rows.length; i++) {
			for (var j = 0; j < v_arr.length; j++) {
				if(rows[i].serial_no.indexOf(v_arr[j])!=-1){
					arr.push(rows[i]);
				}
			};
		};
		cb(arr);
	});
}