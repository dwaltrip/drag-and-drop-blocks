import m from 'mithril';

import { dateInputFormatted, formatCurrency, isUndefOrNull  } from 'lib/utils';

export default {
  // usage: { postSave: helpers.thenRouteTo('/') }
  thenRouteTo: function(route) {
    return function() {
      m.route(route);
    }
  },

  cssClassMaybe: function(klass) {
    if (isUndefOrNull(klass) || klass === '') {
      return '';
    } else {
      return '.' + klass;
    }
  },

  // assumes amounts are stored as integers representing number of cents
  // TODO: handle strange values like '--..'
  currencyProp: function(prop) {
    return function(val) {
      if (arguments.length > 0) {
        if (val !== 0 && !val) {
          prop(null);
        } else {
          prop(val * 100).toFixed();
        }
      }

      if (isUndefOrNull(prop())) {
        return null;
      } else {
        return formatCurrency(prop() / 100);
      }
    }
  },

  callWithValue: function(callback) {
    return function(event) {
      return callback(event.target.value);
    }
  },

  // for use with <input type="date">
  dateProp: function(prop) {
    return function(val) {
      if (arguments.length > 0) {
        if (!val) {
          prop(null);
        } else {
          var parts = val.split('-');
          var year = parts[0];
          var month = parseInt(parts[1]) - 1;
          var day = parts[2];
          prop(new Date(year, month, day));
        }
      }
      return dateInputFormatted(prop());
    }
  },

  // for use with <input type="number">
  numProp: function(prop, params) {
    params = params || {};
    return function(val) {
      if (arguments.length > 0) {
        var num = parseInt(val);
        if (!isNaN(num)) {
          var aboveMin = isUndefOrNull(params.min) ||
            params.min <= num;
          var belowMax = isUndefOrNull(params.max) ||
            num <= params.max;
          if (aboveMin && belowMax) {
            prop(num);
          }
        }
      }
      return prop();
    }
  },

  readOnlyProp: function(prop) {
    // passing a new 'val' does nothing
    return function(val) {
      return prop();
    };
  },

  buildLocalStorageProp: function(name) {
    var key = 'local-storage-prop:' + name;

    return function(value) {
      if (arguments.length > 0) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
      return JSON.parse(window.localStorage.getItem(key));
    };
  },

  textInput: function(prop, params) {
    params = params || {};
    var attrs = getInputAttrs(prop, params);
    attrs.type = 'text';
    if (params.placeholder) {
      attrs.placeholder = params.placeholder;
    }
    return m('input.text-input' + (params.classes || ''), attrs);
  },

  passwordInput: function(prop, params) {
    params = params || {};
    var attrs = getInputAttrs(prop, params);
    attrs.type = 'password';
    return m('input.text-input' + (params.classes || ''), attrs);
  },

  numberInput: function(prop, classes) {
    return m('input' + (classes || ''), {
      type: 'number', value: prop(),
      oninput: m.withAttr('value', prop)
    });
  },

  setFocusInitially: function(elem, isInitialized) {
    if (!isInitialized) {
      elem.focus();
    }
  },

  // UI event utils

  ifEnterKeyThen: function(cb) {
    return function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        cb();
        return false;
      } else {
        m.redraw.strategy("none");
      }
    }
  }
};

function getInputAttrs(prop, params) {
  params = params || {};
  var attrs = {
    value: prop() || '',
    oninput: m.withAttr('value', prop),
    config: params.config || null
  };
  for(var ev in (params.events || {})) {
    attrs[ev] = params.events[ev];
  }
  return attrs;
}
