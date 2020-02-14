window.accessor = require('accessor')
window.Xwindow  = (function(){
        function getArrow(obj){
            if (getValue(obj.value) !== undefined) 
            return ('arrow hide');
            else 
            return ('arrow');
        }
        function getValue(obj) {
            var type = $.type(obj);
            switch (type) {
                case 'array':
                case 'object':
                    return undefined;
                    break;
                case 'function':
                    return '()';
                    break;
                case 'string':
                    return obj ;
                    break;
                default:
                    return obj;
                    break;
            }
        }
        function getChildren(obj) {
            var type = $.type(obj);
            switch (type) {
                case 'array':
                case 'object':
                    return (json2html.transform(obj, transforms.object));
                    break;
                default:
                    break;
            }
        }
        function convert(oid, name, obj, show, path) {
            var type = $.type(obj);
            var value = [];
            var delimiter = "";
            if (oid != '') { delimiter = "."; }
    
            switch (type) {
                case 'array':
                    var len = obj.length;
                    show = 'closed';
                    for (var j = 0; j < len; ++j) {
                        if (path.indexOf(oid + delimiter + j) > -1 || oid == ''||path===oid) {
                            show = 'open';
                        } 
                        value[j] = convert(oid + delimiter + j, j, obj[j], show, path);
                    }
                    break;
                case 'object':
                    var j = 0;
                    show = 'closed';
                    for (var prop in obj) {
                        if (path.indexOf(oid + delimiter + prop) > -1 || oid == '' || path === oid) {
                            show = 'open';
                        }
                        value[j] = convert(oid + delimiter + prop, prop, obj[prop], show, path);
                        j++;
                    }
                    break;
                default:
                    show = 'closed';
    
                    value = obj;
                    break;
            }
            return ({ 'oid': oid, 'name': name, 'value': value, 'type': type, 'show': show, 'path': path});
        }
        function regEvents() {
            $('.bracket.object').off('click').on('click',  function () {
                //visable = $('.value[oid*="odrv0"]:visible')
            })
            $('.header').off('click').on('click',  function () {
                var oid =  $(this).attr('oid').replace('.header','') 
                var parent = $(this).parent();
                if (parent.hasClass('closed')) {
                    parent.removeClass('closed');
                    parent.addClass('open');
                } else 
                if (parent.hasClass('open')){
                    parent.removeClass('open');
                    parent.addClass('closed');
                }
                
            });
            $('.value').off('click').on('click', function (event) {
                    var oid = $(this).attr('oid').replace('.value','')
                    if($(this).text()==='()'){
                        self.local.objectPath.get(window, oid )()
                    }else{
                        $(this).prop('contenteditable', true);
                        $(this).css('background-color', '#cc8139')
                        $(this).focus()
                        
                       
                    }
            })
            $('.value').blur( function () {
                    var oid = $(this).attr('oid').replace('.value','')
                    var value   =   $(this).text()
                    $(this).prop('contenteditable', false);
                    $(this).css('background-color', '#262626');
                    if(value!=='()'){
                        self.local.objectPath.set(window, oid, value  );
                    }
            });
    
        }
    var transforms  = {
        object: { '<>': 'div', class: 'bracket ${show} ${type}',  html: [
                    { '<>': 'div', class: 'header', oid: '${oid}' + '.header',  html: [
                        {   '<>': 'div',  class: getArrow },
                		{   '<>': 'span', class: 'name',  oid: '${oid}' + '.name',    html: '${name} : ' },
                		{   '<>': 'span', class: 'value', oid: '${oid}' + '.value',   html: function (obj) { return  getValue(obj.value) } },
                		{   '<>': 'span', class: 'plot',  oid: '${oid}' + '.plot',    html: '' }
                	]},
                	{   '<>': 'div', class: 'children',  html: function (obj) { return getChildren(obj.value); } }
                ]}
    };
    var self        = {};
        self.local      = new accessor()
        self.local.on('get', function(identifier){ 
             //local.objectPath.get(remote.object, endpoint.path ) 
        })
        self.local.on('set', function(identifier,value){ 
                var el = $('[oid="' +  identifier + '.value"]');
                if( el.is(":focus")!==true){ el.text(value) }
        })
        self.xwindow    = function xwindow(X){
                if($('#' + X.id).length ){ return false}
                X.width ? true:X.width  = 640
                X.height? true:X.height = 480
                X.end   ? true:X.end    = function(){}
                xIndex+=20;
                var div     = { 
                        id: X.id, 
                        style: 'background-image: url("unit1.png"); background-repeat:no-repeat; background-size: contain;background-position: center;'
                    };
                var dialog  = {
                        "width": X.width,
                        "height": X.height,
                        "minHeight":10,
                        "minWidth": 10,
                        "position": [50 + xIndex   ,50 + xIndex],
                        "title": "X(" + X.id + ")",
                        "style":'font-size: 20pt; background-image: url("unit1.png"); background-repeat:no-repeat; background-size: contain;background-position: center;',
                        "close" : function(event, ui){ X.end(); $("#" + X.id).remove()  }
                    };
                var extend  = {
                        "closable": true,
                        "minimizable": true,
                        "maximizable": true,
                        "collapsable": true,
                        "dblclick": "collapse",
                        "titlebar": "transparent",
                        "minimizeLocation": "left"
                    };
                var ui = $('<div/>', div )
                    .appendTo( "body" )
                    .dialog( dialog )
                    .dialogExtend( extend )
                    .data("uiDialog")._title = function (title) { title.html(this.options.title); };
                    //document.getElementById( X.id).style.textShadow = "1px 1px 1px #000000";
                return true
    }
        self.vt100      = function vt100(s){
            var vt  = new Terminal({    
                cols: 80,
                rows: 24,
                allowTransparency:true, 
                screenKeys: true, 
                convertEol:true, 
                cursorBlink:true,
                theme:{
                    background:'transparent'
                }
            });
            var fit = new FitAddon.FitAddon();
            var end = function(){
                $("#" + s.id).remove()
                $( "#" + s.id ).dialog( "destroy" )
                vt.dispose();
            }
                vt.loadAddon(fit);
                s.width    = 652
    	        s.height   = 400
                self.xwindow(s);
                vt.open( document.getElementById(s.id) );
                $("#" + s.id).on('dialogresize', function(){
                    fit.fit();
                    s.setSize({columns:vt.cols, rows:vt.rows})
                })
                fit.fit();
                s.setSize({columns:vt.cols, rows:vt.rows})
                s.on('data',function(data){
                    vt.write(data.toString())
                })
                vt.onData(function(data,e,f){
                    s.write(data)
                })
                s.on('end',     end)
                s.on('close',   end)
            
        } 
        self.editor     = function editor(s){
            s.width    = 700
    	    s.height   = 400
            self.xwindow(s);
            var title_bar = '<span style="float:left;">' +
                                '<button title="share" '+
                                'style="height:20px;width:30px;" ' +
                                'id="share_' + s.id + '"/></span>'+
                            '<span style="float:left;">' + 
                                '<button title="save" ' + 
                                'style="height:20px;width:30px;" ' +
                                'id="save_' + s.id + '"/></span>' +
                            '<span style="float:center;">' + 
                                '<div id="title_' + s.id + '"> &nbsp X(' +
                                s.id + ')</div></span>';
                $("#" + s.id).dialog('option', 'title', title_bar);
                $('#share_' + s.id).button({ icons: { primary: 'ui-icon-signal-diag' } })
                $('#share_' + s.id).click(function () { var e = { event:'share'} });    
                $('#save_'  + s.id).button({ icons: { primary: 'ui-icon-disk' } });
                $('#save_'  + s.id).click(function () { 
                    var e = { event:'save', path:s.path } 
                        s.emit('socket.io',e)
                }); 
                $("#" + s.id).on('dialogresize', function(){
                    edit.resize();
                    edit.renderer.updateFull();
                })
                
            var end = function(){
                $("#" + s.id).remove()
                $( "#" + s.id ).dialog( "destroy" )
                edit.destroy()
            }
            var edit = ace.edit(s.id);
                edit.setByAPI = false;
                edit.setFontSize(12);
                edit.setShowPrintMargin(false);
                edit.setTheme("ace/theme/monokai");
                edit.getSession().setMode("ace/mode/javascript");
                edit.on('change', function (delta) {
                    if(!edit.setByAPI){
                        s.write(delta)
                    }
                });
                s.on('data',function(delta){
                        edit.setByAPI = true;
                        edit.getSession().getDocument().applyDeltas( [delta] )
                        edit.setByAPI = false;
                })
                s.on('end',     end)
                s.on('close',   end)
        
    }
        self.rfb        = function rfb(s){
                var end     = function(){
                    $("#" + s.id).remove()
                    $("#" + s.id ).dialog( "destroy" )
                    s.emit('socket.io',{event:'close'})
                }
                var canvas  = new rfbviewer()
                    canvas.addEventListener('pointerEvent', function(e){
                        s.emit('socket.io', { event:'pointerEvent', data: e.detail })
                    })
                    canvas.addEventListener('keyEvent', function(e){
                        s.emit('socket.io', { event:'keyEvent', data: e.detail } );
                    })
                    
                    s.on('connect',    function(info){

                        s.width    = info.width  + 30//border
        	            s.height   = info.height + 50//border
        	            self.xwindow(s);
        	            canvas.width    = info.width
                        canvas.height   =  info.height
        	            $(canvas).appendTo( $("#" + s.id ) )
                        $("#" + s.id).dialog('option', 'width',  info.width + 30);
                        $("#" + s.id).dialog('option', 'height', info.height + 50);
                        $("#" + s.id).dialog('option', 'title',  info.title);
                    } )
                    s.on('frame',      canvas.drawRect )
                    s.on('end',        end)
                    s.on('close',      end)
        }
        self.js2html    = function toHTML(js, path) {
            if($('#' + path).length === 0){
                self.xwindow( { id:path } )
            }
            //console.log($('#' + path).length)
            self.local.proxy(js,path)
            $('#' + path).html('');
            $('#' + path).json2html(convert(path, path, js, 'open', path), transforms.object);
            regEvents();
            
        }
        self.sparkline  = function createSparkline(oid,ref,epoch){
            var el = $('[oid="' + oid + '"]')
            var sparkline = {
                    samples:    [],
                    sampleMax:  100,
                    start:      Date.now(),
                    ts:         Date.now(),
                    epoch:      0,
                    style:      {
                                type: 'line',
                                width:200,
                                height:20,
                                //tooltipSuffix: ' ' + ref,
                                lineColor: '#cc8139',
                                fillColor: '#595540',
                                spotColor: '#cc8139',
                                minSpotColor: '#cc8139',
                                maxSpotColor: '#cc8139',
                                highlightSpotColor: '#cc8139',
                                highlightLineColor: '#cc8139',
                                normalRangeColor: '#cc8139'
                    },
                    update:     function(value){
                                if( Date.now()-sparkline.ts > 100 ){
                                    sparkline.epoch   = Date.now()-sparkline.ts;
                                    sparkline.ts      = Date.now();
                                    sparkline.samples.push(value)
                                    if (sparkline.samples.length > sparkline.sampleMax){
                                        sparkline.samples.splice(0,1);
                                    }
                                    el.sparkline(sparkline.samples, sparkline.style )
                                }
                    }
                    //interval:setInterval( function(){ plotter.update( objectPath.get(window, ref) ) }, epoch )
            }
            
            return sparkline
            
        }
        
    return self
    
}())