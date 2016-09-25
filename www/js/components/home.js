import m from 'mithril';

import Widget from 'models/widget';
import db from 'db';

import Toolbox from 'components/toolbox';
import { lookupWidgetComponent } from 'components/widgets';

export default {
  controller: function() {
    this.workspace = Workspace.create();
    this.widgetToMove = m.prop();
  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;

    var widgets = workspace.widgets.concat();
    // TODO: don't sort everytime view changes
    widgets.sort((a,b) => a.pos() - b.pos());

    var isDraggingClass = controller.widgetToMove() ? '.is-dragging' : '';

    return m('.home-container', [
      m(Toolbox),
      m('.workspace' + isDraggingClass, widgets.map(widget => {
        return m(lookupWidgetComponent(widget.name()), {
          key: widget.uid(),
          widget,
          widgetToMove: controller.widgetToMove,
          saveWidgets: () => {
            // TODO: this is not ideal
            widgets.forEach(widget => widget.save({ isBatch: true }));
            db.commit();
          }
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
