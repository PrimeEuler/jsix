var stream      = require('stream');
var keyboard    = require('keypress');
var ansi        = require('ansi');

Array.prototype.peek = function(){
    return this[this.length -1]
}
String.prototype.splice = function (idx, rem, s) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};
String.prototype.del = function (idx) {
    return (this.slice(0, idx - 1) + this.slice(idx));
};
function ldisc(prompt){
    var options = { 
        text:{
            color:'cyan'
        },
        caret:{
            color:'magenta',
            value: '>'
        },
        prompt:{
            color:'green',
            value: ''
        },
        echo:true,
    } 
    var buffer  = { text:'', cursor:0 }
    var text    = ''
    var cursor  = 0

    var device = new stream.Duplex({
            //objectMode:true,
            read:function(size){
                
            },
            write:function(chunk, encoding, callback){
                self.push(chunk)
                callback(null)
            }
        })
        keyboard( device );

    var self    = new stream.Duplex({
            //objectMode:true,
            read:function(size){
                
            },
            write:function(chunk, encoding, callback){
                device.push(chunk)
                callback(null)
            }
        })
        
        
    //self.device = device;
    self.character = device
    self.device   = new ansi( device , { enabled:true, buffering:true } )   
    self.cache = {}
    self.setPrompt = function(prompt){
        self.prompt = prompt
        if(!self.cache[self.prompt]){
            self.cache[self.prompt] = { history:[], index:0 }
        }
        self.emit('prompt',prompt)
    }
    
    
    self.setPrompt(prompt||'')  ;
    self.echo   = function(){
        self.device 
            .horizontalAbsolute(0)
            .eraseLine()
            .reset()
            .bold()
            [ options.prompt.color ]()
            .write( self.prompt )
            [ options.caret.color ]()
            .write( options.caret.value )
            .reset()
            .flush()
            .buffer()
            [ options.text.color ]()
            .write( text + ' ' )
            .back( text.length + 1  - cursor)
            .reset()
            .flush()
            .buffer()
            
    }
    
    
    device.on('keypress',keypress)
    function keypress(ch, key){
        key = key || {};
        if (key.name == 'escape') return;
        if (key.ctrl && key.shift) {
            switch (key.name) {
              case 'backspace':
                _deleteLineLeft();
                break;
            
              case 'delete':
                _deleteLineRight();
                break;
            }
        }
        else if (key.ctrl) {
            switch (key.name) {
                
                case 'c':
                    self.emit('ctrl-c')
                    break;
                case 'h': // delete left
                    _deleteLeft();
                    break;
                case 'd': // delete right or EOF
                    _deleteRight();
                    break;
                case 'u': // delete the whole line
                    _deleteLine();
                    break;
                case 'k': // delete from current to end of line
                    _deleteLineRight();
                    break;
                case 'a': // go to the start of the line
                    _moveCursor(-Infinity);
                    break;
                case 'e': // go to the end of the line
                    _moveCursor(+Infinity);
                    break;
                case 'b': // back one character
                    _moveCursor(-1);
                    break;
                case 'f': // forward one character
                    _moveCursor(+1);
                    break;
                case 'l': // clear the whole screen
                    break;
                case 'n': // next history item
                    _historyNext();
                    break;
                case 'p': // previous history item
                    _historyPrev();
                    break;
                case 'z':
                    self.emit('ctrl-z')
                    break;
                case 'w': // delete backwards to a word boundary
                case 'backspace':
                    _deleteWordLeft();
                    break;
                case 'delete': // delete forward to a word boundary
                    _deleteWordRight();
                    break;
                case 'left':
                    _wordLeft();
                    break;
                case 'right':
                    _wordRight();
                    break;
                }
        }
        else if (key.meta) {
            switch (key.name) {
                case 'b': // backward word
                    _wordLeft();
                    break;
                case 'f': // forward word
                    _wordRight();
                    break;
                case 'd': // delete forward word
                case 'delete':
                    _deleteWordRight();
                    break;
                case 'backspace': // delete backwards to a word boundary
                    _deleteWordLeft();
                    break;
            }
        }
        else{
            switch(key.name){
                case 'up':
                    _historyNext();
                    break;
                case 'down':
                    _historyPrev();
                    break;
                case 'left':
                    _moveCursor(-1)
                    break;
                case 'right':
                    _moveCursor(+1)
                    break;
                case 'delete':
                    _deleteRight()
                    break;
                case 'backspace':
                    _deleteLeft();
                    break;
                case 'home':
                    _moveCursor(-Infinity);
                    break;
                case 'end':
                    _moveCursor(+Infinity);
                    break;
                case 'insert':
                    break;
                case 'enter':
                    _line();
                    break;
                case 'return':
                    _line();
                    break;
                case 'tab':
                    //_tabComplete( { line : line, cursor: cursor } )
                    break;
                default:
                    if(!ch){
                        if(key.sequence){
                            ch = key.sequence
                        }else
                        {
                            ch=''
                        }
                    }
                    _insertString(ch)
                    break;
            }
        }
        buffer.cursor   = cursor;
        buffer.text     = text;
        buffer.key      = key
        buffer.ch       = ch;
        if(key.name==='return' || key.name==='enter' ){
            buffer.key.name = 'linefeed'
            text='';
            cursor = 0;
            self.cache[self.prompt].index = 0;
        }
       self.emit('character', buffer)
       options.echo?self.echo():null;
        
        
    }
    function _insertString(value) {
        text = text.splice(cursor, 0, value);
        cursor += value.length;
    }
    function _line(){
        var pos = self.cache[self.prompt].history.indexOf(text);
        (pos > -1)?self.cache[self.prompt].history.splice(pos, 1):null;
        self.cache[self.prompt].history.push(text);

    }
    function _moveCursor(dx){
        if(cursor >= 0 &&  cursor <= text.length ){
            cursor+=dx;
        }
        if(cursor < 0 ){ cursor = 0 }
        if(cursor > text.length){ cursor = text.length }
    }
    function _wordLeft(){
        if (cursor > 0) {
            var leading = text.slice(0, cursor);
            var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
            _moveCursor(-match[0].length);
        }
    }
    function _wordRight(){
        if (cursor < text.length) {
            var trailing = text.slice(cursor);
            var match = trailing.match(/^(\s+|\W+|\w+)\s*/);
            _moveCursor(match[0].length);
        }
    }
    function _deleteLeft() {
        if (text.length > 0 && cursor > 0) {
            text = text.del(cursor);
            cursor--;
        }
    }
    function _deleteRight() {
        if (text.length > 0 && cursor >= 0) {
            text = text.del( cursor + 1 );
        }
    }
    function _deleteWordLeft(){
        if (this.cursor > 0) {
            var leading = text.slice(0, cursor);
            var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
            leading = leading.slice(0, leading.length - match[0].length);
            text = leading + text.slice(cursor, text.length);
            cursor = leading.length;
        }
    }
    function _deleteWordRight(){
        if (cursor < text.length) {
            var trailing = text.slice(cursor);
            var match = trailing.match(/^(\s+|\W+|\w+)\s*/);
            text = text.slice(0, cursor) + trailing.slice(match[0].length);
        }
    }
    function _deleteLine(){
        cursor = 0;
        line = '';
    }
    function _deleteLineLeft(){
        line = line.slice(cursor);
        cursor = 0;
    }
    function _deleteLineRight(){
        line = line.slice(0, cursor);
    }
    function _historyNext() {
        if( self.cache[self.prompt].index < 
            self.cache[self.prompt].history.length )
          { self.cache[self.prompt].index ++; }
          
        text =  self.cache[self.prompt].history[ 
                self.cache[self.prompt].history.length - 
                self.cache[self.prompt].index ] || ''
        cursor = text.length;
    }
    function _historyPrev() {
        if( self.cache[self.prompt].index > 0 ){
            self.cache[self.prompt].index --;
            text    = self.cache[self.prompt].history[  
                      self.cache[self.prompt].history.length - 
                      self.cache[self.prompt].index ] || ''
            cursor  = text.length;
        }
    }
    function _tabComplete() {
        self.emit('tab',text)
    }
    return self
 
}
module.exports = ldisc