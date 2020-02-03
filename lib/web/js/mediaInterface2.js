window.mediaInterface = (function (){
    var bstring  = {
            BLOB2BS:function BLOB2BS(blob, callback){
                        var blobReader = new FileReader();
                            blobReader.onload = function(e) {
                              callback(  bstring.U82BS( new Uint8Array( blobReader.result ) ) );
                            }
                            blobReader.readAsArrayBuffer(blob);
                },
            U82BS:  function U82BS(u8Array){
                	var i, len = u8Array.length, b_str = "";
                    	for (i=0; i<len; i++) {
                    		b_str += String.fromCharCode(u8Array[i]);
                    	}
                    	return b_str;        
                },
            BS2U8:  function BS2U8(str){
                        var buf     = new ArrayBuffer(str.length); // 2 bytes for each char
                        var bufView = new Uint8Array(buf);
                        for (var i=0, strLen = str.length; i < strLen; i++) {
                            bufView[i] = str.charCodeAt(i);
                        }
                        return bufView;        
                    },
            BIN:    function BIN(a){
                        var unpad = a.charCodeAt(0).toString(2);
                        var pad = (new Array(8 - unpad.length + 1)).join('0') + unpad;
                        return pad;
                    }
    }
    var lev = 1
    var levOffset = [];
        levOffset[0]=0;
    var ebml    = {
        parse:function(binstr,offsets,element){
            var offset = 0;
            var ElementStart = 0;
                offsets = offsets||[]
                element = element||{}
    
            while(offset < binstr.length){
                    ElementStart = offset;
                var unpad = binstr.charCodeAt(offset).toString(2);
                var segments = 8 - unpad.length; //additional segments to decode to get element ID
                var padding = (new Array(segments + 1)).join('0');
                var classID = '';
            //Element.ID chunk
                    for(var i = 0; i <= segments; i++){
                        var b = binstr.charCodeAt(offset+i);
                        classID += b.toString(16);
                    }
                    offset += segments + 1;
                    
            //skip padding
                var len = 0;
                    while(binstr.charCodeAt(offset + len) == 0){
                        len++;
                    }
                    offset += len;
                var unpad = binstr.charCodeAt(offset).toString(2);
                var segments = (8 - unpad.length);
                var tex = unpad.substr(1); //initialize the binary with the first few digits
            //Element.Size chunk
                    for(var i = 1; i <= segments; i++){
                        var tmp = binstr.charCodeAt(offset+i).toString(2);
                        var pd = (new Array(8 - tmp.length + 1)).join('0') + tmp;
                        tex += pd;
                    }
                var size = parseInt(tex, 2);
                    offset += segments + 1;
                var head = offset; 
            //Element.Data chunk
                var data = binstr.substr(offset, size);
                    offset += data.length
    
                var msg = schema[classID];
                    if(msg){
                            levOffset[lev] = [ElementStart,head,offset,msg.name]
                        var start = 0;
                        var path = ''
                            for(var l = lev;l>=1;l-- ){
                                if(l===lev){
                                    start += levOffset[l][0]
                                    path = levOffset[l][3]
                                }else{
                                    start += levOffset[l][1]
                                    path = levOffset[l][3] + '.' + path
                                }
                                
                            }
                        var stop = start + offset - ElementStart
    
                            
                        
                        
                        // m: Master, u: unsigned int, i: signed integer, s: string, 8: UTF-8 string, b: binary, f: float, d: date
                        var type = msg.type;
                        var dat = null;
                        if(type == 'u'){
                            var bint = data.split('').map(bstring.BIN).join('');
                                dat = parseInt(bint,2)
                                //dat = bint.length//parseInt(bint,2);
                                
                        }else if(type == 'i'){
                        }else if(type == 's'){
                          dat = data;
                        }else if(type == '8'){
                          dat = data;
                        }else if(type == 'b'){
                          //dat = data.substr(0,100); //not interpreted by parser
                          dat = data;
                        }else if(type == 'f'){
                            var bint = data.split('').map(bstring.BIN).join('');
                            //IEEE 754 single precision binary floating point format
                                dat = bint.length;
                                if(bint.length == 64){
                                    var sign = bint.charAt(0);
                                    var expo = parseInt(bint.substr(1,11),2) - 1023;
                                    var frac = bint.substr(12, 52);
                                }else if(bint.length == 32){
                                }
                        }else if(type == 'd'){
                        }else if(type == 'm'){
    
                                
                            var ob = {}
                            if(element[msg.name]){
                                if(!Array.isArray(element[msg.name])){
                                    var tmp = element[msg.name];
                                    element[msg.name] = []
                                    element[msg.name].push(tmp)
                                }
                                element[msg.name].push(ob)
                            }else{
                                element[msg.name] = ob
                            }
                            
                            offsets.push({ path:path, value:'Master Element', start:start, stop:stop})
                            
                            lev++;
                            ebml.parse( data, offsets, ob );
                            delete levOffset[lev]
                            lev--;
                          
                        }
                        if(type!='m'){
                            if(msg.name==='SimpleBlock'){
                                dat = dat.length
                            }
                            if(element[msg.name]){
                                if(!Array.isArray(element[msg.name])){
                                    var tmp = element[msg.name];
                                    element[msg.name] = []
                                    element[msg.name].push(tmp)
                                }
                                element[msg.name].push(dat)
                            }else{
                                element[msg.name] = dat
                            }
                            offsets.push({ path:path, value:dat, start:start, stop:stop})
                        }
                    }else{
                        console.log(classID, offset, binstr.length);
                    }
            }
            //console.log(element)
            return [element,offsets]
            //return offsets
        }
    }
    this.createMediaDecoder = function createMediaDecoder(mimeType){
        var decoder     = new MediaSource()
        var initSegment = false
        var queue       = [];
        var buffer      ;
            decoder.addEventListener('sourceopen', function(e) {
                    console.log('decoding',mimeType)
                    buffer = decoder.addSourceBuffer(mimeType);
                    buffer.mode = 'sequence';
                    buffer.addEventListener('update', function() {
                        if (queue.length > 0 && !buffer.updating) {
                            var data = queue.shift()
                                buffer.appendBuffer(data);
                        }
                    });
                
            });
            decoder.addEventListener('sourceended', function(e) {
                    console.log('decoding stopped')
            });
            
            decoder.appendBuffer  = function(data){
                    data            = new Uint8Array(data)
                var binaryString    = bstring.U82BS( data )
                var headers         = ebml.parse(binaryString)
                var EBML            = headers[1].filter(function(element){
                        return(element.path.indexOf('EBML') > -1 && element.value === 'Master Element')
                    })[0]
                    if(!initSegment && EBML ){
                        initSegment = true;
                        //init Segment
                        binaryString = binaryString.substring(EBML.start);
                        data = bstring.BS2U8(binaryString);
                    }
                    if(initSegment && decoder.readyState === 'open'){
                        if (buffer.updating || queue.length > 0) {
                            queue.push(data);
                        } else {
                            buffer.appendBuffer(data);
                        }
                    }
            }
            decoder.stop    = function(){
                initSegment = false
                if(buffer.updating){
                    buffer.addEventListener('updateend', function(e) { 
                        decoder.endOfStream()
                    },{once:true})  
                }else if (decoder.readyState === 'open'){
                    decoder.endOfStream()
                }
            }
            return decoder
    }
    this.createMediaElement = function createMediaElement(stream){
        var video       = document.createElement('video');
        var canvas      = document.createElement('canvas');
        var readyState  = ['HAVE_NOTHING','HAVE_METADATA','HAVE_CURRENT_DATA','HAVE_FUTURE_DATA','HAVE_ENOUGH_DATA',]
        var element     = {
            video:video,
            canvas:canvas,
            context:canvas.getContext('2d'),
            getReadyState:function(){
                return readyState[video.readyState]
            },
            draw:function(){
                if(canvas.width != video.videoWidth || canvas.height != video.videoHeight){
                    canvas.width    = video.videoWidth;
                    canvas.height   = video.videoHeight;
                    var resizeEvent = { 
                        detail: { width:canvas.width, height:canvas.height }, 
                        bubbles: false, 
                        cancelable: true 
                    }
                    canvas.dispatchEvent( new CustomEvent( "resizeEvent", resizeEvent ))
                }
                if(readyState[video.readyState]==='HAVE_ENOUGH_DATA'){
                    requestAnimationFrame(element.draw)
                }
                element.context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            }
        }
            video.addEventListener('loadedmetadata', function() {
                URL.revokeObjectURL(video.src);
                video.play()
            })
            video.addEventListener('canplay',function(){
                element.draw()
            })
            try{
                video.srcObject = stream;
            }catch(error){
                video.src = URL.createObjectURL(stream);
            }
            return element
    }
    this.createMediaEncoder = function createMediaEncoder(stream){
        var kind = { audio:false, video: false } 
            stream
            .getTracks()
            .forEach(function(track){ 
                switch(track.kind){
                    case 'audio':
                        kind.audio = true;
                        break;
                    case 'video':
                        kind.video = true;
                        break;
                }
            })
        var options = { mimeType:'' }
            if(kind.video && kind.audio){
                options.mimeType = 'video/webm;codecs=vp8,opus'
            }else if(kind.audio){
                options.mimeType = 'audio/webm;codecs=opus'
            }else if(kind.video){
                options.mimeType = 'video/webm;codecs=vp8'
            }
        
        var encoder     = new MediaRecorder(stream,options);
        var initSegment = ''
        var encode      = function(binaryString){
                var headers = ebml.parse(binaryString);
                var EBML    = headers[1].filter(function(element){
                        return(element.path.indexOf('EBML') > -1 && element.value === 'Master Element')
                    })[0]
                var Cluster = headers[1].filter(function(element){
                        return(element.path.indexOf('Cluster') > -1 && element.value === 'Master Element')
                    })[0]
                if(EBML && Cluster){
                    //capture initSegment for streaming
                    initSegment = binaryString.substring(0,Cluster.start)
                    
                }else if(Cluster){
                    //add init headers evey cluster for streaming
                    //possible to do adaptive streaming with updated initSegment
                    var _end = binaryString.substring(0,Cluster.start)
                    var _beg = binaryString.substring(Cluster.start)
                    binaryString = _end + initSegment + _beg
                }
                encoder.ondata( bstring.BS2U8(binaryString) )
        }
            encoder.ondataavailable = function (e) {
                bstring.BLOB2BS(e.data, encode )
            }
            encoder.onstop = function(){
                encoder
                    .stream
                    .getTracks()
                    .forEach(function(track){ 
                        track.stop()
                        
                    })
                console.log('encoding stopped')
                clearInterval(encoder.dataInterval)
            }
            encoder.onstart = function(){
                console.log('encoding', encoder.mimeType)
                encoder.dataInterval = setInterval( function(){ encoder.requestData() } , 100 )
            }
            encoder.ondata = function(data){
                
            }
            encoder.start()
            
        return encoder        
    }
    return this
}())