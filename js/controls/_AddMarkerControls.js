function AddMarkerControls() {
  var self = this;
  this.targets = [];
  this.el = $('<div class="add-marker-controls control-component"></div>');
  this.inputDescription = $('<textarea name="" id="" cols="30" rows="5"></textarea>');
  this.inputLabel = $('<input type="text" name="marker-label" value="">');
  this.inputIsPoint = $('<input type="checkbox" />');
  this.typeContainer = $('<div class="type-container"></div>');
  this.btnAddMarker = $('<div class="button submit">Add Marker</div>');
  
  this.el.append(
    '<div class="header">New Marker</div>',
    '<div class="spacer"></div>',
    '<label for="">Type</label>',
    this.typeContainer,
    '<div class="spacer"></div>',
    '<label for="">Label</label>',
    this.inputLabel,
    '<div class="spacer"></div>',
    '<label for="">Description</label>',
    this.inputDescription,
    '<div class="spacer"></div>',
    '<label for="">Is Queue?</label>',
    this.inputIsPoint,
    '<div class="spacer"></div>',
    this.btnAddMarker 
  );
  
  // marker type buttons
  for (var i = 0; i < dataConfig.MarkerTypes.length; i++) {
    
    var mt = dataConfig.MarkerTypes[i];
    // var b = $('<div class="button type-' + mt + '" >' + mt.toProperCase() + '</div>');
    var b = $('<div class="button button-toggle type-' + mt + '" data-type="' + mt + '">' + mt.toProperCase() + '</div>');
    if (i===0) b.addClass("active");
    
    b.click(function(event) {
      self.typeContainer.find(".button").removeClass("active");
      $(this).addClass("active");
    });
    this.typeContainer.append( b );
  }
  
  this.btnAddMarker.click(function(event) {
    self.createMarker();
  });
  
  // create new marker and call addMarker on all targets
  this.createMarker = function () {
    
    var tc = GLOBAL.observer.getTimecode();
    
    var data = {
      label: this.inputLabel.val() || "Untitled",
      description: this.inputDescription.val() || "",
      start: tc,
      end: (this.inputIsPoint.is(":checked")) ? tc : tc + 10000,
      type: this.typeContainer.find(".button.active").first().data("type") || "No_type"
    };
    
    console.log(data,"is point:",this.inputIsPoint.is(":checked"));
    
    for (var i = 0; i < this.targets.length; i++) {
      this.targets[i].addMarker( data );
    }
  }
  
  this.addTarget = function ( _target ) {
    this.targets.push( _target );
  }
}