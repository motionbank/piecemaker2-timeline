function VideoComponent( _url ) {
  
  this.el = $('<video src="' + _url + '" controls="controls" ></video>');
  
  this.url = _url;
  
  this.setTimecode = function () {
    
  }
}