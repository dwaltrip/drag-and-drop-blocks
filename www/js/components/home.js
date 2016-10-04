import m from 'mithril';

import Widget from 'models/widget';
import db from 'db';

import Toolbox from 'components/toolbox'
import { lookupWidgetComponent } from 'components/widgets';

import MetalDragon from 'metal-dragon';

export default {
  controller: function() {
    this.workspace = Workspace.create();
    this.widgetToMove = m.prop();

    window.metalDragon = this.metalDragon = MetalDragon.create();
    this.createDragItem = (opts) => {
      return this.metalDragon.createDragItem({
        findElementForDragImage: element => findAncestorWithClass(element, 'widget'),
        onDragend: opts.onDragend,
        group: 'widgets'
      });
    };
  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;

    var widgets = workspace.widgets.concat();
    // TODO: don't sort everytime view changes
    widgets.sort((a,b) => a.pos() - b.pos());

    var isDraggingAWidget = !!controller.widgetToMove();
    var isDraggingClass = isDraggingAWidget ? '.is-dragging' : '';

    return m('.home-container', [
      m(Toolbox, { createDragItem: controller.createDragItem }),
      m('.workspace' + isDraggingClass, widgets.map(widget => {
        return m(lookupWidgetComponent(widget.name()), {
          key: widget.uid(),
          widget,
          widgetToMove: controller.widgetToMove,
          isDraggingAWidget,
          isInWorkspace: true,
          saveWidgets: () => {
            // TODO: this is not ideal
            widgets.forEach(widget => widget.save({ isBatch: true }));
            db.commit();
          },
          createDragItem: controller.createDragItem
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

function findAncestorWithClass(el, cls) {
  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}

// for development purposes only
var WidgetNames = Object.keys(Widget.NAMES).map(key => Widget.NAMES[key]);
function createWidgets(n) {
  for(var i=0; i<n; i++) {
    var name = WidgetNames[getRandomInt(0, WidgetNames.length)];
    var widget = Widget.create({ name, data: 'lol', pos: (Widget.maxPos + 1) });
    widget.save();
  }
}
window.createWidgets = createWidgets;
function getRandomInt(min, max) {
  min = Math.ceil(min); max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
