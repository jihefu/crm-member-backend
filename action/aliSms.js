const Core = require('@alicloud/pop-core');
const SmsLog = require('../dao').SmsLog;

const client = new Core({
    accessKeyId: 'LTAIYzXUFad2J1Az',
    accessKeySecret: 'gIX39ZAwTlx9HpR1Ut2W8PivYW8Abn',
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25',
});

const SIGNNAME = '朗杰测控';

const smsObj = {
    vCode: { TemplateCode: 'SMS_173951203' },
    regCode: { TemplateCode: 'SMS_172598700' },
    softRegCode: { TemplateCode: 'SMS_172603827' },
    memberSendToStaff: { TemplateCode: 'SMS_172603849' },
    idVerNoti: { TemplateCode: 'SMS_172603860' },
    serviceCb: { TemplateCode: 'SMS_172603879' },
    birthNoti: { TemplateCode: 'SMS_172598914' },
    creditNoti: { TemplateCode: 'SMS_172598922' },
    deliveryNoti: { TemplateCode: 'SMS_172603896' },
    arrivalPayNoti: { TemplateCode: 'SMS_172603901' },
    addCoup: { TemplateCode: 'SMS_205122425' },
    consumeCoup: { TemplateCode: 'SMS_205137404' },
    goodsTotalSend: { TemplateCode: 'SMS_192575416' },
    goodsTotalSendForBoss: { TemplateCode: 'SMS_192530362' },
};

exports.sendAliSms = async params => {
    const { PhoneNumbers, TemplateParam, type } = params;
    // log短信记录
    SmsLog.create({
        templateCode: type,
        phoneNumbers: PhoneNumbers,
        templateParam: TemplateParam,
        time: TIME(),
    });
    if (CONFIG.debug) return { code: -1, msg: '发送失败' };
    let result;
    try {
        result = await client.request('SendSms', {
            signName: SIGNNAME,
            TemplateCode: smsObj[type] ? smsObj[type].TemplateCode : type,
            PhoneNumbers,
            TemplateParam,
        }, {
            method: 'POST'
        });
    } catch (e) {
        result = e;
    }
    if (result && result.Code === 'OK') return { code: 200, msg: '发送成功' };
    LOG(result);
    return { code: -1, msg: '发送失败' };
}