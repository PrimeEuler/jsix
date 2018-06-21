

var stream      = require('stream');
var pseudotty   = require('./pseudotty')

function kernel(){
    var device = { 
            '6h/6d': { 
                inode:[ {}, {} ] 
                
            } }

        device['6h/6d'].inode[2]= { 
            Device: '6h/6d',
            Links: 25,
            path : 'root', 
            Permisions: '(0755/drwxr-xr-x)',
            Uid: '(    0/    root)',
            Gid: '(    0/    root)',
            Access: '2018-06-18 17:35:54.750360632',
            Modify: '2018-01-16 08:58:24.361395587',
            Change: '2018-01-16 08:58:24.361395587',
            Birth: '-'

        }
        device['6h/6d'].inode[3]= { 
            Device: '6h/6d',
            Links: 22,
            path : 'root.dev', 
            Permisions: '(0755/drwxr-xr-x)',
            Uid: '(    0/    root)',
            Gid: '(    0/    root)',
            Access: '2018-06-18 17:35:54.750360632',
            Modify: '2018-01-16 08:58:24.361395587',
            Change: '2018-01-16 08:58:24.361395587',
            Birth: '-'

        }
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
        //https://gcc.gnu.org/onlinedocs/gcc-3.0.2/cpp_2.html
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
        root.etc    = {
            shadow:{
                
            },
            passwd:{
                
            }
        }
        root.usr   = {
            lib:{ 
                compiler:{
                    ansn1:'https://www.npmjs.com/package/asn1js'
                },
                include:{
                    asn1:{
                        mib:{   
                            "iso": {
                                "OBJECT IDENTIFIER": {
                                    "::=": [
                                        "root",
                                        1
                                    ]
                                }
                            },
                            "EXPORTS": [
                                [
                                    "internet",
                                    "directory",
                                    "mgmt",
                                    "experimental",
                                    "private",
                                    "enterprises",
                                    "OBJECT-TYPE",
                                    "ObjectName",
                                    "ObjectSyntax",
                                    "SimpleSyntax",
                                    "ApplicationSyntax",
                                    "NetworkAddress",
                                    "IpAddress",
                                    "Counter",
                                    "Gauge",
                                    "TimeTicks",
                                    "Opaque"
                                ]
                            ],
                            "internet": {
                                "OBJECT IDENTIFIER": {
                                    "::=": [
                                        "dod",
                                        1
                                    ]
                                }
                            },
                            "directory": {
                                "OBJECT IDENTIFIER": {
                                    "::=": [
                                        "internet",
                                        1
                                    ]
                                }
                            },
                            "mgmt": {
                                "OBJECT IDENTIFIER": {
                                    "::=": [
                                        "internet",
                                        2
                                    ]
                                }
                            },
                            "experimental": {
                                "OBJECT IDENTIFIER": {
                                    "::=": [
                                        "internet",
                                        3
                                    ]
                                }
                            },
                            "private": {
                                "OBJECT IDENTIFIER": {
                                    "::=": [
                                        "internet",
                                        4
                                    ]
                                }
                            },
                            "enterprises": {
                                "OBJECT IDENTIFIER": {
                                    "::=": [
                                        "private",
                                        1
                                    ]
                                }
                            },
                            "OBJECT-TYPE": {
                                "TYPE NOTATION": {},
                                "VALUE NOTATION": {}
                            },
                            "ObjectName": "OBJECT IDENTIFIER",
                            "ObjectSyntax": {
                                "CHOICE": [
                                    [
                                        "simple",
                                        "SimpleSyntax"
                                    ],
                                    [
                                        "application-wide",
                                        "ApplicationSyntax"
                                    ]
                                ]
                            },
                            "SimpleSyntax": {
                                "CHOICE": [
                                    [
                                        "integer-value",
                                        [
                                            "INTEGER",
                                            {
                                                "min": -2147483648,
                                                "max": 2147483647
                                            }
                                        ]
                                    ],
                                    [
                                        "string-value",
                                        [
                                            "OCTET STRING",
                                            {
                                                "SIZE": {
                                                    "min": 0,
                                                    "max": 65535
                                                }
                                            }
                                        ]
                                    ],
                                    [
                                        "objectID-value",
                                        "OBJECT IDENTIFIER"
                                    ]
                                ]
                            },
                            "ApplicationSyntax": {
                                "CHOICE": [
                                    [
                                        "ipAddress-value",
                                        "IpAddress"
                                    ],
                                    [
                                        "counter-value",
                                        "Counter32"
                                    ],
                                    [
                                        "timeticks-value",
                                        "TimeTicks"
                                    ],
                                    [
                                        "arbitrary-value",
                                        "Opaque"
                                    ],
                                    [
                                        "big-counter-value",
                                        "Counter64"
                                    ],
                                    [
                                        "unsigned-integer-value",
                                        "Unsigned32"
                                    ]
                                ]
                            },
                            "NetworkAddress": {
                                "CHOICE": [
                                    "internet",
                                    "IpAddress"
                                ]
                            },
                            "IpAddress": {
                                "tag": {
                                    "class": "APPLICATION",
                                    "number": 0
                                },
                                "definition": "IMPLICIT",
                                "type": [
                                    "OCTET STRING",
                                    {
                                        "SIZE": 4
                                    }
                                ]
                            },
                            "Counter": {
                                "tag": {
                                    "class": "APPLICATION",
                                    "number": 1
                                },
                                "definition": "IMPLICIT",
                                "type": [
                                    "INTEGER",
                                    {
                                        "min": 0,
                                        "max": 4294967295
                                    }
                                ]
                            },
                            "Gauge": {
                                "tag": {
                                    "class": "APPLICATION",
                                    "number": 2
                                },
                                "definition": "IMPLICIT",
                                "type": [
                                    "INTEGER",
                                    {
                                        "min": 0,
                                        "max": 4294967295
                                    }
                                ]
                            },
                            "TimeTicks": {
                                "tag": {
                                    "class": "APPLICATION",
                                    "number": 3
                                },
                                "definition": "IMPLICIT",
                                "type": [
                                    "INTEGER",
                                    {
                                        "min": 0,
                                        "max": 4294967295
                                    }
                                ]
                            },
                            "Opaque": {
                                "tag": {
                                    "class": "APPLICATION",
                                    "number": 4
                                },
                                "definition": "IMPLICIT",
                                "type": "OCTET STRING"
                            },
                            "DisplayString": {
                                "TEXTUAL-CONVENTION": {
                                    "DISPLAY-HINT": [
                                        "255a"
                                    ],
                                    "STATUS": "current",
                                    "DESCRIPTION": [
                                        "Represents textual information taken from the NVT ASCII",
                                        "character set, as defined in pages 4, 10-11 of RFC 854.",
                                        "",
                                        "To summarize RFC 854, the NVT ASCII repertoire specifies:",
                                        "",
                                        "- the use of character codes 0-127 (decimal)",
                                        "",
                                        "- the graphics characters (32-126) are interpreted as",
                                        "US ASCII",
                                        "",
                                        "- NUL, LF, CR, BEL, BS, HT, VT and FF have the special",
                                        "meanings specified in RFC 854",
                                        "",
                                        "- the other 25 codes have no standard interpretation",
                                        "",
                                        "- the sequence 'CR LF' means newline",
                                        "",
                                        "- the sequence 'CR NUL' means carriage-return",
                                        "",
                                        "- an 'LF' not preceded by a 'CR' means moving to the",
                                        "same column on the next line.",
                                        "",
                                        "- the sequence 'CR x' for any x other than LF or NUL is",
                                        "illegal.  (Note that this also means that a string may",
                                        "end with either 'CR LF' or 'CR NUL', but not with CR.)",
                                        "",
                                        "Any object defined using this syntax may not exceed 255 characters in length."
                                    ],
                                    "SYNTAX": [
                                        "OCTET STRING",
                                        {
                                            "SIZE": {
                                                "min": 0,
                                                "max": 255
                                            }
                                        }
                                    ]
                                }
                            },
                            
                            
                            
                        }
                    },
                }
            }
        }
        root.include = require
        return root
        
}
module.exports = kernel
