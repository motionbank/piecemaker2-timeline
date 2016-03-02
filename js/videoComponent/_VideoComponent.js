function VideoComponent(_url) {

  var self = this;

  this.el = $('<video id="annotator-video" src="' + _url + '" controls="controls" ></video>');

  this.updateInterval = null;

  this.url = _url;

  this.setTimecode = function(_t) {
    this.el.get(0).currentTime = _t / 1000.0;
  }
  
  this.el.get(0).onplay = function () {
    var video = this;
    self.updateInterval = setInterval(function () {
      var t = parseInt(video.currentTime * 1000, 10);
      if (GLOBAL.observer.getTimecode() !== t) {
        GLOBAL.observer.setTimecode(t, self);
      }
    }, 1000/60);
  }
  
  this.el.get(0).onpause = function () {
    clearInterval(self.updateInterval);
  }

   //this.el.get(0).addEventListener('timeupdate', function(_evt) {
   //  var t = parseInt(this.currentTime * 1000, 10);
   //  if (GLOBAL.observer.getTimecode() !== t) {
   //    GLOBAL.observer.setTimecode(t, self);
   //  }
   //});
}
