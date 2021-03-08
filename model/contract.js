var express = require('express');
var mysql = require('mysql');
var url = require('url');
var fs = require('fs');
var modService = require('./mod_service');
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
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND contract_no = "'+this.no+'"';
		var that = this;
		private_query(m_str,function(result){
			var install = result[0].install;
			var payable = result[0].payable;
			var paid = result[0].paid;
			var delivery_state = result[0].delivery_state;
			if(install){
				if(payable-paid==0&&delivery_state=='已验收'){
					var str = 'UPDATE contracts_head SET complete = 1 WHERE isdel = 0 AND contract_no = "'+that.no+'"';
				}else{
					var str = 'UPDATE contracts_head SET complete = 0 WHERE isdel = 0 AND contract_no = "'+that.no+'"';
				}
			}else{
				if(payable-paid==0&&(delivery_state=='已收货'||delivery_state=='已验收')){
					var str = 'UPDATE contracts_head SET complete = 1 WHERE isdel = 0 AND contract_no = "'+that.no+'"';
				}else{
					var str = 'UPDATE contracts_head SET complete = 0 WHERE isdel = 0 AND contract_no = "'+that.no+'"';
				}
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
			CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				if(rows[0]==null){
					cb('non-member');	//返回非会员
				}else{
					//判断合伙人
					var p = new Promise(function(resolve,reject){
						CON('SELECT * FROM customers WHERE company = "'+rows[0].company+'"',function(err,ss){
							if(err){
								LOG(err);
								return;
							}
							if(ss[0]==null){
								resolve();
							}else{
								if(modService.checkPartner(rows[0].name,ss[0])){
									resolve([{
										abb: ss[0].abb
									}]);
								}else{
									resolve();
								}
							}
						});
					});
					p.then(function(g){
						if(g==undefined){
							CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'" AND check_company = 1 AND check_job = 1 AND (job = "采购" OR job = "财务")',function(err,rows){
								if(err){
									LOG(err);
									return;
								}
								if(rows[0]==null){
									CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'" AND check_company = 1 AND check_job = 1 AND job = "法人"',function(err,rows){
										if(err){
											LOG(err);
											return;
										}
										if(rows[0]==null){
											cb('non-auth');	//返回没有权限
										}else{
											var _name = rows[0].name;
											CON('SELECT * FROM customers WHERE company = "'+rows[0].company+'"',function(err,r){
												if(err){
													LOG(err);
													return;
												}
												if(r[0]==null){
													CON('SELECT abb FROM users WHERE company = "'+rows[0].company+'"',function(err,rows){
														if(err){
															LOG(err);
															return;
														}
														cb(rows);	//返回用户简称
													});
												}else{
													if(_name==r[0].legal_person){
														cb(r);	//返回客户简称
													}else{
														cb('non-auth');	//返回没有权限
													}
												}
											});
										}
									});
								}else{
									CON('SELECT abb FROM customers WHERE company = "'+rows[0].company+'"',function(err,r){
										if(err){
											LOG(err);
											return;
										}
										if(r[0]==null){
											CON('SELECT abb FROM users WHERE company = "'+rows[0].company+'"',function(err,rows){
												if(err){
													LOG(err);
													return;
												}
												cb(rows);	//返回用户简称
											});
										}else{
											cb(r);	//返回客户简称
										}
									});
								}
							});
						}else{
							cb(g);
						}
					});
				}
			});
		}else{
			cb('employee');		//返回员工
		}
	});
}

this.getOperName = function(open_id,cb){
	var m_str = 'SELECT name FROM vip_basic WHERE openid = "'+open_id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		try{
			cb(rows[0].name);
		}catch(e){
			cb('non-member');
		}
	});
}

this.getList = function(page,num,authority,cb){
	var start_page = (page-1)*num;
	if(authority=='employee'){
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else{
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+authority+'" ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		try{
			rows.forEach(function(items,index){
				if(items.sign_time!='0000-00-00'&&items.sign_time!=null) rows[index].sign_time = DATETIME(items.sign_time);
				if(items.update_time!='0000-00-00'&&items.update_time!=null) rows[index].update_time = TIME(items.update_time);
				if(items.delivery_time!='0000-00-00'&&items.delivery_time!=null) rows[index].delivery_time = DATETIME(items.delivery_time);
				if(items.freeze_time!='0000-00-00'&&items.freeze_time!=null) rows[index].freeze_time = DATETIME(items.freeze_time);
				if(items.close_time!='0000-00-00'&&items.close_time!=null) rows[index].close_time = DATETIME(items.close_time);
			});
			cb(rows);
		}catch(e){
			cb(rows);
		}
	});
}

