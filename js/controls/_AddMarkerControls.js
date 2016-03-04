function AddMarkerControls() {
  var self = this;
  this.targets = [];
  this.el = $('<div class="add-marker-controls control-component"></div>');
  this.inputDescription = $('<textarea class="marker-description" name="marker-description" id="" cols="30" rows="5"></textarea>');
  // this.inputLabel = $('<input class="marker-label" type="text" name="marker-label" value="">');
  this.inputLabel = $('<textarea class="marker-label" name="marker-label" id=""></textarea>');
  this.inputIsPoint = $('<input class="marker-is-point" type="checkbox" />');
  this.typeContainer = $('<div class="type-container"></div>');
  this.templateContainer = $('<div class="template-container"></div>');
  this.btnAddPoint = $('<div class="button button-action submit hidden">Add point</div>');
  this.btnAddRange = $('<div class="button button-action submit hidden">Add range</div>');
  
  this.titleFields = {};
  
  this.el.append(
    '<div class="header">New Event <span class="close-add-marker hidden">Close</span></div>',
    '<div class="spacer"></div>',
    '<label for="">Type</label>',
    this.typeContainer,
    this.templateContainer,
    this.btnAddPoint,
    this.btnAddRange
     
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
  $.map(GLOBAL.annotationConfig.markerTypes, function(v, key) {
    
    var b = $('<div class="button button-toggle type-' + key + '" data-type="' + key + '">' + key.toProperCase() + '</div>');
    
    var inputTemplate = self.defaultTemplate.clone();
    inputTemplate.find(".marker-label").addClass("type-" + key + "-background");
    inputTemplate.find(".marker-description").addClass("type-" + key + "-background");
    
    if (v.addMarkerConfig) {
      
      // has custom template
      if (v.addMarkerConfig.template) {
        var customTemplate = $('<div class="input-template label-list-template"></div>');
        customTemplate.append(
          '<div class="spacer"></div>',
          '<label for="">Label</label>',
          self.inputLabel.clone().addClass("type-" + key + "-background"),
          '<div class="spacer"></div>',
          '<label for="">Description</label>',
          self.inputDescription.clone().addClass("type-" + key + "-background"),
          '<div class="spacer"></div>'
        );
        
        // has custom pre configured label list
        if (labelList = v.addMarkerConfig.labelList) {
        
          var templateClass =  key + "-label-list";
        
          // button attribute holds class selector for the custom template
          b.attr("data-label-list-template", "." + templateClass);
        
          // create custom template. all must have class custom-template
          var template = $('<div class="popup-template custom-template hidden"><label for="">Labels</label></div>').addClass(templateClass);
          template.append('<div class="section-container label-container"></div>');
          
          for (var i = 0; i < labelList.length; i++) {
            var text = labelList[i].value;
            var l = $('<div class="button button-numbered"><span>' + (i+1) + '</span><pre>' + text + '</pre></div>');
            l.addClass("type-" + key);
            var inputTarget = "marker-label";
            l.attr("data-input-target-name", "marker-label");
            l.attr("data-value", text);
            l.attr("data-fields", JSON.stringify(labelList[i].fields));
            
            // write data-value to target input val
            l.click(function(event) {
              // get input
              customTemplate.find('[name="' + inputTarget + '"]')
              .val( $(this).data("value") )
              .attr("data-fields", JSON.stringify( $(this).data("fields") ) );
              template.addClass("hidden");
            });
            template.find(".label-container").append( l );
          }
          customTemplate.append(template);
        }
        
        customTemplate.find('textarea.marker-label').click(function(event) {
          $(this).blur();
          template.removeClass("hidden");
        });
        
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
      
      self.el.find(".popup-template").addClass("hidden");
      
      // show add button and close
      self.el.find('.close-add-marker').removeClass("hidden");
      self.btnAddRange.removeClass("hidden");
      self.btnAddPoint.removeClass("hidden");
      
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
  
  
  this.btnAddRange.click(function(event) {
    self.createMarker(true);
  });
  
  this.btnAddPoint.click(function(event) {
    self.createMarker();
  });
  
  // create new marker and call addMarker on all targets
  this.createMarker = function ( _range ) {
    
    var tc = GLOBAL.observer.getTimecode();
    var activeTemplate = self.el.find(".input-template.active").first();
    var data = {
      label:        activeTemplate.find(".marker-label").val() || "Untitled",
      description:  activeTemplate.find(".marker-description").val() || "",
      start:        tc,
      end:          ( _range ) ? tc + 10000 : tc,
      type:         this.typeContainer.find(".button.active").first().data("type") || "No_type",
      fields:       activeTemplate.find(".marker-label").data("fields") || {}
    };
        
    this.afterCreateMarker();
        
    for (var i = 0; i < this.targets.length; i++) {
      this.targets[i].addMarker( data );
    }
  }
  
  this.afterCreateMarker = function () {
    self.el.find('.close-add-marker').addClass("hidden");
    self.typeContainer.find(".button").removeClass("active");
    self.btnAddRange.addClass("hidden");
    self.btnAddPoint.addClass("hidden");
    self.el.find(".input-template").removeClass("active");
    self.el.find(".marker-label").val("");
    self.el.find(".marker-description").val("");
  }
  
  this.addTarget = function ( _target ) {
    this.targets.push( _target );
  }
  
  // EVENTS
  
  this.el.mousedown(function(event) {
    GLOBAL.observer.unselectMarker();
  });
}