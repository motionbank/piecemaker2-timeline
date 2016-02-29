function VideoComponent( _url ) {

    var self = this;
  
  this.el = $('<video src="' + _url + '" controls="controls" ></video>');
  
  this.url = _url;
  
  this.setTimecode = function ( _t ) {
    this.el.get(0).currentTime = _t / 1000.0;
  }

    this.el.get(0).addEventListener('timeupdate',function(_evt){
        var t = parseInt(this.currentTime * 1000,10);
        if (GLOBAL.observer.getTimecode() !== t) {
            GLOBAL.observer.setTimecode(t,self);
        }
    });
}