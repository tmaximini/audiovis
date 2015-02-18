'use strict';

// @credit: some code taken from http://www.michaelbromley.co.uk/experiments/soundcloud-vis/

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


  this.analyseBpm = function(trackUrl) {
    console.log('analyseBpm: ', trackUrl);
    var offlineContext = new OfflineAudioContext(2,44100*40,44100);

    // Function to identify peaks
    function getPeaksAtThreshold(data, threshold) {
      var peaksArray = [];
      var length = data.length;
      for(var i = 0; i < length;) {
        if (data[i] > threshold) {
          peaksArray.push(i);
          // Skip forward ~ 1/4s to get past this peak.
          i += 10000;
        }
        i++;
      }
      return peaksArray;
    };

    var request = new XMLHttpRequest();
    request.open('GET', trackUrl, true);
    request.responseType = 'arraybuffer';

    console.log('request: ', request);

    request.onload = function() {
      console.log('onload fired!');
      audioCtx.decodeAudioData(request.response, function(buffer) {
        console.log('audio decoded!');
        var audioSource = offlineContext.createBufferSource();
        audioSource.buffer = buffer;
        // Create filter
        var filter = offlineContext.createBiquadFilter();
        filter.type = 'lowpass';

        // Pipe the song into the filter, and the filter into the offline context
        source.connect(filter);
        filter.connect(offlineContext.destination);

        // Schedule the song to start playing at time:0
        source.start(0);

        // Render the song
        offlineContext.startRendering();

        // Act on the result
        offlineContext.oncomplete = function(e) {
          console.log('offline completed');
          // Filtered buffer!
          var filteredBuffer = e.renderedBuffer;

          var peaks,
              initialThresold = 0.9,
              thresold = initialThresold,
              minThresold = 0.3,
              minPeaks = 30;

          do {
            peaks = getPeaksAtThreshold(e.renderedBuffer.getChannelData(0), thresold);
            thresold -= 0.05;
          } while (peaks.length < minPeaks && thresold >= minThresold);

          console.log('peaks: ', peaks);

        };
      });
    };

  };


  // public methods
  this.start = function() {
    this.audioElement.addEventListener('canplaythrough', function() {
      console.log('canplaythrough fired: ');
    }, false);
  };

  this.stop = function() {
    clearInterval(sampleInterval);
  };

  this.getAnalyser = function() {
    return analyser;
  };

};

module.exports = Analyser;
