var colors = require('colors/safe');
var path = require('path');
var fs = require('fs');
var notifier = require('node-notifier');

// browserify plugins & transforms
var errorify = require('errorify');
var watchify = require('watchify');


// re-use build steps from (non-watchified) build script
var buildSteps = require('./build-js-dev');
var ROOT_DIR = buildSteps.ROOT_DIR;
var OUTPATH = buildSteps.OUTPATH;

// cache and packageCache enable incremental builds in watchify
var b = buildSteps.initBrowserify({ cache: {}, packageCache: {} });

// Setup watchify: automatically rebuild when js source is modified
b.plugin(watchify, {
  ignoreWatch: [
    path.join(ROOT_DIR, '**/node_modules/**'),
    path.join(ROOT_DIR, 'www/styles/*'),
    path.join(ROOT_DIR, 'www/dist/*')
  ]
});
b.on('update', function() { buildSteps.buildBundle(b); });

// Setup errorify: better error reporting when build fails
var wasPreviousBuildBroken = false;
b.plugin(errorify, {
  onError: function(err) {
    wasPreviousBuildBroken = true;
    console.error(colors.red('Build broken. Error:'), err.message);
    notify(err.message);
  }
});
b.on('log', logMessage);

// ES6 -> ES5
buildSteps.setupES6Transpile(b);

// Start the build and watcher
console.log('Building bundle at %s and watching for changes...', OUTPATH);
buildSteps.buildBundle(b);


// utility functions

function logMessage(msg) {
  if (wasPreviousBuildBroken) {
    wasPreviousBuildBroken = false;
    console.log(colors.green('Build fixed.'));
    notify('Build fixed!');
  }
  console.log(msg);
}

function notify(message) {
  notifier.notify({
    title: 'Browserify',
    message: message
  });
};
