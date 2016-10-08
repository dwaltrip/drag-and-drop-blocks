import m from 'mithril';

import Widget from 'models/widget';
import db from 'db';

import handleWithRedraw from 'lib/m-utils/handle-with-redraw';
import { lookupWidgetComponent } from 'components/widgets';
import ToolboxWidgets from 'components/toolbox-widgets';
import unicode from 'lib/unicode-characters';

import { configForDropzone } from 'lib/m-utils/metal-dragon-helpers';
import MetalDragon from 'metal-dragon';

var TOOLBOX_WIDGET_GROUP = 'toolbox-widgets';
var WORKSPACE_WIDGET_GROUP = 'workspace-widgets';


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
        onDrop: ()=> {
          this.widgetToMove(null);
          // TODO: this is strange & pretty hacky
          this.workspace.widgets.forEach(w => w.dropzone.enable());
        }
      });
    };

    this.createTrashcanDropzone = ()=> {
      return this.metalDragon.createDropzone({
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
    };

    this.trashcanDropzone = this.createTrashcanDropzone();
    this.toolboxDropzone = this.createTrashcanDropzone();

    this.configTrashcanDropzone = configForDropzone(this.trashcanDropzone);
    this.configToolboxDropzone = configForDropzone(this.toolboxDropzone);
  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;
    var widgets = workspace.widgets;

    var isDragging = controller.metalDragon.isMidDrag();
    var isTrashcanActive = controller.trashcanDropzone.isUnderDragItem();
    var isToolboxActive = controller.toolboxDropzone.isUnderDragItem();
    var isOverWidgetRow = controller.metalDragon.isDraggingOverGroup('widget-row');

    var widgetEditorClassList = [
      (isDragging ? '.is-dragging' : ''),
      (isTrashcanActive ? '.is-dragging-over-trashcan' : ''),
      (isToolboxActive ? '.is-dragging-over-toolbox' : ''),
      (isOverWidgetRow ? '.is-dragging-over-widget-row' : '')
    ].join('')

    return m('.widget-editor.no-text-select' + widgetEditorClassList, [
      m('.toolbox', { config: controller.configToolboxDropzone }, [
        m('.toolbox-header', 'Toolbox'),
        m('.toolbox-widgets', ToolboxWidgets.map(Component => {
          return m('.toolbox-section', m(Component, {
            createDragItem: controller.createDraggableToolboxWidget
          }))
        }))
      ]),

      m('.workspace', [
        m('.widget-list', widgets.map(widget => {
          return m(lookupWidgetComponent(widget.name()), {
            key: widget.uid(),
            widget,
            widgetToMove: controller.widgetToMove,
            moveSelectedWidgetInFrontOf: function(markerWidget) {
              var min = markerWidget.isFirstWidget ? markerWidget.pos() - 1 :
                markerWidget.prevWidget.pos();
              var max = markerWidget.pos();
              var newPos = (min + max) / 2.0;
              controller.widgetToMove().pos(newPos);
              controller.widgetToMove().save();
              workspace.sortWidgets();
            },
            metalDragon: controller.metalDragon,
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
    instance.sortWidgets();
    return instance;
  },

  instance: {
    widgets: null,

    removeWidget: function(widgetToDelete) {
      this.widgets = this.widgets.filter(w => w !== widgetToDelete);
      widgetToDelete.delete();
    },

    sortWidgets: function() {
      this.widgets.sort((a,b) => a.pos() - b.pos());
      this.widgets.forEach((widget, index)=> {
        widget.prevWidget = widget.nextWidget = null;
        widget.isFirstWidget = widget.isLastWidget = false;

        if (index > 0) {
          widget.prevWidget = this.widgets[index - 1];
        } else {
          widget.isFirstWidget = true;
        }

        if (index < (this.widgets.length - 1)) {
          widget.nextWidget = this.widgets[index + 1];
        } else {
          widget.isLastWidget = true;
        }
        // re-normalize pos values to integers (preserving order)
        widget.pos(index + 1);
        widget.save({ isBatch: true });
      });
      db.commit();
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
