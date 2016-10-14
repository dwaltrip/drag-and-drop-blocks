import m from 'mithril';

import Widget from 'models/widget';
import Workspace from 'models/workspace';

import handleWithRedraw from 'lib/m-utils/handle-with-redraw';
import { lookupWidgetComponent } from 'components/widgets';
import ToolboxWidgets from 'components/toolbox-widgets';
import unicode from 'lib/unicode-characters';

import MetalDragon from 'metal-dragon';
import { mithrilifyMetalDragon } from 'lib/m-utils/metal-dragon-helpers';


var TOOLBOX_WIDGETS = 'toolbox-widgets';
var WORKSPACE_WIDGETS = 'workspace-widgets';

window.Workspace = Workspace;

export default {
  controller: function() {
    var workspace = Workspace.query()[0];
    if (!workspace) {
      workspace = Workspace.create({name: 'test workspace' });
    }
    var workspace = this.workspace = workspace;
    var widgetToMove = this.widgetToMove = m.prop();

    this.metalDragon = mithrilifyMetalDragon(MetalDragon.create({ eventHandlerDecorator }));

    this.createToolboxWidgetDragItem = (widgetType)=> {
      return this.metalDragon.createDragItem({
        group: TOOLBOX_WIDGETS,
        itemData: { widgetType },
        dragHandle: 'widget-title',
        boundingContainer: 'widget-editor'
      });
    };

    this.createWorkspaceWidgetDragItem = (widget)=> {
      return this.metalDragon.createDragItem({
        group: WORKSPACE_WIDGETS,
        itemData: { widget },
        dragHandle: 'widget-title',
        boundingContainer: 'widget-editor',
        onDragStart: ()=> widgetToMove(widget),
        onDrop: ()=> widgetToMove(null)
      });
    };

    this.createWorkspaceWidgetDropzone = (widget)=> {
      return this.metalDragon.createDropzone({
        group: 'widget-row',
        accepts: [TOOLBOX_WIDGETS, WORKSPACE_WIDGETS],
        itemData: { widget },
        isEligible: function(dragItem) {
          return dragItem.group === TOOLBOX_WIDGETS ||
            this.getItemData('widget') !== dragItem.getItemData('widget');
        },
        onDrop: function(dragItem) {
          var widget = this.getItemData('widget');
          if (dragItem.group === WORKSPACE_WIDGETS) {
            workspace.insertBefore(widgetToMove(), widget);
          } else {
            var newWidget = workspace.createWidget(dragItem.getItemData('widgetType'))
            workspace.insertBefore(newWidget, widget);
          }
        }
      });
    };

    this.createTrashcanDropzone = ()=> {
      return this.metalDragon.createDropzone({
        accepts: WORKSPACE_WIDGETS,
        group: 'trashcan',
        // TODO: this doesnt allow us to trash toolbox widgets
        onDrop: (dragItem) => workspace.removeWidget(dragItem.getItemData('widget'))
      });
    };

    this.trashcanDropzone = this.createTrashcanDropzone();
    this.toolboxDropzone = this.createTrashcanDropzone();

    // TODO: I should be able to make this attach to the entire workspace, instead of the blank space only?
    // The widget rows should take precedence over the workspace container.
    this.workspaceMarginDZ = this.metalDragon.createDropzone({
      accepts: [WORKSPACE_WIDGETS, TOOLBOX_WIDGETS],
      onDrop: (dragItem)=> {
        if (dragItem.group === WORKSPACE_WIDGETS) {
          workspace.appendWidget(dragItem.getItemData('widget'));
        } else {
          var newWidget = workspace.createWidget(dragItem.getItemData('widgetType'))
          workspace.appendWidget(newWidget);
        }
      }
    });
  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;
    var widgets = workspace.rootWidgets;

    var isDragging = controller.metalDragon.isMidDrag();
    var isTrashcanActive = controller.trashcanDropzone.isUnderDragItem();
    var isToolboxActive = controller.toolboxDropzone.isUnderDragItem();
    var isWorkspaceMarginActive = controller.workspaceMarginDZ.isUnderDragItem() && (
      controller.metalDragon.activeDragItem.group === TOOLBOX_WIDGETS ||
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
      m('.toolbox', { config: controller.toolboxDropzone.attachToElement }, [
        m('.toolbox-header', 'Toolbox'),
        m('.toolbox-widgets', ToolboxWidgets.map(Component => {
          return m('.toolbox-section', m(Component, {
            createDragItem: controller.createToolboxWidgetDragItem
          }))
        }))
      ]),

      // TODO: move this workspace stuff into its own Workspace component
      // also, rename Home component to WidgetEditor component
      m('.workspace', [
        m('.widget-list', widgets.map(widget => {
          return m(lookupWidgetComponent(widget.type()), {
            key: widget.uid(),
            widget,
            workspace,
            widgetToMove: controller.widgetToMove,
            createDragItem: controller.createWorkspaceWidgetDragItem,
            createDropzone: controller.createWorkspaceWidgetDropzone
          });
        })),
        m('.workspace-margin' + (isWorkspaceMarginActive ? '.is-under-drag-item' : ''),
          { config: controller.workspaceMarginDZ.attachToElement }),

        m('.trashcan', { config: controller.trashcanDropzone.attachToElement }, [
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
