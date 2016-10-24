
// expects M/D/YYYY
export function parseDate(dateString) {
  var parts = dateString.split('/');
  // year, month (zero-based), day
  return new Date(parts[2], parts[0] - 1, parts[1]);
}

export function formatCurrency(num) {
  return parseFloat(num).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
}

export function isUndefOrNull(val) {
  return (typeof val === 'undefined') || (val === null);
}

export function dateInputFormatted(date) {
  if (date) {
    return [
      date.getFullYear(),
      this.padZero(date.getMonth() + 1),
      this.padZero(date.getDate())
    ].join('-');
  }
  return null;
}

export function formatTimeStamp(date) {
  return [
    this.padZero(date.getHours()),
    this.padZero(date.getMinutes()),
    this.padZero(date.getSeconds())
  ].join(':')
}

export function padZero(num, numZeroes) {
  numZeroes = (!numZeroes && numZeroes != 0) ? 1 : numZeroes;
  if (num < 10) {
    return this.repeatStr('0', numZeroes) + num;
  }
  return num;
}

export function transpose(matrix) {
  var width = matrix.length ? matrix.length : 0;
  var height = matrix[0] instanceof Array ? matrix[0].length : 0;

  if(height === 0 || width === 0) { return []; }

  var transposed = [];
  for(var y=0; y<height; y++) {
    transposed[y] = [];
    for(var x=0; x<width; x++) {
      // Save transposed data.
      transposed[y][x] = matrix[x][y];
    }
    transposed[y] = transposed[y].reverse();
  }
  return transposed;
}

export function repeatStr(str, n) {
  return (new Array(n + 1)).join(str);
}

export function escapeStr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function uniq(ary) {
  var uniq = [];
  var seenAlready = {}
  ary.forEach(function(item) {
    if (!seenAlready[item]) {
      uniq.push(item);
      seenAlready[item] = true;
    }
  });
  return uniq;
}

export function partial() {
  var args = argsToArray(arguments);
  var fn = args.shift();
  return function() {
    return fn.apply({}, args.concat(argsToArray(arguments)));
  }
}

export function argsToArray(argumentsObj) {
  return Array.prototype.slice.call(argumentsObj);
}

export function monthName(date) {
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return monthNames[date.getMonth()];
}

export function removeFromArray(ary, item) {
  var index = ary.indexOf(item);
  if (index > -1) {
    ary.splice(index, 1);
    return true;
  } else {
    return false;
  }
}

export function mapByInvoke(ary, fnName) {
  var invokeArgs = argsToArray(arguments).slice(2);
  return ary.map(function(item) {
    return item[fnName].apply(item, invokeArgs);
  });
}

export function filterByInvoke() {
  var invokeArgs = argsToArray(arguments).slice(2);
  return ary.filter(function(item) {
    return item[fnName].apply(item, invokeArgs);
  });
}

/*
  hash:
    object whose values we want to modify
  fn:
    function with signature: function(objKey, valueForKey)
    'fn' should return the updated value for the current 'objKey'
*/
export function mapValues(hash, fn) {
  return Object.keys(hash).reduce(function(newHash, keyName) {
    newHash[keyName] = fn(keyName, hash[keyName]);
    return newHash;
  }, {});
}

var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
export function randBase64String(stringLength) {
  var newUID = '';
  for (var i=0; i<stringLength; i++) {
    newUID += chars[Math.floor(chars.length * Math.random())];
  }
  return newUID;
};

// This returns a new, shuffled copy of the array (it's not in-place)
// Knuth-Fisher-Yates shuffle algorithm: https://blog.codinghorror.com/the-danger-of-naivete/
export function shuffle(originalArray) {
  var array = originalArray.concat();
  for (var i = array.length; i > 0; i--) {
    var randIndex = Math.floor(Math.random() * (i + 1));

    // swap the two array elements
    var tmp = array[i];
    array[i] = array[randIndex];
    array[randIndex] = tmp;
  }
  return array;
}

// Example: myStrings.map(callOnEach('trim'))
export function callOnEach(fnOrFnName) {
  if (typeof fnOrFnName === 'string') {
    var fnName = fnOrFnName;
    return function(objToMap) {
      return objToMap[fnName]();
    };
  } else {
    var fn = fnOrFnName;
    return function(objToMap) {
      fn.call(objToMap)
    }
  }
}

export function merge(obj1, obj2) {
  return [obj1 || {}, obj2 || {}].reduce((newObj, obj) => {
    for (var prop in obj) {
      newObj[prop] = obj[prop]
    }
    return newObj;
  }, {});
}

export function timeit(iterations, testFunction) {
  var results = [];
  var total = 0;
  for (var i = 0; i < iterations; i++) {
    var start = performance.now();
    testFunction();
    var end = performance.now();
    var duration = end - start;
    results.push(duration);
    total += duration;
  }
  var result = {
    results : results,
    total : total,
    avg : total / results.length
  }
  return result;
};
