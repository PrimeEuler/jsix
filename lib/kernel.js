

var stream      = require('stream');
var pseudotty   = require('./pseudotty')

function kernel(){
    var root = this;
    
        /*
        Kernel – source code in /usr/sys, composed of several sub-components:
            * conf – configuration and machine-dependent parts, including boot code
            * dev  – device drivers for control of hardware (and some pseudo-hardware)
            * sys  – operating system "kernel", handling memory management, process 
                     scheduling, system calls, etc.
            * h    – header files, defining key structures within the system and 
                     important system-specific invariables
        
        Development environment - 
            * lib – object-code libraries (installed in /lib or /usr/lib). libc, 
                    the system library with C run-time support, was the primary library, 
                    but there have always been additional libraries for such things 
                    as mathematical functions (libm) or database access. V7 Unix 
                    introduced the first version of the modern "Standard I/O" library 
                    stdio as part of the system library. Later implementations increased 
                    the number of libraries significantly.
        
        */
    
    
        root.conf   = { }
        root.dev    = {
            pts:[],
            shell:[]
        }
        root.sys    = {}
        root.h      = {
            stdio : {
                read:'function',
                write:'function',
                objectMode:'boolean'
            }
        }
        root.lib    = {},
        root.bin    = {
            ptmx:function(){
                    var pseudo  = new pseudotty()
                        root.dev.pts.push(pseudo) -1
                    var index = root.dev.pts.indexOf(pseudo)  
                        root.dev.pts[index].tty.on('close',function(){
                            delete root.dev.pts[index]
                        })
                    return pseudo
                },
            stdio:function(options){
                return new stream.Duplex(options)
            },
            sheldon : function(){
                var shell =  new root.bin.stdio({
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
                    root.dev.shell.push(shell)
                var index = root.dev.shell.indexOf(shell)  
                    root.dev.shell[ index ].on('close',function(){
                            delete root.dev.shell[index]
                        })
                var ls = root.bin.ls
                
                return root.dev.shell[ index ]
                
            },
            ls : Object.keys,
            typeof:function(object){
                return typeof(object)
            },
            eval : eval,
            
        }
        root.include = require
        return root
        
}
module.exports = kernel
