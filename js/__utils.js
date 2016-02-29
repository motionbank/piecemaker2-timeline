Array.prototype.getRandom = function () {
  return this[Math.floor(Math.random()*this.length)];
}
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function chance( _percentage ) {
  return ( Math.random()*100 < _percentage ) ? true : false;
}

function message( _text ) {
  $('#message').css("display","block").text(_text);
  setTimeout(function () {
    $('#message').css("display","none");
  }, 1000);
}

String.prototype.toProperCase = function() {
  return this.toLowerCase().replace(/^(.)|\s(.)/g, 
         function($1) { return $1.toUpperCase(); });
}

function UTILS_getTimeFormatted( _mill ) {
  var v = _mill
  var mil = tripleDigit(v % 1000);
  var sec = doubleDigit(Math.floor(v/1000) % 60);
  var min = doubleDigit(Math.floor(v/1000/60) % 60);
  var hou = doubleDigit(Math.floor(v/1000/60/60) % 24);
  
  var time = hou + ":" + min + ":" + sec + ":" + mil;
  
  var obj = {
    total: time,
    ms: mil,
    s: sec,
    m: min,
    h: hou
  };
  
  return obj;
}

// 0 - 1
function UTILS_p( _p ) {
  return (_p*100)+"%";
}

function UTILS_restrict( _p, _min, _max ) {
  return Math.min( Math.max( _p, _min ), _max );
}

function doubleDigit( _n ) {
  return (_n<10) ? "0" + _n : _n.toString();
}

function tripleDigit( _n ) {
  var n = _n.toString();
  if (_n<10) n = "00" + n;
  else if (_n<100) n = "0" + n;
  return n;
}