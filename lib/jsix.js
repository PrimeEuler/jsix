var kernel  = require('./kernel')
var root    = new kernel()
var device  = new root.bin.ptmx()
var shell   = new root.bin.sheldon()
var xterm   = process

    xterm.stdin
            .pipe( device.pty )
            .pipe( xterm.stdout )
            
    root.dev.pts[0].fork( shell )

