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





