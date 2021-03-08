const url = require('url');
const path = require('path');
const base = require('../service/base');
const fs = require('fs');
var dealImages = require('images');
const formidable = require('formidable');
const serviceHomeFileSys = require('../service/homeFileSys');

/************************************* 快照 ********************************************* */

/**
 * 搜索快照列表
 */
this.getShootingList = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    serviceHomeFileSys.getShootingList(params, result => {
        res.send(result);
    });
}

/**
 * 获取指定快照内容
 */
this.getShootingItem = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    serviceHomeFileSys.getShootingItem(params, result => {
        res.send(result);
    });
}

/**************************************************************************************** */

/**
 * 获取目录
 */
this.getKnowledgeTree = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    serviceHomeFileSys.getKnowledgeTree(params, result => {
        res.send(result);
    });
}

/**
 * 新增目录
 */
this.addKnowledgeTree = (req, res, next) => {
    const params = req.body;
    serviceHomeFileSys.addKnowledgeTree(params, result => {
        res.send(result);
    });
}

/**
 * 删除树
 */
this.delKnowledgeTree = (req, res, next) => {
    const params = req.body;
    serviceHomeFileSys.delKnowledgeTree(params, result => {
        res.send(result);
    });
}

/**
 * 重命名
 */
this.renameTree = (req, res, next) => {
    const params = req.body;
    serviceHomeFileSys.renameTree(params, result => {
        res.send(result);
    });
}

/**
 * 移动树
 */
this.removeTree = (req, res, next) => {
    const params = req.body;
    serviceHomeFileSys.removeTree(params, result => {
        res.send(result);
    });
}

/**
 * 拖到节点里面
 */
this.dragNodeIn = (req, res, next) => {
    const params = req.body;
    serviceHomeFileSys.dragNodeIn(params, result => {
        res.send(result);
    });
}

/**
 * 获取文件列表
 */
this.getFileList = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.getFileList(params, result => {
        res.send(result);
    });
}

/**
 * 新增文档
 */
this.createDoc = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.createDoc(params, result => {
        res.send(result);
    });
}

/**
 * 修改所属目录
 */
this.changeTreeId = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.changeTreeId(params, result => {
        res.send(result);
    });
}

/**
 * 重命名文件名
 */
this.renameFile = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.renameFile(params, result => {
        res.send(result);
    });
}

/**
 * 删除文件
 */
this.delFile = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.delFile(params, result => {
        res.send(result);
    });
}

/**
 * 编辑文件内容
 */
this.editFileContent = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.editFileContent(params, result => {
        res.send(result);
    });
}

/**
 * 根据指定文件获取内容以及引用
 */
this.getFileContent = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.getFileContent(params, result => {
        res.send(result);
    });
}

/**
 * 根据关键字搜索文件信息
 */
this.searchFile = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    serviceHomeFileSys.searchFile(params, result => {
        res.send(result);
    });
}

/**
 * 上传excel
 */
this.parseExcel = (req, res, next, cb) => {
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
    const uploadFilePath = '/downloads/knowledgeLib';
    let fileUpload = new saveFileName(uploadFilePath);
	fileUpload.upload(req,(name,fields) => {
        serviceHomeFileSys.parseExcel({
            path: uploadFilePath+'/'+name
        }, result => {
            if (cb) {
                cb(result);
            } else {
                res.send(result);
            }
        });
	});
}

/**
 * 复制文件
 */
this.copyFile = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.copyFile(params, result => {
        res.send(result);
    });
}

/**
 * 编辑文件头信息
 */
this.editFileHead = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.editFileHead(params, result => {
        res.send(result);
    });
}

/**
 * 提交
 */
this.subEdit = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.subEdit(params, result => {
        res.send(result);
    });
}

/**
 * 设为关注或取消
 */
this.fileMark = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.fileMark(params, result => {
        res.send(result);
    });
}

/**
 * 设为重要或取消
 */
this.fileImportant = (req, res, next) => {
    const params = req.body;
    serviceHomeFileSys.fileImportant(params, result => {
        res.send(result);
    });
}

/********************************************************************************************/

/**
 * 获取图库组
 */
this.getGalleryGroup = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.getGalleryGroup(params, result => {
        res.send(result);
    });
}

/**
 * 获取指定图库组信息
 */
this.getGalleryGroupItem = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    serviceHomeFileSys.getGalleryGroupItem(params, result => {
        res.send(result);
    });
}

/**
 * 新增图库组
 */
this.createGalleryGroup = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.createGalleryGroup(params, result => {
        res.send(result);
    });
}

/**
 * 删除图库组
 */
this.delGalleryGroup = (req, res, next) => {
    const params = req.body;
    serviceHomeFileSys.delGalleryGroup(params, result => {
        res.send(result);
    });
}

