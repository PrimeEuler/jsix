var repl        = require('@primeeuler/repl');
var network     = require('@primeeuler/conflux');
var pty         = require('node-pty');
var os          = require('os');
var fs          = require('fs');
var inspect     = require('util').inspect
var rfb         = require('rfb2');
var Png         = require('pngjs').PNG;
var requirejs   = require("requirejs");
    requirejs.    config({
        baseUrl: __dirname + '/lib/ace/',
        nodeRequire: require
    })
var ace         = requirejs('document');
var net         = new network()    
var shell       = new repl()

var login       = function(sh){ 
    var username    = function(text,callback){ return callback(true) }
    var password    = function(text,callback){ return callback(true) }
        sh.access   = { user:'', accept:false, failures:0 }
        sh.ask('username', function( user ){
            username(user, function(accept){
                sh.access.user = user
                if(accept){
                    sh.ask('password', function( pass ){
                        password( pass , function(accept){
                            sh.access.accept = accept
                            if(accept){
                                init( sh )
                            }else if(sh.access.failures < 2){
                                sh.access.failures ++
                                login( sh )
                            }else{
                                sh.kill()
                            }
                        })
                    },true)    
                }else if(sh.access.failures < 2){
                    sh.access.failures ++
                    login( sh )
                }else{
                    sh.kill()
                }
            })
            
        },false) }
var init        = function(sh){
        sh.user      = sh.access.user // os.userInfo().username //username
        sh.at        = '@'
        sh.home      = os.hostname()
        sh.context.global   = global
        sh.context.shell    = sh
        sh.context.os       = os
        sh.on('drain', function(){
            sh.print('drain')
        })
        sh.context.exec     = function(){
            var spawn       = pty.spawn.apply( null, arguments, {handleFlowControl: true} );
            var resize      = function(size){ spawn.resize(size[0],size[1]) }
            var resume      = function(){
                sh.io.unpipe(spawn)
                //spawn.unpipe(sh.io)
                //cleanup pipe
                sh.io.removeAllListeners('unpipe')
                sh.io.removeAllListeners('drain')
                sh.io.removeAllListeners('error')
                sh.io.removeAllListeners('close')
                sh.io.removeAllListeners('finish')
                //cleanup terminal
                sh.removeListener('resize',resize)
                spawn.destroy()
                sh.isRaw = false
                sh.io.resume()
                sh.loop()
                
            }
                sh.isRaw = true
                sh.io
                    .pipe( spawn, { end:false } )
                    .pipe( sh.io, { end:false } )
                sh.on('resize',resize)
                resize([sh.columns,sh.rows])
                spawn.on('exit',resume)
                spawn.on('close',resume)
                spawn.on('end',resume)
                spawn.on('error', sh.print)
        }
        sh.context.login    = function(){
            login(sh)
        }
        sh.context.network  = net
        sh.context.print = sh.print
}
var kill        = function(){
    process.stdin.setRawMode( false )
    process.exit()
}
var edit        = function(stream, path){
        var doc = new ace.Document('');
            doc.on('change',    function(delta){
                if(!doc.setByAPI){ stream.write(delta) }
            })
            stream.on('data',   function(data){
                doc.setByAPI = true;
                doc.applyDeltas([data]);
                doc.setByAPI = false;
            })
            stream.on('save',   function(){
                fs.writeFileSync(path, doc.getValue(), 'utf8')
            })
            stream.on('share',  function(){
                
            })
            if(fs.existsSync(path)){
                doc.setByAPI = false;
                doc.setValue( fs.readFileSync(path, 'utf8') )
            }
            return doc
    }
    
    
//  terminal emulator process    
    if(process.stdin.isTTY){
        process.stdin.setRawMode( true )
    }
//  connect terminal emulator to line discipline (repl)
    process.stdin.pipe( shell ).pipe( process.stdout )
//  listen for terminal resizeing
    process.stdout.on('resize', function() {
        shell.setSize( process.stdout )
    })
//  set columns and rows
    shell.setSize( process.stdout )  
