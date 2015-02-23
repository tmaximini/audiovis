'use strict';

var BeatDetector = require('./webaudiox.beat-detector');

var Analyser = function(audioElement) {

  var self = this;

  // public properties
  this.audioElement = audioElement;
  this.volume = 0;
  this.streamData = new Uint8Array(128);

  var THRESHHOLD = 0.3;

  var analyser,
    beatDetector,
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

  var maxVol = 0;

  var sampleAudioStream = function() {
      beatDetector.update(1/60);
  };

  // public methods
  this.start = function(onBeatCallback) {
    if (!onBeatCallback) {
      onBeatCallback = function() {
        console.log('beat');
      }
    }
    sampleInterval = setInterval(sampleAudioStream, 20);
    beatDetector = new BeatDetector(analyser, onBeatCallback);
  };

  this.stop = function() {
    clearInterval(sampleInterval);
  };

  this.getAnalyser = function() {
    return analyser;
  };

};

module.exports = Analyser;
