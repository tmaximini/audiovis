(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var DUMMY_URL = 'https://soundcloud.com/moltenmoods/molten-moods-2-preview-1';
var SC_CLIENT_ID = '96414176b255a0cd49471feed2e61c93';
var SoundCloudAudio = require('soundcloud-audio');
var AudioAnalyser = require('./audio-analyser');
var AudioVisualizer = require('./audio-visualizer');

var scPlayer = new SoundCloudAudio(SC_CLIENT_ID);
var analyser = new AudioAnalyser(scPlayer.audio);
var visualizer = new AudioVisualizer();

var form = document.querySelector('form');
var switches = document.querySelectorAll('.switcher span.switch');
var pause = document.querySelector('.switcher .pause');
var play = document.querySelector('.switcher .play');

var VIZ_TYPES = ['bars', 'freq', 'rects'];

// resolve track from soundcloud URL
var resolveSoundcloudUrl = function(url) {
    url = url || DUMMY_URL;
    scPlayer.resolve(url, function (track) {
        if (track) {
            console.log('track playing:', track);
            // once track is loaded it can be played
            scPlayer.play();
            pause.addEventListener('click', scPlayer.pause.bind(scPlayer), false);
            play.addEventListener('click', scPlayer.play.bind(scPlayer), false);
        }
    });
};

var handleFormSubmit = function(e) {
    e.preventDefault();
    var scInput = document.getElementById('soundcloud-track-url');
    if (scInput && scInput.value && /soundcloud/.test(scInput.value.toLowerCase())) {
        resolveSoundcloudUrl(scInput.value);
    }
    return false;
};

var setViz = function(type) {
    visualizer.visualize(analyser.getAnalyser(), type);
};


/**
 * EVENT HANDLERS
 */
form.addEventListener('submit', handleFormSubmit, false);
for (var i = 0; i < switches.length; i++) {
    switches[i].addEventListener('click', setViz.bind(null, VIZ_TYPES[i]), false);
}



// init sound
resolveSoundcloudUrl();
// init viz
visualizer.init();
// can be either 'bars', 'freq' or 'rects'
visualizer.visualize(analyser.getAnalyser(), 'bars');
// can take a onBeat callback as first argument
analyser.start();


},{"./audio-analyser":2,"./audio-visualizer":3,"soundcloud-audio":5}],2:[function(require,module,exports){
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
      analyser.getByteFrequencyData(self.streamData);
      beatDetector.update(1/60);
  };

  // public methods
  this.start = function(onBeatCallback) {
    if (!onBeatCallback) {
      onBeatCallback = function() {
        console.log('beat');
      }
    }
    sampleInterval = setInterval(sampleAudioStream, 1);
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

},{"./webaudiox.beat-detector":4}],3:[function(require,module,exports){
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
    canvas.setAttribute('class', 'audioviz-canvas');
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
        barHeight = dataArray[i];
        ctx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
        ctx.fillRect(x,h-barHeight/2,barWidth,barHeight/2);
        x += barWidth + 1;
      }
    };

    function drawFrequency() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      drawVisual = requestAnimationFrame(drawFrequency);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(200, 200, 200)';
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(0, 0, 0)';

      ctx.beginPath();

      var sliceWidth = (h * 1.0 / bufferLength) * (w / bufferLength * 2);
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
      case 'rects':
        drawRects();
        break;
      case 'freq':
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
// @namespace defined WebAudiox namespace
var WebAudiox = WebAudiox || {};

/**
 * display an analyser node in a canvas
 * * See http://www.airtightinteractive.com/2013/10/making-audio-reactive-visuals/
 *
 * @param  {AnalyserNode} analyser     the analyser node
 * @param  {Number}   smoothFactor the smooth factor for smoothed volume
 */
WebAudiox.AnalyserBeatDetector  = function(analyser, onBeatCallback) {
  // arguments default values
  this.holdTime = 0.33;
  this.decayRate = 0.9;
  this.minVolume = 0.65;
  this.frequencyBinCount = 80;

  var holdingTime = 0;
  var threshold = this.minVolume;
  this.update = function(delta) {
    var rawVolume = WebAudiox.AnalyserBeatDetector.compute(analyser, this.frequencyBinCount);
    if ( holdingTime > 0) {
      holdingTime -= delta;
      holdingTime = Math.max(holdingTime, 0);
    }

    else if (rawVolume > threshold) {
      console.info(rawVolume);
      onBeatCallback();
      holdingTime = this.holdTime;
      threshold = rawVolume * 1.1;
      threshold = Math.max(threshold, this.minVolume);
    }
    else {
      threshold *= this.decayRate;
      threshold = Math.max(threshold, this.minVolume);
    }
  };
}

/**
 * do a average on a ByteFrequencyData from an analyser node
 * @param  {AnalyserNode} analyser the analyser node
 * @param  {Number} width    how many elements of the array will be considered
 * @param  {Number} offset   the index of the element to consider
 * @return {Number}          the ByteFrequency average
 */
WebAudiox.AnalyserBeatDetector.compute  = function(analyser, width, offset){
  // handle paramerter
  width = width !== undefined ? width : analyser.frequencyBinCount;
  offset = offset !== undefined ? offset : 0;
  // inint variable
  var freqByte = new Uint8Array(analyser.frequencyBinCount);
  // get the frequency data
  analyser.getByteFrequencyData(freqByte);
  // compute the sum
  var sum = 0;
  for(var i = offset; i < offset+width; i++) {
    sum += freqByte[i];
  }
  // compute the amplitude
  var amplitude = sum / (width*256-1);
  // return amplitude
  return amplitude;
};

module.exports = WebAudiox.AnalyserBeatDetector;



},{}],5:[function(require,module,exports){
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
