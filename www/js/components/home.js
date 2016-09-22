import m from 'mithril';

import Widget from 'models/widget';

import Toolbox from 'components/toolbox';
import { lookupWidgetComponent } from 'components/widgets';

export default {
  controller: function() {
    this.workspace = Workspace.create();
  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;

    return m('.home-container', [
      m(Toolbox),
      m('.workspace', workspace.widgets.map(widget => {
        return m(lookupWidgetComponent(widget.name()), { widget });
      }))
    ]);
  }
};

window.Widget = Widget;

var Workspace = {
  create: function() {
    var instance = Object.create(this.instance);
    instance.widgets = Widget.query();
    return instance;
  },

  instance: {
    widgets: null
  }
};
