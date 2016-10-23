import m from 'mithril';

import Widget from 'models/widget'
import Workspace from 'models/workspace';

import handleWithRedraw from 'lib/m-utils/handle-with-redraw';
import WidgetComponent from 'components/widget';
import ToolboxWidget from 'components/toolbox-widget';

import unicode from 'lib/unicode-characters';
import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';

import MetalDragon from 'metal-dragon';
import { mithrilifyMetalDragon } from 'lib/m-utils/metal-dragon-helpers';


export default {
  controller: function() {
    var workspace = Workspace.query()[0];
    if (!workspace) {
      workspace = Workspace.create({name: 'test workspace' });
    }
    var workspace = this.workspace = workspace;
    var widgetToMove = this.widgetToMove = m.prop();

    window.metalDragon = this.metalDragon = mithrilifyMetalDragon(MetalDragon.create({ eventHandlerDecorator }));

    this.createToolboxWidgetDragItem = (widgetType)=> {
      return this.metalDragon.createDragItem({
        group: TOOLBOX_WIDGETS,
        itemData: { widgetType },
        dragHandle: 'widget-title',
        boundingContainer: 'widget-editor',
        // TODO: is there a better name than 'targetZone'?
        targetZone: { top: 0, left: 0, height: 20, width: 25 }
      });
    };

    this.createWorkspaceWidgetDragItem = (widget)=> {
      return this.metalDragon.createDragItem({
        group: WORKSPACE_WIDGETS,
        itemData: { widget },
        dragHandle: 'widget-title',
        targetZone: { top: 0, left: 0, height: 10, width: 25 },
        onDragStart: ()=> widgetToMove(widget),
        onDrop: ()=> widgetToMove(null)
      });
    };

    this.createTrashcanDropzone = ()=> {
      return this.metalDragon.createDropzone({
        accepts: WORKSPACE_WIDGETS,
        group: 'trashcan',
        // TODO: this doesnt allow us to trash toolbox widgets
        onDrop: (dragItem) => {
          var dragWidget = dragItem.getItemData('widget')
          dragWidget.disconnect();
          dragWidget.delete();
        }
      });
    };

    this.trashcanDropzone = this.createTrashcanDropzone();
    this.toolboxDropzone = this.createTrashcanDropzone();

    // TODO: rename this to 'bottomOfListDropzone'
    this.workspaceMarginDZ = this.metalDragon.createDropzone({
      accepts: [WORKSPACE_WIDGETS, TOOLBOX_WIDGETS],
      onDrop: (dragItem)=> {
        if (dragItem.group === WORKSPACE_WIDGETS) {
          var widget = dragItem.getItemData('widget');
          widget.disconnect();
          workspace.appendWidget(widget);
        } else {
          var newWidget = workspace.createWidget(dragItem.getItemData('widgetType'))
          workspace.appendWidget(newWidget);
        }
      }
    });
  },

  // TODO: clean up this view
  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;
    var widgets = workspace.getWidgets();

    var isWorkspaceMarginTarget = controller.workspaceMarginDZ.isDropTarget() && (
      controller.metalDragon.activeDragItem.group === TOOLBOX_WIDGETS ||
      !controller.widgetToMove().isLastWidget()
    );

    var isOverWidgetRow = controller.metalDragon.isDraggingOverGroup(MOVE_WIDGET) ||
      isWorkspaceMarginTarget;

    var widgetEditorClassList = [
      (controller.metalDragon.isMidDrag() ? '.is-dragging' : ''),
      (controller.trashcanDropzone.isDropTarget() ? '.is-targeting-trashcan' : ''),
      (controller.toolboxDropzone.isDropTarget() ? '.is-targeting-toolbox' : ''),
      (isOverWidgetRow ? '.is-targeting-widget-row' : '')
    ].join('')

    return m('.widget-editor.no-text-select' + widgetEditorClassList, [
      m('.toolbox', { config: controller.toolboxDropzone.attachToElement }, [
        m('.toolbox-header', 'Toolbox'),
        m('.toolbox-widgets', Widget.types.map(widgetType => {
          return m('.toolbox-section', m(ToolboxWidget, {
            widgetType,
            createDragItem: controller.createToolboxWidgetDragItem
          }))
        }))
      ]),

      // TODO: move this workspace stuff into its own Workspace component
      // also, rename Home component to WidgetEditor component
      m('.workspace', [
        m('.widget-list', widgets.map(widget => {
          return m(WidgetComponent, {
            key: widget.uid(),
            widget,
            workspace,
            widgetToMove: controller.widgetToMove,
            createDragItem: controller.createWorkspaceWidgetDragItem,
            metalDragon: controller.metalDragon,
            isTargetingListEnd: isWorkspaceMarginTarget
          });
        })),

        m('.workspace-margin', { config: controller.workspaceMarginDZ.attachToElement }),

        m('.trashcan', { config: controller.trashcanDropzone.attachToElement }, [
          m('.arrow', m.trust(unicode.rightArrowWhite)),
          m('.text', m.trust(`${unicode.wasteBasket} Remove`)),
          m('.arrow', m.trust(unicode.leftArrowWhite))
        ])
      ])
    ]);
  }
};

window.globals = (window.globals || {});
window.globals.Widget = Widget;

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
