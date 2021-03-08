const Member = require('../dao').Member;
const base = require('./base');
const aliSms = require('../action/aliSms');
const common = require('./common');

exports.delivery = (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    const { name, phone, goods, no, type } = params;
    channel.ack(msg);
    if (CONFIG.debug) return;
    // 发短信
    aliSms.sendAliSms({
		type: 'deliveryNoti',
		PhoneNumbers: phone,
		TemplateParam: JSON.stringify({
            name,
            goods,
            company: type,
            no,
		}),
	});
    // new base.SMSOverride().sendMsg({
    //     templateid: CONFIG.SMSTemp.deliveryNoti,
    //     mobiles: JSON.stringify([ phone ]),
    //     params: JSON.stringify([ name, goods, type, no ]),
    // }, result => {
    //     console.log(result);
    // });
    LOG('deliveryNoti<<>>' + phone +'<<>>' + name + '<<>>' + goods + '<<>>' + type + '<<>>' + no);
}

exports.creditReminder = (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    const { name, phone, date, over_price, over_time } = params;
    const newDate = new Date(date).getFullYear() + '年' + Number(new Date(date).getMonth() + 1) + '月' + new Date(date).getDate() + '日';
    // console.log(newDate);
    channel.ack(msg);
    if (CONFIG.debug) return;
    // 发短信
    aliSms.sendAliSms({
		type: 'creditNoti',
		PhoneNumbers: phone,
		TemplateParam: JSON.stringify({
            name,
            time: newDate,
            amount: over_price,
            num: over_time,
		}),
	});
    // new base.SMSOverride().sendMsg({
    //     templateid: CONFIG.SMSTemp.creditNoti,
    //     mobiles: JSON.stringify([ phone ]),
    //     params: JSON.stringify([ name, newDate, over_price, over_time ]),
    // }, result => {
    //     console.log(result);
    // });
    LOG('creditNoti<<>>' + phone +'<<>>' + name + '<<>>' + newDate + '<<>>' + over_price + '<<>>' + over_time);
}

exports.birthNoti = (msg, channel) => {
    const params = JSON.parse(msg.content.toString());
    channel.ack(msg);
    if (CONFIG.debug) return;
    // 发短信
    aliSms.sendAliSms({
		type: 'birthNoti',
		PhoneNumbers: params.phone,
		TemplateParam: JSON.stringify({
			name: params.name,
		}),
    });
    common.middleMsg({
        openid: params.open_id,
        name: [params.name],
        phone: [params.phone],
        title: '生日提醒',
        message: '在这个美好的日子里，朗杰VIP俱乐部为您送上最真挚的祝福，恭祝您生日快乐，幸福平安！',
        sender: 'system',
    }, () => {});
    LOG('birthMsg<<>>' + params.phone + '<<>>' + params.name);
}