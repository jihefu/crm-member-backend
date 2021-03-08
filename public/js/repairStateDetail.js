$(function(){
    if (i == 0) {
        $('.btn a').eq(0).hide();
    } else if (i == 5) {
        $('.btn a').eq(1).hide();
    }

    $('.stage0').html(getHours(data.receive_time, data.stage0));
    $('.stage1').html(getHours(data.receive_time, data.stage1));
    $('.stage2').html(getHours(data.receive_time, data.stage2));
    $('.stage3').html(getHours(data.receive_time, data.stage3));
    $('.stage4').html(getHours(data.receive_time, data.stage4));
    $('.stage5').html(getHours(data.receive_time, data.stage5));

    $('.step-item-dot:lt(' + (i + 1) + ')').addClass('step-active');
    $('.step-item-text:lt(' + (i + 1) + ')').addClass('step-text-active');
    $('.step-line:lt(' + i + ')').addClass('step-active');
    $('.step-line:lt(' + i + ') div').show();
    if (isStaff) {
        if (i != 5) {
            $('.step-text-active:last').append('<i style="margin-left: 1rem" onclick="edit();" class="iconfont icon-sign edit"></i>');
        }
    }
    if (data.express) {
        $('.express').append('<a onclick="queryExpress();" style="margin-left: 1rem;" href="javascript:void(0);">查询</a>');
    }
    if (!isStaff && data.express && data.deliver_state == '已发件') {
        $('.takeGoods').append('<a onclick="confirmTakeGoods();" style="margin-left: 1rem;" href="javascript:void(0);">确认收件</a>');
    }
});

function getHours(receiveTime, stageTime) {
    if (stageTime) {
        return ((Date.parse(stageTime) - Number(receiveTime + '000')) / (1000 * 60 * 60)).toFixed(2) + 'h';
    }
}

function changeState(type) {
    checkStateValid(i + type);
}

function checkStateValid(index) {
    var status = stateArr[index];
    if (status === '维修中') {
        if (!data.conclusion || !data.treatement) {
            $('.edit').trigger('click');
            return;
        }
    } else if (status === '待发件') {
        if (!data.again_conclusion) {
            $('.edit').trigger('click');
            return;
        }
    } else if (status === '已发件') {
        if (!data.express || !data.deliver_time) {
            $('.edit').trigger('click');
            return;
        }
    }
    subState(status);
}

function edit() {
    var str;
    if (i == 0) {
        str = `<div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label" style="width: 6.125rem;">
                    <label class="weui-label">送修测试结论：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="text" class="weui-input form-input" name="conclusion" value="${data.conclusion}">
                </div>
            </div>
            <div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label" style="width: 6.125rem;">
                    <label class="weui-label">处理方法：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="text" class="weui-input form-input" name="treatement" value="${data.treatement}">
                </div>
            </div>`;
        formData = { conclusion: data.conclusion, treatement: data.treatement };
    } else if (i == 1) {
        str = `<div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label">
                    <label class="weui-label">自产：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="text" class="weui-input form-input" name="own_cost" value="${data.own_cost}">
                </div>
            </div>
            <div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label">
                    <label class="weui-label">外购：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="text" class="weui-input form-input" name="outer_cost" value="${data.outer_cost}">
                </div>
            </div>`;
        formData = { own_cost: data.own_cost, outer_cost: data.outer_cost };
    } else if (i == 2) {
        str = `<div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label" style="width: 6.125rem;">
                    <label class="weui-label">维修测试结论：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="text" class="weui-input form-input" name="again_conclusion" value="${data.again_conclusion}">
                </div>
            </div>
            <div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label" style="width: 6.125rem;">
                    <label class="weui-label">维修合同：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="text" class="weui-input form-input" name="related_contract" value="${data.related_contract}">
                </div>
            </div>`;
        formData = { again_conclusion: data.again_conclusion, related_contract: data.related_contract };
    } else if (i == 3) {
        str = `<div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label" style="width: 6.125rem;">
                    <label class="weui-label">快递单号：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="text" class="weui-input form-input" name="express" value="${data.express}">
                </div>
            </div>
            <div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label" style="width: 6.125rem;">
                    <label class="weui-label">发件时间：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="date" class="weui-input form-input" name="deliver_time" value="${data.deliver_time}">
                </div>
            </div>`;
        formData = { express: data.express, deliver_time: data.deliver_time };
    } else if (i == 4) {
        str = `<div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label" style="width: 6.125rem;">
                    <label class="weui-label">收件确认人：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="text" class="weui-input form-input" name="take_person" value="${data.take_person}">
                </div>
            </div>
            <div class="weui-cell" style="display:flex;">
                <div class="weui-cell__hd form-label" style="width: 6.125rem;">
                    <label class="weui-label">收件确认时间：</label>
                </div>
                <div class="weui-cell__bd">
                    <input type="date" class="weui-input form-input" name="take_time" value="${data.take_time}">
                </div>
            </div>`;
        formData = { take_person: data.take_person, take_time: data.take_time };
    }
    $('#dialog .weui-dialog__bd').html(str);
    $('#dialog').show();
}

function cancelDialog() {
    $('#dialog').hide();
}

function closeRepair() {
    var r = window.confirm('确定关闭？');
    if (!r) {
        return;
    }
    $.ajax({
        url: route('repairs/updateFormData'),
        type: 'put',
        dataType: 'json',
        data: {
            form_data: JSON.stringify({
                id: data.id,
                deliver_state: '关闭',
            })
        },
        success: function (res) {
            window.location.href = route('repair/info/' + data.repair_contractno);
        }
    });
}

/************************************************/
function sub(cb) {
    $('#dialog .form input').each(function() {
        var name = $(this).attr('name');
        var val = $(this).val();
        formData[name] = val;
    });
    formData.id = data.id;
    $.ajax({
        url: route('repairs/updateFormData'),
        type: 'put',
        dataType: 'json',
        data: {
            form_data: JSON.stringify(formData)
        },
        success: function (res) {
            if (cb) {
                cb();
            } else {
                window.location.reload();
            }
        }
    });
}

function subState(status) {
    var url;
    if (status === '送修检验中') {
        url = 'repairs/toFirstCheck';
    } else if (status === '维修中') {
        url = 'repairs/toRepairing';
    } else if (status === '维修测试中') {
        url = 'repairs/toSecondCheck';
    } else if (status === '待发件') {
        url = 'repairs/toPrepareSend';
    } else if (status === '已发件') {
        url = 'repairs/toHasSend';
    } else if (status === '已收件') {
        url = 'repairs/toHasReceive';
    }
    $.ajax({
        url: route(url),
        type: 'put',
        dataType: 'json',
        data: {
            id: data.id,
        },
        success: function (res) {
            if (res.code == 200) {
                window.location.reload();
            } else {
                wxToast(res.msg);
            }
        }
    });
}

function subAndNext() {
    sub(function() {
        var status = stateArr[i+1];
        subState(status);
    });
}

function queryExpress() {
    var no = data.express;
    wxToast('查询中');
    // window.location.href = route('contract/queryPackingExpress/' + no);
	window.location.href = route('repair/queryExpress/'+no);
}

function confirmTakeGoods() {
    $.ajax({
        url: route('repair_ajax/takeGoods'),
        type: 'post',
        dataType: 'json',
        data: {
            no: data.repair_contractno,
        },
        success: function (res) {
            window.location.reload();
        }
    });
}