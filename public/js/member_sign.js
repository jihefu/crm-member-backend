// var dateArray=[0,26];//时间数组
var now="";  //这个是我写的变量，要有
	(function($) {
		var m_width = window.innerWidth;
		if(m_width<450){
			var box_height = 50;
		}else if(m_width>451&&m_width<600){
			var box_height = 60;
		}else if(m_width>601&&m_width<800){
			var box_height = 70;
		}else if(m_width>801){
			var box_height = 80;
		}
		var Checkin = function(ele, options) {
			this.ele = ele;
			this.opt = options;
			this.defaults = {
				width: "100%",
				height: 'auto',
				background: '#efeeee',
				radius: 10,
				color: '#333',
				padding: 10,
				dateArray: dateArray // 假设已签到的天数+1
			};
			this.obj = $.extend({}, this.defaults, this.opt);
		}
		Checkin.prototype.init = function() {

			var _self = this.ele,
				html = '',
				myDate = new Date(),
				year = myDate.getFullYear(),
				month = myDate.getMonth(),
				day = myDate.getDate(),
				weekText = ['日', '一', '二', '三', '四', '五', '六'];

				now=day; //自己存的单天时间天

			_self.css({
				width: this.obj.width + 'px',
				height: this.obj.height,
				background: this.obj.background,
				borderRadius: this.obj.radius,
				color: this.obj.color,
				padding: this.obj.padding
			}).append("<div class='title'><p>" + year + '年' + (month + 1) + '月' + day + '日' + "</p><a class=\'checkBtn\' href=\"javascript:;\">签到</a></div>");
			$("<ul class='week clearfix'></ul><ul class='calendarList clearfix'></ul>").appendTo(_self);
			for (var i = 0; i < 7; i++) {
				_self.find(".week").append("<li>" + weekText[i] + "</li>")
			};
			for (var i = 0; i < 42; i++) {
				html += "<li></li>"
			};
			_self.find(".calendarList").append(html);
			var $li = _self.find(".calendarList").find("li");
			_self.find(".week li").css({
				width: (_self.width() / 7) + 'px',
				height: box_height + 'px',
				borderRight: '1px solid #E4E4E4',
				boxSizing: 'border-box',
				background: '#CECECE'
			});
			$li.css({
				width: (_self.width() / 7) + 'px',
				height: box_height + 'px',
				borderRight: '1px solid #E4E4E4',
				borderBottom: '1px solid #E4E4E4',
				boxSizing: 'border-box',
				color: "#333"
			});
			_self.find(".calendarList").find("li:nth-child(7n)").css('borderRight', 'none');
			_self.find(".week li:nth-child(7n)").css('borderRight', 'none');
			var monthFirst = new Date(year, month, 1).getDay();
			var d = new Date(year, (month + 1), 0)
			var totalDay = d.getDate(); //获取当前月的天数
			for (var i = 0; i < totalDay; i++) {
				$li.eq(i + monthFirst).html(i + 1);
				$li.eq(i + monthFirst).addClass('data' + (i + 1))
				if (isArray(this.obj.dateArray)) {
					for (var j = 0; j < this.obj.dateArray.length; j++) {
						if (i == this.obj.dateArray[j]) {
							// 假设已经签到的
							$li.eq(i + monthFirst).addClass('checked').css("color","#ffffff");
						}
					}
				}
			}
			//$li.eq(monthFirst+day-1).css('background','#f7ca8e')
			_self.find($(".data" + day)).addClass('able-qiandao');
		}

		var sign = function(cb){
			if($('.title .checkBtn').html()=='已签到'){
				wxToast('今日已签到');
				return;
			}
			wxLoadToast('正在签到');
			$.ajax({
				url:route('member_ajax/sign'),
				type:'post',
				dataType:'json',
				timeout:30000,
				success:function(res){
					$('#loadingToast').remove();
					wxToast(res.msg);
					cb();
				}
			});
		}

		var isChecked = false;
		Checkin.prototype.events = function() {
			var _self = this.ele;

			for (var i=0;i<dateArray.length;i++){
				if(dateArray[i]==(now-1)){isChecked=true;
					_self.parents().find('.checkBtn').text("已签到");
				}
			}

			var $li = _self.find(".calendarList").find("li");
			$li.on('click', function(event) {
				event.preventDefault();
				/* Act on the event */
				if ($(this).hasClass('able-qiandao')) {
					var that = this;
					sign(function(){
						$(that).addClass('checked');
						$(that).css('color','#fff');
						modal(_self);
						isChecked = true;
						setTimeout(function(){
							window.location.href = route('member/index');
						},2000);
					});
				}
			});
			var checkBtn = _self.find(".checkBtn");
			checkBtn.click(function(event) {
				sign(function(){
					modal(_self);
					_self.find('.able-qiandao').addClass('checked').css("color","#ffffff");
					isChecked = true;
					setTimeout(function(){
						window.location.href = route('member/index');
					},2000);
				});
			});
		}
		var modal = function(e) {
			var mask = e.parents().find(".mask");
			var close = e.parents().find(".closeBtn");
			if (mask && !isChecked) {
				mask.addClass('trf');
			} else {
				return
			};
			close.click(function(event) {
				event.preventDefault();
				mask.removeClass('trf')
			});
			e.parents().find('.checkBtn').text("已签到");
		}
		$.fn.Checkin = function(options) {
			var checkin = new Checkin(this, options);
			var obj = [checkin.init(), checkin.events()]
			return obj
		}
		var isArray = function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
	})(jQuery);
	// 插件调用
	$(".checkin").Checkin();
	// 元素居中显示，与插件无关，根本自己需要修改；
	//$(".checkin").css('marginTop',parseInt(($(window).innerHeight()-$(".checkin").outerHeight())/2)+'px');