function MarkerDetails( _timelineComponent ) 
{
  this.component   = _timelineComponent;
  this.el               = $('<div class="marker-details"></div>');
  this.label            = $('<div class="details-label marker-popup-tile">X</div>');
  this.title            = $('<div class="details-title marker-popup-tile">X</div>');
  this.content          = $('<div class="details-content"><div class="row start">Start<span class="value"></span></div><div class="row end">End<span class="value"></span></div><div class="row duration">Duration<span class="value"></span></div></div>');
  this.divider          = $('<div class="divider"></div>');
  this.x                = 0;
  this.y                = 0;
  this.marker           = null;
  this.height           = 0;
  this.width            = 0;
  
  this.el.append(
    this.label,
    this.title,
    this.divider.clone(),
    this.content
  );
  
  this.focusOn = function ( _marker, event ) 
  {
    console.log("MARKER DETAILS: focusOn");
    this.show();
    this.marker = _marker;
    this.marker.attachMarkerDetail(this);
    this.updateText();
    // this.y = this.component.y - this.el.outerHeight() + 1;
    // console.log(this.el.outerHeight());
    // this.y = 0;
    
    this.update();
  }
  
  this.updatePositionX = function ( _x ) 
  {
    var w = this.width;
    this.x = UTILS.restrict(_x - w/2, 0, this.component.width - w);
    this.y = this.component.y - this.height + 1;
    this.update();
  }
  
  this.show = function () {
    this.el.css("opacity",1);
  }
  
  this.hide = function () 
  {;
    this.el.css("opacity",0);
    this.marker.detachMarkerDetail();
  }
  
  this.updateText = function () 
  {
    if (this.marker) {
      var s = UTILS_getTimeFormatted( Math.round(this.marker.start) ).total;
      var e = UTILS_getTimeFormatted( Math.round(this.marker.end) ).total;
      var l = UTILS_getTimeFormatted( Math.round(this.marker.duration) ).total;
      // this.el.html( this.marker.type + "<br/>id " + this.marker.id + "<br/>start " + s + "<br/>end " + e + "<br/>duration " + l );
      this.label.html( this.marker.type.toProperCase() );
      this.title.html( UTILS.formatString( this.marker.title ) );
      this.content.find(".row.start .value").html( s );
      this.content.find(".row.end .value").html( e );
      this.content.find(".row.duration .value").html( l );
      
      this.width = this.el.outerWidth();
      this.height = this.el.outerHeight();
    }
  }
  
  this.update = function () 
  {
    // if (this.y === 0) {
    //   this.y = this.component.el.offset().top - this.el.outerHeight() + 1;
    // }
    this.el.css({
      top: this.y,
      left: this.x 
    });
  }
}