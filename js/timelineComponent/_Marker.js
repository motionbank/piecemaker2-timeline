function Marker( _timelineComponent, _timelineGraph, _id, _data ) {
  
  /*  TODO
   *  - FIX: label padding is different for default and .marker.is-focused => different labelWidth values 
   *  - do i need calcLabelWidthMax() and cacheLabelWidth() ?
   *  - markerChangeHandler() use?
   */
  
  this.component          = _timelineComponent;
  this.parentGraph        = _timelineGraph;
  
  this.el                 = $('<div class="marker is-visible"><div class="marker-inner"></div></div>');  
  this.handleRight        = $('<div class="handle handle-right"></div>');
  this.handleLeft         = $('<div class="handle handle-left"></div>');  
  this.background         = $('<div class="background"></div>');
  this.label              = $('<div class="label"></div>');
  
  // append all elements
  this.el.find(".marker-inner").append( this.background, this.label );
  this.el.append( this.handleRight, this.handleLeft );
  
  var data = _data || {start:0,end:10000,end:15000,label:"label",type:"titel"};
  
  this.x                  = data.start/GLOBAL.duration;     // 0 - 1
  this.y                  = 0;                              // 0 - 1
  this.length             = (data.end-data.start)/GLOBAL.duration;  // 0 - 1
  this.height             = 17;                             // px
  this.row                = 0;
  this.id                 = _id;
  this.start              = data.start;                     // mill
  this.end                = data.end                        // mill
  this.duration           = (data.end-data.start);          // mill
  
  this.title              = data.label;
  this.type               = data.type;

  this.original_data      = data.data || {}; // the Picemaker2 event data
  
  this.labelWidth         = 0;
  this.labelPosition      = 0;
  this.handleWidth        = 9;   // px NOT USED PROPERLY
  this.borderWidth        = 8;
  
  this.mousemoveFunction  = null;
  
  this.impactPosition     = 0;
  
  this.isFocused          = false;
  this.isHovered          = false;
  this.isSelected         = false;
  this.isOnScreen         = false;
  this.isPoint            = false;
  this.isTooSmall         = false;
  this.draggingState      = null;
  this.unselectTimer      = null;
  this.hasContextAttached = false;
  this.markerDetail       = null;
  
  // fake
  // this.type = markerTypePossibility.getRandom();
  this.el.addClass( "type-" + this.type );
  this.el.attr("data-id",this.id);
  this.label.text( this.title );
  
  
  // --------------------------------------------------------------------------------
  
  
  this.init = function () {
    this.checkIfOnScreen();
    this.checkPointState();
    this.calcLabelWidthMax();
    // this.cacheLabelWidth();
  }
  
  // --------------------------------------------------------------------------------
  
  
  this.attachMarkerDetail = function ( _markerDetail ) {
    this.markerDetail = _markerDetail;
  }
  
  this.detachMarkerDetail = function () {
    this.markerDetail = null;
  }
  
  
  /*
    EVENTS  =========================================================================
  */
  
  this.setupEvents = function () {
    var that = this;
    var graph = this.parentGraph;

    // right handle
    this.handleRight.mousedown(function(event) {
      if (event.which===1) {
        that.setDraggingState("handle");
        that.mousemoveFunction = that.observeHandleRight;
      }
    });
    // left handle
    this.handleLeft.mousedown(function(event) {
      if (event.which===1) {
        that.setDraggingState("handle");
        that.mousemoveFunction = that.observeHandleLeft;
      }
    });
    // whole marker (on background)
    this.background.mousedown(function(event) {
      if (event.which===1) {
        that.setDraggingState("background");
        that.mousemoveFunction = that.observeBackground;
        // better use util function from TimelineGraph?
        that.impactPosition = event.pageX / graph.width - that.x;
      }
    });
    
    // this
    this.el.on({
      "contextmenu": function (event) {
        event.preventDefault();
      },
      "mousedown":  function (event) {
        switch (event.which) {
          case 1: //left
            break;
          case 2: //middle
            break;
          case 3: //right
            break;
          default: //other
        }
        graph.markerEvent(that, event);
        event.preventDefault();
      },
      "mouseenter": function (event) {
        graph.markerEvent(that, event);
        that.focus();
        that.el.addClass("is-hovered");
        that.isHovered = true;
      },
      "mouseleave": function (event) {
        graph.markerEvent(that, event);
        that.unfocus();
        that.el.removeClass("is-hovered");
        that.isHovered = false;
      },
      "mousemove":  function (event) {
        graph.markerEvent(that, event);
      }
    });
  }
  
  // TODO explain
  //      better custom event?
  this.markerChangeHandler = function () {
    this.parentGraph.markerChangeHandler(this);
  }
  
  this.afterChangeHandler = function () {
    console.log("MARKER: after change", this.id);
    this.updateOriginalData();
    this.calcLabelWidthMax();
  }

  this.updateOriginalData = function () {
    console.log("MARKER: updateOriginalData");
    var api = GLOBAL.apiClient;
    var self = this;
    if ( this.original_data ) {
      var data = this.original_data;
      api.getEvent(data.event_group,data.id,function(evt){
        api.updateEvent(evt.event_group,evt.id,{
          utc_timestamp : data.context_time + self.start,
          duration : self.duration / 1000.0,
          token : evt.token
        },function(evt2){
          evt2.context_time = data.context_time;
          self.original_data = evt2;
        });
      });
    }
  }
  
  this.graphResizeEndHandler = function () {
    this.calcLabelWidthMax();
    this.checkIfOnScreen();
    this.adjustLabelToScreen();
  }
  
  this.mousemoveHandler = function (event) {
    if (this.mousemoveFunction) this.mousemoveFunction(event);
    // if (GLOBAL.observer.shiftDown && this.draggingState) {
    //   var p = 0;
    //   if (this.draggingState === "handle") {
    //     p = this.parentGraph.mapScreenPosition(event.pageX);
    //   }
    //   else { // === background
    //     p = this.x;
    //   }
    //   GLOBAL.observer.setTimecode( Math.round( p * GLOBAL.duration) );
    // }
  }
  
  // global. graph calls only an selected marker
  this.mouseupHandler = function (event) {
    console.log("MARKER: mouseupHandler");
    this.unsetDraggingState();
    // this.checkPointState();
    this.afterChangeHandler();
  }
  
  
  // right handle dragged
  this.observeHandleRight = function (event) {
    var x = this.component.locX( event.pageX );
    var b = this.getBounds();
    var start = this.x;
    var pos = this.parentGraph.mapScreenPosition( x );
    
    if (pos <= start) {
      pos = Math.max(pos, start);
    }
    else if (!this.isTooSmall){
      pos = Math.max(pos, b.left + b.border);
    }
    
    pos = Math.min(pos, this.parentGraph.scrollXRel() + this.parentGraph.viewPortWidthRel() );
    pos = this.parentGraph.snapToPlayhead(pos, 20);
    var n = pos - this.x;
    this.setLength(n);
  }
  
  // left handle dragged
  this.observeHandleLeft = function (event) {
    var x = this.component.locX( event.pageX );
    var b = this.getBounds();
    var end = this.getEndRel();
    var pos = this.parentGraph.mapScreenPosition( x );
    
    if (pos >= end) {
      pos = Math.min( pos, end );
    }
    else if (!this.isTooSmall){
      pos = Math.min( pos, b.right - b.border );
    }
    
    pos = Math.max( pos, this.parentGraph.scrollXRel() );
    
    // if (GLOBAL.observer.shiftDown)
    pos = this.parentGraph.snapToPlayhead(pos, 20);
    
    this.setLength( end - pos, false );
    this.setX(pos);
  }
  
  // whole marker dragged
  this.observeBackground = function (event) {
    var pos = this.parentGraph.absToRel(event.pageX);
    // max = x + marker.length as 0 - 1
    var max = ((this.parentGraph.width - this.length * this.parentGraph.width)/ this.parentGraph.width);
    var x = pos - this.impactPosition;
    
    x = this.parentGraph.snapToPlayhead(x, 20);
    x = this.parentGraph.snapToPlayhead(x, 20, this.length);
    x = UTILS_restrict( x, 0, max);
    
    this.setX(x);
  }
  
  /*
    GET SET   =========================================================================
  */
  
  this.align = function () {
    this.row = this.parentGraph.getEmptyRow( this );
    this.update();
  }
  
  this.convertToPoint = function () {
    this.setEnd(this.start);
    // this.afterChangeHandler();
  }
  
  this.expandFromPoint = function () {
    // 100px wide = ms relative to current zoom level
    if (this.isPoint) {
      var s = this.parentGraph.absToRel(100);
      var e = Math.floor(this.start + s * GLOBAL.duration)
      this.setEnd(e);
      // this.afterChangeHandler();
    }
  }
  
  //-------------------------------------------------------------------- for handle interaction
  // 0 - 1
  this.setX = function ( _x, _update ) {
    _update = (_update === undefined) ? true : _update;
    this.x = _x;
    this.start = Math.round(this.x * GLOBAL.duration);
    this.end = this.start + this.duration;
    this.checkPointState();
    if (_update) {
      this.update();
      this.markerChangeHandler();
    }
  }
  
  // 0 - 1
  this.setLength = function ( _l, _update ) {
    _update = (_update === undefined) ? true : _update;
    this.length = _l;
    this.duration = Math.round(this.length * GLOBAL.duration);
    this.end = this.start + this.duration;
    this.checkPointState();
    if (_update) {
      this.update();
      this.markerChangeHandler();
    }
  }
  
  //-------------------------------------------------------------------- for timecode changes
  // mill
  this.setStart = function ( _s, _update ) {
    _update = (_update === undefined) ? true : _update;
    if (_s>=this.end) {
      this.setEnd(_s, false);
    }
    this.start = _s;
    this.x = _s / GLOBAL.duration;
    this.setDuration(this.end - this.start, false);
    this.checkPointState();
    if (_update) {
      this.update();
      this.markerChangeHandler();
    }
  }
  
  // mill
  this.setEnd = function ( _e, _update ) {
    _update = (_update === undefined) ? true : _update;
    if (_e<=this.start) {
      this.setStart(_e, false);
    }
    this.end = _e;
    this.setDuration(this.end - this.start, false);
    this.checkPointState();
    if (_update) {
      this.update();
      this.markerChangeHandler();
    }
  }
  
  // mill
  this.setDuration = function ( _d, _update ) {
    _update = (_update === undefined) ? true : _update;
    this.length = _d / GLOBAL.duration;
    this.duration = _d;
    if (_update) {
      this.update();
      this.markerChangeHandler();
    }
  }
  
  //--------------------------------------------------------------------
  this.getEndRel = function () {
    return this.x + this.length;
  }
  
  this.width = function () {
    return this.parentGraph.relToAbs(this.length);
  }
  
  
  this.getBounds = function () {
    var tl = this.parentGraph;
    var end = this.getEndRel();
    var borderWidth = tl.absToRel(8);
    var bounds = {
      "left":this.x,
      "right":end,
      "innerRight": end - borderWidth,
      "innerLeft": this.x + borderWidth,
      "border": borderWidth*2
    };
    if (this.isPoint) {
      bounds.left = this.x - borderWidth;
      bounds.right = bounds.left + borderWidth*2;
    };
    return bounds;
  }
  
  this.checkWidth = function () {
    if (!this.isPoint && this.parentGraph.relToAbs( this.length )<15) {
      this.el.addClass("too-small");
      this.isTooSmall = true;
    }
    else {
      this.el.removeClass("too-small");
      this.isTooSmall = false;
    }
  }
  
  this.adjustLabelToMouse = function ( _x ) {
    
    // label padding = 5
    if (this.isFocused || this.isSelected) {
      var lw = this.labelWidth;
      var mw = this.parentGraph.relToAbs(this.length);
      var sX = this.parentGraph.positionToScreen(this.x);
      var pos = _x - sX - this.handleWidth;
      
      // make sure that label is not outside of marker (to the right)
      // or not outside of browser if possible
      if ( pos + lw + this.handleWidth*2 + 6> mw || sX + pos + lw + 12 > this.component.width) {
        pos -= lw + 5;
      }
      
      if ( sX + pos < 0 ) {
        pos = Math.min(-sX, mw - lw - this.handleWidth*2);
        // diff between normal padding and focus padding
        pos -= 3;
      }
      
      // make sure that label is not outside of marker (to the left)
      if (_x < sX || pos < 0) pos = 0;
      // if (_pageX > sX + markerWidth -8) pos = sX + markerWidth-8;
      
      this.labelPosition = pos;
      
      this.label.css({
        "margin-left": pos
      });
    }
  }
  
  this.adjustLabelToScreen = function() {
    var sX = this.parentGraph.positionToScreen(this.x);
    
    if ( !this.isOnScreen && this.labelPosition !== 0 ) {
      this.labelPosition = 0;
    
      this.label.css({
        "margin-left": 0
      });
    }
    
    if (this.isOnScreen && !this.isFocused && !this.isSelected) {
      if (sX < 0) {
        var lw = this.labelWidth;
        var mw = this.parentGraph.relToAbs(this.length);
        var sX = this.parentGraph.positionToScreen(this.x);
        var pos = 0;
      
        if (sX * -1 + lw + this.handleWidth*2 < mw) {
          pos = sX * -1;
        }
        else pos = mw - lw - this.handleWidth*2;
          
        this.labelPosition = pos;
      
        this.label.css({
          "margin-left": pos
        });
      }
      else if ( this.labelPosition !== 0 ) {
        this.labelPosition = 0;
    
        this.label.css({
          "margin-left": 0
        });
      }
    }
  }
  
  /*
    STATES  =========================================================================
  */
  
  this.isVisible = function () {
    return this.el.hasClass("is-visible");
  }
  
  this.setDraggingState = function ( _state ) {
    this.draggingState = _state;
    this.parentGraph.dragMarker();
    this.parentGraph.selectMarker(this);
    // this.select();
    this.el.addClass("is-dragged");
    this.component.el.addClass("marker-dragging marker-" + _state + "-dragging");
  }
  
  this.unsetDraggingState = function () {
    this.component.el.removeClass("marker-dragging marker-" + this.draggingState + "-dragging");
    this.draggingState = null;
    this.el.removeClass("is-dragged");
    this.mousemoveFunction = null;
  }
  
  this.select = function () {
    if (this.unselectTimer) clearTimeout(this.unselectTimer);
    this.isSelected = true;
    this.el.addClass("is-selected");
  }
  
  this.unselect = function ( _delay ) {
    var that = this;
    this.unselectTimer = setTimeout(function () {
      that.isSelected = false;
      that.el.removeClass("is-selected");
      that.unselectTimer = null;
      that.adjustLabelToScreen();
      // that.label.css({
      //   "margin-left": 0
      // });
    }, _delay || 0);   
  }
  
  this.focus = function () {
    this.el.addClass("is-focused");
    this.isFocused = true;
  }
  
  this.unfocus = function () {
    if (this.isFocused) {
      this.el.removeClass("is-focused");
      this.isFocused = false;
      this.label.css({
        "margin-left": 0
      });
      this.adjustLabelToScreen();
    }
  }
  
  this.checkIfOnScreen = function () {
    if ( this.component.checkIfRangeOnScreen( this.x, this.getEndRel() ) ) {
      this.el.addClass("is-on-screen");
      this.isOnScreen = true;
    }
    else {
      this.el.removeClass("is-on-screen");
      this.isOnScreen = false;
    }
  }
  
  this.setPointState = function () {
    this.isPoint = true;
    this.el.addClass("is-point");
    // this.checkWidth();
    // this.markerChangeHandler();
    // this.calcLabelWidthMax();
    // this.update();
  }
  
  this.unsetPointState = function () {
    this.isPoint = false;
    this.el.removeClass("is-point");
    // this.calcLabelWidthMax();
    // this.afterChangeHandler();
    // this.markerChangeHandler();
  }
  
  this.checkPointState = function () {    
    if (this.start === this.end && !this.isPoint) this.setPointState();
    else if (this.start !== this.end && this.isPoint) this.unsetPointState();
  }
  
  this.calcLabelWidthMax = function () {
    // if (this.id===0) console.log("marker label max width", this.width());
    var w = this.width() - this.handleWidth*2 - 5;
    this.label.css("max-width", w);
    // hide if too small. because of padding.
    if (w<12) {
      this.label.addClass("transparent");
    }
    else this.label.removeClass("transparent");
    this.cacheLabelWidth();
  }
  
  // cache label width
  this.cacheLabelWidth = function () {
    // if (this.id===0) console.log("marker label width", this.label.innerWidth());
    // var b = parseInt(this.label.css("padding-right")) + parseInt(this.label.css("padding-left"));
    this.labelWidth = this.label.outerWidth();
  }
  
  /*
    UPDATE  =========================================================================
  */
  
  this.update = function () {
    var w = (this.length*100) + "%";
    var x = this.x;
    //                                    + offset to top because of timebar and navbar
    this.y = this.row * (this.height + 1) + 17*2 + 5;
    
    if (this.isPoint) {
      w = this.height;
      x -= this.parentGraph.absToRel(8);
    }
    
    this.el.css({
      'left': (x*100) + "%",
      'top': this.y,
      width: w,
      height: this.height
    });
    this.el.find(".background").css({
      height: this.height
    });
    if (this.markerDetail) this.markerDetail.updateText();
  }
  
  this.setupEvents();
}