this.search = function(page,num,authority,keywords,cb){
	var start_page = (page-1)*num;
	var len = keywords.length;
    var str = '%';
    for(var i=0;i<len;i++){
        str += keywords.charAt(i)+'%';
    }
	if(authority=='employee'){
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND contract_no LIKE "'+str+'" ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else{
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+authority+'" AND contract_no LIKE "'+str+'" ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		try{
			rows.forEach(function(items,index){
				if(items.sign_time!='0000-00-00'&&items.sign_time!=null) rows[index].sign_time = DATETIME(items.sign_time);
				if(items.update_time!='0000-00-00'&&items.update_time!=null) rows[index].update_time = TIME(items.update_time);
				if(items.delivery_time!='0000-00-00'&&items.delivery_time!=null) rows[index].delivery_time = DATETIME(items.delivery_time);
				if(items.freeze_time!='0000-00-00'&&items.freeze_time!=null) rows[index].freeze_time = DATETIME(items.freeze_time);
				if(items.close_time!='0000-00-00'&&items.close_time!=null) rows[index].close_time = DATETIME(items.close_time);
			});
			cb(rows);
		}catch(e){
			cb(rows);
		}
	});
}
this.sort = function(page,num,authority,key,cb){
	var start_page = (page-1)*num;
	if(authority=='employee'){
		if(key=='all'){
			var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
		}else if(key=='update_time'){
			var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 ORDER BY update_time DESC LIMIT '+start_page+','+num;
		}else if(key=='completed'){
			var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND complete = 1 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
		}else if(key=='isNotCompleted'){
			var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND complete = 0 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
		}else if(key=='arrears'){
			var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND payable - paid != 0 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
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
		try{
			rows.forEach(function(items,index){
				if(items.sign_time!='0000-00-00'&&items.sign_time!=null) rows[index].sign_time = DATETIME(items.sign_time);
				if(items.update_time!='0000-00-00'&&items.update_time!=null) rows[index].update_time = TIME(items.update_time);
				if(items.delivery_time!='0000-00-00'&&items.delivery_time!=null) rows[index].delivery_time = DATETIME(items.delivery_time);
				if(items.freeze_time!='0000-00-00'&&items.freeze_time!=null) rows[index].freeze_time = DATETIME(items.freeze_time);
				if(items.close_time!='0000-00-00'&&items.close_time!=null) rows[index].close_time = DATETIME(items.close_time);
			});
			cb(rows);
		}catch(e){
			cb(rows);
		}
	});
}
this.getComment = function(cb){
	var m_str = 'SELECT column_name,column_comment FROM INFORMATION_SCHEMA.Columns WHERE table_schema="lj_node" AND table_name="contracts_head"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getBodyComment = function(cb){
	var m_str = 'SELECT column_name,column_comment FROM INFORMATION_SCHEMA.Columns WHERE table_schema="lj_node" AND table_name="contracts_body"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.headContent = function(no,authority,cb){
	if(authority=='employee'){
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND contract_no = "'+no+'"';
	}else{
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+authority+'" AND contract_no = "'+no+'"';
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		try{
			rows.forEach(function(items,index){
				if(items.sign_time!='0000-00-00'&&items.sign_time!=null) rows[index].sign_time = DATETIME(items.sign_time);
				if(items.insert_time!='0000-00-00'&&items.insert_time!=null) rows[index].insert_time = DATETIME(items.insert_time);
				if(items.take_time!='0000-00-00'&&items.take_time!=null) rows[index].take_time = DATETIME(items.take_time);
				if(items.update_time!='0000-00-00'&&items.update_time!=null) rows[index].update_time = TIME(items.update_time);
				if(items.delivery_time!='0000-00-00'&&items.delivery_time!=null) rows[index].delivery_time = DATETIME(items.delivery_time);
				if(items.freeze_time!='0000-00-00'&&items.freeze_time!=null) rows[index].freeze_time = DATETIME(items.freeze_time);
				if(items.close_time!='0000-00-00'&&items.close_time!=null) rows[index].close_time = DATETIME(items.close_time);
			});
			cb(rows);
		}catch(e){
			cb(rows);
		}
	});
}
this.bodyContent = function(no,authority,cb){
	if(authority=='employee'){
		var m_str = 'SELECT * FROM contracts_body WHERE contract_no = "'+no+'"';
			CON(m_str,function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			cb(rows);
		});
	}else{
		CON('SELECT cus_abb FROM contracts_head WHERE isdel = 0 AND contract_no = "'+no+'"',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			try{
				var cus_abb = rows[0].cus_abb.toUpperCase();
				if(cus_abb==authority){
					var m_str = 'SELECT * FROM contracts_body WHERE contract_no = "'+no+'"';
						CON(m_str,function(err,rows){
						if(err){
							LOG(err);
							return;
						}
						cb(rows);
					});
				}else{
					cb([]);
				}
			}catch(e){
				cb([]);
			}
		});
	}
}
this.take = function(no,oper,time,cb){
	var m_str = 'UPDATE contracts_head SET delivery_state = "已收货", take_person = "'+oper+'",take_time = "'+time+'" WHERE isdel = 0 AND contract_no = "'+no+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var check = new CheckGoods(no);
		check.setStatus(function(){
			cb();
		});
	});
}
this.getAll = function(no,cb){
	var m_str = 'SELECT * FROM contracts_head LEFT JOIN contracts_body ON contracts_head.contract_no = contracts_body.contract_no WHERE contracts_head.isdel = 0 AND contracts_head.contract_no = "'+no+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0].contract_no==null||rows[0].contract_no=='null'){
			CON('SELECT * FROM contracts_head WHERE contract_no = "'+no+'"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				try{
					rows.forEach(function(items,index){
						if(items.sign_time!='0000-00-00'&&items.sign_time!=null) rows[index].sign_time = DATETIME(items.sign_time);
						if(items.update_time!='0000-00-00'&&items.update_time!=null) rows[index].update_time = TIME(items.update_time);
						if(items.delivery_time!='0000-00-00'&&items.delivery_time!=null) rows[index].delivery_time = DATETIME(items.delivery_time);
						if(items.freeze_time!='0000-00-00'&&items.freeze_time!=null) rows[index].freeze_time = DATETIME(items.freeze_time);
						if(items.close_time!='0000-00-00'&&items.close_time!=null) rows[index].close_time = DATETIME(items.close_time);
					});
					cb(rows);
				}catch(e){
					cb(rows);
				}
			});
		}else{
			try{
				rows.forEach(function(items,index){
					if(items.sign_time!='0000-00-00'&&items.sign_time!=null) rows[index].sign_time = DATETIME(items.sign_time);
					if(items.update_time!='0000-00-00'&&items.update_time!=null) rows[index].update_time = TIME(items.update_time);
					if(items.delivery_time!='0000-00-00'&&items.delivery_time!=null) rows[index].delivery_time = DATETIME(items.delivery_time);
					if(items.freeze_time!='0000-00-00'&&items.freeze_time!=null) rows[index].freeze_time = DATETIME(items.freeze_time);
					if(items.close_time!='0000-00-00'&&items.close_time!=null) rows[index].close_time = DATETIME(items.close_time);
				});
				cb(rows);
			}catch(e){
				cb(rows);
			}
		}
	});
}
this.del = function(no,update_person,time,cb){
	var m_str = 'UPDATE contracts_head SET isdel = 1,update_person = "'+update_person+'",update_time = "'+time+'" WHERE contract_no = "'+no+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
	CON('DELETE FROM contracts_body WHERE contract_no = "'+no+'"',function(err,rows){
		if(err){
			LOG(err);
		}
	});
}
this.getEmployeeName = function(user_id,cb){
	var m_str = 'SELECT user_name FROM employee WHERE user_id = "'+user_id+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			cb(user_id);
		}else{
			cb(rows[0].user_name);
		}
	});
}
this.update = function(no,update_person,time,str,cb){
	var m_str = 'UPDATE contracts_head SET '+str+'update_person="'+update_person+'",update_time="'+time+'" WHERE contract_no = "'+no+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG('err:'+err);
			return;
		}
		var check = new CheckGoods(no);
		check.setStatus(function(){
			cb();
		});
	});
}
this.searchInput = function(val,cb){
	if(val==''){
		var m_str = 'SELECT user_id,user_name FROM employee WHERE branch = "客户关系部" AND on_job = 1 LIMIT 0,5';
	}else{
		var len = val.length;
	    var str = '%';
	    for(var i=0;i<len;i++){
	        str += val.charAt(i)+'%';
	    }
		var m_str = 'SELECT user_id,user_name FROM employee WHERE (user_id LIKE "'+str+'" OR user_name LIKE "'+str+'" OR English_name LIKE "'+str+'") AND on_job = 1 LIMIT 0,5';
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getCompanyByAbb = function(abb,cb){
	var m_str = 'SELECT * FROM customers WHERE abb = "'+abb+'"';
	var m_str_user = 'SELECT * FROM users WHERE abb = "'+abb+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			CON(m_str_user,function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				if(rows[0]==null){
					cb(abb);
				}else{
					cb(rows[0].company);
				}
			});
		}else{
			cb(rows[0].company);
		}
	});
}
this.getCnAbb = function(abb,cb){
	var m_str = 'SELECT cn_abb FROM customers WHERE abb = "'+abb+'"';
	var m_str_user = 'SELECT cn_abb FROM users WHERE abb = "'+abb+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			CON(m_str_user,function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				if(rows[0]==null){
					cb(abb);
				}else{
					cb(rows[0].cn_abb);
				}
			});
		}else{
			cb(rows[0].cn_abb);
		}
	});
}
this.searchCn = function(keywords,num,page,cb){
	var start_page = (page-1)*num;
	keywords = '%'+keywords+'%';
	var m_str = 'SELECT abb FROM customers WHERE company LIKE "'+keywords+'"';
	var m_str_user = 'SELECT abb FROM users WHERE company LIKE "'+keywords+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			CON(m_str_user,function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				if(rows[0]==null){
					cb(-2);
					return;
				}else{
					var abb = rows[0].abb;
					CON('SELECT * FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+abb+'" ORDER BY sign_time DESC LIMIT '+start_page+','+num,function(err,rows){
						if(err){
							LOG(err);
							return;
						}
						if(rows[0]==null){
							cb(-3);
							return;
						}else{
							cb(rows);
						}
					});
				}
			});
		}else{
			var abb = rows[0].abb;
			CON('SELECT * FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+abb+'" ORDER BY sign_time DESC LIMIT '+start_page+','+num,function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				if(rows[0]==null){
					cb(-3);
					return;
				}else{
					cb(rows);
				}
			});
		}
	});
}
this.getImg = function(no,cb){
	CON('SELECT * FROM contracts_head WHERE contract_no = "'+no+'" AND isdel = 0',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.searchMore = function(no,cb){
	var m_str = 'SELECT * FROM contracts_head LEFT JOIN contracts_body on contracts_head.contract_no = contracts_body.contract_no WHERE contracts_head.contract_no = "'+no+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.transAbb = function(company,cb){
	var company = '%'+company+'%';
	CON('SELECT abb FROM customers WHERE company LIKE "'+company+'" OR abb LIKE "'+company+'" OR cn_abb LIKE "'+company+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getContract = function(s,abb,page,num,cb){
	var start_page = (page-1)*num;
	if(s=='arrears'){
		var m_str = 'SELECT * FROM contracts_head WHERE cus_abb = "'+abb+'" AND isdel = 0 AND payable - paid != 0 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else if(s=='isNotCompleted'){
		var m_str = 'SELECT * FROM contracts_head WHERE cus_abb = "'+abb+'" AND isdel = 0 AND complete = 0 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else if(s=='completed'){
		var m_str = 'SELECT * FROM contracts_head WHERE cus_abb = "'+abb+'" AND isdel = 0 AND complete = 1 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else if(s=='notEffect'){
		var m_str = 'SELECT * FROM contracts_head WHERE cus_abb = "'+abb+'" AND isdel = 0 AND contract_state != "有效" ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else{
		var m_str = 'SELECT * FROM contracts_head WHERE cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time is NULL ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getContractByNoCpy = function(s,page,num,cb){
	var start_page = (page-1)*num;
	if(s=='arrears'){
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND payable - paid != 0 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else if(s=='isNotCompleted'){
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND complete = 0 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else if(s=='completed'){
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND complete = 1 ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else if(s=='notEffect'){
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND contract_state != "有效" ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}else{
		var m_str = 'SELECT * FROM contracts_head WHERE isdel = 0 AND delivery_time is NULL ORDER BY sign_time DESC LIMIT '+start_page+','+num;
	}
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.fromPayUpdate = function(contract_no,params){
	CONINSERT('UPDATE contracts_head SET ? WHERE contract_no = "'+contract_no+'"',params,function(err,rows){
		if(err){
			LOG(err);
		}
	});
}