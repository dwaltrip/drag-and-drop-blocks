
export function removeFromArray(ary, item) {
  var index = ary.indexOf(item);
  if (index > -1) {
    ary.splice(index, 1);
    return true;
  } else {
    return false;
  }
};

var addStylesheetRules = (function() {
  var isFirstCall = true;
  var styleEl;

  return function addStylesheetRules(rules) {
    if (isFirstCall) {
      styleEl = document.createElement('style'),
      document.head.appendChild(styleEl);
      isFirstCall = false;
    }

    var styleSheet = styleEl.sheet;
    rules.forEach(rule => styleSheet.insertRule(rule, styleSheet.cssRules.length));
  }
})();
export { addStylesheetRules };
