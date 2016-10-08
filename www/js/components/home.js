import m from 'mithril';

import Widget from 'models/widget';
import Workspace from 'models/workspace';

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
        onDragStart: opts.onDragStart
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
        }
      });
    };

    this.trashcanDropzone = this.createTrashcanDropzone();
    this.toolboxDropzone = this.createTrashcanDropzone();
    this.workspaceMarginDZ = this.metalDragon.createDropzone({
      accepts: [WORKSPACE_WIDGET_GROUP, TOOLBOX_WIDGET_GROUP],
      onDrop: (dragItem)=> {
        if (dragItem.group === WORKSPACE_WIDGET_GROUP) {
          var widget = dragItem.getDragData('widget');
          widget.pos(Widget.maxPos + 1);
          widget.save();
          workspace.sortWidgets();
        } else {
          var newWidget = workspace.createWidget(dragItem.getDragData('widgetName'))
          workspace.appendWidget(newWidget);
        }
      }
    });

    this.configTrashcanDropzone = configForDropzone(this.trashcanDropzone);
    this.configToolboxDropzone = configForDropzone(this.toolboxDropzone);
    this.configWorkspaceMarginDZ = configForDropzone(this.workspaceMarginDZ);
  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;
    var widgets = workspace.widgets;

    var isDragging = controller.metalDragon.isMidDrag();
    var isTrashcanActive = controller.trashcanDropzone.isUnderDragItem();
    var isToolboxActive = controller.toolboxDropzone.isUnderDragItem();
    var isWorkspaceMarginActive = controller.workspaceMarginDZ.isUnderDragItem() && (
      controller.metalDragon.activeDragItem.group === TOOLBOX_WIDGET_GROUP ||
      !controller.widgetToMove().isLastWidget
    );

    var isOverWidgetRow = controller.metalDragon.isDraggingOverGroup('widget-row') ||
      isWorkspaceMarginActive;

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
            workspace,
            widgetToMove: controller.widgetToMove,
            metalDragon: controller.metalDragon,
            createDragItem: controller.createDraggableWorkspaceWidget
          });
        })),
        m('.workspace-margin' + (isWorkspaceMarginActive ? '.is-under-drag-item' : ''),
          { config: controller.configWorkspaceMarginDZ }),

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
