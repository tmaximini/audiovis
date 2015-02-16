'use strict';

var DUMMY_URL = 'https://soundcloud.com/maximini/cat-vibes';

var SC_CLIENT_ID = '96414176b255a0cd49471feed2e61c93';
var SoundCloudAudio = require('soundcloud-audio');
var AudioAnalyser = require('./audio-analyser');
var AudioVisualizer = require('./audio-visualizer');

var scPlayer = new SoundCloudAudio(SC_CLIENT_ID);
var analyser = new AudioAnalyser(scPlayer.audio);
var visualizer = new AudioVisualizer();



// init sound player
// scPlayer.play({ streamUrl: DUMMY_URL });

// OR in other cases you need to load TRACK and resolve it's data
scPlayer.resolve(DUMMY_URL, function (track) {
    if (track) {
        console.error(track);
        // once track is loaded it can be played
        scPlayer.play();
    }
});


// init viz
visualizer.init();
visualizer.draw();

console.log('scPlayer: ', scPlayer.audio);
console.log('analyser: ', AudioAnalyser);
