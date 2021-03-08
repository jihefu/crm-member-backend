var change = 0,m = 0,ctrlPage;
function PageChild(opt){}
PageChild.prototype = new Page({
	page: 1,
	url: 'admin/intercourse/page_default'
});
PageChild.prototype.setList = function(res,cb){
	if(res.data[0]==null){
		toast('没有更多了');
		return;
	}
	var str = '';
	for (var i = 0; i < res.data.length; i++) {
		str += '<li onclick="checkCpy(this);" data-id="'+res.data[i].id+'">'+
					'<p>'+
						'<span>'+res.data[i].cus_abb+'</span>'+
						'<span>'+res.data[i].cus_manager+'</span>'+
						'<span>'+res.data[i].start_time+'</span>'+
					'</p>'+
				'</li>';
	};
	$('.bar-bottom ul').html(str);
	cb();
}
$(document).ready(function(){
	ctrlPage = new PageChild();
	$('.bar-bottom li').eq(0).trigger('click');
	inputDel();
	sort();
	tagSearch();
	$('body').click(function(){
		$('.more-tags').remove();
		$('.tag-more').css({
			border: 'none'
		});
	});
});
$(document).on('click','input[name=cus_abb]',function(){
	var inputSearch = new PcInputSearch(this,'common/cust');
	inputSearch.init(function(val){
		inputSearch.render(val);
	});
});
$(document).on('click','input[name=cus_manager]',function(){
	var inputSearch = new PcInputSearch(this,'common/employee');
	inputSearch.init(function(val){
		inputSearch.render(val);
	});
});
$(document).on('click','input[name=channel_content]',function(){
	if($('input[name=channel]').val()!='电话') return;
	var cus_person = $('input[name=cus_person]').val();
	var join_person = $('input[name=join_person]').val();
	var name_arr = [cus_person+','+join_person];
	var split_arr = [',','，'];
	name_arr = splitStr(name_arr,split_arr);
	name_arr.push($('input[name=cus_abb]').val());
	function PhoneSearch(){
		PcInputSearch.apply(this,arguments);
	}
	PhoneSearch.prototype = new PcInputSearch();
	PhoneSearch.prototype.blur = 1;
	PhoneSearch.prototype.render = function(m_val){
		var that = this;
		$.ajax({
			url:route(that.url),
			type:'get',
			dataType:'json',
			timeout:30000,
			data:{
				"name_arr": JSON.stringify(name_arr),
				"val":m_val?m_val:that.m_val
			},
			success:function(res){
				if(res&&res.data!=''){
					var str = '';
					res.data.forEach(function(item){
						str +='<li>'+item+'</li>';
					});
					var width = $(that.obj).width();
					$(that.obj).parent().css('position','relative');
					$(that.obj).parent().find('ul').html(str);

					$('.selectList li').mouseover(function(){
						$(this).css('background','#999');
					});
					$('.selectList li').mouseout(function(){
						$(this).css('background','#fff');
					});
					$('.selectList li').click(function(){
						var val = $(this).html();
						$(that.obj).val(val);
						that.val = m_val;
						setTimeout(function(){
							$('.selectList').remove();
						},200);
					});
				}else{
					$('.selectList').html('不存在');
				}
			}
		});
	}
	var inputSearch = new PhoneSearch(this,'common/contacts_phone');
	inputSearch.init(function(val){
		inputSearch.render(val);
	});
});
$(document).on('click','tbody input[data-arr!=""]',function(){
	if($(this).attr('readonly')!='readonly'){
		try{
			var selectList = new SelectList(this);
			selectList.init();
		}catch(e){

		}
	}
});
$(document).on('click','.selectList li',function(){
	dataChange();
	if($(this).parent().prev().attr('name')=='director_evaluate'){
		starSub();
	}
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
/**
 * [hoverRemoveTag description]
 */
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
	toast('正在删除','info',1);
	$.ajax({
		url:route('admin/intercourse/delTag'),
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
		}
	});
}

/**
 * [inputDel description]
 */
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
/**
 * [prev description]
 * [next description]
 */
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
/**
 * [search description]
 */
