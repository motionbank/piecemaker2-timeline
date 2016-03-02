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
  videoConfig: {
    markerTypes: {
      "marker": {}, 
      "video": {}, 
      "data": {}, 
      "scene": {}, 
      "title": { 
        addMarkerConfig: {
          template: "fixedLabelList",
          labelList: randomTextArray( 30, true )
        }
      }, 
      "comment": {}, 
      "note": {}
    }
  }
}

console.log(GLOBAL.videoConfig.markerTypes["title"].addMarkerConfig.labelList);

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
            startInit();
        },
        error : function (err) {
            console.log('Unable to load settings',err);
            startInit();
        }
    });

    var startInit = function () {

        if (params.group && params.context) {
            api.getEvent(params.group, params.context, function (video) {

                var duration = video.duration * 1000;
                GLOBAL.duration = duration;

                app.video = new VideoComponent(
                    // 'http://'+       /* einmal http zu viel */
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

                        $.map(events, function (e) {

                            if (e.id === video.id) return;

                            if ((e.type in types) === false) {
                                types[e.type] = 1;
                            } else {
                                types[e.type]++;
                            }

                            var start = e.utc_timestamp.getTime() - videoTime;
                            e.context_time = videoTime;

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
        app.timeline.setGraphWidth(15000);

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
