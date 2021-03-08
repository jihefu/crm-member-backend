const Select = function(params){
	var domId = params.domId;
	var url = params.url;
	var formData = params.formData;
	var placeholder = params.placeholder ? params.placeholder : '搜索';
    this.domId = $(domId);
    this.url = url;
    this.formData = formData
    this.search = '<div class="weui-search-bar" id="searchBar">'+
        '<form class="weui-search-bar__form">'+
            '  <div class="weui-search-bar__box">'+
                '<i class="weui-icon-search"></i>'+
                '<input type="search" class="weui-search-bar__input" id="searchInput" placeholder="'+placeholder+'" required/>'+
                '<a href="javascript:" class="weui-icon-clear" id="searchClear"></a>'+
            '</div>'+
            '<label class="weui-search-bar__label" id="searchText">'+
                '<i class="weui-icon-search"></i>'+
                '<span>'+placeholder+'</span>'+
            '</label>'+
        '</form>'+
        '<a href="javascript:" class="weui-search-bar__cancel-btn" id="searchCancel">取消</a>'+
    '</div>'

    this.result = '<div style="position: absolute; top: auto; width: 100%; margin-top: 0; z-index: 9999;" class="weui-cells searchbar-result" id="searchResult"></div>';
}

Select.prototype.mount = function(){

    var self = this
    var url = this.url;
    var formData = this.formData
    this.domId.append(this.search)
    this.domId.append(this.result)

    $searchBar = $('#searchBar');
    $searchResult = $('#searchResult');
    $searchText = $('#searchText');
    $searchInput = $('#searchInput');
    $searchClear = $('#searchClear');
    $searchCancel = $('#searchCancel');

    $searchResult.hide()

    function hideSearchResult(){
        $searchResult.hide();
        $searchInput.val('');
    }
    function cancelSearch(){
        hideSearchResult();
        $searchBar.removeClass('weui-search-bar_focusing');
        $searchText.show();
    }

    $searchText.on('click', function(){
        $searchBar.addClass('weui-search-bar_focusing');
        $searchInput.focus();
    });
    $searchInput
        .on('blur', function () {
            if(!this.value.length) cancelSearch();
        })
        .on('input', this.debounce(function(){
            if(this.value.length) {
                formData.keywords = this.value;
                $searchResult.show();
                $.ajax({
                    url: url,
                    data: formData,
                    success: function(res){
                        $searchResult.empty()
                        if(res.length === 0) {
                            let resultList =  '<div class="weui-cell weui-cell_active weui-cell_access">'+
                                                    ' <div class="weui-cell__bd weui-cell_primary" >'+
                                                        '<p>搜索结果不存在</p>'+
                                                    ' </div>'+
                                                ' </div>'
                            $searchResult.append(resultList)
                        } else {
                            res.map((item, index) => {
                                let resultList =  '<div class="weui-cell weui-cell_active weui-cell_access"  data-value="'+item.value+'" data-text="'+item.text+'" id="'+index+'">'+
                                                    ' <div class="weui-cell__bd weui-cell_primary" >'+
                                                        '<p>'+item.text+'</p>'+
                                                    ' </div>'+
                                                ' </div>'
                                
                                $searchResult.append(resultList)
                                var dom1 = document.getElementById(index)
                                dom1.addEventListener("click", (e) => {
    
                                    self.cb({
                                        value: e.currentTarget.getAttribute("data-value"),
                                        text: e.currentTarget.getAttribute("data-text")
                                    })
                                    $searchInput.val(e.currentTarget.getAttribute("data-text"))
                                    $searchResult.hide()
                                    
                                })
                            })
                        }
                    }
                })
            } else {
                $searchResult.hide();
                $searchResult.empty()
            }
        }, 300));

    $searchClear.on('click', function(){
        hideSearchResult();
        $searchInput.focus();
    });
    $searchCancel.on('click', function(){
        cancelSearch();
        $searchInput.blur();
    });
}


Select.prototype.onSelect = function(callback){
    this.cb = callback
}

Select.prototype.debounce = function(fn, delay){
    let delays = delay || 300;
    let timer;
    return function(){
        let self = this
        let args = arguments;
        if(timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(function(){
            timer = null;
            fn.apply(self, args)
        }, delays)
    }
}