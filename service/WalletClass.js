const sequelize = require('../dao').sequelize;
const Wallet = require('../dao').Wallet;
const WalletCoup = require('../dao').WalletCoup;
const WalletDepo = require('../dao').WalletDepo;
const WalletLogs = require('../dao').WalletLogs;
const ContractsHead = require('../dao').ContractsHead;
const ContractsOffer = require('../dao').ContractsOffer;
const homeServiceCustomers = require('./homeCustomers');
const homeServiceContracts = require('./homeContracts');

// expenditure  use         抵价券使用
// expenditure  overTime    抵价券过期
// expenditure  destroy     抵价券作废删除
// incoming     add         抵价券新增
// incoming     cover       抵价券重新生效
// incoming     resale      抵价券转入

/**
 *  收入类
 */
class Income {

    // 抵价券新增
    addCoup(params,cb){
        const { coupon_no, amount, endTime, user_id } = params;
        priCheckCoupNoExist(coupon_no,result => {
            if(result.code==-1){
                cb(result);
                return;
            }
            Wallet.findOne({
                where: {
                    user_id: user_id
                }
            }).then(result => {
                if (!result) {
                    cb({
                        code: 200,
                        msg: '不存在该账号',
                        data: []
                    });
                    return;
                }
                const { id } = result.dataValues;
                // 开启事务
                sequelize.transaction(t => {
                    return WalletCoup.create({
                        coupon_no: coupon_no,
                        amount: amount,
                        original_price: amount,
                        isPower: 1,
                        endTime: endTime,
                        wallet_id: id
                    },{
                        transaction: t
                    }).then(() => {
                        return WalletLogs.create({
                            wallet_id: id,
                            action: 'incoming',
                            detail: 'add',
                            amount: amount,
                            numbering: coupon_no,
                            type: 'coupon',
                            time: TIME()
                        },{
                            transaction: t
                        });
                    });
                }).then(() => {
                    cb({
                        code: 200,
                        msg: '操作成功',
                        data: []
                    });
                }).catch(e => {
                    LOG(e);
                    cb({
                        code: -1,
                        msg: '操作失败',
                        data: []
                    });
                });
            }).catch(e => LOG(e));
        });
    }

    // 保证金新增
    // 先把原保证金作废
    addDepo(params,cb){
        let { amount, contract_no } = params;
        priDestroyDepo(contract_no,() => {
            priGetLastAmount(contract_no,mAmount => {
                // const nowAmount = Number(amount)>Number(mAmount) ? Number(amount) : 0;
                priGetUserIdByContract(contract_no,result => {
                    if(result.code==-1){
                        cb(result);
                        return;
                    }
                    const user_id = result.data;
                    Wallet.findOne({
                        where: {
                            user_id
                        }
                    }).then(result => {
                        const { id } = result.dataValues;
                        // 开启事务
                        const depoTime = Number(CONFIG.depoTime);
                        let endTime = DATETIME(Date.now() + 1000 * 60 * 60 * 24 * 365 * depoTime);
                        sequelize.transaction(t => {
                            return WalletDepo.create({
                                contract_no: contract_no,
                                amount: amount,
                                original_price: amount,
                                endTime: endTime,
                                wallet_id: id
                            },{
                                transaction: t
                            }).then(() => {
                                return WalletLogs.create({
                                    wallet_id: id,
                                    action: 'incoming',
                                    detail: 'add',
                                    amount: amount,
                                    numbering: contract_no,
                                    type: 'deposit',
                                    time: TIME()
                                },{
                                    transaction: t
                                });
                            });
                        }).then(result => {
                            cb({
                                code: 200,
                                msg: '操作成功',
                                data: []
                            });
                        }).catch(e => {
                            LOG(e);
                            cb({
                                code: -1,
                                msg: '操作失败',
                                data: []
                            });
                        });
                    }).catch(e => LOG(e));
                });
            });
        });
    }

