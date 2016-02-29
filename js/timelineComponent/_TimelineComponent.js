function TimelineComponent( _markerData ) {
  
  this.el                 = $('<div class="timeline-component component"></div>');
  this.slider             = $('<input id="view-port-slider" type="range" min="0" max="0" step="10" value="15000"/>');
  this.graph              = new TimelineGraph(this, _markerData);
  this.markerDetails      = new MarkerDetails(this);
  this.markerContextMenu  = new MarkerContextMenu(this);
  this.navigation         = new TimelineNavigation(this);
  
  this.playheadPosition   = 0;
  this.scrollPosition     = 0;
    
  // append all elements
  this.el.append(this.graph.el, this.markerDetails.el,  this.markerContextMenu.el, this.navigation.el);
  
  this.width              = 0;
  this.widthMax           = 130000;
  this.x                  = null;
  this.y                  = null;
  
  this.isFocused          = false;
  
  this.slider.attr("max", this.widthMax);
  
  
  
  this.init = function () {
    this.graph.init();
  }
  
  this.addMarker = function ( _data ) {
    this.graph.addMarker( _data );
  }
  
  this.setTimecode = function ( _tc, _sender ) {
    this.setPlayheadPosition( _tc / GLOBAL.duration );
    this.graph.setTimecode( _tc, _sender );
  }
  
  this.cachePosition = function () {
    this.x = this.el.offset().left;
    this.y = this.el.offset().top;
  }
  
  // 0 - 1
  this.widthRelToGraph = function () {
    return this.width / this.graph.width;
  }
  
  // absolute
  this.setWidth = function ( _v ) {
    this.width = _v;
    this.el.css("width",_v);
    this.slider.attr("min", _v);
    this.graph.setTransition(false);
    // this.graph.setScrollPosition(this.scrollPosition);
    this.navigation.setHandleWidth( this.graph.width );
    // this.setGraphWidth( this.graph.width );
  }
  
  // absolute
  this.setGraphWidth = function ( _v, _center ) {
    if (_v>0) {
      _v = Math.min(_v,this.widthMax);
      this.graph.setWidth(_v);
      this.navigation.setHandleWidth(_v, _center);
    }
  }
  
  // 0 - 1
  this.setPlayheadPosition = function ( _p ) {
    this.playheadPosition = _p;
    this.graph.setPlayheadPosition( _p );
    this.navigation.setPlayheadPosition( _p );
  }
  
  // 0 - 1
  this.scrollDelta = function ( _d, _doTransition ) {
    this.setScrollPosition( this.scrollPosition + _d, _doTransition );
  }
  
  // 0 - 1
  this.setScrollPosition = function ( _p, _doTransition, _align ) {
    var w = this.graph.absToRel(this.width);
    if ( _align === "center" ) _p -= w/2;
    if ( _align === "right" ) _p -= w;
    
    this.graph.setTransition( _doTransition );
    
    // new pos should not exceed bounds
    _p = UTILS_restrict(_p,0,1-w);
    this.scrollPosition = _p;
    this.graph.setScrollPosition( _p );
    this.navigation.setHandlePosition( _p );
  }
  
  this.focus = function () {
    this.isFocused = true;
    this.el.addClass("is-focused");
  }
  
  this.unfocus = function () {
    this.isFocused = false;
    this.el.removeClass("is-focused");
  }
  
  // set position from video player?
  
  // this.setPosition = function ( _p ) {
  //   this.graph.setPosition(_p);
  //   this.navigation.setPosition(_p);
  // }
  
  this.setupEvents = function () {
    var that = this;
    
    this.slider.on({
      "input change": function (event) {
        var v = that.slider.val();
        that.setGraphWidth( v, true );
      },
      "change": function (event) {
        that.graph.alignMarkers();
      },
      "mousedown": function (event) {
        that.el.addClass("slider-dragging");
      }
    });
    this.el.on({
      // 'mousemove': function (event) {
      //   that.mousemoveHandler(event);
      // },
      "contextmenu": function (event) {
        event.preventDefault();
      },
      'mouseenter': function (event) {
        that.mouseenterHandler(event);
      },
      'mouseleave': function (event) {
        that.mouseleaveHandler(event);
      }// ,
//       'mousedown': function (event) {
//         that.graph.mousedownHandler(event);
//         console.log(event.offsetX);
//       }
    });
  }
  
  // marker
  this.markerEvent = function (_marker, event) {
    if (event.type === "mouseenter") {
      if (!_marker.hasContextAttached) this.markerDetails.focusOn(_marker, event);
      else this.markerDetails.hide();
    }
    if (event.type === "mousemove") {
      var pos = event.pageX;    
      this.markerDetails.updatePositionX( pos );
    }
    if (event.type === "mouseleave") {
      this.markerDetails.hide();
    }
    if (event.type === "mouseup") {
    }
    if (event.type === "mousedown") {
      if (event.which === 3) { // right click
        this.markerDetails.hide()
      }
    }
  }
    
  // too many times called
  // this.markerUpdateHandler = function ( _marker ) {
  //   this.markerDetails.updateText();
  // }
  
  this.mousedownHandler = function (event) {
    this.graph.mousedownHandler(event);
  }
  
  this.mouseenterHandler = function (event) {
    this.focus();
  }
  
  this.clickHandler = function (event) {
    this.graph.clickHandler(event);
  }
  
  this.mousemoveHandler = function (event) {
    this.navigation.mousemoveHandler(event);
    this.graph.mousemoveHandler(event);
  }
  
  this.mouseleaveHandler = function (event) {
    this.graph.mouseleaveHandler(event);
    this.unfocus();
  }
  
  this.mouseupHandler = function (event) {
    this.graph.mouseupHandler(event);
    if (this.navigation.isDragged) {
      this.graph.alignMarkers();
    }
    this.navigation.mouseupHandler(event);
    this.el.removeClass("slider-dragging");
  }
  
  this.keydownHandler = function (event) {
    this.graph.keydownHandler(event);
  }
  
  this.keyupHandler = function (event) {
    this.graph.keyupHandler(event);
  }
  
  this.resizeEndHandler = function () {
    this.graph.resizeEndHandler();
  }
  
  
  
  // _x => 0 - 1
  this.checkIfPointOnScreen = function ( _x ) {
    return ( _x > this.scrollPosition && _x < this.scrollPosition + this.graph.absToRel( this.width ) );
  }
  
  // 0 - 1
  this.checkIfRangeOnScreen = function ( _s, _e ) {
    var s = this.graph.positionToScreen( _s );
    var e = this.graph.positionToScreen( _e );
    return ( s >= 0 && s <= this.width || e >= 0 && e <= this.width || s <= 0 && e >= this.width );
  }
  
  // 0 - 1
  this.ifNotOnScreenThenScrollTo = function( _p, _doTransition, _align ) {
    // _align = _align || "left";
    // _doTransition = (_doTransition===undefined) ? false : _doTransition;
    
    // _align === "left"
    var off = 0;
    
    // if (_align==="center") off = this.graph.absToRel( this.width/2 );
    // if (_align==="right") off = this.graph.absToRel( this.width );
    
    // var p = UTILS_restrict( _p - off, 0, this.graph.absToRel( this.graph.width - this.width/2 ) );
            
    if ( !this.checkIfPointOnScreen( _p ) ) {
      // if (_doTransition) this.graph.setTransition(true);
      // else this.graph.setTransition(false);
      this.setScrollPosition( _p, _doTransition, _align );
    }
  }
  
  // pass document pageX
  this.locX = function ( _x ) {
    return _x - this.x;
  }
  
  this.locY = function ( _y ) {
    return _y - this.y;
  }
  
  this.setupEvents();
}