

var stream      = require('stream');
var pseudotty   = require('./pseudotty')

function kernal(){
    var self = this;
    
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
    
    
        self.conf   = { }
        self.dev    = {
            pts:[],
            ptmx:function(){
                    var pseudo  = new pseudotty()
                        self.dev.pts.push(pseudo)
                        var index = self.dev.pts.indexOf(pseudo)
                        self.dev.pts[index].tty.on('close',function(){
                            delete self.dev.pts[index]
                        })
                    return pseudo
                },
            stdio:function(options){
                return new stream.Duplex(options)
            },
        }
        self.sys    = {}
        self.h      = {}
        self.lib    = {},
        self.include = require
        return self
        
}
module.exports = kernal