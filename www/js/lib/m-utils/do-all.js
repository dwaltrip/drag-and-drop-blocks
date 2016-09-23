import { argsToArray } from 'lib/utils';

export default function doAll() {
  var fns = argsToArray(arguments).filter(x => x instanceof Function);

  return function doAllHandler() {
    var args = arguments;
    fns.forEach(fn => fn.apply(this, args));
  };
};
