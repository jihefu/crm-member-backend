var arrX = [10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240];
var arrY1 = [2,8,11,2,13,18,18,20,18,20,18,20,18,20,18,20,18,20,18,20,18,20,18,25];
var arrY2 = [1,17,20,15,35,70,80,96,112,121,138,142,143,143,142,143,142,143,142,143,142,142,142,142];
var arrY3 = [6,12,15,29,36,44,47,59,80,91,101,109,120,143,131,80,70,80,70,80,70,80,70,80];

var paddingX = 30,paddingY = 30;
var context,width,height,paddingX,paddingY,count=1;

var data1 = [],data2 = [],data3 = [],data_x = [];
var ARR = [data1,data2,data3];

//初始化画布
new Draw().initCanvas({
	paddingX: paddingX,
	paddingY: paddingY
});

//设置线的起始点和颜色
var line_arr = [
	{
		originalX:paddingX,
		originalY:height-paddingX,
		color:'#00f'
	},
	{
		originalX:paddingX,
		originalY:height-paddingX,
		color:'#0f0'
	},
	{
		originalX:paddingX,
		originalY:height-paddingX,
		color:'#f00'
	}
];

//实例化画布
var D1 = new Draw(line_arr,0);
var D2 = new Draw(line_arr,1);
var D3 = new Draw(line_arr,2);

//实例化转化器
var gcX = new GConvert(300,paddingX,width-paddingX,1);
var gcY1 = new GConvert(160,height-paddingX,paddingX);
var gcY2 = new GConvert(320,height-paddingX,paddingX);
var gcY3 = new GConvert(320,height-paddingX,paddingX);

var c = 0;
// $('body').click(function(){
setInterval(function(){
	D1.addDataX(arrX[c],data_x,gcX);
	D1.addDataY(arrX[c],arrY1[c],data_x,data1,gcY1);
	D2.addDataY(arrX[c],arrY2[c],data_x,data2,gcY2);
	D3.addDataY(arrX[c],arrY3[c],data_x,data3,gcY3);
	c++;
},200);
// });

//画图
function Draw(arr,z){
	var drawRect = function(){
	    context.beginPath();
	    var w = width - 2 * paddingX;
	    context.fillText(0, paddingX, height-10);//绘制文字
	    for (var i = 0; i < 6; i++) {
			context.fillText(60*count*(i+1)/6, paddingX+w/6*(i+1)-5, height-10);//绘制文字
		};
	    context.fillText('s', width-paddingX+15, height-10);//绘制文字
	    context.moveTo( paddingX, paddingX );
	    context.lineTo( paddingX, height-paddingX ); //名义坐标原点
	    context.moveTo( paddingX, height-paddingX );
	    context.lineTo( width-paddingX, height-paddingX );
	    var w = width - 2 * paddingX;
	    var h = height - 2 * paddingY;
	    for (var i = 0; i < 6; i++) {
	    	context.moveTo( paddingX+w/6*(i+1), height-paddingX );
	    	context.lineTo( paddingX+w/6*(i+1), height-paddingX-5 );
	    };
	    context.strokeStyle = '#222';
	    context.stroke();
	}
	var render = function(dataX,data){
		context.beginPath();
		context.moveTo( arr[z].originalX, arr[z].originalY );
		context.lineTo( paddingX+dataX[dataX.length-1],height-paddingY-data[data.length-1] );
		context.strokeStyle = arr[z].color;
		context.stroke();
		arr[z].originalX = paddingX+dataX[dataX.length-1];
		arr[z].originalY = height-paddingY-data[data.length-1];
	}
	var reDraw = function(dataX){
		context.clearRect(0,0,width,height);
		drawRect();
		for (var i = 1; i < line_arr.length+1; i++) {
			context.beginPath();
			context.moveTo( paddingX, height-paddingX );
			var _data = ARR[i-1];
			for (var j = 0; j < _data.length; j++) {
				context.lineTo( paddingX + dataX[j], height - paddingY - _data[j] );
			}
			context.strokeStyle = arr[i-1].color;
			context.stroke();
			arr[i-1].originalX = paddingX + dataX[_data.length-1];
			arr[i-1].originalY = height - paddingY - _data[_data.length-1];
		};
	}
	var reDrawX = function(){
		context.clearRect(paddingX,height-paddingY+1,width,height);
		var w = width - 2 * paddingX;
		context.beginPath();
		context.fillText(0, paddingX, height-10);//绘制文字
		for (var i = 0; i < 6; i++) {
			context.fillText(60*count*(i+1)/6, paddingX+w/6*(i+1)-5, height-10);//绘制文字
		};
		context.fillText('s', width-paddingX+15, height-10);//绘制文字
		context.strokeStyle = '#222';
	    context.stroke();
	}
	this.initCanvas = function(obj){
		var canvas = document.getElementsByTagName('canvas')[0];
	    context = canvas.getContext( '2d' );
	    width = $('#main').width();
	    height = $('#main').height()-40;
	    canvas.width = width;
	    canvas.height = height;

	    paddingX = obj.paddingX;
	    paddingY = obj.paddingY;

	    drawRect();
	}
	this.addDataX = function(numX,dataX,gcX){
		if(gcX.inputX(numX)==1){
			dataX.forEach(function(items,index){
				dataX[index] = items*count/(count+1);
			});
			count++;
			reDraw(dataX);
			reDrawX();
		}
		dataX.push(gcX.convert(numX));
	}
	this.addDataY = function(numX,numY,dataX,data,gcY){
		if(gcY.inputY(numY)==1){
			data.forEach(function(items,index){
				data[index] = items/2;
			});
			data.push(gcY.convert(numY));
			reDraw(dataX);
		}else{
			data.push(gcY.convert(numY));
			render(dataX,data);
		}
	}
}

//转换器
function GConvert(maxScale,g1,g2,x){
	var range = Math.abs( g1 - g2 );
	if(x){
		var S = maxScale/5;
	}else{
		var S = maxScale/16;
	}
	var k = range/S;
	this.inputX = function(v){
        if(v>S){
        	S = S + maxScale/5;
            k = range/S;
            return 1;
        }else{
        	return -1;
        }
    }
    this.inputY = function(v){
        if(v>S){
        	S = S * 2;
            k = k * 0.5;
            return 1;
        }else{
        	return -1;
        }
    }
    this.convert = function(v){
    	var y = k * v;
    	return y;
    }
}