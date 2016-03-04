// TODO 
// - global resizeEndHandler()
// - implement GLOBAL as class

var GLOBAL = {
  duration: 0,
  observer: null,
  width: 0,
  height: 0,
  cachedWidth: 0,
  cachedHeight: 0,
  apiClient : null,
  markerTypes : null,
  annotationConfig: {
    markerTypes: {
      "marker": {
        color: "#ff4c3b"
      }, 
      "video": {
        color: "#5b95fc"
      }, 
      "data": {
        color: "#ffa188"
      }, 
      "scene": {
        color: "#ffa700"
      }, 
      "title": {
        color: "#60c458", 
        addMarkerConfig: {
          template: "fixedLabelList",
          labelList: [] //randomTextArray( 30, true )
        }
      }, 
      "comment": {
        color: "#d175c2"
      }, 
      "note": {
        color: "#9e7a60"
      }
    }
  }
}

console.log(GLOBAL.annotationConfig.markerTypes["title"].addMarkerConfig.labelList);

var app = {
  timeline: null,
  displayControls: null
};


jQuery( function ($) {

    //read parameters from URL
    var url = parseURL(window.location.href);
    var params = url.searchObject;

    appConfig.piecemaker.api_key = params.key;
  
  /* = = = = = = = = = = = = = = = = = *
   * DATA SETUP                        *
   * = = = = = = = = = = = = = = = = = */

  var api = GLOBAL.apiClient = new PieceMakerApi(appConfig.piecemaker);

    // see comment at foot of document for structure
    var markerData = [];

    $.ajax({
        url: appConfig.settings+'/'+params.group+'/settings.json',
        success: function (data) {
            appConfig.media = data.media;
            getCurrentUser();
        },
        error : function (err) {
            console.log('Unable to load settings',err);
            getCurrentUser();
        }
    });
    
    $.ajax({
        url: 'js/config/events.json',
        success: function (data) {
          var obj = $.parseJSON(data);
            
            for (var i = 0; i < obj.length; i++) {
              var d = {
                value: obj[i]["title"],
                fields: {}
              }
              $.map(obj[i], function(val, key) {
                if (key !== "title") {
                  d.fields[key] = val;
                }
              });
              GLOBAL.annotationConfig.markerTypes["title"].addMarkerConfig.labelList.push(d);
            }
        },
        error : function (err) {
            console.log('Unable to load events.json',err);
        }
    });

    var getCurrentUser = function () {
        api.whoAmI(function(user){
            GLOBAL.user = user;
            console.log(user);
            startInit();
        });
    }

    var startInit = function () {

        if (params.group && params.context) {
            api.getEvent(params.group, params.context, function (video) {

                var duration = video.duration * 1000;
                GLOBAL.duration = duration;
                GLOBAL.marker_data_template = {
                    event_group_id: video.event_group_id,
                    fields : {
                        'created-with' : 'timeline-v0.0.0',
                        'context-event-id': video.id,
                        'context-event-type': video.type,
                    }
                };

                app.video = new VideoComponent(
                    'http://' +
                    appConfig.media.host +
                    appConfig.media.base_url + '/' +
                    (video.fields['local-file'] || (video.fields.title +'.mp4')) );

                var types = {};

                api.listEventsForTimespan(
                    params.group,
                    video.utc_timestamp,
                    video.utc_timestamp.getTime() + duration,
                    'intersect',
                    function (events) {

                        var videoTime = video.utc_timestamp.getTime();
                        GLOBAL.context_time = videoTime;

                        $.map(events, function (e) {

                            if (e.id === video.id) return;

                            if ((e.type in types) === false) {
                                types[e.type] = 1;
                            } else {
                                types[e.type]++;
                            }

                            var start = e.utc_timestamp.getTime() - videoTime;

                            markerData.push({
                                start: parseInt(start, 10),
                                end: parseInt(e.duration > 0 ? (start + (e.duration * 1000)) : start, 10),
                                label: e.fields.title || e.fields.description || 'Untitled',
                                type: e.type,
                                data: e
                            });
                        });

                        GLOBAL.markerTypes = types;

                        finishInit();
                    });
            });
        }
    }

    var finishInit = function () {
      
      // color setup
      var additionalStyles = "";
      $.map(GLOBAL.annotationConfig.markerTypes, function(val, key) {
        if (val.color) {
          additionalStyles += ""
          + "html body .type-#type-background, "
          + ".marker.type-#type.is-focused .label, "
          + ".marker.type-#type.is-selected .handle, "
          + ".control-component .button.type-#type, "
          + ".marker.type-#type .background { background-color: #color; }"
          + "\n .marker.type-#type:not(.is-focused) .label, "
          + ".marker.type-#type .background { color: #color; }\n";
          additionalStyles = additionalStyles.replace(/#type/g,key).replace(/#color/g,val.color);
        }
      });
      $(document.head).append("<style>" + additionalStyles + "</style>");
      

        GLOBAL.observer = new Observer(app);

        // components
        app.timeline = new TimelineComponent(markerData);
        app.displayControls = new DisplayControls(app.timeline);
        app.addMarkerControls = new AddMarkerControls();
        
        // targets have to implement addMarker( _data )
        app.addMarkerControls.addTarget(app.timeline);
        
        // timecode listeners
        // all listeners have to implement setTimecode( _tc )
        GLOBAL.observer.addListener(app.timeline);
        GLOBAL.observer.addListener(app.displayControls);
          GLOBAL.observer.addListener( app.video );

          $('body').append( 
            app.timeline.el, 
            app.displayControls.el, 
            app.video.el, 
            app.addMarkerControls.el 
          );

        // required
        cacheDimensions();

        // set component width
        app.timeline.setWidth(GLOBAL.width - 40);

        // set zoom
        app.timeline.setGraphWidth(GLOBAL.width - 40);

        // GLOBAL.observer.setTimecode() synchronizes the timecode of all objects
        // that were added as listeners to GLOBAL.observer via GLOBAL.observer.addListener()
        GLOBAL.observer.setTimecode(0);

        $(document).on({
            'click': function (event) {
                // console.log("\n\tDOC ------- click");
                app.timeline.clickHandler(event);
            },
            'mousedown': function (event) {
                // console.log("\n\tDOC ------- mouse down");
                app.timeline.mousedownHandler(event);
                app.displayControls.mousedownHandler(event);
                app.addMarkerControls.mousedownHandler(event);
            },
            'mousemove': function (event) {
                // console.log("\n\tDOC ------- mouse move");
                app.timeline.mousemoveHandler(event);
            },
            'mouseup': function (event) {
                console.log("\n\tDOC ------- mouse up");
                app.timeline.mouseupHandler(event);
                // console.log("HHHHHHH", $(window).width(), GLOBAL.cachedWidth);
                // if ($(window).width() !== GLOBAL.cachedWidth || $(window).height() !== GLOBAL.cachedHeight) {
                //   console.log("RESIZE");
                //   resizeEndHandler();
                // }
            },
            'keydown': function (event) {
                // console.log("\n\tDOC ------- key down");
                GLOBAL.observer.keydownHandler(event);
            },
            'keyup': function (event) {
                // console.log("\n\tDOC ------- key up");
                GLOBAL.observer.keyupHandler(event);
            }
        });


        $(window).resize(function (event) {
            resizeHandler();
        });

        function resizeHandler() {
            cacheDimensions();
            app.timeline.setWidth(GLOBAL.width - 40);
        };

        // not used atm
        function resizeEndHandler() {
            cacheDimensions();
            app.timeline.setWidth(GLOBAL.width - 40);
        };

        function cacheDimensions() {
            GLOBAL.width = $(window).width();
            GLOBAL.height = $(window).height();
            app.timeline.cachePosition();
        };
        
        app.displayControls.init();
        app.timeline.init();
        
        // marker settings setup
        // $.map(markerSettings,function (v,k) {
        //   $(".marker.type-" + k + ".is-focused .label, .marker.type-" + k + ".is-selected .handle, .control-component .button.type-" + k + ", .marker.type-" + k + " .background").css({
        //     "background-color": v.color
        //   });
        //   $(".marker.type-video:not(.is-focused) .label, .marker.type-video .background").css({
        //     "color": v.color
        //   });
        // });
    }
});

/*
 *    MARKER DATA STRUCTURE:
 *    [
 *      {
 *        start: 123000,        // milliseconds, int
 *        end: 130000,          // milliseconds, int
 *        label: "some text",   // string
 *        type: "titel"         // string
 *
 *      },
 *      ...
 *    ]
 *
 *    allowed marker types for now because colors are hard coded atm:
 *      "titel"
 *      "technik"
 *      "kommentar"
 *      "asset"
 *      "person"
 *      "ort"
 *      "referenz"
 *
 *    for random type use:
 *      markerTypePossibility.getRandom()
 */
