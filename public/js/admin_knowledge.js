var ctrlPage,change = 0;
var DOC;
function PageChild(opt){}
PageChild.prototype = new Page({
	page: 1,
	url: 'admin/knowledge/page_default'
});
PageChild.prototype.setList = function(res,cb){
	var removeTag = function(text){
		text = text.replace(/<\/br>/ig,'\n');
		text = text.replace(/&nbsp;/ig,' ');
		return text;
	}
	if(res.data[0]==null){
		toast('没有更多了');
		return;
	}
	var str = '';
	for (var i = 0; i < res.data.length; i++) {
		str += '<li onclick="checkCpy(this);" data-id="'+res.data[i].id+'">'+
					'<p>'+
						'<span>'+removeTag(res.data[i].question)+'</span>'+
					'</p>'+
				'</li>';
	};
	$('.bar-bottom ul').html(str);
	cb();
}
$(document).ready(function(){
	$('.bar-bottom li').eq(0).trigger('click');
	ctrlPage = new PageChild();
	$(document).on('change','textarea',function(){
		change = 1;
	});
	$(document).on('change','input[type=checkbox]',function(){
		change = 1;
	});
	$(document).on('change','.my_tag',function(){
		change = 1;
	});
	inputDel();
	sort();
	tagInputSearch();
	$('body').click(function(){
		$('.more-tags').remove();
		$('.tag-more').css({
			border: 'none'
		});
	});
});
var timer;
$(document).on('mouseover','.form-group .item,.input-group .item',function(){
	var that = this;
	timer = setTimeout(function(){
		var v = $(that).text();
		var w = $(that).width();
		$(that).attr('data-value',v);
		$(that).attr('data-width',w);
		$(that).width(w);
		$(that).text('移除');
	},2000);
});
$(document).on('mouseout','.form-group .item,.input-group .item',function(){
	clearTimeout(timer);
	var v = $(this).attr('data-value');
	var w = $(this).attr('data-width');
	$(this).width(w);
	$(this).text(v);
});
$(document).on('click','.form-group .item,.input-group .item',function(e){
	if($(this).text()=='移除'){
		e.preventDefault();
		hoverRemoveTag($(this).attr('data-value'));
	}
});
$(document).on('click','.small_tags',function(e){
	var v = $(this).html();
	var _v = $('#search').val();
	if(_v.indexOf(v)==-1){
		$('#search').val(_v+v);
	}	
});
function hoverRemoveTag(text){
	var str = '<div class="modal-dialog my-dialog" style="display:block">'+
					'<div class="modal-content">'+
						'<div class="modal-header">'+
							'<h5 class="modal-title" id="myModalLabel">删除提醒</h5>'+
						'</div>'+
						'<div class="modal-body">'+
							'<p>确认删除？</p>'+
						'</div>'+
						'<div class="modal-footer">'+
							'<button type="button" class="btn btn-default" data-dismiss="modal" onclick="cancel()">取消</button>'+
							'<button type="button" class="btn btn-primary" data-text="'+text+'" onclick="delTag(this)">确定</button>'+
						'</div>'+
					'</div>'+
				'</div>';
	$('body').append(str);
	$('.my-mask').show();
}
function delTag(obj){
	var text = $(obj).attr('data-text');
	if($('.dialog-tag').css('display')=='block'){
		toast('正在删除','info',1);
		$.ajax({
			url:route('admin/knowledge/delTag'),
			type:'post',
			dataType:'json',
			timeout:30000,
			data:{
				"text":text
			},
			success:function(res){
				$('.my-toast').remove();
				toast(res.msg);
				cancel();
				addTag();
			}
		});
	}else{
		$('.form-group .item[data-value="'+text+'"]').remove();
		change = 1;
		cancel();
	}
}
function inputDel(){
	$('#search').focus(function(e){
		if(document.activeElement.id=='search'&&$('#search').val()!=''){
			var left = $('#search').width();
			var top = $('#search').height()-13;
			$('.icon-form-del').css({
				'display':'block',
				'left':left,
				'top':top
			});
		}
		document.onkeyup = function(e){
			if(document.activeElement.id=='search'&&e.keyCode==13){
				$('.sear button').trigger('click');
			}
			if(document.activeElement.id=='search'&&$('#search').val()!=''){
				var left = $('#search').width();
				var top = $('#search').height()-13;
				$('.icon-form-del').css({
					'display':'block',
					'left':left,
					'top':top
				});
			}
		}
	});
	$('#search').blur(function(){
		setTimeout(function(){
			$('.icon-form-del').hide();
		},300);
	});
}
function cl(){
	$('#search').val('').focus();
}
function search(){
	var keywords = $('#search').val();
	keywords = keywords.toUpperCase();
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/knowledge/search'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"keywords":keywords
		},
		success:function(res){
			$('.my-toast').remove();
			if(res.data[0]==null){
				toast(res.msg);
				return;
			}
			ctrlPage.page = 1;
			ctrlPage.url = 'admin/knowledge/search';
			ctrlPage.keywords = keywords;
			ctrlPage.setList(res,function(){
				$('.page_num').html(ctrlPage.page);
				$('.bar-bottom ul li').eq(0).trigger('click');
			});
		}
	});
}
function tagInputSearch(){
	$('.s-p .dropdown-menu li').click(function(){
		var tag = $(this).attr('data-key');
		tag = '['+tag+']';
		v = $('#search').val();
		if(v.indexOf(tag)==-1){
			$('#search').val(v+tag);
		}
	});
}
function sort(){
	$('.sort-dropdown .dropdown-menu li').click(function(){
		var key = $(this).attr('data-key');
		var text = $(this).text();
		$('#dropdownMenu1').html(text+'<span class="caret"></span>');
		toast('正在搜索...','info',1);
		$.ajax({
			url:route('admin/knowledge/sort'),
			type:'get',
			dataType:'json',
			timeout:30000,
			data: {
				keywords: key
			},
			success:function(res){
				$('.my-toast').remove();
				if(res.data[0]==null){
					toast(res.msg);
					return;
				}
				ctrlPage.page = 1;
				ctrlPage.url = 'admin/knowledge/sort';
				ctrlPage.keywords = key;
				ctrlPage.setList(res,function(){
					$('.page_num').html(ctrlPage.page);
					$('.bar-bottom ul li').eq(0).trigger('click');
				});
			}
		});
	});
}
function add(){
	$.ajax({
		url:route('admin/knowledge/add'),
		type:'post',
		dataType:'json',
		timeout:30000,
		success:function(res){
			ctrlPage.setList(res,function(){
				$('.page_num').html(ctrlPage.page);
				$('.bar-bottom ul li').eq(0).trigger('click');
			});
		}
	});
}
function prev(){
	ctrlPage.prev({},function(res){
		ctrlPage.setList(res,function(){
			$('.page_num').html(ctrlPage.page);
			$('.bar-bottom ul li').eq(0).trigger('click');
		});
	});
}
function next(){
	ctrlPage.next({},function(res){
		ctrlPage.setList(res,function(){
			$('.page_num').html(ctrlPage.page);
			$('.bar-bottom ul li').eq(0).trigger('click');
		});
	});
}
function checkCpy(obj){
	if(change){
		sub();
		return;
	}
	var id = $(obj).attr('data-id');
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/knowledge/no'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data:{
			"id":id
		},
		success:function(res){
			$('body').attr('data-id',id);
			$('.bar-bottom ul li').removeClass('high-light');
			$(obj).addClass('high-light');
			$('.my-toast').remove();
			initContent(res.data);
		}
	});
}
function initContent(data){
	var removeTag = function(text){
		try{
			text = text.replace(/<\/br>/ig,'\n');
			text = text.replace(/&nbsp;/ig,' ');
		}catch(e){}
		return text;
	}
	$('.text-question').val(removeTag(data[0].question));
	$('.text-analysis').val(removeTag(data[0].analysis));
	$('.text-solution').val(removeTag(data[0].solution));

	//标签
	var arr = [];
	try{
		arr = data[0].tags.split(',');
	}catch(e){
		arr = [''];
	}
	var interText = doT.template($("#show_tags").text());
	$(".table-wrap .tags").html(interText(arr));

	//文档
	var doc_arr = [],doc_name_arr = [];
	try{
		doc_arr = data[0].documents.split(',');
	}catch(e){
		doc_arr = [''];
	}
	doc_arr.forEach(function(items,index){
		doc_name_arr.push(items.split('/knowledge_lib/')[1]);
	});
	var doc_obj = {
		doc_arr: doc_arr,
		doc_name_arr: doc_name_arr
	};
	var interText = doT.template($("#show_doc").text());
	$(".table-wrap .doc").html(interText(doc_obj));

	//图片
	if(data[0].album==null||data[0].album==''){
		var arr = [''];
	}else{
		var arr = data[0].album.split(',');
	}
	var interText = doT.template($("#album").text());
	$("#myCarousel").html(interText(arr));
	$('.carousel').carousel();

	var interText = doT.template($("#info").text());
	$(".right-bar ul").html(interText(data));
}
function del(){
	var str = '<div class="modal-dialog my-dialog" style="display:block">'+
					'<div class="modal-content">'+
						'<div class="modal-header">'+
							'<h5 class="modal-title" id="myModalLabel">删除提醒</h5>'+
						'</div>'+
						'<div class="modal-body">'+
							'<p>确认删除？</p>'+
						'</div>'+
						'<div class="modal-footer">'+
							'<button type="button" class="btn btn-default" data-dismiss="modal" onclick="cancel()">取消</button>'+
							'<button type="button" class="btn btn-primary" onclick="delComfirm()">确定</button>'+
						'</div>'+
					'</div>'+
				'</div>';
	$('body').append(str);
	$('.my-mask').show();
}
function delComfirm(){
	var id = $('body').attr('data-id');
	$.ajax({
		url:route('admin/knowledge/del'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			"id":id
		},
		success:function(res){
			window.location.reload();
		}
	});
}
function addTag(){
	var tags = new Tags();
	tags.getTags(function(){
		tags.renderTags();
	});
	$('.my-mask,.dialog-tag').show();
}
function addDoc(){
	DOC = new Doc();
	DOC.getDoc(function(){
		DOC.renderDoc();
	});
	$('.my-mask,.dialog-doc').show();
}
function cancel(){
	$('.my-mask,.my-dialog').hide();
}
function subTag(){
	setTimeout(function(){
		var tags = [];
		$(".dialog-tag input[type=checkbox]:checked").each(function(){
			tags.push($(this).next().text());
		});
		var interText = doT.template($("#show_tags").text());
		$(".table-wrap .tags").html(interText(tags));
		cancel();
	},50);
}
function subDoc(){
	updateContent();
	cancel();
}
function myTag(obj){
	var v = $(obj).val();
	var str = '<li>'+
				'<label>'+
					'<input type="checkbox" checked>'+
					'<div class="item">'+v+'</div>'+
				'</label>'+
			'</li>';
	$(obj).before(str);
	$(obj).val('');
}
function sub(){
	var dealInput = function(text){
		var str = '';
		for (var i = 0; i < text.length; i++) {
			if(text[i]=='"'||text[i]=='\''){
				str += '\\'+text[i];
			}else if(text[i]=='\n'){
				str += '</br>';
			}else if(text[i]==' '){
				str += '&nbsp;';
			}else{
				str += text[i];
			}
		};
		return str;
	}
	var question = dealInput($('.text-question').val());
	var analysis = dealInput($('.text-analysis').val());
	var solution = dealInput($('.text-solution').val());
	var tags = '',documents = '';
	$('.tags .item').each(function(){
		tags += $(this).text()+',';
	});
	tags = tags.slice(0,tags.length-1);
	$('.doc .item').each(function(){
		documents += $(this).text()+',';
	});
	documents = documents.slice(0,documents.length-1);
	var id = $('body').attr('data-id');
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/knowledge/sub'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			question: question,
			analysis: analysis,
			solution: solution,
			tags: tags,
			documents: documents,
			id: id
		},
		success:function(res){
			change = 0;
			$('.my-toast').remove();
			toast('提交成功');
			setTimeout(function(){
				$('.bar-bottom li[data-id='+id+']').trigger('click');
			},1000);
		}
	});
}

