const Member = require('../dao').Member;
const Customers = require('../dao').Customers;
const base = require('./base');
const aliSms = require('../action/aliSms');
const bluebird = require('bluebird');

exports.payArrival = (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    const { company, amount, arrival } = params;
    Member.findAll({
        where: {
            company,
            checked: 1,
            job: {
                '$like': '%财务%',
            },
        },
    }).then(result => {
        const _p = [];
        result.forEach((items, index) => {
            _p[index] = new Promise((resolve, reject) => {
                if (CONFIG.debug) return resolve();
                const newDate = new Date(arrival).getFullYear() + '年' + Number(new Date(arrival).getMonth() + 1) + '月' + new Date(arrival).getDate() + '日';
                // 发短信
                aliSms.sendAliSms({
                    type: 'arrivalPayNoti',
                    PhoneNumbers: items.dataValues.phone,
                    TemplateParam: JSON.stringify({
                        name: items.dataValues.name,
                        time: newDate,
                        company,
                        amount,
                    }),
                });
                LOG('payArrival<<>>' + items.dataValues.phone +'<<>>' + items.dataValues.name + '<<>>' + newDate + '<<>>' + company + '<<>>' + amount);
                resolve();
            });
        });
        return Promise.all(_p).then(() => {
            LOG(company + '到账短信通知完成');
            channel.ack(msg);
        }).catch(e => { throw e });
    }).catch(e => LOG(e));
}

exports.newCoupon = async (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    const { user_id } = params;
    const couponArr = params.totalNoArr;
    // 抵价券描述
    const no = couponArr[0];
    const num = couponArr.length;
    // let couponStr = '';
    // if (couponArr.length < 4) {
    //     couponArr.forEach(items => couponStr += items + '，');
    //     couponStr = couponStr.slice(0, couponStr.length - 1);
    //     couponStr += '抵价券' + couponArr.length + '张';
    // } else {
    //     couponStr = couponArr[0] + '等' + couponArr.length + '张抵价券';
    // }
    const newDate = new Date().getFullYear() + '年' + Number(new Date().getMonth() + 1) + '月' + new Date().getDate() + '日';
    const customerRes = await Customers.findOne({ where: {user_id} });
    let memberRes;
    if (customerRes) {
        const { company } = customerRes.dataValues;
        memberRes = await Member.findAll({
            where: {
                company,
                checked: 1,
                isdel: 0,
                job: {$like: '%财务%'},
            },
        });
    } else {
        memberRes = await Member.findAll({
            where: {
                user_id,
            },
        });
    }
    await bluebird.map(memberRes, async items => {
        await new Promise(async resolve => {
            if (CONFIG.debug) {
                resolve();
                return;
            }
            const { name, phone } = items.dataValues;
            aliSms.sendAliSms({
                type: 'addCoup',
                PhoneNumbers: phone,
                TemplateParam: JSON.stringify({
                    name,
                    time: newDate,
                    no,
                    num,
                }),
            });
            resolve();
        });
    }, { concurrency: 1 });
    // const _p = [];
    // memberRes.forEach((items, index) => {
    //     _p[index] = new Promise((resolve, reject) => {
    //         if (CONFIG.debug) return resolve();
    //         const { name, phone } = items.dataValues;
    //         aliSms.sendAliSms({
    //             type: 'addCoup',
    //             PhoneNumbers: phone,
    //             TemplateParam: JSON.stringify({
    //                 name,
    //                 time: newDate,
    //                 no,
    //                 num,
    //             }),
    //         });
    //         resolve();
    //     });
    // });
    // await Promise.all(_p);
    console.log('抵价券新增已通知');
    channel.ack(msg);
}

exports.useCoupon = async (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    const { contracts_head, contracts_offer } = params;
    // 通知财务，使用了抵价券
    const { contract_no } = contracts_head;
    const couponArr = [];
    contracts_offer.forEach((items, index) => {
        if (items.coupon_no) {
            couponArr.push(items.coupon_no);
        }
    });
    if (couponArr.length === 0) {
        channel.ack(msg);
        return;
    }
    // 抵价券描述
    const no = couponArr[0];
    const num = couponArr.length;
    // let couponStr = '';
    // if (couponArr.length < 4) {
    //     couponArr.forEach(items => couponStr += items + '，');
    //     couponStr = couponStr.slice(0, couponStr.length - 1);
    //     couponStr += '抵价券' + couponArr.length + '张';
    // } else {
    //     couponStr = couponArr[0] + '等' + couponArr.length + '张抵价券';
    // }
    const customerRes = await Customers.findOne({ where: {abb: contracts_head.cus_abb} });
    const { company } = customerRes.dataValues;
    const memberRes = await Member.findAll({
        where: {
            company,
            checked: 1,
            isdel: 0,
            job: {$like: '%财务%'},
        },
    });
    const newDate = new Date().getFullYear() + '年' + Number(new Date().getMonth() + 1) + '月' + new Date().getDate() + '日';
    await bluebird.map(memberRes, async items => {
        await new Promise(async resolve => {
            if (CONFIG.debug) {
                resolve();
                return;
            }
            const { name, phone } = items.dataValues;
            aliSms.sendAliSms({
                type: 'consumeCoup',
                PhoneNumbers: phone,
                TemplateParam: JSON.stringify({
                    name,
                    time: newDate,
                    no,
                    num,
                    contractNo: contract_no,
                }),
            });
            resolve();
        });
    }, { concurrency: 1 });
    // const _p = [];
    // memberRes.forEach((items, index) => {
    //     _p[index] = new Promise((resolve, reject) => {
    //         if (CONFIG.debug) return resolve();
    //         const { name, phone } = items.dataValues;
    //         aliSms.sendAliSms({
    //             type: 'consumeCoup',
    //             PhoneNumbers: phone,
    //             TemplateParam: JSON.stringify({
    //                 name,
    //                 time: newDate,
    //                 no,
    //                 num,
    //                 contractNo: contract_no,
    //             }),
    //         });
    //         resolve();
    //     });
    // });
    // await Promise.all(_p);
    console.log('抵价券使用已通知');
    channel.ack(msg);
}