function search(){
	var keywords = $('#search').val();
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/intercourse/search'),
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
			ctrlPage.url = 'admin/intercourse/search';
			ctrlPage.keywords = keywords;
			ctrlPage.setList(res,function(){
				$('.page_num').html(ctrlPage.page);
				$('.bar-bottom ul li').eq(0).trigger('click');
			});
		}
	});
}
function tagSearch(){
	$('.s-p .dropdown-menu li').click(function(){
		var tag = $(this).attr('data-key');
		tag = '['+tag+']';
		v = $('#search').val();
		if(v.indexOf(tag)==-1){
			$('#search').val(v+tag);
		}
	});
}
/**
 * [sort description]
 */
function sort(){
	$('.sort-dropdown .dropdown-menu li').click(function(){
		var key = $(this).attr('data-key');
		var text = $(this).text();
		$('#dropdownMenu1').html(text+'<span class="caret"></span>');
		toast('正在搜索...','info',1);
		$.ajax({
			url:route('admin/intercourse/sort'),
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
				ctrlPage.url = 'admin/intercourse/sort';
				ctrlPage.keywords = key;
				ctrlPage.setList(res,function(){
					$('.page_num').html(ctrlPage.page);
					$('.bar-bottom ul li').eq(0).trigger('click');
				});
			}
		});
	});
}
/**
 * [filter description]
 */
function filter(){
	var str = '<div class="modal-dialog my-dialog add-dialog" style="display:block">'+
					'<div class="modal-content">'+
						'<div class="modal-header">'+
							'<h5 class="modal-title" id="myModalLabel">筛选</h5>'+
						'</div>'+
						'<div class="modal-body">'+
							'<p>正在加载...</p>'+
						'</div>'+
						'<div class="modal-footer">'+
							'<button type="button" class="btn btn-default" data-dismiss="modal" onclick="cancel()">取消</button>'+
							'<button type="button" class="btn btn-primary" onclick="subFilter()">确定</button>'+
						'</div>'+
					'</div>'+
				'</div>';
	$('body').append(str);
	getFilter();
	$('.my-mask').show();
}
function getFilter(){
	$.ajax({
		url:route('admin/intercourse/getSalerName'),
		type:'get',
		dataType:'json',
		timeout:30000,
		success:function(res){
			var interText = doT.template($("#salesman").text());
			$('.add-dialog .modal-body').html(interText(res.data));
			var height = window.innerHeight;
			$('.modal-body').css('max-height',height*0.7+'px'); 
		}
	});
}
function subFilter(){
	var time = $('input[name=time]:checked').val();
	var salesman = $('input[name=salesman]:checked').val();
	var complete = $('input[name=complete]:checked').val();
	var stage = $('input[name=stage]:checked').val();
	var key_obj = {
		start_time: time,
		cus_manager: salesman,
		stage: stage,
		complete: complete
	};
	key_obj = JSON.stringify(key_obj);
	if($('.add-dialog input[type=radio]:checked').length==0){
		toast('请至少选择一项');
		return;
	}
	toast('正在搜索...','info',1);
	$.ajax({
		url:route('admin/intercourse/filter'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			keywords: key_obj
		},
		success:function(res){
			cancel();
			$('.my-toast').remove();
			ctrlPage.page = 1;
			ctrlPage.url = 'admin/intercourse/filter';
			ctrlPage.keywords = key_obj;
			ctrlPage.setList(res,function(){
				$('.page_num').html(ctrlPage.page);
				$('.bar-bottom ul li').eq(0).trigger('click');
			});
		}
	});
}
/**
 * [checkCpy description]
 */
function checkCpy(obj){
	if(change){
		sub();
		return;
	}
	var id = $(obj).attr('data-id');
	toast('正在搜索','info',1);
	$.ajax({
		url:route('admin/intercourse/info'),
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
			$('.right-bar .contacts ul').html('');
		}
	});
}
/**
 * [initContent description]
 */
