function VideoComponent(_url) {

  var self = this;
  this.el = $('<div class="component video-component"><video id="annotator-video" src="' + _url + '" controls="controls" ></video></div>');
  this.video = this.el.get(0);

  this.updateInterval = null;

  this.url = _url;
  this.lastCurrentTime = 0;
  this.runLoop = false;


  this.setTimecode = function(_t) {
    this.video.currentTime = _t / 1000.0;
  }

  this.video.onplay = function() {
    self.runLoop = true;
    self.updateLoop();
    console.log("play video");
  }

  this.video.onpause = function() {
    self.runLoop = false;
    // set timecode on pause once to make sure it's right
    self.updateTimecode();
    console.log("stop video");
  }

  this.video.addEventListener('timeupdate', function(_evt) {
    // set timecode on timeupdate only if the video is not playing to prevent loop
    if (!self.isPlaying()) {
      self.updateTimecode();
    }
  });

  // this.video.addEventListener('timeupdate', function(_evt) {
  //  var t = parseInt(this.currentTime * 1000, 10);
  //  if (GLOBAL.observer.getTimecode() !== t) {
  //    GLOBAL.observer.setTimecode(t, self);
  //  }
  // });
  
  this.updateTimecode = function () {
    var t = parseInt(self.video.currentTime * 1000, 10);
    if (GLOBAL.observer.getTimecode() !== t) {
      GLOBAL.observer.setTimecode(t, self);
    }
  }

  this.getCurrentTime = function() {
    return this.video.currentTime;
  }

  this.isPlaying = function() {
    var ct = this.video.currentTime;
    var b = (this.lastCurrentTime < ct && !this.video.paused && !this.video.ended) ? true : false;
    this.lastCurrentTime = ct;
    return b;
  }

  // animation frame

  var fps = 10;
  var now;
  var then = Date.now();
  var interval = 1000 / fps;
  var delta;

  this.updateLoop = function() {
    if (self.runLoop) {
      window.requestAnimationFrame(self.updateLoop);
      now = Date.now();
      delta = now - then;

      if (delta > interval) {
        then = now - (delta % interval);
        self.updateTimecode();
      }
    }
  }
}
