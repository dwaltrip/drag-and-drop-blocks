import m from 'mithril';

import Widget from 'models/widget';
import db from 'db';

import handleWithRedraw from 'lib/m-utils/handle-with-redraw';
import Toolbox from 'components/toolbox';
import { lookupWidgetComponent } from 'components/widgets';
import unicode from 'lib/unicode-characters';

import { configForDropzone } from 'lib/m-utils/metal-dragon-helpers';
import MetalDragon from 'metal-dragon';

var TOOLBOX_WIDGET_GROUP = 'toolbox-widgets';
var WORKSPACE_WIDGET_GROUP = 'workspace-widgets';

/* ---------------------------------------------------------------
  TODO:
    The next commit should allow for deleting a widget by dragging
    from the worksapce to the trashcan or to the toolbox.
--------------------------------------------------------------- */

export default {
  controller: function() {
    this.workspace = Workspace.create();
    this.widgetToMove = m.prop();

    this.metalDragon = MetalDragon.create({ eventHandlerDecorator });
    this.createDraggableToolboxWidget = (opts) => {
      return this.metalDragon.createDragItem({
        group: TOOLBOX_WIDGET_GROUP,
        dragHandle: 'widget-title',
        onDrop: opts.onDrop
      });
    };

    this.createDraggableWorkspaceWidget = (opts) => {
      return this.metalDragon.createDragItem({
        group: WORKSPACE_WIDGET_GROUP,
        dragHandle: 'widget-title',
        boundingContainer: 'widget-editor',
        onDragStart: opts.onDragStart,
        onDrop: opts.onDrop
      });
    };

    this.createDropzoneWidget = (opts) => {
      return this.metalDragon.createDropzone({
        accepts: [TOOLBOX_WIDGET_GROUP, WORKSPACE_WIDGET_GROUP],
        onDragEnter: opts.onDragEnter
      })
    };

    this.trashcanDropzone = this.metalDragon.createDropzone({
      accepts: WORKSPACE_WIDGET_GROUP,
      group: 'trashcan',
      onDrop: (dragItem) => {
        var widget = dragItem.getDragData('widget');
        this.workspace.removeWidget(widget);
        // TODO: this line ('reverting' each widget) is not the best. It fixes the bug where
        // when we delete a widget, the widgets we passed over to do so show the swapped pos,
        // even though we never save the swapped pos to the db
        // Another fix would be to save the two widgets that swap positions after each position swap,
        // and then do nothing extra here.
        this.workspace.widgets.forEach(widget => widget.revert());
      }
    });

    this.configTrashcanDropzone = configForDropzone(this.trashcanDropzone);
  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;

    var widgets = workspace.widgets.concat();
    // TODO: don't sort everytime view changes
    widgets.sort((a,b) => a.pos() - b.pos());

    var isDragging = controller.metalDragon.isDragging();
    var isTrashcanActive = controller.trashcanDropzone.isUnderDragItem();

    var widgetEditorClassList = [
      (isDragging ? '.is-dragging' : ''),
      (isTrashcanActive ? '.is-dragging-over-trashcan' : '')
    ].join('')

    return m('.widget-editor' + widgetEditorClassList, [
      m(Toolbox, { createDragItem: controller.createDraggableToolboxWidget }),
      m('.workspace', [
        m('.widget-list', widgets.map(widget => {
          return m(lookupWidgetComponent(widget.name()), {
            key: widget.uid(),
            widget,
            widgetToMove: controller.widgetToMove,
            saveWidgets: ()=> {
              // TODO: this is not ideal
              workspace.widgets.forEach(widget => widget.save({ isBatch: true }));
              db.commit();
            },
            createDropzone: controller.createDropzoneWidget,
            createDragItem: controller.createDraggableWorkspaceWidget
          });
        })),
        m('.trashcan', {
          config: controller.configTrashcanDropzone
        }, [
          m('.arrow', m.trust(unicode.rightArrowWhite)),
          m('.text', m.trust(`${unicode.wasteBasket} Remove`)),
          m('.arrow', m.trust(unicode.leftArrowWhite))
        ])
      ])
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
    widgets: null,

    removeWidget: function(widgetToDelete) {
      this.widgets = this.widgets.filter(w => w !== widgetToDelete);
      widgetToDelete.delete();
    }
  }
};

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
// knows how the library implementation makes use of the low level mouse events.
// Perhaps creating higher level names like 'dragmove', 'dragover', 'dragend', etc would solve this?
function eventHandlerDecorator(eventName, handler) {
  if (['mousedown', 'mouseup', 'mouseenter', 'mouseleave'].indexOf(eventName) > -1) {
    return handleWithRedraw(handler);
  } else if (eventName === 'mousemove') {
    return handleWithRedraw(handler, { throttleDelayAmount: 100 });
  } else {
    throw new Error('mouseEventHandlerDecorator -- invalid event:', eventName)
  }
}
