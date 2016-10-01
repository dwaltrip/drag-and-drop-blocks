/**
  Wrapper function for handlers for non-standard events that tells mithril to redraw
  This is needed as mithril doesn't know how to handle non-standard events by default
**/

import m from 'mithril';

var counts = { start: 0, end: 0 };

// this is based off of mithril's internal 'autoredraw' function
export default function handleWithRedraw(callback, opts) {
  var isWaitingForRedraw = false;
  var isThrottled = !!opts.redrawThrottle;
  var opts = opts || {};

  var redraw = function() {
    m.endComputation();
    counts.end = counts.end + 1;
    console.log('--- redraw -- isWaitingForRedraw:', isWaitingForRedraw, '-- fn.name:', callback.name,
      `-- start: ${counts.start}, end: ${counts.end}`);
    if (opts.verbose) {
      console.log(`--- redraw --`);
    }
    isWaitingForRedraw = false;
  };

  if (isThrottled) {
    var throttledRedraw = throttle(redraw, opts.redrawThrottle);
  }

  return function(event) {
    console.log('--- isWaitingForRedraw:', isWaitingForRedraw, '-- fn.name', callback.name,
      `-- counts -- start: ${counts.start}, end: ${counts.end}`);
    if (!isWaitingForRedraw) {
      if (opts.verbose) { console.log('--- startComputation'); }
      counts.start = counts.start + 1;
      m.startComputation();
      isWaitingForRedraw = true;
    }
    try {
      return callback.call(this, event);
    } finally {
      if (isThrottled) {
        throttledRedraw();
      } else {
        redraw();
      }
    }
  };
}

// FIX ME 
// FIX ME 
// FIX ME 
// FIX ME 
// FIX ME 
// TODO: throttle isnt working?

function throttle(fn, delay, scope) {
  var delay = delay || 250;
  var lastCalledAt = null;
  var timerId = null;

  return function() {
    var now = (new Date()).getTime();
    var isFirstCall = !lastCalledAt;
    var isThrottleDelayFinished = !isFirstCall && lastCalledAt + delay < now;
    var context = scope || this;

    if (isFirstCall || isThrottleDelayFinished) {
      if (timerId) { clearTimeout(timerId); }
      lastCalledAt = now;
      fn.apply(context, arguments);
    } else {
      timerId = setTimeout(function() {
        lastCalledAt = now;
        fn.apply(context, arguments);
      }, delay);
    }
  };
}