/**
 * 图库组设为关注或取消
 */
this.galleryMark = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.galleryMark(params, result => {
        res.send(result);
    });
}

/**
 * 图库组修改所属目录和文件名
 */
this.changeGalleryInfo = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.changeGalleryInfo(params, result => {
        res.send(result);
    });
}

/**
 * 修改图片
 */
this.changeAlbum = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.changeAlbum(params, result => {
        res.send(result);
    });
}

/**
 * 多图片上传
 */
this.uploadAlbum = (req, res, next) => {
    const fileArr = req.files;
    const resArr = fileArr.map(items => items.originalname);
    res.send({
        code: 200,
        msg: '上传成功',
        data: resArr,
    });
    resArr.forEach(items => {
        if (items.indexOf('.mp4') === -1) {
            const filePath = DIRNAME + '/public/img/gallery/' + items;
            let newPath = DIRNAME + '/public/img/gallery/list_' + items;
            if (items.indexOf('.svg') !== -1 || items.indexOf('.gif') !== -1) {
                fs.copyFile(filePath, newPath, (err) => {
                    console.log(err);
                });
            } else {
                dealImages(filePath).resize(100).save(newPath,{});
                // downQuality(filePath);
            }
        }
    });

    function downQuality(path) {
        fs.stat(path, (err, result) => {
            if (err) return;
            let { size } = result;
            if (size/1024/1024 > 1) {
                dealImages(path).save(path,{
                    quality : size/1024/1024*10
                });
                downQuality(path);
            }
        });
    }
}

/**************************************************************************************/

/**
 * 文档列表
 */
this.docList = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.docList(params, result => {
        res.send(result);
    });
}

this.fetchSourceByAffairId = (req, res, next) => {
    const params = url.parse(req.url, true).query;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.fetchSourceByAffairId(params, result => {
        res.send(result);
    });
}

/**
 * 新增文档
 */
this.addDoc = (req, res, next) => {
    const file = req.file;
    serviceHomeFileSys.addDoc({
        file,
        param: req.body,
        admin_id: req.session.admin_id,
    }, result => {
        res.send(result);
    });
}

/**
 * 上传临时文件
 */
this.uploadTempDoc = (req, res, next) => {
    const file = req.file;
    const { originalname } = file;
    res.send({
        code: 200,
        msg: '上传成功',
        data: [originalname],
    });
    // const originalPath = DIRNAME + '/downloads/selfDoc/' + originalname;
    // fs.exists(originalPath, result => {
    //     if (!result) {
    //         serviceHomeFileSys.replaceFile({
    //             admin_id: req.session.admin_id,
    //             originalname,
    //             id: data.id,
    //         }, result => {
    //             res.send(result);
    //         });
    //     } else {
    //         res.send({
    //             code: 201,
    //             msg: '文件已存在，是否替换？',
    //             data: [file.originalname],
    //         });
    //     }
    // });
}

/**
 * 提交文档信息
 */
this.updateDocInfo = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.updateDocInfo(params, result => {
        res.send(result);
    });
}

/**
 * 删除文档
 */
this.delDoc = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.delDoc(params, result => {
        res.send(result);
    });
}

/**
 * 文档设为关注或取消
 */
this.docMark = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.docMark(params, result => {
        res.send(result);
    });
}

/**
 * 文档设为重要或不重要
 */
this.docSetImportant = (req, res, next) => {
    const params = req.body;
    serviceHomeFileSys.docSetImportant(params, result => {
        res.send(result);
    });
}

this.gallerySetImportant = async (req, res, next) => {
    const params = req.body;
    const result = await serviceHomeFileSys.gallerySetImportant(params);
    res.send(result);
}

/**
 * 替换文件
 */
this.replaceFile = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.replaceFile(params, result => {
        res.send(result);
    });
}

/**
 * 更新最新文件
 */
this.pushFile = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeFileSys.pushFile(params);
    res.send(result);
}

/**
 * 获取历史版本节点
 */
this.getFileHistoryList = async (req, res, next) => {
    const params = url.parse(req.url, true).query;
    const result = await serviceHomeFileSys.getFileHistoryList(params.id);
    res.send(result);
}

/**
 * 文档资源归并
 * 从事务系统复制到文档库
 */
this.pipeToDoc = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.pipeToDoc(params, result => {
        res.send(result);
    });
}

/**
 * 还原知识库
 */
this.recycleBinRollback = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.recycleBinRollback(params, result => {
        res.send(result);
    });
}

/**
 * 还原图库
 */
this.recycleBinGalleryRollback = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.recycleBinGalleryRollback(params, result => {
        res.send(result);
    });
}

/**
 * 还原文档
 */
this.recycleBinDocRollback = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeFileSys.recycleBinDocRollback(params, result => {
        res.send(result);
    });
}