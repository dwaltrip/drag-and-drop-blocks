/*
  Config function for mithril elements.
  It enables setting handlers for custom (non-standard) events

  Source:
  https://gist.github.com/barneycarroll/f58f1be86ad75f09775c206db2bccbdd
*/

import handleWithRedraw from 'lib/m-utils/handle-with-redraw';

export default (nameOrHash, handler) => {
  return function config(el, isInitialized, context) {
    if (isInitialized) { return; }

    const eventsHash = handler ? { [nameOrHash] : handler } : nameOrHash;

    for (let name in eventsHash) {
      if (eventsHash.hasOwnProperty(name)) {
        el.addEventListener(name, handleWithRedraw(eventsHash[name]));
      }
    }

    context.onunload = () => {
      for (let name in eventsHash) {
        if (eventsHash.hasOwnProperty(name) ) {
          el.removeEventListener(name, eventsHash[name]);
        }
      }
    }
  };
};
