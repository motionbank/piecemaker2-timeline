function VideoComponent( _url ) {
  
  // .currentTime does not work with jquery element?
  this.el = $('<video id="annotator-video" src="' + _url + '" controls="controls" ></video>');
  this.player = null;
  
  this.updateInterval = null;
  
  this.url = _url;
  
  this.init = function () {
    var that = this;
    this.player = document.getElementById("annotator-video");
    
    this.player.onplay = function () {
      that.updateInterval = setInterval(function () {
        GLOBAL.observer.setTimecode( Math.round(that.player.currentTime * 1000), that );
      }, 1000/60);
    }
    
    this.player.onpause = function () {
      clearInterval(that.updateInterval);
    }
    
    // this.player.ontimeupdate = function() {
    //   GLOBAL.observer.setTimecode( Math.round(this.currentTime * 1000) );
    // };
    // var that = this;
    // setInterval(function () {
    //   GLOBAL.observer.setTimecode( Math.round(that.player.currentTime * 1000) );
    // }, 1000/60);
  }
  
  // this.updateTimecode = function ( _tc ) {
  //   GLOBAL.observer.setTimecode( _tc );
  // }
  
  this.setTimecode = function ( _tc, _sender ) {
    if (_sender !== this) {
      this.player.currentTime = _tc/1000;
      this.player.pause();
    }
  }
}