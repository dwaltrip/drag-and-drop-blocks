import m from 'mithril';

import { WidgetComponents } from 'components/widgets';

export default {
  controller: function(params) {
    this.createDragItem = params.createDragItem;
  },
  view: function(controller) {
    var components = Object.keys(WidgetComponents).map(key => WidgetComponents[key]);

    return m('.toolbox', components.map(Component => {
      return m('.toolbox-section', m(Component, {
        createDragItem: controller.createDragItem
      }));
    }));
  }
};
