'use strict';



;(function() {

  var canvas, w, h, ctx;
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

  var init = function() {
    canvas = document.getElementById('canvas');
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');

    ctx.save();

    setInterval(updateModifiers, 250);
  };


  var draw = function() {
    rotate();
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
    var zeroOrOne = Math.random() < 0.5 ? 0 : 1;
    ctx[methods[zeroOrOne]](w/2 + getRandomNumber(), h/2 + getRandomNumber(), 50 * (1+modX) , 50 * (1+modX));
    window.requestAnimationFrame(draw);
  };

  init();
  draw();

})();





