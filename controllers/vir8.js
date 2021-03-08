var express = require('express');
var url = require('url');
var formidable = require('formidable');
var fs = require('fs');
var basicAuth = require("basic-auth");
var crypto = require('crypto');
var mod_admin = require('../model/mod_admin.js');
var vir = require('../model/vir8');
var service = require('../service/service');
var serviceAction = require('../action/service');

this.renderPage = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page?params.page:1;
	vir.getList(page,function(list){
		service.productInfo({
			code: 10001,
			sn: list[0].serialNo
		},function(result){
			result = result.res_arr;
			var info = [];
			var count = 0;
			for(var i in result[0]){
				var m_obj = {};
				m_obj.key = i;
				m_obj.val = result[0][i];
				info[count] = m_obj;
				count++;
			}
			vir.getRegHistory(list[0].serialNo,function(reg){
				res.render('./pages/vir8',{
					list: list,
					result: result,
					info: info,
					reg: reg
				});
			});
		});
		// vir.getInfo(list[0].serialNo,function(result){
			
		// });
	});
}
this.getInfo = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var sn = params.sn;
	service.productInfo({
		code: 10001,
		sn: sn
	},function(info){
		info = info.res_arr;
		vir.getRegHistory(sn,function(reg){
			var m_obj = {};

			var content = [];
			var count = 0;
			for(var i in info[0]){
				var o = {};
				o.key = i;
				o.val = info[0][i];
				content[count] = o;
				count++;
			}

			m_obj.info = content;
			m_obj.reg = reg;
			SEND(res,200,'',m_obj);
		});
	});
	// vir.getInfo(sn,function(info){
		
	// });
}
this.search = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var sn = params.sn;
	if(sn){
		vir.search(sn,function(result){
			SEND(res,200,'',result);
		});
	}else{
		vir.getList(1,function(list){
			SEND(res,200,'',list);
		});
	}
}
this.add = function(req,res,next){
	var sn = req.body.sn;
	vir.checkSn(sn,function(result){
		if(result.length>0){
			SEND(res,-1,'已存在该序列号',[]);
		}else{
			var bs_name = basicAuth(req).name;
			mod_admin.searchUpdataPerson(bs_name,function(result){
				var update_person = result[0].user_id;
				var time = TIME();
				vir.createCard(sn,update_person,time,function(){
					vir.getList(1,function(list){
						SEND(res,200,'创建成功',list);
					});
				});
			});
		}
	});
}
this.del = function(req,res,next){
	var sn = req.body.sn;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		vir.del(sn,update_person,time,function(result){
			SEND(res,200,'删除成功',[]);
		});
	});
}
this.sort = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var key = params.key;
	var page = params.page?params.page:1;
	vir.sort(key,page,function(result){
		if(key=='all'||key=='update_time'){
			SEND(res,200,'',result);
		}
	});
}
this.getPage = function(req,res,next){
	var params = url.parse(req.url,true).query;
	var page = params.page;
	vir.getList(page,function(list){
		SEND(res,200,'',list);
	});
}
this.update = function(req,res,next){
	var sn = req.body.sn;
	var form_data = JSON.parse(req.body.form_data);
	// var str = req.body.str;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		var time = TIME();
		form_data.update_person = update_person;
		form_data.EMP_NO = update_person;
		form_data.update_time = time;
		vir.update(sn,form_data,function(result){
			SEND(res,200,'更新成功',[]);
		});
	});
}
this.putInfo = function(req,res,next){
	var str_id = req.body.str_id;
	var str_sn = req.body.str_sn;
	var bs_name = basicAuth(req).name;
	mod_admin.searchUpdataPerson(bs_name,function(result){
		var update_person = result[0].user_id;
		str_id += 'update_time = "'+TIME()+'",EMP_NO = "'+update_person+'"';
		vir.putInfo(str_id,str_sn,function(result){
			SEND(res,200,'更新成功',[]);
		});
	});
}
this.searchInput = function(req,res,next){
	serviceAction.searchInput(req,res,next);
}

function bubbleSort(arr){
    var len=arr.length,j;
    var temp;
    while(len>0){
        for(j=0;j<len-1;j++){
            if(parseInt(arr[j].date)>parseInt(arr[j+1].date)){
                temp=arr[j];
                arr[j]=arr[j+1];
                arr[j+1]=temp;
            }
        }
        len--;
    }
    return arr;
} 