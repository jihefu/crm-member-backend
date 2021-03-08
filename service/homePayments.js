const common = require('./common');
const sequelize = require('../dao').sequelize;
const Staff = require('../dao').Staff;
const base = require('./base');
const Payment = require('../dao').Payment;
const PayUse = require('../dao').PayUse;
const Customers = require('../dao').Customers;
const Member = require('../dao').Member;
const ContractsHead = require('../dao').ContractsHead;
const serviceHomeContracts = require('./homeContracts');
const sendMQ = require('./rabbitmq').sendMQ;

/**
 *  到账列表
 */
this.list = (params,cb) => {
    let num = params.num?parseInt(params.num):10;
	let page = params.page?parseInt(params.page):1;
    let keywords = params.keywords?params.keywords:'';
    let order = params.order?params.order:'arrival';
    Payment.findAndCountAll({
        where: {
            isdel: 0,
            company: {
                '$like': '%'+keywords+'%'
            }
        },
        order: [['isAssign'],[order,'DESC'],['id','DESC']],
        limit: num,
        offset: (page -1) * num
    }).then(result => {
        const _p = [];
        const staffMap = new base.StaffMap().getStaffMap();
        result.rows.forEach((items,index) => {
            _p[index] = new Promise((resolve,reject) => {
                const i = index;
                const it = items;
                try{
                    result.rows[i].dataValues.insert_person = staffMap[result.rows[i].dataValues.insert_person].user_name;
                }catch(e){}
                try{
                    result.rows[i].dataValues.update_person = staffMap[result.rows[i].dataValues.update_person].user_name;
                }catch(e){}
                PayUse.findAll({
                    where: {
                        pay_id: it.dataValues.id,
                        isdel: 0
                    }
                }).then(_r => {
                    result.rows[i].dataValues.pay_use = _r;
                    resolve();
                }).catch(e => LOG(e));
            });
        });
        Promise.all(_p).then(() => {
            cb({
                code: 200,
                msg: '',
                data: {
                    data: result.rows,
                    total: result.count,
                    id_arr: []
                }
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  对应公司的欠款合同
 */
this.searchContractNo = (params,cb) => {
    const { company,keywords } = params;
    Customers.findAll({
        where: {
            '$or': {
                company: {
                    '$like': '%'+company+'%'
                },
                abb: {
                    '$like': '%'+company+'%'
                },
                cn_abb: {
                    '$like': '%'+company+'%'
                }
            },
            isdel: 0
        }
    }).then(result => {
        const cus_abb_arr = [];
        result.forEach(items => {
            cus_abb_arr.push(items.dataValues.abb);
        });
        // const cus_abb = result.dataValues.abb;
        ContractsHead.findAll({
            where: {
                isdel: 0,
                cus_abb: { $in: cus_abb_arr },
                contract_state: '有效',
                payable: {
                    '$ne': sequelize.col('paid')
                },
                contract_no: {
                    '$like': '%'+keywords+'%'
                }
            }
        }).then(result => {
            const resArr = [];
            result.map((items,index) => {
                resArr.push({
                    text: items.dataValues.contract_no,
                    value: items.dataValues.contract_no,
                    data: items.dataValues
                });
            });
            cb({
                code: 200,
                msg: '',
                data: resArr
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  指定到账条目
 */
this.targetPaymentItem = (params,cb) => {
    const { id } = params;
    Payment.findOne({
        where: {
            id: id
        }
    }).then(result => {
        PayUse.findAll({
            where: {
                pay_id: id,
                isdel: 0
            }
        }).then(payUse => {
            result.dataValues.pay_use = payUse;
            const staffMap = new base.StaffMap().getStaffMap()
            result.dataValues.insert_person = staffMap[result.dataValues.insert_person].user_name;
            result.dataValues.update_person = staffMap[result.dataValues.update_person].user_name;
            result.dataValues.arrival = DATETIME(result.dataValues.arrival);
            cb({
                code: 200,
                msg: '',
                data: result
            });
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  删除对应到账
 */
this.deletePayment = (params,cb) => {
    const { id,admin_id } = params;
    const that = this;
    Payment.update({
        isdel: 1,
        update_person: admin_id,
        update_time: TIME()
    },{
        where: {
            id: id
        }
    }).then(result => {
        if(result[0]){
            cb({
                code: 200,
                msg: '删除成功',
                data: []
            });
            PayUse.findAll({
                where: {
                    pay_id: id
                }
            }).then(result => {
                result.forEach((items,index) => {
                    that.syncContractAmount({
                        contract_no: items.dataValues.contract_no,
                        amount: items.dataValues.amount,
                        type: 'delete'
                    },() => {});
                });
            }).catch(e => LOG(e));
            // 取消会员的加分
            Payment.findOne({
                where: { id },
            }).then(result => {
                const { company, amount } = result.dataValues;
                Member.findAll({
                    where: { company },
                }).then(result => {
                    sequelize.query('SELECT amount FROM payment WHERE isdel = 0 AND company = "'+company+'" AND date_format(arrival,"%Y")=date_format(now(),"%Y")').then(r => {
                        const list = r[0];
                        let totalAmount = 0;
                        list.forEach((items, index) => {
                            totalAmount += Number(items.amount);
                        });
                        result.forEach((items, index) => {
                            const p = {};
                            p.open_id = items.open_id;
                            p.amount = amount;
                            p.totalAmount = totalAmount;
                            p._class = 'paymentCancel';
                            sendMQ.sendQueueMsg('memberActivity', JSON.stringify(p), result => {
                                console.log(result);
                            });
                            common.createEvent({
                                headParams: {
                                    ownerId: items.open_id,
                                    type: '1302',
                                    time: TIME(),
                                    person: id,
                                    rem: '取消到款',
                                },
                                bodyParams: {},
                            }, () => {});
                        });
                    }).catch(e => LOG(e));
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }else{  
            cb({
                code: -1,
                msg: '删除失败',
                data: []
            });
        }
    }).catch(e => LOG(e));
}

/**
 *  删除payuse
 */
this.deletePayUse = (params,cb) => {
    const { id,admin_id,pay_id } = params;
    const that = this;
    PayUse.update({
        isdel: 1
    },{
        where: {
            id: id
        }
    }).then(result => {
        if(result[0]){
            that.checkIsAssign({
                id: pay_id
            },() => {
                that.targetPaymentItem({
                    id: pay_id
                },result => {
                    cb({
                        code: 200,
                        msg: '删除成功',
                        data: result.data
                    });
                    PayUse.findOne({
                        where: {
                            id: id
                        }
                    }).then(result => {
                        that.syncContractAmount({
                            contract_no: result.dataValues.contract_no,
                            amount: result.dataValues.amount,
                            type: 'delete'
                        },() => {});
                    }).catch(e => LOG(e));
                });
            });
        }else{  
            cb({
                code: -1,
                msg: '删除失败',
                data: []
            });
        }
    }).catch(e => LOG(e));
}

/**
 *  新增到账
 */
this.paymentAdd = (params,cb) => {
    const { form_data,admin_id } = params;
    Customers.findOne({
        where: {
            company: form_data.company
        }
    }).then(result => {
        if(!result) {
            cb({
                code: -1,
                msg: '不存在该公司',
                data: [],
            });
            return;
        }
        const star = result.dataValues.star ? Number(result.dataValues.star) : 0;
        form_data.abb = result.dataValues.abb;
        form_data.insert_person = admin_id;
        form_data.update_person = admin_id;
        form_data.insert_time = TIME();
        form_data.update_time = TIME();
        Payment.create(form_data).then(result => {
            const staffMap = new base.StaffMap().getStaffMap()
            result.dataValues.insert_person = staffMap[result.dataValues.insert_person].user_name;
            result.dataValues.update_person = staffMap[result.dataValues.update_person].user_name;
            result.dataValues.arrival = DATETIME(result.dataValues.arrival);
            cb({
                code: 200,
                msg: '新增成功',
                data: result,
            });
            const insertRes = result;
            Member.findAll({
                where: { company: form_data.company },
            }).then(result => {
                sequelize.query('SELECT amount FROM payment WHERE isdel = 0 AND company = "'+form_data.company+'" AND date_format(arrival,"%Y")=date_format(now(),"%Y")').then(r => {
                    const list = r[0];
                    let totalAmount = 0;
                    list.forEach((items, index) => {
                        totalAmount += Number(items.amount);
                    });
                    // 每个会员都加
                    result.forEach((items, index) => {
                        const p = {};
                        p.open_id = items.open_id;
                        p.star = star;
                        p.amount = form_data.amount;
                        p.totalAmount = totalAmount;
                        p._class = 'payment';
                        sendMQ.sendQueueMsg('memberActivity', JSON.stringify(p), result => {
                            console.log(result);
                        });
                        common.createEvent({
                            headParams: {
                                ownerId: items.open_id,
                                type: '1302',
                                time: TIME(),
                                person: insertRes.id,
                                rem: '到款',
                            },
                            bodyParams: {},
                        }, () => {});
                    });
                    sendMQ.sendQueueMsg('payArrival', JSON.stringify({
                        arrival: form_data.arrival,
                        amount: form_data.amount,
                        company: form_data.company,
                    }), result => {
                        console.log(result);
                    });
                }).catch(e => LOG(e));
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  新增用途
 */
this.payUseAdd = (params,cb) => {
    const { form_data } = params;
    const that = this;
    that.checkAmount({
        id: form_data.pay_id,
        newAmount: form_data.amount
    },result => {
        if(result.code==-1){
            cb(result);
        }else{
            PayUse.create(form_data).then(result => {
                that.checkIsAssign({
                    id: form_data.pay_id
                },() => {
                    that.targetPaymentItem({
                        id: form_data.pay_id
                    },result => {
                        cb({
                            code: 200,
                            msg: '添加成功',
                            data: result.data
                        });
                    });
                    that.syncContractAmount({
                        contract_no: form_data.contract_no,
                        amount: form_data.amount,
                        type: 'add'
                    },() => {});
                });
            }).catch(e => LOG(e));
        }
    });
    // 清空信用总览缓存
	require('../cache/creditInfo').clearCache();
}

/**
 *  判断分配是否大于到账
 */
this.checkAmount = (params,cb) => {
    const { id,newAmount } = params;
    Payment.findOne({
        where: {
            id: id
        }
    }).then(result => {
        const amount = Number(result.dataValues.amount);
        PayUse.findAll({
            where: {
                pay_id: id,
                isdel: 0
            }
        }).then(result => {
            let _hasPay = Number(newAmount);
            result.forEach((items,index) => {
                if(!items.dataValues.ishistory){
                    _hasPay += Number(items.dataValues.amount);
                }
            });
            if(_hasPay>amount){
                cb({
                    code: -1,
                    msg: '分配金额大于实际金额',
                    data: []
                });
            }else{
                cb({
                    code: 200,
                    msg: '',
                    data: []
                });
            }
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  计算是否分配完全
 */
this.checkIsAssign = (params,cb) => {
    const { id } = params;
    Payment.findOne({
        where: {
            id: id
        }
    }).then(result => {
        const totalAmount = Number(result.dataValues.amount);
        PayUse.findAll({
            where: {
                pay_id: id,
                isdel: 0
            }
        }).then(result => {
            let subAmount = 0;
            result.forEach((items,index) => {
                subAmount += Number(items.dataValues.amount);
            });
            let isAssign = 0;
            if(subAmount==totalAmount){
                isAssign = 1;
            }
            Payment.update({
                isAssign: isAssign
            },{
                where: {
                    id: id
                }
            }).then(result => {
                cb(result[0]);
            }).catch(e => LOG(e));
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  同步合同金额
 */
this.syncContractAmount = (params,cb) => {
    const { contract_no,amount,type } = params;
    const that = this;
    ContractsHead.findOne({
        where: {
            contract_no: contract_no,
            isdel: 0
        }
    }).then(result => {
        let { payable,paid } = result.dataValues;
        let new_paid;
        if(type=='delete'){
            new_paid = Number(paid) - Number(amount);
        }else{
            new_paid = Number(paid) + Number(amount);
        }
        if(new_paid<0){
            new_paid = 0;
        }else if(new_paid>payable){
            new_paid = payable;
        }
        ContractsHead.update({
            paid: new_paid
        },{
            where: {
                contract_no: contract_no
            }
        }).then(result => {
            cb({
                code: 200,
                msg: '',
                data: result[0]
            });
            that.syncCompleteAndFreeze({
                contract_no: contract_no
            },() => {});
        }).catch(e => LOG(e));
    }).catch(e => LOG(e));
}

/**
 *  同步合同是否完成，是否解冻
 */
this.syncCompleteAndFreeze = (params,cb) => {
    const { contract_no } = params;
    ContractsHead.findOne({
        where: {
            contract_no: contract_no,
            isdel: 0
        }
    }).then(result => {
        serviceHomeContracts.checkContractComplete({
            form_data: result.dataValues
        },() => {
            serviceHomeContracts.checkFreeze({
                form_data: result.dataValues
            },() => cb());
        });
    }).catch(e => LOG(e));
}