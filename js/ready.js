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
  apiClient : null
}

var app = {
  timeline: null,
  displayControls: null
};


jQuery( function ($) {

    //parse data from URL
    var url = parseURL(window.location.href);
    var params = url.searchObject;
  
  /* = = = = = = = = = = = = = = = = = *
   * DATA SETUP                        *
   * = = = = = = = = = = = = = = = = = */

  var api = GLOBAL.apiClient = new PieceMakerApi(appConfig.piecemaker);

    // marker data
    var markerData = [];
    /*
     *    DATA STRUCTURE:
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

    if ( params.group && params.context ) {
        api.getEvent(params.group,params.context,function(video){

            var duration = video.duration * 1000;
            GLOBAL.duration = duration;

            app.video = new VideoComponent(
                appConfig.video_streamer.host +
                appConfig.video_streamer.base_path + '/' +
                video.fields.title + '.mp4' );

            api.listEventsForTimespan(
                params.group,
                video.utc_timestamp,
                video.utc_timestamp.getTime()+duration,
                'intersect',
                function(events){
                    var videoTime = video.utc_timestamp.getTime();
                    $.map(events,function(e){
                        var start = e.utc_timestamp.getTime()-videoTime;
                        markerData.push({
                            start: parseInt( start, 10 ),
                            end: parseInt( e.duration > 0 ? (start + (e.duration*1000)) : start, 10 ),
                            label: e.fields.title || 'Untitled',
                            type: e.type,
                            data : e
                        });
                    });
                    finishInit();
                });
        });
    }

    var finishInit = function () {

        GLOBAL.observer = new Observer(app);

        // components
        app.timeline = new TimelineComponent(markerData);
        app.displayControls = new DisplayControls(app.timeline);

        // timecode listeners
        // all listeners have to implement setTimecode()
        GLOBAL.observer.addListener(app.timeline);
        GLOBAL.observer.addListener(app.displayControls);
          GLOBAL.observer.addListener( app.video );

          $('body').append( app.timeline.el, app.displayControls.el, app.video.el );

        $('body').append(app.timeline.el, app.displayControls.el);

        // required
        cacheDimensions();

        // set component width
        app.timeline.setWidth(GLOBAL.width - 40);

        // set zoom
        app.timeline.setGraphWidth(15000);

        // GLOBAL.observer.setTimecode() synchronizes the timecode of all objects
        // that were added as listeners to GLOBAL.observer via GLOBAL.observer.addListener()
        // => random timecode for demonstration
        // milliseconds
        GLOBAL.observer.setTimecode(Math.floor(GLOBAL.duration * (Math.random() * 0.6 + 0.2)));


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
    }
});





