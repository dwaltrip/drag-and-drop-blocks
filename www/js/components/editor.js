import m from 'mithril';
import MetalDragon from 'metal-dragon';
import { mithrilifyMetalDragon } from 'lib/m-utils/metal-dragon-helpers';

import Widget from 'models/widget'
import Workspace from 'models/workspace';

import handleWithRedraw from 'lib/m-utils/handle-with-redraw';
import { merge } from 'lib/utils';
import ToolboxWidget from 'components/toolbox-widget';
import WorkspaceComponent from 'components/workspace';
import { TOOLBOX_WIDGETS, WORKSPACE_WIDGETS, MOVE_WIDGET } from 'app-constants';

export default {
  controller: function() {
    var self = this;
    var workspace = Workspace.query()[0];
    if (!workspace) {
      workspace = Workspace.create({name: 'test workspace' });
    }
    var workspace = this.workspace = workspace;

    this.selectionDetails = m.prop({
      widgets: [],
      widgetUIDs: {},
      isMultiSelect: false
    });

    this.selectWidgets = (opts)=> {
      if (opts) {
        var isMultiSelect = opts.isMultiSelect || false;
        var widget = opts.widget;
        if (isMultiSelect) {
          var widgets = widget.getRestOfParentList();
        } else {
          var widgets = widget ? [widget] : [];
        }
        var widgetUIDs = {};
        widgets.forEach(widget => widgetUIDs[widget.uid()] = true);
        this.selectionDetails({ widgets, widgetUIDs, isMultiSelect });
      } else {
        this.selectionDetails({ widgets: [], widgetUIDs: {}, isMultiSelect: false });
      }
    };

    this.metalDragon = mithrilifyMetalDragon(MetalDragon.create({ eventHandlerDecorator }));

    this.createToolboxWidgetDragItem = (widgetType)=> this.metalDragon.createDragItem({
      group: TOOLBOX_WIDGETS,
      itemData: { widgetType },
      dragHandle: 'widget-title',
      // boundingContainer: 'widget-editor',
      // TODO: is there a better name than 'targetZone'?
      targetZone: { top: 0, left: 0, height: 10, width: 25 },
      onDragStart: ()=> this.selectWidgets(null),
      afterDrop: function() {
        self.selectWidgets({ widget: this.getDragData('newWidget') });
      }
    });

    this.createWorkspaceWidgetDragItem = (widget)=> this.metalDragon.createDragItem({
      group: WORKSPACE_WIDGETS,
      itemData: { widget },
      dragHandle: 'widget-title',
      targetZone: { top: 0, left: 0, height: 10, width: 25 },
      getDragImageSourceNode: function(element, event) {
        var selectedWidgets = document.createElement('div');
        selectedWidgets.classList.add('drag-cursor');
        var widgetRow = element.parentElement;

        // TODO: fix this need to manually add the class to the drag cursor nodes
        if (!isMultiSelectEvent(event)) {
          var clone = widgetRow.cloneNode(true);
          clone.classList.add('is-selected');
          selectedWidgets.appendChild(clone);
        }
        else {
          while (widgetRow) {
            var clone = widgetRow.cloneNode(true);
            clone.classList.add('is-selected');
            selectedWidgets.appendChild(clone);
            widgetRow = widgetRow.nextSibling;
          }
        }
        return selectedWidgets;
      },
      onDragInit: function(event) {
        self.selectWidgets({ widget, isMultiSelect: isMultiSelectEvent(event) });
        this.setDragData('widgets', self.selectionDetails().widgets);
      }
    });

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

    this.toolboxDropzone = this.createTrashcanDropzone();

    this.onunload = ()=> {
      this.toolboxDropzone.destroy();
    };
  },

  view: function(controller) {
    var workspace = controller.workspace;
    window.workspace = workspace;
    var widgets = workspace.getWidgets();
    var md = controller.metalDragon;

    var selectedWidget = md.activeDragItem && md.activeDragItem.getItemData('widget', null);
    var isLastWorkspaceWidgetDraggingOverBottomOfWorkspace = (
      !!selectedWidget && selectedWidget === workspace.getWidgets().slice(-1).pop() &&
      md.isTargetingDropzoneGroup('bottom-of-workspace')
    );
    var doesTargetDropzoneDisplaceWidget = md.hasTargetDropzone() &&
      !isLastWorkspaceWidgetDraggingOverBottomOfWorkspace;

    var widgetEditorClassList = [
      md.isMidDrag() ? '.is-dragging' : '',
      doesTargetDropzoneDisplaceWidget ? '.will-target-dropzone-displace-widget' : ''
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

      m(WorkspaceComponent, {
        workspace,
        metalDragon: controller.metalDragon,
        createDragItem: controller.createWorkspaceWidgetDragItem,
        createTrashcanDropzone: controller.createTrashcanDropzone,
        selectWidgets: controller.selectWidgets,
        selectionDetails: controller.selectionDetails
      })
    ]);
  }
};

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

window.globals = (window.globals || {});
window.globals.Widget = Widget;

function isMultiSelectEvent(event) {
  return !!event.shiftKey;
}