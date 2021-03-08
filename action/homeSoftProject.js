const url = require('url');
const path = require('path');
const actionNotiSystem = require('../action/homeNotiSystem');
const serviceHomeSoftProject = require('../service/homeSoftProject');

/**
 * 根据更新事件获取列表
 */
this.getListByUpdateTime = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeSoftProject.getListByUpdateTime(params,result => {
        res.send(result);
    });
}

/**
 * 获取一级列表和二级列表
 */
this.getClsList = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeSoftProject.getClsList(params,result => {
        res.send(result);
    });
}

/**
 * 根据树标题获取列表
 */
this.getListByProjectTitle = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeSoftProject.getListByProjectTitle(params,result => {
        res.send(result);
    });
}

/**
 * 项目星标
 */
this.isStar = (req,res,next) => {
    const params = req.body;
    serviceHomeSoftProject.isStar(params,result => {
        res.send(result);
    });
}

/** 
 * 开发者列表
 */
this.developList = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeSoftProject.developList(params,result => {
        res.send(result);
    });
}

/**
 * 根据开发者获取列表
 */
this.getListByDevelop = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeSoftProject.getListByDevelop(params,result => {
        res.send(result);
    });
}

/**
 * 根据工程id获取版本列表
 */
this.getVersionListById = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeSoftProject.getVersionListById(params,result => {
        res.send(result);
    });
}

/**
 * 根据工程id获取工程属性
 */
this.getPropertyBySoftProjectId = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeSoftProject.getPropertyBySoftProjectId(params,result => {
        res.send(result);
    });
}

/**
 * 创建软件工程
 */
this.createProject = (req,res,next) => {
    const params = req.body;
    params.createTime = TIME();
    params.createPerson = req.session.admin_id;
    serviceHomeSoftProject.createProject(params,result => {
        res.send(result);
    });
}

/**
 * 修改软件工程属性
 */
this.updateProjectProperty = (req,res,next) => {
    const params = req.body;
    serviceHomeSoftProject.updateProjectProperty(params,result => {
        res.send(result);
    });
}

/**
 * 发布新版本
 */
this.pushNewVersion = (req,res,next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeSoftProject.pushNewVersion(params,result => {
        res.send(result);
    });
}

this.pushNewChildVersion = async (req,res,next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    const result = await serviceHomeSoftProject.pushNewChildVersion(params);
    res.send(result);
}

/**
 * 替换包名和发布说明，并且把原来的包移除掉
 */
this.recoverVersion = (req,res,next) => {
    const params = req.body;
    params.updateTime = TIME();
    params.updatePerson = req.session.admin_id;
    serviceHomeSoftProject.recoverVersion(params,result => {
        res.send(result);
    });
}

this.recoverChildVersion = async (req, res, next) => {
    const params = req.body;
    params.updateTime = TIME();
    params.updatePerson = req.session.admin_id;
    const result = await serviceHomeSoftProject.recoverChildVersion(params);
    res.send(result);
}

/**
 * 发表测评
 */
this.createTestReport = (req,res,next) => {
    const params = req.body;
    serviceHomeSoftProject.createTestReport({
        formData: params,
        admin_id: req.session.admin_id
    },result => {
        res.send(result);
    });
}

/**
 * 修改对外发布
 */
this.changeRelease = (req,res,next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeSoftProject.changeRelease(params,result => {
        res.send(result);
    });
}

/**
 * 修改测试状态
 */
this.changeTestStatus = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeSoftProject.changeTestStatus(params,result => {
        res.send(result);
    });
}

/**
 * 上传工程文档和测评文件
 */
this.uploadProjectFile = (req,res,next) => {
    actionNotiSystem.fileUpload(req,res,next,'/downloads/projectFile');
}

/**
 * 根据文件名获取文件属性
 */
this.getFilePropsByName = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeSoftProject.getFilePropsByName(params,result => {
        res.send(result);
    });
}

/**
 * 获取所有工程名
 */
this.getAllProjectName = (req,res,next) => {
    const params = url.parse(req.url,true).query;
    serviceHomeSoftProject.getAllProjectName(params,result => {
        res.send(result);
    });
}

/**
 * 发言
 */
this.leaveMessage = (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    serviceHomeSoftProject.leaveMessage(params,result => {
        res.send(result);
    });
}

this.getTotalOpenSoft = async (req, res, next) => {
    const result = await serviceHomeSoftProject.getTotalOpenSoft();
    res.send(result);
}