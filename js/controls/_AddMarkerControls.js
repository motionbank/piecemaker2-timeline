function AddMarkerControls() {
  var self = this;
  this.targets = [];
  this.el = $('<div class="add-marker-controls control-component"></div>');
  this.inputDescription = $('<textarea class="marker-description" name="marker-description" id="" cols="30" rows="5"></textarea>');
  this.inputLabel = $('<input class="marker-label" type="text" name="marker-label" value="">');
  this.inputIsPoint = $('<input class="marker-is-point" type="checkbox" />');
  this.typeContainer = $('<div class="type-container"></div>');
  this.templateContainer = $('<div class="template-container"></div>');
  this.btnAddMarker = $('<div class="button submit hidden">Add Marker</div>');
  
  this.el.append(
    '<div class="header">New Marker <span class="close-add-marker hidden">Close</span></div>',
    '<div class="spacer"></div>',
    '<label for="">Type</label>',
    this.typeContainer,
    this.templateContainer,
    '<div class="spacer"></div>',
    this.btnAddMarker 
  );
  
  this.el.find('.close-add-marker').click(function(event) {
    self.afterCreateMarker();
  });
    
  this.activeTemplate = null;
  
  // default template
  this.defaultTemplate = $('<div class="default-template input-template"></div>');
  this.defaultTemplate.append(
    '<div class="spacer"></div>',
    '<label for="">Label</label>',
    this.inputLabel,
    '<div class="spacer"></div>',
    '<label for="">Description</label>',
    this.inputDescription,
    '<div class="spacer"></div>',
    '<label for="">Is Queue?</label>',
    this.inputIsPoint,
    '<div class="spacer"></div>'
  );
  
  // this.el.append(
  //   '<div class="header">New Marker</div>',
  //   '<div class="spacer"></div>',
  //   '<label for="">Type</label>',
  //   this.typeContainer,
  //   '<div class="spacer"></div>',
  //   '<label for="">Label</label>',
  //   this.inputLabel,
  //   '<div class="spacer"></div>',
  //   '<label for="">Description</label>',
  //   this.inputDescription,
  //   '<div class="spacer"></div>',
  //   '<label for="">Is Queue?</label>',
  //   this.inputIsPoint,
  //   '<div class="spacer"></div>',
  //   this.btnAddMarker
  // );
  
  
  // marker type buttons
  var _i = 0;
  $.map(GLOBAL.videoConfig.markerTypes, function(v, key) {
    
    var b = $('<div class="button button-toggle type-' + key + '" data-type="' + key + '">' + key.toProperCase() + '</div>');
    
    var inputTemplate = self.defaultTemplate.clone();
    
    if (v.addMarkerConfig) {
      
      // has custom template
      if (v.addMarkerConfig.template) {
        var customTemplate = $('<div class="input-template"></div>');
        customTemplate.append(
          '<div class="spacer"></div>',
          '<label for="">Label</label>',
          self.inputLabel.clone(),
          '<div class="spacer"></div>',
          '<label for="">Description</label>',
          self.inputDescription.clone(),
          '<div class="spacer"></div>',
          '<label for="">Is Queue?</label>',
          self.inputIsPoint.clone(),
          '<div class="spacer"></div>'
        );
        
        // has custom pre configured label list
        if (labelList = v.addMarkerConfig.labelList) {
        
          var templateClass =  key + "-label-list";
        
          // button attribute holds class selector for the custom template
          b.attr("data-label-list-template", "." + templateClass);
        
          // create custom template. all must have class custom-template
          var template = $('<div class="custom-template"><label for="">Labels</label></div>').addClass(templateClass);
          template.append('<div class="section-container label-container"></div>');
          
          for (var i = 0; i < labelList.length; i++) {
            var text = labelList[i];
            var l = $('<div class="select-label-button button">' + text + '</div>');
            l.addClass("type-" + key);
            var inputTarget = "marker-label";
            l.attr("data-input-target-name", "marker-label");
            l.attr("data-value", text);
            // write data-value to target input val
            l.click(function(event) {
              customTemplate.find('[name="' + inputTarget + '"]').val( $(this).data("value") );
            });
            template.find(".label-container").append( l );
          }
          customTemplate.append(template);
        }
        
        // replace default template for this type
        inputTemplate = customTemplate;
      }
    }
    inputTemplate.addClass(key + "-template");
    
    // every type button has its own input template
    self.templateContainer.append( inputTemplate );
    
    // if (_i===0) b.addClass("active");
    
    // events
    b.click(function(event) {
      
      // show add button and close
      self.el.find('.close-add-marker').removeClass("hidden");
      self.btnAddMarker.removeClass("hidden");
      
      // hide all button related custom templates
      self.el.find(".input-template").removeClass("active");
      self.el.find("." + key + "-template").addClass("active");
      
      var btn = $(this);
      // set active state. radio button like.
      self.typeContainer.find(".button").removeClass("active");
      btn.addClass("active");
      
      // look for custom templates
      // if (labelList = btn.data("label-list-template")) {
      //   self.el.find(labelList).removeClass("hidden");
      //   console.log(labelList);
      // }
    });
    
    // add el
    self.typeContainer.append( b );
    _i++;
  });
  
  
  this.btnAddMarker.click(function(event) {
    self.createMarker();
  });
  
  // create new marker and call addMarker on all targets
  this.createMarker = function () {
    
    var tc = GLOBAL.observer.getTimecode();
    var activeTemplate = self.el.find(".input-template.active").first();
    var data = {
      label:        activeTemplate.find("input.marker-label").val() || "Untitled",
      description:  activeTemplate.find("textarea.marker-description").val() || "",
      start:        tc,
      end:          (activeTemplate.find("input.marker-is-point").is(":checked")) ? tc : tc + 10000,
      type:         this.typeContainer.find(".button.active").first().data("type") || "No_type"
    };
    
    this.afterCreateMarker();
        
    for (var i = 0; i < this.targets.length; i++) {
      this.targets[i].addMarker( data );
    }
  }
  
  this.afterCreateMarker = function () {
    self.el.find('.close-add-marker').addClass("hidden");
    self.typeContainer.find(".button").removeClass("active");
    self.btnAddMarker.addClass("hidden");
    self.el.find(".input-template").removeClass("active");
    self.el.find("input.marker-label").val("");
    self.el.find("textarea.marker-description").val("");
    self.el.find("input.marker-is-point").prop( "checked", false );
  }
  
  this.addTarget = function ( _target ) {
    this.targets.push( _target );
  }
}