function uploadFile(){
	var fileName = $('.modal-footer input[type=file]').val();
	var extension = fileName.substring(fileName.lastIndexOf('.'), fileName.length).toLowerCase();
	if (extension == ".txt" || extension == ".pdf" || extension == ".html"|| extension == ".doc"|| extension == ".docx"|| extension == ".xslx"|| extension == ".xls"|| extension == ".zip"|| extension == ".rar") {
		var data = new FormData();
		var f = document.getElementById('docFile');
        data.append("file", f.files[0]);
        data.append('name', $('body').attr('data-id'));
        toast('正在上传...','info',1);
        $.ajax({
            url: router('knowledge/uploadFile'),
            type: 'POST',
            data: data,
			dataType:"json",
            cache: false,
            contentType: false, //不可缺参数
            processData: false, //不可缺参数
            success: function(data) {
            	$('.my-toast').remove();
            	$('.modal-footer input[type=file]').val('');
            	if(data.code==200){
            		toast(data.msg);
					// funDoc = null;
					// funDoc = singleDoc(createDocObj);
					cancel();
					setTimeout(function(){
						$('.bar-bottom li[data-id='+$('body').attr('data-id')+']').trigger('click');	
					},1000);
            	}else if(data.code==-1){
            		if(confirm(data.msg+'\n原文件信息（上传人：'+data.data.update_person+'，上传时间：'+data.data.time+')')){
            			$.ajax({
							url:route('admin/knowledge/continueUpload'),
							type:'post',
							dataType:'json',
							timeout:30000,
							data: data.data,
							success:function(res){
								$('.my-toast').remove();
								toast(res.msg);
								// funDoc = null;
								// funDoc = singleDoc(createDocObj);
								cancel();
								setTimeout(function(){
									$('.bar-bottom li[data-id='+$('body').attr('data-id')+']').trigger('click');	
								},1000);
							}
						});
            		}
            	}else if(data.code==-2){
            		toast(data.msg);
            	}
            }
        });
	}else{
		toast('不支持该类型文档，请联系开发人员');
	}
}

