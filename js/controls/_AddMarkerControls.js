function AddMarkerControls() {
  var self = this;
  this.targets = [];
  this.el = $('<div class="add-marker-controls control-component"></div>');
  this.inputDescription = $('<textarea name="" id="" cols="30" rows="10"></textarea>');
  this.inputLabel = $('<input type="text" name="marker-label" value="">');
  this.inputIsPoint = $('<input type="checkbox" />');
  this.btnAddMarker = $('<div class="button submit">Add Marker</div>');
  
  this.el.append(
    $('<label for="">Label</label>'),
    this.inputLabel,
    $('<label for="">Description</label>'),
    this.inputDescription,
    $('<label for="">Is Queue?</label>'),
    this.inputIsPoint, 
    this.btnAddMarker 
  );
  
  this.btnAddMarker.click(function(event) {
    self.submit();
  });
  
  this.submit = function () {
    var tc = GLOBAL.observer.getTimecode();
    var data = {
      label: this.inputLabel.val() || "Untitled",
      // description: this.inputDescription.val() || "",
      start: tc,
      end: (this.inputIsPoint.is(":checked")) ? tc : tc + 10000,
      type: "marker"
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