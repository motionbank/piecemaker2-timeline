function TimelineGraph( _timelineComponent, _markerData ) {
  
  /*
  TODO
  - check if dragMarker, undragMarker and markerIsDragged are really needed.
  - smalles timestep needed?
  - fix: app.displayControls.setMarker( _marker ); 
    global marker selection? like GLOBAL.observer.setTimecode()?
  */
  
  this.component              = _timelineComponent;
  this.markers                = new Array();
  this.el                     = $('<div class="timeline-graph transition"></div>');
  this.markerContainer        = $('<div class="marker-container"></div>');
  this.cursor                 = $('<div class="graph-cursor"><div class="pointer"></div></div>');
  this.playhead               = $('<div class="graph-playhead"></div>');
  this.background             = $('<div class="graph-background"></div>');
  this.timecodeControls       = new TimecodeControls(this.component, this);
  
  // append all elements
  this.el.append( 
    this.background, 
    this.markerContainer, 
    this.cursor, 
    this.timecodeControls.el, 
    this.playhead
  );
  
  this.rows                   = 0;
  
  // this.selectedMarker         = null;
  this.markerIsDragged        = false;
  this.isFocused              = false;
  this.markerHasChanged       = true;
  this.hasTransition          = true; // has to be true on start because of this.setTransition() TODO fix
  // this.positionHasChanged     = false;
  
  this.mode_focusOverlapping  = false;
  this.mode_showMarkerLabels  = true;
  
  this.width                  = 0;
  this.widthCached            = 0;
  this.position               = 0;
  this.cursorPosition         = 0;
  this.playheadPosition       = 0;
  this.impactPosition         = 0;
  
  this.settings               = { reverseScroll: true, snapToPlayhead: true };
  
  
  // marker data
  _markerData = _markerData || [];
  
  for (var i = 0; i < _markerData.length; i++) {
    // this.addMarker( _markerData[i] );
    var m = new Marker(this.component, this, i, _markerData[i] );
    this.markers.push( m );
    this.markerContainer.append( m.el );
  }
  
  
  this.init = function () {
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].init();
    }
    this.alignMarkers();
  }
  
  this.deleteMarker = function ( _marker ) {
    this.markers.splice(this.markers.indexOf(_marker), 1);
    this.alignMarkers();
  }
  
  this.addMarker = function ( _data ) {
    var m = new Marker(this.component, this, this.markers.length, _data );
    this.markers.push( m );
    this.markerContainer.append( m.el );
    GLOBAL.observer.selectMarker(m);
    m.init();
    m.updateOriginalData();
    this.alignMarkers();
    
    console.log("GRAPH: new marker added", m);
  }
  
  /*
      GET & SET
  */
  
  this.setTimecode = function ( _tc ) {
    this.timecodeControls.setTimecode( _tc );
  }
  
  this.focus = function () {
    this.isFocused = true;
    this.el.addClass("is-focused");
  }
  
  this.unfocus = function () {
    this.isFocused = false;
    this.el.removeClass("is-focused");
  }
  
  this.openContextMenu = function ( _marker, event ) {
    if (this.component.markerContextMenu.isOpen) this.closeContextMenu();
    this.component.el.addClass("marker-context-open");
    GLOBAL.observer.selectMarker(_marker);
    this.component.markerContextMenu.open(_marker, event);
  }
  
  this.closeContextMenu = function () {
    if (this.component.markerContextMenu.isOpen) {
      this.component.el.removeClass("marker-context-open");
      this.component.markerContextMenu.close();
    }
  }
  
  // this.selectMarker = function ( _marker ) {
  //   if (this.selectedMarker) {
  //     this.unselectMarker();
  //   }
  //   this.selectedMarker = _marker;
  //   _marker.select();
  //   this.el.addClass("marker-selected");
  //
  //   // ????
  //   app.displayControls.setMarker( _marker );
  // }
  //
  // this.unselectMarker = function ( _delay ) {
  //   if (this.selectedMarker) {
  //     this.selectedMarker.unselect(_delay);
  //     this.selectedMarker = null;
  //     this.el.removeClass("marker-selected");
  //
  //     // ????
  //     app.displayControls.unsetMarker();
  //   }
  // }
  
  this.dragMarker = function () {
    this.closeContextMenu();
    this.markerIsDragged = true;
  }
  
  this.undragMarker = function (event) {
    this.markerIsDragged = false;
  }
  
  this.setWidth = function ( _v ) {
    console.log("GRAPH: set width");
    this.el.css("width",_v);
    this.width = parseInt(_v);
    // for (var i = 0; i < this.markers.length; i++) {
    //   this.markers[i].graphResizeEndHandler();
    // }
  }
  
  this.getMarker = function( _id ) {
    for (var i = 0; i < this.markers.length; i++) {
      var m = this.markers[i];
      if (m.id === _id) {
        return m;
      }
    }
  }
  
  this.setScrollPosition = function ( _p ) {
    // _p is between 0 and 1
    // var p = _p * this.width;
    this.position = _p * this.width;
    this.el.css("margin-left", UTILS_p(this.position/this.component.width * -1));
    // this.positionHasChanged = true;
    for (var i = 0; i < this.markers.length; i++) {
      var m = this.markers[i];
      m.checkIfOnScreen();
      m.adjustLabelToScreen();
    }
  }
  
  this.getCursorPosition = function () {
    return this.cursorPosition;
  }
  
  this.scrollXRel = function () {
    return this.position/this.width;
  }
  
  this.viewPortWidthRel = function () {
    return this.component.width/this.width;
  }
  
  this.setCursorPosition = function ( _p ) {
    var absP = _p * this.width;
    this.cursorPosition = _p;
    this.cursor.css( "left", absP );
  }
  
  this.setPlayheadPosition = function ( _p ) {
    this.timecodeControls.setPlayheadPosition( _p );
    this.playheadPosition = _p;
    this.playhead.css( "left", (this.playheadPosition * 100) + "%" );
  }
  
  // _p => 0 - 1; _s => px
  // snap: dist to playhead < _s
  this.snapToPlayhead = function ( _p, _s, _off ) {
    var p = _p;
    _off = _off || 0;
    if ( this.settings.snapToPlayhead && Math.abs( p + _off - this.playheadPosition ) * this.width < _s) {
      p = this.playheadPosition - _off;
    }
    return p;
  }

  this.checkMarkers = function () {
    if (this.markerHasChanged) {
      this.markerHasChanged = false;
      this.alignMarkers();
    }
  }
  
  /*
      ARRANGING MARKERS
  */
  
  // sort according to visual bounds not to data
  this.sortMarkers = function () {
    console.log("GRAPH: sorting markers");
    this.markers.sort(function (_a,_b) {
      var d = _a.getBounds().left - _b.getBounds().left
      if (d===0) d = _a.id - _b.id;
      return d;
    });
  }
  
  this.alignMarkers = function () {
    console.log("GRAPH: align markers");
    this.sortMarkers();
    
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].row = 0;
      this.markers[i].checkWidth();
    }
    for (var i = 0; i < this.markers.length; i++) {
      var m = this.markers[i];
      if (m.isVisible()) m.align();
    }
  }
  
  this.getEmptyRow = function ( _marker ) {
    // _marker is this
    var row = 0;
    var changed = true;
    var runs = 0;
    
    while (changed) {
      changed = false;
      runs++;
      
      for (var i = 0; i < this.markers.length; i++) {
        // m is target
        var m = this.markers[i];
        var bThis = _marker.getBounds();
        var bTarget = m.getBounds();
        
        if ( bTarget.left <= bThis.left && m.id !== _marker.id ) {
          // both visible and same row
          if ( _marker.isVisible() && m.isVisible() && m.row === row ) {
            // end target > start this
            if ( bTarget.right + this.absToRel(1) > bThis.left ) {
              row++;
              changed = true;
            }
          }
        }
        else {
          break;
        }
      }
    }
    return row;
  }
  
  
  /*
      EVENTS
  */
  
  // markers
  // sent from markers to parent timeline
  this.markerEvent = function (_marker, event) {
    this.component.markerEvent(_marker, event);
    if (event.type === "mouseenter") {
    }
    if (event.type === "mousemove") {
    }
    if (event.type === "mouseleave") {
    }
    if (event.type === "mouseup") {
    }
    if (event.type === "mousedown") {
      if (event.which === 3) { // right click
        this.openContextMenu( _marker, event );
        // this.component.markerContextMenu.mousedownHandler(event);
      }
    }
  }
  
  this.setupEvents = function () {
    var that = this;
    this.background.mousedown(function(event) {
      // console.log("GRAPH: local background mouse down");
      that.impactPosition = that.component.locX(event.pageX) + that.position;
      that.setDraggingState();
      GLOBAL.observer.unselectMarker();
      that.closeContextMenu();
    });
    this.el.on({
      'mousemove': function (event) {
        if (!that.component.navigation.isDragged) {
          var absPos = that.component.locX( event.pageX );
          var relPos = that.mapScreenPosition(absPos);
          that.focusOverlapping( relPos );
        
          for (var i = 0; i < that.markers.length; i++) {
            that.markers[i].adjustLabelToMouse(absPos);
          }
        }  
      },
      'mouseenter': function (event) {
        that.focus();
      },
      'mouseleave': function (event) {
        that.mouseleaveHandler(event);
        that.unfocus();
      },
      'mousewheel': function (event) {
        var d = (Math.abs(event.deltaX) > Math.abs(event.deltaY)) ? event.deltaX : event.deltaY;
        d = d/that.width * event.deltaFactor;
        if (that.settings.reverseScroll) d *= -1;
        that.component.scrollDelta( d );
      }
    });
  }
  
  // called in component.markerContextMenu
  // CUSTOM EVENT ???
  this.afterContextActionHandler = function () {
    this.checkMarkers();
    this.closeContextMenu();
  }
  
  // called in Marker
  // CUSTOM EVENT ???
  this.markerChangeHandler = function ( _marker ) {
    this.markerHasChanged = true;
  }
  
  this.mousedownHandler = function (event) {
    // console.log("GRAPH: global mouse down");
    if (GLOBAL.observer.selectedMarker) {
      if (!GLOBAL.observer.selectedMarker.isHovered && !this.component.markerContextMenu.isFocused) {
        // this.unselectMarker();
        this.closeContextMenu();
      }
    }
    else {
      this.closeContextMenu();
    }
  }
  
  // global
  this.mouseupHandler = function (event) {
    
    if (this.isDragged) {
      this.unsetDraggingState();
    }
    
    if (m = GLOBAL.observer.selectedMarker) {
      this.checkMarkers();
      if (this.markerIsDragged) {
        m.mouseupHandler(event);
        this.undragMarker(event);
      }
    }
    
    // TODO implementation
    // check if resize has happened
    if (this.widthCached !== this.width) {
      this.widthCached = this.width;
      this.resizeEndHandler();
    }
    
    this.timecodeControls.mouseupHandler(event);
  }
  
  // this timeline global
  this.mousemoveHandler = function (event) {
    var x = this.component.locX( event.pageX );
    var relPos = this.mapScreenPosition( x );

    var cP = relPos;
    var nav = this.component.navigation;
    
    // center in the middle of the screen while dragging the nav bar
    if (nav.isDragged && nav.draggingState === "background") {
      cP = this.mapScreenPosition( this.component.width/2 );
    }

    if (m = GLOBAL.observer.selectedMarker) {
      m.mousemoveHandler(event);
      
      if ( m.draggingState === "background" && m.isPoint ) {
        cP = m.x;
        this.cursorTimecode = m.start;
      }
    }
    
    this.setCursorPosition( cP );
    
    if (this.isDragged) {
      var p = UTILS_restrict(this.impactPosition - x, 0, this.width - this.component.width);
      this.component.setScrollPosition( p / this.width );
    }
    
    this.timecodeControls.mousemoveHandler(event);
  }
  
  this.clickHandler = function (event) {
  }
  
  this.mouseleaveHandler = function (event) {
    this.cleanStates();
  }
  
  this.resizeEndHandler = function () {
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].graphResizeEndHandler();
    }
    this.alignMarkers();
  }
  

  /*
      MODES
  */
  
  this.toggleMode = function ( _mode ) {
    // check if found?
    this[_mode] = !this[_mode];
    this.cleanStates();
  }
  
  this.enableMode = function ( _mode ) {
    // check if found?
    this[_mode] = true;
    this.cleanStates();
  }
  
  this.disableMode = function ( _mode ) {
    // check if found?
    this[_mode] = false;
    this.cleanStates();
  }
  
  
  /*
      STATES
  */
  
  this.cleanStates = function () {
    
    this.unfocusMarkers();
    
    if (this.mode_showMarkerLabels) this.el.removeClass("hide-labels");
    else this.el.addClass("hide-labels");
  }
  
  this.unfocusMarkers = function () {
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].unfocus();
    }
  }
  
  this.setTransition = function ( _bool ) {
    // do i need this?
    // _bool = (typeof _bool === "boolean" ) ? _bool : false;
    
    if ( _bool && !this.hasTransition )     this.el.addClass("transition");
    else if (!_bool && this.hasTransition ) this.el.removeClass("transition");
    this.hasTransition = _bool;
  }
  
  this.setDraggingState = function () {
    this.isDragged = true;
    this.el.addClass("is-dragged");
    this.component.el.addClass("graph-dragging");
  }
  
  this.unsetDraggingState = function () {
    this.isDragged = false;
    this.el.removeClass("is-dragged");
    this.component.el.removeClass("graph-dragging");
  }
  
  // this.checkMarkerOnScreen = function () {
  //   for (var i = 0; i < this.markers.length; i++) {
  //     this.markers[i].checkIfOnScreen();
  //   }
  // }
  
  this.focusOverlapping = function ( _x ) {
    // _x === mouse position (pixel)
    if (this.mode_focusOverlapping) {
      // only if ther is no selected marker
      if (true) {
        var x = _x;

        for (var i = 0; i < this.markers.length; i++) {
          var m = this.markers[i];
          var bounds = m.getBounds();
          if (m.isVisible() && bounds.left < x && bounds.right > x) {
            m.focus();
          }
          else m.unfocus();
        }
      }
      else this.unfocusMarkers();
    }
  }
  
  /*
      UTILS
  */
  
  this.mapScreenPosition = function ( _pageX ) {
    return this.absToRel( _pageX + this.position );
  }
  
  this.relToAbs = function ( _rel ) {
    return _rel * this.width;
  }
  
  this.absToRel = function ( _pixel ) {
    return _pixel / this.width;
  }
  
  this.positionToScreen = function ( _tPos ) {
    var p = this.relToAbs(_tPos);
    return p - this.position;
  }
  
  this.setupEvents();
}