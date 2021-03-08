const sequelize = require('../dao').sequelize;
const SmsTemp = require('../dao').SmsTemp;
const SmsReceiver = require('../dao').SmsReceiver;
const Member = require('../dao').Member;
const Contacts = require('../dao').Contacts;
const BaseEvent = require('../dao').BaseEvent;
const base = require('./base');
const common = require('./common');
const SubEventContent = require('../mongoModel/SubEventContent');
const aliSms = require('../action/aliSms');
const bluebird = require('bluebird');

/**
 * 获取群发对象
 */
this.getReceiver = async () => {
    const result = await SmsReceiver.findAll();
    return {
        code: 200,
        msg: '查询成功',
        data: result,
    };
}

/**
 * 获取消息模板
 */
this.getTemp = async () => {
    const result = await SmsTemp.findAll();
    return {
        code: 200,
        msg: '查询成功',
        data: result,
    };
}

this.getLog = async () => {
    const result = await BaseEvent.findAll({
        where: {
            type: '1601',
        },
        order: [[ 'id', 'DESC' ]],
    });
    const receiverMapper = {}, smsMapper = {};
    const receiverArr = await SmsReceiver.findAll();
    const smsArr = await SmsTemp.findAll();
    receiverArr.forEach((items, index) => {
        receiverMapper[items.dataValues.id] = items.dataValues;
    });
    smsArr.forEach((items, index) => {
        smsMapper[items.dataValues.smsId] = items.dataValues;
    });
    const staffMap = new base.StaffMap().getStaffMap();

    const _p = [];
    result.forEach((items, index) => {
        _p[index] = new Promise((resolve, reject) => {
            const _id = items.dataValues.contentId;
            const i = index;
            SubEventContent.findById(_id, (err, r) => {
                result[i].dataValues.content = r;
                result[i].dataValues.smsReceiverText = receiverMapper[r.smsReceiverId]['smsReceiverText'];
                try {
                    result[i].dataValues.smsName = smsMapper[r.smsId]['smsName'];
                } catch (e) {
                    
                }
                result[i].dataValues.personName = staffMap[result[i].dataValues.person].user_name;
                resolve();
            });
        });
    });
    await Promise.all(_p);
    return {
        code: 200,
        msg: '查询成功',
        data: result,
    };
}

/**
 * 发送
 */
