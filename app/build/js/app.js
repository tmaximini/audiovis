(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var DUMMY_URL = 'https://soundcloud.com/maximini/cat-vibes';

var DUMMY_SHORT = 'https://soundcloud.com/audiowerner/schlamm';

var SC_CLIENT_ID = '96414176b255a0cd49471feed2e61c93';
var SoundCloudAudio = require('soundcloud-audio');
var AudioAnalyser = require('./audio-analyser');
var AudioVisualizer = require('./audio-visualizer');

var scPlayer = new SoundCloudAudio(SC_CLIENT_ID);
var analyser = new AudioAnalyser(scPlayer.audio);
var visualizer = new AudioVisualizer();



// resolve track from soundcloud URL
// scPlayer.resolve(DUMMY_URL, function (track) {
//     if (track) {
//         // once track is loaded it can be played
//         scPlayer.play();
//     }
// });

// resolve track from soundcloud URL
scPlayer.resolve(DUMMY_SHORT, function (track) {
    var url = track.stream_url || track.tracks[0].stream_url;
    if (track) {
        analyser.analyseBpm(url + '?client_id=' + SC_CLIENT_ID);
    }
});


// init viz
visualizer.init();
visualizer.visualize(analyser.getAnalyser(), 'frequency');
analyser.start();

},{"./audio-analyser":2,"./audio-visualizer":3,"soundcloud-audio":4}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
'use strict';

// https://github.com/mdn/voice-change-o-matic/blob/gh-pages/scripts/app.js#L128-L205

var Visualizer = function() {

  var self = this;

  var bufferLength = 512;

  var canvas, w, h, ctx, drawVisual;
  var counter = 0;

  // modifier vars
  var modX, modY = 1;

  var methods = ['fillRect', 'strokeRect'];
  var colors = ['#D6ADD5', '#A9D3AB', '#7AABD4', '#FED37F', '#F58E8E', '#D6D6D6', '#D6D6D6'];

  var getRandomNumber = function(options) {
    options = options || {};
    options.range = options.range || w/2;
    options.includeNegative = options.includeNegative === undefined ? true : options.includeNegative;
    var posOrNeg = Math.random() < 0.5 ? -1 : 1;
    var rndm = Math.random() * options.range;
    return options.includeNegative ? rndm * posOrNeg : rndm;
  };

  // hacky, but so we don't have to deal with rotation on clearRect
  var clearAll = function() {
    ctx.canvas.width = ctx.canvas.width;
  };

  var rotate = function() {
    if (counter % 180 === 0) clearAll();
    ctx.translate(w/2, h/2); // set canvas context to center
    var rndm = getRandomNumber({ range: 1, includeNegative: false });
    ctx.rotate(Math.PI / 180 * 5); // 1/2 a degree
    ctx.translate(-w/2, -h/2);
  };

  var updateModifiers = function() {
    //clearAll();
    counter += 5;
    modX = getRandomNumber({ range: 2 });
  };

  this.setBufferLength = function(length) {
    bufferLength = length;
  };

  this.init = function() {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    ctx.save();
    setInterval(updateModifiers, 250);
  };

  this.visualize = function(analyser, visMode) {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    analyser.fftSize = 2048;
    var bufferLength = analyser.fftSize;
    console.log(bufferLength);
    var dataArray = new Uint8Array(bufferLength);

    ctx.clearRect(0, 0, h, w);

    function drawRects() {
      rotate();
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
      var zeroOrOne = Math.random() < 0.5 ? 0 : 1;
      ctx[methods[zeroOrOne]](w/2 + getRandomNumber(), h/2 + getRandomNumber(), 50 * (1+modX) , 50 * (1+modX));
      drawVisual = window.requestAnimationFrame(drawRects);
    };

    function drawBars() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      drawVisual = requestAnimationFrame(drawBars);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.fillRect(0, 0, w, h);

      var barWidth = (w / bufferLength) * 2.5;
      var barHeight;
      var x = 0;

      for (var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 2;
        ctx.fillStyle = 'rgb(50,50,' + (barHeight / 2) + ')';
        ctx.fillRect(x,h-barHeight/2,barWidth,barHeight/2);
        x += barWidth + 1;
      }
    };

    function drawFrequency() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      drawVisual = requestAnimationFrame(drawFrequency);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(50, 120, 50)';
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(0, 0, 0)';

      ctx.beginPath();

      var sliceWidth = (h * 1.0 / bufferLength) * (w / bufferLength) * 2;
      var x = 0;

      // go over spectrum and draw line
      for(var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128.0;
        var y = v * h/2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height/2);
      ctx.stroke();
    };

    switch(visMode) {
      case 'rect':
        drawRects();
        break;
      case 'frequency':
        drawFrequency();
        break;
      case 'bars':
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        drawBars();
        break;
      default:
        drawFrequency();
    }

  }

};

