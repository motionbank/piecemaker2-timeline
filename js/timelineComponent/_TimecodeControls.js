function TimecodeControls( _timelineComponent, _timelineGraph ) {
  this.component        = _timelineComponent;
  this.parentGraph      = _timelineGraph;
  this.el               = $('<div class="timecode-controls"></div>');
  this.background       = $('<div class="timecode-background"></div>');
  this.playheadHandle   = $('<div class="timecode-playhead-handle"></div>');
  this.playheadShadow   = $('<div class="timecode-playhead-shadow"></div>');
  this.positionLabel    = $('<div class="timecode-position-label">00:00:00:000</div>');
  
  this.el.append(this.background, this.playhead, this.positionLabel, this.playheadHandle, this.playheadShadow);
  
  this.labelWidth       = 0;
  this.cursorTimecode   = 0;
  
  
  // time scala
  var r = 60000; // 1 min
  var w = r/GLOBAL.duration * 100;
  var n = GLOBAL.duration/r;
  for (var i = 0; i < n; i++) {
    // var min = doubleDigit(i % 60);
    var t = UTILS_getTimeFormatted( i * r );
    var _w = ( i > n -1 ) ? 100 - i*r / GLOBAL.duration * 100 : w;
    var g = $('<div class="tc-grid-item"></div>').css("width",_w+"%");
    if (t.m==="00") {
      g.html(t.h + ":00").addClass("hour");
    }
    else {
      g.html(":"+t.m);
    }
    this.background.append(g);
  }
  
  
  
  this.isDragged = false;
  
  this.setPlayheadPosition = function ( _p ) {
    this.playheadHandle.css( "left", (_p * 100) + "%" );
  }
  
  this.setupEvents = function () {
    var that = this;
    
    this.background.mousedown(function(event) {
      if (event.which===1) {
        var x = that.component.locX(event.pageX);
        that.updateTimecode( that.parentGraph.mapScreenPosition( x ) );
        that.setDraggingState();
      }
    });
    
    this.el.on({
      // 'mousemove': function (event) {
      //   that.mousemoveHandler(event);
      // }// ,
//       'mouseleave': function (event) {
//         that.mouseleaveHandler(event);
//       }
    });
  }
  
  this.setTimecode = function ( _tc ) {
    // this.positionLabel.text( UTILS_getTimeFormatted( Math.round(_tc) ).total );
  }
  
  this.updateTimecode = function ( _relPos ) {
    GLOBAL.observer.setTimecode( Math.round(_relPos * GLOBAL.duration), this );
  }
  
  this.mouseupHandler = function (event) {
    this.unsetDraggingState();
  }
  
  this.mousemoveHandler = function (event) {
    if (this.labelWidth === 0) {
      this.labelWidth = this.positionLabel.outerWidth();
    }
    var pg = this.parentGraph;
    var ob = GLOBAL.observer;
    var x = UTILS_restrict( this.component.locX(event.pageX), 0, this.component.width );
    var relPos = pg.mapScreenPosition( x );
    var p = relPos;
    
    var absPos = p * this.parentGraph.width;
    var time = "";
    
    // nav dragging
    var cP = absPos + 1;
    var nav = this.component.navigation;
    // slightly ugly
    if ( nav.isDragged && nav.draggingState === "background" ) {
      cP = this.parentGraph.mapScreenPosition( this.component.width/2 );
      cP *= this.parentGraph.width;
      this.cursorTimecode = nav.cursorTimecode;
    }
    else {
      this.cursorTimecode = Math.round( relPos * GLOBAL.duration );
    }
    
    if ( m = ob.selectedMarker) {
      if ( m.draggingState === "background" && m.isPoint ) {
        cP = m.x * this.parentGraph.width;
        this.cursorTimecode = m.start;
      }
    }
    
    time = UTILS_getTimeFormatted( this.cursorTimecode ).total;
    
    if (cP + this.labelWidth - this.parentGraph.position > this.component.width) cP -= this.labelWidth +1;
    
    // time is sometimes different to actual timecode when dragging a marker + pressing shift
    // round value
    this.positionLabel.css( "left", cP ).text( time );
    this.playheadShadow.css( "left", (relPos * 100) + "%" );
    if (this.isDragged) this.updateTimecode( relPos );
  }
  
  this.setDraggingState = function () {
    this.isDragged = true;
    this.parentGraph.component.el.addClass("timecode-handle-dragging");
  }
  
  this.unsetDraggingState = function () {
    this.isDragged = false;
    this.parentGraph.component.el.removeClass("timecode-handle-dragging");
  }
  
  this.setupEvents();
}