function initContent(data){
	var arr = [],head_arr = [],foot_arr = [],body_arr = [];
	for(let key in data.head[0]){
		var obj = {
			key: key,
			val: data.head[0][key]
		};
		arr.push(obj);
	}
	var ind;
	for (var i = 0; i < arr.length; i++) {
		if(arr[i].key=='finish_time') ind = i+1;
		arr[i] = new DataProperty(arr[i]);
		initData(arr[i]);
		if(arr[i].name==''){
			arr.splice(i,1);
			i--;
		}
	};
	head_arr = arr.slice(0,ind);
	foot_arr = arr.slice(ind,arr.length);
	body_arr = data.body;
	$(".table-wrap .c").html('');
	for(let i = 0;i < body_arr.length; i++ ){
		var temp = body_arr[i].action_type.split('json/')[1];
		$(".table-wrap .c").append(renderTemp(temp,body_arr[i]));
	}
	var add_str = '<p class="addTemplate" onclick="addTemp();">'+
						'<span style="margin-right: 3px;" class="iconfont icon-add"></span>'+
						'<span >新增活动</span>'+
					'</p>';
	$('.c').append(add_str);
	var interText = doT.template($("#table").text());
	$(".table-wrap .t1").html(interText(head_arr));
	$(".table-wrap .t2").html(interText(foot_arr));
	star($('input[name=director_evaluate]').val());
	var w = $(".datepicker").parent().width();
	$(".datepicker").kendoDatePicker();
	$(".datepicker").parent().parent().parent().width(w);
	var val = $("input[name=start_time]").val();
	$("input[name=start_time]").keyup(function(){
		$(this).val(val);
	});
	initImg(body_arr);
	initChanelText();
	if($('input[name=cus_manager]').val()==''){
		$('input[name=cus_manager]').val(data.name);
	}
	if($('input[name=start_time]').val()==''){
		$('input[name=start_time]').val(kendoDate());
	}
	relateContract(data);
	isDirector();
}
function DataProperty(data){
	this.key = data.key;
	this.val = data.val!=null?data.val:'';
	this.id = data.id?data.id:'';
	this.name = '';
	this.pattern = '';
	this.readonly = '';
	this.arr = '';
	this.search = 0;
	this.date = 0;
	this.click = '';
}
function initData(obj){
	switch(obj.key){
		case 'cus_abb':
			obj.name = '客户名称';
			obj.search = 1;
			return;
		case 'cus_person':
			obj.name = '联系人';
			return;
		case 'join_person':
			obj.name = '参与人';
			return;
		case 'channel_content':
			obj.name = '渠道内容';
			return;
		case 'start_time':
			obj.name = '开始时间';
			obj.date = 1;
			return;
		case 'cus_manager':
			obj.name = '业务经理';
			obj.search = 1;
			return;
		case 'channel':
			obj.name = '渠道';
			obj.arr = '电话,电子邮件,见面,QQ,微信,站内信'
			return;
		case 'finish_time':
			obj.name = '结束时间';
			obj.readonly = 'readonly';
			return;
		case 'insert_time':
			obj.name = '录入时间';
			obj.readonly = 'readonly';
			return;
		case 'update_time':
			obj.name = '更新时间';
			obj.readonly = 'readonly';
			return;
		case 'insert_person':
			obj.name = '录入人';
			obj.readonly = 'readonly';
			return;
		case 'update_person':
			obj.name = '更新人';
			obj.readonly = 'readonly';
			return;
		case 'director':
			obj.name = '部门主管';
			obj.readonly = 'readonly';
			return;
		case 'cus_evaluate':
			obj.name = '客户评分';
			obj.arr = '0,1,2,3,4,5,6,7,8,9,10';
			return;
		case 'cus_comment':
			obj.name = '客户评语';
			return;
		case 'director_evaluate':
			obj.name = '主管评分';
			obj.arr = '0,1,2,3,4,5,6,7,8,9,10';
			obj.readonly = 'readonly';
			return;
		case 'stage':
			obj.name = '活动阶段';
			obj.arr = '售前,售中,售后';
			return;
		case 'tag':
			obj.name = '活动标签';
			obj.readonly = 'readonly';
			obj.click = 'tag(this)';
			return;
		default: 
			return;
	}
}
function transContent(key,obj){
	obj = JSON.parse(obj);
	var r_obj = {
		key: key,
		val: obj[key]
	}; 
	if(key=='content'){
		r_obj.name = '活动内容';
	}else if(key=='test'){
		r_obj.name = '测试';
	}else{
		r_obj.name = '';
	}
	return r_obj;
}
function initImg(data){
	var img = data[0].action_img;
	if(img==null){
		var arr = [''];
	}else{
		var arr = img.split(',');
	}
	var interText = doT.template($("#album").text());
	$("#myCarousel").html(interText(arr));
	$('.carousel').carousel();
}
function isDirector(){
	var user_id = $('body').attr('data-user_id');
	DIRECTOR.forEach(function(items,index){
		if(items==user_id){
			$('input[name=director_evaluate]').removeAttr('readonly');
		}
	});
}
function initChanelText(){
	var v = $('input[name=channel]').val();
	if(v=='电话'){
		$('input[name=channel]').parent().next().text('电话号码');
	}else if(v=='电子邮件'){
		$('input[name=channel]').parent().next().text('邮件地址');
	}else if(v=='见面'){
		$('input[name=channel]').parent().next().text('见面地址');
	}else if(v=='QQ'){
		$('input[name=channel]').parent().next().text('QQ号');
	}else if(v=='微信'){
		$('input[name=channel]').parent().next().text('微信号');
	}else if(v=='站内信'){
		$('input[name=channel]').parent().next().text('会员名');
	}
}
function relateContract(data){
	var contract_no_arr = [];
	data.body.forEach(function(items,index){
		if(items.action_type=='json/sign'&&JSON.parse(items.action_content).contract_no!=''){
			contract_no_arr.push(JSON.parse(items.action_content).contract_no);
		}
	});
	contract_no_arr = splitStr(contract_no_arr,[',','，']);
	if(contract_no_arr[0]!=null){
		$.ajax({
			url:route('admin/contract/searchMore'),
			type:'get',
			dataType:'json',
			timeout:30000,
			data:{
				contract_no_arr: JSON.stringify(contract_no_arr)
			},
			success:function(res){
				initContract(res.data);
			}
		});
	}
}
function initContract(data){
	var contract_str = '';
	for (let i = 0; i < data.length; i++) {
		contract_str +=  wrap(data[i][0]);
		contract_str += '<div class="contract_body" style="display:none;">';
		for (let j = 0; j < data[i].length; j++) {
			contract_str += content(data[i][j]);
		}
		contract_str += '</div>';
	}
	$('.right-bar .contacts ul').html(contract_str);
	function wrap(data){
		var str = '<li style="padding-top: 10px;padding-bottom: 5px;">'+
						'<p>'+
							'<span>合同编号：</span>'+
							'<span>'+data.contract_no+'</span>'+
						'</p>'+
						'<p>'+
							'<span>购方：</span>'+
							'<span>'+data.cus_abb+'</span>'+
						'</p>'+
						'<p>'+
							'<span>销售员：</span>'+
							'<span>'+data.sale_person+'</span>'+
						'</p>'+
						'<p>'+
							'<span>签订日期：</span>'+
							'<span>'+dateTime(data.sign_time)+'</span>'+
						'</p>'+
						'<p>'+
							'<span>总金额：</span>'+
							'<span>'+data.total_amount+'</span>'+
						'</p>'+
						'<p>'+
							'<span>应付金额：</span>'+
							'<span>'+data.payable+'</span>'+
						'</p>'+
						'<p>'+
							'<span>已付金额：</span>'+
							'<span>'+data.paid+'</span>'+
						'</p>'+
						'<p>'+
							'<span>其他约定：</span>'+
							'<span>'+data.other+'</span>'+
						'</p>'+
						'<p class="toggleShow" onclick="toggleShow(this);">'+
							'<span>展开</span>'+
							'<span class="iconfont icon-triangledown"></span>'+
						'</p>'+
					'</li>';
		return str;
	}
	function content(data){
		var str = 	'<li style="padding-top: 10px;padding-bottom: 10px;">'+
						'<p>'+
							'<span>名称：</span>'+
							'<span>'+data.goods_name+'</span>'+
						'</p>'+
						'<p>'+
							'<span>规格型号：</span>'+
							'<span>'+data.goods_spec+'</span>'+
						'</p>'+
						'<p>'+
							'<span>数量：</span>'+
							'<span>'+data.goods_num+'</span>'+
						'</p>'+
						'<p>'+
							'<span>单价：</span>'+
							'<span>'+data.goods_price+'</span>'+
						'</p>'+
						'<p>'+
							'<span>备注：</span>'+
							'<span>'+data.rem+'</span>'+
						'</p>'+
					'</li>';
		return str;
	}
}
function toggleShow(obj){
	var tagEle = $(obj).parent().next();
	if(tagEle.css('display')=='none'){
		$(obj).find('span').eq(0).html('收起');
		tagEle.show();
	}else{
		$(obj).find('span').eq(0).html('展开');
		tagEle.hide();
	}
}
/**
 * [dataChange description]
 */
