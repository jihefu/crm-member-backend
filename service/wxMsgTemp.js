const request = require('request');
const moment = require('moment');
const Customers = require('../dao').Customers;
const ContractsHead = require('../dao').ContractsHead;
const Member = require('../dao').Member;
const aliSms = require('../action/aliSms');

const webHost = CONFIG.proxy_protocol+'://'+CONFIG.proxy_host+':'+CONFIG.proxy_port;

async function getToken() {
    const access_token = await new Promise(async resolve => {
        request.get(webHost + '/wx/getToken',(err,response,body) => {
            body = typeof(body)=='object'?body:JSON.parse(body);
            let access_token;
            try{
                access_token = body.data.access_token;
            }catch(e){
                access_token = body.access_token;
            }
            resolve(access_token);
        });
    });
    return access_token;
}

async function send(access_token, formData) {
    if (CONFIG.debug) {
        return;
    }
    const requestUrl = 'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=' + access_token;
    request.post(requestUrl, (err, response, body) => {
        LOG(body);
    }).form(JSON.stringify(formData));
}

async function getPurchaseArrByContractNo(contract_no) {
    const contractEntity = await ContractsHead.findOne({ where: { contract_no, isdel: 0 } });
    const { cus_abb } = contractEntity.dataValues;
    const customerEntity = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
    const { company } = customerEntity.dataValues;
    const memberList = await Member.findAll({ where: { company, checked: 1, isdel: 0, job: { $like: '%采购%' } } });
    return memberList;
}

async function getBossByContractNo(contract_no) {
    const contractEntity = await ContractsHead.findOne({ where: { contract_no, isdel: 0 } });
    const { cus_abb } = contractEntity.dataValues;
    const customerEntity = await Customers.findOne({ where: { abb: cus_abb, isdel: 0 } });
    const { company } = customerEntity.dataValues;
    const memberList = await Member.findAll({ where: { company, checked: 1, isdel: 0 } });
    let info;
    for (let i = 0; i < memberList.length; i++) {
        const items = memberList[i].dataValues;
        if (items.job.indexOf('法人') !== -1 || items.job.indexOf('合伙人') !== -1) {
            info = items;
            break;
        }
    }
    return info;
}

const tempMapper = {
    newContract: 'mnhmvstTbnurKAgidUdwXZCuBtgEhZIuxU7SxPazTS4',
    deliveryPack: 'W2JZD1WczK36Q9qyBuLDofP6P330YOXaPWVbtq6VU_E',
    contractTake: 'E6D70OihWW1WOjBMP3IUGtOvbbkZeRD4VfkuCfMpmFo',
};

/**
 * 新合同
 */
exports.newContract = async params => {
    const { contract_no, first, remark, payable, company, delivery_state } = params;
    const formData = {
        touser: 'oxIzxsszYtz1i-Bf6oR86jRQE1pQ',
        template_id: tempMapper.newContract,
        url: webHost + '/contract/head/' + contract_no,
        data: {
            first: { value: first },
            keyword1: { value: contract_no },
            keyword2: { value: payable },
            keyword3: { value: company },
            keyword4: { value: delivery_state },
            remark: { value: remark },
        }
    };
    const access_token = await getToken();
    const memberList = await getPurchaseArrByContractNo(contract_no);
    memberList.forEach(items => {
        formData.touser = items.dataValues.open_id;
        send(access_token, formData);
    });
}

/**
 * 装箱单发货
 */
exports.deliveryPack = async params => {
    const { contract_no, first, remark, sendTime, deliveryCompany, expressNo, info, totalSend } = params;
    const formData = {
        touser: 'oxIzxsszYtz1i-Bf6oR86jRQE1pQ',
        template_id: tempMapper.deliveryPack,
        url: webHost + '/contract/head/' + contract_no,
        data: {
            first: { value: first },
            keyword1: { value: contract_no },
            keyword2: { value: moment(sendTime).format('YYYY-MM-DD HH:mm:ss') },
            keyword3: { value: deliveryCompany },
            keyword4: { value: expressNo },
            keyword5: { value: info },
            remark: { value: remark },
        }
    };
    const access_token = await getToken();
    const memberList = await getPurchaseArrByContractNo(contract_no);
    memberList.forEach(items => {
        formData.touser = items.dataValues.open_id;
        send(access_token, formData);
    });
    if (totalSend) {
        // 发货全部完成，短信通知
        if (memberList.length !== 0) {
            // 给采购发短信
            memberList.forEach(items => {
                aliSms.sendAliSms({
                    type: 'goodsTotalSend',
                    PhoneNumbers: items.dataValues.phone,
                    TemplateParam: JSON.stringify({
                        no: contract_no,
                    }),
                });
            });
        } else {
            // 给老板发短信
            const memberEntity = await getBossByContractNo(contract_no);
            if (memberEntity) {
                aliSms.sendAliSms({
                    type: 'goodsTotalSendForBoss',
                    PhoneNumbers: memberEntity.phone,
                    TemplateParam: JSON.stringify({
                        no: contract_no,
                    }),
                });
            }
        }
    }
}

/**
 * 合同确认收货
 */
exports.contractTake = async params => {
    const { first, contract_no, time, remark } = params;
    const formData = {
        touser: 'oxIzxsszYtz1i-Bf6oR86jRQE1pQ',
        template_id: tempMapper.contractTake,
        url: webHost + '/contract/head/' + contract_no,
        data: {
            first: { value: first },
            keyword1: { value: contract_no },
            keyword2: { value: moment(time).format('YYYY-MM-DD HH:mm:ss') },
            remark: { value: remark },
        }
    };
    const access_token = await getToken();
    const memberList = await getPurchaseArrByContractNo(contract_no);
    memberList.forEach(items => {
        formData.touser = items.dataValues.open_id;
        send(access_token, formData);
    });
}