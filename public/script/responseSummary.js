apiReady(function(){
  api.addEventListener({
      name: 'responseAffairClick'
  }, function(ret, err) {
      //给摘要页面，消息列表页面，发送消息页面发送通知
      // alert(JSON.stringify(ret.value));
      for(var key in ret.value){
          if(key=='secret'){
              $('.'+key).text(ret.value[key]?'是':'否');
          }else{
              $('.'+key).text(ret.value[key]);
          }
      }
      $('.department').text(ret.value['RespoAffairs'][0].department?ret.value['RespoAffairs'][0].department:'');
      $('.resposibility').text(ret.value['RespoAffairs'][0].resposibility?ret.value['RespoAffairs'][0].resposibility:'');
      $('.labels').text(ret.value['RespoAffairs'][0].labels?ret.value['RespoAffairs'][0].labels:'');
  });
});
