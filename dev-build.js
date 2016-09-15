var browserify = require('browserify');
var colors = require('colors/safe');
var fs = require('fs');
var notifier = require('node-notifier');

// browserify plugins & transforms
var babelify = require('babelify');
var errorify = require('errorify');
var watchify = require('watchify');

var OUTPATH = '/www/dist/bundle.js';

function notify(message) {
  notifier.notify({
    title: 'Browserify',
    message: message
  });
};

var b = browserify('./www/js/init.js', {
  paths: ['./www/js'],
  cache: {},
  packageCache: {},
  plugin: [watchify]
});

var wasPreviousBuildBroken = false;
b.plugin(errorify, {
  onError: function(err) {
    wasPreviousBuildBroken = true;
    console.error(colors.red('Build broken. Error:'), err.message);
    notify(err.message);
  }
});
b.transform(babelify, { 'presets': ['es2015'] });
b.on('update', buildBundle);
b.on('log', logMessage);

console.log('Building bundle at %s and starting watchify...', OUTPATH);
buildBundle();

function buildBundle() {
  b.bundle().pipe(fs.createWriteStream(__dirname + OUTPATH))
}

function logMessage(msg) {
  if (wasPreviousBuildBroken) {
    wasPreviousBuildBroken = false;
    console.log(colors.green('Build fixed.'));
    notify('Build fixed!');
  }
  console.log(msg);
}
