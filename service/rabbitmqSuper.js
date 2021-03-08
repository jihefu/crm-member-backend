const langjiemq = require('langjiemq/dist');
const homeContracts = require('./homeContracts');
const homeCustomers = require('./homeCustomers');
const homeEndUser = require('./homeEndUser');
const homeVerUnit = require('./homeVerUnit');
const Member = require('../dao').Member;
const EndUser = require('../dao').EndUser;
const Customers = require('../dao').Customers;
const Products = require('../dao').Products;
const homeSnCreateTool = require('./homeSnCreateTool');
const SnCreateTool = require('../dao').SnCreateTool;
const homeVir = require('./homeVir');
const hybrid_app = require('./hybrid_app');
var VirWarranty = require('../dao').VirWarranty;
var ContractsHead = require('../dao').ContractsHead;
const productUser = require('./productUser');
const getPinYin = require('./getPinYin');
var VirtualProducts = require('../dao').VirtualProducts;
const request = require('request');
const { RabbitmqFactory, ConsumerMq, ProducerMq } = langjiemq;
RabbitmqFactory.host = CONFIG.proxy_host;
RabbitmqFactory.user = CONFIG.rabbitMQAccount;
RabbitmqFactory.password = CONFIG.rabbitMQPassword;
const admin_id = 101;

async function dealCustomer(user_id, isUser, name, company) {

    async function checkUnion(company, cn_abb, abb) {
        const customerEntity = await Customers.findOne({
            where: {
                $or: {
                    company,
                    cn_abb,
                    abb,
                },
            },
        });
        if (customerEntity) {
            company = company + user_id;
            cn_abb = cn_abb + user_id;
            abb = abb + user_id;
            return checkUnion(company, cn_abb, abb);
        }
        return {
            company,
            cn_abb,
            abb,
        };
    }

    if (isUser) {
        // 客户表是否存在
        const customerEntity = await Customers.findOne({ where: { user_id, isdel: 0 }});
        if (customerEntity) {
            return customerEntity;
        } else {
            const { company, abb, cn_abb } = await checkUnion(name, name, getPinYin.getAbb(getPinYin.getPinYin(name, '', true)));
            await new Promise(async resolve => {
                homeCustomers.add({
                    form_data: JSON.stringify({
                        company,
                        abb,
                        cn_abb,
                        user_id,
                        credit_qualified: 1,
                        level: 'P',
                    }),
                    admin_id,
                }, async () => {
                    await homeVerUnit.update({
                        certified: 1,
                        telArr: [],
                        user_id,
                    });
                    resolve();
                });
            });
            return await Customers.findOne({ where: { user_id, isdel: 0 }});
        }
    } else {
        const customerEntity = await Customers.findOne({ where: { company, isdel: 0 }});
        return customerEntity;
    }
}

async function dealerUser(user_id, name, snList) {

    async function checkUnion(user_name) {
        const userEntity = await EndUser.findOne({
            where: {
                user_name,
            },
        });
        if (userEntity) {
            user_name = user_name + user_id;
            return await checkUnion(user_name);
        }
        return user_name;
    }

    let userEntity = await EndUser.findOne({ where: { user_id, isdel: 0 } });
    if (!userEntity) {
        const user_name = await checkUnion(name);
        await homeEndUser.create({
            user_name,
            admin_id,
            user_id,
        });
        userEntity = await EndUser.findOne({ where: { user_id, isdel: 0 } });
    }
    // 更新设备序列号
    const { sn } = userEntity.dataValues;
    let snArr;
    try {
        snArr = sn.split(',').filter(items => items);
    } catch (e) {
        snArr = [];
    }
    snArr = [ ...snArr, ...snList ];
    snArr = [ ...new Set(snArr) ];
    await EndUser.update({sn: snArr.join()}, { where: { user_id } });
}

/**
 * 监听来自支付系统的消息
 */
