const url = require('url');
const path = require('path');
const serviceHomeSmsTemp = require('../service/homeSmsTemp');

/**
 * 获取群发对象
 */
this.getReceiver = async (req, res, next) => {
    const result = await serviceHomeSmsTemp.getReceiver();
    res.send(result);
}

/**
 * 获取消息模板
 */
this.getTemp = async (req, res, next) => {
    const result = await serviceHomeSmsTemp.getTemp();
    res.send(result);
}

this.getLog = async (req, res, next) => {
    const result = await serviceHomeSmsTemp.getLog();
    res.send(result);
}

/**
 * 发送
 */
this.sendSms = async (req, res, next) => {
    const params = req.body;
    params.admin_id = req.session.admin_id;
    try {
        const resultData = await serviceHomeSmsTemp.sendSms(params);
        res.send(resultData); 
    } catch (e) {
        console.log(e);
    }
}