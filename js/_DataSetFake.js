function DataSetFake( _n ) {
  this.data = new Array();
  
  var maxEnd = 0;
  
  for (var i = 0; i < _n; i++) {
    var d = new DataObjectFake();
    d.generateData( _n, (i===0) ? null : this.data[i-1] );
    this.data.push( d );
    var e = (d.end)/GLOBAL.duration;
    if (maxEnd<e) maxEnd = e;
  }
  
  for (var i = 0; i < this.data.length; i++) {
    this.data[i].adjustData(maxEnd);
  }
  console.log(this.data);
}

function DataObjectFake() {
  
  /* = = = = = = = = = = = = = = = = =
   *  PROPERTIES
   * = = = = = = = = = = = = = = = = = */ 
  
  // milliseconds
  this.start = 0;
  // millisecond
  this.end = 0;
  // string
  this.label = randomText( [1,1,2,2,2,3,3,4,5,6].getRandom() );
  // string
  this.type = markerTypePossibility.getRandom();
    
  
  this.generateData = function ( _num, _lastMarker ) {
    var d = GLOBAL.duration;
    var lEnd = _lastMarker ? (_lastMarker.end)/d : 0;
    var lX = _lastMarker ? _lastMarker.start/d : 0;
    
    var range = 1/_num + Math.random()*0.05;
    var xOff = Math.random()*0.2;
    var x = lEnd;
    if (x > 0) x -= xOff;
    if (x < 0) x = 0;
    if (Math.abs(x - lX) < 0.05) x = lX;
    this.start = Math.round(x * d);
    var length = Math.random()*range + xOff;
    this.end = this.start + Math.round(length * d);
  }
  
  this.adjustData = function ( _max ) {
    var d = GLOBAL.duration;
    var v = _max;
    this.start = Math.round(this.start/v);
    this.end = Math.round(this.end/v);
    // make to point
    if (Math.random()>0.8) {
      this.end = this.start;
    }
  }
}