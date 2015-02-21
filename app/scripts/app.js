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

// resolve track from soundcloud URL
var resolveSoundcloudUrl = function(url) {
    url = url || DUMMY_URL;
    scPlayer.resolve(url, function (track) {
        if (track) {
            console.log('track playing:', track);
            // once track is loaded it can be played
            scPlayer.play();
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

form.addEventListener('submit', handleFormSubmit, false);
resolveSoundcloudUrl();

// init viz
visualizer.init();
// can be either 'bars', 'freq' or 'rects'
visualizer.visualize(analyser.getAnalyser(), 'bars');
analyser.start();