const contractConsumer = new ConsumerMq({
    exchangeName: 'pay',
    exchangeType: 'fanout',
    queue: 'contract',
});
const contractProducer = new ProducerMq({
    exchangeName: 'downStream',
    exchangeType: 'direct',
});
contractConsumer.listen(async msg => {
    return;
    let isUser = true;
    const payload = JSON.parse(msg);
    const { msg_id, data } = payload;
    const formData = data.contract;
    const { unionid, create_time, total_amount, supList } = formData;
    const memberEntity = await Member.findOne({ where: { unionid }});
    const { company, user_id, checked, addr, name } = memberEntity.dataValues;
    if (checked) {
        isUser = false;
    }
    const { company: newName, abb } = await dealCustomer(user_id, isUser, name, company);
    const endSnArr = [];
    // 创建新合同号
    let prevContractNo;
    const contractNoRes = await hybrid_app.searchLatestViContractNo({ keywords: company });
    if (contractNoRes.code === 200) {
        prevContractNo = contractNoRes.data.contract_no;
    }
    const new_contract_no = createContractNo(abb, create_time, prevContractNo);
    // 判断卡是否被创建
    const snArr = [];
    const snApplyEntity = await SnCreateTool.findOne({ where: { msg_id } });
    let startSn, endSn;
    if (snApplyEntity) {
        startSn = snApplyEntity.dataValues.startSn;
        endSn = snApplyEntity.dataValues.endSn;
    } else {
        let snNum = 0;
        supList.forEach(items => {
            snNum += items.num;
        });
        const snCreateResult = await homeSnCreateTool.create({
            num: snNum,
            admin_id,
            msg_id,
        });
        if (snCreateResult.code !== 200) {
            LOG(snCreateResult);
            return;
        }
        startSn = snCreateResult.data.startSn;
        endSn = snCreateResult.data.endSn;
    }
    let startNo = Number(startSn);
    while (startNo < endSn || startNo == endSn) {
        snArr.push(startNo);
        startNo++;
    }
    // 创建卡
    // 默认型号全部为wdw
    const _p = [];
    snArr.forEach((items, index) => {
        _p[index] = new Promise(async resolve => {
            const serialNo = items;
            const snEntity = await VirtualProducts.findOne({ where: { serialNo } });
            if (!snEntity) {
                await VirtualProducts.create({
                    serialNo: items,
                    model: 'VWDW',
                    contractNo: new_contract_no,
                    insertTime: TIME(),
                });
            }
            resolve();
        });
    });
    await Promise.all(_p);
    // 生成合同
    await new Promise(async resolve => {
        // 检查合同是否存在
        const r = await ContractsHead.findOne({ where: { isdel: 0, msg_id } });
        if (r) {
            resolve({
                code: 200,
                msg: '已存在',
            });
        }
        const contracts_body = [];
        supList.forEach(items => {
            contracts_body.push({
                goods_type: "产品",
                goods_name: items.goods_name,
                goods_spec: items.series + '，' + items.structure + '，' + items.load_range + '，' + items.size,
                goods_num: items.num,
                goods_price: items.price,
                goods_ded_rate: 1,
                rem: "",
                contract_no: new_contract_no,
            });
        });
        homeContracts.add({
            contracts_head: {
                contract_no: new_contract_no,
                cus_abb: abb,
                sale_person: admin_id,
                sign_time: create_time,
                total_amount,
                payable: total_amount,
                paid: total_amount,
                delivery_state: '已发货',
                delivery_time: create_time,
                otherSnGroup: snArr.join(),
                isDirectSale: 1,
                msg_id,
                purchase: name,
            },
            contracts_body: contracts_body,
            contracts_offer: [{other_offers: 0}],
            admin_id: admin_id,
        }, result => {
            resolve(result);
        });
    });
    // 生成电子保修单
    const v_p = [];
    snArr.forEach((items, index) => {
        v_p[index] = new Promise(async resolve => {
            await productUser.bindToVir({
                sn: items,
                addr,
                unionid
            });
            resolve();
        });
    });
    await Promise.all(v_p);
    // 用户表处理
    await dealerUser(user_id, newName, snArr);
    // 生成vtc实例
    const vtc_p = [];
    let vtc_count = 0;
    supList.forEach((items, index) => {
        vtc_p[index] = new Promise(async resolve => {
            let vtc_end_count = vtc_count + Number(items.num);
            endSnArr.push(snArr.slice(vtc_count, Number(items.num)));
            await homeVir.createInstance({
                startSn: snArr[vtc_count],
                endSn: snArr[vtc_end_count - 1],
                versionRem: '出厂配置',
                name: 'Wdw',
                tmm_id: items.imageSource.tmm_id,
                admin_id,
            });
            vtc_count = vtc_end_count;
            resolve();
        });
    });
    await Promise.all(vtc_p);
    // 生成tar实例
    const tar_p = [];
    supList.forEach((items, index) => {
        tar_p[index] = new Promise(async resolve => {
            await createTarInstance(items, endSnArr[index]);
            resolve();
        });
    });
    await Promise.all(tar_p);
    contractProducer.publish(JSON.stringify({ msg_id, moduleName: 'contract' }));
});

function createContractNo(abb, create_time, no) {
    let prevNo, tailNo;
    prevNo = 'lj' + abb + '-v-';
	if (!no) {
        tailNo = String(new Date(create_time).getFullYear()).slice(2, 4) + String(new Date(create_time).getMonth() + 1).padStart(2, '0') + '01';
    } else {
        let countNo = no.split('-V-')[1].slice(4, 6);
        countNo = Number(countNo) + 1;
        countNo = String(countNo).padStart(2, '0');
        tailNo = String(new Date(create_time).getFullYear()).slice(2, 4) + String(new Date(create_time).getMonth() + 1).padStart(2, '0') + countNo;
    }
    return (prevNo + tailNo).toUpperCase();
}

// 生成tar实例
async function createTarInstance(data, snArr) {
    const { imageSource } = data;
    const { frame_image, beam_image, tar_id } = imageSource;
    const result = await new Promise(resolve => {
        request(CONFIG.actionApiAddr + '/tar/pack/' + tar_id, (err, response, body) => {
            body = JSON.parse(body);
            resolve(body.data);
        });
    });
    const formData = {
        class: 'Tar',
        solution: 'Wdw',
        parameters: {
            frameImage: frame_image,
            beamImage: beam_image,
        },
        realScene: result.realScene,
        virtualScene: result.virtualScene,
    };
    const _p = [];
    snArr.forEach((items, index) => {
        _p[index] = new Promise(async resolve => {
            await new Promise(resolve => {
                request.post(CONFIG.actionApiAddr + '/tar/instance/' + items, (err, response, body) => {
                    resolve();
                }).form({
                    info: { timestamp: Date.now() },
                    config: JSON.stringify(formData),
                });
            });
            resolve();
        });
    });
    await Promise.all(_p);
}