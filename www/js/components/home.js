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
window.printAllWidgetInputs = function() {
  var workspace = Workspace.query()[0];
  workspace.rootWidgets.forEach(w => {
    console.log(`${w.type()} -- ${w.uid()} -- isRoot: ${w.isRoot()} -- ${JSON.stringify(w.inputs)}`);
  });
}

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
        useDragElementOverlap: true,
        isEligible: function(dragItem) {
          if (dragItem.group === TOOLBOX_WIDGETS) { return true; }
          var dragWidget = dragItem.getItemData('widget')
          return widget !== dragWidget && !widget.isAncestorOf(dragWidget);
        },
        onDrop: function(dragItem) {
          var dropzoneWidget = this.getItemData('widget');
          if (dragItem.group === WORKSPACE_WIDGETS) {
            var dragWidget = dragItem.getItemData('widget');
            dragWidget.makeRoot();
            workspace.insertAfter(dragWidget, dropzoneWidget);
          } else {
            var newWidget = workspace.createWidget(dragItem.getItemData('widgetType'))
            workspace.insertAfter(newWidget, dropzoneWidget);
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
          var widget = dragItem.getItemData('widget');
          widget.makeRoot();
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
    var widgets = workspace.rootWidgets;

    var isWorkspaceMarginTarget = controller.workspaceMarginDZ.isDropTarget() && (
      controller.metalDragon.activeDragItem.group === TOOLBOX_WIDGETS ||
      !controller.widgetToMove().isLastWidget
    );

    var isOverWidgetRow = controller.metalDragon.isDraggingOverGroup('widget-row') ||
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
            createDropzone: controller.createWorkspaceWidgetDropzone,
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