function dataChange(obj){
	change = 1;
	m = 0;
	var id = $('body').attr('data-id');
	setTimeout(function(){
		$('.bar-bottom li[data-id='+id+']').find('span').eq(0).html($('input[name=cus_abb]').val());
		$('.bar-bottom li[data-id='+id+']').find('span').eq(1).html($('input[name=cus_manager]').val());
		$('.bar-bottom li[data-id='+id+']').find('span').eq(2).html($('input[name=start_time]').val()?dateTime($('input[name=start_time]').val()):'');
	},100);
	initChanelText();
}

/**
 * [star description]
 */
function star(num){
	$('.search .star span').removeClass('icon-half-star light').addClass('icon-all-star');
	var half_num = num/2;
	var str = half_num.toString();
	var n = str.split('.')[0];
	var f = str.split('.')[1];
	if(f=='5'){
		for (var i = 0; i < n; i++) {
			$('.search .star span').eq(i).addClass('light');
		}
		$('.search .star span').eq(i).removeClass('icon-all-star').addClass('icon-half-star');
	}else{
		for (var i = 0; i < n; i++) {
			$('.search .star span').eq(i).addClass('light');
		}
	}
}

/**
 * [tag description]
 */
function tag(obj){
	$('.dialog-tag,.my-mask').show();
	$('.dialog-tag').attr('data-id',$(obj).parent().parent().parent().parent().attr('data-id'));
	var stage = $(obj).parent().parent().find('input[name=stage]').val();
	$.ajax({
		url:route('admin/intercourse/tag'),
		type:'get',
		dataType:'json',
		timeout:30000,
		data: {
			stage: stage
		},
		success:function(res){
			var interText = doT.template($("#tags").text());
			$('.dialog-tag .modal-body').html(interText(res.data));
			var height = window.innerHeight;
			$('.dialog-tag .modal-body').css('max-height',height*0.7+'px');
			var t_tag_arr = $(obj).val().split(',');
			t_tag_arr.forEach(function(items,index){
				$('.modal-body .p li').each(function(){
					if(items==$(this).find('label .item').text()){
						$(this).find('input[type=checkbox]').prop('checked',true);
					}
				});
			});
		}
	});
}
function subTag(){
	var id = $('.dialog-tag').attr('data-id');
	var v = $('table[data-id='+id+']').find('input[name=tag]').val();
	setTimeout(function(){
		var str = '';
		$(".dialog-tag input[type=checkbox]:checked").each(function(){
			str += $(this).next().text()+',';
		});
		str = str.slice(0,str.length-1);
		$('table[data-id='+id+']').find('input[name=tag]').val(str);
		cancel();
		if(v!=str){
			dataChange();
		}
	},200);
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
function cancel(){
	$('.modal-dialog,.my-mask').hide();
	$('.add-dialog').remove();
}
/**
 * [sub description]
 */
function sub(){
	if(checkTemp()==1) return;
	var id = $('body').attr('data-id');
	var head_arr = [],foot_arr = [],body_arr = [];
	$('.t1 input').each(function(){
		if($(this).val()==''&&$(this).attr('name')!='finish_time'){
			var name = $(this).parent().prev().text();
			if(name==''){
				name = $(this).parent().parent().parent().prev().text();
			}
			toast(name+'不能为空');
			m = 1;
		}
		if($(this).val()==''&&$(this).attr('name')=='finish_time'){
			var obj = {
				key: $(this).attr('name'),
				val: '0000-00-00'
			};
		}else{
			var obj = {
				key: $(this).attr('name'),
				val: $(this).attr('name')=='start_time'?dateTime($(this).val()):checkCode($(this).val())
			};
		}
		head_arr.push(obj);
	});
	if(m) return;
	$('.c table').each(function(){
		var items_arr = [],items_obj = {},_id,_class;
		$(this).find('input').each(function(){
			_id = $(this).parent().parent().parent().parent().attr('data-id');
			_class = $(this).parent().parent().parent().parent().attr('data-class');
			var obj = {
				id: _id,
				key: $(this).attr('name'),
				val: checkCode($(this).val())
			};
			items_arr.push(obj);
		});
		items_obj.class = _class;
		$(this).find('textarea').each(function(){
			items_obj[$(this).attr('name')] = $(this).val();
		});
		items_arr.push({
			id: _id,
			key: 'action_content',
			val: items_obj
		});
		body_arr.push(items_arr);
	});
	$('.t2 input').each(function(){
		var name = $(this).attr('name');
		if(name!='insert_person'&&name!='insert_time'&&name!='update_person'&&name!='update_time'){
			var obj = {
				key: $(this).attr('name'),
				val: checkCode($(this).val())
			};
			foot_arr.push(obj);
		}
	});
	toast('正在提交...','info',1);
	$.ajax({
		url:route('admin/intercourse/sub'),
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
			change = 0;
			$('.my-toast').remove();
			$('.bar-bottom li[data-id='+id+']').trigger('click');
			setTimeout(function(){
				toast(res.msg);
			},500);
		}
	});
}
function starSub(){
	var id = $('body').attr('data-id');
	var star = $('input[name=director_evaluate]').val(); 
	toast('正在提交...','info',1);
	$.ajax({
		url:route('admin/intercourse/star'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data:{
			"id": id,
			"star": star
		},
		success:function(res){
			change = 0;
			$('.my-toast').remove();
			$('.bar-bottom li[data-id='+id+']').trigger('click');
			setTimeout(function(){
				toast(res.msg);
			},500);
		}
	});
}
function checkTemp(){
	var temp_arr = [
		{
			stage: '售前',
			tag: '签订'
		},
		{
			stage: '售后',
			tag: '知识'
		}
	];
	var mark = 0;
	$('table[data-class="json/txt"]').each(function(){
		var stage_val = $(this).find('input[name=stage]').val();
		var tag_val = $(this).find('input[name=tag]').val();
		for (let i = 0; i < temp_arr.length; i++) {
			if(temp_arr[i].stage==stage_val&&temp_arr[i].tag==tag_val){
				toast('请使用特定模板！');
				mark = 1;
			}
		}
	});
	return mark;
}
/**
 * [del description]
 */
function del(){
	var user_id = $('body').attr('data-user_id');
	for (let i = 0; i < DIRECTOR.length; i++) {
		if(DIRECTOR[i]==user_id){
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
			break;
		}else if(i==DIRECTOR.length-1&&DIRECTOR[i]!=user_id){
			toast('权限不足，请联系主管！');
		}
	}
}
function delComfirm(){
	var id = $('body').attr('data-id');
	$.ajax({
		url:route('admin/intercourse/del'),
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
/**
 * [add description]
 */
function add(){
	var temp_str = '';
	inter_action_temp_arr.forEach(function(items,index){
		temp_str += '<li>'+
						'<label>'+
							'<input type="radio" name="action_type" value="'+items.key+'">'+
							'<span>'+items.name+'</span>'+
						'</label>'+
					'</li>';
	});
	var str = '<div class="modal-dialog my-dialog add-dialog" style="display:block">'+
					'<div class="modal-content">'+
						'<div class="modal-header">'+
							'<h5 class="modal-title" id="myModalLabel">选择新建模板</h5>'+
						'</div>'+
						'<div class="modal-body">'+
							'<ul class="input-group">'+temp_str+'</ul>'+
						'</div>'+
						'<div class="modal-footer">'+
							'<button type="button" class="btn btn-default" data-dismiss="modal" onclick="cancel()">取消</button>'+
							'<button type="button" class="btn btn-primary" onclick="addIntercourse()">确定</button>'+
						'</div>'+
					'</div>'+
				'</div>';
	$('body').append(str);
	$('.my-mask').show();
	$('.add-dialog input[value="json/txt"]').prop('checked',true);
	// searchTemp();
}
function addIntercourse(){
	var template = $('.add-dialog input[type=radio]:checked').val();
	if(!template){
		return;
	}
	cancel();
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/intercourse/add'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			template: template
		},
		success:function(res){
			$('.dropdown-menu li[data-key=all]').trigger('click');
		}
	});
}

function addTemp(){
	if(change){
		sub();
		return;
	}
	var temp_str = '';
	inter_action_temp_arr.forEach(function(items,index){
		temp_str += '<li>'+
						'<label>'+
							'<input type="radio" name="action_type" value="'+items.key+'">'+
							'<span>'+items.name+'</span>'+
						'</label>'+
					'</li>';
	});
	var str = '<div class="modal-dialog my-dialog add-dialog" style="display:block">'+
					'<div class="modal-content">'+
						'<div class="modal-header">'+
							'<h5 class="modal-title" id="myModalLabel">选择新建模板</h5>'+
						'</div>'+
						'<div class="modal-body">'+
							'<ul class="input-group">'+temp_str+'</ul>'+
						'</div>'+
						'<div class="modal-footer">'+
							'<button type="button" class="btn btn-default" data-dismiss="modal" onclick="cancel()">取消</button>'+
							'<button type="button" class="btn btn-primary" onclick="addContentTemp()">确定</button>'+
						'</div>'+
					'</div>'+
				'</div>';
	$('body').append(str);
	$('.my-mask').show();
	$('.add-dialog input[value="json/txt"]').prop('checked',true);
	// searchTemp();
}
function addContentTemp(){
	var template = $('.add-dialog input[type=radio]:checked').val();
	var id = $('body').attr('data-id');
	if(!template){
		return;
	}
	cancel();
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/intercourse/add_temp'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			temp: template,
			id: id
		},
		success:function(res){
			$('.my-toast').remove();
			toast(res.msg);
			if(res.code==200){
				setTimeout(function(){
					$('.bar-bottom li[data-id='+id+']').trigger('click');
				},200);
			}
		}
	});
}
function delTemp(){
	var user_id = $('body').attr('data-user_id');
	for (let i = 0; i < DIRECTOR.length; i++) {
		if(DIRECTOR[i]==user_id){
			var temp_arr = [];
			$('.c>table').each(function(){
				var v = $(this).attr('data-id');
				var text = $(this).find('textarea[name=content],textarea[name=contract_no],textarea[name=question]').val();
				temp_arr.push({
					v: v,
					text: text
				});
			});
			var temp_str = '';
			temp_arr.forEach(function(items,index){
				temp_str += '<li>'+
								'<label>'+
									'<input type="checkbox" name="action_type" value="'+items.v+'">'+
									'<span>'+items.text+'</span>'+
								'</label>'+
							'</li>';
			});
			var str = '<div class="modal-dialog my-dialog add-dialog" style="display:block">'+
							'<div class="modal-content">'+
								'<div class="modal-header">'+
									'<h5 class="modal-title" id="myModalLabel">选择删除活动</h5>'+
								'</div>'+
								'<div class="modal-body">'+
									'<ul class="input-group">'+temp_str+'</ul>'+
								'</div>'+
								'<div class="modal-footer">'+
									'<button type="button" class="btn btn-default" data-dismiss="modal" onclick="cancel()">取消</button>'+
									'<button type="button" class="btn btn-primary" onclick="delContentTemp()">确定</button>'+
								'</div>'+
							'</div>'+
						'</div>';
			$('body').append(str);
			$('.my-mask').show();
		}
	}
}
function delContentTemp(){
	var id_arr = [];
	$('.add-dialog li input[type=checkbox]:checked').each(function(){
		var id = $(this).val();
		id_arr.push(id);
	});
	cancel();
	toast('正在提交','info',1);
	$.ajax({
		url:route('admin/intercourse/del_action_id'),
		type:'post',
		dataType:'json',
		timeout:30000,
		data: {
			id: $('body').attr('data-id'),
			id_arr: JSON.stringify(id_arr)
		},
		success:function(res){
			$('.bar-bottom li[data-id="'+ $('body').attr('data-id')+'"]').trigger('click');
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
		url:route('admin/intercourse/tag'),
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