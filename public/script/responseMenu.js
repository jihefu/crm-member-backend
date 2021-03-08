var departmentHashMap = {
    "客户关系部": [],
    "生产部": [],
    "研发部": [],
    "管理部": []
};
apiReady(function() {
    getAffairList();
});

function getAffairList() {
    apiAjax({
        url: '/home/affair/list',
        data: {
            affairType: 'respoAffair',
            specialLine: 0,
            department: '客户关系部,生产部,研发部,管理部'
        }
    }, function(result) {
        result.data.forEach(function(items, index) {
            for (var key in departmentHashMap) {
                if (items.RespoAffairs[0].department == key) {
                    departmentHashMap[key].push(items);
                }
            }
        });
        var str = '';
        for (var key in departmentHashMap) {
            str += '<li class="aui-list-header">' + key + '</li>';
            departmentHashMap[key].forEach(function(items, index) {
                str += '<li class="aui-list-item" tapmode data-uuid="' + items.uuid + '" onclick="affairClick(this)">' +
                    '<div class="aui-list-item-inner aui-list-item-arrow">' +
                    '<div class="aui-list-item-title">' + items.name + '</div>' +
                    '<div class="aui-list-item-right"></div>' +
                    '</div>';
            });
            str += '</li>';
        }
        $('.aui-list').html(str);
        setTimeout(function(){
            $('.aui-list .aui-list-item').eq(0).trigger('click');
            api.parseTapmode();
        },1000);
    });
}

function affairClick(obj) {
    var affairId = $(obj).attr('data-uuid');
    $('.aui-list .aui-list-item').removeClass('menuActive');
    $(obj).addClass('menuActive');
    var affairParams;
    for (var key in departmentHashMap) {
        departmentHashMap[key].forEach(function(items,index){
            if(items.uuid==affairId){
                affairParams = items;
            }
        });
    }
    // log(affairParams);
    var title = affairParams.name;
    api.execScript({
        name: "responseAffairWin",
        script: '$(".aui-title").text("'+title+'")'
    });
    api.sendEvent({
        name: 'responseAffairClick',
        extra: affairParams
    });
}