    // 恢复被该合同使用的各种优惠
    recoverFavo(params,cb){
        const { contract_no } = params;
        ContractsHead.findAll({
            where: {
                contract_no
            },
            order: [['id','DESC']]
        }).then(result => {
            const contracts_head_id = result[0].dataValues.id;
            ContractsOffer.findAll({
                where: {
                    contracts_head_id
                }
            }).then(result => {
                const _p = [];
                result.forEach((items,index) => {
                    _p[index] = new Promise((resolve,reject) => {
                        const it = items;
                        if(items.dataValues.coupon_no){
                            WalletCoup.findOne({
                                where: {
                                    isdel: 0,
                                    coupon_no: items.dataValues.coupon_no
                                }
                            }).then(result => {
                                let id = result.dataValues.id;
                                const wallet_id = result.dataValues.wallet_id;
                                let amount = Number(result.dataValues.amount);
                                let __amount__ = Number(it.dataValues.coupon_value);
                                amount += Number(it.dataValues.coupon_value);
                                WalletCoup.update({
                                    amount
                                },{
                                    where: {
                                        id
                                    }
                                }).then(() => {
                                    WalletLogs.create({
                                        wallet_id,
                                        action: 'incoming',
                                        detail: 'cover',
                                        amount: __amount__,
                                        numbering: it.dataValues.coupon_no,
                                        type: 'coupon',
                                        time: TIME()
                                    }).then(() => resolve()).catch(e => LOG(e));
                                }).catch(e => LOG(e));
                            }).catch(e => LOG(e));
                        }else if(items.dataValues.service_deposit_no){
                            WalletDepo.findOne({
                                where: {
                                    isdel: 0,
                                    contract_no: items.dataValues.service_deposit_no
                                }
                            }).then(result => {
                                if(!result){
                                    resolve();
                                    return;
                                }
                                let id = result.dataValues.id;
                                const wallet_id = result.dataValues.wallet_id;
                                let amount = Number(result.dataValues.amount);
                                let __amount__ = Number(it.dataValues.service_deposit_value);
                                amount += Number(it.dataValues.service_deposit_value);
                                WalletDepo.update({
                                    amount
                                },{
                                    where: {
                                        id
                                    }
                                }).then(() => {
                                    WalletLogs.create({
                                        wallet_id,
                                        action: 'incoming',
                                        detail: 'cover',
                                        amount: __amount__,
                                        numbering: it.dataValues.service_deposit_no,
                                        type: 'deposit',
                                        time: TIME()
                                    }).then(() => resolve()).catch(e => LOG(e));
                                }).catch(e => LOG(e));
                            }).catch(e => LOG(e));
                        }else{
                            resolve();
                        }
                    });
                });
                Promise.all(_p).then(() => cb()).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }

    // 抵价券转手
    async resaleCoup(params) {
        const { owner, buyer, no } = params;
        // 判断该抵价券是否是当前owner
        // 判断该抵价券是否满足转手条件
        // 判断buyer是否合法
        const coupEntity = await WalletCoup.findOne({ where: { coupon_no: no, isdel: 0 } });
        if (!coupEntity) {
            return { code: -1, msg: '不存在该抵价券' };
        }
        const { isPower, amount, original_price, id } = coupEntity.dataValues;
        const walletEntity = await Wallet.findOne({ where: { id: coupEntity.dataValues.wallet_id } });
        if (!walletEntity) {
            return { code: -1, msg: '系统异常' };
        }
        const { user_id: ownerUserId } = walletEntity.dataValues;
        if (owner != ownerUserId) {
            return { code: -1, msg: '非法访问' };
        }
        if (isPower != 1 || amount != original_price) {
            return { code: -1, msg: '不满足转手条件' };
        }
        const buyerWalletEntity = await Wallet.findOne({ where: { user_id: buyer } });
        if (!buyerWalletEntity) {
            return { code: -1, msg: '未找到接手人账户' };
        }
        const { id: buyerWalletId } = buyerWalletEntity.dataValues;
        // 改变wallet_id, 增加log
        // 开启事务
        const result = await new Promise(resolve => {
            sequelize.transaction(t => {
                return WalletCoup.update({
                    wallet_id: buyerWalletId
                },{
                    where: { id },
                    transaction: t
                }).then(() => {
                    return WalletLogs.create({
                        wallet_id: buyerWalletId,
                        action: 'incoming',
                        detail: 'resale',
                        amount,
                        numbering: no,
                        type: 'coupon',
                        time: TIME(),
                    },{
                        transaction: t
                    });
                });
            }).then(() => {
                resolve({
                    code: 200,
                    msg: '操作成功',
                    data: []
                });
            }).catch(e => {
                resolve({
                    code: -1,
                    msg: e.message,
                    data: []
                });
            });
        });
        return result;
    }
}

// 判断该抵价券存在
function priCheckCoupNoExist(coupon_no,cb){
    WalletCoup.findOne({
        where: {
            coupon_no: coupon_no,
            isdel: 0
        }
    }).then(result => {
        if(result){
            cb({
                code: -1,
                msg: '已存在该抵价券',
                data: []
            });
        }else{
            cb({
                code: 200,
                msg: '不存在该抵价券',
                data: []
            });
        }
    }).catch(e => LOG(e));
}

// 作废原保证金
function priDestroyDepo(contract_no,cb){
    const expenditure = new Expenditure();
    expenditure.delDepo({
        contract_no: contract_no
    },result => {
        cb(result);
    });
}

// 获取作废前保证金余额
function priGetLastAmount(contract_no,cb){
    WalletDepo.findAll({
        where: {
            contract_no
        },
        order: [['id','DESC']]
    }).then(result => {
        let amount;
        try{
            amount = result[0].dataValues.amount;
        }catch(e){
            amount = 0;
        }
        cb(amount);
    }).catch(e => LOG(e));
}

// 根据合同号获取user_id
function priGetUserIdByContract(contract_no,cb){
    homeServiceContracts.getTargetItem({
        targetKey: contract_no
    },result => {
        const { cus_abb } = result.data.dataValues;
        homeServiceCustomers.getTargetItem({
            targetKey: cus_abb
        },result => {
            let user_id;
            try{
                user_id = result.data.dataValues.user_id;
                cb({
                    code: 200,
                    msg: '',
                    data: user_id
                });
            }catch(e){
                cb({
                    code: -1,
                    msg: '找不到该公司',
                    data: []
                });
            }
        });
    });
}

/******************************************************************************************************************/

/**
 *  支出类
 */
class Expenditure {

    // 抵价券使用
    useCoup(params,cb){
        const { coupon_no, outputAmount } = params;
        priCheckCoupAmountLarge(params,result => {
            if(result.code!=200){
                cb(result);
                return;
            }
            WalletCoup.findOne({
                where: {
                    coupon_no,
                    isdel: 0,
                    isPower: 1
                }
            }).then(result => {
                let { amount, wallet_id } = result.dataValues;
                amount = Number(amount) - Number(outputAmount);
                sequelize.transaction(t => {
                    return WalletCoup.update({
                        amount
                    },{
                        where: {
                            coupon_no,
                            isdel: 0,
                            isPower: 1
                        },
                        transaction: t
                    }).then(() => {
                        return WalletLogs.create({
                            wallet_id,
                            action: 'expenditure',
                            detail: 'use',
                            amount: outputAmount,
                            numbering: coupon_no,
                            type: 'coupon',
                            time: TIME()
                        },{
                            transaction: t
                        });
                    });
                }).then(result => {
                    cb({
                        code: 200,
                        msg: '操作成功',
                        data: []
                    });
                }).catch(e => {
                    LOG(e);
                    cb({
                        code: -1,
                        msg: '操作失败',
                        data: []
                    });
                });
            }).catch(e => LOG(e));
        });
    }

    // 抵价券过期
    failCoup(params,cb){
        const { coupon_no } = params;
        WalletCoup.findOne({
            where: {
                coupon_no
            }
        }).then(result => {
            const { amount, wallet_id } = result.dataValues;
            sequelize.transaction(t => {
                return WalletCoup.update({
                    isPower: 0
                },{
                    where: {
                        coupon_no
                    },
                    transaction: t
                }).then(() => {
                    return WalletLogs.create({
                        wallet_id,
                        action: 'expenditure',
                        detail: 'overTime',
                        amount,
                        numbering: coupon_no,
                        type: 'coupon',
                        time: TIME()
                    },{
                        transaction: t
                    });
                });
            }).then(() => {
                cb({
                    code: 200,
                    msg: '操作成功',
                    data: []
                });
            }).catch(e => {
                LOG(e);
                cb({
                    code: -1,
                    msg: '操作失败',
                    data: []
                });
            });
        }).catch(e => LOG(e));
    }

    // 抵价券作废
    delCoup(params,cb){
        const { coupon_no } = params;
        WalletCoup.findAll({
            where: {
                coupon_no,
                isdel: 0
            },
            order: [['id','DESC']]
        }).then(result => {
            if(result.length==0){
                cb({
                    code: -1,
                    msg: '不存在',
                    data: []
                });
            }else{
                const { wallet_id, amount } = result[0].dataValues;
                WalletLogs.create({
                    wallet_id,
                    action: 'expenditure',
                    detail: 'destroy',
                    amount: amount,
                    numbering: coupon_no,
                    type: 'coupon',
                    time: TIME()
                }).then(() => {
                    WalletCoup.update({
                        isdel: 1
                    },{
                        where: {
                            coupon_no
                        }
                    }).then(() => cb({
                        code: 200,
                        msg: '操作成功',
                        data: []
                    })).catch(e => LOG(e));
                }).catch(e => LOG(e));
            }
        }).catch(e => LOG(e));
    }

    // 保证金使用
    useDepo(params,cb){
        const { contract_no, outputAmount } = params;
        priCheckDepoAmountLarge(params,result => {
            if(result.code!=200){
                cb(result);
                return;
            }
            WalletDepo.findOne({
                where: {
                    contract_no,
                    isdel: 0,
                    isPower: 1
                }
            }).then(result => {
                let { amount, wallet_id } = result.dataValues;
                amount = Number(amount) - Number(outputAmount);
                sequelize.transaction(t => {
                    return WalletDepo.update({
                        amount
                    },{
                        where: {
                            contract_no,
                            isdel: 0,
                            isPower: 1
                        },
                        transaction: t
                    }).then(() => {
                        return WalletLogs.create({
                            wallet_id,
                            action: 'expenditure',
                            detail: 'use',
                            amount: outputAmount,
                            numbering: contract_no,
                            type: 'deposit',
                            time: TIME()
                        },{
                            transaction: t
                        });
                    });
                }).then(result => {
                    cb({
                        code: 200,
                        msg: '操作成功',
                        data: []
                    });
                }).catch(e => {
                    LOG(e);
                    cb({
                        code: -1,
                        msg: '操作失败',
                        data: []
                    });
                });
            }).catch(e => LOG(e));
        });
    }

    // 保证金过期
    failDepo(params,cb){
        const { contract_no } = params;
        WalletDepo.findOne({
            where: {
                contract_no
            }
        }).then(result => {
            const { amount, wallet_id } = result.dataValues;
            sequelize.transaction(t => {
                return WalletDepo.update({
                    isPower: 0
                },{
                    where: {
                        contract_no
                    },
                    transaction: t
                }).then(() => {
                    return WalletLogs.create({
                        wallet_id,
                        action: 'expenditure',
                        detail: 'overTime',
                        amount,
                        numbering: contract_no,
                        type: 'deposit',
                        time: TIME()
                    },{
                        transaction: t
                    });
                });
            }).then(() => {
                cb({
                    code: 200,
                    msg: '操作成功',
                    data: []
                });
            }).catch(e => {
                LOG(e);
                cb({
                    code: -1,
                    msg: '操作失败',
                    data: []
                });
            });
        }).catch(e => LOG(e));
    }

    // 保证金作废
    delDepo(params,cb){
        const { contract_no } = params;
        WalletDepo.findAll({
            where: {
                contract_no,
                isdel: 0
            },
            order: [['id','DESC']]
        }).then(result => {
            if(result.length==0){
                cb();
            }else{
                const amount = result[0].dataValues.amount;
                const wallet_id = result[0].dataValues.wallet_id;
                WalletLogs.create({
                    wallet_id,
                    action: 'expenditure',
                    detail: 'destroy',
                    amount: amount,
                    numbering: contract_no,
                    type: 'deposit',
                    time: TIME()
                }).then(() => {
                    WalletDepo.update({
                        isdel: 1
                    },{
                        where: {
                            contract_no
                        }
                    }).then(() => {
                        cb({
                            code: 200,
                            msg: '',
                            data: []
                        });
                    }).catch(e => LOG(e));
                }).catch(e => LOG(e));
            }
        }).catch(e => LOG(e));
    }
}

// 确认优惠金额是否大于保证金面值金额
function priCheckDepoAmountLarge(params,cb){
    const { contract_no, outputAmount } = params;
    WalletDepo.findOne({
        where: {
            contract_no: contract_no,
            isdel: 0,
            isPower: 1
        }
    }).then(result => {
        if(result){
            const amount = Number(result.dataValues.amount);
            if(Number(outputAmount)>amount){
                cb({
                    code: -1,
                    msg: '金额过大',
                    data: []
                });
            }else{
                cb({code: 200});
            }
        }else{
            cb({
                code: -1,
                msg: '不存在该合同',
                data: []
            });
        }
    }).catch(e => LOG(e));
}

// 确认优惠金额是否大于抵价券面值金额
function priCheckCoupAmountLarge(params,cb){
    const { coupon_no, outputAmount } = params;
    WalletCoup.findOne({
        where: {
            coupon_no,
            isdel: 0,
            isPower: 1
        }
    }).then(result => {
        if(result){
            const amount = Number(result.dataValues.amount);
            if(Number(outputAmount)>amount){
                cb({
                    code: -1,
                    msg: '金额过大',
                    data: []
                });
            }else{
                cb({code: 200});
            }
        }else{
            cb({
                code: -1,
                msg: '不存在该抵价券',
                data: []
            });
        }
    }).catch(e => LOG(e));
}

module.exports = {
    Income,
    Expenditure
};