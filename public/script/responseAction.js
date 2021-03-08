apiReady(function(){
    api.addEventListener({
        name: 'responseAffairClick'
    }, function(ret, err) {
        //给摘要页面，消息列表页面，发送消息页面发送通知
        // alert(JSON.stringify(ret.value));
    });
});

function actionClick(obj){
  $('.aui-list-item').removeClass('menuActive');
  $(obj).addClass('menuActive');
  var index = $(obj).attr('data-index');
  api.execScript({
      name: "responseAffairWin",
      script: 'changeFrameIndex("'+index+'")'
  });
}
