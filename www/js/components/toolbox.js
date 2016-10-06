import m from 'mithril';

import ToolboxWidgets from 'components/toolbox-widgets';


export default {
  controller: function(params) {
    this.createDragItem = params.createDragItem;
  },
  view: function(controller) {
    return m('.toolbox', ToolboxWidgets.map(Component => {
      return m('.toolbox-section', m(Component, {
        createDragItem: controller.createDragItem
      }));
    }));
  }
};