module.exports = Visualizer;






},{}],4:[function(require,module,exports){
'use strict';

function SoundCloud (clientId) {
    if (!(this instanceof SoundCloud)) {
        return new SoundCloud(clientId);
    }

    if (!clientId) {
        throw new Error('SoundCloud API clientId is required, get it - https://developers.soundcloud.com/');
    }

    this._clientId = clientId;
    this._baseUrl = 'http://api.soundcloud.com';

    this.playing = false;
    this.duration = 0;

    this.audio = document.createElement('audio');
}

SoundCloud.prototype.resolve = function (url, callback) {
    if (!url) {
        throw new Error('SoundCloud track or playlist url is required');
    }

    url = this._baseUrl+'/resolve.json?url='+url+'&client_id='+this._clientId;

    this._jsonp(url, function (data) {
        if (data.tracks) {
            this._playlist = data;
        } else {
            this._track = data;
        }

        this.duration = data.duration/1000; // convert to seconds
        callback(data);
    }.bind(this));
};

SoundCloud.prototype._jsonp = function (url, callback) {
    var target = document.getElementsByTagName('script')[0] || document.head;
    var script = document.createElement('script');

    var id = 'jsonp_callback_'+Math.round(100000*Math.random());
    window[id] = function (data) {
        if (script.parentNode) {
            script.parentNode.removeChild(script);
        }
        window[id] = function () {};
        callback(data);
    };

    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + id;
    target.parentNode.insertBefore(script, target);
};

SoundCloud.prototype.on = function (e, callback) {
    this.audio.addEventListener(e, callback, false);
};

SoundCloud.prototype.off = function (e, callback) {
    this.audio.removeEventListener(e, callback);
};

SoundCloud.prototype.play = function (options) {
    options = options || {};
    var src;

    if (options.streamUrl) {
        src = options.streamUrl;
    } else if (this._playlist) {
        var length = this._playlist.tracks.length;
        if (length) {
            this._playlistIndex = options.playlistIndex || 0;

            // be silent if index is out of range
            if (this._playlistIndex >= length || this._playlistIndex < 0) {
                this._playlistIndex = 0;
                return;
            }
            src = this._playlist.tracks[this._playlistIndex].stream_url;
        }
    } else if (this._track) {
        src = this._track.stream_url;
    }

    if (!src) {
        throw new Error('There is no tracks to play, use `streamUrl` option or `load` method');
    }

    src += '?client_id='+this._clientId;

    if (src !== this.audio.src) {
        this.audio.src = src;
    }

    this.playing = src;
    this.audio.play();
};

SoundCloud.prototype.pause = function () {
    this.audio.pause();
    this.playing = false;
};

SoundCloud.prototype.next = function () {
    if (this._playlist && this._playlist.tracks.length) {
        this.play({playlistIndex: ++this._playlistIndex});
    }
};

SoundCloud.prototype.previous = function () {
    if (this._playlist && this._playlist.tracks.length) {
        this.play({playlistIndex: --this._playlistIndex});
    }
};

SoundCloud.prototype.seek = function (e) {
    if (!this.audio.readyState) {
        return false;
    }
    var percent = e.offsetX / e.target.offsetWidth || (e.layerX - e.target.offsetLeft) / e.target.offsetWidth;
    this.audio.currentTime = percent * (this.audio.duration || 0);
};

module.exports = SoundCloud;

},{}]},{},[1]);
