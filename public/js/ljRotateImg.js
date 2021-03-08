var lj_canvas;
var lj_base64 = null;
var lj_IMG;
var lj_step = 0;
var lj_CB;

function ljDealerPhoto(fileObj, cb) {
    lj_step = 0;
    lj_CB = cb;
    lj_base64 = null;
    var ele = document.getElementById('uploaderInput');
    var file = ele.files[0];

    var oReader = new FileReader();
    oReader.onload = function (e) {
        var image = new Image();
        image.src = e.target.result;
        image.onload = function () {
            var expectWidth = this.naturalWidth;
            var expectHeight = this.naturalHeight;

            if (this.naturalWidth > this.naturalHeight && this.naturalWidth > 800) {
                expectWidth = 800;
                expectHeight = expectWidth * this.naturalHeight / this.naturalWidth;
            } else if (this.naturalHeight > this.naturalWidth && this.naturalHeight > 1200) {
                expectHeight = 1200;
                expectWidth = expectHeight * this.naturalWidth / this.naturalHeight;
            }
            var canvas = document.createElement("canvas");
            lj_canvas = canvas;
            var ctx = canvas.getContext("2d");
            canvas.width = expectWidth;
            canvas.height = expectHeight;
            lj_IMG = this;
            ctx.drawImage(this, 0, 0, expectWidth, expectHeight);
            lj_base64 = canvas.toDataURL("image/jpeg");
            document.body.addEventListener('touchmove', ljBodyScroll, { passive: false });
            var h = window.innerHeight;
            var str = '<div id="lj_img_contain" style="overflow: hidden; width: 100%; height: '+h+'px; position: fixed; top: 0px; z-index: 9999; background: #000;">'+
                '<img id="ljImage" style="width: 100%;" src="'+lj_base64+'"/>'+
                '<div style="width: 100%; position: fixed; bottom: 10px; color: #fff; font-size: 20px; display: flex;">'+
                    '<div style="flex: 1; text-align: center;" onclick="ljSubImg();">确定</div>'+
                    '<div style="flex: 1; text-align: center;" onclick="ljRotateImg();">旋转</div>'+
                    '<div style="flex: 1; text-align: center;" onclick="ljCancelImg();">取消</div>'+
                '</div>'+
            '</div>';
            $('body').append(str);
            $("#ljImage").attr("src", lj_base64);
        };
    };
    oReader.readAsDataURL(file);
}
function ljSubImg() {
    document.body.removeEventListener('touchmove', ljBodyScroll, { passive: false });
    $('#lj_img_contain').remove();
    lj_CB(lj_base64);
}
function ljCancelImg() {
    document.body.removeEventListener('touchmove', ljBodyScroll, { passive: false });
    $('#lj_img_contain').remove();
}
function ljRotateImg() {
    var img = lj_IMG;
    var min_step = 0;
    var max_step = 3;
    if (img == null) return;
    //img的高度和宽度不能在img元素隐藏后获取，否则会出错
    var height = img.height;
    var width = img.width;
    lj_step++;
    lj_step > max_step && (lj_step = min_step);
    //旋转角度以弧度值为参数
    var degree = lj_step * 90 * Math.PI / 180;
    var canvas = lj_canvas;
    var ctx = canvas.getContext('2d');
    switch (lj_step) {
        case 0:
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0);
            break;
        case 1:
            canvas.width = height;
            canvas.height = width;
            ctx.rotate(degree);
            ctx.drawImage(img, 0, 0);
            ctx.drawImage(img, 0, -height);
            break;
        case 2:
            canvas.width = width;
            canvas.height = height;
            ctx.rotate(degree);
            ctx.drawImage(img, -width, -height);
            break;
        case 3:
            canvas.width = height;
            canvas.height = width;
            ctx.rotate(degree);
            ctx.drawImage(img, -width, 0);
            break;
    }
    lj_base64 = canvas.toDataURL("image/jpeg");
    $("#ljImage").attr("src", lj_base64);
}

function ljBodyScroll(event){
    event.preventDefault();
}

function dataURLtoBlob(dataurl) {

  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],

    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);

  while(n--){

    u8arr[n] = bstr.charCodeAt(n);

  }

  return new Blob([u8arr], {type:mime});

}
