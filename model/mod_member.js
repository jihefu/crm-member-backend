var express = require('express');
var mysql = require('mysql');
var url = require('url');
var app = express();
var fs = require('fs');
var log4js = require('../logs/log_start');
var async = require('async');
var modService = require('./mod_service');

this.checkMember = function(open_id,cb){
	CON('SELECT openid FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.checkStaff = function(open_id,cb){
	CON('SELECT open_id FROM employee WHERE open_id = "'+open_id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.checkLegalPerson = function(open_id,cb){
	CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'" AND check_company = 1 AND job = "法人" AND check_job = 1',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
				var name = rows[0].name;
				var company = rows[0].company;
				CON('SELECT * FROM customers WHERE company = "'+company+'"',function(err,rows){
					if(err){
						LOG(err);
						return;
					}
					if(rows[0]==null){
						cb([]);
					}else{
						if(modService.checkPartner(name,rows[0])){
							cb(rows);
						}else{
							cb([]);
						}
					}
				});
			});
		}else{
			CON('SELECT * FROM customers WHERE legal_person = "'+rows[0].name+'" OR partner LIKE "%'+rows[0].name+'%"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				cb(rows);
			});
		}
	});
}
this.checkJob = function(open_id,cb){
	CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'" AND check_job = 1 AND check_company = 1 AND (job = "财务" OR job = "采购")',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.mainInfo = function(open_id,cb){
	CON('SELECT * FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var name = rows[0].name;
		var phone = rows[0].phone;
		var portrait = rows[0].portrait;
		CON('SELECT * FROM vip_score WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			rows[0].name = name;
			rows[0].phone = phone;
			rows[0].portrait = portrait;
			CON('SELECT count(*) FROM vip_message WHERE name = "'+name+'" AND phone = "'+phone+'" AND is_read = 0',function(err,result){
				if(err){
					LOG(err);
					return;
				}
				var count = result[0]['count(*)'];
				rows[0].count = count;
				cb(rows);
			});
		});
	});
}
this.basicInfo = function(name,phone,cb){
	CON('SELECT * FROM vip_basic WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0].birth == '0000-00-00'||rows[0].birth == ''||rows[0].birth == null){
			rows[0].birth = '';
		}else{
			rows[0].birth = DATETIME(rows[0].birth);
		}
		cb(rows);
	});
}
this.updateBasicInfo = function(name,phone,newName,newPhone,str,cb){
	newName = newName?newName:name;
	newPhone = newPhone?newPhone:phone;
	if(str=='gender="男"'||str=='gender="女"'){
		var _str = 'UPDATE vip_basic SET '+str+',submit_time = "'+TIME()+'",evaluate = 0 WHERE name = "'+name+'" AND phone = "'+phone+'"';
	}else{
		var _str = 'UPDATE vip_basic SET '+str+',submit_time = "'+TIME()+'",checked = 0,evaluate = 0 WHERE name = "'+name+'" AND phone = "'+phone+'"';
	}
	CON(_str,function(err,rows){
		if(err){
			LOG(err);
			cb('err');
			return;
		}
		CON('UPDATE vip_basic SET check_name = 1,check_phone = 1 WHERE name = "'+newName+'" AND phone = "'+newPhone+'"',function(err,rows){
			if(err){
				LOG(err);
				cb('err');
				return;
			}
			calculate(newName,newPhone,function(status){
				cb(status);
			});
		});
	});
}
function calculate(name,phone,cb){
	CON('SELECT * FROM item_score',function(err,rows){
		if(err){
			LOG(err);
			cb('err');
			return;
		}
		var m_basic = rows[0].basic;
		var m_evaluate = rows[0].evaluate;
		var m_static_basic = m_basic-m_evaluate;
		var m_company = rows[0].company;
		CON('SELECT * FROM vip_basic WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,result){
			var m_check_arr = [];
			for(var i in result[0]){
				if(i.indexOf('check_')!=-1&&i!='check_time'&&i!='check_person'&&i!='check_company'&&i!='check_job'){
					var obj = {};
					obj.key = i;
					obj.val = result[0][i];
					m_check_arr.push(obj);
				}
			}
			var m_score1=0,m_score2=0;
			m_check_arr.forEach(function(items,index){
				for(var i in rows[0]){
					if(items.key.indexOf(i)!=-1&&i.indexOf('check_')==-1){
						m_score1 += items.val*m_static_basic*rows[0][i];
					}
				}
			});
			var m_company_name = result[0].company;
			CON('SELECT star FROM customers WHERE company = "'+m_company_name+'"',function(err,resp){
				if(err){
					LOG(err);
					cb('err');
					return;
				}
				if(resp[0]!=null){
					var m_job = transJob(result[0].job);
					if(result[0].check_company){
						var m_star = resp[0].star==0?1:resp[0].star;
						if(result[0].check_job){
							var m_job_score = rows[0][m_job];
							m_score2 = m_company*m_star/10*m_job_score;
						}else{
							var m_job_score = rows[0].other;
							m_score2 = m_company*m_star/10*m_job_score;
						}
					}
				}
				var m_total = m_score1 + m_score2;
				CON('UPDATE vip_score SET basic='+m_score1+',business='+m_score2+',total='+m_total+' WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,re){
					if(err){
						LOG(err);
						cb('err');
						return;
					}
					cb('success');
				});
			});
		});
	});
	function transJob(items){
		switch(items){
			case '法人':
				return 'legal_person';
				break;
			case '注册人':
				return 'reg_person';
				break;
			case '开发':
				return 'developer';
				break;
			case '采购':
				return 'purchaser';
				break;
			case '财务':
				return 'finance';
				break;
			case '其它':
				return 'other';
				break;
		}
	}
}
this.getSign = function(name,phone,cb){
	CON('SELECT time FROM sign_activity WHERE name = "'+name+'" AND phone = "'+phone+'" AND date_format(time,"%Y-%m")=date_format(now(),"%Y-%m")',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.addSign = function(name,phone,cb){
	CON('INSERT INTO sign_activity (name,phone,time) VALUES ("'+name+'","'+phone+'","'+TIME()+'")',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('SELECT sign FROM item_score',function(err,rows){
			var sign = rows[0].sign;
			CON('SELECT accu_score FROM sign_score WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,rows){
				var accu_score = rows[0].accu_score;
				accu_score += sign;
				CON('UPDATE sign_score SET accu_score = '+accu_score+' WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,rows){
					if(err){
						LOG(err);
						return;
					}
					cb(accu_score);
				});
			});
		});
	});
}
this.totalScore = function(name,phone,accu_score,cb){
	CON('SELECT * FROM vip_score WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		var basic = rows[0].basic;
		var business = rows[0].business;
		var certificate = rows[0].certificate;
		var m_total = basic+business+certificate+accu_score;
		CON('UPDATE vip_score SET activity = '+accu_score+',total = '+m_total+' WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			cb();
		});
	});
}
this.message = function(name,phone,page,cb){
	var num = 10;
	var start_page = (page-1)*num;
	CON('SELECT * FROM vip_message WHERE name = "'+name+'" AND phone = "'+phone+'" ORDER BY mark DESC,post_time DESC LIMIT '+start_page+','+num,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('UPDATE vip_message SET read_time = "'+TIME()+'" WHERE name = "'+name+'" AND phone = "'+phone+'" AND is_read = 0',function(err,result){
			if(err){
				LOG(err);
				return;
			}
			CON('UPDATE vip_message SET is_read = 1 WHERE name = "'+name+'" AND phone = "'+phone+'"',function(err,result){
				if(err){
					LOG(err);
					return;
				}
				cb(rows);
			});
		});
	});
}
this.getCpy = function(name,phone,cb){
	var m_str = 'SELECT company FROM vip_basic WHERE name= "'+name+'" AND phone = "'+phone+'"';
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getEvent = function(name,company,page,cb){
	var num = 10;
	var start_page = (page-1)*num;
	var m_str = 'SELECT * FROM event WHERE name = "'+name+'" AND company = "'+company+'" ORDER BY id DESC LIMIT '+start_page+','+num;
	CON(m_str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.checkSign = function(name,phone,cb){
	CON('SELECT * FROM sign_activity WHERE name = "'+name+'" AND phone = "'+phone+'" ORDER BY id DESC LIMIT 0,1',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.setStar = function(id,mark,cb){
	CON('UPDATE vip_message SET mark = "'+mark+'" WHERE id = "'+id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.getManageMember = function(open_id,cb){
	CON('SELECT company FROM vip_basic WHERE openid = "'+open_id+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		CON('SELECT * FROM vip_basic WHERE company = "'+rows[0].company+'" AND openid != "'+open_id+'"',function(err,rows){
			if(err){
				LOG(err);
				return;
			}
			cb(rows);
		});
	});
}
this.getMemberJobInfo = function(phone,cb){
	CON('SELECT * FROM vip_basic WHERE phone = "'+phone+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getDynamicMsg = function(name,company,page,cb){
	var num = 10;
	var start_page = (page-1)*num;
	CON('SELECT * FROM event WHERE name = "'+name+'" AND company = "'+company+'" ORDER BY id DESC LIMIT '+start_page+','+num,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getItemInfo = function(phone,cb){
	CON('SELECT * FROM vip_basic LEFT JOIN vip_score ON vip_basic.phone = vip_score.phone WHERE vip_basic.phone = "'+phone+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getItemScore = function(cb){
	CON('SELECT * FROM item_score',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.updateScore = function(phone,bus_score,total_score,cb){
	CON('UPDATE vip_score SET business = "'+bus_score+'",total = "'+total_score+'" WHERE phone = "'+phone+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.updateCheckJob = function(phone,check,update_person,cb){
	CON('UPDATE vip_basic SET check_job = "'+check+'",check_time = "'+TIME()+'",check_person = "'+update_person+'" WHERE phone = "'+phone+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb();
	});
}
this.getCusStar = function(company,cb){
	CON('SELECT * FROM customers WHERE company = "'+company+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}

this.getCompanyInfo = function(company,cb){
	CON('SELECT * FROM customers WHERE company = "'+company+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		if(rows[0]==null){
			CON('SELECT * FROM users WHERE company = "'+company+'"',function(err,rows){
				if(err){
					LOG(err);
					return;
				}
				cb(rows);
			});
		}else{
			cb(rows);
		}
	});
}
this.getCreditInfo = function(company,cb){
	CON('SELECT * FROM credit_records WHERE company = "'+company+'" AND isdel = 0 ORDER BY credit_time DESC LIMIT 0,1',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getContractsInfo = function(bl,abb,cb){
	if(bl){
		var str = 'SELECT * FROM contracts_head WHERE isFreeze = 0 AND cus_abb = "'+abb+'" AND isdel = 0';
	}else{
		var str = 'SELECT * FROM contracts_head WHERE isFreeze = 0 AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "null" ORDER BY delivery_time';
	}
	CON(str,function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getCountOver = function(abb,f_m,cb){
	CON('SELECT count(*) AS count FROM contracts_head WHERE isFreeze = 0 AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND date_format(delivery_time,"%Y-%m-%d")<"'+f_m+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getCountRecent = function(abb,f_m,cb){
	CON('SELECT count(*) AS count FROM contracts_head WHERE isFreeze = 0 AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND date_format(delivery_time,"%Y-%m-%d")>="'+f_m+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getCountFreeze = function(abb,cb){
	CON('SELECT count(*) AS count FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+abb+'" AND isFreeze = 1',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getListOver = function(abb,f_m,cb){
	CON('SELECT * FROM contracts_head WHERE isFreeze = 0 AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND date_format(delivery_time,"%Y-%m-%d")<"'+f_m+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getListRec = function(abb,f_m,cb){
	CON('SELECT * FROM contracts_head WHERE isFreeze = 0 AND cus_abb = "'+abb+'" AND isdel = 0 AND delivery_time != "NULL" AND payable - paid > 0 AND date_format(delivery_time,"%Y-%m-%d")>="'+f_m+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getListFreeze = function(abb,cb){
	CON('SELECT * FROM contracts_head WHERE cus_abb = "'+abb+'" AND isdel = 0 AND isFreeze = 1',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getContractsCountByYear = function(abb,fromYear,toYear,cb){
	CON('SELECT count(*) AS count FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+abb+'" AND date_format(sign_time,"%Y")>= "'+fromYear+'" AND date_format(sign_time,"%Y")<= "'+toYear+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getContractsInfoByYear = function(abb,fromYear,toYear,cb){
	CON('SELECT * FROM contracts_head WHERE isdel = 0 AND cus_abb = "'+abb+'" AND date_format(sign_time,"%Y")>= "'+fromYear+'" AND date_format(sign_time,"%Y")<= "'+toYear+'" ORDER BY sign_time DESC',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getPaymentsCountByYear = function(company,fromYear,toYear,cb){
	CON('SELECT count(*) AS count FROM payment WHERE isdel = 0 AND company = "'+company+'" AND date_format(arrival,"%Y")>= "'+fromYear+'" AND date_format(arrival,"%Y")<= "'+toYear+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getPaymentsInfoByYear = function(company,fromYear,toYear,cb){
	CON('SELECT * FROM payment WHERE isdel = 0 AND company = "'+company+'" AND date_format(arrival,"%Y")>= "'+fromYear+'" AND date_format(arrival,"%Y")<= "'+toYear+'" ORDER BY arrival DESC',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}
this.getAnnualPayment = function(company,cb){
	CON('SELECT * FROM annual_payment WHERE company = "'+company+'"',function(err,rows){
		if(err){
			LOG(err);
			return;
		}
		cb(rows);
	});
}