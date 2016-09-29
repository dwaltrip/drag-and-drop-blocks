import m from 'mithril';

import { WidgetComponents } from 'components/widgets';

export default {
  controller: function() {
  },
  view: function() {
    var components = Object.keys(WidgetComponents).map(key => WidgetComponents[key]);

    return m('.toolbox', components.map(c => {
      return m('.toolbox-section', m(c));
    }));
  }
};
