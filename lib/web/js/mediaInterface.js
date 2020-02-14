window.mediaInterface = (function (){
    var self = {}
        self.getTimeRanges = function(TimeRanges){
            var l = TimeRanges.length
            var timeRanges= []
            for (var t = 0;t<l;t++){
                var stamp = {
                    start: TimeRanges.start(t) ,
                    end: TimeRanges.end(t)
                }
                timeRanges.push(stamp)
            }
            return timeRanges
        }
        self.createMediaDecoder = function createMediaDecoder(mimeType){
            var dec         = new ebml.EbmlDecoder()
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
                        if(!initSegment){
                            dec.reset()
                            dec.write(data, function(e){
                                if(e[0]=='start' && e[1].name =='EBML'){
                                    initSegment = true
                                    data = data.slice(e[1].start)
                                }
                            })
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
        self.createMediaElement = function createMediaElement(stream){
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
        self.createMediaEncoder = function createMediaEncoder(stream){
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
            var dec         = new ebml.EbmlDecoder()
            var encoder     = new MediaRecorder(stream,options);
            var initSegment = ''
            var initStart   = -1;
                encoder.ondataavailable = function (e) {
                    e.data.arrayBuffer().then(function(data){
                        data = new Uint8Array(data)
                        var end = data.length
                        dec.reset()
                        dec.write(data, function(e){
                            if(e[0]=='start'){
                                switch(e[1].name){
                                    case 'EBML':
                                        initStart = e[1].start;
                                        break;
                                    case 'Cluster':
                                        var _beg = data.subarray( 0 ,  e[1].start )
                                        var _end = data.subarray( e[1].start      )
                                            if(initStart==0){
                                                _beg = new Uint8Array(0)
                                            }
                                            if(initStart > -1){
                                                initSegment = data.subarray( initStart, e[1].start )
                                                initStart = -1
                                            }
                                        var size = _beg.length + initSegment.length + _end.length   
                                            data = new Uint8Array(size)
                                            data.set(_beg)
                                            data.set(initSegment, _beg.length)
                                            data.set(_end, _beg.length + initSegment.length)
                                        break;
                                }
                                
                            }
                            if(e[1].end == end ){
                                encoder.ondata(data)
                            }
                        })
                    })
    
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
    return self
}())