'use strict';

var DUMMY_URL = 'https://soundcloud.com/maximini/cat-vibes';

var SC_CLIENT_ID = '96414176b255a0cd49471feed2e61c93';
var SoundCloudAudio = require('soundcloud-audio');
var AudioAnalyser = require('./audio-analyser');
var AudioVisualizer = require('./audio-visualizer');

var scPlayer = new SoundCloudAudio(SC_CLIENT_ID);
var analyser = new AudioAnalyser(scPlayer.audio);
var visualizer = new AudioVisualizer();



// resolve track from soundcloud URL
scPlayer.resolve(DUMMY_URL, function (track) {
    if (track) {
        console.log('track playing:', track);
        // once track is loaded it can be played
        scPlayer.play();
    }
});


// init viz
visualizer.init();
visualizer.visualize(analyser.getAnalyser(), 'bars');
analyser.start();

console.log('scPlayer: ', scPlayer.audio);
console.log('analyser: ', AudioAnalyser);
