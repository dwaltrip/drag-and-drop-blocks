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

    var widgets = workspace.widgets.concat();
    widgets.sort((a,b) => a.pos() - b.pos());

    var isDraggingClass = controller.isDragging ? '.is-dragging' : '';

    return m('.home-container', [
      m(Toolbox),
      m('.workspace' + isDraggingClass, widgets.map(widget => {
        return m(lookupWidgetComponent(widget.name()), {
          widget,
          ondragstart: function() { controller.isDragging = true; },
          ondragend: function() { controller.isDragging = false; }
        });
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

// for development purposes only
function createWidgets(n) {
  for(var i=0; i<n; i++) {
    var name = Math.random() < 0.5 ? 'widget1' : 'widget2';
    var widget = Widget.create({ name, data: 'lol', pos: 0 });
    widget.save();
  }
}
window.createWidgets = createWidgets;
