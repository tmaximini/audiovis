'use strict';

var Analyser = function(audioElement) {

  var self = this;

  // public properties
  this.audioElement = audioElement;
  this.volume = 0;
  this.streamData = new Uint8Array(128);

  var THRESHHOLD = 0.3;

  var analyser,
    sampleInterval;

  var audioCtx = new (window.AudioContext || window.webkitAudioContext);

  if (!audioCtx) {
    throw new Error('Audio Context could not be set up.');
  }

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  // wire up analyser
  var source = audioCtx.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  var sampleAudioStream = function() {
      analyser.getByteFrequencyData(self.streamData);
      // calculate an overall volume value
      var total = 0;
      for (var i = 0; i < 80; i++) { // get the volume from the first 80 bins, else it gets too loud with treble
          total += self.streamData[i];
      }
      self.volume = total;
  };

  // public methods
  this.start = function() {
    sampleInterval = setInterval(sampleAudioStream, 20);
  };

  this.stop = function() {
    clearInterval(sampleInterval);
  };

  this.getAnalyser = function() {
    return analyser;
  };

};

module.exports = Analyser;
