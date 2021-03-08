/**
 * Created by 18468 on 2017/4/5.
 */
/**
 * 模态框的关闭
 * */

var modal=document.getElementById("cd-modal");
    modal.onclick=function(){
        var cdmodal=document.getElementsByClassName("cd-modal")[0];
        cdmodal.style.display="none";
        var parent=document.getElementsByClassName("cd-img")[0];
		
        var children=parent.children;
		//console.log(children)
        for(var i=0;i<children.length;i++){
                if(children[i].children.length==2){
                    parent.removeChild(children[i])
						i--;
						//console.log(children[i])
                }
            }

    }
/***
 *
 * 模态框弹出与展示
 * */

    
    function cdIn(){
        var cdmodal=document.getElementsByClassName("cd-modal")[0];
            cdmodal.style.display="block";
			// data={"cpy":$('tbody[data-cpy]').attr('data-cpy')};
			data = {
				"no": $('input[name=contract_no]').val()
			};
			 $.ajax({
                        url: router('contract/getImg'),
                        type: 'GET',
                        data: data,
						dataType:'json',
                        cache: false,
                        success: function(data) {
							if (data!="")
							{
							
								for (var i=0;i<data.length ;i++ )
								{
									var url=data[i];
										upView(url)
								}
								
							}
                        },
                        error: function() {
                            console.log('error');
                        }
                    });
   } 

    /***
     * 上传图片并展示
     */
$('input[type=file]').change(function(event) {
        if ($('input[type=file]').val().length) {
            var fileName = $('input[type=file]').val();
			var filenode = document.getElementById("cd-file");
            var extension = fileName.substring(fileName.lastIndexOf('.'), fileName.length).toLowerCase();
            if (extension == ".jpg" || extension == ".png" || extension == ".jpeg") {
                    var data = new FormData();
                    data.append("img", filenode.files[0]);
                    data.append('name', $('input[name=contract_no]').val());

                    $.ajax({
                        url: router('contract/uploadImg'),
                        type: 'POST',
                        data: data,
						dataType:"json",
                        cache: false,
                        contentType: false, //不可缺参数
                        processData: false, //不可缺参数
                        success: function(data) {
									toast(data.msg);
									var album=data.data[0].album;
									var arr=album.split(",")
									var url=arr[arr.length-1];
									upView(url);
									filenode.value=null;
                        },
                        error: function() {
                            console.log('error');
                        }
                    });
            } 
        }
    });

function upView(url){
        var img=document.createElement('img');
        img.src="../img"+url;
        img.width="100";
        img.height="100";
        img.setAttribute("ondblclick","dbImg(this)");
        var parents=document.getElementsByClassName("cd-img");
        var olds=document.getElementsByClassName("cd-input");
        var old=olds[0];         //cd-input
        var parent=parents[0];   //cd-img
        var span = document.createElement('span');
        span.className = "iconfont icon-correct"; //span
        span.style.display='none';
        var div=document.createElement("div");
        div.appendChild(img);
        div.insertBefore(span, img);
        parent.insertBefore(div,old);
}


/****
 * 选择打钩与取消
 *
 */


var cdimg=document.getElementsByClassName("cd-img")[0]; //父元素
cdimg.onclick=function(e){
   var child=e.target   //子元素
    // console.dir(child)
    if(child.tagName=="SPAN"){
               child.style.display="none"
    }else if(child.tagName=="IMG"){
          var span=child.previousElementSibling;
          if(span.style.display=="none"){
              span.style.display="block"
          }else{
              span.style.display="none";
          }

    }
}
/***
 *点击删除
 */

var cddelete=document.getElementById("cd-delete");
	cddelete.onclick=function(){
		var delImg=[];
		// var cpy=$('tbody[data-cpy]').attr('data-cpy');
		var no = $('input[name=contract_no]').val();
		var spans=document.getElementsByTagName("span")
		for(var i=0;i<spans.length;i++){
			if(spans[i].style.display=="block"){
					var src=spans[i].nextElementSibling.getAttribute("src");
					var strs=src.split("/");
					var imgName=strs[strs.length-1];
					var str="/contract/"+imgName;
					delImg.push(str);
			}
		};
		
		if(delImg.length!=0){
			var a=JSON.stringify(delImg);
			data={'pic':a,"no":no};
			//console.log(data)
				$.ajax({
					url: router('contract/delImg'),
					type: 'POST',
					data: data,
					dataType:'json',
					cache: false,
					success: function(data) {
								for(var i=0;i<spans.length;i++){
							       if(spans[i].style.display=="block"){
									spans[i].parentElement.parentElement.removeChild(spans[i].parentElement);
									i--;
							     }
						     };
							 toast("删除成功");

					},
					error: function() {
						console.log('error');
					}
				});
		}
}
/***
* 设为封面
*/
 var cdCover = document.getElementById("cd-cover");
	cdCover.onclick=function(){
		var num=0;
		var arr=[];
		var spans=document.getElementsByTagName("span")
			for(var i=0;i<spans.length;i++){
				if(spans[i].style.display=="block"){
					var src=spans[i].nextElementSibling.getAttribute("src");
					var strs=src.split("/");
						arr.push(strs[strs.length-1])
						num++;

				}
		};
		if(num!=1){
			toast("请选择一张图片");
		}else{
			var no = $('input[name=contract_no]').val();
			data={"pic":arr[0],"no":no};
			$.ajax({
				url: router('contract/cover'),
				type: 'POST',
				data: data,
				dataType:'json',
				cache: false,
				success: function(data) {
						for(var i=0;i<spans.length;i++){
								if(spans[i].style.display=="block"){
									var span=spans[i]
								}
						}
						var sel=span.parentElement;
						var parent=sel.parentElement;
						parent.removeChild(sel);
						var first=parent.children[0];
						parent.insertBefore(sel,first);
						toast("设为封面成功");
				},
				error: function() {
					console.log('error');
				}
			});
		}
			
	} 