function q_input(obj){
	var val = $(obj).val();
	var id = $('body').attr('data-id');
	$('.bar-bottom li[data-id='+id+'] p span').text(val);
}
function tagSearch(){
	var text = $('.tag_search').val();
	if(text==''){
		cancel();
		addTag();
	}else{
		$('.p .item').css('background','#337ab7');
		$('.p .item').each(function(){
			if($(this).text().indexOf(text)!=-1){
				$(this).css('background','#e1d11f');
			}
		});
	}
}

function Tags(){
	this.arr = [];
}
Tags.prototype.getTags = function(cb){
	var that = this;
	$.ajax({
		url:route('admin/knowledge/getTags'),
		type:'get',
		dataType:'json',
		timeout:30000,
		success:function(res){
			that.arr = res.data;
			// that.arr[0] = res.data.q_tags_arr;
			// that.arr[1] = res.data.p_tags_arr;
			cb();
		}
	});
}
Tags.prototype.renderTags = function(){
	var tags_arr = [];
	var product_arr = [],part_arr = [],application_arr = [],function_arr = [],technology_arr = [],customer_arr = [];
	this.arr.forEach(function(items,index){
		if(items.type=='product'){
			product_arr.push(items);
		}else if(items.type=='part'){
			part_arr.push(items);
		}else if(items.type=='application'){
			application_arr.push(items);
		}else if(items.type=='function'){
			function_arr.push(items);
		}else if(items.type=='technology'){
			technology_arr.push(items);
		}else{
			customer_arr.push(items);
		}
	});
	tags_arr[0] = product_arr;
	tags_arr[1] = part_arr;
	tags_arr[2] = application_arr;
	tags_arr[3] = function_arr;
	tags_arr[4] = technology_arr;
	tags_arr[5] = customer_arr;
	var interText = doT.template($("#tags").text());
	$(".dialog-tag .modal-body").html(interText(tags_arr));
	var height = window.innerHeight;
	$('.dialog-tag .modal-body').css('max-height',height*0.7+'px');
	var tags_text_arr = [];
	$('.tags .item').each(function(){
		tags_text_arr.push($(this).text());
	});
	$(".dialog-tag .modal-body li").each(function(){
		for(let i = 0;i < tags_text_arr.length;i++ ){
			if($(this).find('.item').text()==tags_text_arr[i]){
				$(this).find('input[type=checkbox]').prop('checked','checked');
			}
		};
	});
}
function Doc(){
	this.arr = [];
	this.page = 1;
}
Doc.prototype.getDoc = function(cb){
	var that = this;
	$.ajax({
		url:route('admin/knowledge/getDoc'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			page: that.page
		},
		success:function(res){
			that.arr = res.data;
			cb();
		}
	});
}
Doc.prototype.renderDoc = function(){
	var interText = doT.template($("#doc").text());
	$(".dialog-doc .modal-body").html(interText(this.arr));
	var height = window.innerHeight;
	$('.dialog-doc .modal-body').css('max-height',height*0.7+'px');

	var doc_text_arr = [];
	$('.doc .item').each(function(){
		doc_text_arr.push($(this).text());
	});
	$(".dialog-doc .modal-body li").each(function(){
		for(let i = 0;i < doc_text_arr.length;i++ ){
			if($(this).find('span').text()==doc_text_arr[i]){
				$(this).find('input[type=checkbox]').prop('checked','checked');
			}
		};
	});
}

