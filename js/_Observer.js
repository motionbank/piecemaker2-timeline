function Observer( _app ) {
  /*
   *  TODO
   *  implement properties for states and remove them from TimelineGraph etc:
   *    this.markerIsDragged( _which )        // _which = "handle" || "background"
   *    this.navigationIsDragged( _which )    // _which = "handle" || "background"
   *    ...
   */
  
  
  this.app = _app;
  this.timecode = 0;
  this.listeners = new Array();
  this.shiftDown = false;
  this.spaceDown = false;
  this.selectedMarker = null;
  var self = this;
  
  // in milliseconds
  this.setTimecode = function ( _tc, _callee ) {
    // console.log( "TC:", _tc );
    this.timecode = _tc;
    for (var i = 0; i < this.listeners.length; i++) {
      if ( _callee && _callee === this.listeners[i] ) continue;
      this.listeners[i].setTimecode( this.timecode );
    }
  }
  
  this.getTimecode = function () {
    return this.timecode;
  }
  
  this.getTimecodeRel = function () {
    return this.timecode / GLOBAL.duration;
  }
  
  this.selectMarker = function ( _marker ) {
    if (this.selectedMarker) {
      this.unselectMarker();
    }
    this.selectedMarker = _marker;
    _marker.select();
    $('body').addClass("marker-selected");
    
    // ????
    app.displayControls.setMarker( _marker );
  }
  
  this.unselectMarker = function ( _delay ) {
    if (this.selectedMarker) {
      this.selectedMarker.unselect(_delay);
      this.selectedMarker = null;
      $('body').addClass("marker-selected");
    
      // ????
      app.displayControls.unsetMarker();
    }
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
      // i
      case 73: 
        if (m = self.selectedMarker) m.setStart(self.getTimecode());
        break;
      // o
      case 79: 
        if (m = self.selectedMarker) m.setEnd(self.getTimecode());
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