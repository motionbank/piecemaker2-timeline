function TimelineNavigation( _timelineComponent ) {
  this.component            = _timelineComponent;
  this.el                   = $('<div class="timeline-navigation"></div>');
  this.background           = $('<div class="navigation-background"></div>');
  this.handle               = $('<div class="navigation-bar"></div>');
  this.handleBackground     = $('<div class="navigation-bar-background"></div>');
  this.handleLeft           = $('<div class="navigation-handle handle-left"><div class="handle-pointer"></div></div>');
  this.handleRight          = $('<div class="navigation-handle handle-right"><div class="handle-pointer"></div></div>');
  this.playhead             = $('<div class="navigation-playhead"></div>');
  this.positionLabel        = $('<div class="navigation-position-label">00:00:00:000</div>');
  this.cursor               = $('<div class="navigation-cursor"></div>');
  
  this.handle.append(this.handleBackground, this.handleLeft, this.handleRight);
  
  // append all elements
  this.el.append(this.background, this.handle, this.playhead, this.positionLabel, this.cursor);
  
  this.handlePosition       = 0;
  
  // 0 - 1
  this.handleWidth          = 0;
  this.playheadPosition     = 0;
  this.cursorPosition       = 0;
  this.cursorTimecode       = 0;
  this.impactPosition       = 0;
  
  this.labelWidth           = 0;
                            
  this.isFocused            = false;
  this.isDragged            = false;
  this.draggingState        = null;
  
  this.draggingFunction     = null;
  
  
  this.focus = function () {
    this.isFocused = true;
    this.el.addClass("is-focused");
  }
  
  this.unfocus = function () {
    this.isFocused = false;
    this.el.removeClass("is-focused");
  }
  
  // this.getRelPositionOnHandle = function () {
  //   return (this.cursorPosition - this.handlePosition) / this.handleWidth;
  // }
  
  // scale scroll position relative to playhead position? how?
  this.setHandleWidth = function ( _v, _center ) {
    // var w = this.component.width;
    var newWidth = _v;
    var off = _center ? (newWidth - this.handleWidth)/2 : 0;
    this.handleWidth = newWidth;
    var pos = this.restrictPosition( this.handlePosition - off );
    this.setScrollPosition( pos );
  }
  
  this.setPlayheadPosition = function ( _p ) {
    this.playheadPosition = _p;
    this.playhead.css("left", UTILS.percent(_p));
  }
  
  this.setScrollPosition = function ( _p ) {
    this.component.setScrollPosition( _p );
  }
  
  // is called from TimelineComponent
  // TimelineComponent can synchronize navigation and graph
  this.setHandlePosition = function ( _p, _center ) {
    this.handlePosition = _p;
    this.updateHandle();
  }
  
  this.setupEvents = function () {
    var that = this;
    this.background.mousedown(function(event) {
      event.preventDefault();
      that.impactPosition = that.handleWidth/2;
      that.setDraggingState("background");
      that.draggingFunction = that.observeBackground;
      that.mousemoveHandler(event);
      return false;
    });
    this.handleRight.mousedown(function(event) {
      event.preventDefault();
      // that.impactPosition = event.pageX - that.handlePosition;
      that.handleRight.addClass("is-dragged");
      that.setDraggingState("handle");
      that.draggingFunction = that.observeHandleRight;
      that.mousemoveHandler(event);
      return false;
    });
    this.handleLeft.mousedown(function(event) {
      event.preventDefault();
      that.impactPosition = that.handlePosition + that.handleWidth;
      that.handleLeft.addClass("is-dragged");
      that.setDraggingState("handle");
      that.draggingFunction = that.observeHandleLeft;
      that.mousemoveHandler(event);
      return false;
    });
    this.el.on({
      'mouseenter': function (event) {
        that.focus();
      },
      'mouseleave': function (event) {
        that.unfocus();
      },
      'mousedown': function (event) {
        // that.mousemoveHandler(event);
        that.updateLabel( that.component.locX(event.pageX) );
      }
    });
    this.handleBackground.mousedown(function(event) {
      var x = that.component.locX(event.pageX);
      that.impactPosition = x/that.component.width - that.handlePosition;
      that.setDraggingState("background");
      that.draggingFunction = that.observeBackground;
      that.mousemoveHandler(event);
    });
  }
  
  this.observeBackground = function (event) {
    var cw = this.component.width;
    var x = this.component.locX(event.pageX);
    var p = this.restrictPosition( x/cw - this.impactPosition );
    this.setScrollPosition( p );
  }
  
  // right handle dragged
  this.observeHandleRight = function (event) {
    var x = this.component.locX( event.pageX );
    var cw = this.component.width;
    var relX = Math.min(x/cw,1);
    var pos = Math.max(relX, 0);
    var w = Math.max(relX - this.handlePosition, 0);
    var m = this.component.widthMax;
    console.log(cw/(w*m) * m);
    this.component.setGraphWidth( cw/(w*m) * m );
  }
  
  // left handle dragged
  this.observeHandleLeft = function (event) {
    var x = Math.max(this.component.locX( event.pageX ), 0 );
    var cw = this.component.width;
    var relX = x/cw;
    var wMin = cw/this.component.widthMax;
    var pMax = (this.impactPosition - wMin);
    var p = Math.min(relX, pMax );
    var w = Math.max(this.impactPosition - relX, wMin);
    var m = this.component.widthMax;
    this.component.setGraphWidth( cw/(w*m) * m );
    this.component.setScrollPosition( p );
  }
  
  this.mousemoveHandler = function (event) {
    var x = this.component.locX( event.pageX );
    if (this.isDragged && this.draggingFunction) {
      this.draggingFunction(event);
    }
    this.updateLabel( x );
  }
  
  this.mouseupHandler = function (event) {
    this.unsetDraggingState();
    this.updateLabel( event.pageX );
  }
  
  this.restrictPosition = function ( _p ) {
    return UTILS.restrict( _p, 0, 1 - this.handleWidth );
  }
  
  this.setDraggingState = function ( _state ) {
    this.draggingState = _state;
    this.isDragged = true;
    this.el.addClass("is-selected");
    this.el.addClass("is-dragged");
    this.component.el.addClass("navigation-dragging navigation-" + _state + "-dragging");
  }
  
  this.unsetDraggingState = function () {
    this.component.el.removeClass("navigation-dragging navigation-" + this.draggingState + "-dragging");
    this.draggingFunction = null;
    this.draggingState = null;
    this.isDragged = false;
    this.el.removeClass("is-selected");
    this.el.removeClass("is-dragged");
    this.handleRight.removeClass("is-dragged");
    this.handleLeft.removeClass("is-dragged");
  }
  
  this.updateLabel = function ( _pageX ) {
    _pageX = Math.max(_pageX,0);
    var cw = this.component.width;
    if (this.labelWidth === 0) {
      this.labelWidth = this.positionLabel.outerWidth();
    }
    var x = Math.min(_pageX/cw,1);
    // fake center on drag
    if (this.draggingState === "background") {
      x = this.handlePosition + this.handleWidth/2;
    }
    this.cursorTimecode = Math.round( x * GLOBAL.duration );
    var time = UTILS.getTimeFormatted( this.cursorTimecode ).total;
    var lP = x;
    var lw = this.labelWidth/cw;
    if (lP + lw > 1) lP -= lw;
    
    this.positionLabel.css("left", UTILS.percent(lP)).text(time);
    this.cursorPosition = x;
    this.cursor.css("left", UTILS.percent(x));
  }
  
  this.updateHandle = function () {
    this.handle.css({
      width: (this.handleWidth*100) + "%",
      left: (this.handlePosition*100) + "%"
    });
  }
  
  this.setupEvents();
}