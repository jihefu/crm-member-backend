var template = {
	txt: function(params){
		var tag = params.tag?params.tag:'请输入标签';
		var content = JSON.parse(params.action_content).content?JSON.parse(params.action_content).content:'';
		var str = '<div class="weui-cells action_item" data-id="'+params.id+'" data-class="'+params.action_type+'" style="margin-top:10px">'+
		                '<div class="weui-cell">'+
		                    '<div class="weui-cell__bd">'+
		                        '<select name="stage" style="width:100%;">'+
		                            '<option>售前</option>'+
		                            '<option>售中</option>'+
		                            '<option>售后</option>'+
		                        '</select>'+
		                    '</div>'+
		                    '<div class="weui-cell__ft">'+
		                        '<button name="tag" onclick="getTags(this);">'+tag+'</button>'+
		                    '</div>'+
		                '</div>'+
		                '<div class="weui-cell">'+
		                    '<textarea name="content" rows="7" placeholder="请输入具体内容">'+content+'</textarea>'+
		                '</div>'+
		            '</div>';
		return str;
	},
	knowledge: function(params){
		var question = JSON.parse(params.action_content).question?JSON.parse(params.action_content).question:'';
		var analysis = JSON.parse(params.action_content).analysis?JSON.parse(params.action_content).analysis:'';
		var solution = JSON.parse(params.action_content).solution?JSON.parse(params.action_content).solution:'';
		var str = '<div class="weui-cells action_item" data-id="'+params.id+'" data-class="'+params.action_type+'" style="margin-top:10px">'+
		                '<div class="weui-cell">'+
		                    '<div class="weui-cell__bd">'+
		                        '<select name="stage" style="width:100%;" disabled>'+
		                            '<option>售前</option>'+
		                            '<option>售中</option>'+
		                            '<option selected>售后</option>'+
		                        '</select>'+
		                    '</div>'+
		                    '<div class="weui-cell__ft">'+
		                        '<button name="tag">知识</button>'+
		                    '</div>'+
		                '</div>'+
		                '<div class="weui-cell">'+
		                    '<textarea name="question" rows="7" placeholder="请输入问题现象">'+question+'</textarea>'+
		                '</div>'+
		                '<div class="weui-cell">'+
		                    '<textarea name="analysis" rows="7" placeholder="请输入问题分析">'+analysis+'</textarea>'+
		                '</div>'+
		                '<div class="weui-cell">'+
		                    '<textarea name="solution" rows="7" placeholder="请输入解决方案">'+solution+'</textarea>'+
		                '</div>'+
		            '</div>';
		return str;
	},
	sign: function(params){
		var contract_no = JSON.parse(params.action_content).contract_no?JSON.parse(params.action_content).contract_no:'';
		var other_promise = JSON.parse(params.action_content).other_promise?JSON.parse(params.action_content).other_promise:'';
		var str = '<div class="weui-cells action_item" data-id="'+params.id+'" data-class="'+params.action_type+'" style="margin-top:10px">'+
		                '<div class="weui-cell">'+
		                    '<div class="weui-cell__bd">'+
		                        '<select name="stage" style="width:100%;" disabled>'+
		                            '<option selected>售前</option>'+
		                            '<option>售中</option>'+
		                            '<option>售后</option>'+
		                        '</select>'+
		                    '</div>'+
		                    '<div class="weui-cell__ft">'+
		                        '<button name="tag">签订</button>'+
		                    '</div>'+
		                '</div>'+
		                '<div class="weui-cell">'+
		                    '<textarea name="contract_no" rows="1" placeholder="请输入合同号">'+contract_no+'</textarea>'+
		                '</div>'+
		                '<div class="weui-cell">'+
		                    '<textarea name="other_promise" rows="7" placeholder="其他约定">'+other_promise+'</textarea>'+
		                '</div>'+
		            '</div>';
		return str;
	}
}

var renderTemp = function(temp,params){
	return template[temp](params);
}