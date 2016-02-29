function MarkerContextMenu( _timelineComponent ) {
  this.component        = _timelineComponent;
  this.el               = $('<div class="marker-context-menu"><div class="marker-context-pointer"></div></div>');
  this.label            = $('<div class="marker-popup-label marker-popup-tile"></div>');
  this.title            = $('<div class="marker-popup-title marker-popup-tile"></div>');
  this.btn_focusOnTl    = $('<div class="marker-context-button focus-on-timeline">Show whole marker</div>');
  this.btn_startAtTc    = $('<div class="marker-context-button start-at-timecode">Set start to <span class="tc-text">timecode</span>  <span class="context-icon">&#x21e4;</span></div>');
  this.btn_endAtTc      = $('<div class="marker-context-button end-at-timecode">Set end to <span class="tc-text">timecode</span> <span class="context-icon">&#x21e5;</span></div>');
  this.btn_goToStart    = $('<div class="marker-context-button go-start-timeline">Move timecode to start</div>');
  this.btn_goToEnd      = $('<div class="marker-context-button go-end-timeline">Move timecode to end</div>');
  this.btn_edit         = $('<div class="marker-context-button unavailable edit-marker">Edit</div>');
  this.btn_delete       = $('<div class="marker-context-button unavailable delete-marker">Delete</div>');
  this.btn_toPoint      = $('<div class="marker-context-button to-point-marker hidden">Convert to point <span class="context-icon">&#x2022;</span></div>');
  this.btn_expand       = $('<div class="marker-context-button expand-marker">Convert to duration <span class="context-icon">&#x27F7;</span></div>');
  this.divider          = $('<div class="divider"></div>');
  
  this.el.append(
    this.label,
    this.title,
    this.divider.clone(),
    this.btn_edit,
    this.btn_delete,
    this.divider.clone(),
    this.btn_focusOnTl,
    this.divider.clone(),
    this.btn_goToStart,
    this.btn_goToEnd,
    this.divider.clone(),
    this.btn_toPoint,
    this.btn_expand,
    this.btn_startAtTc,
    this.btn_endAtTc
  );   
  
  this.x                = 0;
  this.y                = 0;
  
  this.marker           = null;
  this.currentTimecode  = 0;
  this.isOpen           = false;
  this.isFocused        = false;
  
  this.focus = function () {
    this.isFocused = true;
    this.el.addClass("is-focused");
  }
  
  this.unfocus = function () {
    this.isFocused = false;
    this.el.removeClass("is-focused");
  }
  
  this.open = function ( _marker, event ) {
    // this.component.graph.el.removeClass("transition");
    this.marker = _marker;
    this.currentTimecode = GLOBAL.observer.getTimecode();
    this.marker.hasContextAttached = true;
    
    this.label.html("Marker " + _marker.id + ": " + _marker.type.toProperCase());
    this.title.html( this.marker.title );
    
    this.isOpen = true;
    // this.y = _marker.el.offset().top - this.el.height();
    var x = event.pageX ;
    if (this.marker.isPoint) x = this.component.graph.positionToScreen( this.marker.x ) + this.component.x;
    var w = this.el.outerWidth();
    this.x = UTILS_restrict(x - w/2, 0, GLOBAL.width - w);
    
    // this.y = $(event.currentTarget).offset().top - this.el.outerHeight() - 8;
    this.y = this.marker.el.offset().top - this.el.outerHeight() - 8;
    
    this.el.addClass("transition");
    // this.el.css({
    //   top: this.y + 8
    // });
    // this.el.addClass("transition");
    
    this.el.find(".marker-context-button").removeClass("hidden");
    if (this.marker.isPoint) this.btn_toPoint.addClass("hidden");
    else this.btn_expand.addClass("hidden");
    
    this.update();
  }
  
  this.close = function () {
    this.el.removeClass("transition");
    this.marker.hasContextAttached = false;
    this.marker = null;
    this.isOpen = false;
  }
  
  // this.mousedownHandler = function (event) {
  //   this.x = event.pageX - this.el.width()/2;
  //   this.y = $(event.currentTarget).offset().top - this.el.outerHeight();
  //   this.update();
  // }
  
  this.setupEvents = function () {
    var that = this;
    this.el.on({
      "mousedown": function () {
        console.log("CONTEXT mouse down");
      },
      "mouseup": function () {
        
      },
      "mouseenter": function () {
        that.focus();
      },
      "mouseleave": function () {
        that.unfocus();
      },
      "contextmenu": function (event) {
        event.preventDefault();
      }
    });
    
    // start to tc
    this.btn_startAtTc.click(function(event){
      that.marker.setStart(that.currentTimecode);
      that.component.ifNotOnScreenThenScrollTo( that.marker.x, true, "center" );
      that.afterChange();
    });
  
    // end to tc
    this.btn_endAtTc.click(function(event){
      that.marker.setEnd(that.currentTimecode);
      that.component.ifNotOnScreenThenScrollTo( that.marker.getEndRel(), true, "center" );      
      that.afterChange();
    });
    
    
    // focus
    this.btn_focusOnTl.click(function(event){
      that.component.graph.setTransition(false);
      var g = that.component.graph;
      var l = that.marker.length;
      // scale graph width so that the marker fills the whole screen, if possible
      var w = that.component.width/(l*g.width) * g.width;
      w = UTILS_restrict( w, 0, g.component.widthMax);
      that.component.setGraphWidth(w);
      that.component.slider.value = parseInt(w);
      
      var p = that.marker.x - g.absToRel( that.component.width/2) + that.marker.length/2;
      p = UTILS_restrict( p, 0, 1 - that.component.widthRelToGraph());
      g.component.setScrollPosition(p);
      
      that.marker.afterChangeHandler();
      // TODO
      // because of order in which mouse events are called.
      // mouseup on document triggers before graph is resized. therefore, check for end of resize fails.
      that.component.resizeEndHandler();
      that.afterChange();
    });
    
    //move tc to start
    this.btn_goToStart.click(function(event){
      GLOBAL.observer.setTimecode(that.marker.start);
      that.component.ifNotOnScreenThenScrollTo( that.marker.x, true, "center" );
      that.afterChange();
    });
    
    // move tc to end
    this.btn_goToEnd.click(function(event){
      GLOBAL.observer.setTimecode(that.marker.end);
      that.component.ifNotOnScreenThenScrollTo( that.marker.getEndRel(), true, "center" );
      that.afterChange();
    });
    
    // to point
    this.btn_toPoint.click(function(event) {
      var g = that.component.graph;
      var p = that.marker.x - g.absToRel( that.component.width/2 );
      p = UTILS_restrict( p, 0, 1);
      g.component.ifNotOnScreenThenScrollTo( that.marker.x, true, "center" );
      that.marker.convertToPoint();
      that.afterChange();
    });
    
    // expand
    this.btn_expand.click(function(event) {
      var g = that.component.graph;
      that.marker.expandFromPoint();
      that.component.ifNotOnScreenThenScrollTo( that.marker.x, true, "center" );
      that.afterChange();
    });
    
    // edit
    // this.btn_edit.click(function(event){
    //   that.afterChange();
    // });
  }
  
  this.afterChange = function () {
    // this.component.graph.markerChangeHandler(this.marker);
    // this.marker.afterChangeHandler();
    this.component.graph.afterContextActionHandler();
    this.marker = null;
  }
  
  this.update = function () {
    this.el.css({
      top: this.y,
      left: this.x
    });
  }
  
  this.setupEvents();
}