this.sendSms = async params => {
    let { selectedReceiverId, selectedSmsId, varParams, phoneArr, admin_id } = params;
    varParams = JSON.parse(varParams);
    phoneArr = JSON.parse(phoneArr);
    const totalReceiverArr = await getReceiverArr();
    common.createEvent({
        headParams: {
            person: admin_id,
            time: TIME(),
            type: '1601',
            ownerId: admin_id,
        },
        bodyParams: {
            smsId: selectedSmsId,
            smsReceiverId: selectedReceiverId,
            smsParams: varParams,
            smsTotalReceiverArr: totalReceiverArr,
        },
    }, result => {});
    // 获取对应数据库短信模板
    const tempEntity = await SmsTemp.findOne({ where: {smsId: selectedSmsId} });
    let tempEntityArr;
    try {
        tempEntityArr = tempEntity.dataValues.smsVar.split(',');
    } catch (e) {
        tempEntityArr = [];
    }
    if (varParams.indexOf('autoBind') === -1) {
        // 直接数组方式群发
        return await groupSend();
    } else {
        // 个性化接收者姓名，需要逐条发送
        return await sendOneByOne();
    }

    // 获取接收者
    async function getReceiverArr() {
        switch (selectedReceiverId) {
            case 1:   // 会员
                const result = await Member.findAll({attributes: [ 'name', 'phone', 'gender' ], where: {isdel: 0}});
                return result.map(items => items.dataValues);
                break;
            case 2:   // 认证联系人
                const result2 = await Contacts.findAll({attributes: [ 'name', 'phone1', 'sex' ], where: {verified: 1, isdel: 0}});
                return result2.map(items => {
                    return {
                        name: items.dataValues.name,
                        phone: items.dataValues.phone1,
                        gender: items.dataValues.sex,
                    };
                });
                break;
            case 3:   // 认证联系人和会员
                const resultMember = await Member.findAll({attributes: [ 'name', 'phone', 'gender' ], where: {isdel: 0}});
                const resultContacts = await Contacts.findAll({attributes: [ 'name', 'phone1', 'sex' ], where: {verified: 1, isdel: 0}});
                const hashMapper = {}, resultArr = [];
                resultMember.forEach((items, index) => {
                    if (!hashMapper[items.dataValues.phone]) {
                        hashMapper[items.dataValues.phone] = 1;
                        resultArr.push(items.dataValues);
                    }
                });
                resultContacts.forEach((items, index) => {
                    if (!hashMapper[items.dataValues.phone1]) {
                        hashMapper[items.dataValues.phone1] = 1;
                        resultArr.push({
                            name: items.dataValues.name,
                            phone: items.dataValues.phone1,
                            gender: items.dataValues.sex,
                        });
                    }
                });
                return resultArr;
                break;
            case 4:   // 用户自定义姓名电话或电话
                return phoneArr;
                break;
            case 5:   // 用户自定义电话
                return phoneArr;
                break;
            default:
                return phoneArr;
                break;
        }
    }

    // 每100条群发
    async function groupSend() {
        const len = Math.ceil(totalReceiverArr.length / 100);
        const arr = new Array(len);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = [];
        }
        let indexPointer = 0;
        totalReceiverArr.forEach((items, index) => {
            if (arr[indexPointer].length > 99) indexPointer++;
            arr[indexPointer].push(items);
        });
        const smsVarObj = {};
        tempEntityArr.forEach((items, index) => {
            smsVarObj[items] = varParams[index];
        });
        await bluebird.map(arr, async items => {
            const phoneArr = items.map(items => items.phone);
            await new Promise(resolve => {
                aliSms.sendAliSms({
                    type: selectedSmsId,
                    PhoneNumbers: phoneArr.join(),
                    TemplateParam: JSON.stringify(smsVarObj),
                }).then(result => {
                    resolve(result);
                });
            });
        }, { concurrency: 1 });
        // arr.forEach((items, index) => {
        //     _p[index] = new Promise((resolve, reject) => {
        //         const phoneArr = items.map(items => items.phone);
        //         aliSms.sendAliSms({
        //             type: selectedSmsId,
        //             PhoneNumbers: phoneArr.join(),
        //             TemplateParam: JSON.stringify(smsVarObj),
        //         }).then(result => {
        //             resolve(result);
        //         });
        //     });
        // });
        return { code: 200, msg: '发送成功' };
    }

    // 逐条发送
    async function sendOneByOne() {
        await bluebird.map(totalReceiverArr, async items => {
            const it = items;
            const { name, phone, gender } = it;
            let sex = '';
            if (gender === '男') {
                sex = '先生';
            } else if (gender === '女') {
                sex = '女士';
            }
            const newName = name + sex;
            const newVarParams = JSON.parse(JSON.stringify(varParams));
            newVarParams.forEach((items, index) => {
                if (items === 'autoBind') {
                    newVarParams[index] = newName;
                }
            });
            const smsVarObj = {};
            tempEntityArr.forEach((items, index) => {
                smsVarObj[items] = newVarParams[index];
            });
            const phoneArr = [phone];
            await new Promise(resolve => {
                aliSms.sendAliSms({
                    type: selectedSmsId,
                    PhoneNumbers: phoneArr.join(),
                    TemplateParam: JSON.stringify(smsVarObj),
                }).then(result => {
                    resolve(result);
                });
            });
        }, { concurrency: 1 });
        return { code: 200, msg: '发送成功' };
    }

    // 逐条发送
    // async function sendOneByOne() {
    //     const _p = [];
    //     totalReceiverArr.forEach((items, index) => {
    //         _p[index] = new Promise((resolve, reject) => {
    //             const it = items;
    //             const { name, phone, gender } = it;
    //             let sex = '';
    //             if (gender === '男') {
    //                 sex = '先生';
    //             } else if (gender === '女') {
    //                 sex = '女士';
    //             }
    //             const newName = name + sex;
    //             const newVarParams = JSON.parse(JSON.stringify(varParams));
    //             newVarParams.forEach((items, index) => {
    //                 if (items === 'autoBind') {
    //                     newVarParams[index] = newName;
    //                 }
    //             });
    //             const smsVarObj = {};
    //             tempEntityArr.forEach((items, index) => {
    //                 smsVarObj[items] = newVarParams[index];
    //             });
    //             const phoneArr = [phone];
    //             // console.log(selectedSmsId);
    //             // console.log(phoneArr);
    //             // console.log(smsVarObj);
    //             aliSms.sendAliSms({
    //                 type: selectedSmsId,
    //                 PhoneNumbers: phoneArr.join(),
    //                 TemplateParam: JSON.stringify(smsVarObj),
    //             }).then(result => {
    //                 resolve(result);
    //             });
    //             // new base.SMSOverride().sendMsg({
    //             //     templateid: selectedSmsId,
    //             //     mobiles: JSON.stringify(phoneArr),
    //             //     params: JSON.stringify(newVarParams),
    //             // }, result => {
    //             //     result = typeof result === 'string' ? JSON.parse(result) : result;
    //             //     resolve(result);
    //             // });
    //         });
    //     });
    //     const result = await Promise.all(_p);
    //     return result[0];
    // }
}