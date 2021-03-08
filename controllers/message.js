var express = require('express');
var url = require('url');
var modMessage = require('../model/mod_message.js');


this.message = function(req,res,next){
	if(req.method.toUpperCase()=='GET'||req.method.toUpperCase()=='PUT'){
		var p = url.parse(req.url,true).query;
		var rec_arr = JSON.parse(p.params.replace(/\$/g,'&'));
	}else if(req.method.toUpperCase()=='POST'){
		var rec_arr = JSON.parse(req.body.params);
	}
	var len = rec_arr.length;
	var obj0 = {},obj1 = {};
	var m_user = rec_arr[0].user;
	if(typeof(m_user)=='string'&&m_user.indexOf('{')==-1){
		modMessage.getName(m_user,function(result){
			rec_arr[0].user = JSON.stringify(result);
			dataSru();
		});
	}else{
		dataSru();
	}
	function dataSru(){
		for (var k = 0; k < len; k++) {
			var user = typeof(rec_arr[k].user)=='string'?JSON.parse(rec_arr[k].user):rec_arr[k].user;
			var key_str = '',val_str = '',_val_str = '';
			for(var i in rec_arr[k]){
				if(i!='table'&&i!='user'){
					key_str += i+',';
					val_str += '"'+rec_arr[k][i]+'",';
				}
			}
			key_str += 'post_time,';
			val_str += '"'+TIME()+'",';
			user.forEach(function(items,index){
				var str = '';
				for(var i in items){
					if(index==0){
						key_str += i+',';
					}
					str += '"'+items[i]+'",';
				}
				str = str.slice(0,str.length-1);
				_val_str += '('+val_str+str+'),';
			});
			key_str = key_str.slice(0,key_str.length-1);
			_val_str = _val_str.slice(0,_val_str.length-1);
			eval('obj'+k).table = rec_arr[k].table;
			eval('obj'+k).key_str = key_str;
			eval('obj'+k).val_str = _val_str;
		};
		modMessage.insertMsg(obj0,function(result){
			if(len==2){
				modMessage.insertMsg(obj1,function(result){
					next();
				});
			}else{
				next();
			}
		});
	}
}
this.msgToDealer = function(req,res,next){
	res.render('./pages/tip',{
		tip: '注册申请已通知供应商'
	});
}
this.memberModify = function(req,res,next){
	SEND(res,200,'发送成功',[]);
}
this.memberModifyNtc = function(req,res,next){
	SEND(res,200,'更新成功',[]);
}
this.msgToConsumer = function(req,res,next){
	SEND(res,200,'发送成功',[]);
}
// this.msgToApplicant = function(req,res,next){
// 	var params = url.parse(req.url,true).query;
// 	var data = JSON.parse(params.data);
// 	data.msg = '已自动将注册结果通知给申请人';
// 	SEND(res,200,'发送成功',data);
// }
this.msgToApplicant = function(req,res,next){
	// var params = url.parse(req.url,true).query;
	// var data = JSON.parse(params.data);
	// data.msg = '已自动将注册结果通知给申请人';
	SEND(res,200,'发送成功',[]);
}

this.middleMsg = function(obj,cb){
	var name_arr = [],phone_arr = [];
	var p = new Promise(function(resolve,reject){
		if(!obj.phone){
			if(obj.name instanceof(Array)){
				let p_arr = [];
				obj.name.forEach(function(items,index){
					p_arr[index] = new Promise(function(reso,reje){
						modMessage.getMemberInfo(obj.name[index],function(result){
							if(result[0]==null){
								reje({code:-200,msg:'不存在该会员'});
							}else if(result.length>1){
								reje({code:-300,msg:'该会员名存在多个'});
							}else{
								name_arr = obj.name;
								phone_arr.push(result[0].phone);
								reso({code:200});
							}
						});
					});
				});
				Promise.all(p_arr).then(function(result){
					resolve(result);
				}).catch(function(result){
					reject(result);
				});
			}else{
				modMessage.getMemberInfo(obj.name,function(result){
					if(result[0]==null){
						reject({code:-200,msg:'不存在该会员'});
					}else if(result.length>1){
						reject({code:-300,msg:'该会员名存在多个'});
					}else{
						name_arr.push(obj.name);
						phone_arr.push(result[0].phone);
						resolve({code:200});
					}
				});
			}
		}else{
			if(obj.name instanceof(Array)){
				name_arr = obj.name;
				phone_arr = obj.phone;
				resolve({code:200});
			}else{
				name_arr.push(obj.name);
				phone_arr.push(obj.phone);
				resolve({code:200});
			}	
		}
	});
	p.then(function(){
		obj.post_time = TIME();
		obj.table = obj.table?obj.table:'vip_message';
		obj.model = obj.model?obj.model:'singleMsg';
		obj.url = obj.url?obj.url:'';
		var p_arr = [];
		name_arr.forEach(function(items,index){
			p_arr[index] = new Promise(function(resolve,reject){
				obj.name = items;
				obj.phone = phone_arr[index];
				let key_str = '',val_str = '';
				for(key in obj){
					if(key!='table'){
						key_str += key + ',';
						val_str += '"'+obj[key]+'",';
					}
				}
				key_str = key_str.slice(0,key_str.length-1);
				val_str = val_str.slice(0,val_str.length-1);
				var params = {
					table: obj.table,
					key_str: key_str,
					val_str: val_str
				};
				modMessage.middleMsg(params,function(result){
					if(result.code==-100){
						reject({code:-100,msg:'数据库出错'});
					}else{
						resolve({code:200});
					}
				});
			});
		});
		Promise.all(p_arr).then(function(msg){
			cb(msg[0]);
		}).catch(function(msg){
			cb(msg);
		});
	}).catch(function(msg){
		cb(msg);
	});
}