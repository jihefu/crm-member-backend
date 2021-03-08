const url = require('url');
const path = require('path');
const request = require('request');
const formidable = require('formidable');
const fs = require('fs');
const base = require('../service/base');
const querystring = require('querystring');
const serviceHomeNotiPost = require('../service/homeNotiSystem');

/**
 *  新增邮件
 */
this.notiClientAdd = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeNotiPost.notiClientAdd({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  获取指定邮件
 */
this.getTargetMail = (req,res,next) => {
    const { mailId } = req.params;
    serviceHomeNotiPost.getTargetMail({
        mailId: mailId
    },result => {
        res.send(result);
    });
}

/**
 *  获取邮件列表
 */
this.notiClientList = (req,res,next) => {
    const form_data = url.parse(req.url,true).query;
    const admin_id = req.session.admin_id;
    serviceHomeNotiPost.notiClientList({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 * 拉取指定事务资源
 */
this.getResourse = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeNotiPost.getResourse(params,result => {
        res.send(result);
    });
}

/**
 *  撤回
 */
this.notiClientRecall = (req,res,next) => {
    const { mailId } = req.body;
    serviceHomeNotiPost.notiClientRecall({
        mailId: mailId
    },result => {
        res.send(result);
    });
}

/**
 *  邮件主体更新（幂等）
 */
this.notiClientUpdate = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeNotiPost.notiClientUpdate({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  邮件回执更新（幂等）
 */
this.notiClientSubUpdate = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeNotiPost.notiClientSubUpdate({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  图片上传
 */
this.imgUpload = (req,res,next) => {
    let mulUploadImg = new base.MulUploadImg('/public/img/notiClient');
	mulUploadImg.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
        });
        mulUploadImg.resize();
        mulUploadImg.smallSize();
	});
}

/**
 *  文件上传
 */
this.fileUpload = (req,res,next,filePath) => {
    class saveFileName extends base.FileUpload {
        constructor(props){
            super(props);
        }

        upload(req,cb){
            var form = new formidable.IncomingForm();
            var that = this;
            form.encoding = 'utf-8'; 
            form.uploadDir = DIRNAME+'/downloads';
            form.keepExtensions = true; //保留后缀
            form.type = true;
            form.parse(req, function(err, fields, files) {
                if(err){
                    LOG(err);
                    return;
                }
                var extName = ''; 
                var in_arr = files.file.path.split('.');
                extName = in_arr[in_arr.length-1];
                that.name = files.file.name;
                // that.name = Date.now()+'.'+extName;
                var path = that.uploadDir.split('/downloads/')[1];
                var path_arr = path.split('/');
                var path_str = DIRNAME+'/downloads';
                path_arr.forEach(function(items,index){
                    path_str += '/'+items;
                    if(!fs.existsSync(path_str)) fs.mkdirSync(path_str);
                });
                var img_name = that.name?'\\'+that.name:files.file.path.split('\\downloads')[1];
                var new_path = path_str + img_name;
                fs.renameSync(files.file.path, new_path);
                that.path = new_path;
                cb(that.name,fields);
            });
        }
    }
    const uploadFilePath = filePath ? filePath : '/downloads/notiClient';
    let fileUpload = new saveFileName(uploadFilePath);
	fileUpload.upload(req,(name,fields) => {
		res.send({
			code: 200,
			msg: '上传成功',
			data: [name]
        });
	});
}

/**
 *  添加回复
 */
this.addReply = (req,res,next) => {
    const form_data = req.body;
    const admin_id = req.session.admin_id;
    serviceHomeNotiPost.addReply({
        form_data: form_data,
        admin_id: admin_id
    },result => {
        res.send(result);
    });
}

/**
 *  转发消息
 */
this.forwardMsg = (req,res,next) => {
    const data = req.body.data;
    request.post(ROUTE('notiPost/add?regName=justRead'),(err,response,body) => {
        res.send(body);
    }).form({
        data: data
    });
}

/**
 *  来自notiPost的更新
 */
this.fromNotiPostUpdate = (req,res,next) => {
    const data = JSON.parse(req.body.data);
    serviceHomeNotiPost.fromNotiPostUpdate({
        form_data: data
    },result => {
        res.send(result);
    });
}

/**
 *  来自通知中心的更新，需重定向
 */
this.fromCenterUpdate = (req,res,next) => {
    const form_data = req.body;
    const token = encodeURIComponent(req.headers['token']);
    request.put(ROUTE('notiPost/fromCenterUpdate?token='+token),(err,response,body) => {
        body = typeof(body)=='object'?body:JSON.parse(body);
        res.send(body);
    }).form({
        form_data: JSON.stringify(form_data)
    });
}

/**
 *  来自通知中心的更新reply，需重定向
 */
this.fromCenterUpdateReply = (req,res,next) => {
    const form_data = req.body;
    const token = encodeURIComponent(req.headers['token']);
    request.put(ROUTE('notiPost/fromCenterUpdateReply?token='+token),(err,response,body) => {
        body = typeof(body)=='object'?body:JSON.parse(body);
        res.send(body);
    }).form({
        form_data: JSON.stringify(form_data)
    });
}

/**
 *  来自通知中心的get，需重定向
 */
this.fromCenterList = (req,res,next) => {
    const form_data = url.parse(req.url,true).query;
    form_data.admin_id = req.session.admin_id;
    const str = querystring.stringify(form_data);
    request.get(ROUTE('notiPost/fromCenterList?'+str),(err,response,body) => {
        try{
            body = typeof(body)=='object'?body:JSON.parse(body);
            res.send(body);
        }catch(e){
            res.send({
                code: 200,
                msg: '',
                data: []
            });
        }
    });
}

/**
 *  获取消息盒子内容
 */
this.msgBoxList = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeNotiPost.msgBoxList(params,result => {
        res.send(result);
    });
}

this.fetchDeadLine = (req, res, next) => {
    const params = url.parse(req.url,true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeNotiPost.fetchDeadLine(params,result => {
        res.send(result);
    });
}

/**
 * 通知业务员指定公司信用余额不足
 */
exports.notiSaleman = async (req, res, next) => {
    const { company } = req.body;
    const { admin_id } = req.session;
    const result = await serviceHomeNotiPost.notiSaleman({
        company,
        admin_id,
    });
    res.send(result);
}

/**
 * 转移消息到指定事务
 */
exports.transferMsg = async (req, res) => {
    const params = req.body;
    const result = await serviceHomeNotiPost.transferMsg(params);
    res.send(result);
}