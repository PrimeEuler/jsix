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
                        self.accessor.objectPath.get(window, oid )()
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
                        self.accessor.objectPath.set(window, oid, value  );
                    }
            });
    
        }

    var xIndex      = 0;
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
        self.accessor      = new accessor()
        self.accessor.on('get', function(identifier){ 
             //local.objectPath.get(remote.object, endpoint.path ) 
        })
        self.accessor.on('set', function(identifier,value){ 
                var el = $('[oid="' +  identifier + '.value"]');
                if( el.is(":focus")!==true){ el.text(value) }
        })
        //X Servers
        self.bluetooth  = {
            requestDevice: function(callback){
                navigator.bluetooth.requestDevice({
                        filters: [{
                            services: [0x1234, 0x12345678, '99999999-0000-1000-8000-00805f9b34fb']
                        }]
                    })
                    .then(function(device) { callback(device) })
                    .catch(function(error) { callback(error) });
            }
        }
        self.usb        = {
            getDevices : function(callback){
                var devs = []
                navigator.usb.getDevices()
                    .then(function(devices){
                        devices.forEach(function(device){
                            devs.push({
                                productName:device.productName,
                                serialNumber:device.serialNumber
                            })
                        });
                        callback(devs)
                    })
                    .catch(function(err){
                        callback(err)
                    })
                return callback
            }
        }
        self.mediaDevices = { 
            enumerateDevices : function(callback){
                navigator.mediaDevices.enumerateDevices()
                    .then(function(devices) {
                        var devs = []
                            devices.forEach(function(device) {
                                devs.push(device.toJSON())
                                /*
                              devs.push({
                                  deviceId:device.deviceId,
                                  groupId:device.groupId,
                                  kind:device.kind,
                                  label:device.label
                              })
                              */
                            });
                            callback(devs)
                    })
                    .catch(function(err) {
                        callback(err)
                    });
                    return callback
            }
            
        }
        self.mouse      = function(element){
            function focus(e){
                if(e.type=='mouseover'){
                    element.focus();
                    //canvas.style.cursor = 'none'
                    return false;
                }else if(e.type=='mouseout'){
                    element.blur(); 
                    //canvas.style.cursor = 'default'
                    return false;
                }
                return true;
            };
            function mouse(e) {
                    var rect = element.getBoundingClientRect(); 
                        x = e.clientX - rect.left; 
                        y = e.clientY - rect.top;
                    var buttonMask = [0,1,4,8]
                    var pointerEvent = { 
                        detail: { x:x, y:y, buttons:buttonMask[e.buttons] }, 
                        bubbles: false, 
                        cancelable: true 
                        
                    }
                    element.dispatchEvent( new CustomEvent( "pointerEvent", pointerEvent ))
                    e.preventDefault();
            }
            element.setAttribute('tabindex','0');
            element.addEventListener('mouseover', focus,false);
            element.addEventListener('mouseout',  focus,false);
            element.addEventListener('mousedown', mouse, false);
            element.addEventListener('mouseup',   mouse, false);
            element.addEventListener('mousemove', mouse, false);
            element.addEventListener('contextmenu', e => {
                e.preventDefault();
            });
        }
        self.keyboard   = function keyboard(element){
            function KeyCode (code, shift) {
                code = code.toString();
                var keys = keyMap[code];
                if (keys) {
                  return keys[shift ? 1 : 0];
                }
                return null;
              };
            function keypress(e){
                var isDown = 0;
                    if(e.type=='keydown'){
                        isDown = 1
                    }else if(e.type=='keyup'){
                        isDown = 0
                    }
                var keyCode = KeyCode(e.keyCode, e.shiftKey, isDown);
                var keyEvent = { 
                    detail: { keyCode: keyCode, isDown: isDown }, 
                    bubbles: false, 
                    cancelable: true 
                    
                }
                    if(keyCode){
                        element.dispatchEvent( new CustomEvent( "keyEvent", keyEvent ))
                        e.preventDefault();
                    }
              return false;
            };
            var keyMap  = {
                        8: [
                          65288,
                          65288
                        ],
                        9: [
                          65289,
                          65289
                        ],
                        13: [
                          65293,
                          65293
                        ],
                        16: [
                          65506,
                          65506
                        ],
                        17: [
                          65508,
                          65508
                        ],
                        18: [
                          65514,
                          65514
                        ],
                        27: [
                          65307,
                          65307
                        ],
                        32: [
                          32,
                          32
                        ],
                        33: [
                          65365,
                          65365
                        ],
                        34: [
                          65366,
                          65366
                        ],
                        35: [
                          65367,
                          65367
                        ],
                        36: [
                          65360,
                          65360
                        ],
                        37: [
                          65361,
                          65361
                        ],
                        38: [
                          65362,
                          65362
                        ],
                        39: [
                          65363,
                          65363
                        ],
                        40: [
                          65364,
                          65364
                        ],
                        45: [
                          65379,
                          65379
                        ],
                        46: [
                          65535,
                          65535
                        ],
                        48: [
                          48,
                          41
                        ],
                        49: [
                          49,
                          33
                        ],
                        50: [
                          50,
                          64
                        ],
                        51: [
                          51,
                          35
                        ],
                        52: [
                          52,
                          36
                        ],
                        53: [
                          53,
                          37
                        ],
                        54: [
                          54,
                          94
                        ],
                        55: [
                          55,
                          38
                        ],
                        56: [
                          56,
                          42
                        ],
                        57: [
                          57,
                          40
                        ],
                        65: [
                          97,
                          65
                        ],
                        66: [
                          98,
                          66
                        ],
                        67: [
                          99,
                          67
                        ],
                        68: [
                          100,
                          68
                        ],
                        69: [
                          101,
                          69
                        ],
                        70: [
                          102,
                          70
                        ],
                        71: [
                          103,
                          71
                        ],
                        72: [
                          104,
                          72
                        ],
                        73: [
                          105,
                          73
                        ],
                        74: [
                          106,
                          74
                        ],
                        75: [
                          107,
                          75
                        ],
                        76: [
                          108,
                          76
                        ],
                        77: [
                          109,
                          77
                        ],
                        78: [
                          110,
                          78
                        ],
                        79: [
                          111,
                          79
                        ],
                        80: [
                          112,
                          80
                        ],
                        81: [
                          113,
                          81
                        ],
                        82: [
                          114,
                          82
                        ],
                        83: [
                          115,
                          83
                        ],
                        84: [
                          116,
                          84
                        ],
                        85: [
                          117,
                          85
                        ],
                        86: [
                          118,
                          86
                        ],
                        87: [
                          119,
                          87
                        ],
                        88: [
                          120,
                          88
                        ],
                        89: [
                          121,
                          89
                        ],
                        90: [
                          122,
                          90
                        ],
                        97: [
                          49,
                          49
                        ],
                        98: [
                          50,
                          50
                        ],
                        99: [
                          51,
                          51
                        ],
                        100: [
                          52,
                          52
                        ],
                        101: [
                          53,
                          53
                        ],
                        102: [
                          54,
                          54
                        ],
                        103: [
                          55,
                          55
                        ],
                        104: [
                          56,
                          56
                        ],
                        105: [
                          57,
                          57
                        ],
                        106: [
                          42,
                          42
                        ],
                        107: [
                          61,
                          61
                        ],
                        109: [
                          45,
                          45
                        ],
                        110: [
                          46,
                          46
                        ],
                        111: [
                          47,
                          47
                        ],
                        112: [
                          65470,
                          65470
                        ],
                        113: [
                          65471,
                          65471
                        ],
                        114: [
                          65472,
                          65472
                        ],
                        115: [
                          65473,
                          65473
                        ],
                        116: [
                          65474,
                          65474
                        ],
                        117: [
                          65475,
                          65475
                        ],
                        118: [
                          65476,
                          65476
                        ],
                        119: [
                          65477,
                          65477
                        ],
                        120: [
                          65478,
                          65478
                        ],
                        121: [
                          65479,
                          65479
                        ],
                        122: [
                          65480,
                          65480
                        ],
                        123: [
                          65481,
                          65481
                        ],
                        186: [
                          59,
                          58
                        ],
                        187: [
                          61,
                          43
                        ],
                        188: [
                          44,
                          60
                        ],
                        189: [
                          45,
                          95
                        ],
                        190: [
                          46,
                          62
                        ],
                        191: [
                          47,
                          63
                        ],
                        192: [
                          96,
                          126
                        ],
                        219: [
                          91,
                          123
                        ],
                        220: [
                          92,
                          124
                        ],
                        221: [
                          93,
                          125
                        ],
                        222: [
                          39,
                          34
                        ]
                      };
                element.addEventListener('keydown',   keypress,false);
                element.addEventListener('keyup',     keypress,false);
            
        }
        //X clients
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
                edit.setFontSize(15);
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
        self.js2html    = function toHTML(js, id) {
            if($('#' + id).length === 0){
                self.xwindow( { id:id } )
            }
            self.accessor.proxy(js,id)
            $('#' + id).html('');
            $('#' + id).json2html(convert(id, id, js, 'open', id), transforms.object);
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