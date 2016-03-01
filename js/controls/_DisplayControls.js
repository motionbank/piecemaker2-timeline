function DisplayControls( _timelineComponent ) {
  
  this.component        = _timelineComponent;  
  this.el               = $('<div id="controls" class="control-component"></div>');
  this.btn_open         = $('<div class="controls-opener"><img src="img/icons/display_40_40_ddd.png" alt="" /></div>');
  this.btnContainer     = $('<div class="button-container"></div>');
  
  this.btn_labels       = $('<div class="button active marker-label-toggle">Show marker labels</div>');
  this.btn_overlapping  = $('<div class="button overlapping-toggle">Highlight overlapping markers</div>');
  
  this.header           = $('<div class="header"></div>')
  this.spacer           = $('<div class="spacer"></div>');
  this.label            = $('<div class="label"></div>');
  
  this.info             = $('<div class="information-block"></div>');
  this.durationBlock    = $('<div class="info-tile duration"><div class="info-label">Duration</div><div class="info-content"></div></div>');
  this.timecodeBlock    = $('<div class="info-tile timecode"><div class="info-label">Timecode</div><div class="info-content"></div></div>');
  this.markerBlock      = $('<div class="info-tile marker-info"><div class="info-label">Selected</div><div class="info-content"></div></div>');

  this.info.append(this.durationBlock, this.timecodeBlock, this.markerBlock);
  this.el.append(this.btn_open, this.btnContainer, this.info);
  
  this.isFocused = false;
  
  
  this.init = function () {
    
    var that = this;

    this.el.mouseenter(function(event) {
      that.el.addClass("is-focused");
      that.isFocused = true;
    });
    
    this.el.mouseleave(function(event) {
      that.el.removeClass("is-focused");
      that.isFocused = false;
    });
    
    this.btn_open.mouseenter(function(event) {
      that.el.addClass("is-selected");
    });
    
    
    //-----------------------------------------
    
    this.btnContainer.append(this.header.clone().text("Display settings"));
    this.btnContainer.append(this.spacer.clone());
    
    this.btnContainer.append(this.label.clone().text("Marker types"));
    
    // buttons
    $.map(GLOBAL.markerTypes, function (v,k) {
      var mt = k.toString();
      var el = $('<div class="button button-marker-visibility active type-' + mt + '" data-target=' + mt + '>' + mt.toProperCase() + '<span class="counter">' + v + '</span></div>');
      el.click(function (event) {
        GLOBAL.observer.toggleMarkerVisibility( $(this).data("target") );
      });
      that.btnContainer.append(el);
    });
    
    
    this.btnContainer.append(this.spacer.clone());
    this.btnContainer.append(this.label.clone().text("Timeline"));
    
    
    // labels
    this.btnContainer.append(this.btn_labels);
    
    this.btn_labels.click(function(event) {
      that.component.graph.toggleMode("mode_showMarkerLabels");
    });
    
    
    
    // overlapping
    this.btnContainer.append(this.btn_overlapping);
    
    this.btn_overlapping.click(function(event) {
      that.component.graph.toggleMode("mode_focusOverlapping");
    });
    
    
    
    // info
    this.durationBlock.find(".info-content").text( UTILS_getTimeFormatted( GLOBAL.duration ).total );
    this.markerBlock.hide();
    
    
    this.timecodeBlock.click(function(event) {
      var tc = GLOBAL.observer.getTimecode();
      app.timeline.setScrollPosition( tc / GLOBAL.duration, true, "center" );
    });
    
    this.el.find(".button").click(function(event) {
      $(this).toggleClass("active");
    });
    
    return this;
  }
  
  this.mousedownHandler = function (event) {
    if (!this.isFocused) {
      this.el.removeClass("is-selected");
    }
  }
  
  this.setTimecode = function ( _tc ) {
    this.timecodeBlock.find(".info-content").text(UTILS_getTimeFormatted( _tc ).total );
  }
  
  this.setMarker = function ( _m ) {
    this.markerBlock.find(".info-content").html("Marker " + _m.id + ": " + _m.type.toProperCase() + "<br />" + _m.title );
    this.markerBlock.show();
  }
  
  this.unsetMarker = function ( _m ) {
    this.markerBlock.find(".info-content").text("");
    this.markerBlock.hide();
  }
}