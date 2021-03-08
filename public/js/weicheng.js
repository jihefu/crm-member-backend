// var rootFix=function(){
//     var baseFontSize = 100;
// 	var baseWidth = 320;
// 	var clientWidth = document.documentElement.clientWidth || window.innerWidth;
// 	var innerWidth = Math.max(Math.min(clientWidth, 480), 320);
// 	var rem = 100;
// 	// if (innerWidth > 362 && innerWidth <= 375) {
// 	// 	rem = Math.floor(innerWidth / baseWidth * baseFontSize * 0.9);
// 	// }
// 	// if (innerWidth > 375) {
// 	// 	rem = Math.floor(innerWidth / baseWidth * baseFontSize * 0.84);
// 	// }
// 	//window.__baseREM = rem;
// 	document.querySelector('html').style.fontSize = rem + 'px';
// 	document.body.style.height=window.innerHeight+"px";
// }
// window.onload=function(){
// 	rootFix();
// }
// window.onresize=function(){
// 	rootFix();
// }
// function back(){
// 	window.history.back(-1);
// }
var ele = $('.down-drive a');
weixinTip(ele);
function weixinTip(ele){
    var ua = navigator.userAgent;
    var isWeixin = !!/MicroMessenger/i.test(ua);
    if(isWeixin){
    	ele.on('click',function(){
    		// window.event? window.event.returnValue = false : e.preventDefault();
    		document.getElementById('JweixinTip').style.display='block';
    	});
        document.getElementById('JweixinTip').onclick=function(){
            this.style.display='none';
        }
    }
}