//  sigkill
    shell.on('end',  kill)
    shell.on('close',kill)
//  authenticate 
    login( shell )
//  networking
    net.sockets = {}
    net.use(__dirname + '/lib/web/')
    net.on('error', shell.print )
    net.on('socket', function( socket, options ){
        net.sockets[socket.id] = socket
        socket.on('error',shell.print)
        socket.on('end',function(){
            shell.print({id:socket.id, event:'end'})
            delete( net.sockets[socket.id] )
        })
        socket.on('disconnect',function(){
            shell.print({id:socket.id, event:'disconnect'})
            delete( net.sockets[socket.id] )
        })
        //client info
        shell.print({id:socket.id, handshake: socket.handshake} )
    })
    net.on('stream', function( stream, options, socket ){
        shell.print( options )
        stream.on('error', shell.print )
        switch( options.service ){
                case 'repl':
                    var sh  = new repl()
                        login(sh)
                        stream.pipe( sh ).pipe( stream )
                        stream.on('resize', function( size ) {
                            sh.setSize( size )
                        })
                        sh.context.socket   = socket
                        sh.context.streams  = [];
                        sh.context.editor   = function(path){
                            var options = { objectMode:true, path:path, service:'editor'} 
                            var stream  = net.createStream( options , socket);
                            var editor 	= new edit(stream, path)
                                stream.on('save',function(){ sh.print({ service:'write', path:path }) }) 
                                sh.context.streams.push(stream)
                            return path
                        }
                        sh.context.rfb      = function(host, port, password, fps ){
                            var options = { objectMode:true, service:'rfb'}
                            var s   = net.createStream(options, socket);
                            var r   = rfb.createConnection({
                                host: '127.0.0.1',
                                port: 5901,
                                password: 'testvnc',
                                securityType: 'vnc'
                            });
                            function encodeFrame(rect) {
                                var png = new Png({
                                    width: rect.width,
                                    height: rect.height,
                                    filterType: -1
                                });
                                for (var y = 0; y < png.height; y++) {
                                    for (var x = 0; x < png.width; x++) {
                                        var idx = (png.width * y + x) << 2;// bitwise * 4 (grgb)
                                        png.data[idx+0] = rect.data[idx+2] //R
                                        png.data[idx+1] = rect.data[idx+1] //G
                                        png.data[idx+2] = rect.data[idx+0] //B
                                        png.data[idx+3] = 255              //A
                                    }
                                }
                                
                                return Png.sync.write(png,{ colorType: 6 })
                            }
                                r.on('connect', function() {
                                    var info = { title: r.title, width:r.width, height:r.height }
                                        sh.print( info )
                                        s.emit('socket.io', { event:'connect', data:info } )
                                        //r.updateClipboard('send text to remote clipboard');
                                        //r.requestUpdate(false, 0, 0, r.width, r.height);
                                        s.interval = setInterval( function () {
                                            r.requestUpdate(true, 0, 0, r.width, r.height);
                                        }, 1000/(fps||10))
                                });
                                r.on('rect', function(rect) {
                                    switch(rect.encoding) {
                                        case rfb.encodings.raw:
                                            // rect.x, rect.y, rect.width, rect.height, rect.data
                                            // pixmap format is in r.bpp, r.depth, r.redMask, greenMask, blueMask, redShift, greenShift, blueShift
                                            //print( encodeFrame(rect).toString('base64') )
                                            s.emit('socket.io',{event:'frame', data: {
                                                x: rect.x,
                                                y: rect.y,
                                                width: rect.width,
                                                height: rect.height,
                                                image: encodeFrame(rect).toString('base64')
                                            }});
                                            break;
                                        case rfb.encodings.copyRect:
                                            // pseudo-rectangle
                                            // copy rectangle from rect.src.x, rect.src.y, rect.width, rect.height, to rect.x, rect.y
                                            break;
                                        case rfb.encodings.hextile:
                                            // not fully implemented
                                            //rect.on('tile', handleHextileTile); // emitted for each subtile
                                            break;
                                    }
                                });
                                r.on('resize', function(rect) {
                                    sh.print('window size has been resized! Width: %s, Height: %s', rect.width, rect.height);
                                });
                                r.on('clipboard', function(newPasteBufData) {
                                    sh.print('remote clipboard updated!', newPasteBufData);
                                });
                                r.on('bell', sh.print);
                                r.on('error', function(e){
                                    sh.print(e)
                                    clearInterval(s.interval)
                                    s.end()
                                    r.end()
                                });
                                r.on('*', sh.print);
                                r.stream.on('end',function(){
                                    clearInterval(s.interval)
                                    s.end()
                                    r.end()
                                })
                                
                                s.on('pointerEvent', function (evnt) {
                                    r.pointerEvent(evnt.x, evnt.y, evnt.buttons);
                                });
                                s.on('keyEvent', function (evnt) {
                                    r.keyEvent(evnt.keyCode, evnt.isDown);
                                });
                                s.on('end', function () {
                                    sh.print({event:'end'})
                                    clearInterval(s.interval)
                                    r.end()
                                    s.emit('socket.io',{event:'end'})
                                    s_kill()
                                });
                                s.on('close', function () {
                                    sh.print({event:'close'})
                                    clearInterval(s.interval)
                                    r.end()
                                    s_kill()
                                });
                                function s_kill(){
                                    const index = sh.context.streams.indexOf(s);
                                    if (index > -1) {
                                      sh.context.streams.splice(index, 1);
                                    }
                                }
                                sh.context.rfbConnection = r;     
                                sh.context.streams.push(s)
                                
                                
                                return host
                            
                        }
                        sh.context.repl     = function(id){
                            var vt100       = net.createStream({ objectMode:true, service:'vt100', mimeType:'text/x-ansi'}, socket);
                            var web_repl    = net.createStream({ 
                                objectMode:true, 
                                service:'repl', 
                                mimeType:'text/x-ansi',
                                home:net.sockets[id].handshake.address
                                
                            }, net.sockets[id]);
                                vt100.pipe(web_repl).pipe(vt100)
                            return id
                        }
                        sh.context.streamUserMedia = function(constraints,src,dst){
                            var enc = {
                                objectMode:true, 
                                service:'mediaEncoder', 
                                constraints:constraints }
                            var dec = {
                                objectMode:true, 
                                service:'mediaDecoder', 
                                mimeType:'' }
                                sh.print(enc)
                            var encoder = net.createStream( enc, src ? net.sockets[src] : socket );
                                encoder.on('mimeType', function(mimeType){
                                    
                                    dec.mimeType = mimeType
                                    
                                    sh.print(dec)
                                    var decoder = net.createStream( dec, dst? net.sockets[dst] : socket ) ;
                                    encoder.pipe(decoder)
                                    decoder.on('end', function () {
                                        sh.print({ service:dec.service, event:'end'})
                                        encoder.emit('socket.io',{event:'end'})
                                        s_kill()
                                    });
                                    
                                    sh.context.streams.push(encoder)
                                    sh.context.streams.push(decoder)
                                    
                                    
                                    function s_kill(){
                                        var index = sh.context.streams.indexOf(encoder);
                                        if (index > -1) {
                                          sh.context.streams.splice(index, 1);
                                        }
                                        index = sh.context.streams.indexOf(decoder);
                                        if (index > -1) {
                                          sh.context.streams.splice(index, 1);
                                        }
                                    }
                                    
                                    
                                })
                            
                        }
                    break;
                case 'pub':
                    net.channels.push( options.channel )
                    stream.on("data",function(data){
                        net.pubsub.publish( options.channel ,data)
                    })
                    break;
                case 'sub':
                    var subscriber = cfx.pubsub.subscribe( options.channel, function(msg,data){ 
                            stream.write(data)
                    })
                    stream.on('end',function(){
                        net.pubsub.unsubscribe( subscriber )
                    })
                    break;
            }
    })
    //net.listen( 8443, function(){ shell.print( this.address() ) } )
    

    
    
    
    
    
    
    
    
