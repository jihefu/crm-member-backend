$(document).ready(function(){
	getActionData();
	$('input').not('[type=file]').click(function(e){
        e.preventDefault();
        var val = $(this).val();
        $(this).val('');
        $(this).val(val);
        $(this).focus();
    });
    $('select').change(function(){
    	initChanelText();
    });
    var s_arr = [
        {
            key: 'channel',
            val: channel
        },
        {
            key: 'director_evaluate',
            val: director_evaluate
        },
        {
            key: 'cus_evaluate',
            val: cus_evaluate
        }
    ];
    s_arr.forEach(function(items,index){
        $('select[name='+items.key+'] option').each(function(){
            if($(this).html()==items.val) $(this).prop('selected',true);
        });
    });
    initChanelText();
    if($('button[name=start_time]').html()==''){
    	$('button[name=start_time]').html(dateTime());
    }
});
$(document).on('blur','input[name=tag]',function(){
	var v = $(this).val();
	$(this).parent().html('<button name="tag" onclick="getTags(this);">'+v+'</button>');
});
$(document).on('click','.weui-animate-fade-in,.weui-picker__hd a[data-action=cancel]',function(){
	$('input[name=cus_abb]').val($('input[name=cus_abb]').attr('data-value'));
	$('input[name=cus_manager]').val($('input[name=cus_manager]').attr('data-value'));
});
function initChanelText(){
	var v = $('select[name=channel]').val();
	if(v=='电话'){
		$('.channel-key').text('电话号码');
	}else if(v=='电子邮件'){
		$('.channel-key').text('邮件地址');
	}else if(v=='见面'){
		$('.channel-key').text('见面地址');
	}else if(v=='QQ'){
		$('.channel-key').text('QQ号');
	}else if(v=='微信'){
		$('.channel-key').text('微信号');
	}else if(v=='站内信'){
		$('.channel-key').text('会员名');
	}
}
function getRes(obj){
	if($(obj).attr('name')=='cus_abb'){
		var url = 'common/cust';
	}else if($(obj).attr('name')=='cus_manager'){
		var url = 'common/employee';
	}
	var val = $(obj).val();
    $(obj).val('');
    $(obj).val(val);
    $(obj).focus();
    $.ajax({
		url:route(url),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			val: val
		},
		success:function(res){
			var arr = [];
			if(res.data[0]==null){
				wxToast('不存在');
				$(obj).val($(obj).attr('data-value'));
			}else{
				res.data.forEach(function(items,index){
					var o = {};
					o.label = items.cn_abb;
					o.value = items.cn_abb;
					arr.push(o);
				});
				weui.picker(arr, {
				   	defaultValue: [val],
			        onConfirm: function (result) {
			       		$(obj).val(result[0]);
			       		$(obj).attr('data-value',result[0]);
			        }
				});
			}
		}
	});
}
function getActionData(){
	var id = window.location.href.split('/inter_action/')[1];
	id = id.split('?')[0];
	$.ajax({
		url:route('admin/intercourse/info'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"id":id
		},
		success:function(res){
			initContent(res.data.body);
		}
	});
}
function initContent(data){
	var str = '';
	for (let i = 0; i < data.length; i++) {
		var temp = data[i].action_type.split('json/')[1];
		str += renderTemp(temp,data[i]);
	};
	setTimeout(function(){
		initAlbum(data);
	},0);
	$('.action_content').append(str);
	$('.add').css('display','inline-block');
	setTimeout(function(){
		data.forEach(function(items,index){
			var t = items.stage;
			$('select[name=stage]').eq(index).find('option').each(function(){
				if($(this).html()==t){
					$(this).prop('selected',true);
				}
			});
		});
	},100);
}
function initAlbum(data){
	var album_arr = data[0].action_img.split(',');
	if(album_arr[0]!=''){
		var album_str = '';
		for (var i = 0; i < album_arr.length; i++) {
			album_str += '<div class="aui-slide-node">'+
								'<a href="../img'+album_arr[i]+'">'+
									'<img src="../img'+album_arr[i]+'" height="100%">'+
								'</a>'+
							'</div>';
		};
		var str = '<div class="img" id="aui-slide" style="background:none;height:7.5rem;text-align:center;">'+
						'<div class="aui-slide-wrap">'+album_str+'</div>'+
						'<div class="aui-slide-page-wrap"></div>'+
					'</div>';
		$('body').prepend(str);
		var slide = new auiSlide({
			 "container":document.getElementById("aui-slide"),
			 // "height":240,
	        "speed":500,
	        "autoPlay": 3000, //自动播放
	        "loop":true,
	        "pageShow":true,
	        "pageStyle":'dot',
	        'dotPosition':'center'
		});
	}
}
function getTags(obj){
	var stage = $(obj).parent().prev().find('select').val();
	var defaultValue = $(obj).html();
	$.ajax({
		url:route('admin/intercourse/tag'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			stage: stage
		},
		success:function(res){
			var data = res.data;
			var list_arr = [];
			data.forEach(function(items,index){
				var o = {
					label: items.tag,
					value: items.tag
				};
				list_arr.push(o);
			});
			var o = {
				label: '自定义',
				value: '自定义'
			};
			list_arr.push(o);
			dropList(list_arr,defaultValue,obj);
		}
	});
}
function dropList(arr,defaultValue,obj){
    weui.picker(arr, {
    	defaultValue: [defaultValue],
        onConfirm: function (result) {
        	if(result[0]=='自定义'){
        		$(obj).parent().html('<input name="tag" type="text" placeholder="请输入自定义标签" />');
        	}else{
        		$(obj).html(result[0]);
        	}
        }
    });
}
function sub(){
	var _e = 0;
	for (var i = 0; i < $('.head input').length; i++) {
		if($('.head input').eq(i).val()==''){
			wxToast('输入不能为空');
			_e = 1;
			$('.head input').eq(i).focus();
		}
	}
	if(_e) return;
	var id = window.location.href.split('/inter_action/')[1];
	id = id.split('?')[0];
	var head_arr = [],body_arr = [],foot_arr = [];
	$('.head input,.head select,.head button').each(function(){
		if($(this).attr('name')=='start_time'){
			var obj = {
				key: $(this).attr('name'),
				val: $(this).html()
			};
		}else{
			var obj = {
				key: $(this).attr('name'),
				val: checkCode($(this).val())
			};
		}
		head_arr.push(obj);
	});
	$('.foot input,.foot select').each(function(){
		var obj = {
			key: $(this).attr('name'),
			val: checkCode($(this).val())
		};
		foot_arr.push(obj);
	});
	$('.action_item').each(function(i){
		var id = $(this).attr('data-id');
		var action_arr = [];
		var that = this;
		$(this).find('select,button').each(function(){
			var obj = {};
			obj.id = id;
			obj.key = $(this).attr('name');
			obj.val = $(this).attr('name')=='tag'?($(this).html()=='请输入标签'?'':$(this).html()):$(this).val();
			action_arr.push(obj);
		});
		var obj = {};
		obj.id = id;
		obj.key = 'action_content';
		obj.val = {};
		obj.val.class = $(this).attr('data-class');
		$(this).find('textarea').each(function(){
			obj.val[$(this).attr('name')] = $(this).val();
		});
		action_arr.push(obj);
		body_arr.push(action_arr);
	});
	wxLoadToast('正在提交');
	$.ajax({
		url:route('m/admin_ajax/intercourse/sub'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			"id": id,
			"head_arr": JSON.stringify(head_arr),
			"body_arr": JSON.stringify(body_arr),
			"foot_arr": JSON.stringify(foot_arr)
		},
		success:function(res){
			$('#loadingToast').remove();
			reload(res.msg);
		}
	});
}
function add(){
	var temp_str = '';
	inter_action_temp_arr.forEach(function(items,index){
		temp_str += '<div class="weui-cell weui-cell_switch">'+
		                '<input class="weui-switch" name="action_type" type="radio" value="'+items.key+'">'+
		                '<p style="margin-left: 0.7rem">'+items.name+'</p>'+
			        '</div>';
	});
	var str = '<div class="js_dialog" id="wxDialog">'+
	            '<div class="weui-mask"></div>'+
	            '<div class="weui-dialog">'+
	                '<div class="weui-dialog__bd">'+temp_str+'</div>'+
	                '<div class="weui-dialog__ft">'+
	                    '<a href="javascript:;" onclick="comfirm()" class="weui-dialog__btn weui-dialog__btn_primary">确定</a>'+
	                    '<a href="javascript:;" onclick="cancel()" class="weui-dialog__btn weui-dialog__btn_default">取消</a>'+
	                '</div>'+
	            '</div>'+
	        '</div>';
	$('body').append(str);
	$('input[name=action_type]').eq(0).prop('checked',true);
}
function comfirm(){
	var id = window.location.href.split('/inter_action/')[1];
	id = id.split('?')[0];
	var template = $('.weui-dialog input[type=radio]:checked').val();
	if(!template){
		return;
	}
	cancel();
	wxLoadToast('正在提交');
	$.ajax({
		url:route('m/admin_ajax/intercourse/addTemp'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			id: id,
			template: template
		},
		success:function(res){
			$('#loadingToast').remove();
			wxToast(res.msg);
			if(res.code==200){
				var str = '';
				var temp = template.split('json/')[1];
				var params = {
					id: res.data[0].id,
					action_type: template,
					action_content: JSON.stringify({})
				};
				$('.action_content').append(renderTemp(temp,params));
			}
		}
	});
}
function cancel(){
	$('#wxDialog').remove();
}
function star(obj){
	var id = window.location.href.split('/inter_action/')[1];
	id = id.split('?')[0];
	var star = $(obj).val(); 
	wxLoadToast('正在提交');
	$.ajax({
		url:route('m/admin_ajax/intercourse/star'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			"id": id,
			"star": star
		},
		success:function(res){
			$('#loadingToast').remove();
			reload(res.msg);
		}
	});
}
var uploading = false;
function uploadImg(){
	if($('.weui-uploader').length==1) return;
	var id = window.location.href.split('/inter_action/')[1];
	id = id.split('?')[0];
	var str = `<div class="weui-cells weui-cells_form">
			        <div class="weui-cell">
			            <div class="weui-cell__bd">
			                <div class="weui-uploader">
			                    <div class="weui-uploader__hd">
			                        <p class="weui-uploader__title"></p>
			                    </div>
			                    <div class="weui-uploader__bd">
			                        <ul class="weui-uploader__files weui-uploader__file_status" id="uploaderFiles">
			                        </ul>
			                        <div class="weui-uploader__input-box">
			                            <input id="uploaderInput" class="weui-uploader__input" type="file" accept="image/*" multiple="">
			                        </div>
			                    </div>
			                </div>
			            </div>
			        </div>
			    </div>`;
	$('.add').eq(0).before(str);
	$('#uploaderInput').change(function(e){
		if(uploading){
			e.preventDefault();
			wxToast('请等待上传完毕');
			return;
		}
		var len = e.target.files.length;
		var str = '';
		var formData = new FormData();
		for (var i = 0; i < len; i++) {
			str += ` <li class="weui-uploader__file weui-uploader__file_status up">
	                    <div class="weui-uploader__file-content">
	                        <i class="weui-loading"></i>
	                    </div>
	                </li> `;
	        formData.append("img", e.target.files[i]);
	        formData.append("id", id);
		};
		$('#uploaderFiles').append(str);
		uploading = true;
		$.ajax({
            url: route('m/admin_ajax/inter_upload'),
            type: 'POST',
            data: formData,
			dataType:"json",
            cache: false,
            contentType: false, //不可缺参数
            processData: false, //不可缺参数
            success: function(data) {
            	uploading = false;
				data.data.forEach(function(items,index){
					items = items.replace('\\','/');
					$('#uploaderFiles .up').eq(index).css({
						'background-image': 'url(../img/intercourse'+items+')'
					});
				});
				$('#uploaderFiles .up .weui-uploader__file-content').remove();
				$('.up').removeClass('up');
				reload(data.msg);
            }
        });
	});
}
function contactsPhone(obj){
	if($('select[name=channel]').val()!='电话') return;
	if($(obj).attr('data-list')==1) return;
	$(obj).attr('data-list',1);
	var cus_person = $('input[name=cus_person]').val();
	var join_person = $('input[name=join_person]').val();
	var name_arr = [cus_person+','+join_person];
	var split_arr = [',','，'];
	for (let i = 0; i < split_arr.length; i++) {
		var _arr = [];
		for (let j = 0; j < name_arr.length; j++) {
			name_arr[j].split(split_arr[i]).forEach(function(items,index){
				_arr.push(items);
			});
		};
		name_arr = _arr;
	};
	name_arr = arrayUnique(name_arr);
	name_arr.push($('input[name=cus_abb]').val());
	$.ajax({
		url:route('common/contacts_phone'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"name_arr": JSON.stringify(name_arr)
		},
		success:function(res){
			var phone_arr = [];
			res.data.forEach(function(items,index){
				var phone_obj = {};
				phone_obj.label = items;
				phone_obj.value = items;
				phone_arr.push(phone_obj);
			});
			weui.picker(phone_arr, {
		        onConfirm: function (result) {
		        	$(obj).val(result[0]);
		        }
		    });
		}
	});
}
function relate(){
	var contract_no_arr = [],knowledge_arr = [];
	for (let i = 0; i < $('textarea[name=contract_no]').length; i++) {
		if($('textarea[name=contract_no]').val()!=''){
			contract_no_arr.push($('textarea[name=contract_no]').val());
		}
	}
	for (let i = 0; i < $('div[data-class="json/knowledge"]').length; i++) {
		var v = $('div[data-class="json/knowledge"]').attr('data-id');
		var name = $('div[data-class="json/knowledge"]').eq(i).find('textarea[name=question]').val();
		knowledge_arr.push({v: v,name: name});
	}
	contract_no_arr = splitStr(contract_no_arr,[',','，']);

	var temp_str = '';
	if(contract_no_arr[0]!=null){
		contract_no_arr.forEach(function(items,index){
			temp_str += '<div class="weui-cell weui-cell_switch">'+
			                '<input class="weui-switch" name="relate" data-value="contract" type="radio" value="'+items+'">'+
			                '<p style="margin-left: 0.7rem">'+items+'</p>'+
				        '</div>';
		});
	}
	if(knowledge_arr[0]!=null){
		knowledge_arr.forEach(function(items,index){
			temp_str += '<div class="weui-cell weui-cell_switch">'+
			                '<input class="weui-switch" name="relate" data-value="knowledge" type="radio" value="'+items.v+'">'+
			                '<p style="margin-left: 0.7rem;width:10.625rem;overflow: hidden;text-overflow:ellipsis;white-space: nowrap;">'+items.name+'</p>'+
				        '</div>';
		});
	}
	if(temp_str==''){
		wxToast('暂无关联信息');
	}else{
		var str = '<div class="js_dialog" id="wxDialog">'+
		            '<div class="weui-mask"></div>'+
		            '<div class="weui-dialog">'+
		                '<div class="weui-dialog__bd">'+temp_str+'</div>'+
		                '<div class="weui-dialog__ft">'+
		                    '<a href="javascript:;" onclick="goToRelation()" class="weui-dialog__btn weui-dialog__btn_primary">确定</a>'+
		                    '<a href="javascript:;" onclick="cancel()" class="weui-dialog__btn weui-dialog__btn_default">取消</a>'+
		                '</div>'+
		            '</div>'+
		        '</div>';
		$('body').append(str);
		$('#wxDialog input[name=relate]').eq(0).prop('checked',true);
	}
}
function goToRelation(){
	var key = $('#wxDialog input[type=radio]:checked').attr('data-value');
	var val = $('#wxDialog input[type=radio]:checked').val();
	if(key=='contract'){
		window.location.href = route('contract/head/'+val);
	}else if(key=='knowledge'){
		// window.location.href = route();
		wxToast('暂未开通');
	}
}