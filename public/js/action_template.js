var template = {
	txt: function(params){
		var str = '<table class="table table-bordered"  data-id="'+params.id+'" data-class="'+params.action_type+'">'+
					'<tbody>'+
						'<tr>'+
							'<td>活动阶段</td>'+
							'<td>'+
								'<input name="stage" type="text" data-arr="售前,售中,售后" value="'+params.stage+'" onclick="" pattern="" onchange="dataChange(this)"/>'+
							'</td>'+
							'<td>活动标签</td>'+
							'<td>'+
								'<input name="tag" type="text" data-arr="" readonly value="'+params.tag+'" onclick="tag(this);" pattern="" onchange="dataChange(this)"/>'+
							'</td>'+
						'</tr>'+
						'<tr>'+
							'<td style="vertical-align: middle;">活动内容</td>'+
							'<td colspan="3">'+
								'<textarea name="content" onchange="dataChange(this)" rows=8>'+JSON.parse(params.action_content).content+'</textarea>'+
							'</td>'+
						'</tr>'+
					'</tbody>'
				'</table>';
		return str;
	},
	knowledge: function(params){
		var str = '<table class="table table-bordered"  data-id="'+params.id+'" data-class="'+params.action_type+'">'+
					'<tbody>'+
						'<tr>'+
							'<td>活动阶段</td>'+
							'<td>'+
								'<input name="stage" type="text" readonly value="售后"/>'+
							'</td>'+
							'<td>活动标签</td>'+
							'<td>'+
								'<input name="tag" type="text" readonly value="知识"/>'+
							'</td>'+
						'</tr>'+
						'<tr>'+
							'<td style="vertical-align: middle;text-align">现象描述</td>'+
							'<td colspan="3">'+
								'<textarea name="question" onchange="dataChange(this)" rows=4>'+JSON.parse(params.action_content).question+'</textarea>'+
							'</td>'+
						'</tr>'+
						'<tr>'+
							'<td style="vertical-align: middle;">问题分析</td>'+
							'<td colspan="3">'+
								'<textarea name="analysis" onchange="dataChange(this)" rows=4>'+JSON.parse(params.action_content).analysis+'</textarea>'+
							'</td>'+
						'</tr>'+
						'<tr>'+
							'<td style="vertical-align: middle;">解决方案</td>'+
							'<td colspan="3">'+
								'<textarea name="solution" onchange="dataChange(this)" rows=4>'+JSON.parse(params.action_content).solution+'</textarea>'+
							'</td>'+
						'</tr>'+
					'</tbody>'
				'</table>';
		return str;
	},
	sign: function(params){
		var str = '<table class="table table-bordered"  data-id="'+params.id+'" data-class="'+params.action_type+'">'+
					'<tbody>'+
						'<tr>'+
							'<td>活动阶段</td>'+
							'<td>'+
								'<input name="stage" type="text" readonly value="售前"/>'+
							'</td>'+
							'<td>活动标签</td>'+
							'<td>'+
								'<input name="tag" type="text" readonly value="签订"/>'+
							'</td>'+
						'</tr>'+
						'<tr>'+
							'<td style="vertical-align: middle;text-align">合同号</td>'+
							'<td colspan="3">'+
								'<textarea name="contract_no" onchange="dataChange(this)" rows=1>'+JSON.parse(params.action_content).contract_no+'</textarea>'+
							'</td>'+
						'</tr>'+
						'<tr>'+
							'<td style="vertical-align: middle;text-align">其他约定</td>'+
							'<td colspan="3">'+
								'<textarea name="other_promise" onchange="dataChange(this)" rows=4>'+JSON.parse(params.action_content).other_promise+'</textarea>'+
							'</td>'+
						'</tr>'+
					'</tbody>'
				'</table>';
		return str;
	}
}

var renderTemp = function(temp,params){
	return template[temp](params);
}