import m from 'mithril';

import Widget from 'models/widget';
import db from 'db';

import handleWithRedraw from 'lib/m-utils/handle-with-redraw';
import Toolbox from 'components/toolbox'
import { lookupWidgetComponent } from 'components/widgets';

import MetalDragon from 'metal-dragon';

export default {
  controller: function() {
    this.workspace = Workspace.create();
    this.widgetToMove = m.prop();

    this.metalDragon = MetalDragon.create();
    this.createDraggableToolboxWidget = (opts) => {
      return this.metalDragon.createDragItem({
        findElementForDragImage: element => findAncestorWithClass(element, 'widget'),
        onDragend: opts.onDragend,
        group: 'toolbox-widgets',
        eventHandlerDecorator: mouseEventHandlerDecorator
      });
    };

    this.createDraggableWorkspaceWidget = (opts) => {
      return this.metalDragon.createDragItem({
        findElementForDragImage: element => findAncestorWithClass(element, 'widget'),
        onDragend: opts.onDragend,
        group: 'workspace-widgets',
        eventHandlerDecorator: mouseEventHandlerDecorator,
        constraints: {
          getBoundingElement: function(element) {
            return findAncestorWithClass(element, 'workspace')
          }
        }
      });
    };

  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;

    var widgets = workspace.widgets.concat();
    // TODO: don't sort everytime view changes
    widgets.sort((a,b) => a.pos() - b.pos());

    var isDragging = controller.metalDragon.isDragging();

    return m('.home-container', [
      m(Toolbox, { createDragItem: controller.createDraggableToolboxWidget }),
      m('.workspace' + (isDragging ? '.is-dragging' : ''), widgets.map(widget => {
        return m(lookupWidgetComponent(widget.name()), {
          key: widget.uid(),
          widget,
          widgetToMove: controller.widgetToMove,
          isDraggingAWidget: isDragging,
          isInWorkspace: true,
          saveWidgets: () => {
            // TODO: this is not ideal
            widgets.forEach(widget => widget.save({ isBatch: true }));
            db.commit();
          },
          createDragItem: controller.createDraggableWorkspaceWidget
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

// TODO: this still isn't ideal, as it requires that the user of metal-dragon
// knows how the library implementation makes use 'mousemove' and 'mouseup'.
// Perhaps just renaming to 'dragmove' and 'dragend' would work?
function mouseEventHandlerDecorator(eventName, handler) {
  if (eventName == 'mouseup') {
    return handleWithRedraw(handler);
  } else if (eventName === 'mousemove') {
    return handleWithRedraw(handler, { throttleDelayAmount: 100 });
  }
}
