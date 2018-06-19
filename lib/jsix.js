var kernel   = require('./kernel')
function jsix(){
    var self = this
        self.kernel = new kernel()
            
        return self
    
}
var j6 = new kernal()
var device = new j6.dev.ptmx()
var shell =  new j6.dev.stdio({
                allowHalfOpen:false,
                objectMode:true,
                read: function(size) {  },
                write:function(object, encoding, callback) {
                    //loop
                    //stdio.push(object);
                    if(object.key && object.key.name==='linefeed'){
                        try{
                            shell.push( eval( object.text ) )
                        }catch(e){
                            shell.push( e )
                        }
                    }else{
                        
                        //self.stdio.push( object )
                    }
                    
                    
                    callback()
                }
            })
function ls(object){
    return(Object.keys(object))
}
var xterm = process
    xterm.stdin
            .pipe( device.pty )
            .pipe( xterm.stdout )
            
   device.fork( shell )

