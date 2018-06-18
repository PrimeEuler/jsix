var stream      = require('stream');
var uuidV4      = require('uuid/v4');
var ldisc       = require('./ldisc');
var util        = require('util');
//Pseudo-terminal 
function pseudotty(){
    var self = this
        self.child = false
        self.mother = false
        self.ldisc = new ldisc()
        self.isRaw  = true
        self.setRawMode = function(value) {
            //character mode
            self.isRaw = !!value;
        };
    var ioctl  = {
        TIOCSWINSZ:function(){
            
        },
        TIOCSTI:function(){
            
        }
    }
    /*
    http://man7.org/linux/man-pages/man7/pty.7.html
    
            /dev/ptyp1 and /dev/ttyp1 
            constitute a BSD pseudoterminal pair.
    
           /dev/pty[p-za-e][0-9a-f]
                  BSD master devices
    
           /dev/tty[p-za-e][0-9a-f]
                  BSD slave devices
    */



    var slave  = new stream.Duplex({
        allowHalfOpen:false,
        objectMode:true,
        read: function(size) {  },
        write:function(chunk, encoding, callback) {
            self.isRaw ? 
            master.push(chunk) :
            self.ldisc.device
                .write(  '\r\n' + util.inspect( chunk ,false, 10, true ) + '\r\n'  )
                .flush()
                .buffer();
            
            callback()
        }
    })
        slave.setTTYMode = function(value) {
            slave.isTTY = !!value;
            if(slave.isTTY){
                slave.columns  = 80
                slave.rows = 24
            }
              
        };
        slave.setMouseMode = function(value) {
              slave.isMouse = !!value;
              if(slave.isMouse){
                master.push('\x1b[?1000h')
              }else{
                master.push('\x1b[?1000l');
              }
              
        };
        slave.setSize = function(size){
            slave.columns  = size.columns
            slave.rows     = size.rows
            slave.emit('resize')
        }
        
        
    var master = new stream.Duplex({
        allowHalfOpen:false,
        read: function(size) {  },
        write:function(chunk, encoding, callback) {
            self.isRaw ? 
            slave.push(chunk) : 
            self.ldisc.character.push(chunk);
            callback()
        }
    })
        master.id = uuidV4()
        master.on('pipe',function(input){
                self.mother.stdin = input
                var kill    = function(){};
                if(input===process.stdin){
                    self.mother = process
                    process.stdout.on('resize',function(){
                        slave.setSize(process.stdout)
                    })
                    kill = process.exit
                }else{
                    //character mode
                    input.setRawMode = function(value) {
                          input.isRaw = !!value;
                    };
                }
                //set line discepline to raw
                input.setRawMode(true);
                input.isTTY = true;
                
                self.setRawMode(false);
                slave.setTTYMode(true);
                self.ldisc.echo()
                
                master.exit = function(){
                    self.ldisc.end()
                    slave.end()
                    master.end();
                    input.setRawMode(false);
                    input.end();
                    kill();
                };
            })
        master.on('close',function(){
             slave.destroy()
             //ldisc.end()
        })

        slave.id =master.id
        slave.setTTYMode(true)
        slave.setMouseMode(false)
        
        /*
        With no arguments, ldattach prints usage information.  
        
        LINE DISCIPLINES
        Depending on the kernel release, the following line disciplines are supported:
        TTY(0)
        The default line discipline, providing transparent operation (raw mode) 
        as well as the habitual terminal line editing capabilities (cooked mode).
                
        */
        
        
        
        //Line discapline
        self.ldisc.on('linefeed',function(object){
            slave.push(object)
        })
        self.ldisc.on('character',function(object){
            slave.push(object)
        })
        self.ldisc.on('ctrl-c',function(){
            master.exit()
        })
        self.ldisc.on('data',function(data){
            master.push(data)
        })
        
        //Pseudo-devices
        self.pty    = master
        self.tty    = slave
        /*
        +   Implements ptyFork(), a function that creates a child process connected to
        +   the parent (i.e., the calling process) via a pseudoterminal (pty). The child
        +   is placed in a new session, with the pty slave as its controlling terminal,
        +   and its standard input, output, and error connected to the pty slave.
        */
        self.fork = function(input,output){
            self.child = {i:input, o:output}
            if(input.readable && input.writable){
                self.child = input;
                slave
                    .pipe(self.child)
                    .pipe(slave)
                self.child.on('close',function(){
                    self.child = false
                    slave.resume()
                })
            }else{
                slave.pipe(input)
                output.pipe(slave,{ end:false })
                output.on('close',function(){
                    self.child = false
                    slave.resume()
                })
            }
            
        }
        

        return self
}
module.exports   = pseudotty;