function doc_next(){
	updateContent();
	DOC.page++;
	DOC.getDoc(function(){
		if(DOC.arr[0]==null){
			toast('没有更多了');
			DOC.page--;
		}else{
			DOC.renderDoc();
		}
	});
}
function doc_prev(){
	updateContent();
	if(DOC.page==1) {
		toast('已是第一页');
		return;
	}
	DOC.page--;
	DOC.getDoc(function(){
		DOC.renderDoc();
	});
}
function updateContent(){
	var doc_arr = $(".dialog-doc input[type=checkbox]");
	var item_arr = $('.doc .item');
	for (var i = 0; i < doc_arr.length; i++) {
		var doc = doc_arr.eq(i).next().text();
		if(doc_arr.eq(i).prop('checked')==true&&item_arr.length==0){
			var str = '<a target="_blank" href = "../knowledge_lib/'+doc+'">'+
							'<div class="item">'+doc+'</div>'+
						'</a>';
			$('.doc').prepend(str);
		}
		for (var j = 0; j < item_arr.length; j++) {
			var text = item_arr.eq(j).text();
			if(doc_arr.eq(i).prop('checked')==true){
				if(doc==text){
					break;
				}else if(doc!=text&&j==item_arr.length-1){
					//添加一个
					var str = '<a target="_blank" href = "../knowledge_lib/'+doc+'">'+
									'<div class="item">'+doc+'</div>'+
								'</a>';
					$('.doc').prepend(str);
				}
			}else{
				if(doc==text){
					//删除一个
					item_arr.eq(j).remove();
				}
			}
		};
	};
}
function docSearch(){
	var text = $('.doc_search').val();
	if(text==''){
		var url = 'admin/knowledge/getDoc';
		var data = {
			page: 1
		};
	}else{
		var url = 'admin/knowledge/doc_search';
		var data = {
			text: text
		};
	}
	$.ajax({
		url:route(url),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: data,
		success:function(res){
			DOC.arr = res.data;
			DOC.renderDoc();
			if(text==''){
				$('.dialog-doc .modal-footer button:lt(2)').show();
			}else{
				$('.dialog-doc .modal-footer button:lt(2)').hide();
			}
		}
	});
}

function addSearchTag(obj){
	var val = $('#search').val();
	var v = $(obj).html();
	if(v==''||val.indexOf(v)==-1){
		$('#search').val(val+v);
	}else{
		return;
	}
}
function tagMore(obj){
	$.ajax({
		url:route('admin/knowledge/getTags'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			stage: ''
		},
		success:function(res){
			var hot_arr = [];
			$('.hot_tags span:not(".hot_tags span:last")').each(function(){
				hot_arr.push($(this).text());
			});
			for (var i = 0; i < hot_arr.length; i++) {
				for (var j = 0; j < res.data.length; j++) {
					if(res.data[j].tag==hot_arr[i]){
						res.data.splice(j,1);
						j--;
					}
				}
			}
			$(obj).css({
				"border": '1px solid #999',
				"border-bottom": 'none',
				"position": 'relative'
			});
			var width = $(obj).parent().width();
			var str = '<div class="more-tags" style="width:'+width+'px">';
			for (var i = 0; i < res.data.length; i++) {
				str += '<span class="small_tags">'+res.data[i].tag+'</span>';
			}
			str += '</div>';
			$('.hot_tags').after(str);
		}
	});
}