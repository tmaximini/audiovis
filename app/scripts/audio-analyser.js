'use strict';

var BeatDetektor = require('./beatdetector');

var Analyser = function(audioElement) {

  var self = this;

  // beat detecktor stuff
  var beatDetektor = new BeatDetektor();
  var vu      = new BeatDetektor.modules.vis.VU();
  var bassKick    = new BeatDetektor.modules.vis.BassKick();

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
  var jsProcessor = audioCtx.createScriptProcessor(2048);
  var ftimer  = 0;


  source.connect(analyser);
  analyser.connect(jsProcessor);
  jsProcessor.connect(audioCtx.destination);



  jsProcessor.onaudioprocess =  function(audioProcessingEvent) {
    // Get left channel input. No need for output arrays. They're hooked up
    // directly to the destination, and we're not doing any processing.
    var inputArrayL = audioProcessingEvent.inputBuffer.getChannelData(0);
    // for beatDetektor.js
    beatDetektor.process(audioCtx.currentTime, inputArrayL);
    // for basskick
    bassKick.process(beatDetektor)
    // for the vumeter
    ftimer += beatDetektor.last_update;
    if (ftimer > 1.0 / 24.0) {
      vu.process(beatDetektor, ftimer);
      ftimer = 0;
    }

    var inputBuffer = audioProcessingEvent.inputBuffer;
    // The output buffer contains the samples that will be modified and played
    var outputBuffer = audioProcessingEvent.outputBuffer;

    // Loop through the output channels (in this case there is only one)
    for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      var inputData = inputBuffer.getChannelData(channel);
      var outputData = outputBuffer.getChannelData(channel);

      // Loop through the 4096 samples
      for (var sample = 0; sample < inputBuffer.length; sample++) {
        // make output equal to the same as the input
        outputData[sample] = inputData[sample];

      }
    }
  };

  var maxVol = 0;

  var sampleAudioStream = function() {
      analyser.getByteFrequencyData(self.streamData);
      // calculate an overall volume value
      var total = 0;
      for (var i = 0; i < 80; i++) { // get the volume from the first 80 bins, else it gets too loud with treble
          total += self.streamData[i];
      }
      self.volume = total;

      maxVol = maxVol > total ? maxVol : total;

      if (total > maxVol * 0.9) {
        // console.log('beat: ', total);
      }
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
