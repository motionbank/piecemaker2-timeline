function Observer( _app ) {
  this.app = _app;
  this.timecode = 0;
  this.listeners = new Array();
  this.shiftDown = false;
  this.spaceDown = false;
  
  // in milliseconds
  this.setTimecode = function ( _tc, _sender ) {
    // console.log( "TC:", _tc );
    this.timecode = _tc;
    for (var i = 0; i < this.listeners.length; i++) {
      this.listeners[i].setTimecode( this.timecode, _sender );
    }
  }
  
  this.getTimecode = function () {
    return this.timecode;
  }
  
  this.getTimecodeRel = function () {
    return this.timecode / GLOBAL.duration;
  }
  
  this.toggleMarkerVisibility = function ( _markerClass ) {
    $('.marker.type-' + _markerClass ).toggleClass("is-visible");
    this.app.timeline.graph.alignMarkers();
  }
  
  // _l has to have a function setTimecode()
  this.addListener = function ( _l ) {
    this.listeners.push(_l);
  }
  
  this.keydownHandler = function (event) {
    // console.log(event.which);
    if (event.shiftKey) {
      this.shiftDown = true;
      $("body").addClass("key-shift-down");
    }
    switch (event.which) {
      // space
      case 32: 
        this.spaceDown = true;
        $("body").addClass("key-space-down");
      break;
      
    }
  }
  
  this.keyupHandler = function (event) {
    console.log(event);
    
    // shift keyup returns event.shiftKey false. 
    if (this.shiftDown) {
      this.shiftDown = false;
      $("body").removeClass("key-shift-down");
    }
    
    switch (event.which) {
      // space
      case 32: 
        this.spaceDown = false;
        $("body").removeClass("key-space-down");
      break;
      
    }
    // if (this.shiftDown) {
    //   this.shiftDown = false;
    //   $("body").removeClass("key-shift-down");
    // }
    // if (this.spaceDown) {
    //   this.spaceDown = false
    //   $("body").removeClass("key-space-down");
    // }
  }
}